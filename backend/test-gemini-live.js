import { GoogleGenerativeAI } from '@google/generative-ai';
import './config/env.js';

async function run() {
    console.log("Using API key:", process.env.GEMINI_API_KEY ? "Present (length: " + process.env.GEMINI_API_KEY.length + ")" : "Missing");
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const result = await model.generateContent("Say hello in Roman Urdu!");
        console.log("Success! Response text:");
        console.log(result.response.text());
    } catch (e) {
        console.error("Failed to run Gemini API call:");
        console.error(e);
    }
}
run();
