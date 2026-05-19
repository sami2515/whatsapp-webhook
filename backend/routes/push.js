import express from 'express';
import {
    deleteInactivePushSubscriptions,
    getPushPublicKey,
    subscribeToPush,
    unsubscribeFromPush
} from '../controllers/whatsappController.js';

const router = express.Router();

router.get('/public-key', getPushPublicKey);
router.post('/subscribe', subscribeToPush);
router.post('/unsubscribe', unsubscribeFromPush);
router.delete('/subscriptions/inactive', deleteInactivePushSubscriptions);

export default router;
