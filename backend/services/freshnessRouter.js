/**
 * TestTayar.pk - Universal Freshness & Search Router
 * 
 * In modern LLM architecture, we do NOT gatekeep with brittle regexes.
 * Every user question (regardless of typos, slang, or language) triggers live research,
 * while pure 1-word greetings or payment slips respond instantly.
 */

export const isSearchRequired = (messageText = '', context = {}) => {
    const text = (messageText || '').trim();
    if (!text) return { required: false, reasons: [] };

    // ONLY skip search for pure standalone greetings, short single-word messages, or payment slips
    const isPureGreeting = /^(hi|hello|hey|salam|aoa|assalam o alaikum|walikum asalam|hola|shukriya|thanks|thank you|ok|theek hai|kuch nahi|kuch nahi kro|rehn do)\s*$/i.test(text);
    const isPurePaymentProof = /^(screenshot|screen shot|slip|receipt|paid|done payment|done pavement|300 bhej diye)\s*$/i.test(text);

    if (isPureGreeting || isPurePaymentProof) {
        return {
            required: false,
            reasons: ['routine_greeting_or_payment_proof']
        };
    }

    // For ALL OTHER questions, inquiries, and conversations -> ALWAYS SEARCH LIVE WEB
    return {
        required: true,
        reasons: ['universal_live_research']
    };
};
