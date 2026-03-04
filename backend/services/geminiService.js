import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

// Initialize the API with the key from the environment
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const getProfessionalSystemPrompt = (liveStatus, currentTime) => `
You are a highly professional, friendly, and smart Executive Assistant for Mr. Muhammad Sami.
Sami's current status is: "${liveStatus}".
The current local time in Karachi, Pakistan is: ${currentTime}.

Your Objective & Rules:
1. Language: You MUST communicate fluently in Roman Urdu (e.g., "Assalam o Alaikum! Sami abhi masroof hain..."). If the user speaks English, you can reply in English, but your default friendly tone should be in Roman Urdu.
2. Persona: Act like a real, helpful human assistant. NEVER say things like "As an AI..." or "I don't have a physical body". Play the role of a smart manager handling his WhatsApp.
3. Chat Logic: Do NOT introduce yourself or say "Assalam o Alaikum" in every single message. Only greet politely if they say hello first. Otherwise, just answer their question directly like an ongoing natural conversation.
4. Information & Time: If they ask for Sami, use his current status AND the current Karachi time (e.g., if it's 3 AM, mention he is likely asleep and will reply tomorrow) to give a realistic response.
5. Urgency: If they seem very urgent, politely guide them to use the "Mark as URGENT" button from the main menu so you can alert Sami instantly.
6. Tone: Keep your responses concise (1-3 sentences max), warm, and polite. Don't be robotic.
`;

export const generateAIResponse = async (userMessage, liveStatus, history = [], base64Image = null) => {
    try {
        if (!process.env.GEMINI_API_KEY) {
            console.error("GEMINI_API_KEY is missing!");
            return "I apologize, but my AI cognitive systems are currently offline. Please leave a message or mark as urgent.";
        }

        const currentTime = new Date().toLocaleString('en-US', { timeZone: 'Asia/Karachi', dateStyle: 'full', timeStyle: 'full' });

        const systemInstruction = getProfessionalSystemPrompt(liveStatus, currentTime);

        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            systemInstruction: systemInstruction
        });

        // Format history for Gemini API: { role: "user" | "model", parts: [{ text: "..." }] }
        const formattedHistory = history.map(msg => ({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content || "Attached Media" }]
        }));

        const chatSession = model.startChat({
            history: formattedHistory
        });

        let messageParts = [userMessage];

        // Append image data if provided (Gemini Vision integration)
        if (base64Image) {
            messageParts.push({
                inlineData: {
                    data: base64Image,
                    mimeType: "image/jpeg"
                }
            });
        }

        const result = await chatSession.sendMessage(messageParts);
        return result.response.text();

    } catch (error) {
        console.error("Error generating Gemini response:", error);
        return "I apologize, but I am experiencing temporary technical difficulties processing your request. Please try again later or mark your message as urgent.";
    }
};
