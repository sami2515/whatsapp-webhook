import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from '@ffmpeg-installer/ffmpeg';
import webpush from 'web-push';
import Message from '../models/Message.js';
import Subscription from '../models/Subscription.js';
import UserContext from '../models/UserContext.js';
import { generateAIResponse } from '../services/geminiService.js';
import { BOT_CONFIG } from '../utils/botConfig.js';
import {
    buildLeadSummary,
    calculateLeadScore,
    detectIntent,
    getPausedSafeAssistantResponse,
    getRuleBasedAssistantResponse,
    getStageForLead,
    inferLeadUpdateFromIntent,
    inferLeadUpdateFromMessage,
    parseWebsiteLeadMessage,
    sanitizeAssistantReply
} from '../utils/assistantLogic.js';

ffmpeg.setFfmpegPath(ffmpegPath.path);

let webpushConfigured = false;
let webpushDisabled = false;
let webpushWarningLogged = false;
let webpushDisabledReason = '';
const loggedPushEndpointFailures = new Set();
const loggedMediaFetchFailures = new Set();
const SUPPORTED_MEDIA_MESSAGE_TYPES = ['audio', 'voice', 'image', 'video', 'document'];

const disableWebPush = (reason = 'invalid_vapid_keys') => {
    webpushConfigured = false;
    webpushDisabled = true;
    webpushDisabledReason = reason;

    if (!webpushWarningLogged) {
        const message = reason === 'missing_vapid_keys'
            ? 'Push notifications disabled: missing VAPID keys'
            : 'Push notifications disabled: invalid VAPID keys';
        console.warn(message);
        webpushWarningLogged = true;
    }
};

const decodeBase64Url = (value = '') => {
    const normalized = `${value}${'='.repeat((4 - value.length % 4) % 4)}`
        .replace(/-/g, '+')
        .replace(/_/g, '/');
    return Buffer.from(normalized, 'base64');
};

const getVapidKeyStatus = () => {
    if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
        return { enabled: false, reason: 'missing_vapid_keys' };
    }

    try {
        const publicKey = decodeBase64Url(process.env.VAPID_PUBLIC_KEY);
        const privateKey = decodeBase64Url(process.env.VAPID_PRIVATE_KEY);
        const valid = publicKey.length === 65 && publicKey[0] === 4 && privateKey.length === 32;
        return { enabled: valid, reason: valid ? 'valid' : 'invalid_vapid_keys' };
    } catch {
        return { enabled: false, reason: 'invalid_vapid_keys' };
    }
};

const configureWebPush = () => {
    if (webpushConfigured) return true;
    if (webpushDisabled) return false;

    const keyStatus = getVapidKeyStatus();
    if (!keyStatus.enabled) {
        disableWebPush(keyStatus.reason);
        return false;
    }

    try {
        webpush.setVapidDetails(
            process.env.VAPID_SUBJECT || 'mailto:admin@example.com',
            process.env.VAPID_PUBLIC_KEY,
            process.env.VAPID_PRIVATE_KEY
        );
        webpushConfigured = true;
        return true;
    } catch {
        disableWebPush('invalid_vapid_keys');
        return false;
    }
};

const isInvalidVapidError = (error) => {
    const message = [
        error?.message,
        error?.body,
        error?.response?.body,
        error
    ].map((value) => String(value || '').toLowerCase()).join(' ');

    return message.includes('vapid') ||
        message.includes('p-256') ||
        message.includes('curve') ||
        message.includes('applicationserverkey') ||
        message.includes('application server key') ||
        message.includes('permission denied');
};

const RAPID_REPLY_WINDOW_MS = 2500;
const CUSTOMER_SERVICE_WINDOW_MS = 24 * 60 * 60 * 1000;
const LEAD_UPDATE_FIELDS = ['name', 'business', 'serviceType', 'budget', 'timeline', 'projectDetails'];

const shouldUseValue = (value) => {
    return typeof value === 'string' ? value.trim().length > 0 : Boolean(value);
};

const applyLeadUpdate = (userContext, leadUpdate = {}) => {
    for (const field of LEAD_UPDATE_FIELDS) {
        if (shouldUseValue(leadUpdate[field])) {
            const nextValue = String(leadUpdate[field]).trim();

            if (field === 'projectDetails' && userContext.projectDetails) {
                if (!userContext.projectDetails.toLowerCase().includes(nextValue.toLowerCase())) {
                    userContext.projectDetails = `${userContext.projectDetails} | ${nextValue}`;
                }
                continue;
            }

            userContext[field] = nextValue;
        }
    }
};

const CONTEXT_UPDATE_FIELDS = [
    'unclearCount',
    'personalQuestionCount',
    'offTopicCount',
    'abuseCount',
    'leadScore',
    'lastClarificationAt',
    'lastBotQuestionType',
    'cameFromBuildPlan',
    'buildPlanFormSubmitted'
];

const applyContextUpdate = (userContext, contextUpdate = {}) => {
    for (const field of CONTEXT_UPDATE_FIELDS) {
        if (Object.prototype.hasOwnProperty.call(contextUpdate, field)) {
            userContext[field] = contextUpdate[field];
        }
    }

    if (['clarification', 'unclear', 'off_topic', 'repeat_confusion'].includes(contextUpdate.lastBotQuestionType)) {
        userContext.lastClarificationAt = new Date();
    }
};

