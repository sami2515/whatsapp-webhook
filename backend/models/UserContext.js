import mongoose from 'mongoose';

const userContextSchema = new mongoose.Schema({
    phoneNumber: {
        type: String,
        required: true,
        unique: true
    },
    isAIPaused: {
        type: Boolean,
        default: false
    },
    aiPausedAt: {
        type: Date
    },
    lastInteraction: {
        type: Date,
        default: Date.now
    }
});

const UserContext = mongoose.model('UserContext', userContextSchema);

export default UserContext;
