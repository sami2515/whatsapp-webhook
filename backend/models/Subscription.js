import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema({
    endpoint: {
        type: String,
        required: true,
        unique: true
    },
    expirationTime: {
        type: Number,
        default: null
    },
    keys: {
        p256dh: {
            type: String,
            required: true
        },
        auth: {
            type: String,
            required: true
        }
    },
    userType: {
        type: String, // 'admin' or 'customer' (for future use, if needed)
        default: 'admin'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Subscription = mongoose.model('Subscription', subscriptionSchema);

export default Subscription;
