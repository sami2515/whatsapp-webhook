import axios from 'axios';
import Message from '../models/Message.js';

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
                const phoneNumberId = body.entry[0].changes[0].value.metadata.phone_number_id;
                const from = body.entry[0].changes[0].value.messages[0].from;
                const msgBody = body.entry[0].changes[0].value.messages[0].text.body;
                const messageId = body.entry[0].changes[0].value.messages[0].id;

                console.log(`Received message from ${from}: ${msgBody}`);

                // Save incoming message to MongoDB
                await Message.create({
                    from,
                    to: phoneNumberId,
                    text: msgBody,
                    messageId,
                    status: 'received'
                });

            } else if (
                body.entry &&
                body.entry[0].changes &&
                body.entry[0].changes[0] &&
                body.entry[0].changes[0].value.statuses &&
                body.entry[0].changes[0].value.statuses[0]
            ) {
                // Handle message status updates (sent, delivered, read)
                const statusObj = body.entry[0].changes[0].value.statuses[0];
                await Message.findOneAndUpdate(
                    { messageId: statusObj.id },
                    { status: statusObj.status }
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
            await Message.create({
                from: phoneNumberId,
                to,
                messageId: response.data.messages[0].id,
                text: type === 'text' ? textBody : `[Template: ${templateName}]`,
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
