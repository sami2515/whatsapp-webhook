import Message from '../models/Message.js';
import Contact from '../models/Contact.js';
import { uploadImageToCloudinary } from '../config/cloudinary.js';

// Helper to get socket.io instance attached to app
const getIO = (req) => req.app.get('io');

/**
 * Get all conversations grouped by contact / phone number
 */
export const getConversations = async (req, res) => {
    try {
        // Aggregate messages to find distinct chat partners and their latest message
        const partners = await Message.aggregate([
            {
                $project: {
                    chatPartner: {
                        $cond: {
                            if: { $eq: ['$direction', 'outgoing'] },
                            then: '$to',
                            else: '$from'
                        }
                    },
                    senderName: 1,
                    text: 1,
                    type: 1,
                    mediaUrl: 1,
                    direction: 1,
                    status: 1,
                    timestamp: 1,
                    createdAt: 1
                }
            },
            { $sort: { timestamp: -1 } },
            {
                $group: {
                    _id: '$chatPartner',
                    lastMessage: { $first: '$$ROOT' },
                    unreadCount: {
                        $sum: {
                            $cond: [
                                {
                                    $and: [
                                        { $eq: ['$direction', 'incoming'] },
                                        { $ne: ['$status', 'read'] }
                                    ]
                                },
                                1,
                                0
                            ]
                        }
                    }
                }
            },
            { $sort: { 'lastMessage.timestamp': -1 } }
        ]);

        // Fetch contacts for names/avatars
        const phones = partners.map(p => p._id).filter(Boolean);
        const contacts = await Contact.find({ phone: { $in: phones } });
        const contactMap = new Map(contacts.map(c => [c.phone, c]));

        const conversationList = partners
            .filter(p => p._id) // filter out null/empty
            .map(p => {
                const contact = contactMap.get(p._id);
                const lastMsg = p.lastMessage;
                return {
                    phone: p._id,
                    name: contact?.name || lastMsg.senderName || p._id,
                    avatarUrl: contact?.avatarUrl || '',
                    unreadCount: p.unreadCount || 0,
                    lastMessage: {
                        text: lastMsg.text || (lastMsg.mediaUrl ? '📷 Photo' : ''),
                        timestamp: lastMsg.timestamp || lastMsg.createdAt,
                        type: lastMsg.type,
                        direction: lastMsg.direction,
                        senderName: lastMsg.senderName || ''
                    }
                };
            });

        res.status(200).json(conversationList);
    } catch (err) {
        console.error('[getConversations Error]', err);
        res.status(500).json({ error: 'Failed to fetch conversations' });
    }
};

/**
 * Get all messages for a specific phone number / chat
 */
