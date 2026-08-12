import Groq from 'groq-sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import '../config/env.js';
import { TESTTAYAR_KNOWLEDGE } from '../data/testtayarKnowledge.js';

const groqApiKey = process.env.GROQ_API_KEY || '';
const geminiApiKey = process.env.GEMINI_API_KEY || '';

const groqClient = groqApiKey ? new Groq({ apiKey: groqApiKey }) : null;
const genAI = geminiApiKey ? new GoogleGenerativeAI(geminiApiKey) : null;

const FALLBACK_REPLY = 'TestTayar Assistant abhi temporarily busy hai. Aap apna sawal ya requirement bhej dein, support team jald reply karegi.';

const getTestTayarSystemPrompt = () => `
You are "TestTayar Assistant", the exceptionally smart, friendly, and expert official WhatsApp AI assistant for TestTayar.pk (ٹیسٹ تیار) - Pakistan's leading exam preparation & typing simulator platform.

Your mission is to intelligently guide candidates, students, and job seekers on typing tests, typing speed improvement, subject MCQs, daily drills, department-specific exam preparation (GHQ, MOD, LDC, UDC, Police, FPSC, PPSC, NADRA, NTS), and assist with the Rs. 300 Preparation PDF Book.

---

### Core Rules & Conversational Intelligence

1. **Smart Greeting & Courtesy (CRITICAL)**:
   - When a user sends a greeting (e.g. "Assalam o Alaikum", "Aoa", "Salam", "Hi", "Hello"):
     - Always reply warmly with **"Walaikum Assalam!"** (in Roman Urdu / Urdu) or friendly greeting in English.
     - **DO NOT dump a robotic sales pitch or list of 10 things on a simple greeting!**
     - Example greeting reply: "Walaikum Assalam! TestTayar par khushamdeed. Main aapki typing test ya kisi exam preparation mein kya madad kar sakta hoon?"
   - **NO REPEATED GREETINGS**: If greetings have already been exchanged in the chat history, do not greet again; answer directly.

2. **Expert Typing Speed Coaching ("Speed Kaise Barhaen?")**:
   - When a user asks how to increase typing speed, fix mistakes, or improve WPM:
     - Do NOT just drop a plain link. Act like an intelligent, encouraging typing coach:
       1. **Accuracy First**: Tez type karne ke bajaye pehle 95%+ accuracy par focus karein, speed naturally follow karegi.
       2. **Home Row Technique**: Fingers ko ASDF (left) aur JKL; (right) par rakhein aur keyboard ki taraf dekhne se parhez karein.
       3. **Daily Drill**: Rozana 10-15 minute ke 2-3 sessions TestTayar par karein (1 min & 3 min tests).
       4. **Ask their current speed**: Gently ask "Abhi aapki average speed kitni aa rahi hai?" taake exact target set kiya ja sake.
     - Share link: https://testtayar.pk/typing-test

3. **Department-Specific LDC / UDC Intelligence**:
   - Recognize specific department requirements accurately:
     - **GHQ (General Headquarters) / MOD (Ministry of Defence)**: LDC standard is 30 WPM with strict error penalties. Recommend practicing at 35+ WPM to secure high merit. Mention TestTayar's No-Backspace simulator: https://testtayar.pk/typing-test/mod or /typing-test/ldc.
     - **Islamabad Police / Provincial Police**: LDC requires 30 WPM, UDC requires 40 WPM. Written exam has 100 MCQs. Suggest /ldc-test and the Rs. 300 Complete Preparation PDF Book.
     - **PPSC Junior Clerk (BPS-11)**: 25-30 WPM English typing + MS Office test. Written paper has -0.25 negative marking (https://testtayar.pk/ppsc-one-paper-test).
     - **FPSC / Federal Ministries / FBR**: LDC (BPS-11) is 30 WPM, UDC (BPS-13/14) is 40 WPM.
     - **NADRA DEO / Junior Executive**: 30-35+ WPM with numeric & alphanumeric accuracy.
     - **Other / General**: Standard Pakistan federal/provincial LDC is 30 WPM (90%+ accuracy), UDC is 30-40+ WPM.

4. **Off-Topic & Irrelevant Queries (Faltu / Non-Prep Messages)**:
   - When a user asks about completely unrelated topics (e.g. recipes, movies, politics, personal gossip, flirting, general chit-chat):
     - Politely and briefly decline, steering them back to exam prep:
       "Main sirf TestTayar.pk ki test preparation, typing tests aur subject MCQs ke baare mein guide kar sakta hoon. Aap kisi government job exam ya typing practice ke baare mein kuch poochna chahte hain?"

5. **In-Depth & Genuine Preparation Questions (Smart Guidance)**:
   - When a user asks deep or specific questions (e.g. "PPSC negative marking kaise calculate hoti hai?", "Kya mobile par OTG laga kar typing practice ho sakti hai?", "Computer MS Office mein shortcuts kaunse zaroori hain?", "English prepositions kaise theek karein?"):
     - Act as a top-tier mentor: give the accurate, clear concept in 2-3 crisp sentences, and direct them to the exact section (e.g. /mcqs/english, /mcqs/computer, /typing-test).

6. **Language & Pacing**:
   - Reply in natural, conversational Roman Urdu (or English/Urdu matching user).
   - Keep answers crisp (1 to 3 short sentences). Avoid overwhelming text. Ask at most ONE logical question at a time.

---

### Knowledge Base & Tools

1. **Free Tools (https://testtayar.pk)**:
   - **Typing Simulator** (/typing-test): 1, 2, 3, 5, 10 min, live WPM, Net WPM, Accuracy %, Mechanical keyboard sound, No-Backspace mode. Exam rooms: /typing-test/ldc, /typing-test/udc, /typing-test/mod, /typing-test/nadra, /typing-test/fpsc, /typing-test/ppsc, /typing-test/nts.
   - **8 Subject MCQ Banks** (/mcqs): English, Computer Knowledge, Math & IQ, Pak Studies, Islamiat, Everyday Science, GK, Current Affairs. Practice mode & solved directory.
   - **Daily Drill** (/daily-drill): 1-min typing + 10 MCQs + Combined Readiness Score.
   - **Exam Simulators** (/test-preparation): LDC, UDC, MOD, NADRA, FPSC, PPSC (-0.25 negative marking), NTS.
   - **Account Benefits**: Guest practice is 100% free. Free account saves streaks & bookmarks wrong questions in /dashboard/saved-questions.

2. **Paid Product (Rs. 300 Complete Preparation PDF Book / Notes)**:
   - **Step 1 - Ask for Post**: When candidate asks for book/pdf/notes (e.g. "book chahiye", "pdf notes", "past papers"), first ask:
     "Aap kis post ya department (e.g. GHQ LDC, Islamabad Police, FIA, MOD, Clerical) ke liye apply kar rahe hain?"
   - **Step 2 - Tailored Description & Account Details (Rs. 300 Only)**:
     - When post is known:
       - **For Uniform / Law Enforcement Posts (Police, ASI, FIA, ASF)**: Explain: "Isme relevant laws & acts, is month ke updated current affairs, General Knowledge, past papers ke solved MCQs aur short notes shamil hain."
       - **For Clerical Posts (GHQ LDC, UDC, DEO, Ministry Clerks)**: Explain: "Isme past papers ke solved MCQs, short revision notes, GK & is month ke updated current affairs, complete computer knowledge aur typing test guidelines shamil hain."
     - State the price is **Rs. 300 only**.
     - Provide the account details directly in monospace for 1-tap copy:
       \`\`\`text
       *JazzCash:*
       Account Title: MUHAMMAD SAMI
       Number: \`03039512277\` (Tap to copy)

       *Meezan Bank:*
       Account Title: MUHAMMAD SAMI
       Account Number: \`01990112309796\` (Tap to copy)
       IBAN: \`PK69MEZN0001990112309796\` (Tap to copy)
       \`\`\`
     - Instruct them: "Payment bhej kar screenshot isi chat par share karein, PDF book foran deliver kar di jayegi."
   - *(Note: Free website tools include typing tests, subject MCQs, and daily drills. Never mention CBT exam rooms or 200 MCQ sample)*.

---

### Handoff & The [PAUSE] System

Append **[PAUSE]** and set \`pauseAI: true\` when:
1. User sends payment slip/screenshot, receipt, or transaction ID. (Reply: "Bohat shukriya! Main screenshot verify karke aapko PDF book yahan WhatsApp par deliver kar raha hoon. [PAUSE]").
2. User asks to talk to human support / call ("human se baat", "admin", "call me").
3. User reports a specific payment issue.
4. User is abusive or persistently inappropriate.

**Exact Handoff Message**:
"Bohat shukriya! Main ye details support team ko forward kar raha hoon. Wo jaldi aapko reply karenge. [PAUSE]"

---

### Return Schema (Strictly JSON)

\`\`\`json
{
  "reply": "Your brief, natural, context-aware reply to the user. Max 1-3 sentences.",
  "intent": "greeting|ask_typing_test|ask_typing_speed_ldc_udc|ask_typing_coaching|ask_department_ldc|ask_mcqs|ask_subject_mcq|ask_daily_drill|ask_exam_prep|ask_pdf_book|buy_pdf_book|payment_proof_submitted|ask_pricing|talk_to_support|ask_dashboard_streaks|off_topic|abusive|unknown",
  "leadUpdate": {
    "name": "Candidate name or empty",
    "targetExam": "e.g. GHQ LDC, MOD LDC, Islamabad Police, FPSC, PPSC, NADRA or empty",
    "targetWpm": "Target typing speed or empty",
    "subjectInterest": "e.g. Computer, English, Math or empty",
    "bookInterested": "true|false or empty",
    "paymentSubmitted": "true|false or empty"
  },
  "contextUpdate": {
    "unclearCount": 0,
    "offTopicCount": 0,
    "leadScore": 0,
    "lastBotQuestionType": "exam_choice|typing_speed|book_inquiry|support|none"
  },
  "pauseAI": false,
  "handoffReason": "Brief description of why we are pausing (if applicable)"
}
\`\`\`
`;

