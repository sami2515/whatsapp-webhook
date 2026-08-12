import './config/env.js';
import { generateAIResponse } from './services/aiService.js';

const testCases = [
    {
        name: 'Greeting & Platform Question',
        message: 'Aoa, TestTayar kya hai aur typing test kaise start karein?',
        history: []
    },
    {
        name: 'LDC / UDC Typing Speed Inquiry',
        message: 'LDC clerical job ke liye typing speed kitni honi chahiye?',
        history: [
            { role: 'user', content: 'Aoa' },
            { role: 'assistant', content: 'Walaikum Assalam! TestTayar Assistant mein khushamdeed. Main aapki kya madad kar sakta hoon?' }
        ]
    },
    {
        name: 'Rs. 300 PDF Book Inquiry',
        message: 'Islamabad Police aur clerical jobs ki PDF book kitne ki hai aur usme kya kya hai?',
        history: []
    },
    {
        name: 'Payment Proof Handoff Simulation',
        message: 'Meny Easypaisa se 300 rupay bhej diye hain ye screenshot hai, book bhej dein.',
        history: [
            { role: 'user', content: 'Book kaise purchase karni hai?' },
            { role: 'assistant', content: 'Rs. 300 Easypaisa ya JazzCash par +92 318 2402515 par bhej kar screenshot share karein.' }
        ]
    }
];

async function runTests() {
    console.log('--- Starting TestTayar AI Assistant Tests ---\n');
    console.log(`GROQ_API_KEY present: ${Boolean(process.env.GROQ_API_KEY)}`);
    console.log(`GEMINI_API_KEY present: ${Boolean(process.env.GEMINI_API_KEY)}\n`);

    for (const test of testCases) {
        console.log(`========================================`);
        console.log(`Test: ${test.name}`);
        console.log(`User Message: "${test.message}"`);
        console.log(`----------------------------------------`);
        
        try {
            const response = await generateAIResponse(
                test.message,
                'Available',
                test.history,
                null,
                {}
            );
            console.log('AI Response:\n', JSON.stringify(response, null, 2));
        } catch (err) {
            console.error('Test Failed with Error:', err);
        }
        console.log(`========================================\n`);
    }
}

runTests();