export const getMessagesForContact = async (req, res) => {
    try {
        const { phone } = req.params;
        if (!phone) return res.status(400).json({ error: 'Phone number is required' });

        const messages = await Message.find({
            $or: [{ from: phone }, { to: phone }]
        }).sort({ timestamp: 1 });

        // Mark incoming messages as read
        await Message.updateMany(
            { from: phone, direction: 'incoming', status: { $ne: 'read' } },
            { status: 'read' }
        );

        res.status(200).json(messages);
    } catch (err) {
        console.error('[getMessagesForContact Error]', err);
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
};

/**
 * Send / Create a new message
 */
export const createMessage = async (req, res) => {
    try {
        const {
            to,
            from = 'me',
            senderName = 'Admin',
            text = '',
            mediaUrl = '',
            type = 'text',
            direction = 'outgoing'
        } = req.body;

        if (!to) return res.status(400).json({ error: 'Recipient "to" is required' });
        if (!text && !mediaUrl) return res.status(400).json({ error: 'Message text or mediaUrl is required' });

        const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;

        const newMessage = await Message.create({
            from,
            to,
            senderName,
            text,
            mediaUrl,
            type: mediaUrl ? 'image' : type,
            direction,
            status: direction === 'outgoing' ? 'sent' : 'received',
            messageId,
            timestamp: new Date()
        });

        // Broadcast to all frontend connected sockets
        const io = getIO(req);
        if (io) {
            io.emit('new_message', newMessage);
            io.emit('conversation_updated', { phone: to, lastMessage: newMessage });
        }

        res.status(201).json(newMessage);
    } catch (err) {
        console.error('[createMessage Error]', err);
        res.status(500).json({ error: 'Failed to create message' });
    }
};

/**
 * Upload image to Cloudinary and create message
 */
export const uploadAndSendMessage = async (req, res) => {
    try {
        const { to, from = 'me', senderName = 'Admin', text = '', direction = 'outgoing' } = req.body;
        const file = req.file;

        if (!to) return res.status(400).json({ error: 'Recipient "to" is required' });
        if (!file) return res.status(400).json({ error: 'Image file is required' });

        // Upload to Cloudinary
        const uploadResult = await uploadImageToCloudinary(file, 'whatsapp_messages');
        const mediaUrl = uploadResult?.url || '';
        const cloudinaryPublicId = uploadResult?.publicId || '';

        const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;

        const newMessage = await Message.create({
            from,
            to,
            senderName,
            text,
            mediaUrl,
            cloudinaryPublicId,
            type: 'image',
            direction,
            status: direction === 'outgoing' ? 'sent' : 'received',
            messageId,
            timestamp: new Date()
        });

        // Broadcast real-time
        const io = getIO(req);
        if (io) {
            io.emit('new_message', newMessage);
            io.emit('conversation_updated', { phone: to, lastMessage: newMessage });
        }

        res.status(201).json(newMessage);
    } catch (err) {
        console.error('[uploadAndSendMessage Error]', err);
        res.status(500).json({ error: 'Failed to upload image and send message' });
    }
};

/**
 * Universal webhook endpoint for mobile WhatsApp forwarder / bridge
 */
export const handleWebhook = async (req, res) => {
    try {
        const body = req.body;

        // Meta WhatsApp Cloud API format or custom direct payload
        let from, to, senderName, text, mediaUrl, type = 'text', messageId;

        // 1. If Meta Cloud API format
        if (body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]) {
            const m = body.entry[0].changes[0].value.messages[0];
            from = m.from;
            to = body.entry[0].changes[0].value.metadata?.phone_number_id || 'me';
            messageId = m.id;
            const contactObj = body.entry[0].changes[0].value.contacts?.[0];
            senderName = contactObj?.profile?.name || from;

            if (m.type === 'text') {
                text = m.text?.body || '';
            } else if (m.type === 'image') {
                type = 'image';
                text = m.image?.caption || '';
                mediaUrl = m.image?.id || '';
            } else {
                text = `[${m.type} message]`;
            }
        } else {
            // 2. Custom clean payload (e.g. from mobile WhatsApp sync or Baileys)
            from = body.from || body.sender || body.phone;
            to = body.to || 'me';
            senderName = body.senderName || body.name || from;
            text = body.text || body.message || '';
            mediaUrl = body.mediaUrl || body.imageUrl || '';
            type = body.type || (mediaUrl ? 'image' : 'text');
            messageId = body.messageId || body.id || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
        }

        if (!from) {
            return res.status(200).json({ status: 'ignored_no_sender' });
        }

        // Check if message already exists
        const exists = await Message.findOne({ messageId });
        if (exists) {
            return res.status(200).json({ status: 'already_exists' });
        }

        const savedMessage = await Message.create({
            from,
            to,
            senderName,
            text,
            mediaUrl,
            type,
            direction: 'incoming',
            status: 'received',
            messageId,
            timestamp: new Date()
        });

        // Broadcast to UI
        const io = getIO(req);
        if (io) {
            io.emit('new_message', savedMessage);
            io.emit('conversation_updated', { phone: from, lastMessage: savedMessage });
        }

        return res.status(200).json({ success: true, message: savedMessage });
    } catch (err) {
        console.error('[handleWebhook Error]', err);
        return res.status(200).json({ error: 'Webhook processing completed' });
    }
};

/**
 * Delete a message by ID
 */
export const deleteMessage = async (req, res) => {
    try {
        const { id } = req.params;
        const msg = await Message.findOneAndDelete({
            $or: [{ _id: id }, { messageId: id }]
        });

        if (msg) {
            const io = getIO(req);
            if (io) {
                io.emit('message_deleted', { id: msg._id, messageId: msg.messageId });
            }
        }

        res.status(200).json({ success: true });
    } catch (err) {
        console.error('[deleteMessage Error]', err);
        res.status(500).json({ error: 'Failed to delete message' });
    }
};

/**
 * Add or update contact details
 */
export const saveContact = async (req, res) => {
    try {
        const { phone, name, avatarUrl, about } = req.body;
        if (!phone) return res.status(400).json({ error: 'Phone number is required' });

        const contact = await Contact.findOneAndUpdate(
            { phone },
            { phone, name, avatarUrl, about },
            { upsert: true, new: true }
        );

        res.status(200).json(contact);
    } catch (err) {
        console.error('[saveContact Error]', err);
        res.status(500).json({ error: 'Failed to save contact' });
    }
};
