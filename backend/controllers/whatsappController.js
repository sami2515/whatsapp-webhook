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
import { BOT_CONFIG, buildInteractiveMenuPayload } from '../utils/botConfig.js';

ffmpeg.setFfmpegPath(ffmpegPath.path);

let webpushConfigured = false;
const configureWebPush = () => {
    if (!webpushConfigured && process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
        webpush.setVapidDetails(
            'mailto:admin@admin.com',
            process.env.VAPID_PUBLIC_KEY,
            process.env.VAPID_PRIVATE_KEY
        );
        webpushConfigured = true;
    }
};

export const subscribeToPush = async (req, res) => {
    try {
        const subscription = req.body;
        const sub = new Subscription({ ...subscription, endpoint: subscription.endpoint });
        await sub.save();
        res.status(201).json({ message: 'Subscribed successfully.' });
    } catch (err) {
        if (err.code === 11000) return res.status(200).json({ message: 'Already subscribed.' });
        console.error('Error saving subscription:', err);
        res.status(500).json({ error: 'Failed to subscribe.' });
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

                // Check if this is the first message from this user to trigger the Bot Menu
                const existingMsg = await Message.findOne({ from });
                const isFirstMessage = !existingMsg;

                // Save incoming message to MongoDB
                const savedMessage = await Message.create({
                    from,
                    to: phoneNumberId,
                    text: msgBody,
                    type: msgType,
                    mediaId,
                    messageId,
                    status: 'received'
                });

                // Notify all subscribed devices via Web Push
                try {
                    configureWebPush();
                    if (webpushConfigured) {
                        const pushPayload = JSON.stringify({
                            title: `WhatsApp: +${from}`,
                            body: msgBody,
                            icon: '/pwa-192x192.png',
                            data: {
                                url: '/' // We can add ?number=${from} later if UI supports direct routing
                            }
                        });
                        const subscriptions = await Subscription.find({});
                        for (let sub of subscriptions) {
                            try {
                                await webpush.sendNotification({
                                    endpoint: sub.endpoint,
                                    keys: sub.keys
                                }, pushPayload);
                            } catch (err) {
                                if (err.statusCode === 410 || err.statusCode === 404) {
                                    await Subscription.deleteOne({ endpoint: sub.endpoint });
                                } else {
                                    console.error('Push error:', err);
                                }
                            }
                        }
                    }
                } catch (pushErr) {
                    console.error('Failed to send push notifications:', pushErr);
                }

                // Auto Responder Logic (if Bot is enabled)
                if (BOT_CONFIG.ENABLED) {
                    const token = process.env.WHATSAPP_TOKEN;

                    // Fetch or Create User Context for AI state tracking
                    let userContext = await UserContext.findOne({ phoneNumber: from });
                    if (!userContext) {
                        userContext = await UserContext.create({ phoneNumber: from });
                    } else if (userContext.isAIPaused && userContext.aiPausedAt) {
                        // Check if 12 hours have passed since it was paused
                        const hoursPassed = (new Date() - new Date(userContext.aiPausedAt)) / (1000 * 60 * 60);
                        if (hoursPassed >= 12) {
                            userContext.isAIPaused = false;
                            userContext.aiPausedAt = null;
                            await userContext.save();
                        }
                    }

                    if (isFirstMessage && !isInteractive) {
                        // Send the main Welcome List Menu
                        const menuPayload = buildInteractiveMenuPayload(from);
                        await axios.post(
                            `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
                            menuPayload,
                            { headers: { Authorization: `Bearer ${token}` } }
                        );
                    } else if (isInteractive && interactiveId) {
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
                            await axios.post(
                                `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
                                { messaging_product: "whatsapp", recipient_type: "individual", to: from, type: "text", text: { body: textReply } },
                                { headers: { Authorization: `Bearer ${token}` } }
                            );
                        }

                        if (markUrgent) {
                            // Pause AI for this user so Sami can handle it manually
                            userContext.isAIPaused = true;
                            await userContext.save();

                            // Update the just saved incoming message to be marked urgent for the UI
                            savedMessage.text = `[URGENT 🚨] ${savedMessage.text}`;
                            await savedMessage.save();
                        }
                    } else if (!isInteractive && (msgType === 'text' || msgType === 'image')) {
                        // Forward regular text or image to Gemini AI if not paused
                        if (!userContext.isAIPaused) {

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
                                    console.error("Failed to fetch image for Gemini:", err.message);
                                }
                            }

                            let aiReply = await generateAIResponse(msgBody, BOT_CONFIG.LIVE_STATUS, history, base64Image);

                            // Check if AI explicitly requested an auto-handover
                            if (aiReply.includes('[PAUSE]')) {
                                userContext.isAIPaused = true;
                                userContext.aiPausedAt = new Date();
                                await userContext.save();
                                aiReply = aiReply.replace('[PAUSE]', '').trim();
                            }

                            // Send AI reply back to user
                            const aiRes = await axios.post(
                                `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
                                { messaging_product: "whatsapp", recipient_type: "individual", to: from, type: "text", text: { body: aiReply } },
                                { headers: { Authorization: `Bearer ${token}` } }
                            );

                            // Save AI outgoing message locally to MongoDB so it shows in Dashboard
                            if (aiRes.data?.messages && aiRes.data.messages.length > 0) {
                                await Message.create({
                                    from: phoneNumberId,
                                    to: from,
                                    messageId: aiRes.data.messages[0].id,
                                    type: 'text',
                                    text: aiReply,
                                    status: 'sent',
                                    timestamp: new Date()
                                });
                            }
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
        const { to, type = 'template', templateName = 'hello_world', textBody } = req.body;

        if (!to) {
            return res.status(400).json({ error: 'Phone number (to) is required.' });
        }

        const token = process.env.WHATSAPP_TOKEN;
        const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

        let payload = {
            messaging_product: 'whatsapp',
            to: to,
            type: type,
        };

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
                await UserContext.findOneAndUpdate(
                    { phoneNumber: to },
                    { isAIPaused: true, aiPausedAt: new Date() },
                    { upsert: true }
                );
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
                status: 'sent'
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

        res.status(200).json(conversations);
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
        console.error('Error fetching media:', error.message);
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

export const sendReaction = async (req, res) => {
    try {
        const { to, messageId, emoji } = req.body;
        if (!to || !messageId || !emoji) {
            return res.status(400).json({ error: 'Phone number, messageId, and emoji are required.' });
        }

        const token = process.env.WHATSAPP_TOKEN;
        const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

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

        // Save a dummy record to render locally that we reacted
        const newReactionMsg = await Message.create({
            from: phoneNumberId,
            to: to,
            text: emoji,
            type: 'reaction',
            messageId: Date.now().toString(),
            status: 'sent'
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
