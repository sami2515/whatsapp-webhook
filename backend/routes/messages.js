import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import {
    getConversations,
    getMessagesForContact,
    createMessage,
    uploadAndSendMessage,
    handleWebhook,
    deleteMessage,
    saveContact
} from '../controllers/messageController.js';

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.resolve('uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname) || '.jpg';
        cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 25 * 1024 * 1024 } // 25MB max
});

// Conversations list
router.get('/conversations', getConversations);

// Messages for a specific contact
router.get('/messages/:phone', getMessagesForContact);

// Send text / direct message
router.post('/messages', createMessage);

// Upload image to Cloudinary and send message
router.post('/messages/send-image', upload.single('image'), uploadAndSendMessage);

// Delete message
router.delete('/messages/:id', deleteMessage);

// Contacts management
router.post('/contacts', saveContact);

// Universal Webhook (for future mobile sync, forwarders, or Meta verification)
router.get('/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    const verifyToken = process.env.WEBHOOK_VERIFY_TOKEN;

    if (mode === 'subscribe' && token === verifyToken) {
        return res.status(200).send(challenge);
    }
    return res.status(200).send('Webhook endpoint active');
});

router.post('/webhook', handleWebhook);

// Backwards compatibility with previous endpoints
router.post('/send', createMessage);
router.post('/send-image', upload.single('image'), uploadAndSendMessage);

export default router;
