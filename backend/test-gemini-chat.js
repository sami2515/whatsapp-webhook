import { generateAIResponse } from './services/geminiService.js';
import './config/env.js';

async function runTest(testName, userMessage, history, detectedIntent, lastBotQuestionType = 'none') {
    console.log(`\n========================================`);
    console.log(`Running Test: ${testName}`);
    console.log(`User message: "${userMessage}"`);
    console.log(`History:`, JSON.stringify(history, null, 2));
    console.log(`----------------------------------------`);
    try {
        const response = await generateAIResponse(
            userMessage,
            "active",
            history,
            null,
            {
                detectedIntent,
                lead: {
                    lastBotQuestionType
                },
                conversationSummary: ""
            }
        );
        console.log("Gemini Response:\n", JSON.stringify(response, null, 2));
    } catch (e) {
        console.error("Test failed with error:", e);
    }
}

async function runAll() {
    // Test 1: Suppress greeting when greeting already happened in history
    await runTest(
        "Greeting Suppression Test",
        "hi",
        [
            { role: 'user', content: 'Salam' },
            { role: 'assistant', content: 'Wa alikum as salam! Main Sami Assistant hoon. Aap kis type ka project banwana chahte hain?' }
        ],
        "greeting"
    );

    // Test 2: Handle short input "Ji" when last question was about project type
    await runTest(
        "Short Input Contextual Handling Test (lastBotQuestionType: service_choice)",
        "Ji",
        [
            { role: 'user', content: 'Hi' },
            { role: 'assistant', content: 'Hello! I am Sami Assistant. Are you looking for a website, portal, e-commerce store, dashboard, or custom web app?' }
        ],
        "unknown",
        "service_choice"
    );

    // Test 3: Handle short input "Haan" when last question was about requirements
    await runTest(
        "Short Input Contextual Handling Test (lastBotQuestionType: requirements)",
        "Haan",
        [
            { role: 'user', content: 'website banwani hai' },
            { role: 'assistant', content: 'Zabardast! Kis type ki website banwani hai aur kya features chahiye?' }
        ],
        "unknown",
        "requirements"
    );
}

runAll();
