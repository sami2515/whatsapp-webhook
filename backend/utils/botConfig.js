import { TESTTAYAR_KNOWLEDGE } from '../data/testtayarKnowledge.js';

export const BOT_CONFIG = {
    ENABLED: true,
    LIVE_STATUS: 'Available',
    WELCOME_MESSAGE: `Walaikum Assalam! Main ${TESTTAYAR_KNOWLEDGE.assistantName} hoon. TestTayar par khushamdeed! Main aapki typing test ya kisi specific exam preparation mein kya madad kar sakta hoon?`,
    SOCIAL_LINKS: `Website: ${TESTTAYAR_KNOWLEDGE.mainWebsiteUrl}\nTyping Test: ${TESTTAYAR_KNOWLEDGE.typingTestUrl}\nMCQs Bank: ${TESTTAYAR_KNOWLEDGE.mcqsUrl}\nDaily Drill: ${TESTTAYAR_KNOWLEDGE.dailyDrillUrl}\nWhatsApp Support: ${TESTTAYAR_KNOWLEDGE.officialWhatsApp}\nEmail: ${TESTTAYAR_KNOWLEDGE.contactEmail}`,
    LEAVE_MESSAGE_PROMPT: 'Aap apna question ya requirement bhej dein, main guide kar deta hoon ya support team ko forward kar dunga.',
    URGENT_MESSAGE_ACK: 'Jee zaroor. Main support team ko inform kar raha hoon. Wo jald aap se contact karenge.'
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
                text: TESTTAYAR_KNOWLEDGE.assistantName
            },
            body: {
                text: BOT_CONFIG.WELCOME_MESSAGE
            },
            footer: {
                text: `${TESTTAYAR_KNOWLEDGE.platformName} - Exam & Typing Prep`
            },
            action: {
                button: 'Explore options',
                sections: [
                    {
                        title: 'TestTayar Tools & Books',
                        rows: [
                            {
                                id: 'btn_typing',
                                title: 'Typing Tests',
                                description: '1-10 min test, WPM & exam rooms'
                            },
                            {
                                id: 'btn_mcqs',
                                title: 'Subject MCQs',
                                description: '8 core subjects & CBT quizzes'
                            },
                            {
                                id: 'btn_daily_drill',
                                title: 'Daily Drill',
                                description: 'Typing + 10 MCQs + Readiness'
                            },
                            {
                                id: 'btn_pdf_book',
                                title: 'Rs. 300 PDF Book',
                                description: 'Preparation notes for your post'
                            },
                            {
                                id: 'btn_support',
                                title: 'Talk to Support',
                                description: 'Connect with human support'
                            }
                        ]
                    }
                ]
            }
        }
    };
};
