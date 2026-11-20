import mongoose from 'mongoose';

const contactSchema = new mongoose.Schema({
    phone: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    name: {
        type: String,
        default: ''
    },
    avatarUrl: {
        type: String,
        default: ''
    },
    about: {
        type: String,
        default: ''
    },
    lastMessage: {
        text: String,
        timestamp: Date,
        senderName: String
    },
    unreadCount: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

const Contact = mongoose.model('Contact', contactSchema);

export default Contact;