const getLeadSnapshot = (userContext) => ({
    phone: userContext.phone || userContext.phoneNumber,
    name: userContext.name,
    business: userContext.business,
    serviceType: userContext.serviceType,
    budget: userContext.budget,
    timeline: userContext.timeline,
    projectDetails: userContext.projectDetails,
    requirementSummary: userContext.requirementSummary,
    conversationSummary: userContext.conversationSummary,
    intent: userContext.intent,
    stage: userContext.stage,
    status: userContext.status,
    aiPaused: userContext.aiPaused || userContext.isAIPaused,
    isAIPaused: userContext.isAIPaused,
    handoffReason: userContext.handoffReason,
    unclearCount: userContext.unclearCount || 0,
    personalQuestionCount: userContext.personalQuestionCount || 0,
    offTopicCount: userContext.offTopicCount || 0,
    abuseCount: userContext.abuseCount || 0,
    leadScore: userContext.leadScore || 0,
    lastClarificationAt: userContext.lastClarificationAt,
    lastBotQuestionType: userContext.lastBotQuestionType || '',
    cameFromBuildPlan: userContext.cameFromBuildPlan || false,
    buildPlanFormSubmitted: userContext.buildPlanFormSubmitted || false
});

const refreshLeadSummary = (userContext, latestMessageText = '') => {
    userContext.leadScore = calculateLeadScore(getLeadSnapshot(userContext), latestMessageText);
    const summary = buildLeadSummary(getLeadSnapshot(userContext));
    userContext.requirementSummary = summary;
    userContext.conversationSummary = summary;
};

const pauseAIForLead = (userContext, reason = 'Lead needs Sami handoff') => {
    userContext.isAIPaused = true;
    userContext.aiPaused = true;
    userContext.aiPausedAt = new Date();
    userContext.stage = 'handed_off';
    userContext.status = 'needs_handoff';
    userContext.handoffReason = reason;
};

const resumeExpiredPause = (userContext) => {
    if (!userContext.isAIPaused || !userContext.aiPausedAt) return;
    if (['needs_handoff', 'manual_reply'].includes(userContext.status)) return;

    const hoursPassed = (new Date() - new Date(userContext.aiPausedAt)) / (1000 * 60 * 60);
    if (hoursPassed >= 12) {
        userContext.isAIPaused = false;
        userContext.aiPaused = false;
        userContext.aiPausedAt = null;
        userContext.status = 'open';
    }
};

const isWithinCustomerServiceWindow = (userContext) => {
    if (!userContext?.lastMessageAt) return false;
    return Date.now() - new Date(userContext.lastMessageAt).getTime() <= CUSTOMER_SERVICE_WINDOW_MS;
};

const hasActiveCustomerServiceWindow = async (phoneNumber) => {
    const userContext = await UserContext.findOne({ phoneNumber });
    if (isWithinCustomerServiceWindow(userContext)) return true;

    const lastInbound = await Message.findOne({
        from: phoneNumber,
        status: { $in: ['received', 'read'] }
    }).sort({ timestamp: -1 });

    if (!lastInbound?.timestamp) return false;
    return Date.now() - new Date(lastInbound.timestamp).getTime() <= CUSTOMER_SERVICE_WINDOW_MS;
};

