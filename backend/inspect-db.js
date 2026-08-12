import mongoose from 'mongoose';
import './config/env.js';
import UserContext from './models/UserContext.js';
import Message from './models/Message.js';

async function run() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");

        const contexts = await UserContext.find({}).sort({ lastInteraction: -1 }).limit(10);
        console.log("User Contexts (Count: " + contexts.length + "):");
        for (const ctx of contexts) {
            console.log("-----------------------------------------");
            console.log("Phone:", ctx.phoneNumber);
            console.log("Name:", ctx.name);
            console.log("Stage:", ctx.stage);
            console.log("Status:", ctx.status);
            console.log("Is AIPaused:", ctx.isAIPaused);
            console.log("Handoff Reason:", ctx.handoffReason);
            console.log("Unclear Count:", ctx.unclearCount);
            console.log("Off Topic Count:", ctx.offTopicCount);
            console.log("Last bot question:", ctx.lastBotQuestionType);
            console.log("Last interaction:", ctx.lastInteraction);
        }

        const messages = await Message.find({}).sort({ timestamp: -1 }).limit(10);
        console.log("=========================================");
        console.log("Latest Messages:");
        for (const msg of messages) {
            console.log(`[${msg.timestamp.toISOString()}] From: ${msg.from} To: ${msg.to} Text: "${msg.text}" Status: ${msg.status}`);
        }

        await mongoose.disconnect();
    } catch (e) {
        console.error(e);
    }
}
run();
