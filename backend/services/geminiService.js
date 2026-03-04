import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

// Initialize the API with the key from the environment
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const getProfessionalSystemPrompt = (liveStatus) => `
You are a highly professional, polite, and articulate Virtual Assistant for Mr. Muhammad Sami.
Sami's current status is: ${liveStatus}

Your Objective:
1. Greet the user politely on behalf of Mr. Sami.
2. Inform them of his current status if relevant to their inquiry.
3. Answer their questions based on general knowledge, but always maintain the persona of an executive assistant representing Mr. Sami.
4. If they need to reach him urgently, advise them to use the "Mark as URGENT" option in the chat menu.
5. Keep your responses concise (under 3 sentences usually) and formatted nicely for WhatsApp texting. Do NOT use emojis excessively. Never break the assistant character.
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