const sendWhatsAppText = async ({ phoneNumberId, to, text, token }) => {
    return axios.post(
        `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
        {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to,
            type: 'text',
            text: { body: text }
        },
        { headers: { Authorization: `Bearer ${token}` } }
    );
};

const sendAndSaveAssistantText = async ({ phoneNumberId, to, text, token }) => {
    const response = await sendWhatsAppText({ phoneNumberId, to, text, token });

    if (response.data?.messages && response.data.messages.length > 0) {
        await Message.create({
            from: phoneNumberId,
            to,
            messageId: response.data.messages[0].id,
            type: 'text',
            text,
            status: 'sent',
            timestamp: new Date()
        });
    }

    return response;
};

const markManualReply = async (phoneNumber) => {
    await UserContext.findOneAndUpdate(
        { phoneNumber },
        {
            phone: phoneNumber,
            isAIPaused: true,
            aiPaused: true,
            aiPausedAt: new Date(),
            stage: 'handed_off',
            status: 'manual_reply',
            handoffReason: 'Admin sent a manual reply'
        },
        { upsert: true }
    );
};

export const subscribeToPush = async (req, res) => {
    try {
        const subscription = req.body;
        if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
            return res.status(400).json({ error: 'Invalid push subscription.' });
        }

        await Subscription.findOneAndUpdate(
            { endpoint: subscription.endpoint },
            {
                endpoint: subscription.endpoint,
                expirationTime: subscription.expirationTime || null,
                keys: subscription.keys,
                userType: 'admin',
                userAgent: req.get('user-agent') || '',
                active: true
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        res.status(201).json({ success: true, message: 'Subscribed successfully.' });
    } catch (err) {
        console.error('Error saving subscription:', err);
        res.status(500).json({ error: 'Failed to subscribe.' });
    }
};

export const unsubscribeFromPush = async (req, res) => {
    try {
        const { endpoint } = req.body || {};
        if (!endpoint) return res.status(400).json({ error: 'Subscription endpoint is required.' });

        await Subscription.findOneAndUpdate(
            { endpoint },
            { active: false },
            { new: true }
        );

        res.status(200).json({ success: true });
    } catch (err) {
        console.error('Error unsubscribing push subscription:', err);
        res.status(500).json({ error: 'Failed to unsubscribe.' });
    }
};

export const getPushPublicKey = (req, res) => {
    const keyStatus = webpushDisabled
        ? { enabled: false, reason: webpushDisabledReason || 'invalid_vapid_keys' }
        : getVapidKeyStatus();
    const enabled = keyStatus.enabled && configureWebPush();
    const reason = enabled
        ? 'valid'
        : (webpushDisabledReason || keyStatus.reason || 'invalid_vapid_keys');

    res.status(200).json({
        enabled,
        reason,
        publicKey: enabled ? process.env.VAPID_PUBLIC_KEY : '',
        subject: process.env.VAPID_SUBJECT || 'mailto:admin@example.com'
    });
};

const markSubscriptionInactive = async (subscription) => {
    await Subscription.findOneAndUpdate(
        { endpoint: subscription.endpoint },
        { active: false }
    );
};

const markMediaUnavailable = async (mediaId, reason = 'media_unavailable') => {
    if (!mediaId) return;

    await Message.updateMany(
        { mediaId },
        {
            type: 'media_unavailable',
            text: '[Media unavailable]',
            status: 'failed'
        }
    );

    if (!loggedMediaFetchFailures.has(mediaId)) {
        loggedMediaFetchFailures.add(mediaId);
        console.warn(`Media unavailable (${reason}): ${mediaId}`);
    }
};

const logPushEndpointFailureOnce = (subscription, message) => {
    const key = subscription.endpoint || message;
    if (loggedPushEndpointFailures.has(key)) return;
    loggedPushEndpointFailures.add(key);
    console.warn(message);
};

export const deleteInactivePushSubscriptions = async (req, res) => {
    try {
        const result = await Subscription.deleteMany({ active: false });
        res.status(200).json({ success: true, deletedCount: result.deletedCount || 0 });
    } catch (err) {
        console.error('Error deleting inactive push subscriptions:', err);
        res.status(500).json({ error: 'Failed to delete inactive subscriptions.' });
    }
};

const notifyAdminsOfIncomingMessage = async ({ phone, text, messageType, timestamp }) => {
    if (!configureWebPush()) return;

    const bodyText = text || `[${messageType || 'message'}]`;
    const pushPayload = JSON.stringify({
        title: 'New WhatsApp message',
        body: `+${phone}: ${bodyText}`,
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        data: {
            url: '/',
            phone,
            timestamp
        }
    });

    try {
        const subscriptions = await Subscription.find({ active: { $ne: false } });

        await Promise.all(subscriptions.map(async (sub) => {
            try {
                await webpush.sendNotification({
                    endpoint: sub.endpoint,
                    keys: sub.keys
                }, pushPayload);
            } catch (err) {
                const statusCode = err.statusCode || err.response?.statusCode || err.response?.status;

                if (statusCode === 404 || statusCode === 410) {
                    await markSubscriptionInactive(sub);
                    return;
                }

                if (statusCode === 403 && isInvalidVapidError(err)) {
                    disableWebPush('invalid_vapid_keys');
                    return;
                }

                if (statusCode === 403) {
                    await markSubscriptionInactive(sub);
                    logPushEndpointFailureOnce(sub, `Push subscription disabled after 403 response: ${sub.endpoint}`);
                    return;
                }

                if (statusCode === 400 || statusCode === 401) {
                    await markSubscriptionInactive(sub);
                    logPushEndpointFailureOnce(sub, `Push subscription disabled after ${statusCode} response: ${sub.endpoint}`);
                    return;
                }

                logPushEndpointFailureOnce(sub, `Push notification failed for ${sub.endpoint}: ${err.message || 'unexpected response'}`);
            }
        }));
    } catch (err) {
        if (isInvalidVapidError(err)) {
            disableWebPush('invalid_vapid_keys');
            return;
        }
        console.error('Failed to send push notifications:', err.message || err);
    }
};

// Verify Webhook for Meta API setup 
export const verifyWebhook = (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode && token) {
        if (mode === 'subscribe' && token === process.env.WEBHOOK_VERIFY_TOKEN) {
            console.log('WEBHOOK_VERIFIED');
            res.status(200).send(challenge);
        } else {
            res.sendStatus(403);
        }
    } else {
        res.sendStatus(400);
    }
};

// Handle Incoming Webhook Events (Messages, Status Updates)
export const handleIncomingMessage = async (req, res) => {
    try {
        const { body } = req;

        if (body.object) {
            if (
                body.entry &&
                body.entry[0].changes &&
                body.entry[0].changes[0] &&
                body.entry[0].changes[0].value.messages &&
                body.entry[0].changes[0].value.messages[0]
            ) {
                const messageObj = body.entry[0].changes[0].value.messages[0];
                const phoneNumberId = body.entry[0].changes[0].value.metadata.phone_number_id;
                const from = messageObj.from;
                const messageId = messageObj.id;
                const msgType = messageObj.type || 'text';

                let msgBody = '';
                let mediaId = null;
                let isInteractive = false;
                let interactiveId = null;
                let contextMessageId = null;

                if (messageObj.context && messageObj.context.id) {
                    contextMessageId = messageObj.context.id;
                }

                if (msgType === 'text') {
                    msgBody = messageObj.text?.body || '';
                } else if (msgType === 'audio' || msgType === 'voice') {
                    mediaId = messageObj.audio?.id || messageObj.voice?.id;
                } else if (msgType === 'image') {
                    mediaId = messageObj.image?.id;
                } else if (msgType === 'video') {
                    mediaId = messageObj.video?.id;
                } else if (msgType === 'document') {
                    mediaId = messageObj.document?.id;
                } else if (msgType === 'interactive') {
                    isInteractive = true;
                    // Extract list_reply
                    interactiveId = messageObj.interactive?.list_reply?.id;
                    msgBody = messageObj.interactive?.list_reply?.title || messageObj.interactive?.button_reply?.title || '[Interactive Reply]';
                } else {
                    msgBody = `[Unsupported message type: ${msgType}]`;
                }

                console.log(`Received ${msgType} message from ${from}`);

                if (messageId && await Message.exists({ messageId })) {
                    console.log(`Duplicate WhatsApp message ignored: ${messageId}`);
                    return res.sendStatus(200);
                }

                // Save incoming message to MongoDB
                const savedMessage = await Message.create({
                    from,
                    to: phoneNumberId,
                    text: msgBody,
                    type: msgType,
                    mediaId,
                    messageId,
                    status: 'received',
                    contextMessageId: contextMessageId
                });

                void notifyAdminsOfIncomingMessage({
                    phone: from,
                    text: msgBody,
                    messageType: msgType,
                    timestamp: savedMessage.timestamp
                });

                const parsedLead = parseWebsiteLeadMessage(msgBody);
                const incomingIntent = Object.keys(parsedLead).length > 0 ? 'new_project' : detectIntent(msgBody);
                const inferredLeadUpdate = {
                    ...inferLeadUpdateFromIntent(incomingIntent),
                    ...inferLeadUpdateFromMessage(msgBody),
                    ...parsedLead
                };

                let userContext = await UserContext.findOne({ phoneNumber: from });
                const previousLastMessageAt = userContext?.lastMessageAt;

                if (!userContext) {
                    userContext = await UserContext.create({
                        phoneNumber: from,
                        phone: from
                    });
                }

                resumeExpiredPause(userContext);
                userContext.phone = userContext.phone || from;
                userContext.lastInteraction = new Date();
                userContext.lastMessageAt = new Date();
                userContext.intent = incomingIntent;
                applyLeadUpdate(userContext, inferredLeadUpdate);
                if (Object.keys(parsedLead).length > 0) {
                    userContext.cameFromBuildPlan = true;
                    userContext.buildPlanFormSubmitted = true;
                    userContext.unclearCount = 0;
                    userContext.offTopicCount = 0;
                }
                userContext.stage = getStageForLead(getLeadSnapshot(userContext), incomingIntent);
                refreshLeadSummary(userContext, msgBody);
                await userContext.save();

                const isRapidMessage = previousLastMessageAt &&
                    (Date.now() - new Date(previousLastMessageAt).getTime()) < RAPID_REPLY_WINDOW_MS;

                // Auto Responder Logic (if Bot is enabled)
                if (BOT_CONFIG.ENABLED) {
                    const token = process.env.WHATSAPP_TOKEN;

                    if (isInteractive && interactiveId) {
                        let textReply = "";
                        let markUrgent = false;

                        // Handle List Menu Button clicks
                        if (interactiveId === "btn_social") {
                            textReply = BOT_CONFIG.SOCIAL_LINKS;
                        } else if (interactiveId === "btn_leave_msg") {
                            textReply = BOT_CONFIG.LEAVE_MESSAGE_PROMPT;
                        } else if (interactiveId === "btn_urgent") {
                            textReply = BOT_CONFIG.URGENT_MESSAGE_ACK;
                            markUrgent = true;
                        }

                        if (textReply) {
                            const sentReply = await sendWhatsAppText({ phoneNumberId, to: from, text: textReply, token });
                            if (sentReply.data?.messages?.length > 0) {
                                await Message.create({
                                    from: phoneNumberId,
                                    to: from,
                                    messageId: sentReply.data.messages[0].id,
                                    type: 'text',
                                    text: textReply,
                                    status: 'sent',
                                    timestamp: new Date()
                                });
                            }
                        }

                        if (markUrgent) {
                            // Pause AI for this user so Sami can handle it manually
                            pauseAIForLead(userContext, 'User selected talk to Sami / urgent handoff');
                            refreshLeadSummary(userContext);
                            await userContext.save();

                            // Update the just saved incoming message to be marked urgent for the UI
                            savedMessage.text = `[URGENT] ${savedMessage.text}`;
                            await savedMessage.save();
                        }
                    } else if (!isInteractive && (msgType === 'text' || msgType === 'image')) {
                        const isAIPaused = userContext.isAIPaused || userContext.aiPaused;

                        if (isAIPaused && msgType === 'text') {
                            const pausedReply = getPausedSafeAssistantResponse({
                                messageText: msgBody,
                                intent: incomingIntent
                            });

                            if (pausedReply?.reply) {
                                userContext.intent = pausedReply.intent || incomingIntent;
                                refreshLeadSummary(userContext, msgBody);
                                await userContext.save();
                                await sendAndSaveAssistantText({
                                    phoneNumberId,
                                    to: from,
                                    text: sanitizeAssistantReply(pausedReply.reply),
                                    token
                                });
                            }
                        } else if (!isAIPaused && !isRapidMessage) {

                            // 1. Fetch Chat History (Memory) - Exclude current message
                            const recentContext = await Message.find({
                                $or: [{ from: from }, { to: from }],
                                type: 'text',
                                messageId: { $ne: messageId }
                            }).sort({ _id: -1 }).limit(10);

                            const history = recentContext.reverse().map(msg => ({
                                role: msg.from === from ? 'user' : 'assistant',
                                content: msg.text || "Message"
                            }));

                            // 2. Fetch Image Buffer (Vision)
                            let base64Image = null;
                            if (msgType === 'image' && mediaId) {
                                try {
                                    const mediaRes = await axios.get(`https://graph.facebook.com/v21.0/${mediaId}`, {
                                        headers: { Authorization: `Bearer ${token}` }
                                    });
                                    const mediaUrl = mediaRes.data.url;

                                    const imageRes = await axios.get(mediaUrl, {
                                        headers: { Authorization: `Bearer ${token}` },
                                        responseType: 'arraybuffer'
                                    });

                                    base64Image = Buffer.from(imageRes.data, 'binary').toString('base64');
                                    if (!msgBody) msgBody = "Please review this image and assist me.";
                                } catch (err) {
                                    if (err.response?.status === 400) {
                                        await markMediaUnavailable(mediaId, 'meta_400');
                                    } else {
                                        console.warn(`Image unavailable for Gemini (${mediaId}): ${err.message}`);
                                    }
                                }
                            }

                            const ruleReply = msgType === 'text'
                                ? getRuleBasedAssistantResponse({
                                    messageText: msgBody,
                                    intent: incomingIntent,
                                    lead: getLeadSnapshot(userContext),
                                    parsedLead
                                })
                                : null;

                            const aiResult = ruleReply || await generateAIResponse(
                                msgBody,
                                BOT_CONFIG.LIVE_STATUS,
                                history,
                                base64Image,
                                {
                                    detectedIntent: incomingIntent,
                                    lead: getLeadSnapshot(userContext),
                                    conversationSummary: userContext.conversationSummary
                                }
                            );

                            applyLeadUpdate(userContext, aiResult.leadUpdate || {});
                            applyContextUpdate(userContext, aiResult.contextUpdate || {});
                            userContext.intent = aiResult.intent || incomingIntent;
                            userContext.stage = aiResult.stage || getStageForLead(getLeadSnapshot(userContext), userContext.intent);
                            if (typeof aiResult.leadScore === 'number') {
                                userContext.leadScore = aiResult.leadScore;
                            }

                            if (aiResult.pauseAI || /\[PAUSE\]/i.test(aiResult.reply || '')) {
                                pauseAIForLead(userContext, aiResult.handoffReason || 'Assistant requested handoff');
                            }

                            refreshLeadSummary(userContext, msgBody);
                            await userContext.save();

                            const aiReply = sanitizeAssistantReply(aiResult.reply || '')
                                || 'Assistant abhi temporarily busy hai. Aap apni requirement bhej dein, Sami ko forward kar diya jayega.';

                            await sendAndSaveAssistantText({ phoneNumberId, to: from, text: aiReply, token });
                        }
                    }
                }

            } else if (
                body.entry &&
                body.entry[0].changes &&
                body.entry[0].changes[0] &&
                body.entry[0].changes[0].value.statuses &&
                body.entry[0].changes[0].value.statuses[0]
            ) {
                // Handle message status updates (sent, delivered, read, failed)
                const statusObj = body.entry[0].changes[0].value.statuses[0];
                let updatePayload = { status: statusObj.status };

                if (statusObj.errors) {
                    const errorStr = JSON.stringify(statusObj.errors, null, 2);
                    console.error("Meta Asynchronous Delivery Error:", errorStr);
                    updatePayload.text = `[Delivery Error]: ${errorStr}`;
                }

                await Message.findOneAndUpdate(
                    { messageId: statusObj.id },
                    updatePayload
                );
                console.log(`Message ${statusObj.id} status updated to: ${statusObj.status}`);
            }
            res.sendStatus(200);
        } else {
            res.sendStatus(404);
        }
    } catch (error) {
        console.error('Error handling webhook:', error.message);
        res.sendStatus(500);
    }
};

