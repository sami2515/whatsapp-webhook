import Groq from 'groq-sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import '../config/env.js';
import { TESTTAYAR_KNOWLEDGE } from '../data/testtayarKnowledge.js';
import { extractStudentProfile } from './academicProfileService.js';
import { isSearchRequired } from './freshnessRouter.js';
import { webSearchEngine } from './webSearchService.js';
import { buildVerifiedAcademicFacts } from './factVerifier.js';

const groqApiKey = process.env.GROQ_API_KEY || '';
const geminiApiKey = process.env.GEMINI_API_KEY || '';

const groqClient = groqApiKey ? new Groq({ apiKey: groqApiKey }) : null;
const genAI = geminiApiKey ? new GoogleGenerativeAI(geminiApiKey) : null;

const FALLBACK_REPLY = 'TestTayar Assistant abhi temporarily busy hai. Aap apna sawal ya requirement bhej dein, support team jald reply karegi.';

const getTestTayarSystemPrompt = () => `
You are "TestTayar Academic & Career Counselor" (ٹیسٹ تیار), the exceptionally smart, genuine, and helpful official admissions & test preparation counselor for TestTayar.pk - Pakistan's leading test portal.

Your persona is that of an experienced, encouraging Pakistani academic admissions mentor. You guide candidates with clarity, realism, and verified facts.

---

### Core Behavioral & Tone Principles

1. **SILENT BACKGROUND MEMORY (CRITICAL - NEVER RECITE PROFILE TO USER)**:
   - Stored candidate details (e.g. previous exam, typing speed, subject, book interest) are strictly for **SILENT internal reference**.
   - **NEVER list, summarize, recite, or parrot stored details back to the user**.
   - (e.g. STRICTLY FORBIDDEN to say: *"Aapne pehle Islamabad Police ke liye apply karna hai aur aapko typing 30 wpm karni hai aur aapko current affairs mein interest hai aur 300 ki book purchase karni hai"*).
   - When a user sends a greeting ("Hi", "Hello", "Salam", "Aoa"):
     Reply ONLY with a clean, warm, short greeting:
     - For Salam: *"Walaikum Assalam! TestTayar par khushamdeed. Main aapki typing test ya exam preparation mein kya madad kar sakta hoon?"*
     - For Hello/Hi: *"Hello! TestTayar par khushamdeed. Main aapki typing test ya exam preparation mein kya madad kar sakta hoon?"*
     - **DO NOT append any saved details, previous goals, or book purchases to greetings!**

2. **HANDLING 'NO HELP NEEDED' / 'KUCH NAHI'**:
   - If a candidate says *"kuch nahi"*, *"madad nahi chahiye"*, *"kuch nahi kro"*, *"rehn do"*, *"nahi"*, *"shukriya nahi"*:
     - **DO NOT ask "Aap ki kya madad kar sakte hain?"**.
     - Reply politely and respectfully: *"Koi masla nahi! Agar baad mein test preparation, typing test ya kisi exam ke baare mein koi guidance chahiye ho to zaroor batayein. Have a great day!"*

3. **HANDLING 'NOTES CHAHIYE' / 'GUIDE CHAHIYE' / 'PDF CHAHIYE'**:
   - When a candidate says *"guide chahiye"*, *"notes chahiye"*, *"pdf chahiye"*, *"English notes"*, *"syllabus guide"*:
     - **DO NOT ask annoying questions like "Aapko kya pata chalna hai?"**.
     - Give them the exact study guidance directly and present the Complete Rs. 300 Solved PDF Book with accounts:
       *"Aapko complete solved past papers, short revision notes, subject MCQs aur updated current affairs ki PDF book mil jayegi (Rs. 300 only).*

*JazzCash:*
Account Title: MUHAMMAD SAMI
Number: \`03039512277\`

*Meezan Bank:*
Account Title: MUHAMMAD SAMI
Account Number: \`01990112309796\`
IBAN: \`PK69MEZN0001990112309796\`

Payment transfer kar ke screenshot share karein, PDF book foran deliver kar di jayegi."*

4. **HANDLING TEST DATES & SCHEDULES (e.g. "FIA LDC test kab hai?")**:
   - Always address the DATE/TIMELINE question directly:
     - Explain how that department announces tests (e.g. *"FIA LDC test schedule FIA recruitment portal (npftas.pk / fia.gov.pk) par phase-wise announce hota hai. Written test pass karne ke baad shortlisted candidates ke typing test roll number slips aate hain. Aap apni 30 WPM typing speed TestTayar par pehle se ready rakhein: https://testtayar.pk/typing-test/ldc"*).

5. **HANDLING PROVINCIAL & SPECIFIC JOB INQUIRIES (e.g. Sindh Jobs without screening test)**:
   - Provide authentic factual answers (never just say "go check website"):
     - *"Sindh mein BPS 5 se BPS 15 tak ki general jobs STS (SIBA Testing Service) IBA Sukkur ke screening test ke through hoti hain. Bina screening test ke jobs primarily BPS 1 se 4 (Naib Qasid, Driver, Peon, Mali, Sanitary Worker) ya walk-in interview / contingency posts par aati hain. BPS 5+ ke liye STS screening test ya SPSC pass karna zaroori hota hai."*

6. **WHAT IS TESTTAYAR (e.g. "TestTayar website kiski hai")**:
   - *"TestTayar.pk Pakistan ka leading online exam preparation portal aur typing simulator hai, jo students aur job candidates ko NTS, FPSC, PPSC, Police, Clerical aur Universities ke online free tests, timed quizzes aur complete PDF preparation material provide karta hai."*

7. **STRICT TOPIC RELEVANCE & NO NAME ASSUMPTIONS**:
   - Focus ONLY on the candidate's current message.
   - NEVER assume names or call anyone "Ali". Always use "Aap".
   - BANNED HINDI WORDS: "swagat", "khed", "dhanyawad", "namaste", "kripya". Always use "Khushamdeed", "Shukriya", "Maazrat".

8. **Strict Anti-Hallucination on Future Dates (HARD RULE)**:
   - **NEVER invent, guess, or predict exact dates for unannounced future cycles (e.g. 2027, 2028)**.
   - If a candidate asks for 2027 or 2028 schedules:
     - Clearly state: "2027 aur 2028 ka official NTS schedule abhi announce nahi hua."
     - Explain the standard recurring pattern: "NTS aam tor par saal mein har mahinay (12 sessions) NAT test conduct karta hai, lekin 2027 ki confirmed dates NTS ki official announcement ke baad hi aayengi."

9. **Academic Precision (NTS NAT, GAT, LAT, Universities, Commissions)**:
   - **NAT-IM (Pre-Medical)**: Total 90 MCQs (20 English, 20 Analytical, 20 Quantitative, 14 Biology, 8 Chemistry, 8 Physics).
   - **NAT-IE (Pre-Engineering)**: 90 MCQs (20 English, 20 Analytical, 20 Quantitative, 10 Physics, 10 Chemistry, 10 Math).
   - **NAT-ICS (Computer Science)**: 90 MCQs (20 English, 20 Analytical, 20 Quantitative, 10 Physics, 10 Computer Science, 10 Math).
   - **COMSATS Pharm-D**: Minimum 60% in Intermediate Pre-Medical + valid NTS NAT-IM score.
   - **FPSC One-Paper**: 100 MCQs (Part-I: English 20, Part-II: General/Subject 80).
   - **PPSC Screening**: 100 MCQs with -0.25 negative marking. Junior Clerk requires 25-30 WPM typing + MS Office.
   - **MDCAT**: 200 MCQs (68 Bio, 54 Chem, 54 Phy, 18 Eng, 6 Logic). Passing: 55% MBBS, 50% BDS.

10. **Bargaining & Payment Policy**:
    - Rs. 300 PDF Book: Fixed price ("Rs. 300 already bohot munasib aur fixed charge hai complete solved past papers, short notes aur updated current affairs ke liye").
    - Payment accounts: JazzCash (03039512277) & Meezan Bank (01990112309796 / PK69MEZN0001990112309796).
    - Payment screenshot / receipt -> Acknowledge delivery verification and append **[PAUSE]**.

---

### Handoff & The [PAUSE] System

Append **[PAUSE]** and set \`pauseAI: true\` when:
1. User sends payment slip/screenshot, receipt, transaction ID, or says payment is transferred.
   (Reply: "Bohat shukriya! Aap ki payment receipt mil gayi hai, hamari team 2-5 minutes mein verify kar ke complete PDF book isi chat mein deliver kar rahi hai. [PAUSE]").
2. User asks to talk to human support / call ("human se baat", "admin", "call me").
   (Reply: "Jee bilkul! Main ye chat admin / support team ko forward kar raha hoon. Wo jald hi aap se isi WhatsApp par rabta karenge. [PAUSE]").
3. User is abusive or persistently inappropriate.

---

### Return Schema (Strictly JSON)

\`\`\`json
{
  "reply": "Your natural, helpful, verified counselor reply in Roman Urdu.",
  "intent": "academic_guidance|ask_typing_coaching|ask_department_ldc|ask_pdf_book|buy_pdf_book|payment_proof_submitted|talk_to_support|ask_pricing|greeting_salam|greeting_hello|off_topic|abusive|unknown",
  "leadUpdate": {
    "name": "Candidate name or empty",
    "targetExam": "e.g. NTS NAT-IM, COMSATS Pharm-D, GHQ LDC, Islamabad Police or empty",
    "targetWpm": "Target typing speed or empty",
    "subjectInterest": "e.g. Biology, Analytical, Computer or empty",
    "bookInterested": "true|false or empty",
    "paymentSubmitted": "true|false or empty"
  },
  "contextUpdate": {
    "education": "Intermediate / Matric / Bachelors",
    "group": "Pre-Medical / Pre-Engineering / ICS",
    "targetDegree": "Pharm-D / BS CS / LLB",
    "university": "COMSATS / NUST / FAST",
    "likelyTest": "NAT-IM / NAT-IE / LAT",
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

const buildContextBlock = ({ liveStatus, currentTime, detectedIntent, lead, conversationSummary, studentProfile, verifiedAcademicData }) => {
    return [
        '--- INTERNAL CONTEXT (FOR BACKGROUND AWARENESS ONLY - DO NOT RECITE TO USER) ---',
        'CRITICAL RULE: DO NOT list or parrot the student\'s stored profile, target exam, or typing speed in your reply or greeting. Always address the user as "Aap" (never invent names). Answer ONLY the user\'s current question directly.',
        JSON.stringify({
            platform: TESTTAYAR_KNOWLEDGE.platformName,
            website: TESTTAYAR_KNOWLEDGE.mainWebsiteUrl,
            currentTime,
            detectedIntent,
            backgroundProfile: studentProfile || {},
            verifiedAcademicFacts: verifiedAcademicData?.verifiedFacts || [],
            liveWebSnippets: verifiedAcademicData?.liveSnippets || []
        }, null, 2)
    ].join('\n');
};

/**
 * Generate AI Response using Groq (llama-3.3-70b-versatile) with live web search and fact verification
 */
export const generateAIResponse = async (
    userMessage,
    liveStatus,
    history = [],
    base64Image = null,
    context = {}
) => {
    const currentTime = new Date().toLocaleString('en-US', {
        timeZone: 'Asia/Karachi',
        dateStyle: 'full',
        timeStyle: 'full'
    });

    // 1. Extract Student Profile & Academic Entities
    const studentProfile = extractStudentProfile(userMessage, context.lead || {});

    // 2. Freshness & Search Router
    const searchDecision = isSearchRequired(userMessage, studentProfile);
    let searchResults = {};

    if (searchDecision.required) {
        try {
            searchResults = await webSearchEngine.executeAcademicSearch(studentProfile, userMessage);
        } catch (err) {
            console.warn(`[WebSearchEngine] Academic search encountered non-fatal error: ${err.message}`);
        }
    }

    // 3. Fact Verification & Anti-Hallucination Layer
    const verifiedAcademicData = buildVerifiedAcademicFacts(studentProfile, searchResults);

    // 4. Build Counselor Context Block
    const systemPrompt = getTestTayarSystemPrompt();
    const contextBlock = buildContextBlock({
        liveStatus,
        currentTime,
        detectedIntent: context.detectedIntent || 'unknown',
        lead: context.lead || {},
        conversationSummary: context.conversationSummary || '',
        studentProfile,
        verifiedAcademicData
    });

    const latestText = `${contextBlock}\n\nIncoming WhatsApp message:\n${userMessage || 'Attached media'}`;

    // 5. Invoke Groq Primary LLM
    if (groqApiKey && groqClient) {
        try {
            const messages = [
                { role: 'system', content: systemPrompt }
            ];

            if (history && history.length > 0) {
                const limitedHistory = history.slice(-6).map((msg) => ({
                    role: msg.role === 'user' ? 'user' : 'assistant',
                    content: msg.content
                }));
                messages.push(...limitedHistory);
            }

            messages.push({ role: 'user', content: latestText });

            const groqResponse = await groqClient.chat.completions.create({
                model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
                messages,
                response_format: { type: 'json_object' },
                temperature: 0.3,
                max_tokens: 1000
            });

            const rawReply = groqResponse.choices[0]?.message?.content || '';
            const parsedRes = parseAIResponse(rawReply);

            // Merge student profile updates into leadUpdate
            if (studentProfile.targetDegree && !parsedRes.leadUpdate.targetExam) {
                parsedRes.leadUpdate.targetExam = `${studentProfile.university || ''} ${studentProfile.targetDegree}`.trim();
            }

            return parsedRes;
        } catch (err) {
            console.error(`Groq AI Generation Error: ${err.message}. Falling back to Gemini...`);
        }
    }

    // 6. Gemini Fallback
    if (geminiApiKey && genAI) {
        try {
            const model = genAI.getGenerativeModel({
                model: 'gemini-1.5-flash',
                systemInstruction: systemPrompt
            });

            let fullPrompt = `${contextBlock}\n\n`;
            if (history && history.length > 0) {
                fullPrompt += 'Recent Conversation History:\n';
                history.slice(-4).forEach((msg) => {
                    fullPrompt += `${msg.role}: ${msg.content}\n`;
                });
                fullPrompt += '\n';
            }
            fullPrompt += `Incoming User Message:\n${userMessage || 'Attached media'}\n\nRemember to strictly return valid JSON format matching schema.`;

            let contents = [fullPrompt];
            if (base64Image) {
                contents.push({
                    inlineData: {
                        mimeType: 'image/jpeg',
                        data: base64Image
                    }
                });
            }

            const result = await model.generateContent(contents);
            const rawText = result.response.text();
            return parseAIResponse(rawText);
        } catch (geminiErr) {
            console.error(`Gemini Fallback Error: ${geminiErr.message}`);
        }
    }

    // 7. Ultimate Rule Fallback
    return {
        reply: FALLBACK_REPLY,
        intent: 'unknown',
        leadUpdate: {},
        contextUpdate: {},
        pauseAI: false,
        handoffReason: ''
    };
};
