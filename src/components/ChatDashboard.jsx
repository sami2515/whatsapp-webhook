import React, { useState, useEffect, useRef } from 'react';
import { getConversations, getChatHistory, sendTextMessage, sendHelloWorldMessage, sendAudioMessage, sendImageMessage, BASE_URL } from '../services/whatsapp';
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
    const timerRef = useRef(null); // Renamed from timerIntervalRef

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newPhoneNumber, setNewPhoneNumber] = useState('');

    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null); // Added fileInputRef

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
    const handleStartRecording = async () => { // Removed e.preventDefault()
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            // Try explicit format useful for Meta/WhatsApp
            let options = { mimeType: 'audio/mp4' };
            if (!MediaRecorder.isTypeSupported('audio/mp4')) {
                options = { mimeType: 'audio/webm' }; // Fallback for browsers like Chrome
            }

            mediaRecorderRef.current = new MediaRecorder(stream, options);
            audioChunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorderRef.current.onstop = async () => {
                const mimeType = mediaRecorderRef.current.mimeType || 'audio/mp4';
                const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });

                // Create File object to pass explicitly
                const fileExtension = mimeType.includes('mp4') ? 'mp4' : 'webm';
                const audioFile = new File([audioBlob], `voice_message.${fileExtension}`, { type: mimeType });

                await sendVoiceMessage(audioFile);

                // Stop stream tracks after recording is done and processed
                if (mediaRecorderRef.current && mediaRecorderRef.current.stream) {
                    mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
                }
            };

            mediaRecorderRef.current.start();
            setIsRecording(true);
            setRecordingDuration(0);
            timerRef.current = setInterval(() => { // Changed to timerRef
                setRecordingDuration((prev) => prev + 1);
            }, 1000);
        } catch (error) {
            console.error('Error accessing microphone:', error);
            alert('Could not access microphone. Please check permissions.');
        }
    };

    const handleStopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            clearInterval(timerRef.current);
            setRecordingDuration(0);
        }
    };

    const handleCancelRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            // Stop recording but prevent the onstop event from sending
            mediaRecorderRef.current.onstop = null;
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            clearInterval(timerRef.current);
            setRecordingDuration(0);
            audioChunksRef.current = [];
            // Stop stream tracks
            if (mediaRecorderRef.current && mediaRecorderRef.current.stream) {
                mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
            }
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
                                    ) : msg.type === 'image' ? (
                                        <div className="image-message">
                                            {msg.mediaId ? (
                                                <img
                                                    src={`${BASE_URL}/media/${msg.mediaId}`}
                                                    alt="Photo"
                                                    style={{ maxWidth: '100%', borderRadius: '6px', marginBottom: '4px' }}
                                                />
                                            ) : (
                                                <div style={{ padding: '20px', backgroundColor: '#e9edef', borderRadius: '6px', textAlign: 'center' }}>
                                                    Sending image...
                                                </div>
                                            )}
                                            {msg.text && msg.text !== '📸 Photo' && <div className="message-header-text">{msg.text}</div>}
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
                            <>
                                <button
                                    type="button"
                                    className="attach-btn"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isLoading}
                                    title="Attach Image"
                                    style={{ width: '40px', height: '40px', minWidth: '40px', flexShrink: 0, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', color: '#54656f', cursor: 'pointer' }}
                                >
                                    <svg viewBox="0 0 24 24" style={{ width: '24px', height: '24px', minWidth: '24px' }} fill="currentColor">
                                        <path d="M1.816 15.556v.002c0 1.502.584 2.912 1.646 3.972s2.472 1.647 3.974 1.647a5.58 5.58 0 0 0 3.972-1.645l9.547-9.548c.769-.768 1.147-1.767 1.058-2.817-.079-.968-.548-1.927-1.319-2.698-1.594-1.592-4.068-1.711-5.517-.262l-7.916 7.915c-.881.881-.792 2.25.214 3.261.959.958 2.423 1.053 3.263.215l5.511-5.512c.28-.28.267-.722.053-.936l-.244-.244c-.191-.191-.567-.349-.957.04l-5.506 5.506c-.18.18-.635.127-.976-.214-.098-.097-.576-.613-.213-.973l7.915-7.917c.818-.817 2.267-.699 3.23.262.5.501.802 1.1.849 1.685.051.573-.156 1.111-.589 1.543l-9.547 9.549a3.97 3.97 0 0 1-2.829 1.171 3.975 3.975 0 0 1-2.83-1.173 3.973 3.973 0 0 1-1.172-2.828c0-1.071.415-2.076 1.172-2.83l7.209-7.211c.157-.157.264-.579.028-.814L11.5 4.36a.57.57 0 0 0-.834.018l-7.205 7.207a5.577 5.577 0 0 0-1.645 3.971z"></path>
                                    </svg>
                                </button>
                                <input
                                    type="file"
                                    accept="image/*"
                                    style={{ display: 'none' }}
                                    ref={fileInputRef}
                                    onChange={handleImageUpload}
                                />
                                <input
                                    type="text"
                                    className="chat-input"
                                    placeholder="Type a message..."
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    disabled={isLoading}
                                />
                            </>
                        )}

                        {isRecording ? (
                            <div className="recording-controls">
                                <button type="button" className="cancel-btn" onClick={handleCancelRecording} title="Delete" style={{ width: '40px', height: '40px', minWidth: '40px', flexShrink: 0, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <svg viewBox="0 0 24 24" style={{ width: '24px', height: '24px', minWidth: '24px' }} fill="currentColor">
                                        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"></path>
                                    </svg>
                                </button>
                                <button type="button" className="send-btn active-send" onClick={handleStopRecording} disabled={isLoading} title="Send" style={{ width: '40px', height: '40px', minWidth: '40px', flexShrink: 0, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <svg viewBox="0 0 24 24" style={{ width: '24px', height: '24px', minWidth: '24px' }} fill="currentColor">
                                        <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path>
                                    </svg>
                                </button>
                            </div>
                        ) : inputText.trim() ? (
                            <button type="submit" className="send-btn active-send" disabled={isLoading} style={{ width: '40px', height: '40px', minWidth: '40px', flexShrink: 0, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <svg viewBox="0 0 24 24" style={{ width: '24px', height: '24px', minWidth: '24px' }} fill="currentColor">
                                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path>
                                </svg>
                            </button>
                        ) : (
                            <button type="button" className="send-btn" onClick={handleStartRecording} disabled={isLoading} title="Record Voice" style={{ width: '40px', height: '40px', minWidth: '40px', flexShrink: 0, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <svg viewBox="0 0 24 24" style={{ width: '24px', height: '24px', minWidth: '24px' }} fill="currentColor">
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
