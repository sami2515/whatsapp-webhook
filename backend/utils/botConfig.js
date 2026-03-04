export const BOT_CONFIG = {
    // Basic settings (can be moved to DB later)
    ENABLED: false,
    LIVE_STATUS: "Available 🟢", // e.g., "Sleeping 😴", "Driving 🚗"

    // Messages
    WELCOME_MESSAGE: "Greetings! 👋\n\nYou have reached the office of Mr. Muhammad Sami. I am his AI Executive Assistant.\n\nMr. Sami is currently: *{{STATUS}}*.\n\nHow may I assist you today? Please choose an option from the menu below, or simply reply to chat with me.",

    SOCIAL_LINKS: "You may connect with Mr. Sami through his professional profiles:\n\n💼 LinkedIn: https://linkedin.com/in/sami\n🐦 X (Twitter): https://x.com/sami\n📘 Facebook: https://facebook.com/sami",

    LEAVE_MESSAGE_PROMPT: "Please type your message, and I will ensure it reaches Mr. Sami upon his return. 📝",

    URGENT_MESSAGE_ACK: "🚨 Your message has been marked as URGENT. Mr. Sami has been notified immediately, and I have paused my AI responses so he can take over."
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
                        title: "Contact Options",
                        rows: [
                            {
                                id: "btn_social",
                                title: "📱 Social Media Links",
                                description: "Connect professionally"
                            },
                            {
                                id: "btn_leave_msg",
                                title: "📝 Leave a Message",
                                description: "Send a normal text"
                            },
                            {
                                id: "btn_urgent",
                                title: "🚨 Mark as URGENT",
                                description: "Notify Mr. Sami immediately"
                            }
                        ]
                    }
                ]
            }
        }
    };
};
