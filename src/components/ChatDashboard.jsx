import { useState, useEffect, useRef } from 'react';
import { getConversations, getChatHistory, sendTextMessage, sendHelloWorldMessage } from '../services/whatsapp';
import './ChatDashboard.css';

export default function ChatDashboard() {
    const [conversations, setConversations] = useState([]);
    const [activeNumber, setActiveNumber] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newPhoneNumber, setNewPhoneNumber] = useState('');

    const messagesEndRef = useRef(null);

    // Initial load
    useEffect(() => {
        fetchConversations();
        // Start polling for new messages every 5 seconds
        const interval = setInterval(fetchConversations, 5000);
        return () => clearInterval(interval);
    }, []);

    // When active chat changes, load messages immediately
    useEffect(() => {
        if (activeNumber) {
            fetchMessages(activeNumber);
            const interval = setInterval(() => fetchMessages(activeNumber), 5000);
            return () => clearInterval(interval);
        }
    }, [activeNumber]);

    // Auto scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const fetchConversations = async () => {
        try {
            const data = await getConversations();
            setConversations(data);
        } catch (error) {
            console.error('Failed to load conversations', error);
        }
    };

    const fetchMessages = async (phoneNumber) => {
        try {
            const data = await getChatHistory(phoneNumber);
            setMessages(data);
        } catch (error) {
            console.error('Failed to load messages', error);
        }
    };

    const handleSendText = async (e) => {
        e.preventDefault();
        if (!inputText.trim() || !activeNumber) return;

        setIsLoading(true);
        try {
            // Optimistically add to UI
            const tempMsg = {
                _id: Date.now().toString(),
                text: inputText,
                from: 'me', // Not strictly needed but helps styling
                status: 'sent',
                timestamp: new Date().toISOString()
            };
            setMessages(prev => [...prev, tempMsg]);

            const textToSend = inputText;
            setInputText('');

            await sendTextMessage(activeNumber, textToSend);
            await fetchMessages(activeNumber); // Refresh
            await fetchConversations();
        } catch (error) {
            alert(`Failed to send message: ${error.response?.data?.error?.message || error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleStartNewChat = async () => {
        if (!newPhoneNumber) return;

        setIsLoading(true);
        try {
            // Must send a template to initiate a 24h window if they haven't messaged us
            await sendHelloWorldMessage(newPhoneNumber);
            setActiveNumber(newPhoneNumber);
            setIsModalOpen(false);
            setNewPhoneNumber('');
            await fetchConversations();
            await fetchMessages(newPhoneNumber);
        } catch (error) {
            alert(`Error initiating chat: ${error.response?.data?.error?.message || error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const formatTime = (isoString) => {
        const date = new Date(isoString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const myNumberId = import.meta.env.VITE_WHATSAPP_PHONE_NUMBER_ID; // Optional if we just check 'received'

    return (
        <div className="chat-container">
            {/* Sidebar */}
            <div className="sidebar">
                <div className="sidebar-header">
                    <h2>Chats</h2>
                    <button className="new-chat-btn" onClick={() => setIsModalOpen(!isModalOpen)}>
                        + New
                    </button>
                </div>

                {isModalOpen && (
                    <div className="new-chat-modal">
                        <input
                            type="text"
                            placeholder="e.g. 923001234567"
                            value={newPhoneNumber}
                            onChange={(e) => setNewPhoneNumber(e.target.value)}
                        />
                        <button onClick={handleStartNewChat} disabled={isLoading}>
                            Send Initial Template
                        </button>
                        <small style={{ color: '#6c757d', lineHeight: '1.2' }}>
                            * Note: Meta requires sending an approved Template (like 'hello_world')
                            first to open a 24hr customer service window.
                        </small>
                    </div>
                )}

                <div className="conversation-list">
                    {conversations.length === 0 && (
                        <div style={{ padding: '20px', textAlign: 'center', color: '#888' }}>
                            No conversations yet.
                        </div>
                    )}
                    {conversations.map((conv) => (
                        <div
                            key={conv._id}
                            className={`conversation-item ${activeNumber === conv._id ? 'active' : ''}`}
                            onClick={() => setActiveNumber(conv._id)}
                        >
                            <div className="conv-header">
                                <span className="conv-phone">+{conv._id}</span>
                                <span className="conv-time">{formatTime(conv.timestamp)}</span>
                            </div>
                            <div className="conv-preview">
                                {conv.unreadCount > 0 && <span style={{ color: '#25D366', fontWeight: 'bold' }}>• </span>}
                                {conv.lastMessage}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Chat Area */}
            {activeNumber ? (
                <div className="chat-area">
                    <div className="chat-header">
                        <h3>+{activeNumber}</h3>
                    </div>

                    <div className="messages-list">
                        {messages.map((msg) => {
                            const isSentByMe = msg.status !== 'received';
                            return (
                                <div key={msg._id} className={`message-bubble ${isSentByMe ? 'sent' : 'received'}`}>
                                    {msg.text}
                                    <span className="message-time">
                                        {formatTime(msg.timestamp)}
                                        {isSentByMe && (
                                            <span className={`message-status ${msg.status}`}>
                                                {msg.status === 'read' ? ' ✓✓' : msg.status === 'delivered' ? ' ✓✓' : ' ✓'}
                                            </span>
                                        )}
                                    </span>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </div>

                    <form className="chat-input-area" onSubmit={handleSendText}>
                        <input
                            type="text"
                            className="chat-input"
                            placeholder="Type a message..."
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            disabled={isLoading}
                        />
                        <button type="submit" className="send-btn" disabled={!inputText.trim() || isLoading}>
                            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path>
                            </svg>
                        </button>
                    </form>
                </div>
            ) : (
                <div className="no-chat-selected">
                    <p>Select a conversation or start a new chat to begin messaging.</p>
                </div>
            )}
        </div>
    );
}
