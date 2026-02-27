import express from 'express';
import {
    verifyWebhook,
    handleIncomingMessage,
    sendWhatsAppMessage,
    getConversations,
    getChatHistory
} from '../controllers/whatsappController.js';

const router = express.Router();

// Webhook Verification Route (Meta requires GET requests for verification)
router.get('/webhook', verifyWebhook);

// Webhook Event Route (Meta sends POST requests when you receive messages/statuses)
router.post('/webhook', handleIncomingMessage);

// Custom API to trigger outgoing messages from your React frontend
router.post('/send', sendWhatsAppMessage);

// Fetch list of unique conversations
router.get('/conversations', getConversations);

// Fetch chat history for a specific phone number
router.get('/messages/:phoneNumber', getChatHistory);

export default router;
