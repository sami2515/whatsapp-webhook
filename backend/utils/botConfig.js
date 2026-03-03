export const BOT_CONFIG = {
    // Basic settings (can be moved to DB later)
    ENABLED: false,
    LIVE_STATUS: "Available 🟢", // e.g., "Sleeping 😴", "Driving 🚗"

    // Messages
    WELCOME_MESSAGE: "Assalam o Alaikum! 👋\n\nMain Sami ka *Personal AI Assistant* hoon. Sami abhi dastiyab nahi hain, unka current status hai: *{{STATUS}}*.\n\nAapko kya kaam tha? Neechay diye gaye Menu se muntakhib karein:",

    BIO_MESSAGE: "Sami ek Software Developer aur Tech Enthusiast hain! 🚀\n\nWoh hamesha new technologies seekhne aur behtareen applications bananane mein masroof rehte hain.",

    SOCIAL_LINKS: "Aap Sami se yahan connect kar sakte hain:\n\n📸 Instagram: https://instagram.com/sami\n📘 Facebook: https://facebook.com/sami\n💼 LinkedIn: https://linkedin.com/in/sami",

    LEAVE_MESSAGE_PROMPT: "Aap apna paigham neechay type kar ke forward kar dein, main Sami ko pohncha dunga! 📝",

    URGENT_MESSAGE_ACK: "🚨 Main ne aapka message *URGENT* mark kar diya hai. Sami isay sab se pehle dekhenge!"
};

// WhatsApp Interactive List Message Payload builder
export const buildInteractiveMenuPayload = (toPhoneNumber) => {
    return {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: toPhoneNumber,
        type: "interactive",
        interactive: {
            type: "list",
            header: {
                type: "text",
                text: "🤖 Sami's AI Assistant"
            },
            body: {
                text: BOT_CONFIG.WELCOME_MESSAGE.replace('{{STATUS}}', BOT_CONFIG.LIVE_STATUS)
            },
            footer: {
                text: "Select an option below"
            },
            action: {
                button: "Open Menu 📋",
                sections: [
                    {
                        title: "Get to Know Sami",
                        rows: [
                            {
                                id: "btn_bio",
                                title: "📖 Sami Ka Bayan",
                                description: "Know more about him"
                            },
                            {
                                id: "btn_social",
                                title: "📱 Social Media Links",
                                description: "Connect on Insta/FB"
                            }
                        ]
                    },
                    {
                        title: "Contact Options",
                        rows: [
                            {
                                id: "btn_leave_msg",
                                title: "📝 Leave a Message",
                                description: "Send a normal text"
                            },
                            {
                                id: "btn_urgent",
                                title: "🚨 Mark as URGENT",
                                description: "I need him right now!"
                            }
                        ]
                    }
                ]
            }
        }
    };
};
