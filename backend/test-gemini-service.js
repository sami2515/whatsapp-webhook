import { generateAIResponse } from './services/geminiService.js';
import './config/env.js';

async function run() {
    console.log("Calling generateAIResponse...");
    try {
        const response = await generateAIResponse(
            "Hello Sami",
            "active",
            [],
            null,
            {
                detectedIntent: "greeting",
                lead: {},
                conversationSummary: ""
            }
        );
        console.log("Response:", JSON.stringify(response, null, 2));
    } catch (e) {
        console.error("Caught error:");
        console.error(e);
    }
}
run();
