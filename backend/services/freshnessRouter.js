/**
 * TestTayar.pk - Freshness & Search Router
 * 
 * Determines whether an incoming message requires real-time web research
 * or if it can be reliably answered from permanent knowledge / instant rule paths.
 */

const SEARCH_REQUIRED_PATTERNS = [
    // 1. Date, Schedule & Deadline Queries (including typos like 'kb ha', 'kab tk')
    /\b(schedule|date|dates|last date|deadline|kab hoga|kb hoga|kab ha|kb ha|kab hai|kb hai|kab tk|kb tk|timing|timetable|kab start|start kab|kab open|open kab)\b/i,
    /\b(2025|2026|2027|2028|2029|next year|future|upcoming)\b/i,
    /\b(latest|current|curent|abhi|is saal|this year|recent|new policy|update|updates)\b/i,

    // 2. Admission, Dakhla & Intake Queries (including typos like 'amission', 'admisn')
    /\b(admission|admissions|amission|admisn|dakhla|dakhlay|intake|spring|fall|autumn|apply online|registration open|portal)\b/i,
    /\b(eligibility|criteria|minimum marks|percentage|required marks|merit|closing merit|fee|fees|fee structure)\b/i,

    // 3. Results & Board Announcements (BIEK, FBISE, BISE, Entry Tests)
    /\b(result|rsult|results|result agya|agya result|kab aya|aya result|gazette|announcement|announced)\b/i,
    /\b(biek|fbise|bise|karachi board|lahore board|federal board)\b/i,

    // 4. Jobs & Vacancies (Current jobs, Sindh jobs, screening test queries)
    /\b(jobs?|curent jobs|current jobs|asami|asamiyan|bharti|vacanc(?:y|ies)|walk in interview|without test|bina test|screening test|siba|sts)\b/i,

    // 5. University, Testing Agency & Program Names
    /\b(aiou|allama iqbal open university|vu|virtual university|comsats|nust|fast|uet|pu|qau|lums|iba|giki|pieas|bzu|uos|uog)\b/i,
    /\b(adp|b\.?ed|m\.?phil|phd|llb|lat|mdcat|nums|ecat|fpsc|ppsc|spsc|kppsc|bpsc|fia|asf)\b/i
];

const SEARCH_NOT_REQUIRED_PATTERNS = [
    // Simple greetings
    /^(hi|hello|hey|salam|aoa|assalam o alaikum|walikum asalam|hola|kia hal hai|kese ho)\s*$/i,

    // Pure Typing Coaching & Speed Rules (when no test date is mentioned)
    /\b(speed kaise barhaen|typing tips|mistakes kam|home row|accuracy|finger placement)\b/i,

    // Pure Payment Receipt & Proof Handoff
    /\b(screenshot|screen shot|slip|receipt|paid|done payment|done pavement|300 bhej diye|jazzcash kar diya)\b/i,

    // Human Support Handoff
    /\b(talk to human|admin se baat|call me|support number)\b/i
];

export const isSearchRequired = (messageText = '', context = {}) => {
    const text = (messageText || '').trim();
    if (!text) return { required: false, reasons: [] };

    // 1. If message contains date, schedule, job, or admission question, SEARCH ALWAYS WINS
    const hasFreshnessKeyword = SEARCH_REQUIRED_PATTERNS.some((p) => p.test(text));
    const isPureHandoff = /^(screenshot|slip|receipt|done payment|paid|talk to human|admin se baat)\b/i.test(text);

    if (isPureHandoff && !hasFreshnessKeyword) {
        return {
            required: false,
            reasons: ['matches_payment_or_handoff']
        };
    }

    if (hasFreshnessKeyword) {
        return {
            required: true,
            reasons: ['matches_freshness_or_academic_inquiry']
        };
    }

    // 2. If student profile already has university/exam/board and user asks a follow-up question
    if ((context.university || context.targetExam || context.targetDegree || context.board || context.testingAgency) &&
        /\b(btao|batao|kab|ky lie|start|info|detail|details|dates?|marks|criteria)\b/i.test(text)) {
        return {
            required: true,
            reasons: ['context_inherited_freshness_inquiry']
        };
    }

    return {
        required: false,
        reasons: ['routine_conversation']
    };
};
