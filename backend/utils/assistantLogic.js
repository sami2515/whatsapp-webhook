import { SAMI_KNOWLEDGE } from '../data/samiKnowledge.js';

export const LEAD_STAGES = {
    NEW: 'new',
    ASKED_PROJECT_TYPE: 'asked_project_type',
    ASKED_REQUIREMENTS: 'asked_requirements',
    ASKED_TIMELINE: 'asked_timeline',
    ASKED_BUDGET: 'asked_budget',
    QUALIFIED: 'qualified',
    HANDED_OFF: 'handed_off',
    UNCLEAR_WAITING: 'unclear_waiting',
    PERSONAL_BOUNDARY: 'personal_boundary',
    OFF_TOPIC_WAITING: 'off_topic_waiting'
};

const WEBSITE_BUILD_PLAN_TEXT = 'hi sami, i want a web development build plan.';
export const AUTO_RESUME_STALE_PAUSE_HOURS = 6;

const SAFETY_CONFUSION_PAUSE_REASONS = [
    'Repeated personal/private question',
    'Repeated unclear/off-topic messages',
    'Repeated confusion after clarification',
    'Abusive or inappropriate message'
];

const SERIOUS_LEAD_PAUSE_REASONS = [
    'Manually paused by admin',
    'Qualified lead asked for quote',
    'User requested call',
    'User requested meeting',
    'User wants to proceed',
    'Detailed build-plan form completed',
    'Lead score reached threshold',
    'Strong qualified lead reached threshold',
    'User requested human handoff',
    'User selected talk to Sami / urgent handoff',
    'User asked for a final quote after sharing lead details',
    'User asked to talk to Sami after sharing lead details',
    'User requested a call after sharing lead details'
];

const normalizeText = (text = '') => text.toLowerCase().replace(/\s+/g, ' ').trim();

