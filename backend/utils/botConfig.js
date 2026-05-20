import { SAMI_KNOWLEDGE } from '../data/samiKnowledge.js';

export const BOT_CONFIG = {
    ENABLED: true,
    LIVE_STATUS: 'Available',
    WELCOME_MESSAGE: `Jee, main ${SAMI_KNOWLEDGE.assistantName} hoon. Aap website, portal, e-commerce store, dashboard, ya custom web app ke bare mein baat karna chahte hain?`,
    SOCIAL_LINKS: `Main website: ${SAMI_KNOWLEDGE.mainWebsiteUrl}\nPortfolio: ${SAMI_KNOWLEDGE.portfolioUrl}\nDeveloper card: ${SAMI_KNOWLEDGE.developerCardUrl}\nEmail: ${SAMI_KNOWLEDGE.contactEmail}`,
    LEAVE_MESSAGE_PROMPT: 'Aap apni project requirement bhej dein, main Sami ko proper context ke sath forward kar dunga.',
    URGENT_MESSAGE_ACK: 'Jee zaroor. Aap topic bata dein taake main Sami ko proper context ke sath forward kar doon.'
};

export const buildInteractiveMenuPayload = (toPhoneNumber) => {
    return {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: toPhoneNumber,
        type: 'interactive',
        interactive: {
            type: 'list',
            header: {
                type: 'text',
                text: SAMI_KNOWLEDGE.assistantName
            },
            body: {
                text: BOT_CONFIG.WELCOME_MESSAGE
            },
            footer: {
                text: SAMI_KNOWLEDGE.businessName
            },
            action: {
                button: 'Open menu',
                sections: [
                    {
                        title: 'Quick options',
                        rows: [
                            {
                                id: 'btn_social',
                                title: 'Links',
                                description: 'Website, portfolio and card'
                            },
                            {
                                id: 'btn_leave_msg',
                                title: 'Project inquiry',
                                description: 'Share your requirement'
                            },
                            {
                                id: 'btn_urgent',
                                title: 'Talk to Sami',
                                description: 'Share topic for handoff'
                            }
                        ]
                    }
                ]
            }
        }
    };
};
