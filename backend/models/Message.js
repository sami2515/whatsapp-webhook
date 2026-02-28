import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    from: {
        type: String,
        required: true,
    },
    to: {
        type: String,
        required: true,
    },
    messageId: {
        type: String,
        required: true,
        unique: true
    },
    text: {
        type: String, // To store message body if it's a text message
    },
    type: {
        type: String,
        enum: ['text', 'audio', 'image', 'video', 'document', 'template'],
        default: 'text'
    },
    mediaId: {
        type: String, // To store WhatsApp Media ID for audio/image/video
    },
    status: {
        type: String,
        enum: ['sent', 'delivered', 'read', 'received', 'failed'],
        default: 'received'
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

const Message = mongoose.model('Message', messageSchema);

export default Message;
