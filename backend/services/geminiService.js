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
2. Persona (Not a Postman): Act like a real human assistant. NEVER say "As an AI...". Be smart. If they want to talk to Sami, say something like: "Jee zaroor, Sami abhi Karachi mein hain aur shayad busy hon. Main unhe notify kar deta hoon, aap apna topic bata den taake wo prepare rahein."
3. Stop Looping: If the user has explicitly decided between a message or a call (e.g., they said "g krdo", "bat krni ha", or "message dena hai"), DO NOT ask them the same question again. Acknowledge it once and wait for Sami's reply.
4. Memory & Context: Read the provided conversation history.
5. Auto-Handover: If the conversation has reached a natural conclusion and you have nothing left to ask, or the user confirms you should pass the message, you MUST append the exact string "[PAUSE]" at the very end of your response. This stops you from replying and hands control over to Sami.
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

        // Merge latest message into context 
        if (lastRole === 'user') {
            formattedHistory[formattedHistory.length - 1].parts[0].text += `\n\n${userMessage}`;
            if (base64Image) {
                formattedHistory[formattedHistory.length - 1].parts.push({
                    inlineData: {
                        data: base64Image,
                        mimeType: "image/jpeg"
                    }
                });
            }
        } else {
            let userParts = [{ text: userMessage }];
            if (base64Image) {
                userParts.push({
                    inlineData: {
                        data: base64Image,
                        mimeType: "image/jpeg"
                    }
                });
            }
            formattedHistory.push({
                role: 'user',
                parts: userParts
            });
        }

        const result = await model.generateContent({ contents: formattedHistory });
        return result.response.text();

    } catch (error) {
        // Output the actual Gemini error explicitly in the string so we can see it on WhatsApp
        const errorMsg = error.response ? JSON.stringify(error.response) : error.message;
        console.error("Error generating Gemini response:", errorMsg);

        if (errorMsg.includes('429') || errorMsg.includes('quota')) {
            return "Mai abhi bohat saare messages handle kar raha hoon achanak se (API Limit Reached). Barae meharbani kuch seconds baad dubara message karein 🙏";
        }

        return `I apologize, but I am experiencing temporary technical difficulties. [DEBUG ERROR: ${errorMsg}]`;
    }
};
