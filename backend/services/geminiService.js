import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

// Initialize the API with the key from the environment
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const getProfessionalSystemPrompt = (liveStatus, currentTime) => `
You are a highly professional, smart, and proactive Executive Assistant for Mr. Muhammad Sami.
Sami's current status is: "${liveStatus}".
The current local time in Karachi, Pakistan is: ${currentTime}.

CRITICAL RULES:
1. Language: Communicate fluently in natural Roman Urdu (Pakistani conversational style).
2. Persona: Act like a real human assistant. NEVER say "As an AI...". Be smart and proactive.
3. Memory & Context: Read the provided conversation history. DO NOT repeat the same phrase over and over.
4. Stop Looping: If a user has already stated their intent (e.g., they want to leave a message or just said "g krdo" / "yes"), DO NOT ask them again. Acknowledge it decisively once (e.g., "Theek hai, maine Sami ko bata diya hai.") and do NOT end with another question.
5. Auto-Handover: If the conversation has reached a natural conclusion (for example, the user finished their request and you told them Sami will reply), YOU MUST append the exact string "[PAUSE]" at the very end of your response. This hands control over to Sami so you don't keep replying.
6. Tone: Keep your responses EXTREMELY concise (maximum 1 or 2 sentences), warm, and polite.
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

        // Format history to guarantee strict alternating roles for native Gemini API format
        let formattedHistory = [];
        let lastRole = null;

        for (const msg of history) {
            const role = msg.role === 'assistant' ? 'model' : 'user';
            const textContent = msg.content || "Attached Media";

            if (role === lastRole) {
                // Merge consecutive messages from same role to prevent API crash
                formattedHistory[formattedHistory.length - 1].parts[0].text += `\n\n${textContent}`;
            } else {
                formattedHistory.push({
                    role: role,
                    parts: [{ text: textContent }]
                });
                lastRole = role;
            }
        }

        // Gemini requires history to ALWAYS start with 'user'
        if (formattedHistory.length > 0 && formattedHistory[0].role === 'model') {
            formattedHistory.shift();
        }

        // Compile the current incoming message
        let finalParts = [{ text: userMessage }];
        if (base64Image) {
            finalParts.push({
                inlineData: {
                    data: base64Image,
                    mimeType: "image/jpeg"
                }
            });
        }

        // Merge latest message into context 
        if (lastRole === 'user') {
            formattedHistory[formattedHistory.length - 1].parts.push(...finalParts);
        } else {
            formattedHistory.push({
                role: 'user',
                parts: finalParts
            });
        }

        const result = await model.generateContent({ contents: formattedHistory });
        return result.response.text();

    } catch (error) {
        console.error("Error generating Gemini response:", error);
        return "I apologize, but I am experiencing temporary technical difficulties processing your request. Please try again later or mark your message as urgent.";
    }
};
