import express from 'express';
import {
    getPushPublicKey,
    subscribeToPush,
    unsubscribeFromPush
} from '../controllers/whatsappController.js';

const router = express.Router();

router.get('/public-key', getPushPublicKey);
router.post('/subscribe', subscribeToPush);
router.post('/unsubscribe', unsubscribeFromPush);

export default router;
