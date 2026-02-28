import express from 'express';
import multer from 'multer';
import {
    verifyWebhook,
    handleIncomingMessage,
    sendWhatsAppMessage,
    getConversations,
    getChatHistory,
    getMedia,
    uploadAndSendAudio,
    uploadAndSendImage
} from '../controllers/whatsappController.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

// Webhook Verification Route (Meta requires GET requests for verification)
router.get('/webhook', verifyWebhook);

// Webhook Event Route (Meta sends POST requests when you receive messages/statuses)
router.post('/webhook', handleIncomingMessage);

// Custom API to trigger outgoing messages from your React frontend
router.post('/send', sendWhatsAppMessage);

// Upload and send an audio file
router.post('/send-audio', upload.single('audio'), uploadAndSendAudio);

// Upload and send an image file
router.post('/send-image', upload.single('image'), uploadAndSendImage);

// Fetch media from Meta
router.get('/media/:mediaId', getMedia);

// Fetch list of unique conversations
router.get('/conversations', getConversations);

// Fetch chat history for a specific phone number
router.get('/messages/:phoneNumber', getChatHistory);

export default router;
