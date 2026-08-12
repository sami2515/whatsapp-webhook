import { TESTTAYAR_KNOWLEDGE, SAMI_KNOWLEDGE } from '../data/testtayarKnowledge.js';

export const LEAD_STAGES = {
    NEW: 'new',
    EXPLORING_TOOLS: 'exploring_tools',
    TARGET_EXAM_IDENTIFIED: 'target_exam_identified',
    BOOK_INTERESTED: 'book_interested',
    PAYMENT_PENDING: 'payment_pending',
    PAYMENT_SUBMITTED: 'payment_submitted',
    QUALIFIED: 'qualified',
    HANDED_OFF: 'handed_off',
    UNCLEAR_WAITING: 'unclear_waiting',
    PERSONAL_BOUNDARY: 'personal_boundary',
    OFF_TOPIC_WAITING: 'off_topic_waiting',
    // Legacy support
    ASKED_PROJECT_TYPE: 'asked_project_type',
    ASKED_REQUIREMENTS: 'asked_requirements',
    ASKED_TIMELINE: 'asked_timeline',
    ASKED_BUDGET: 'asked_budget'
};

export const AUTO_RESUME_STALE_PAUSE_HOURS = 6;

const SAFETY_CONFUSION_PAUSE_REASONS = [
    'Repeated personal/private question',
    'Repeated unclear/off-topic messages',
    'Repeated confusion after clarification',
    'Abusive or inappropriate message'
];

const SERIOUS_LEAD_PAUSE_REASONS = [
    'Manually paused by admin',
    'Payment proof or screenshot submitted for PDF book',
    'User requested human support / call',
    'User wants to proceed with book order',
    'Lead score reached threshold',
    'User requested human handoff',
    'Technical complaint requiring admin intervention'
];

const normalizeText = (text = '') => text.toLowerCase().replace(/\s+/g, ' ').trim();