// Send a WhatsApp Message from the backend to the user
export const sendWhatsAppMessage = async (req, res) => {
    try {
        const { to, type = 'template', templateName = 'hello_world', textBody, contextMessageId } = req.body;

        if (!to) {
            return res.status(400).json({ error: 'Phone number (to) is required.' });
        }

        const token = process.env.WHATSAPP_TOKEN;
        const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
        const freeFormTypes = ['text', 'audio', 'image', 'video', 'document'];

        if (freeFormTypes.includes(type)) {
            if (!await hasActiveCustomerServiceWindow(to)) {
                return res.status(400).json({
                    error: 'Free-form WhatsApp replies are only allowed inside the 24-hour customer service window.'
                });
            }
        }

        let payload = {
            messaging_product: 'whatsapp',
            to: to,
            type: type,
        };

        if (contextMessageId) {
            payload.context = {
                message_id: contextMessageId
            };
        }

        if (type === 'template') {
            payload.template = {
                name: templateName,
                language: { code: 'en_US' }
            };
        } else if (type === 'text') {
            payload.text = { body: textBody };
        } else if (type === 'audio') {
            payload.audio = { id: req.body.mediaId };
        }

        const response = await axios.post(
            `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
            payload,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        // Save outgoing message locally to MongoDB
        if (response.data?.messages && response.data.messages.length > 0) {

            // Auto-pause AI when Admin sends a manual message
            if (type === 'text' || type === 'audio' || type === 'image' || type === 'video' || type === 'document') {
                await markManualReply(to);
            }

            let templateString = '';
            if (type === 'template') {
                templateString = templateName === 'hello_world'
                    ? "Hello World\n\nWelcome and congratulations!! This message demonstrates your ability to send a WhatsApp message notification from the Cloud API, hosted by Meta. Thank you for taking the time to test with us."
                    : `[Template: ${templateName}]`;
            }

            await Message.create({
                from: phoneNumberId,
                to,
                messageId: response.data.messages[0].id,
                type: type,
                text: type === 'text' ? textBody : templateString,
                mediaId: type === 'audio' ? req.body.mediaId : undefined,
                status: 'sent',
                contextMessageId: contextMessageId
            });
        }

        res.status(200).json({ success: true, response: response.data });

    } catch (error) {
        console.error('Error sending message:', error.response?.data || error.message);
        res.status(error.response?.status || 500).json({ error: error.response?.data || error.message });
    }
};

// Fetch list of unique conversations
export const getConversations = async (req, res) => {
    try {
        const conversations = await Message.aggregate([
            {
                $sort: { timestamp: -1 }
            },
            {
                $group: {
                    _id: {
                        $cond: [
                            { $eq: ["$from", process.env.WHATSAPP_PHONE_NUMBER_ID] },
                            "$to",
                            "$from"
                        ]
                    },
                    lastMessage: { $first: "$text" },
                    lastMessageStatus: { $first: "$status" },
                    lastMessageFrom: { $first: "$from" },
                    timestamp: { $first: "$timestamp" },
                    unreadCount: {
                        $sum: {
                            $cond: [{ $eq: ["$status", "received"] }, 1, 0]
                        }
                    }
                }
            },
            { $sort: { timestamp: -1 } }
        ]);

        const phoneNumbers = conversations.map((conversation) => conversation._id);
        const leadContexts = await UserContext.find({ phoneNumber: { $in: phoneNumbers } }).lean();
        const leadByPhone = new Map(leadContexts.map((lead) => [lead.phoneNumber, lead]));

        const conversationsWithLeads = conversations.map((conversation) => {
            const lead = leadByPhone.get(conversation._id);
            return {
                ...conversation,
                lead: lead ? {
                    name: lead.name,
                    business: lead.business,
                    serviceType: lead.serviceType,
                    budget: lead.budget,
                    timeline: lead.timeline,
                    projectDetails: lead.projectDetails,
                    requirementSummary: lead.requirementSummary,
                    intent: lead.intent,
                    stage: lead.stage,
                    status: lead.status,
                    aiPaused: lead.aiPaused || lead.isAIPaused,
                    handoffReason: lead.handoffReason,
                    leadScore: lead.leadScore,
                    unclearCount: lead.unclearCount,
                    personalQuestionCount: lead.personalQuestionCount,
                    offTopicCount: lead.offTopicCount
                } : null
            };
        });

        res.status(200).json(conversationsWithLeads);
    } catch (error) {
        console.error('Error fetching conversations:', error);
        res.status(500).json({ error: 'Failed to fetch conversations' });
    }
};

// Fetch full chat history for a specific phone number
export const getChatHistory = async (req, res) => {
    try {
        const { phoneNumber } = req.params;
        const myNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

        const messages = await Message.find({
            $or: [
                { from: phoneNumber, to: myNumberId },
                { from: myNumberId, to: phoneNumber }
            ]
        }).sort({ timestamp: 1 });

        // Mark received messages as read in our local DB when viewed
        await Message.updateMany(
            { from: phoneNumber, to: myNumberId, status: 'received' },
            { status: 'read' }
        );

        res.status(200).json(messages);
    } catch (error) {
        console.error('Error fetching chat history:', error);
        res.status(500).json({ error: 'Failed to fetch chat history' });
    }
};

// Fetch media from Meta API and stream it to frontend
export const getMedia = async (req, res) => {
    try {
        const { mediaId } = req.params;
        const token = process.env.WHATSAPP_TOKEN;

        if (!mediaId) {
            return res.status(400).json({ error: 'Media ID is required.' });
        }

        const mediaMessage = await Message.findOne({ mediaId }).sort({ timestamp: -1 });
        if (!mediaMessage || !SUPPORTED_MEDIA_MESSAGE_TYPES.includes(mediaMessage.type)) {
            return res.status(404).json({ error: 'Media not available.' });
        }

        // 1. Get Media URL
        const mediaResponse = await axios.get(
            `https://graph.facebook.com/v21.0/${mediaId}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        if (!mediaResponse.data || !mediaResponse.data.url) {
            return res.status(404).json({ error: 'Media URL not found' });
        }

        const audioUrl = mediaResponse.data.url;
        const mimeType = mediaResponse.data.mime_type;

        // 2. Download Media and pipe to response
        const audioStreamResponse = await axios.get(audioUrl, {
            headers: {
                Authorization: `Bearer ${token}`
            },
            responseType: 'stream'
        });

        res.setHeader('Content-Type', mimeType);
        audioStreamResponse.data.pipe(res);

    } catch (error) {
        const { mediaId } = req.params;
        if (error.response?.status === 400) {
            await markMediaUnavailable(mediaId, 'meta_400');
            return res.status(404).json({ error: 'Media unavailable.' });
        }

        if (!loggedMediaFetchFailures.has(mediaId)) {
            loggedMediaFetchFailures.add(mediaId);
            console.warn(`Media fetch failed (${mediaId}): ${error.message}`);
        }
        res.status(500).json({ error: 'Failed to fetch media' });
    }
};

