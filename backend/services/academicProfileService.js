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

    // 3. Target Degree & Job Posts
    if (/\b(pharm[- ]?d|parm[- ]?d|pharmacy|doctor of pharmacy)\b/i.test(text)) {
        profile.targetDegree = 'Pharm-D';
    } else if (/\b(dpt|doctor of physical therapy|physiotherapy)\b/i.test(text)) {
        profile.targetDegree = 'DPT';
    } else if (/\b(adp|ada|ads|adc|associate degree)\b/i.test(text)) {
        profile.targetDegree = 'ADP (Associate Degree Program)';
    } else if (/\b(bed|b\.ed|med|m\.ed)\b/i.test(text)) {
        profile.targetDegree = 'B.Ed';
    } else if (/\b(bs[- ]?cs|computer science|cs)\b/i.test(text)) {
        profile.targetDegree = 'BS Computer Science';
    } else if (/\b(bs[- ]?se|software engineering|se)\b/i.test(text)) {
        profile.targetDegree = 'BS Software Engineering';
    } else if (/\b(bs[- ]?ai|b\.s[- ]?ai|degree in ai|artificial intelligence)\b/i.test(text)) {
        profile.targetDegree = 'BS Artificial Intelligence';
    } else if (/\b(bs[- ]?data science|data science|ds)\b/i.test(text)) {
        profile.targetDegree = 'BS Data Science';
    } else if (/\b(llb|law|5 years? law)\b/i.test(text)) {
        profile.targetDegree = 'LLB (5 Years)';
    } else if (/\b(mbbs|bds|medical college|doctor)\b/i.test(text)) {
        profile.targetDegree = 'MBBS/BDS';
    } else if (/\b(bba|bs accounting|finance)\b/i.test(text)) {
        profile.targetDegree = 'BBA / Accounting & Finance';
    } else if (/\b(ldc|lower division clerk)\b/i.test(text)) {
        profile.targetDegree = 'LDC (BPS-11)';
    } else if (/\b(udc|upper division clerk)\b/i.test(text)) {
        profile.targetDegree = 'UDC (BPS-13/14)';
    } else if (/\b(asi|assistant sub[- ]?inspector)\b/i.test(text)) {
        profile.targetDegree = 'Assistant Sub-Inspector (ASI)';
    } else if (/\b(si|sub[- ]?inspector)\b/i.test(text)) {
        profile.targetDegree = 'Sub-Inspector (SI)';
    } else if (/\b(inspector custom|appraising officer|custom inspector)\b/i.test(text)) {
        profile.targetDegree = 'Inspector Customs / Appraising Officer';
    } else if (/\b(assistant director|ad)\b/i.test(text)) {
        profile.targetDegree = 'Assistant Director (AD)';
    } else if (/\b(tehsildar|naib tehsildar)\b/i.test(text)) {
        profile.targetDegree = 'Tehsildar / Naib Tehsildar';
    }

    // 4. Target University & Testing Commissions & Boards
    if (/\b(aiou|allama iqbal open university|open university)\b/i.test(text)) {
        profile.university = 'AIOU';
    } else if (/\b(vu|virtual university)\b/i.test(text)) {
        profile.university = 'Virtual University';
    } else if (/\b(comsats|cui|comsat)\b/i.test(text)) {
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
    } else if (/\b(lums)\b/i.test(text)) {
        profile.university = 'LUMS';
    } else if (/\b(iba)\b/i.test(text)) {
        profile.university = 'IBA Karachi';
    } else if (/\b(pieas)\b/i.test(text)) {
        profile.university = 'PIEAS';
    } else if (/\b(giki)\b/i.test(text)) {
        profile.university = 'GIKI';
    } else if (/\b(ned)\b/i.test(text)) {
        profile.university = 'NED University';
    } else if (/\b(bzu|bahauddin zakariya)\b/i.test(text)) {
        profile.university = 'BZU';
    } else if (/\b(uos|university of sargodha)\b/i.test(text)) {
        profile.university = 'UOS';
    } else if (/\b(uog|university of gujrat)\b/i.test(text)) {
        profile.university = 'UOG';
    }

    // Education Boards (BIEK, FBISE, BISE)
    if (/\b(biek|karachi board|bsek)\b/i.test(text)) {
        profile.board = 'BIEK Karachi';
    } else if (/\b(fbise|federal board)\b/i.test(text)) {
        profile.board = 'FBISE Federal Board';
    } else if (/\b(biselahore|lahore board)\b/i.test(text)) {
        profile.board = 'BISE Lahore';
    } else if (/\b(biserwp|rawalpindi board)\b/i.test(text)) {
        profile.board = 'BISE Rawalpindi';
    } else if (/\b(bisefaisalabad|faisalabad board)\b/i.test(text)) {
        profile.board = 'BISE Faisalabad';
    } else if (/\b(bisemultan|multan board)\b/i.test(text)) {
        profile.board = 'BISE Multan';
    } else if (/\b(bisegujranwala|gujranwala board)\b/i.test(text)) {
        profile.board = 'BISE Gujranwala';
    } else if (/\b(bisesahiwal|sahiwal board)\b/i.test(text)) {
        profile.board = 'BISE Sahiwal';
    } else if (/\b(bisesargodha|sargodha board)\b/i.test(text)) {
        profile.board = 'BISE Sargodha';
    } else if (/\b(bisep|peshawar board)\b/i.test(text)) {
        profile.board = 'BISE Peshawar';
    } else if (/\b(bisehyd|hyderabad board|bisesukkur|sukkur board)\b/i.test(text)) {
        profile.board = 'Sindh BISE Board';
    } else if (/\b(biseqta|quetta board)\b/i.test(text)) {
        profile.board = 'BISE Quetta';
    }

    // Testing Agency
    if (/\b(fpsc)\b/i.test(text)) {
        profile.testingAgency = 'FPSC';
    } else if (/\b(ppsc)\b/i.test(text)) {
        profile.testingAgency = 'PPSC';
    } else if (/\b(spsc)\b/i.test(text)) {
        profile.testingAgency = 'SPSC';
    } else if (/\b(kppsc)\b/i.test(text)) {
        profile.testingAgency = 'KPPSC';
    } else if (/\b(bpsc)\b/i.test(text)) {
        profile.testingAgency = 'BPSC';
    } else if (/\b(fia)\b/i.test(text)) {
        profile.testingAgency = 'FIA';
    } else if (/\b(asf)\b/i.test(text)) {
        profile.testingAgency = 'ASF';
    } else if (/\b(ghq|mod|ministry of defence)\b/i.test(text)) {
        profile.testingAgency = 'GHQ / MOD';
    } else if (/\b(police|islamabad police|punjab police|sindh police)\b/i.test(text)) {
        profile.testingAgency = 'Police Department';
    }

    // 5. Test Inference & Explicit Test Group
    if (/\b(nts[ _-]?m|nat[ _-]?m|nat[ _-]?im|nts medical)\b/i.test(text)) {
        profile.likelyTest = 'NAT-IM';
    } else if (/\b(nts[ _-]?e|nat[ _-]?e|nat[ _-]?ie|nts engineering)\b/i.test(text)) {
        profile.likelyTest = 'NAT-IE';
    } else if (/\b(nts[ _-]?ics|nat[ _-]?ics)\b/i.test(text)) {
        profile.likelyTest = 'NAT-ICS';
    } else if (/\b(nts[ _-]?icom|nat[ _-]?icom)\b/i.test(text)) {
        profile.likelyTest = 'NAT-ICOM';
    } else if (/\b(nts[ _-]?ia|nat[ _-]?ia)\b/i.test(text)) {
        profile.likelyTest = 'NAT-IA';
    } else if (/\b(gat|gat general|gat subject)\b/i.test(text)) {
        profile.likelyTest = 'GAT';
    } else if (/\b(lat|law admission test)\b/i.test(text)) {
        profile.likelyTest = 'LAT';
    } else if (/\b(mdcat|pmdc)\b/i.test(text)) {
        profile.likelyTest = 'MDCAT';
    } else if (/\b(nums)\b/i.test(text)) {
        profile.likelyTest = 'NUMS Entry Test';
    } else if (/\b(net|net-1|net-2|net-3|net-4)\b/i.test(text)) {
        profile.likelyTest = 'NUST NET';
    } else if (/\b(ecat)\b/i.test(text)) {
        profile.likelyTest = 'ECAT';
    } else if (/\b(usat)\b/i.test(text)) {
        profile.likelyTest = 'USAT';
    } else if (/\b(css)\b/i.test(text)) {
        profile.likelyTest = 'CSS CE';
    } else if (/\b(pms)\b/i.test(text)) {
        profile.likelyTest = 'PMS';
    } else if (!profile.likelyTest) {
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
    if (/\b(2025)\b/.test(text)) years.push(2025);
    if (/\b(2026)\b/.test(text)) years.push(2026);
    if (/\b(2027)\b/.test(text)) years.push(2027);
    if (/\b(2028)\b/.test(text)) years.push(2028);
    if (/\b(2029)\b/.test(text)) years.push(2029);
    if (years.length > 0) {
        profile.requestedYears = years;
    }

    if (/\b(fall|autumn)\b/i.test(text)) profile.targetIntake = 'Fall';
    if (/\b(spring)\b/i.test(text)) profile.targetIntake = 'Spring';

    return profile;
};