const normalizeLoose = (text = '') => normalizeText(text)
    .replace(/[“”‘’]/g, "'")
    .replace(/[?!.,;:()[\]{}"']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const includesAny = (text, keywords) => keywords.some((keyword) => text.includes(keyword));

const matchesAny = (text, patterns) => patterns.some((pattern) => pattern.test(text));

const toTitleCase = (value = '') => {
    return value
        .trim()
        .split(/\s+/)
        .map((word) => word ? `${word[0].toUpperCase()}${word.slice(1).toLowerCase()}` : '')
        .join(' ');
};

const cleanParsedValue = (value = '') => {
    return value
        .replace(/\s+/g, ' ')
        .replace(/^[\s.:-]+|[\s.]+$/g, '')
        .trim();
};

export const isWebsiteBuildPlanMessage = (messageText = '') => {
    return normalizeText(messageText).includes('web development build plan') ||
        normalizeText(messageText).includes('testtayar prep plan');
};

export const parseWebsiteLeadMessage = (messageText = '') => {
    const text = normalizeLoose(messageText);
    const leadUpdate = {};

    if (includesAny(text, ['ldc', 'lower division clerk'])) leadUpdate.targetExam = 'LDC (BPS-11)';
    else if (includesAny(text, ['udc', 'upper division clerk'])) leadUpdate.targetExam = 'UDC (BPS-13/14)';
    else if (includesAny(text, ['police', 'islamabad police', 'asi'])) leadUpdate.targetExam = 'Islamabad Police ASI/UDC/LDC';
    else if (includesAny(text, ['fpsc'])) leadUpdate.targetExam = 'FPSC One Paper';
    else if (includesAny(text, ['ppsc'])) leadUpdate.targetExam = 'PPSC Screening';
    else if (includesAny(text, ['nadra', 'deo'])) leadUpdate.targetExam = 'NADRA DEO';
    else if (includesAny(text, ['mod', 'defence'])) leadUpdate.targetExam = 'MOD Clerical';
    else if (includesAny(text, ['nts', 'gat', 'nat'])) leadUpdate.targetExam = 'NTS Screening';

    if (includesAny(text, ['book', 'pdf', 'notes', '300'])) {
        leadUpdate.bookInterested = true;
    }

    return leadUpdate;
};

// Intent keyword groupings
const GREETING_PHRASES = [
    'aoa', 'a.o.a', 'asalam', 'assalam', 'assalamu alaikum', 'assalam o alaikum', 'assalam-o-alaikum',
    'salam', 'slm', 'hi', 'hello', 'hey', 'hy', 'kese ho', 'kaise ho', 'kia hal hai', 'kya haal',
    'سلام', 'اسلام علیکم', 'السلام علیکم'
];

const TYPING_TEST_PHRASES = [
    'typing test', 'typing practice', 'typing speed', 'speed test', 'touch typing', 'wpm',
    'typing simulator', 'typing start', 'typing link', 'typing krni hai', 'typing karni hai',
    'typing test link', 'no backspace', 'keyboard sound', 'accuracy', 'net wpm', 'gross wpm',
    'ٹائپنگ ٹیسٹ', 'ٹائپنگ'
];

const TYPING_SPEED_LDC_UDC_PHRASES = [
    'ldc speed', 'udc speed', 'ldc typing speed', 'udc typing speed', 'kitni speed chahiye',
    'speed kitni required', 'ldc pass speed', 'udc pass speed', 'passing speed', 'passing criteria',
    '30 wpm', '40 wpm', 'ldc criteria', 'udc criteria', 'clerk speed', 'clerical speed'
];

const MCQS_PHRASES = [
    'mcq', 'mcqs', 'quiz', 'quizzes', 'question bank', 'mcq practice', 'mcq test', 'solved directory',
    'practice mode', 'solved mcqs', 'ام سی کیوز', 'سوالات'
];

const SUBJECT_MCQ_PHRASES = [
    'english mcq', 'english mcqs', 'computer mcq', 'computer mcqs', 'math mcq', 'math mcqs',
    'mathematics mcq', 'pak study', 'pak studies', 'pakistan studies', 'islamiat', 'islamic studies',
    'everyday science', 'science mcqs', 'general knowledge', 'gk mcqs', 'current affairs'
];

const DAILY_DRILL_PHRASES = [
    'daily drill', 'daily practice', 'daily test', 'readiness score', 'readiness rating',
    '10 mcqs test', '10 mcqs routine', 'daily routine', 'ڈیلی ڈرل'
];

const EXAM_PREP_PHRASES = [
    'ldc test', 'udc test', 'fpsc test', 'ppsc test', 'mod test', 'nadra test', 'nts test',
    'fpsc one paper', 'ppsc one paper', 'negative marking', 'test preparation', 'govt test',
    'screening test', 'cbt test', 'cbt simulator'
];

const PDF_BOOK_PHRASES = [
    'pdf book', 'book', 'notes', 'pdf notes', 'islamabad police book', 'police book',
    '630 mcqs', 'solved book', 'preparation book', 'book price', 'book kitne ki', 'kitne ki hai',
    'notes chahiye', 'book chahiye', '300 book', '300 wali book', 'کتاب', 'نوٹس', 'پی ڈی ایف'
];

const BUY_PDF_BOOK_PHRASES = [
    'book kaise buy', 'book kaise purchase', 'how to buy book', 'how to buy pdf',
    'easypaisa number', 'jazzcash number', 'account number', 'payment method', 'kese bhejoon',
    'kaise send kron', 'order book', 'buy now', 'book leni hai', 'book khareedni'
];

const PAYMENT_PROOF_PHRASES = [
    'screenshot', 'screen shot', 'slip', 'receipt', 'pay kar diya', 'pay kr dia', 'payment send',
    'payment done', '300 bhej diye', '300 send kr diye', 'easypaisa kar dia', 'jazzcash kar dia',
    'trx id', 'transaction id', 'paise bhej diye', 'payment screenshot', 'رسید', 'اسکرین شاٹ'
];

const TALK_TO_SUPPORT_PHRASES = [
    'talk to human', 'talk to support', 'talk to admin', 'admin se baat', 'human se baat',
    'call me', 'call kar lein', 'call krni hai', 'support number', 'representative',
    'agent se baat', 'real person', 'kisi insan se baat'
];

const PRICING_FREE_PHRASES = [
    'website free hai', 'free hai kya', 'kya ye free hai', 'charges kya hain', 'fees kya hai',
    'is it free', 'free of cost', 'free or paid'
];

const DASHBOARD_STREAKS_PHRASES = [
    'account zaroori', 'sign up zaroori', 'login zaroori', 'streak', 'streaks', 'saved questions',
    'wrong questions', 'bookmark'
];

const abusivePhrases = [
    'fuck', 'fucking', 'shit', 'bitch', 'bastard', 'asshole', 'madarchod',
    'behenchod', 'bhenchod', 'chutiya', 'chutia', 'harami', 'kutta', 'lanat', 'لعنت', 'حرامی'
];

const offTopicPhrases = [
    'politics', 'election', 'cricket score', 'movie download', 'joke sunao', 'random joke', 'xxx'
];

const personalQuestionPhrases = [
    'aap real ho', 'tum real ho', 'are you real', 'are you ai', 'are you a bot',
    'tum insaan ho', 'tum insan ho', 'insaan ho ya ai'
];

const SUBJECT_KEYWORDS = [
    'english', 'computer', 'math', 'mathematics', 'pak study', 'pak studies', 'pakistan studies',
    'islamiat', 'islamic studies', 'everyday science', 'science', 'general knowledge', 'gk', 'current affairs'
];

const TYPING_COACHING_PHRASES = [
    'speed kaise barhaen', 'speed kaise badhaye', 'speed barhani hai', 'speed fast kaise karein',
    'speed increase kaise', 'speed increase krni', 'how to increase typing speed', 'how to improve wpm',
    'mistakes kam kaise', 'accuracy kaise theek', 'typing speed slow', 'speed nahi barh rahi',
    'speed nhi barh rhi', 'typing fast kaise kare', 'typing tips', 'speed improve'
];

const DEPARTMENT_LDC_PHRASES = [
    'ghq ldc', 'ghq typing', 'ghq test', 'mod ldc', 'mod typing', 'mod test',
    'fbr ldc', 'fbr typing', 'police ldc', 'police typing', 'paf ldc', 'navy ldc',
    'railway ldc', 'mes ldc', 'deo typing'
];

export const detectIntent = (messageText = '', history = [], lead = {}) => {
    const text = normalizeLoose(messageText);
    if (!text) return 'unknown';

    // 1. Critical Safety & Boundaries
    if (includesAny(text, abusivePhrases)) return 'abusive';
    if (includesAny(text, offTopicPhrases)) return 'off_topic';
    if (includesAny(text, personalQuestionPhrases)) return 'personal_question';

    // 2. High-Priority Payment Proof / Slip
    if (includesAny(text, PAYMENT_PROOF_PHRASES)) return 'payment_proof_submitted';

    // 3. Talk to Support / Human
    if (includesAny(text, TALK_TO_SUPPORT_PHRASES)) return 'talk_to_support';

    // 4. Buy PDF Book & Payment Details
    if (includesAny(text, BUY_PDF_BOOK_PHRASES)) return 'buy_pdf_book';

    // 5. PDF Book General Inquiry
    if (includesAny(text, PDF_BOOK_PHRASES)) return 'ask_pdf_book';

    // 6. Specific Subject MCQs (Check before general MCQs)
    const isSubjectMcq = includesAny(text, SUBJECT_MCQ_PHRASES) || (includesAny(text, SUBJECT_KEYWORDS) && includesAny(text, ['mcq', 'mcqs', 'quiz', 'quizzes', 'question', 'bank', 'tayari', 'tayyari', 'practice']));
    if (isSubjectMcq) return 'ask_subject_mcq';

    // 7. Typing Speed Coaching (How to increase speed)
    if (includesAny(text, TYPING_COACHING_PHRASES)) return 'ask_typing_coaching';

    // 8. Specific Department LDC / UDC
    if (includesAny(text, DEPARTMENT_LDC_PHRASES) || (includesAny(text, ['ghq', 'mod', 'fbr', 'police', 'mes', 'paf', 'navy', 'railway']) && includesAny(text, ['ldc', 'udc', 'typing', 'speed', 'test', 'criteria']))) {
        return 'ask_department_ldc';
    }

    // 9. General Typing Speed Passing Criteria for LDC / UDC
    if (includesAny(text, TYPING_SPEED_LDC_UDC_PHRASES) || (includesAny(text, ['ldc', 'udc', 'clerk']) && includesAny(text, ['speed', 'wpm', 'typing']))) {
        return 'ask_typing_speed_ldc_udc';
    }

    // 10. General Typing Test Tools
    if (includesAny(text, TYPING_TEST_PHRASES)) return 'ask_typing_test';

    // 11. General MCQs Bank
    if (includesAny(text, MCQS_PHRASES)) return 'ask_mcqs';

    // 12. Daily Drill
    if (includesAny(text, DAILY_DRILL_PHRASES)) return 'ask_daily_drill';

    // 13. CBT Exam Prep Tracks
    if (includesAny(text, EXAM_PREP_PHRASES)) return 'ask_exam_prep';

    // 14. Free Platform / Pricing Check
    if (includesAny(text, PRICING_FREE_PHRASES)) return 'ask_pricing';

    // 15. Dashboard & Streaks
    if (includesAny(text, DASHBOARD_STREAKS_PHRASES)) return 'ask_dashboard_streaks';

    // 16. Greeting
    if (includesAny(text, GREETING_PHRASES)) return 'greeting';

    return 'unknown';
};

export const inferLeadUpdateFromMessage = (messageText = '', lead = {}) => {
    const text = normalizeLoose(messageText);
    const update = {};

    // Exam Extraction
    if (includesAny(text, ['ghq ldc', 'ghq'])) update.targetExam = 'GHQ LDC (BPS-11)';
    else if (includesAny(text, ['mod ldc', 'mod', 'defence'])) update.targetExam = 'MOD Clerical / LDC';
    else if (includesAny(text, ['islamabad police', 'police book', 'police', 'asi'])) update.targetExam = 'Islamabad Police ASI/LDC/UDC';
    else if (includesAny(text, ['fbr ldc', 'fbr'])) update.targetExam = 'FBR LDC/UDC';
    else if (includesAny(text, ['ldc', 'lower division clerk'])) update.targetExam = 'LDC (BPS-11)';
    else if (includesAny(text, ['udc', 'upper division clerk'])) update.targetExam = 'UDC (BPS-13/14)';
    else if (includesAny(text, ['fpsc'])) update.targetExam = 'FPSC One Paper';
    else if (includesAny(text, ['ppsc'])) update.targetExam = 'PPSC Screening';
    else if (includesAny(text, ['nadra', 'deo'])) update.targetExam = 'NADRA DEO';
    else if (includesAny(text, ['nts'])) update.targetExam = 'NTS Screening';

    // Subject Extraction
    if (includesAny(text, ['computer', 'ms office', 'information technology']) || /\b(it|comp)\b/i.test(text)) update.subjectInterest = 'Computer Knowledge';
    else if (includesAny(text, ['english', 'grammar', 'vocab', 'preposition'])) update.subjectInterest = 'English';
    else if (includesAny(text, ['math', 'mathematics', 'arithmetic', 'algebra'])) update.subjectInterest = 'Mathematics';
    else if (includesAny(text, ['pak study', 'pak studies', 'pakistan studies'])) update.subjectInterest = 'Pakistan Studies';
    else if (includesAny(text, ['islamiat', 'islamic studies', 'islamic'])) update.subjectInterest = 'Islamic Studies';
    else if (includesAny(text, ['everyday science', 'science mcq', 'science'])) update.subjectInterest = 'Everyday Science';
    else if (includesAny(text, ['general knowledge', 'gk mcq', 'gk'])) update.subjectInterest = 'General Knowledge';
    else if (includesAny(text, ['current affairs', 'affairs'])) update.subjectInterest = 'Current Affairs';

    // WPM Extraction
    const wpmMatch = text.match(/\b(\d{2,3})\s*(?:wpm|words per minute|speed)\b/i);
    if (wpmMatch) update.targetWpm = `${wpmMatch[1]} WPM`;

    // Book Interest
    if (includesAny(text, ['book', 'pdf', 'notes', '300', 'islamabad police book'])) {
        update.bookInterested = true;
    }

    // Payment Submitted
    if (includesAny(text, PAYMENT_PROOF_PHRASES)) {
        update.paymentSubmitted = true;
    }

    // Name Extraction
    const nameMatch = messageText.match(/(?:mera naam|my name is|naam|name)\s*(?:hai|is|:)?\s*([a-zA-Z\s]{2,25})/i);
    if (nameMatch && nameMatch[1].trim().length >= 2) {
        update.name = toTitleCase(nameMatch[1].trim());
    }

    return update;
};

export const inferLeadUpdateFromIntent = (intent, userMessage, lead = {}) => {
    return inferLeadUpdateFromMessage(userMessage, lead);
};

export const getStageForLead = (lead = {}) => {
    if (lead.isAIPaused || lead.aiPaused) return LEAD_STAGES.HANDED_OFF;
    if (lead.paymentSubmitted) return LEAD_STAGES.PAYMENT_SUBMITTED;
    if (lead.bookInterested) return LEAD_STAGES.BOOK_INTERESTED;
    if (lead.targetExam) return LEAD_STAGES.TARGET_EXAM_IDENTIFIED;
    if (lead.subjectInterest || lead.targetWpm) return LEAD_STAGES.EXPLORING_TOOLS;
    return LEAD_STAGES.NEW;
};

export const calculateLeadScore = (lead = {}) => {
    let score = 10;
    if (lead.name) score += 15;
    if (lead.targetExam) score += 25;
    if (lead.targetWpm || lead.subjectInterest) score += 20;
    if (lead.bookInterested) score += 15;
    if (lead.paymentSubmitted) score = 100;
    return Math.min(100, score);
};

export const buildLeadSummary = (lead = {}) => {
    const parts = [];
    if (lead.name) parts.push(`Name: ${lead.name}`);
    if (lead.targetExam) parts.push(`Target Exam: ${lead.targetExam}`);
    if (lead.targetWpm) parts.push(`Target Speed: ${lead.targetWpm}`);
    if (lead.subjectInterest) parts.push(`Subject: ${lead.subjectInterest}`);
    if (lead.bookInterested) parts.push(`Book Interested: Yes (Rs. 300)`);
    if (lead.paymentSubmitted) parts.push(`Payment Status: Receipt Submitted`);
    return parts.join(' | ') || 'New visitor exploring TestTayar tools';
};

/**
 * Rule-Based Fallback Responses for TestTayar.pk
 */
export const getRuleBasedAssistantResponse = (arg1, arg2 = '', arg3 = {}, arg4 = []) => {
    let intent = arg1;
    let userMessage = arg2;
    let lead = arg3;
    let history = arg4;

    if (arg1 && typeof arg1 === 'object') {
        intent = arg1.intent;
        userMessage = arg1.messageText || arg1.userMessage || '';
        lead = arg1.lead || arg1.parsedLead || {};
        history = arg1.history || [];
    }

    const k = TESTTAYAR_KNOWLEDGE;
    const text = normalizeLoose(userMessage);

    switch (intent) {
        case 'greeting':
            return {
                reply: `Walaikum Assalam! TestTayar par khushamdeed. Main aapki typing test ya kisi exam preparation mein kya madad kar sakta hoon?`,
                intent: 'greeting',
                pauseAI: false
            };

        case 'ask_typing_coaching':
            return {
                reply: `Typing speed barhane ke liye pehle tez type karne ke bajaye 95%+ accuracy par focus karein. Fingers ko hamesha Home Row (ASDF - JKL;) par rakhein aur keyboard ki taraf dekhne se parhez karein. Abhi aapki average speed kitni aa rahi hai? Practice shuru karein: ${k.typingTestUrl}`,
                intent: 'ask_typing_coaching',
                pauseAI: false
            };

        case 'ask_department_ldc':
            if (includesAny(text, ['ghq', 'mod'])) {
                return {
                    reply: `GHQ aur MOD clerical (LDC) test ke liye standard 30 WPM passing speed hoti hai, lekin safe merit ke liye 35+ WPM target karein kyunke wahan accuracy par strict checking hoti hai. TestTayar ka No-Backspace MOD simulator try karein: ${k.typingTestUrl}/mod`,
                    intent: 'ask_department_ldc',
                    pauseAI: false
                };
            }
            if (includesAny(text, ['police', 'islamabad police'])) {
                return {
                    reply: `Islamabad Police / Provincial Police LDC ke liye 30 WPM aur UDC ke liye 40 WPM required hai. 100 MCQs written paper ki tayari ke liye hamara exam simulator dekhein: ${k.mainWebsiteUrl}/ldc-test`,
                    intent: 'ask_department_ldc',
                    pauseAI: false
                };
            }
            if (includesAny(text, ['ppsc'])) {
                return {
                    reply: `PPSC Junior Clerk (BPS-11) ke liye 25-30 WPM English typing + MS Office proficiency test hota hai, aur written exam mein -0.25 negative marking hoti hai: ${k.mainWebsiteUrl}/ppsc-one-paper-test`,
                    intent: 'ask_department_ldc',
                    pauseAI: false
                };
            }
            return {
                reply: `Federal aur provincial departments (FBR, MES, Railway, Ministries) mein LDC (BPS-11) ke liye minimum 30 WPM (90%+ accuracy) aur UDC ke liye 30-40+ WPM required hoti hai. Specific room yahan try karein: ${k.typingTestUrl}/ldc`,
                intent: 'ask_department_ldc',
                pauseAI: false
            };

        case 'ask_typing_test':
            return {
                reply: `TestTayar par 1 se 10 minute tak ka touch-typing test bilkul free available hai jisme real-time WPM, Accuracy aur No-Backspace mode shamil hai. Practice shuru karein: ${k.typingTestUrl}`,
                intent: 'ask_typing_test',
                pauseAI: false
            };

        case 'ask_typing_speed_ldc_udc':
            return {
                reply: `Federal aur provincial jobs ke liye LDC (BPS-11) ke liye minimum 30 WPM (90%+ accuracy) aur UDC (BPS-13/14) ke liye 30-40+ WPM required hoti hai. Aap LDC/UDC specific typing simulator yahan try kar sakte hain: ${k.typingTestUrl}/ldc`,
                intent: 'ask_typing_speed_ldc_udc',
                pauseAI: false
            };

        case 'ask_subject_mcq':
        case 'ask_mcqs':
            return {
                reply: `TestTayar par 8 core subjects (English, Computer, Math, Pak Studies, Islamiat, Everyday Science, GK, Current Affairs) ke timed practice quizzes aur solved directories available hain: ${k.mcqsUrl}`,
                intent: 'ask_mcqs',
                pauseAI: false
            };

        case 'ask_daily_drill':
            return {
                reply: `Daily Drill ek 3-stage routine hai jisme 1-minute typing test + 10 mixed MCQs attempt karke aap apna Combined Readiness Score check kar sakte hain: ${k.dailyDrillUrl}`,
                intent: 'ask_daily_drill',
                pauseAI: false
            };

        case 'ask_exam_prep':
            return {
                reply: `Hamare CBT Exam Simulators me LDC, UDC, MOD, NADRA, FPSC One Paper aur PPSC (with -0.25 negative marking) shamil hain. Complete tracks yahan dekhein: ${k.testPreparationUrl}`,
                intent: 'ask_exam_prep',
                pauseAI: false
            };

        case 'ask_pdf_book': {
            const hasPost = Boolean(lead?.targetExam) || includesAny(text, ['police', 'asi', 'ghq', 'mod', 'ldc', 'udc', 'fia', 'asf', 'clerk', 'deo']);
            if (!hasPost) {
                return {
                    reply: `Aap kis post ya department (e.g. GHQ LDC, Islamabad Police, FIA, MOD, Clerical) ke liye preparation book / notes chahte hain?`,
                    intent: 'ask_pdf_book',
                    pauseAI: false
                };
            }

            const isUniform = includesAny(text, ['police', 'asi', 'fia', 'asf']) || (lead?.targetExam && includesAny(lead.targetExam.toLowerCase(), ['police', 'asi', 'fia', 'asf']));
            const packageDesc = isUniform
                ? 'Isme relevant laws & acts, is month ke updated current affairs, General Knowledge, past papers ke solved MCQs aur short notes shamil hain.'
                : 'Isme past papers ke solved MCQs, short revision notes, GK & is month ke updated current affairs, complete computer knowledge aur typing test guidelines shamil hain.';

            return {
                reply: `${packageDesc}\n\n*Price:* Rs. 300 only\n\n*JazzCash:*\nAccount Title: MUHAMMAD SAMI\nNumber: \`03039512277\` (Tap to copy)\n\n*Meezan Bank:*\nAccount Title: MUHAMMAD SAMI\nAccount Number: \`01990112309796\` (Tap to copy)\nIBAN: \`PK69MEZN0001990112309796\` (Tap to copy)\n\nPayment bhej kar screenshot isi chat par share karein, PDF book foran deliver kar di jayegi.`,
                intent: 'ask_pdf_book',
                pauseAI: false
            };
        }

        case 'buy_pdf_book':
            return {
                reply: `Rs. 300 PDF Book payment ke liye account details:\n\n*JazzCash:*\nAccount Title: MUHAMMAD SAMI\nNumber: \`03039512277\` (Tap to copy)\n\n*Meezan Bank:*\nAccount Title: MUHAMMAD SAMI\nAccount Number: \`01990112309796\` (Tap to copy)\nIBAN: \`PK69MEZN0001990112309796\` (Tap to copy)\n\nPayment bhej kar screenshot isi chat par share karein, PDF book foran deliver kar di jayegi.`,
                intent: 'buy_pdf_book',
                pauseAI: false
            };

        case 'payment_proof_submitted':
            return {
                reply: `Bohat shukriya! Main screenshot verify karke aapko PDF book yahan WhatsApp par deliver kar raha hoon. [PAUSE]`,
                intent: 'payment_proof_submitted',
                pauseAI: true,
                handoffReason: 'Payment proof submitted for PDF Book'
            };

        case 'talk_to_support':
            return {
                reply: `Jee bilkul! Main ye chat admin / support team ko forward kar raha hoon. Wo jald hi aap se isi WhatsApp par rabta karenge. [PAUSE]`,
                intent: 'talk_to_support',
                pauseAI: true,
                handoffReason: 'User requested human support'
            };

        case 'ask_pricing':
            return {
                reply: `TestTayar website par all typing tests, subject MCQs aur daily drills 100% bilkul free hain! Sirf optional preparation notes / solved PDF book aapki specific post ke mutabiq Rs. 300 mein provide ki jaati hai.`,
                intent: 'ask_pricing',
                pauseAI: false
            };

        case 'ask_dashboard_streaks':
            return {
                reply: `Guest mode mein practice bilkul free hai. Lekin free account banane se aapki daily streaks save rehti hain aur wrong questions ko revision ke liye bookmark kar sakte hain: ${k.dashboardUrl}`,
                intent: 'ask_dashboard_streaks',
                pauseAI: false
            };

        case 'off_topic':
            return {
                reply: `Main sirf TestTayar.pk ki test preparation, typing tests aur subject MCQs ke baare mein guide kar sakta hoon. Aap kisi specific government exam ya typing practice ke baare mein kuch poochna chahte hain?`,
                intent: 'off_topic',
                pauseAI: false
            };

        case 'personal_question':
            return {
                reply: `Main TestTayar.pk ka official AI Assistant hoon. Main typing tests, MCQs practice, syllabus aur Rs. 300 preparation PDF book ke baare mein guide kar sakta hoon.`,
                intent: 'personal_question',
                pauseAI: false
            };

        case 'abusive':
            return {
                reply: `Kripya shaishta zaban istemal karein taake hum aapki test preparation mein sahi madad kar sakein. [PAUSE]`,
                intent: 'abusive',
                pauseAI: true,
                handoffReason: 'Abusive language detected'
            };

        default:
            return {
                reply: `TestTayar.pk par aap Typing Tests (${k.typingTestUrl}), Subject MCQs (${k.mcqsUrl}) ya Daily Drill (${k.dailyDrillUrl}) free practice kar sakte hain. Kisi specific exam ke baare mein janna chahte hain?`,
                intent: 'unknown',
                pauseAI: false
            };
    }
};

export const sanitizeAssistantReply = (reply = '') => {
    return reply.replace(/\[PAUSE\]/gi, '').trim();
};

export const getPauseReasonType = (reason = '') => {
    const text = normalizeText(reason);
    if (SAFETY_CONFUSION_PAUSE_REASONS.some((r) => text.includes(normalizeText(r)))) return 'safety';
    if (SERIOUS_LEAD_PAUSE_REASONS.some((r) => text.includes(normalizeText(r)))) return 'lead';
    return 'general';
};

export const getPausedSafeAssistantResponse = (messageText = '', reason = '') => {
    return 'Aap ka message receive ho chuka hai. Representative jald aap ko reply karenge.';
};

export const getPausedAutoResumeStatus = (userContext = {}) => {
    if (!userContext.isAIPaused && !userContext.aiPaused) {
        return { shouldResume: false, hoursRemaining: 0 };
    }
    const pausedAt = userContext.aiPausedAt ? new Date(userContext.aiPausedAt) : new Date();
    const elapsedHours = (Date.now() - pausedAt.getTime()) / (1000 * 60 * 60);
    const shouldResume = elapsedHours >= AUTO_RESUME_STALE_PAUSE_HOURS;
    const hoursRemaining = Math.max(0, Math.ceil(AUTO_RESUME_STALE_PAUSE_HOURS - elapsedHours));
    return { shouldResume, hoursRemaining };
};
