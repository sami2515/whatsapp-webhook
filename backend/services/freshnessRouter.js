/**
 * TestTayar.pk - Freshness & Search Router
 * 
 * Determines whether an incoming message requires real-time web research
 * or if it can be reliably answered from permanent knowledge / instant rule paths.
 */

const SEARCH_REQUIRED_PATTERNS = [
    // 1. Date & Schedule Queries
    /\b(schedule|date|dates|last date|deadline|kab hoga|kab ha|kab hai|timing|timetable)\b/i,
    /\b(2027|2028|2029|next year|future|upcoming)\b/i,
    /\b(latest|current|abhi|is saal|this year|recent|new policy)\b/i,

    // 2. Admission & Intake Queries
    /\b(admission|admissions|admissions open|intake|spring|fall|apply online|registration open)\b/i,
    /\b(eligibility|criteria|minimum marks|percentage|required marks|merit|closing merit|fee|fees|fee structure)\b/i,

    // 3. Program & University Policy Specifics
    /\b(is this offered|offer hota hai|kis campus mein|campuses|available programs|prospectus)\b/i,
    /\b(accept karta hai|accept hota hai|valid hai|equivalent)\b/i,
    /\b(result date|merit list|aggregate formula|how aggregate)\b/i
];

const SEARCH_NOT_REQUIRED_PATTERNS = [
    // Simple greetings
    /^(hi|hello|hey|salam|aoa|assalam o alaikum|walikum asalam|hola|kia hal hai|kese ho)\s*$/i,

    // Pure Typing Coaching & Speed Rules
    /\b(speed kaise barhaen|typing tips|mistakes kam|home row|accuracy|finger placement)\b/i,

    // Pure Payment Receipt & Proof Handoff
    /\b(screenshot|screen shot|slip|receipt|paid|done payment|done pavement|300 bhej diye|jazzcash kar diya)\b/i,

    // Human Support Handoff
    /\b(talk to human|admin se baat|call me|support number)\b/i
];

export const isSearchRequired = (messageText = '', context = {}) => {
    const text = (messageText || '').trim();
    if (!text) return { required: false, reasons: [] };

    // 1. If explicit non-search pattern matches with no freshness keywords, skip
    const isPureSkip = SEARCH_NOT_REQUIRED_PATTERNS.some((p) => p.test(text));
    const hasFreshnessKeyword = SEARCH_REQUIRED_PATTERNS.some((p) => p.test(text));

    if (isPureSkip && !hasFreshnessKeyword) {
        return {
            required: false,
            reasons: ['matches_routine_conversation_or_handoff']
        };
    }

    // 2. Check for freshness triggers
    const matchedReasons = [];
    if (/\b(2027|2028|2029|next year)\b/i.test(text)) matchedReasons.push('future_schedule_check');
    if (/\b(schedule|date|dates|kab hoga|kab hai|deadline|last date)\b/i.test(text)) matchedReasons.push('live_schedule_verification');
    if (/\b(admission|admissions open|intake|merit|fee|closing merit)\b/i.test(text)) matchedReasons.push('university_admission_policy');
    if (/\b(eligibility|percentage|criteria|accept karta hai|valid hai)\b/i.test(text)) matchedReasons.push('eligibility_verification');

    if (hasFreshnessKeyword || matchedReasons.length > 0) {
        return {
            required: true,
            reasons: matchedReasons.length > 0 ? matchedReasons : ['general_freshness_inquiry']
        };
    }

    // 3. Fallback: If student mentioned university or specific degree with uncertainty, search
    if (/\b(comsats|nust|fast|uet|pu|pharm-d|pharmacy|mbbs|dpt)\b/i.test(text) && /\b(kya|kaise|bata dein|guide|info)\b/i.test(text)) {
        return {
            required: true,
            reasons: ['university_program_inquiry']
        };
    }

    return {
        required: false,
        reasons: ['stable_knowledge_sufficient']
    };
};
