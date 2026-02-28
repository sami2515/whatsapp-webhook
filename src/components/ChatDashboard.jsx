import { useState, useEffect, useRef } from 'react';
import { getConversations, getChatHistory, sendTextMessage, sendHelloWorldMessage, sendAudioMessage, BASE_URL } from '../services/whatsapp';
import './ChatDashboard.css';

export default function ChatDashboard() {
    const [conversations, setConversations] = useState([]);
    const [activeNumber, setActiveNumber] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Voice Recording State
    const [isRecording, setIsRecording] = useState(false);
    const [recordingDuration, setRecordingDuration] = useState(0);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const timerIntervalRef = useRef(null);
    const isCancelledRef = useRef(false);

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

    // Voice Recording Logic
    const handleStartRecording = async (e) => {
        e.preventDefault();
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            audioChunksRef.current = [];
            isCancelledRef.current = false;

            mediaRecorderRef.current.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorderRef.current.onstop = async () => {
                if (!isCancelledRef.current) {
                    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/ogg' });
                    await sendVoiceMessage(audioBlob);
                }
            };

            mediaRecorderRef.current.start();
            setIsRecording(true);
            setRecordingDuration(0);
            timerIntervalRef.current = setInterval(() => {
                setRecordingDuration((prev) => prev + 1);
            }, 1000);
        } catch (error) {
            console.error('Error accessing microphone:', error);
            alert('Could not access microphone. Please check permissions.');
        }
    };

    const handleStopRecording = (e) => {
        e.preventDefault();
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            cleanupRecording();
        }
    };

    const handleCancelRecording = (e) => {
        e.preventDefault();
        if (mediaRecorderRef.current && isRecording) {
            isCancelledRef.current = true;
            mediaRecorderRef.current.stop();
            cleanupRecording();
        }
    };

    const cleanupRecording = () => {
        setIsRecording(false);
        clearInterval(timerIntervalRef.current);
        setRecordingDuration(0);
        if (mediaRecorderRef.current && mediaRecorderRef.current.stream) {
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        }
    };

    const sendVoiceMessage = async (audioBlob) => {
        if (!activeNumber) return;

        setIsLoading(true);
        try {
            const tempMsg = {
                _id: Date.now().toString(),
                type: 'audio',
                from: 'me',
                status: 'sent',
                timestamp: new Date().toISOString()
            };
            setMessages(prev => [...prev, tempMsg]);

            await sendAudioMessage(activeNumber, audioBlob);
            await fetchMessages(activeNumber); // Refresh
            await fetchConversations();
        } catch (error) {
            console.error('Failed to send voice message:', error);
            alert(`Failed to send voice message: ${error.response?.data?.error?.message || error.message}`);
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
                        {messages.map((msg, index) => {
                            const isSentByMe = msg.from !== activeNumber;
                            return (
                                <div key={msg._id || index} className={`message-bubble ${isSentByMe ? 'sent' : 'received'}`}>
                                    {msg.type === 'audio' ? (
                                        <div className="audio-message">
                                            {msg.mediaId ? (
                                                <audio controls src={`${BASE_URL}/media/${msg.mediaId}`} style={{ maxWidth: '200px' }} />
                                            ) : (
                                                <span style={{ fontStyle: 'italic' }}>Sending audio...</span>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="message-header-text">{msg.text}</div>
                                    )}
                                    <div className="message-time-container">
                                        <span className="message-time">
                                            {formatTime(msg.timestamp)}
                                        </span>
                                        {isSentByMe && (
                                            <span className={`message-status ${msg.status}`}>
                                                {msg.status === 'read' ? ' ✓✓' : msg.status === 'delivered' ? ' ✓✓' : ' ✓'}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </div>

                    <form className="chat-input-area" onSubmit={handleSendText}>
                        {isRecording ? (
                            <div className="recording-indicator">
                                <span className="recording-pulse"></span>
                                <span className="recording-timer">
                                    {Math.floor(recordingDuration / 60).toString().padStart(2, '0')}:
                                    {(recordingDuration % 60).toString().padStart(2, '0')}
                                </span>
                            </div>
                        ) : (
                            <input
                                type="text"
                                className="chat-input"
                                placeholder="Type a message..."
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                disabled={isLoading}
                            />
                        )}

                        {isRecording ? (
                            <div className="recording-controls">
                                <button type="button" className="cancel-btn" onClick={handleCancelRecording} title="Delete">
                                    <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                                        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"></path>
                                    </svg>
                                </button>
                                <button type="button" className="send-btn active-send" onClick={handleStopRecording} disabled={isLoading} title="Send">
                                    <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                                        <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path>
                                    </svg>
                                </button>
                            </div>
                        ) : inputText.trim() ? (
                            <button type="submit" className="send-btn active-send" disabled={isLoading}>
                                <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path>
                                </svg>
                            </button>
                        ) : (
                            <button type="button" className="send-btn" onClick={handleStartRecording} disabled={isLoading} title="Record Voice">
                                <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                                    <path d="M11.999 14.942c2.001 0 3.531-1.53 3.531-3.531V4.35c0-2.001-1.53-3.531-3.531-3.531S8.468 2.349 8.468 4.35v7.061c0 2.001 1.53 3.531 3.531 3.531zm6.238-3.53c0 3.531-2.942 6.002-6.237 6.002s-6.237-2.471-6.237-6.002H3.761c0 4.001 3.178 7.297 7.061 7.885v3.884h2.354v-3.884c3.884-.588 7.061-3.884 7.061-7.885h-2.002z"></path>
                                </svg>
                            </button>
                        )}
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
