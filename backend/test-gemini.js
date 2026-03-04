import { GoogleGenerativeAI } from '@google/generative-ai';

async function run() {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "dummy");
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash", systemInstruction: "You are an AI." });

        let history = [
            { role: 'user', content: "hi" },
            { role: 'assistant', content: "hello" },
            { role: 'user', content: "hi 2" },
        ];

        let formattedHistory = [];
        let lastRole = null;

        for (const msg of history) {
            const role = msg.role === 'assistant' ? 'model' : 'user';
            const textContent = msg.content || "Attached Media";

            if (role === lastRole) {
                formattedHistory[formattedHistory.length - 1].parts[0].text += `\n\n${textContent}`;
            } else {
                formattedHistory.push({
                    role: role,
                    parts: [{ text: textContent }]
                });
                lastRole = role;
            }
        }

        if (formattedHistory.length > 0 && formattedHistory[0].role === 'model') {
            formattedHistory.shift();
        }

        let userMessage = "third hi";
        let finalParts = [{ text: userMessage }];

        if (lastRole === 'user') {
            formattedHistory[formattedHistory.length - 1].parts.push(...finalParts);
        } else {
            formattedHistory.push({
                role: 'user',
                parts: finalParts
            });
        }

        console.log(JSON.stringify({ contents: formattedHistory }, null, 2));

    } catch (e) { console.error(e) }
}
run();