const normalizeLoose = (text = '') => normalizeText(text)
    .replace(/[“”‘’]/g, "'")
    .replace(/[?!.,;:()[\]{}"']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const includesAny = (text, keywords) => keywords.some((keyword) => text.includes(keyword));

const matchesAny = (text, patterns) => patterns.some((pattern) => pattern.test(text));

const matchesReason = (reason = '', reasons = []) => {
    const normalizedReason = normalizeText(reason);
    return reasons.some((item) => normalizedReason.includes(normalizeText(item)));
};

const toTitleCase = (value = '') => {
    return value
        .trim()
        .split(/\s+/)
        .map((word) => word ? `${word[0].toUpperCase()}${word.slice(1).toLowerCase()}` : '')
        .join(' ');
};

const normalizeLabel = (label = '') => label.toLowerCase().replace(/\s+/g, ' ').trim();

const cleanParsedValue = (value = '') => {
    return value
        .replace(/\s+/g, ' ')
        .replace(/^[\s.:-]+|[\s.]+$/g, '')
        .trim();
};

const escapeRegex = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const isWebsiteBuildPlanMessage = (messageText = '') => {
    return normalizeText(messageText).includes(WEBSITE_BUILD_PLAN_TEXT);
};

const buildPlanLabels = [
    { field: 'projectDetails', labels: ['Project details', 'Project Details', 'Details'] },
    { field: 'business', labels: ['Business'] },
    { field: 'service', labels: ['Service'] },
    { field: 'budget', labels: ['Budget'] },
    { field: 'timeline', labels: ['Timeline', 'Deadline'] },
    { field: 'name', labels: ['Name'] }
];

const buildPlanLabelToField = new Map(
    buildPlanLabels.flatMap(({ field, labels }) => labels.map((label) => [normalizeLabel(label), field]))
);

const buildPlanLabelPattern = buildPlanLabels
    .flatMap(({ labels }) => labels)
    .sort((a, b) => b.length - a.length)
    .map(escapeRegex)
    .join('|');

export const parseBuildPlanMessage = (messageText = '') => {
    const text = messageText.replace(/\r\n/g, '\n').replace(/\u00a0/g, ' ').trim();
    if (!text) return {};

    const labelRegex = new RegExp(`(^|[\\s.,;|])(${buildPlanLabelPattern})\\s*:\\s*`, 'gi');
    const matches = [...text.matchAll(labelRegex)];
    if (matches.length === 0) return {};

    const parsed = {};

    for (let index = 0; index < matches.length; index += 1) {
        const match = matches[index];
        const label = match[2];
        const field = buildPlanLabelToField.get(normalizeLabel(label));
        const valueStart = match.index + match[0].length;
        const valueEnd = matches[index + 1]?.index ?? text.length;
        const value = cleanParsedValue(text.slice(valueStart, valueEnd));

        if (field && value) {
            parsed[field] = value;
        }
    }

    return parsed;
};

export const parseWebsiteLeadMessage = (messageText = '') => {
    const parsed = parseBuildPlanMessage(messageText);

    const leadUpdate = {
        name: parsed.name,
        business: parsed.business,
        serviceType: parsed.service,
        budget: parsed.budget,
        timeline: parsed.timeline,
        projectDetails: parsed.projectDetails
    };

    return Object.fromEntries(Object.entries(leadUpdate).filter(([, value]) => Boolean(value)));
};

const SERVICE_CONTEXT_KEYWORDS = [
    'website', 'web site', 'webapp', 'web app', 'portal', 'dashboard', 'admin panel',
    'ecommerce', 'e-commerce', 'store', 'shop', 'odoo', 'portfolio', 'landing page',
    'business', 'company', 'project', 'software', 'app', 'form', 'payment', 'booking',
    'catalog', 'products', 'pages', 'features', 'leads', 'whatsapp', 'seo', 'design',
    'redesign', 'maintenance', 'price', 'cost', 'quote', 'quotation', 'budget',
    'timeline', 'deadline', 'delivery', 'call', 'meeting', 'sami', 'banwani',
    'banwana', 'chahiye', 'kaam', 'شروع', 'ویب', 'ویب سائٹ', 'پورٹل', 'ڈیش بورڈ',
    'قیمت', 'بجٹ', 'کال', 'میٹنگ'
];

const FEATURE_KEYWORDS = [
    'page', 'pages', 'feature', 'features', 'contact form', 'form', 'whatsapp leads',
    'leads', 'product catalog', 'catalog', 'products', 'payment', 'checkout',
    'delivery', 'booking', 'appointment', 'login', 'signup', 'admin', 'dashboard',
    'panel', 'reports', 'documents', 'student', 'admission', 'records', 'seo',
    'blog', 'gallery', 'chat', 'cms', 'inventory', 'orders', 'users'
];

const notInterestedPhrases = [
    'no thanks', 'not interested', 'not now', 'maybe later', 'abhi nahi', 'abi nahi',
    'nahi chahiye', 'nai chahiye', 'zaroorat nahi', 'need nahi', 'filhal nahi',
    'phir kabhi', 'baad mein', 'bad me', 'no need'
];

const personalQuestionPhrases = [
    'sami ki age', 'sami age', 'sami married', 'sami shadi', 'sami shaadi',
    'sami kahan rehta', 'sami kaha rehta', 'sami kidhar rehta', 'sami ka ghar',
    'sami personal number', 'sami ka personal number', 'sami ki income',
    'sami kitna kamata', 'sami earning', 'sami salary', 'sami ki family',
    'sami family', 'sami ki wife', 'sami wife', 'sami ka personal address',
    'sami address', 'sami ka cnic', 'sami cnic', 'personal baat',
    'aap real ho', 'tum real ho', 'are you real', 'are you ai', 'are you a bot',
    'tum insaan ho', 'tum insan ho', 'insaan ho ya ai', 'human ho ya ai',
    'sami abhi kahan', 'sami abhi kaha', 'where is sami right now',
    'sami kaha hai', 'sami kahan hai', 'sami kaha ha', 'sami kahan ha',
    'sami busy kyun', 'sami busy kyu', 'is sami married', "what is sami's age",
    'what is sami age', 'where does sami live', "sami's income", "sami's family",
    'give sami personal number', "give sami's personal number", 'personal address',
    'سامی کی عمر', 'سامی شادی', 'سامی کہاں رہتا', 'سامی کا گھر', 'سامی کا نمبر',
    'سامی کی آمدنی', 'سامی کی فیملی', 'سامی کی بیوی', 'سامی کا پتہ', 'سامی کا شناختی'
];

const abusivePhrases = [
    'fuck', 'fucking', 'shit', 'bitch', 'bastard', 'asshole', 'madarchod',
    'behenchod', 'bhenchod', 'chutiya', 'chutia', 'harami',
    'kutta', 'lanat', 'لعنت', 'گالی', 'حرامی'
];

const severeInappropriatePhrases = [
    'kill you', 'i will kill', 'threat', 'porn', 'sex chat', 'nude', 'nudes',
    'adult video', 'xxx', 'rape', 'ختم کر دوں', 'جان سے مار'
];

const offTopicPhrases = [
    'politics', 'election', 'prime minister', 'president', 'religion debate',
    'mazhab debate', 'firqa', 'cricket score', 'movie download', 'joke sunao',
    'random joke', 'adult content'
];

const repeatConfusionPhrases = [
    'dobara batao', 'dubara batao', 'phir se batao', 'samajh nahi aya',
    'samjh nahi aya', 'samaj nahi aya', 'mujhe nahi samajh aya', 'mjy nahi samajh aya',
    'kya?', 'kia?', 'what?', 'repeat', 'explain again', 'again explain',
    'did not understand', "didn't understand", 'i do not understand', 'i dont understand',
    'سمجھ نہیں آیا', 'دوبارہ بتائیں', 'پھر سے بتاؤ', 'کیا؟'
];

const affirmativePhrases = [
    'yes', 'yes please', 'yes chahiye', 'haan', 'han', 'ha', 'jee', 'ji', 'g',
    'bilkul', 'sure', 'ok', 'okay', 'theek', 'ٹھیک', 'جی', 'ہاں', 'بالکل'
];

const romanAffirmativePhrases = ['haan', 'han', 'ha', 'jee', 'ji', 'g', 'bilkul', 'yes chahiye', 'theek'];

const handoffPhraseGroups = {
    request_quote: [
        'quote de do', 'quotation de do', 'quotation bhejo', 'send quote',
        'final quote', 'exact quote', 'quote bhej do', 'quote send',
        'کوٹیشن', 'قیمت بتا دیں'
    ],
    request_call: [
        'call kar lein', 'call kar len', 'call pe baat', 'call par baat',
        'call krni', 'call karni', 'call krni ha', 'call krni hai', 'call karni hai',
        'phone pe baat', 'can we have a call', 'schedule a call', 'call me',
        'call please', 'کال کر لیں', 'کال پر بات'
    ],
    wants_to_proceed: [
        'proceed karna hai', 'proceed karna chahta', 'i want to proceed',
        'lets proceed', "let's proceed", 'main proceed', 'آگے بڑھنا'
    ],
    ready_to_start: [
        'kaam shuru karna hai', 'start karna hai', 'i want to start',
        'ready to start', "let's start", 'lets start', 'start now', 'شروع کرنا'
    ],
    ask_next_step: [
        'next step kya hai', 'ab kya karna hoga', 'what is the next step',
        'next steps', 'ab kya hoga', 'آگے کیا'
    ],
    qualified_lead: [
        'mujhe banwani hai', 'mujhe banwana hai', 'website chahiye',
        'mujhe ye banwana hai', 'i need this built', 'i have shared details',
        'details bhej di hain', 'budget ye hai', 'timeline ye hai',
        'my budget is', 'timeline is'
    ],
    wants_human: [
        'sami se baat', 'sami sy baat', 'talk to sami', 'sami ko bolo',
        'sami ko forward', 'human se baat', 'agent se baat', 'real person',
        'kisi insan se baat', 'manual reply'
    ],
    final_pricing: [
        'final price batao', 'final rate batao', 'final price', 'final rate',
        'how much will it cost', 'kitne mein ban jayegi', 'kitne me ban jayegi',
        'exact price', 'total cost', 'حتمی قیمت'
    ],
    meeting_request: [
        'meeting kar lein', 'meeting kar len', 'schedule meeting',
        'book a meeting', 'can we meet', 'meeting rakh lein', 'میٹنگ'
    ]
};

const handoffIntentPriority = [
    'wants_human',
    'meeting_request',
    'request_call',
    'wants_to_proceed',
    'ready_to_start',
    'final_pricing',
    'request_quote',
    'ask_next_step',
    'qualified_lead'
];

const currencyAmountPattern = /(?:rs\.?|pkr|rupees)\s*\d[\d,.]*(?:\s*(?:k|lac|lakh|thousand))?|\b\d[\d,.]*\s*(?:k|lac|lakh|thousand)\b/i;
const durationPattern = /\b\d+\s*(?:days?|din|weeks?|week|haftay|hafta|months?|month|mahine|mahina)\b/i;

export const detectAffirmative = (messageText = '') => {
    const text = normalizeLoose(messageText);
    if (!text) return false;
    return affirmativePhrases.includes(text) || /^(yes|yeah|yep|haan|han|jee|ji|g)\s*(please)?$/i.test(text);
};

const detectAffirmativeLanguageStyle = (messageText = '') => {
    const text = normalizeLoose(messageText);
    if (/[\u0600-\u06FF]/.test(messageText)) return 'urdu';
    if (romanAffirmativePhrases.includes(text)) return 'roman';
    return detectLanguageStyle(messageText);
};

export const detectFeaturesOrPages = (messageText = '') => {
    const text = normalizeLoose(messageText);
    return /\b\d+\s*(?:pages?|page)\b/i.test(text) || includesAny(text, FEATURE_KEYWORDS);
};

export const extractBudget = (messageText = '') => {
    const text = normalizeLoose(messageText);
    if (includesAny(text, ['need guidance', 'budget guidance', 'guide me', 'guidance needed'])) {
        return 'Need guidance';
    }

    const hasBudgetWord = includesAny(text, ['budget', 'bujut', 'range', 'بجٹ']);
    const amountMatch = messageText.match(currencyAmountPattern);
    if (amountMatch && (hasBudgetWord || /\b(?:rs\.?|pkr|rupees)\b/i.test(amountMatch[0]) || /(?:k|lac|lakh|thousand)\b/i.test(amountMatch[0]))) {
        return cleanParsedValue(amountMatch[0]);
    }

    if (hasBudgetWord) {
        const plainAmount = messageText.match(/\b\d{4,8}\b/);
        if (plainAmount) return cleanParsedValue(plainAmount[0]);
    }

    return '';
};

export const extractTimeline = (messageText = '') => {
    const text = normalizeLoose(messageText);
    const timelinePhrases = [
        'today', 'tomorrow', 'this week', 'next week', 'this month', 'next month',
        'urgent', 'asap', 'jaldi', 'jldi', 'fori', 'فوری', 'جلدی', 'اگلے ہفتے'
    ];
    const phrase = timelinePhrases.find((item) => text.includes(item));
    if (phrase) return phrase;

    const duration = messageText.match(durationPattern);
    if (duration) return cleanParsedValue(duration[0]);

    if (includesAny(text, ['timeline', 'deadline', 'delivery', 'kab tak', 'کب تک'])) {
        const afterLabel = messageText.match(/(?:timeline|deadline|delivery)\s*(?:is|hai|:|-)?\s*([^.,\n]+)/i);
        if (afterLabel?.[1]) return cleanParsedValue(afterLabel[1]);
    }

    return '';
};

const inferServiceTypeFromText = (messageText = '') => {
    const text = normalizeLoose(messageText);

    if (includesAny(text, ['odoo'])) return 'Odoo Portal';
    if (includesAny(text, ['e-commerce', 'ecommerce', 'online store', 'store chahiye', 'shop', 'eshop'])) return 'E-commerce Store';
    if (includesAny(text, ['business website', 'company website', 'corporate website'])) return 'Business Website';
    if (includesAny(text, ['admin dashboard', 'dashboard', 'admin panel', 'panel'])) return 'Admin Dashboard';
    if (includesAny(text, ['custom web app', 'web app', 'portal', 'software'])) return 'Custom Web App';
    if (includesAny(text, ['portfolio website', 'developer portfolio', 'personal portfolio'])) return 'Portfolio Website';

    return '';
};

export const inferLeadUpdateFromMessage = (messageText = '', lead = {}) => {
    const leadUpdate = {};
    const serviceType = inferServiceTypeFromText(messageText);
    const budget = extractBudget(messageText);
    const timeline = extractTimeline(messageText);
    const hasFeatureDetails = detectFeaturesOrPages(messageText);
    const cleanedMessage = cleanParsedValue(messageText);
    const genericWebsiteIntent = hasGenericWebsiteBuildIntent(messageText);

    if (serviceType) leadUpdate.serviceType = serviceType;
    if (budget) leadUpdate.budget = budget;
    if (timeline) leadUpdate.timeline = timeline;

    if (
        !genericWebsiteIntent &&
        cleanedMessage.length > 15 &&
        (
            hasFeatureDetails ||
            (
                lead.serviceType &&
                !budget &&
                !timeline &&
                includesAny(normalizeLoose(messageText), ['chahiye', 'need', 'required', 'banwana', 'banwani'])
            )
        )
    ) {
        leadUpdate.projectDetails = cleanedMessage;
    }

    return leadUpdate;
};

export const detectNotInterested = (messageText = '') => {
    return includesAny(normalizeLoose(messageText), notInterestedPhrases);
};

export const detectPersonalQuestion = (messageText = '') => {
    const text = normalizeLoose(messageText);
    if (detectMainWebsiteRequest(messageText, { paused: true }) || detectPortfolioRequest(messageText) || detectCompletedWorkRequest(messageText)) {
        return false;
    }
    const hasBusinessContext = includesAny(text, ['project', 'website', 'service', 'portfolio', 'work', 'business', 'quote']);
    if (!hasBusinessContext && includesAny(text, ['tumhara naam kya hai', 'aapka naam kya hai', 'what is your name'])) {
        return true;
    }
    return includesAny(text, personalQuestionPhrases);
};

const detectPersonalFollowUp = (messageText = '') => {
    const text = normalizeLoose(messageText);
    return includesAny(text, [
        'age', 'umar', 'married', 'shadi', 'shaadi', 'wife', 'family', 'address',
        'ghar', 'kahan', 'kaha', 'number', 'personal number', 'income', 'salary',
        'kamata', 'busy', 'real ho', 'ai ho'
    ]);
};

export const detectAbusiveOrInappropriate = (messageText = '') => {
    const text = ` ${normalizeLoose(messageText)} `;
    const severe = includesAny(text, severeInappropriatePhrases);
    const abusive = severe || includesAny(text, abusivePhrases);

    return {
        isAbusive: abusive,
        severity: severe ? 'severe' : (abusive ? 'moderate' : 'none')
    };
};

export const detectRepeatConfusion = (messageText = '') => {
    return includesAny(normalizeLoose(messageText), repeatConfusionPhrases);
};

export const isBareWebsiteRequest = (messageText = '') => normalizeLoose(messageText) === 'website';

export const hasGenericWebsiteBuildIntent = (messageText = '') => {
    const text = normalizeLoose(messageText);
    return includesAny(text, [
        'website banwani hai',
        'website banwana hai',
        'site banwani hai',
        'site banwana hai',
        'web development chahiye',
        'web development karwani hai',
        'web development karwana hai',
        'website chahiye',
        'website chaiye',
        'project banwana hai',
        'project banwani hai'
    ]);
};

export const detectCompletedWorkRequest = (messageText = '') => {
    const text = normalizeLoose(messageText);
    return includesAny(text, [
        'project jo complete kie',
        'project jo complete kiye',
        'completed projects',
        'complete projects',
        'complete projects dikhao',
        'projects dikhao',
        'kaam dikhao',
        'work samples',
        'previous work',
        'examples',
        'proof',
        'client work',
        'live project',
        'live website',
        'zmg',
        'education portal',
        'sami ke projects',
        'sami ka kaam'
    ]);
};

export const detectPortfolioRequest = (messageText = '') => {
    const text = normalizeLoose(messageText);
    if (includesAny(text, ['portfolio website banwani', 'portfolio website banwana', 'portfolio website chahiye'])) return false;
    return includesAny(text, ['portfolio', 'portfolio dikhao', 'sami ka portfolio']);
};

export const detectMainWebsiteRequest = (messageText = '', { paused = false } = {}) => {
    const text = normalizeLoose(messageText);
    if (!text || hasGenericWebsiteBuildIntent(messageText) || detectCompletedWorkRequest(messageText)) return false;
    if (paused && isBareWebsiteRequest(messageText)) return true;

    return includesAny(text, [
        'website dikhao',
        'main website',
        'main website dikhao',
        'website link',
        'site link',
        'your website',
        'you website',
        'sami ki website',
        'sami ki website kaha ha',
        'sami ki website kaha hai',
        'sami website',
        'samii.pk',
        'any site'
    ]);
};

const detectPausedTimelineQuestion = (messageText = '') => {
    const text = normalizeLoose(messageText);
    return includesAny(text, [
        'timeline',
        'kab tak',
        'delivery time',
        'how many days',
        'kitne din',
        'kitna time',
        'time lagega',
        'hafty',
        'haftay',
        'hafta',
        'ban jaigi',
        'ban jaegi',
        'ban jayegi',
        'banegi',
        'banegi?'
    ]) || /\b\d+\s*(?:days?|din|weeks?|week|hafty|haftay|hafta)\b/i.test(text);
};

const detectPausedForwardAckRequest = (messageText = '') => {
    const text = normalizeLoose(messageText);
    return includesAny(text, [
        'detail forward',
        'details forward',
        'details gayi',
        'meri details gayi',
        'message mila',
        'sami ko bheja',
        'forward kardi',
        'forward kar di',
        'forward ho gayi',
        'dobara forward',
        'urgent ha',
        'urgent hai',
        'reply kab',
        'kab reply',
        'sami reply',
        'any update',
        'koi update'
    ]);
};

const detectShortRepeatAck = (messageText = '') => {
    const text = normalizeLoose(messageText);
    return ['dobara', 'dubara', 'again', 'repeat'].includes(text);
};

export const hasClearProjectIntent = (messageText = '') => {
    const text = normalizeLoose(messageText);
    return hasGenericWebsiteBuildIntent(messageText) || includesAny(text, [
        'business website',
        'company website',
        'ecommerce store',
        'e-commerce store',
        'online store',
        'portal chahiye',
        'portal banana',
        'dashboard chahiye',
        'dashboard banana',
        'odoo ka kaam',
        'odoo work',
        'custom web app',
        'build plan',
        'project discuss karna hai',
        'project discuss krna hai'
    ]);
};

export const hasUsefulProjectContext = (messageText = '', leadUpdate = {}) => {
    const text = normalizeLoose(messageText);
    return Boolean(
        leadUpdate.serviceType ||
        leadUpdate.projectDetails ||
        leadUpdate.budget ||
        leadUpdate.timeline ||
        inferServiceTypeFromText(messageText) ||
        extractBudget(messageText) ||
        extractTimeline(messageText) ||
        detectFeaturesOrPages(messageText) ||
        hasClearProjectIntent(messageText) ||
        includesAny(text, ['website banwani', 'website banwana', 'web development', 'project banwana'])
    );
};

export const detectOffTopicOrNonsense = (messageText = '', lead = {}) => {
    const text = normalizeLoose(messageText);
    if (!text) return true;
    if (/^(hi|hello|hey|salam|salaam|assalam|aoa|jee|ji|hy)$/.test(text)) return false;
    if (detectNotInterested(messageText)) return false;
    if (hasUsefulProjectContext(messageText)) return false;
    if (detectPersonalQuestion(messageText)) return false;
    if (detectAbusiveOrInappropriate(messageText).isAbusive) return false;
    if (/(https?:\/\/|www\.)/i.test(messageText) && !text.includes('samii.pk')) return true;
    if (includesAny(text, SERVICE_CONTEXT_KEYWORDS)) return false;

    if ((lead.offTopicCount || lead.unclearCount || 0) > 0 && includesAny(text, ['tum kya kar sakte ho', 'what can you do'])) {
        return true;
    }

    const words = text.split(' ').filter(Boolean);
    const hasNumber = /\d/.test(text);
    const hasMostlySymbols = text.length > 0 && text.replace(/[a-z0-9\s\u0600-\u06FF]/gi, '').length / text.length > 0.45;

    return Boolean(
        includesAny(text, offTopicPhrases) ||
        /^(ha+|haha+|lol|ok|hmm|acha|theek|asdf+|test)$/i.test(text) ||
        (words.length <= 4 && hasNumber) ||
        (words.length <= 2 && !includesAny(text, SERVICE_CONTEXT_KEYWORDS)) ||
        hasMostlySymbols
    );
};

export const detectHandoffIntent = (messageText = '') => {
    const text = normalizeLoose(messageText);
    const intents = [];

    for (const [intentName, phrases] of Object.entries(handoffPhraseGroups)) {
        if (includesAny(text, phrases)) {
            intents.push(intentName);
        }
    }

    if (matchesAny(text, [/\border\s+confirm(?:ed)?\b/i, /\bproject\s+confirm(?:ed)?\b/i, /\bkaam\s+confirm\b/i])) {
        intents.push('wants_to_proceed');
    }

    const uniqueIntents = [...new Set(intents)];
    const primaryIntent = handoffIntentPriority.find((intentName) => uniqueIntents.includes(intentName)) || '';

    return {
        intents: uniqueIntents,
        primaryIntent,
        request_quote: uniqueIntents.includes('request_quote'),
        request_call: uniqueIntents.includes('request_call'),
        wants_to_proceed: uniqueIntents.includes('wants_to_proceed'),
        ready_to_start: uniqueIntents.includes('ready_to_start'),
        ask_next_step: uniqueIntents.includes('ask_next_step'),
        qualified_lead: uniqueIntents.includes('qualified_lead'),
        wants_human: uniqueIntents.includes('wants_human'),
        final_pricing: uniqueIntents.includes('final_pricing'),
        meeting_request: uniqueIntents.includes('meeting_request')
    };
};

export const calculateLeadScore = (lead = {}, messageText = '') => {
    const handoffIntent = detectHandoffIntent(messageText);
    let score = 0;

    if (lead.serviceType) score += 2;
    if ((lead.projectDetails || '').length > 25) score += 2;
    if (lead.business) score += 1;
    if (lead.budget) score += 2;
    if (lead.timeline) score += 2;
    if (handoffIntent.request_quote || handoffIntent.final_pricing) score += 2;
    if (handoffIntent.request_call || handoffIntent.meeting_request) score += 2;
    if (handoffIntent.wants_to_proceed || handoffIntent.ready_to_start) score += 3;
    if (lead.cameFromBuildPlan || lead.buildPlanFormSubmitted) score += 2;
    if (detectFeaturesOrPages(messageText) || detectFeaturesOrPages(lead.projectDetails || '')) score += 2;

    return score;
};

const hasAnsweredQualificationQuestion = (lead = {}) => Boolean(
    lead.serviceType ||
    lead.projectDetails ||
    lead.business ||
    lead.budget ||
    lead.timeline ||
    lead.cameFromBuildPlan ||
    lead.buildPlanFormSubmitted ||
    [
        LEAD_STAGES.ASKED_PROJECT_TYPE,
        LEAD_STAGES.ASKED_REQUIREMENTS,
        LEAD_STAGES.ASKED_BUDGET,
        LEAD_STAGES.ASKED_TIMELINE
    ].includes(lead.stage)
);

const isThinLeadMessage = ({ lead = {}, messageText = '', intent = '' }) => {
    const handoffIntent = detectHandoffIntent(messageText);
    const hasHardHandoff = handoffIntent.request_call ||
        handoffIntent.meeting_request ||
        handoffIntent.wants_human ||
        handoffIntent.wants_to_proceed ||
        handoffIntent.ready_to_start;

    if (hasHardHandoff) return false;
    if (intent === 'greeting' || intent === 'ask_portfolio' || intent === 'ask_services') return true;
    if ((handoffIntent.request_quote || handoffIntent.final_pricing) && !(lead.serviceType || lead.projectDetails)) return true;
    if (intent === 'new_project' && !detectFeaturesOrPages(messageText) && !extractBudget(messageText) && !extractTimeline(messageText)) return true;
    if (
        ['ask_business_website', 'ask_ecommerce', 'ask_admin_dashboard', 'ask_custom_web_app', 'ask_odoo'].includes(intent) &&
        !detectFeaturesOrPages(messageText) &&
        !extractBudget(messageText) &&
        !extractTimeline(messageText) &&
        !(handoffIntent.request_quote || handoffIntent.final_pricing)
    ) {
        return true;
    }

    return false;
};

export const shouldPauseForQualifiedLead = ({ lead = {}, messageText = '', intent = '', stage = '' }) => {
    const leadWithStage = { ...lead, stage: stage || lead.stage };
    const handoffIntent = detectHandoffIntent(messageText);
    const leadScore = calculateLeadScore(leadWithStage, messageText);
    const hasServiceOrDetails = Boolean(leadWithStage.serviceType || leadWithStage.projectDetails);
    const hasBudgetAndTimeline = Boolean(leadWithStage.budget && leadWithStage.timeline);

    if (handoffIntent.wants_human) {
        return { shouldPause: true, leadScore, handoffReason: 'User requested human handoff' };
    }
    if (handoffIntent.request_call || handoffIntent.meeting_request) {
        return { shouldPause: true, leadScore, handoffReason: handoffIntent.meeting_request ? 'User requested meeting' : 'User requested call' };
    }
    if ((handoffIntent.request_quote || handoffIntent.final_pricing) && hasServiceOrDetails) {
        return { shouldPause: true, leadScore, handoffReason: 'Qualified lead asked for quote' };
    }
    if (handoffIntent.wants_to_proceed || handoffIntent.ready_to_start) {
        return { shouldPause: true, leadScore, handoffReason: 'User wants to proceed' };
    }
    if (
        (leadWithStage.cameFromBuildPlan || leadWithStage.buildPlanFormSubmitted) &&
        [LEAD_STAGES.ASKED_REQUIREMENTS, LEAD_STAGES.ASKED_BUDGET, LEAD_STAGES.ASKED_TIMELINE].includes(leadWithStage.stage) &&
        (detectFeaturesOrPages(messageText) || extractBudget(messageText) || extractTimeline(messageText))
    ) {
        return { shouldPause: true, leadScore, handoffReason: 'Detailed build-plan form completed' };
    }
    if (
        leadScore >= 5 &&
        hasAnsweredQualificationQuestion(leadWithStage) &&
        Boolean(
            hasBudgetAndTimeline ||
            ((leadWithStage.cameFromBuildPlan || leadWithStage.buildPlanFormSubmitted) && (leadWithStage.budget || leadWithStage.timeline)) ||
            handoffIntent.ask_next_step
        ) &&
        !isThinLeadMessage({ lead: leadWithStage, messageText, intent })
    ) {
        return {
            shouldPause: true,
            leadScore,
            handoffReason: leadScore >= 7 ? 'Strong qualified lead reached threshold' : 'Lead score reached threshold'
        };
    }

    return { shouldPause: false, leadScore, handoffReason: '' };
};

export const shouldPauseForSafetyOrConfusion = ({ userContext = {}, messageText = '', intent = '' }) => {
    if (intent === 'personal_question' && (userContext.personalQuestionCount || 0) > 0) {
        return { shouldPause: true, handoffReason: 'Repeated personal/private question' };
    }

    const abusive = detectAbusiveOrInappropriate(messageText);
    if (abusive.isAbusive && (abusive.severity === 'severe' || (userContext.abuseCount || 0) > 0)) {
        return { shouldPause: true, handoffReason: 'Abusive or inappropriate message' };
    }

    if (
        detectRepeatConfusion(messageText) &&
        ((userContext.unclearCount || 0) > 0 || ['clarification', 'unclear', 'off_topic', 'repeat_confusion'].includes(userContext.lastBotQuestionType))
    ) {
        return { shouldPause: true, handoffReason: 'Repeated confusion after clarification' };
    }

    if ((intent === 'off_topic' || intent === 'nonsense') && ((userContext.offTopicCount || 0) > 0 || (userContext.unclearCount || 0) > 0)) {
        return { shouldPause: true, handoffReason: 'Repeated unclear/off-topic messages' };
    }

    return { shouldPause: false, handoffReason: '' };
};

export const getPauseReasonType = (reason = '') => {
    if (matchesReason(reason, SAFETY_CONFUSION_PAUSE_REASONS)) return 'safety_confusion';
    if (matchesReason(reason, SERIOUS_LEAD_PAUSE_REASONS)) return 'serious_lead';
    return reason ? 'manual_or_unknown' : '';
};

export const isSafetyConfusionPause = (reason = '') => getPauseReasonType(reason) === 'safety_confusion';

export const isSeriousLeadPause = (reason = '') => {
    const reasonType = getPauseReasonType(reason);
    return reasonType === 'serious_lead' || reasonType === 'manual_or_unknown';
};

export const getPausedAutoResumeStatus = ({ lead = {}, messageText = '', parsedLead = {}, now = new Date() }) => {
    const pausedAt = lead.aiPausedAt ? new Date(lead.aiPausedAt) : null;
    const pauseAgeHours = pausedAt && !Number.isNaN(pausedAt.getTime())
        ? (now.getTime() - pausedAt.getTime()) / (1000 * 60 * 60)
        : 0;
    const reasonType = getPauseReasonType(lead.handoffReason || '');
    const staleSafetyPause = reasonType === 'safety_confusion' && pauseAgeHours >= AUTO_RESUME_STALE_PAUSE_HOURS;
    const projectIntent = Object.keys(parsedLead || {}).length > 0 || hasClearProjectIntent(messageText);

    return {
        eligible: Boolean(staleSafetyPause && projectIntent),
        reasonType,
        pauseAgeHours,
        staleSafetyPause,
        projectIntent
    };
};

export const detectLanguageStyle = (messageText = '') => {
    const text = normalizeText(messageText);
    const hasUrduScript = /[\u0600-\u06FF]/.test(messageText);
    if (hasUrduScript) return 'urdu';

    const romanUrduMarkers = [
        'jee', 'ji', 'han', 'haan', 'mujhe', 'mjy', 'chahiye', 'chahye', 'banwani',
        'banwana', 'dikhao', 'kya', 'kia', 'kitna', 'krni', 'karni', 'kaam', 'baat',
        'hai', 'hain', 'ha', 'ho', 'karte', 'kar', 'bata', 'batao', 'bta', 'bhejo',
        'de do', 'link do', 'bhej do', 'lein', 'len', 'pe', 'par', 'chahta',
        'chahti', 'mein', 'me', 'ka', 'ki', 'se', 'ke liye'
    ];
    const englishMarkers = [
        'need', 'business', 'website', 'company', 'project', 'price', 'cost',
        'services', 'portfolio', 'build', 'plan', 'store', 'dashboard'
    ];

    const looksRomanUrdu = includesAny(text, romanUrduMarkers);
    const looksEnglish = includesAny(text, englishMarkers);

    if (looksRomanUrdu && looksEnglish) return 'mixed';
    if (looksRomanUrdu) return 'roman';
    return 'english';
};

export const detectIntent = (messageText = '') => {
    const text = normalizeText(messageText);
    if (!text) return 'unknown';

    if (detectCompletedWorkRequest(messageText)) return 'ask_completed_work';
    if (detectPortfolioRequest(messageText)) return 'ask_portfolio';
    if (detectMainWebsiteRequest(messageText, { paused: true })) return 'ask_main_website';

    if (detectPersonalQuestion(messageText)) return 'personal_question';

    const abusive = detectAbusiveOrInappropriate(messageText);
    if (abusive.isAbusive) return 'abusive';

    if (/(https?:\/\/|www\.)/.test(text) && !text.includes('samii.pk')) return 'spam';
    if (includesAny(text, ['casino', 'betting', 'crypto profit', 'loan offer', 'adult'])) return 'spam';

    const handoffIntent = detectHandoffIntent(messageText);
    if (
        handoffIntent.primaryIntent &&
        !(
            handoffIntent.primaryIntent === 'qualified_lead' &&
            !extractBudget(messageText) &&
            !extractTimeline(messageText) &&
            !detectFeaturesOrPages(messageText) &&
            !includesAny(normalizeLoose(messageText), ['details bhej', 'i have shared details'])
        )
    ) {
        return handoffIntent.primaryIntent;
    }

    if (includesAny(text, ['sami se baat', 'sami sy baat', 'talk to sami', 'sami ko bolo', 'sami ko forward'])) {
        return 'talk_to_sami';
    }
    if (includesAny(text, ['call', 'phone', 'baat karni', 'baat krni', 'krni ha', 'urgent'])) {
        return 'urgent_call';
    }
    if (includesAny(text, ['portfolio', 'work', 'sample', 'samples', 'projects', 'kaam dikhao', 'kaam dekhna', 'previous work'])) {
        return 'ask_portfolio';
    }
    if (includesAny(text, ['timeline', 'kitna time', 'time lagega', 'delivery', 'kab tak'])) return 'ask_timeline';
    if (includesAny(text, ['price', 'charges', 'kitna', 'cost', 'rate', 'budget', 'quote', 'quotation'])) {
        return 'ask_price';
    }
    if (includesAny(text, ['services', 'service list', 'kya kaam', 'konse kaam', 'what do you build', 'what can you do', 'tum kya kar sakte ho'])) {
        return 'ask_services';
    }
    if (includesAny(text, ['odoo'])) return 'ask_odoo';
    if (includesAny(text, ['ecommerce', 'e-commerce', 'online store', 'shop', 'store chahiye'])) return 'ask_ecommerce';
    if (includesAny(text, ['business website', 'company website', 'corporate website'])) return 'ask_business_website';
    if (includesAny(text, ['admin dashboard', 'dashboard', 'panel', 'admin panel'])) return 'ask_admin_dashboard';
    if (includesAny(text, ['custom web app', 'web app', 'portal', 'software'])) return 'ask_custom_web_app';
    if (includesAny(text, ['existing client', 'old client', 'already client', 'maintenance', 'change karni', 'bug'])) {
        return 'existing_client';
    }
    if (
        isWebsiteBuildPlanMessage(text) ||
        hasGenericWebsiteBuildIntent(messageText) ||
        includesAny(text, ['website banwani', 'website banwana', 'web development', 'build plan', 'project banwana', 'site banwani', 'mujhe banwani', 'mujhe banwana', 'mujhe ye banwana'])
    ) {
        return 'new_project';
    }
    if (/^(hi|hello|hey|salam|salaam|assalam|aoa|jee|ji|hy)$/.test(text)) return 'greeting';

    if (detectRepeatConfusion(messageText)) return 'low_signal_repeated';
    if (detectOffTopicOrNonsense(messageText)) return 'nonsense';

    return 'unknown';
};

export const inferLeadUpdateFromIntent = (intent) => {
    const serviceMap = {
        ask_odoo: 'Odoo Portal',
        ask_ecommerce: 'E-commerce Store',
        ask_business_website: 'Business Website',
        ask_admin_dashboard: 'Admin Dashboard',
        ask_custom_web_app: 'Custom Web App'
    };

    return serviceMap[intent] ? { serviceType: serviceMap[intent] } : {};
};

export const getStageForLead = (lead = {}, intent = 'unknown') => {
    if (lead.aiPaused || lead.isAIPaused) return LEAD_STAGES.HANDED_OFF;
    if (intent === 'personal_question') return LEAD_STAGES.PERSONAL_BOUNDARY;
    if (intent === 'off_topic' || intent === 'nonsense') return LEAD_STAGES.OFF_TOPIC_WAITING;
    if (intent === 'low_signal_repeated') return LEAD_STAGES.UNCLEAR_WAITING;
    if (['ask_price', 'request_quote', 'final_pricing', 'ask_next_step', 'qualified_lead'].includes(intent)) return LEAD_STAGES.ASKED_REQUIREMENTS;
    if (intent === 'ask_timeline') return LEAD_STAGES.ASKED_TIMELINE;
    if (!lead.serviceType && intent === 'new_project') return LEAD_STAGES.ASKED_PROJECT_TYPE;
    if (lead.serviceType && !hasEnoughLeadDetails(lead)) return LEAD_STAGES.ASKED_REQUIREMENTS;
    if (hasEnoughLeadDetails(lead)) return LEAD_STAGES.QUALIFIED;
    return lead.stage || LEAD_STAGES.NEW;
};

export const hasEnoughLeadDetails = (lead = {}) => {
    const details = lead.projectDetails || lead.requirementSummary || '';
    return Boolean(
        lead.serviceType &&
        (
            details.length >= 40 ||
            (lead.business && (lead.budget || lead.timeline))
        )
    );
};

export const isLowSignalMessage = (messageText = '') => {
    const text = normalizeText(messageText);
    const words = text.split(' ').filter(Boolean);
    const hasServiceWord = includesAny(text, [
        'website', 'web', 'portfolio', 'ecommerce', 'store', 'dashboard', 'odoo',
        'portal', 'app', 'service', 'price', 'cost', 'sami', 'call'
    ]);
    return words.length <= 4 && !hasServiceWord;
};

const template = (style, variants) => {
    if (style === 'english') return variants.english;
    if (style === 'urdu') return variants.urdu;
    return variants.roman;
};

const getSafeReplyStyle = (messageText = '') => {
    const text = normalizeLoose(messageText);
    if (
        isBareWebsiteRequest(messageText) ||
        includesAny(text, [
            'dikhao',
            'dobara',
            'dubara',
            'kaha',
            'ha',
            'hai',
            'ki',
            'ka',
            'krdo',
            'kardo',
            'krdi',
            'kardi',
            'hafty',
            'haftay',
            'ban jaigi',
            'banegi'
        ])
    ) {
        return 'roman';
    }

    return detectLanguageStyle(messageText);
};

export const getServiceQualificationQuestion = (serviceType = '', style = 'roman') => {
    const service = normalizeText(serviceType);

    if (service.includes('e-commerce') || service.includes('ecommerce') || service.includes('store') || service.includes('shop')) {
        return template(style, {
            english: 'Around how many products will there be, and what payment/delivery flow do you need?',
            roman: 'Approx kitne products honge, aur payment/delivery ka flow kaise chahiye?',
            urdu: 'تقریباً کتنے products ہوں گے، اور payment/delivery کا flow کیسے چاہیے؟'
        });
    }
    if (service.includes('odoo')) {
        return template(style, {
            english: 'Do you need Odoo setup, portal/frontend, integration, or a custom module?',
            roman: 'Aapko Odoo setup chahiye, portal/frontend, integration, ya custom module?',
            urdu: 'آپ کو Odoo setup چاہیے، portal/frontend، integration، یا custom module؟'
        });
    }
    if (service.includes('dashboard') || service.includes('admin')) {
        return template(style, {
            english: 'What data should the dashboard manage - users, orders, records, reports, or documents?',
            roman: 'Dashboard mein kis type ka data manage hoga - users, orders, records, reports, ya documents?',
            urdu: 'Dashboard میں کس type کا data manage ہوگا - users, orders, records, reports، یا documents؟'
        });
    }
    if (service.includes('portfolio')) {
        return template(style, {
            english: 'Is it a personal portfolio, developer portfolio, company portfolio, or creative portfolio?',
            roman: 'Portfolio personal chahiye, developer portfolio, company portfolio, ya creative portfolio?',
            urdu: 'Portfolio personal چاہیے، developer portfolio، company portfolio، یا creative portfolio؟'
        });
    }
    if (service.includes('business') || service.includes('website')) {
        return template(style, {
            english: 'Please share approximate pages/features - basic website, or contact form, product catalog, and WhatsApp leads too?',
            roman: 'Approx pages/features bata dein - basic website chahiye ya contact form, product catalog, WhatsApp leads bhi chahiye?',
            urdu: 'Approx pages/features بتا دیں - basic website چاہیے یا contact form, product catalog, WhatsApp leads بھی چاہیے؟'
        });
    }

    return template(style, {
        english: 'What main features do you need in this project?',
        roman: 'Is project mein main features kya chahiye?',
        urdu: 'اس project میں main features کیا چاہئیں؟'
    });
};

const getNewProjectQuestion = (style) => template(style, {
    english: 'Sure. What type of project do you need - business website, portfolio, e-commerce store, portal, dashboard, or custom web app?',
    roman: 'Jee bilkul. Aap kis type ka project banwana chahte hain - business website, portfolio, e-commerce store, portal, ya custom web app?',
    urdu: 'جی بالکل۔ آپ کس type کا project بنوانا چاہتے ہیں - business website، portfolio، e-commerce store، portal، یا custom web app؟'
});

const getAffirmativeServiceChoiceReply = (style) => template(style, {
    english: 'Great. Which one do you need - website, portal, e-commerce store, dashboard, or custom web app?',
    roman: 'Jee, kis type ka project chahiye - website, portal, e-commerce store, dashboard ya custom web app?',
    urdu: 'جی، آپ کو کس type کا project چاہیے - website، portal، e-commerce store، dashboard یا custom web app?'
});

const getPortfolioReply = (style) => template(style, {
    english: `Sure, you can view Sami's portfolio here: ${SAMI_KNOWLEDGE.portfolioUrl}\n\nWhat type of work would you like to see - business websites, portals, e-commerce, or dashboards?`,
    roman: `Jee, Sami ka portfolio yahan dekh sakte hain: ${SAMI_KNOWLEDGE.portfolioUrl}\n\nAap kis type ka kaam dekhna chahenge - website, portal, e-commerce, ya dashboard?`,
    urdu: `جی، Sami کا portfolio یہاں دیکھ سکتے ہیں: ${SAMI_KNOWLEDGE.portfolioUrl}\n\nآپ کس type کا کام دیکھنا چاہیں گے - website، portal، e-commerce، یا dashboard؟`
});

const getWebsiteReply = (style) => template(style, {
    english: `Main website is here: ${SAMI_KNOWLEDGE.mainWebsiteUrl}\n\nYou can also send a build plan request from there.`,
    roman: `Jee, main website yahan hai: ${SAMI_KNOWLEDGE.mainWebsiteUrl}\n\nAap direct build plan request bhi bhej sakte hain.`,
    urdu: `جی، main website یہاں ہے: ${SAMI_KNOWLEDGE.mainWebsiteUrl}\n\nآپ وہاں سے direct build plan request بھی بھیج سکتے ہیں۔`
});

const getPortfolioLinkReply = (style) => template(style, {
    english: `Sure, portfolio is here: ${SAMI_KNOWLEDGE.portfolioUrl}`,
    roman: `Jee, portfolio yahan hai: ${SAMI_KNOWLEDGE.portfolioUrl}`,
    urdu: `Jee, portfolio yahan hai: ${SAMI_KNOWLEDGE.portfolioUrl}`
});

const getMainWebsiteLinkReply = (style) => template(style, {
    english: `Sure, main website is here: ${SAMI_KNOWLEDGE.mainWebsiteUrl}`,
    roman: `Jee, main website yahan hai: ${SAMI_KNOWLEDGE.mainWebsiteUrl}`,
    urdu: `Jee, main website yahan hai: ${SAMI_KNOWLEDGE.mainWebsiteUrl}`
});

const getCompletedWorkReply = (style) => template(style, {
    english: `Sure, you can view completed work here:\n\nPortfolio: ${SAMI_KNOWLEDGE.portfolioUrl}\nZMG Education Portal: https://zmgeducation.com`,
    roman: `Jee, completed work yahan dekh sakte hain:\n\nPortfolio: ${SAMI_KNOWLEDGE.portfolioUrl}\nZMG Education Portal: https://zmgeducation.com`,
    urdu: `Jee, completed work yahan dekh sakte hain:\n\nPortfolio: ${SAMI_KNOWLEDGE.portfolioUrl}\nZMG Education Portal: https://zmgeducation.com`
});

const getWebsiteDisambiguationReply = (style) => template(style, {
    english: 'Do you need a website, or do you want to view the website link?',
    roman: 'Website chahiye ya website link dekhna hai?',
    urdu: 'Website chahiye ya website link dekhna hai?'
});

const getPausedForwardAckReply = (style) => template(style, {
    english: "Yes, details have been forwarded. If it is urgent, I'm noting that; Sami will reply manually soon.",
    roman: 'Jee, details forward ho gayi hain. Agar urgent hai to main isay note kar raha hoon; Sami jaldi manually reply karenge.',
    urdu: 'Jee, details forward ho gayi hain. Agar urgent hai to main isay note kar raha hoon; Sami jaldi manually reply karenge.'
});

const getPausedTimelineReply = (style) => template(style, {
    english: 'Sami will confirm the timeline after reviewing the requirements. Your message has been received.',
    roman: 'Timeline requirements dekh kar Sami confirm karenge. Aapki message receive ho gayi hai.',
    urdu: 'Timeline requirements dekh kar Sami confirm karenge. Aapki message receive ho gayi hai.'
});

const getShortNotedReply = (style) => template(style, {
    english: 'Noted.',
    roman: 'Jee, noted.',
    urdu: 'Jee, noted.'
});

const getGreetingReply = (style) => template(style, {
    english: 'Hi, I am Sami Assistant. Are you looking for a website, portal, e-commerce store, dashboard, or custom web app?',
    roman: 'Jee, main Sami ka assistant hoon. Aap website, portal, e-commerce store, dashboard, ya custom web app ke bare mein baat karna chahte hain?',
    urdu: 'جی، میں Sami کا assistant ہوں۔ آپ website، portal، e-commerce store، dashboard، یا custom web app کے بارے میں بات کرنا چاہتے ہیں؟'
});

const getPriceReply = (style) => template(style, {
    english: 'Price depends on pages, features, and timeline. Do you need a basic website, or forms, admin panel, payment, or portal features too?',
    roman: 'Price pages, features aur timeline par depend karegi. Aapko basic website chahiye ya forms, admin panel, payment, ya portal features bhi chahiye?',
    urdu: 'Price pages، features اور timeline پر depend کرے گی۔ آپ کو basic website چاہیے یا forms، admin panel، payment، یا portal features بھی؟'
});

const getServicesReply = (style) => template(style, {
    english: `Sami builds business websites, portfolio websites, e-commerce stores, admin dashboards, Odoo portals, and custom web apps.\n\nWhich one do you need?`,
    roman: 'Sami business websites, portfolio websites, e-commerce stores, admin dashboards, Odoo portals, aur custom web apps build karte hain.\n\nAapko kis service ki zaroorat hai?',
    urdu: 'Sami business websites، portfolio websites، e-commerce stores، admin dashboards، Odoo portals، اور custom web apps build کرتے ہیں۔\n\nآپ کو کس service کی ضرورت ہے؟'
});

const getTalkToSamiReply = (style, shouldPause) => {
    if (shouldPause) {
        return template(style, {
            english: 'Perfect, I am forwarding these details to Sami. He will reply to you soon.',
            roman: 'Perfect, main ye details Sami ko forward kar raha hoon. Wo jaldi aapko reply karenge.',
            urdu: 'Perfect، میں یہ details Sami کو forward کر رہا ہوں۔ وہ جلدی آپ کو reply کریں گے۔'
        });
    }

    return template(style, {
        english: 'Sure. Please share the topic so I can forward it to Sami with proper context.',
        roman: 'Jee zaroor. Aap topic bata dein taake main Sami ko proper context ke sath forward kar doon.',
        urdu: 'جی ضرور۔ آپ topic بتا دیں تاکہ میں Sami کو proper context کے ساتھ forward کر دوں۔'
    });
};

const getCallReply = (style, shouldPause) => {
    if (shouldPause) return getTalkToSamiReply(style, true);

    return template(style, {
        english: 'Sure. Please share the topic and preferred time so Sami has the right context for the call.',
        roman: 'Jee zaroor. Topic aur preferred time bata dein taake Sami ko call ke liye proper context mil jaye.',
        urdu: 'جی ضرور۔ Topic اور preferred time بتا دیں تاکہ Sami کو call کے لیے proper context مل جائے۔'
    });
};

const getClarificationReply = (style) => template(style, {
    english: 'Could you clarify your project requirement a little?',
    roman: 'Samajh nahi aya. Aap website ya project requirement thori clear bata dein?',
    urdu: 'سمجھ نہیں آیا۔ آپ website یا project requirement تھوڑی clear بتا دیں؟'
});

const getUnclearOffTopicReply = (style) => template(style, {
    english: 'I did not fully understand. If you want to discuss a website, portal, e-commerce store, dashboard, or custom web app, please share a little more context.',
    roman: 'Samajh nahi aya. Agar aap website, portal, e-commerce, dashboard ya custom web app ke bare mein baat karna chahte hain to thora clear bata dein.',
    urdu: 'سمجھ نہیں آیا۔ اگر آپ website، portal، e-commerce، dashboard یا custom web app کے بارے میں بات کرنا چاہتے ہیں تو تھوڑا clear بتا دیں۔'
});

const getRepeatedUnclearHandoffReply = (style) => template(style, {
    english: 'I am forwarding this conversation to Sami so he can review it manually.',
    roman: 'Main ye conversation Sami ke liye forward kar raha hoon taake wo manually dekh saken.',
    urdu: 'میں یہ conversation Sami کے لیے forward کر رہا ہوں تاکہ وہ manually دیکھ سکیں۔'
});

const getPersonalBoundaryReply = (style) => template(style, {
    english: "I can't share personal details. If you want to discuss a website, portal, dashboard, or web system, I can help.",
    roman: 'Main personal details share nahi kar sakta. Agar aap website, portal, dashboard ya web system ke related baat karna chahte hain to main help kar sakta hoon.',
    urdu: 'میں personal details share نہیں کر سکتا۔ اگر آپ website، portal، dashboard یا web system کے related بات کرنا چاہتے ہیں تو میں help کر سکتا ہوں۔'
});

const getPersonalHandoffReply = (style) => template(style, {
    english: "I can't share personal details. I'm forwarding this conversation to Sami.",
    roman: 'Main personal details share nahi kar sakta. Main ye conversation Sami ke liye forward kar raha hoon.',
    urdu: 'میں personal details share نہیں کر سکتا۔ میں یہ conversation Sami کے لیے forward کر رہا ہوں۔'
});

const getAbuseReply = (style) => template(style, {
    english: 'I cannot continue this type of conversation. If you need help with a website or project, please send a clear requirement.',
    roman: 'Main is tarah ki conversation continue nahi kar sakta. Agar aapko website ya project ke related help chahiye ho to clear requirement bhej dein.',
    urdu: 'میں اس طرح کی conversation continue نہیں کر سکتا۔ اگر آپ کو website یا project کے related help چاہیے ہو تو clear requirement بھیج دیں۔'
});

const getNotInterestedReply = (style) => template(style, {
    english: 'No problem. Whenever you are ready, you can message here.',
    roman: 'Theek hai, koi masla nahi. Jab zaroorat ho aap yahan message kar sakte hain.',
    urdu: 'کوئی مسئلہ نہیں۔ جب ضرورت ہو آپ یہاں message کر سکتے ہیں۔'
});

const getTimelineOrBudgetQuestion = (style, lead = {}) => {
    if (!lead.timeline && lead.budget) {
        return template(style, {
            english: 'Got it. What timeline do you need for this?',
            roman: 'Jee samajh gaya. Is project ki timeline kya chahiye?',
            urdu: 'جی سمجھ گیا۔ اس project کی timeline کیا چاہیے؟'
        });
    }

    if (!lead.budget && lead.timeline) {
        return template(style, {
            english: 'Got it. Do you have a budget range in mind?',
            roman: 'Jee samajh gaya. Aapke mind mein budget range hai?',
            urdu: 'جی سمجھ گیا۔ آپ کے mind میں budget range ہے؟'
        });
    }

    return template(style, {
        english: 'Got it. Please share your timeline or budget range so Sami can guide you properly.',
        roman: 'Jee samajh gaya. Timeline ya budget range share kar dein taake Sami proper guide kar saken.',
        urdu: 'جی سمجھ گیا۔ Timeline یا budget range share کر دیں تاکہ Sami proper guide کر سکیں۔'
    });
};

const getPausedAcknowledgementReply = (style) => template(style, {
    english: 'Sami will reply manually as soon as possible.',
    roman: 'Sami jald hi manually reply karenge.',
    urdu: 'Sami جلد ہی manually reply کریں گے۔'
});

const getRomanBudgetPhrase = (budget = '') => {
    const normalizedBudget = normalizeText(budget);
    if (!budget) return '';
    if (normalizedBudget.includes('need guidance') || normalizedBudget.includes('guidance')) {
        return 'aur budget guidance needed hai';
    }
    return `aur budget ${budget.trim()} hai`;
};

const getFormReply = (leadUpdate, style) => {
    const namePart = leadUpdate.name ? `${toTitleCase(leadUpdate.name)}, ` : '';
    const question = leadUpdate.serviceType
        ? getServiceQualificationQuestion(leadUpdate.serviceType, style)
        : getNewProjectQuestion(style);

    if (style === 'english') {
        const businessPart = leadUpdate.business ? ` for ${leadUpdate.business}` : '';
        const budgetPart = leadUpdate.budget ? ` Budget noted: ${leadUpdate.budget}.` : '';
        const servicePart = leadUpdate.serviceType ? `${leadUpdate.serviceType}${businessPart}` : 'your project';
        return `Got it ${namePart}you need ${servicePart}.${budgetPart} ${question}`;
    }

    if (style === 'urdu') {
        const businessPart = leadUpdate.business ? `${leadUpdate.business} business کے لیے ` : '';
        const budgetPart = leadUpdate.budget ? ` Budget noted: ${leadUpdate.budget}.` : '';
        const servicePart = leadUpdate.serviceType ? `${businessPart}${leadUpdate.serviceType}` : 'project';
        return `جی ${namePart}سمجھ گیا۔ آپ ${servicePart} چاہتے ہیں.${budgetPart} ${question}`;
    }

    const businessPart = leadUpdate.business ? `${leadUpdate.business} business ke liye ` : '';
    const budgetPart = leadUpdate.budget ? ` ${getRomanBudgetPhrase(leadUpdate.budget)}` : '';
    const servicePart = leadUpdate.serviceType ? `${businessPart}${leadUpdate.serviceType.toLowerCase()}` : 'project';
    return `Jee ${namePart}samajh gaya. Aap ${servicePart} chahte hain${budgetPart}. ${question}`;
};

const getLegacyRuleBasedAssistantResponse = ({ messageText = '', intent, lead = {}, parsedLead = {} }) => {
    const isPrefilledWebsiteMessage = isWebsiteBuildPlanMessage(messageText);
    const style = isPrefilledWebsiteMessage ? 'roman' : detectLanguageStyle(messageText);
    const leadUpdate = {
        ...inferLeadUpdateFromIntent(intent),
        ...parsedLead
    };
    const mergedLead = { ...lead, ...leadUpdate };
    const lowerText = normalizeText(messageText);

    if (Object.keys(parsedLead).length > 0) {
        return {
            reply: getFormReply(leadUpdate, style),
            leadUpdate,
            intent: 'new_project',
            stage: LEAD_STAGES.ASKED_REQUIREMENTS,
            pauseAI: false
        };
    }

    if (isPrefilledWebsiteMessage) {
        return {
            reply: getNewProjectQuestion(style),
            leadUpdate,
            intent: 'new_project',
            stage: LEAD_STAGES.ASKED_PROJECT_TYPE,
            pauseAI: false
        };
    }

    if (intent === 'spam') {
        return {
            reply: getClarificationReply(style),
            leadUpdate,
            intent,
            stage: lead.stage || LEAD_STAGES.NEW,
            pauseAI: false
        };
    }

    if (intent === 'ask_portfolio') {
        return {
            reply: getPortfolioReply(style),
            leadUpdate,
            intent,
            stage: lead.stage || LEAD_STAGES.NEW,
            pauseAI: false
        };
    }

    if (includesAny(lowerText, ['samii.pk', 'main website', 'website link', 'build plan page'])) {
        return {
            reply: getWebsiteReply(style),
            leadUpdate,
            intent: intent === 'unknown' ? 'ask_services' : intent,
            stage: lead.stage || LEAD_STAGES.NEW,
            pauseAI: false
        };
    }

    if (intent === 'greeting') {
        return {
            reply: getGreetingReply(style),
            leadUpdate,
            intent,
            stage: LEAD_STAGES.ASKED_PROJECT_TYPE,
            pauseAI: false
        };
    }

    if (intent === 'ask_services') {
        return {
            reply: getServicesReply(style),
            leadUpdate,
            intent,
            stage: LEAD_STAGES.ASKED_PROJECT_TYPE,
            pauseAI: false
        };
    }

    if (intent === 'ask_price') {
        const finalQuoteRequest = includesAny(lowerText, ['final quote', 'final quotation', 'exact quote', 'final price', 'quotation bhejo']);
        const shouldPause = finalQuoteRequest && hasEnoughLeadDetails(mergedLead);

        if (shouldPause) {
            return {
                reply: getTalkToSamiReply(style, true),
                leadUpdate,
                intent,
                stage: LEAD_STAGES.HANDED_OFF,
                pauseAI: true,
                handoffReason: 'User asked for a final quote after sharing lead details'
            };
        }

        return {
            reply: getPriceReply(style),
            leadUpdate,
            intent,
            stage: LEAD_STAGES.ASKED_REQUIREMENTS,
            pauseAI: false
        };
    }

    if (intent === 'talk_to_sami') {
        const shouldPause = hasEnoughLeadDetails(mergedLead);
        return {
            reply: getTalkToSamiReply(style, shouldPause),
            leadUpdate,
            intent,
            stage: shouldPause ? LEAD_STAGES.HANDED_OFF : (lead.stage || LEAD_STAGES.NEW),
            pauseAI: shouldPause,
            handoffReason: shouldPause ? 'User asked to talk to Sami after sharing lead details' : ''
        };
    }

    if (intent === 'urgent_call') {
        const shouldPause = hasEnoughLeadDetails(mergedLead);
        return {
            reply: getCallReply(style, shouldPause),
            leadUpdate,
            intent,
            stage: shouldPause ? LEAD_STAGES.HANDED_OFF : (lead.stage || LEAD_STAGES.NEW),
            pauseAI: shouldPause,
            handoffReason: shouldPause ? 'User requested a call after sharing lead details' : ''
        };
    }

    if (intent === 'ask_timeline') {
        return {
            reply: template(style, {
                english: 'Timeline depends on pages and features. What type of website or app do you need?',
                roman: 'Timeline pages aur features par depend karti hai. Aapko kis type ki website ya app chahiye?',
                urdu: 'Timeline pages اور features پر depend کرتی ہے۔ آپ کو کس type کی website یا app چاہیے؟'
            }),
            leadUpdate,
            intent,
            stage: LEAD_STAGES.ASKED_REQUIREMENTS,
            pauseAI: false
        };
    }

    if (intent === 'existing_client') {
        return {
            reply: template(style, {
                english: 'Sure. Please share the website/project name and what change or issue you need fixed.',
                roman: 'Jee. Website/project ka naam aur jo change ya issue hai wo bata dein.',
                urdu: 'جی۔ Website/project کا نام اور جو change یا issue ہے وہ بتا دیں۔'
            }),
            leadUpdate,
            intent,
            stage: LEAD_STAGES.ASKED_REQUIREMENTS,
            pauseAI: false
        };
    }

    if (['ask_odoo', 'ask_ecommerce', 'ask_business_website', 'ask_admin_dashboard', 'ask_custom_web_app'].includes(intent)) {
        return {
            reply: getServiceQualificationQuestion(leadUpdate.serviceType, style),
            leadUpdate,
            intent,
            stage: LEAD_STAGES.ASKED_REQUIREMENTS,
            pauseAI: false
        };
    }

    if (intent === 'new_project') {
        return {
            reply: getNewProjectQuestion(style),
            leadUpdate,
            intent,
            stage: LEAD_STAGES.ASKED_PROJECT_TYPE,
            pauseAI: false
        };
    }

    if (isLowSignalMessage(messageText)) {
        return {
            reply: getClarificationReply(style),
            leadUpdate,
            intent: 'unknown',
            stage: lead.stage || LEAD_STAGES.NEW,
            pauseAI: false
        };
    }

    return null;
};

export const getRuleBasedAssistantResponse = ({ messageText = '', intent, lead = {}, parsedLead = {} }) => {
    const isPrefilledWebsiteMessage = isWebsiteBuildPlanMessage(messageText);
    const style = isPrefilledWebsiteMessage ? 'roman' : detectLanguageStyle(messageText);
    const messageLeadUpdate = inferLeadUpdateFromMessage(messageText, lead);
    const leadUpdate = {
        ...inferLeadUpdateFromIntent(intent),
        ...messageLeadUpdate,
        ...parsedLead
    };
    const mergedLead = { ...lead, ...leadUpdate };
    const lowerText = normalizeText(messageText);
    const usefulProjectContext = hasUsefulProjectContext(messageText, leadUpdate);
    const resetContextUpdate = usefulProjectContext
        ? { unclearCount: 0, offTopicCount: 0, lastBotQuestionType: '' }
        : {};
    const withDefaults = (result) => ({
        leadUpdate,
        intent,
        stage: lead.stage || LEAD_STAGES.NEW,
        pauseAI: false,
        contextUpdate: resetContextUpdate,
        ...result
    });

    if (detectNotInterested(messageText)) {
        return withDefaults({
            reply: getNotInterestedReply(style),
            intent: 'not_interested',
            contextUpdate: {
                ...resetContextUpdate,
                lastBotQuestionType: ''
            }
        });
    }

    if (detectAffirmative(messageText) && ['service_choice', 'project_type'].includes(lead.lastBotQuestionType)) {
        const affirmativeStyle = detectAffirmativeLanguageStyle(messageText);

        return withDefaults({
            reply: getAffirmativeServiceChoiceReply(affirmativeStyle),
            intent: 'new_project',
            stage: LEAD_STAGES.ASKED_PROJECT_TYPE,
            pauseAI: false,
            contextUpdate: {
                ...resetContextUpdate,
                lastBotQuestionType: 'service_choice'
            }
        });
    }

    if (intent === 'ask_completed_work' || detectCompletedWorkRequest(messageText)) {
        return withDefaults({
            reply: getCompletedWorkReply(getSafeReplyStyle(messageText)),
            intent: 'ask_completed_work',
            pauseAI: false
        });
    }

    if (intent === 'ask_portfolio' || detectPortfolioRequest(messageText)) {
        return withDefaults({
            reply: getPortfolioLinkReply(getSafeReplyStyle(messageText)),
            intent: 'ask_portfolio',
            pauseAI: false
        });
    }

    if (intent === 'ask_main_website' || detectMainWebsiteRequest(messageText)) {
        return withDefaults({
            reply: isBareWebsiteRequest(messageText) && ['service_choice', 'project_type'].includes(lead.lastBotQuestionType)
                ? getWebsiteDisambiguationReply(getSafeReplyStyle(messageText))
                : getMainWebsiteLinkReply(getSafeReplyStyle(messageText)),
            intent: 'ask_main_website',
            pauseAI: false
        });
    }

    const isPersonalFollowUp = (lead.personalQuestionCount || 0) > 0 &&
        detectPersonalFollowUp(messageText) &&
        !usefulProjectContext;

    if (intent === 'personal_question' || detectPersonalQuestion(messageText) || isPersonalFollowUp) {
        const isRepeat = (lead.personalQuestionCount || 0) > 0;

        return withDefaults({
            reply: isRepeat ? getPersonalHandoffReply(style) : getPersonalBoundaryReply(style),
            intent: 'personal_question',
            stage: isRepeat ? LEAD_STAGES.HANDED_OFF : LEAD_STAGES.PERSONAL_BOUNDARY,
            pauseAI: isRepeat,
            handoffReason: isRepeat ? 'Repeated personal/private question' : '',
            contextUpdate: {
                personalQuestionCount: (lead.personalQuestionCount || 0) + 1,
                lastBotQuestionType: 'personal_boundary'
            }
        });
    }

    const abuse = detectAbusiveOrInappropriate(messageText);
    if (intent === 'abusive' || abuse.isAbusive) {
        const shouldPause = abuse.severity === 'severe' || (lead.abuseCount || 0) > 0;

        return withDefaults({
            reply: getAbuseReply(style),
            intent: 'abusive',
            stage: shouldPause ? LEAD_STAGES.HANDED_OFF : LEAD_STAGES.OFF_TOPIC_WAITING,
            pauseAI: shouldPause,
            handoffReason: shouldPause ? 'Abusive or inappropriate message' : '',
            contextUpdate: {
                abuseCount: (lead.abuseCount || 0) + 1,
                offTopicCount: (lead.offTopicCount || 0) + 1,
                lastBotQuestionType: 'abuse_warning'
            }
        });
    }

    if (detectRepeatConfusion(messageText)) {
        const shouldPause = (lead.unclearCount || 0) > 0 ||
            ['clarification', 'unclear', 'off_topic', 'repeat_confusion'].includes(lead.lastBotQuestionType);

        return withDefaults({
            reply: shouldPause ? getRepeatedUnclearHandoffReply(style) : getUnclearOffTopicReply(style),
            intent: 'low_signal_repeated',
            stage: shouldPause ? LEAD_STAGES.HANDED_OFF : LEAD_STAGES.UNCLEAR_WAITING,
            pauseAI: shouldPause,
            handoffReason: shouldPause ? 'Repeated confusion after clarification' : '',
            contextUpdate: {
                unclearCount: (lead.unclearCount || 0) + 1,
                lastBotQuestionType: 'repeat_confusion'
            }
        });
    }

    if (intent === 'spam' || intent === 'nonsense' || intent === 'off_topic' || detectOffTopicOrNonsense(messageText, lead)) {
        const shouldPause = (lead.offTopicCount || 0) > 0 || (lead.unclearCount || 0) > 0;

        return withDefaults({
            reply: shouldPause ? getRepeatedUnclearHandoffReply(style) : getUnclearOffTopicReply(style),
            intent: intent === 'spam' ? 'spam' : 'off_topic',
            stage: shouldPause ? LEAD_STAGES.HANDED_OFF : LEAD_STAGES.OFF_TOPIC_WAITING,
            pauseAI: shouldPause,
            handoffReason: shouldPause ? 'Repeated unclear/off-topic messages' : '',
            contextUpdate: {
                unclearCount: (lead.unclearCount || 0) + 1,
                offTopicCount: (lead.offTopicCount || 0) + 1,
                lastBotQuestionType: 'off_topic'
            }
        });
    }

    if (Object.keys(parsedLead).length > 0) {
        const detailedBuildPlan = Boolean(mergedLead.serviceType && mergedLead.projectDetails && (mergedLead.budget || mergedLead.timeline));

        return withDefaults({
            reply: detailedBuildPlan ? getTalkToSamiReply(style, true) : getFormReply(leadUpdate, style),
            intent: 'new_project',
            stage: detailedBuildPlan ? LEAD_STAGES.HANDED_OFF : LEAD_STAGES.ASKED_REQUIREMENTS,
            pauseAI: detailedBuildPlan,
            handoffReason: detailedBuildPlan ? 'Detailed build-plan form completed' : '',
            contextUpdate: {
                ...resetContextUpdate,
                cameFromBuildPlan: true,
                buildPlanFormSubmitted: true,
                lastBotQuestionType: 'service_follow_up'
            }
        });
    }

    if (isPrefilledWebsiteMessage) {
        return withDefaults({
            reply: getNewProjectQuestion(style),
            intent: 'new_project',
            stage: LEAD_STAGES.ASKED_PROJECT_TYPE,
            pauseAI: false,
            contextUpdate: {
                ...resetContextUpdate,
                lastBotQuestionType: 'service_choice'
            }
        });
    }

    if (intent === 'ask_portfolio') {
        return withDefaults({
            reply: getPortfolioReply(style),
            intent,
            pauseAI: false
        });
    }

    if (includesAny(lowerText, ['samii.pk', 'main website', 'website link', 'build plan page'])) {
        return withDefaults({
            reply: getWebsiteReply(style),
            intent: intent === 'unknown' ? 'ask_services' : intent,
            pauseAI: false
        });
    }

    if (intent === 'greeting') {
        return withDefaults({
            reply: getGreetingReply(style),
            intent,
            stage: LEAD_STAGES.ASKED_PROJECT_TYPE,
            pauseAI: false,
            contextUpdate: {
                ...resetContextUpdate,
                lastBotQuestionType: 'service_choice'
            }
        });
    }

    if (intent === 'ask_services') {
        return withDefaults({
            reply: getServicesReply(style),
            intent,
            stage: LEAD_STAGES.ASKED_PROJECT_TYPE,
            pauseAI: false,
            contextUpdate: {
                ...resetContextUpdate,
                lastBotQuestionType: 'service_choice'
            }
        });
    }

    if (['ask_price', 'request_quote', 'final_pricing'].includes(intent)) {
        const handoffDecision = shouldPauseForQualifiedLead({
            lead: mergedLead,
            messageText,
            intent,
            stage: mergedLead.stage
        });

        if (handoffDecision.shouldPause) {
            return withDefaults({
                reply: getTalkToSamiReply(style, true),
                intent,
                stage: LEAD_STAGES.HANDED_OFF,
                pauseAI: true,
                leadScore: handoffDecision.leadScore,
                handoffReason: handoffDecision.handoffReason
            });
        }

        if ((leadUpdate.budget || leadUpdate.timeline) && (mergedLead.serviceType || mergedLead.projectDetails)) {
            return withDefaults({
                reply: getTimelineOrBudgetQuestion(style, mergedLead),
                intent,
                stage: !mergedLead.budget ? LEAD_STAGES.ASKED_BUDGET : LEAD_STAGES.ASKED_TIMELINE,
                pauseAI: false,
                contextUpdate: {
                    ...resetContextUpdate,
                    lastBotQuestionType: !mergedLead.budget ? 'budget' : 'timeline'
                }
            });
        }

        return withDefaults({
            reply: getPriceReply(style),
            intent,
            stage: LEAD_STAGES.ASKED_REQUIREMENTS,
            pauseAI: false,
            contextUpdate: {
                ...resetContextUpdate,
                lastBotQuestionType: 'requirements'
            }
        });
    }

    const handoffDecision = shouldPauseForQualifiedLead({
        lead: mergedLead,
        messageText,
        intent,
        stage: mergedLead.stage
    });

    if (handoffDecision.shouldPause) {
        return withDefaults({
            reply: getTalkToSamiReply(style, true),
            intent,
            stage: LEAD_STAGES.HANDED_OFF,
            pauseAI: true,
            leadScore: handoffDecision.leadScore,
            handoffReason: handoffDecision.handoffReason
        });
    }

    if ((leadUpdate.budget || leadUpdate.timeline) && (mergedLead.serviceType || mergedLead.projectDetails)) {
        return withDefaults({
            reply: getTimelineOrBudgetQuestion(style, mergedLead),
            intent: intent === 'unknown' ? 'qualified_lead' : intent,
            stage: !mergedLead.budget ? LEAD_STAGES.ASKED_BUDGET : LEAD_STAGES.ASKED_TIMELINE,
            pauseAI: false,
            contextUpdate: {
                ...resetContextUpdate,
                lastBotQuestionType: !mergedLead.budget ? 'budget' : 'timeline'
            }
        });
    }

    if (['talk_to_sami', 'urgent_call', 'wants_human', 'request_call', 'meeting_request'].includes(intent)) {
        return withDefaults({
            reply: intent === 'request_call' || intent === 'meeting_request'
                ? getCallReply(style, false)
                : getTalkToSamiReply(style, false),
            intent,
            stage: lead.stage || LEAD_STAGES.NEW,
            pauseAI: false,
            contextUpdate: {
                ...resetContextUpdate,
                lastBotQuestionType: 'handoff_context'
            }
        });
    }

    if (intent === 'ask_timeline') {
        return withDefaults({
            reply: template(style, {
                english: 'Timeline depends on pages and features. What type of website or app do you need?',
                roman: 'Timeline pages aur features par depend karti hai. Aapko kis type ki website ya app chahiye?',
                urdu: 'Timeline pages aur features par depend karti hai. Aapko kis type ki website ya app chahiye?'
            }),
            intent,
            stage: LEAD_STAGES.ASKED_REQUIREMENTS,
            pauseAI: false,
            contextUpdate: {
                ...resetContextUpdate,
                lastBotQuestionType: 'requirements'
            }
        });
    }

    if (intent === 'existing_client') {
        return withDefaults({
            reply: template(style, {
                english: 'Sure. Please share the website/project name and what change or issue you need fixed.',
                roman: 'Jee. Website/project ka naam aur jo change ya issue hai wo bata dein.',
                urdu: 'Jee. Website/project ka naam aur jo change ya issue hai wo bata dein.'
            }),
            intent,
            stage: LEAD_STAGES.ASKED_REQUIREMENTS,
            pauseAI: false,
            contextUpdate: {
                ...resetContextUpdate,
                lastBotQuestionType: 'requirements'
            }
        });
    }

    if (leadUpdate.projectDetails || (lead.serviceType && detectFeaturesOrPages(messageText))) {
        return withDefaults({
            reply: getTimelineOrBudgetQuestion(style, mergedLead),
            intent: intent === 'unknown' ? 'qualified_lead' : intent,
            stage: !mergedLead.budget ? LEAD_STAGES.ASKED_BUDGET : LEAD_STAGES.ASKED_TIMELINE,
            pauseAI: false,
            contextUpdate: {
                ...resetContextUpdate,
                lastBotQuestionType: !mergedLead.budget ? 'budget' : 'timeline'
            }
        });
    }

    if (['ask_odoo', 'ask_ecommerce', 'ask_business_website', 'ask_admin_dashboard', 'ask_custom_web_app'].includes(intent)) {
        return withDefaults({
            reply: getServiceQualificationQuestion(leadUpdate.serviceType, style),
            intent,
            stage: LEAD_STAGES.ASKED_REQUIREMENTS,
            pauseAI: false,
            contextUpdate: {
                ...resetContextUpdate,
                lastBotQuestionType: 'requirements'
            }
        });
    }

    if (intent === 'new_project') {
        return withDefaults({
            reply: getNewProjectQuestion(style),
            intent,
            stage: LEAD_STAGES.ASKED_PROJECT_TYPE,
            pauseAI: false,
            contextUpdate: {
                ...resetContextUpdate,
                lastBotQuestionType: 'service_choice'
            }
        });
    }

    if (isLowSignalMessage(messageText)) {
        return withDefaults({
            reply: getClarificationReply(style),
            intent: 'unknown',
            stage: LEAD_STAGES.UNCLEAR_WAITING,
            pauseAI: false,
            contextUpdate: {
                unclearCount: (lead.unclearCount || 0) + 1,
                lastBotQuestionType: 'unclear'
            }
        });
    }

    return getLegacyRuleBasedAssistantResponse({ messageText, intent, lead, parsedLead });
};

export const getPausedSafeAssistantResponse = ({ messageText = '', intent = '', lead = {} }) => {
    const style = getSafeReplyStyle(messageText);
    const text = normalizeLoose(messageText);
    const pauseReasonType = getPauseReasonType(lead.handoffReason || '');

    if (detectShortRepeatAck(messageText)) {
        return {
            reply: getShortNotedReply(style),
            intent: 'paused_acknowledgement'
        };
    }

    if (detectPausedTimelineQuestion(messageText)) {
        return {
            reply: getPausedTimelineReply(style),
            intent: 'paused_timeline'
        };
    }

    if (intent === 'ask_completed_work' || detectCompletedWorkRequest(messageText)) {
        return {
            reply: getCompletedWorkReply(style),
            intent: 'ask_completed_work'
        };
    }

    if (intent === 'ask_portfolio' || detectPortfolioRequest(messageText)) {
        return {
            reply: getPortfolioLinkReply(style),
            intent: 'ask_portfolio'
        };
    }

    if (intent === 'ask_main_website' || detectMainWebsiteRequest(messageText, { paused: true })) {
        return {
            reply: getMainWebsiteLinkReply(style),
            intent: 'ask_main_website'
        };
    }

    if (detectPausedForwardAckRequest(messageText)) {
        return {
            reply: getPausedForwardAckReply(style),
            intent: 'paused_acknowledgement'
        };
    }

    if (detectPersonalQuestion(messageText)) {
        return {
            reply: getPersonalBoundaryReply(style),
            intent: 'personal_question'
        };
    }

    if (intent === 'ask_portfolio' || includesAny(text, ['portfolio', 'portfolio dikhao', 'work samples', 'sample', 'samples', 'kaam dikhao'])) {
        return {
            reply: template(style, {
                english: `Sure, portfolio is here: ${SAMI_KNOWLEDGE.portfolioUrl}`,
                roman: `Jee, portfolio yahan hai: ${SAMI_KNOWLEDGE.portfolioUrl}`,
                urdu: `Jee, portfolio yahan hai: ${SAMI_KNOWLEDGE.portfolioUrl}`
            }),
            intent: 'ask_portfolio'
        };
    }

    if (includesAny(text, ['main website', 'website link', 'your website', 'you website', 'website?', 'samii.pk', 'site link', 'any site'])) {
        return {
            reply: template(style, {
                english: `Sure, main website is here: ${SAMI_KNOWLEDGE.mainWebsiteUrl}`,
                roman: `Jee, main website yahan hai: ${SAMI_KNOWLEDGE.mainWebsiteUrl}`,
                urdu: `Jee, main website yahan hai: ${SAMI_KNOWLEDGE.mainWebsiteUrl}`
            }),
            intent: 'ask_services'
        };
    }

    if (includesAny(text, [
        'detail forward',
        'details forward',
        'details gayi',
        'message mila',
        'sami ko bheja',
        'forward kardi',
        'forward kar di',
        'forward ho gayi'
    ])) {
        return {
            reply: template(style, {
                english: 'Yes, details have been forwarded. Sami will reply manually soon.',
                roman: 'Jee, details forward ho gayi hain. Sami jaldi manually reply karenge.',
                urdu: 'Jee, details forward ho gayi hain. Sami jaldi manually reply karenge.'
            }),
            intent: 'paused_acknowledgement'
        };
    }

    if (includesAny(text, ['reply kab', 'kab reply', 'sami reply', 'any update', 'koi update', 'waiting', 'jaldi reply'])) {
        return {
            reply: template(style, {
                english: 'Sami will reply manually soon.',
                roman: 'Sami jaldi manually reply karenge.',
                urdu: 'Sami jaldi manually reply karenge.'
            }),
            intent: 'paused_acknowledgement'
        };
    }

    const leadUpdate = inferLeadUpdateFromMessage(messageText, lead);
    if (
        pauseReasonType !== 'safety_confusion' &&
        Boolean(pauseReasonType) &&
        (intent === 'new_project' || hasUsefulProjectContext(messageText, leadUpdate))
    ) {
        return {
            reply: template(style, {
                english: 'Got it, your additional details have been received. Sami will reply manually soon.',
                roman: 'Jee, aapki additional details receive ho gayi hain. Sami jaldi manually reply karenge.',
                urdu: 'Jee, aapki additional details receive ho gayi hain. Sami jaldi manually reply karenge.'
            }),
            intent: 'paused_additional_details'
        };
    }

    if (intent === 'ask_services' || includesAny(text, ['services', 'service list', 'what do you build', 'tum kya kar sakte ho'])) {
        return {
            reply: template(style, {
                english: 'Sami builds business websites, portfolio websites, e-commerce stores, admin dashboards, Odoo portals, and custom web apps.',
                roman: 'Sami business websites, portfolio websites, e-commerce stores, admin dashboards, Odoo portals, aur custom web apps build karte hain.',
                urdu: 'Sami business websites, portfolio websites, e-commerce stores, admin dashboards, Odoo portals, aur custom web apps build karte hain.'
            }),
            intent: 'ask_services'
        };
    }

    if (includesAny(text, ['reply kab', 'kab reply', 'sami reply', 'any update', 'koi update', 'waiting', 'jaldi reply'])) {
        return {
            reply: getPausedAcknowledgementReply(style),
            intent: 'paused_acknowledgement'
        };
    }

    return null;
};

export const sanitizeAssistantReply = (reply = '') => {
    return reply.replace(/\[PAUSE\]/gi, '').trim();
};

export const buildLeadSummary = (lead = {}) => {
    const parts = [];
    if (lead.phone || lead.phoneNumber) parts.push(`Phone: ${lead.phone || lead.phoneNumber}`);
    if (lead.name) parts.push(`Name: ${lead.name}`);
    if (lead.business) parts.push(`Business: ${lead.business}`);
    if (lead.serviceType) parts.push(`Service: ${lead.serviceType}`);
    if (lead.budget) parts.push(`Budget: ${lead.budget}`);
    if (lead.timeline) parts.push(`Timeline: ${lead.timeline}`);
    if (lead.projectDetails) parts.push(`Details: ${lead.projectDetails}`);
    if (lead.intent) parts.push(`Last intent: ${lead.intent}`);
    if (typeof lead.leadScore === 'number') parts.push(`Lead score: ${lead.leadScore}`);
    if (typeof lead.unclearCount === 'number') parts.push(`Unclear count: ${lead.unclearCount}`);
    if (typeof lead.personalQuestionCount === 'number') parts.push(`Personal question count: ${lead.personalQuestionCount}`);
    if (typeof lead.offTopicCount === 'number') parts.push(`Off-topic count: ${lead.offTopicCount}`);
    if (lead.handoffReason) parts.push(`Handoff reason: ${lead.handoffReason}`);
    if (lead.stage) parts.push(`Stage: ${lead.stage}`);
    return parts.join(' | ');
};
