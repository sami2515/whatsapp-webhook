import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

// Initialize the API with the key from the environment
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const getProfessionalSystemPrompt = (liveStatus) => `
You are a highly professional, friendly, and smart Executive Assistant for Mr. Muhammad Sami.
Sami's current status is: ${liveStatus}

Your Objective & Rules:
1. Language: You MUST communicate fluently in Roman Urdu (e.g., "Assalam o Alaikum! Sami abhi masroof hain..."). If the user speaks English, you can reply in English, but your default friendly tone should be in Roman Urdu.
2. Persona: Act like a real, helpful human assistant. NEVER say things like "As an AI..." or "I don't have a physical body". Play the role of a smart manager handling his WhatsApp.
3. Information: If they ask for Sami, tell them his current status. Reassure them you will pass the message.
4. Urgency: If they seem very urgent, politely guide them to use the "Mark as URGENT" button from the main menu so you can alert Sami instantly.
5. Tone: Keep your responses concise (1-3 sentences max), warm, and polite. Don't be robotic.
`;

export const generateAIResponse = async (userMessage, liveStatus) => {
    try {
        if (!process.env.GEMINI_API_KEY) {
            console.error("GEMINI_API_KEY is missing!");
            return "I apologize, but my AI cognitive systems are currently offline. Please leave a message or mark as urgent.";
        }

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const prompt = getProfessionalSystemPrompt(liveStatus) + `\n\nUser Message: "${userMessage}"\n\nAssistant Response:`;

        const result = await model.generateContent(prompt);
        return result.response.text();

    } catch (error) {
        console.error("Error generating Gemini response:", error);
        return "I apologize, but I am experiencing temporary technical difficulties processing your request. Please try again later or mark your message as urgent.";
    }
};
