/**
 * TestTayar.pk - Student Academic Profile & Entity Extractor
 * 
 * Extracts and maintains student academic context across multi-turn WhatsApp chats.
 * Robust to Roman Urdu spelling mistakes, typos, and shorthand (e.g. "Parm D", "NTS _ M").
 */

const normalizeText = (text = '') => {
    return text
        .toLowerCase()
        .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
};

export const extractStudentProfile = (messageText = '', previousProfile = {}) => {
    const raw = messageText || '';
    const text = normalizeText(raw);
    const profile = { ...previousProfile };

    // 1. Education Level
    if (/\b(intermediate|inter|fsc|f\.sc|12th|hssc|a[- ]?levels?)\b/i.test(text)) {
        profile.education = 'Intermediate';
    } else if (/\b(matric|10th|ssc|o[- ]?levels?)\b/i.test(text)) {
        profile.education = 'Matriculation';
    } else if (/\b(bachelor|bs|ba|bsc|graduation)\b/i.test(text)) {
        profile.education = 'Bachelors';
    }

    // 2. Study Group
    if (/\b(pre[- ]?medical|medical|bio|biology)\b/i.test(text)) {
        profile.group = 'Pre-Medical';
    } else if (/\b(pre[- ]?eng(?:ineering)?|engineering)\b/i.test(text)) {
        profile.group = 'Pre-Engineering';
    } else if (/\b(ics|computer science|cs group)\b/i.test(text)) {
        profile.group = 'ICS / Computer Science';
    } else if (/\b(icom|i\.com|commerce)\b/i.test(text)) {
        profile.group = 'I.Com / Commerce';
    } else if (/\b(arts|fa|f\.a|humanities)\b/i.test(text)) {
        profile.group = 'Arts / Humanities';
    }

    // 3. Target Degree
    if (/\b(pharm[- ]?d|parm[- ]?d|pharmacy|doctor of pharmacy)\b/i.test(text)) {
        profile.targetDegree = 'Pharm-D';
    } else if (/\b(dpt|doctor of physical therapy|physiotherapy)\b/i.test(text)) {
        profile.targetDegree = 'DPT';
    } else if (/\b(bs[- ]?cs|computer science|cs)\b/i.test(text)) {
        profile.targetDegree = 'BS Computer Science';
    } else if (/\b(bs[- ]?se|software engineering|se)\b/i.test(text)) {
        profile.targetDegree = 'BS Software Engineering';
    } else if (/\b(llb|law|5 years? law)\b/i.test(text)) {
        profile.targetDegree = 'LLB (5 Years)';
    } else if (/\b(mbbs|bds|medical college)\b/i.test(text)) {
        profile.targetDegree = 'MBBS/BDS';
    } else if (/\b(bba|bs accounting|finance)\b/i.test(text)) {
        profile.targetDegree = 'BBA / Accounting & Finance';
    }

    // 4. Target University
    if (/\b(comsats|cui|comsat)\b/i.test(text)) {
        profile.university = 'COMSATS';
    } else if (/\b(nust)\b/i.test(text)) {
        profile.university = 'NUST';
    } else if (/\b(fast|nu|nuces)\b/i.test(text)) {
        profile.university = 'FAST NUCES';
    } else if (/\b(uet)\b/i.test(text)) {
        profile.university = 'UET';
    } else if (/\b(punjab university|pu)\b/i.test(text)) {
        profile.university = 'Punjab University';
    } else if (/\b(qau|quaid[- ]?e[- ]?azam)\b/i.test(text)) {
        profile.university = 'Quaid-e-Azam University';
    }

    // 5. Test Inference & Explicit Test Group
    if (/\b(nts[ _-]?m|nat[ _-]?m|nat[ _-]?im|nts medical)\b/i.test(text)) {
        profile.likelyTest = 'NAT-IM';
    } else if (/\b(nts[ _-]?e|nat[ _-]?e|nat[ _-]?ie|nts engineering)\b/i.test(text)) {
        profile.likelyTest = 'NAT-IE';
    } else if (/\b(nts[ _-]?ics|nat[ _-]?ics)\b/i.test(text)) {
        profile.likelyTest = 'NAT-ICS';
    } else if (/\b(gat|gat general|gat subject)\b/i.test(text)) {
        profile.likelyTest = 'GAT';
    } else if (/\b(lat|law admission test)\b/i.test(text)) {
        profile.likelyTest = 'LAT';
    } else if (/\b(mdcat|pmdc)\b/i.test(text)) {
        profile.likelyTest = 'MDCAT';
    } else if (/\b(usat)\b/i.test(text)) {
        profile.likelyTest = 'USAT';
    } else if (!profile.likelyTest) {
        // Infer likely NAT category from study group or degree
        if (profile.group === 'Pre-Medical' || profile.targetDegree === 'Pharm-D' || profile.targetDegree === 'DPT') {
            profile.likelyTest = 'NAT-IM';
        } else if (profile.group === 'Pre-Engineering') {
            profile.likelyTest = 'NAT-IE';
        } else if (profile.group === 'ICS / Computer Science') {
            profile.likelyTest = 'NAT-ICS';
        }
    }

    // 6. Target Years / Intake
    const years = [];
    if (/\b(2026)\b/.test(text)) years.push(2026);
    if (/\b(2027)\b/.test(text)) years.push(2027);
    if (/\b(2028)\b/.test(text)) years.push(2028);
    if (years.length > 0) {
        profile.requestedYears = years;
    }

    if (/\b(fall|autumn)\b/i.test(text)) profile.targetIntake = 'Fall';
    if (/\b(spring)\b/i.test(text)) profile.targetIntake = 'Spring';

    return profile;
};
