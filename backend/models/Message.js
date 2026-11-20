import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    from: {
        type: String,
        required: true,
        index: true
    },
    to: {
        type: String,
        required: true,
        index: true
    },
    senderName: {
        type: String,
        default: ''
    },
    text: {
        type: String,
        default: ''
    },
    type: {
        type: String,
        enum: ['text', 'image', 'audio', 'video', 'document', 'system', 'sticker', 'interactive', 'unsupported'],
        default: 'text'
    },
    mediaUrl: {
        type: String,
        default: ''
    },
    cloudinaryPublicId: {
        type: String,
        default: ''
    },
    messageId: {
        type: String,
        unique: true,
        sparse: true,
        index: true
    },
    direction: {
        type: String,
        enum: ['incoming', 'outgoing'],
        default: 'incoming'
    },
    status: {
        type: String,
        enum: ['sent', 'delivered', 'read', 'received', 'failed'],
        default: 'received'
    },
    timestamp: {
        type: Date,
        default: Date.now,
        index: true
    }
}, {
    timestamps: true
});

// Compound index for fast conversation retrieval
messageSchema.index({ from: 1, to: 1, timestamp: -1 });

const Message = mongoose.model('Message', messageSchema);

export default Message;