// Upload audio to Meta and send it
export const uploadAndSendAudio = async (req, res) => {
    try {
        const { to } = req.body;
        const file = req.file;

        if (!to || !file) {
            return res.status(400).json({ error: 'Phone number and audio file are required.' });
        }

        const token = process.env.WHATSAPP_TOKEN;
        const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

        if (!await hasActiveCustomerServiceWindow(to)) {
            if (file && fs.existsSync(file.path)) {
                fs.unlinkSync(file.path);
            }
            return res.status(400).json({
                error: 'Free-form WhatsApp replies are only allowed inside the 24-hour customer service window.'
            });
        }

        // 1. Transcode Media to OGG Opus (Meta API Requirement)
        const outputPath = `${file.path}.ogg`;

        await new Promise((resolve, reject) => {
            ffmpeg(file.path)
                .toFormat('ogg')
                .audioCodec('libopus')
                .on('end', () => resolve())
                .on('error', (err) => {
                    console.error('FFmpeg transcoding error:', err);
                    reject(err);
                })
                .save(outputPath);
        });

        // 2. Upload Media
        const formData = new FormData();
        const fileBuffer = fs.readFileSync(outputPath);
        formData.append('file', fileBuffer, {
            filename: 'audio.ogg',
            contentType: 'audio/ogg',
            knownLength: fileBuffer.length
        });
        formData.append('type', 'audio'); // Meta expects strictly 'audio'
        formData.append('messaging_product', 'whatsapp');

        const uploadResponse = await axios.post(
            `https://graph.facebook.com/v21.0/${phoneNumberId}/media`,
            formData,
            {
                headers: {
                    ...formData.getHeaders(),
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const mediaId = uploadResponse.data.id;

        // Clean up uploaded and transcoded files
        fs.unlinkSync(file.path);
        fs.unlinkSync(outputPath);

        // 2. Send Media
        const payload = {
            messaging_product: 'whatsapp',
            to: to,
            type: 'audio',
            audio: {
                id: mediaId
            }
        };

        const response = await axios.post(
            `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
            payload,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (response.data?.messages && response.data.messages.length > 0) {
            await Message.create({
                from: phoneNumberId,
                to,
                messageId: response.data.messages[0].id,
                type: 'audio',
                mediaId: mediaId,
                status: 'sent'
            });
            await markManualReply(to);
        }

        res.status(200).json({ success: true, response: response.data });
    } catch (error) {
        console.error('Error uploading/sending audio:', error.response?.data || error.message);
        const metaError = error.response?.data?.error?.message || error.response?.data?.error?.error_user_msg || error.message;

        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(error.response?.status || 500).json({ error: metaError });
    }
};

// Upload image to Meta and send it
export const uploadAndSendImage = async (req, res) => {
    try {
        const { to } = req.body;
        const file = req.file;

        if (!to || !file) {
            return res.status(400).json({ error: 'Phone number and image file are required.' });
        }

        const token = process.env.WHATSAPP_TOKEN;
        const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

        if (!await hasActiveCustomerServiceWindow(to)) {
            if (file && fs.existsSync(file.path)) {
                fs.unlinkSync(file.path);
            }
            return res.status(400).json({
                error: 'Free-form WhatsApp replies are only allowed inside the 24-hour customer service window.'
            });
        }

        // 1. Upload Media
        const formData = new FormData();
        const fileBuffer = fs.readFileSync(file.path);
        formData.append('file', fileBuffer, {
            filename: file.originalname,
            contentType: file.mimetype,
            knownLength: fileBuffer.length
        });
        formData.append('type', 'image');
        formData.append('messaging_product', 'whatsapp');

        const uploadResponse = await axios.post(
            `https://graph.facebook.com/v21.0/${phoneNumberId}/media`,
            formData,
            {
                headers: {
                    ...formData.getHeaders(),
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const mediaId = uploadResponse.data.id;

        // Clean up uploaded file
        fs.unlinkSync(file.path);

        // 2. Send Media
        const payload = {
            messaging_product: 'whatsapp',
            to: to,
            type: 'image',
            image: {
                id: mediaId
            }
        };

        const response = await axios.post(
            `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
            payload,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (response.data?.messages && response.data.messages.length > 0) {
            await Message.create({
                from: phoneNumberId,
                to,
                messageId: response.data.messages[0].id,
                type: 'image',
                mediaId: mediaId,
                status: 'sent'
            });
            await markManualReply(to);
        }

        res.status(200).json({ success: true, response: response.data });
    } catch (error) {
        console.error('Error uploading/sending image:', error.response?.data || error.message);
        const metaError = error.response?.data?.error?.message || error.response?.data?.error?.error_user_msg || error.message;

        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(error.response?.status || 500).json({ error: metaError });
    }
};

// Admin UI: Get current bot settings
export const getBotSettings = (req, res) => {
    res.status(200).json({
        enabled: BOT_CONFIG.ENABLED,
        liveStatus: BOT_CONFIG.LIVE_STATUS
    });
};

// Admin UI: Update bot settings
export const updateBotSettings = (req, res) => {
    const { enabled, liveStatus } = req.body;

    if (typeof enabled === 'boolean') {
        BOT_CONFIG.ENABLED = enabled;
    }
    if (liveStatus) {
        BOT_CONFIG.LIVE_STATUS = liveStatus;
    }

    res.status(200).json({
        success: true,
        message: 'Bot settings updated',
        settings: {
            enabled: BOT_CONFIG.ENABLED,
            liveStatus: BOT_CONFIG.LIVE_STATUS
        }
    });
};

const formatLeadContextResponse = (userContext) => ({
    phoneNumber: userContext.phoneNumber,
    phone: userContext.phone || userContext.phoneNumber,
    name: userContext.name,
    business: userContext.business,
    serviceType: userContext.serviceType,
    budget: userContext.budget,
    timeline: userContext.timeline,
    projectDetails: userContext.projectDetails,
    requirementSummary: userContext.requirementSummary,
    conversationSummary: userContext.conversationSummary,
    intent: userContext.intent,
    latestIntent: userContext.intent,
    stage: userContext.stage,
    status: userContext.status,
    aiPaused: userContext.aiPaused || userContext.isAIPaused,
    isAIPaused: userContext.isAIPaused,
    aiPausedAt: userContext.aiPausedAt,
    handoffReason: userContext.handoffReason,
    leadScore: userContext.leadScore,
    unclearCount: userContext.unclearCount,
    personalQuestionCount: userContext.personalQuestionCount,
    offTopicCount: userContext.offTopicCount,
    updatedAt: userContext.updatedAt
});

export const getUserContextForConversation = async (req, res) => {
    try {
        const phoneNumber = req.params.phone || req.params.phoneNumber;
        if (!phoneNumber) return res.status(400).json({ error: 'Phone number is required.' });

        const userContext = await UserContext.findOne({ phoneNumber });
        if (!userContext) return res.status(404).json({ error: 'Lead context not found.' });

        res.status(200).json({
            success: true,
            lead: formatLeadContextResponse(userContext)
        });
    } catch (error) {
        console.error('Error fetching user context:', error);
        res.status(500).json({ error: 'Failed to fetch user context.' });
    }
};

export const resumeAIForConversation = async (req, res) => {
    try {
        const phoneNumber = req.params.phone || req.params.phoneNumber;

        if (!phoneNumber) {
            return res.status(400).json({ error: 'Phone number is required.' });
        }

        const userContext = await UserContext.findOneAndUpdate(
            { phoneNumber },
            {
                isAIPaused: false,
                aiPaused: false,
                aiPausedAt: null,
                status: 'open',
                handoffReason: ''
            },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );

        userContext.phone = userContext.phone || phoneNumber;
        refreshLeadSummary(userContext);
        await userContext.save();

        res.status(200).json({
            success: true,
            lead: formatLeadContextResponse(userContext)
        });
    } catch (error) {
        console.error('Error resuming AI:', error);
        res.status(500).json({ error: 'Failed to resume AI.' });
    }
};

export const pauseAIForConversation = async (req, res) => {
    try {
        const phoneNumber = req.params.phone || req.params.phoneNumber;
        if (!phoneNumber) return res.status(400).json({ error: 'Phone number is required.' });

        const userContext = await UserContext.findOneAndUpdate(
            { phoneNumber },
            {
                phone: phoneNumber,
                isAIPaused: true,
                aiPaused: true,
                aiPausedAt: new Date(),
                status: 'needs_handoff',
                stage: 'handed_off',
                handoffReason: 'Manually paused by admin'
            },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );

        refreshLeadSummary(userContext);
        await userContext.save();

        res.status(200).json({
            success: true,
            lead: formatLeadContextResponse(userContext)
        });
    } catch (error) {
        console.error('Error pausing AI:', error);
        res.status(500).json({ error: 'Failed to pause AI.' });
    }
};

export const sendReaction = async (req, res) => {
    try {
        const { to, messageId, emoji } = req.body;
        if (!to || !messageId || !emoji) {
            return res.status(400).json({ error: 'Phone number, messageId, and emoji are required.' });
        }

        const token = process.env.WHATSAPP_TOKEN;
        const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

        if (!await hasActiveCustomerServiceWindow(to)) {
            return res.status(400).json({
                error: 'WhatsApp reactions are only allowed inside the 24-hour customer service window.'
            });
        }

        const payload = {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: to,
            type: 'reaction',
            reaction: {
                message_id: messageId,
                emoji: emoji
            }
        };

        await axios.post(
            `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
            payload,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        // Save a dummy record to render locally that we reacted
        await Message.create({
            from: phoneNumberId,
            to: to,
            text: emoji,
            type: 'reaction',
            messageId: Date.now().toString(),
            status: 'sent',
            contextMessageId: messageId
        });

        res.status(200).json({ success: true, message: 'Reaction sent successfully' });
    } catch (error) {
        console.error('Error sending reaction:', error.response?.data || error.message);
        res.status(500).json({ error: 'Failed to send WhatsApp reaction' });
    }
};

export const deleteMessage = async (req, res) => {
    try {
        const { messageId } = req.params;
        const deletedMsg = await Message.findOneAndDelete({ _id: messageId });

        if (!deletedMsg) {
            // Try Meta messageId if frontend didn't pass Mongo _id
            await Message.findOneAndDelete({ messageId: messageId });
        }

        res.status(200).json({ success: true, message: 'Message deleted locally' });
    } catch (error) {
        console.error('Error deleting message:', error);
        res.status(500).json({ error: 'Failed to delete message' });
    }
};
