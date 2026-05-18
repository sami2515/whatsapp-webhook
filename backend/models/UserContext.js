import mongoose from 'mongoose';

const userContextSchema = new mongoose.Schema({
    phoneNumber: {
        type: String,
        required: true,
        unique: true
    },
    phone: {
        type: String
    },
    name: {
        type: String,
        default: ''
    },
    business: {
        type: String,
        default: ''
    },
    serviceType: {
        type: String,
        default: ''
    },
    budget: {
        type: String,
        default: ''
    },
    timeline: {
        type: String,
        default: ''
    },
    projectDetails: {
        type: String,
        default: ''
    },
    requirementSummary: {
        type: String,
        default: ''
    },
    conversationSummary: {
        type: String,
        default: ''
    },
    intent: {
        type: String,
        default: 'unknown'
    },
    stage: {
        type: String,
        enum: [
            'new',
            'asked_project_type',
            'asked_requirements',
            'asked_timeline',
            'asked_budget',
            'qualified',
            'handed_off',
            'unclear_waiting',
            'personal_boundary',
            'off_topic_waiting'
        ],
        default: 'new'
    },
    status: {
        type: String,
        default: 'open'
    },
    aiPaused: {
        type: Boolean,
        default: false
    },
    handoffReason: {
        type: String,
        default: ''
    },
    isAIPaused: {
        type: Boolean,
        default: false
    },
    aiPausedAt: {
        type: Date
    },
    unclearCount: {
        type: Number,
        default: 0
    },
    personalQuestionCount: {
        type: Number,
        default: 0
    },
    offTopicCount: {
        type: Number,
        default: 0
    },
    abuseCount: {
        type: Number,
        default: 0
    },
    leadScore: {
        type: Number,
        default: 0
    },
    lastClarificationAt: {
        type: Date
    },
    lastBotQuestionType: {
        type: String,
        default: ''
    },
    cameFromBuildPlan: {
        type: Boolean,
        default: false
    },
    buildPlanFormSubmitted: {
        type: Boolean,
        default: false
    },
    lastInteraction: {
        type: Date,
        default: Date.now
    },
    lastMessageAt: {
        type: Date
    }
}, { timestamps: true });

const UserContext = mongoose.model('UserContext', userContextSchema);

export default UserContext;
