import { SAMI_KNOWLEDGE } from '../data/samiKnowledge.js';

export const LEAD_STAGES = {
    NEW: 'new',
    ASKED_PROJECT_TYPE: 'asked_project_type',
    ASKED_REQUIREMENTS: 'asked_requirements',
    ASKED_TIMELINE: 'asked_timeline',
    ASKED_BUDGET: 'asked_budget',
    QUALIFIED: 'qualified',
    HANDED_OFF: 'handed_off'
};

const WEBSITE_BUILD_PLAN_TEXT = 'hi sami, i want a web development build plan.';

const normalizeText = (text = '') => text.toLowerCase().replace(/\s+/g, ' ').trim();

const includesAny = (text, keywords) => keywords.some((keyword) => text.includes(keyword));

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
        projectDetails: parsed.projectDetails
    };

    return Object.fromEntries(Object.entries(leadUpdate).filter(([, value]) => Boolean(value)));
};

export const detectLanguageStyle = (messageText = '') => {
    const text = normalizeText(messageText);
    const hasUrduScript = /[\u0600-\u06FF]/.test(messageText);
    if (hasUrduScript) return 'urdu';

    const romanUrduMarkers = [
        'jee', 'ji', 'han', 'haan', 'mujhe', 'mjy', 'chahiye', 'chahye', 'banwani',
        'banwana', 'dikhao', 'kya', 'kia', 'kitna', 'krni', 'karni', 'kaam', 'baat',
        'hai', 'hain', 'ha', 'ho', 'karte', 'bata', 'bta', 'bhejo', 'se', 'ke liye'
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

    if (/(https?:\/\/|www\.)/.test(text) && !text.includes('samii.pk')) return 'spam';
    if (includesAny(text, ['casino', 'betting', 'crypto profit', 'loan offer', 'adult'])) return 'spam';

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
    if (includesAny(text, ['services', 'service list', 'kya kaam', 'konse kaam', 'what do you build'])) {
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
        includesAny(text, ['website banwani', 'website banwana', 'web development', 'build plan', 'project banwana', 'site banwani'])
    ) {
        return 'new_project';
    }
    if (/^(hi|hello|hey|salam|salaam|assalam|aoa|jee|ji|hy)$/.test(text)) return 'greeting';

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
    if (intent === 'ask_price') return LEAD_STAGES.ASKED_REQUIREMENTS;
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

export const getRuleBasedAssistantResponse = ({ messageText = '', intent, lead = {}, parsedLead = {} }) => {
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

export const sanitizeAssistantReply = (reply = '') => {
    return reply.replace(/\[PAUSE\]/gi, '').trim();
};

export const buildLeadSummary = (lead = {}) => {
    const parts = [];
    if (lead.name) parts.push(`Name: ${lead.name}`);
    if (lead.business) parts.push(`Business: ${lead.business}`);
    if (lead.serviceType) parts.push(`Service: ${lead.serviceType}`);
    if (lead.budget) parts.push(`Budget: ${lead.budget}`);
    if (lead.timeline) parts.push(`Timeline: ${lead.timeline}`);
    if (lead.projectDetails) parts.push(`Details: ${lead.projectDetails}`);
    if (lead.intent) parts.push(`Last intent: ${lead.intent}`);
    if (lead.stage) parts.push(`Stage: ${lead.stage}`);
    return parts.join(' | ');
};