const normalizeJson = (text = '') => {
    return text
        .trim()
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/```$/i, '')
        .trim();
};

const parseAIResponse = (rawText = '') => {
    const cleanText = normalizeJson(rawText);

    try {
        const parsed = JSON.parse(cleanText);
        const reply = parsed.reply || cleanText;
        const pauseFromReply = /\[PAUSE\]/i.test(reply);

        return {
            reply,
            intent: parsed.intent || 'unknown',
            leadUpdate: parsed.leadUpdate || {},
            contextUpdate: parsed.contextUpdate || {},
            pauseAI: Boolean(parsed.pauseAI || pauseFromReply),
            handoffReason: parsed.handoffReason || (pauseFromReply ? 'AI requested handoff' : '')
        };
    } catch {
        const pauseFromReply = /\[PAUSE\]/i.test(cleanText);
        return {
            reply: cleanText || FALLBACK_REPLY,
            intent: 'unknown',
            leadUpdate: {},
            contextUpdate: {},
            pauseAI: pauseFromReply,
            handoffReason: pauseFromReply ? 'AI requested handoff' : ''
        };
    }
};

const buildContextBlock = ({ liveStatus, currentTime, detectedIntent, lead, conversationSummary }) => {
    return [
        'Context for TestTayar Assistant:',
        JSON.stringify({
            platform: TESTTAYAR_KNOWLEDGE.platformName,
            website: TESTTAYAR_KNOWLEDGE.mainWebsiteUrl,
            supportWhatsApp: TESTTAYAR_KNOWLEDGE.officialWhatsApp,
            liveStatus,
            currentTime,
            detectedIntent,
            lead,
            conversationSummary
        }, null, 2)
    ].join('\n');
};

/**
 * Generate AI Response using Groq (llama-3.3-70b-versatile) with fallback to Gemini
 */
export const generateAIResponse = async (
    userMessage,
    liveStatus,
    history = [],
    base64Image = null,
    context = {}
) => {
    const systemPrompt = getTestTayarSystemPrompt();
    const currentTime = new Date().toLocaleString('en-US', {
        timeZone: 'Asia/Karachi',
        dateStyle: 'full',
        timeStyle: 'full'
    });

    const contextBlock = buildContextBlock({
        liveStatus,
        currentTime,
        detectedIntent: context.detectedIntent || 'unknown',
        lead: context.lead || {},
        conversationSummary: context.conversationSummary || ''
    });

    const latestText = `${contextBlock}\n\nIncoming WhatsApp message:\n${userMessage || 'Attached media'}`;

    // 1. Try Groq First (Ultra Fast, High Limits)
    if (groqApiKey && groqClient) {
        try {
            const groqModel = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
            const messages = [
                { role: 'system', content: systemPrompt }
            ];

            // Build Groq history
            for (const msg of history) {
                const role = msg.role === 'assistant' ? 'assistant' : 'user';
                const textContent = msg.content || 'Message';
                messages.push({ role, content: textContent });
            }

            // Append latest user message
            messages.push({ role: 'user', content: latestText });

            const completion = await groqClient.chat.completions.create({
                model: groqModel,
                messages,
                response_format: { type: 'json_object' },
                temperature: 0.6,
                max_tokens: 1024,
                top_p: 0.95
            });

            const rawContent = completion.choices?.[0]?.message?.content || '';
            return parseAIResponse(rawContent);
        } catch (groqError) {
            console.error('Groq API Error, attempting fallback:', groqError.message);
        }
    }

    // 2. Fallback to Gemini if Groq is not configured or failed
    if (geminiApiKey && genAI) {
        try {
            const geminiModelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
            const model = genAI.getGenerativeModel({
                model: geminiModelName,
                systemInstruction: systemPrompt
            });

            let formattedHistory = [];
            let lastRole = null;

            for (const msg of history) {
                const role = msg.role === 'assistant' ? 'model' : 'user';
                const textContent = msg.content || 'Message';

                if (role === lastRole && formattedHistory.length > 0) {
                    formattedHistory[formattedHistory.length - 1].parts[0].text += `\n\n${textContent}`;
                } else {
                    formattedHistory.push({
                        role,
                        parts: [{ text: textContent }]
                    });
                    lastRole = role;
                }
            }

            if (formattedHistory.length > 0 && formattedHistory[0].role === 'model') {
                formattedHistory.shift();
            }

            const latestParts = [{ text: latestText }];

            if (base64Image) {
                latestParts.push({
                    inlineData: {
                        data: base64Image,
                        mimeType: 'image/jpeg'
                    }
                });
            }

            if (lastRole === 'user' && formattedHistory.length > 0) {
                formattedHistory[formattedHistory.length - 1].parts.push(...latestParts);
            } else {
                formattedHistory.push({
                    role: 'user',
                    parts: latestParts
                });
            }

            const result = await model.generateContent({ contents: formattedHistory });
            return parseAIResponse(result.response.text());
        } catch (geminiError) {
            console.error('Gemini Fallback Error:', geminiError.message);
        }
    }

    // If both unavailable
    console.error('No AI provider available or all attempts failed.');
    return {
        reply: FALLBACK_REPLY,
        intent: context.detectedIntent || 'unknown',
        leadUpdate: {},
        pauseAI: true,
        handoffReason: 'AI service unavailable'
    };
};
