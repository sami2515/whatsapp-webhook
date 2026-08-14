import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import EmojiPicker from 'emoji-picker-react';
import {
    getConversations,
    getChatHistory,
    sendTextMessage,
    sendTemplateMessage,
    sendAudioMessage,
    sendImageMessage,
    sendReaction,
    deleteLocalMessage,
    resumeAI,
    pauseAI,
    resetUserContext,
    getUserContext,
    getPushPublicKey,
    subscribeToPush,
    BASE_URL
} from '../services/whatsapp';
import './ChatDashboard.css';

export default function ChatDashboard() {
    const [conversations, setConversations] = useState([]);
    const [activeNumber, setActiveNumber] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Emoji & Action State
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [selectedMessageId, setSelectedMessageId] = useState(null);
    const [isSendingReaction, setIsSendingReaction] = useState(false);
    const [replyingTo, setReplyingTo] = useState(null);

    // Voice Recording State
    const [isRecording, setIsRecording] = useState(false);
    const [recordingDuration, setRecordingDuration] = useState(0);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const timerRef = useRef(null); // Renamed from timerIntervalRef

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newPhoneNumber, setNewPhoneNumber] = useState('');
    const [selectedTemplate, setSelectedTemplate] = useState('hello_world');
    const [isLeadDetailsOpen, setIsLeadDetailsOpen] = useState(false);

    // Bot Control State
    const [botEnabled, setBotEnabled] = useState(false);
    const [liveStatus, setLiveStatus] = useState("Available 🟢");
    const [isUpdatingBot, setIsUpdatingBot] = useState(false);
    const [activeLeadContext, setActiveLeadContext] = useState(null);
    const [chatControlMessage, setChatControlMessage] = useState('');

    // Web Push State
    const [pushEnabled, setPushEnabled] = useState(false);
    const [pushStatus, setPushStatus] = useState('checking');
    const [pushMessage, setPushMessage] = useState('');
    const [pushServerStatus, setPushServerStatus] = useState({ enabled: null, reason: '' });
    const [dashboardNotice, setDashboardNotice] = useState('');

    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const shouldForceScrollRef = useRef(true);
    const fileInputRef = useRef(null);
    const conversationSnapshotRef = useRef(new Map());
    const hasLoadedConversationsRef = useRef(false);

    // Initial load
    useEffect(() => {
        fetchConversations();
        fetchBotSettings();
        // Start polling for new messages every 5 seconds
        const interval = setInterval(fetchConversations, 5000);
        return () => clearInterval(interval);
    }, []);

    // When active chat changes, load messages immediately
    useEffect(() => {
        if (activeNumber) {
            shouldForceScrollRef.current = true;
            setChatControlMessage('');
            setIsLeadDetailsOpen(false);
            fetchMessages(activeNumber);
            fetchUserContext(activeNumber);
            const interval = setInterval(() => fetchMessages(activeNumber), 5000);
            return () => clearInterval(interval);
        } else {
            setActiveLeadContext(null);
            setIsLeadDetailsOpen(false);
        }
    }, [activeNumber]);

    // Check Push Subscription on load
    useEffect(() => {
        checkPushSubscription();
    }, []);

    useEffect(() => {
        if (!dashboardNotice) return;

        const timeout = setTimeout(() => setDashboardNotice(''), 5000);
        return () => clearTimeout(timeout);
    }, [dashboardNotice]);

    useEffect(() => {
        if (!chatControlMessage) return;

        const timeout = setTimeout(() => setChatControlMessage(''), 4000);
        return () => clearTimeout(timeout);
    }, [chatControlMessage]);

    useEffect(() => {
        if (!activeNumber || conversations.length === 0) return;

        const latestLead = conversations.find((conv) => conv._id === activeNumber)?.lead;
        if (latestLead) {
            setActiveLeadContext((current) => ({ ...(current || {}), ...latestLead }));
        }
    }, [conversations, activeNumber]);

    // Auto scroll to bottom
    useEffect(() => {
        const container = messagesContainerRef.current;
        
        if (!container || shouldForceScrollRef.current) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
            if (messages.length > 0) {
                shouldForceScrollRef.current = false;
            }
            return;
        }

        const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 300;

        if (isNearBottom) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
        }
    }, [messages]);

    async function fetchConversations() {
        try {
            const data = await getConversations();
            const previousSnapshot = conversationSnapshotRef.current;

            if (hasLoadedConversationsRef.current) {
                const newInbound = data.find((conversation) => {
                    const previous = previousSnapshot.get(conversation._id);
                    return conversation.lastMessageFrom === conversation._id &&
                        conversation.timestamp !== previous?.timestamp;
                });

                if (newInbound) {
                    setDashboardNotice(`New message from +${newInbound._id}`);
                }
            }

            conversationSnapshotRef.current = new Map(
                data.map((conversation) => [
                    conversation._id,
                    {
                        timestamp: conversation.timestamp,
                        unreadCount: conversation.unreadCount
                    }
                ])
            );
            hasLoadedConversationsRef.current = true;
            setConversations(data);
        } catch (error) {
            console.error('Failed to load conversations', error);
        }
    }

    async function fetchUserContext(phoneNumber) {
        try {
            const response = await getUserContext(phoneNumber);
            setActiveLeadContext(response.lead);
            return response.lead;
        } catch (error) {
            if (error.response?.status !== 404) {
                console.error('Failed to load user context', error);
            }
            setActiveLeadContext(null);
            return null;
        }
    }

    async function fetchBotSettings() {
        try {
            const response = await axios.get(`${BASE_URL}/bot-settings`);
            setBotEnabled(response.data.enabled);
            setLiveStatus(response.data.liveStatus);
        } catch (error) {
            console.error('Failed to load bot settings', error);
        }
    }

    const urlBase64ToUint8Array = (base64String) => {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    };

    const arrayBufferToBase64Url = (buffer) => {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i += 1) {
            binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    };

    const subscriptionMatchesServerKey = (subscription, publicKey) => {
        const applicationServerKey = subscription?.options?.applicationServerKey;
        if (!applicationServerKey || !publicKey) return true;
        return arrayBufferToBase64Url(applicationServerKey) === publicKey;
    };

    const ensureServiceWorkerRegistration = async () => {
        let registration = await navigator.serviceWorker.getRegistration();
        if (!registration) {
            try {
                registration = await navigator.serviceWorker.register('/sw.js');
            } catch (error) {
                console.error('Service worker registration failed:', error);
                throw error;
            }
        }
        return registration;
    };

    const checkPushSubscription = async () => {
        if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
            setPushStatus('unsupported');
            setPushMessage('Notifications are not supported in this browser.');
            return;
        }

        if (Notification.permission === 'denied') {
            setPushStatus('denied');
            setPushMessage('Notifications blocked in browser settings');
            return;
        }

        try {
            const vapid = await getPushPublicKey();
            const serverStatus = {
                enabled: Boolean(vapid.enabled),
                reason: vapid.reason || (vapid.enabled ? 'valid' : 'missing_vapid_keys')
            };
            setPushServerStatus(serverStatus);

            if (!serverStatus.enabled) {
                setPushEnabled(false);
                setPushStatus('server_disabled');
                setPushMessage('');
                return;
            }

            const registration = await ensureServiceWorkerRegistration();
            let subscription = await registration.pushManager.getSubscription();
            if (subscription && !subscriptionMatchesServerKey(subscription, vapid.publicKey)) {
                await subscription.unsubscribe();
                subscription = null;
            }

            if (subscription) {
                await subscribeToPush(subscription);
            }

            setPushEnabled(Boolean(subscription));
            setPushStatus(subscription ? 'granted' : (Notification.permission === 'granted' ? 'ready' : 'default'));
            setPushMessage(subscription ? 'Notifications enabled' : '');
        } catch (error) {
            console.error('Failed to check push subscription:', error);
            setPushStatus('error');
            setPushMessage('Could not check notification status.');
        }
    };

    const subscribeToPushNotifications = async () => {
        if (!('serviceWorker' in navigator)) {
            setPushStatus('unsupported');
            setPushMessage('Push notifications are not supported in this browser.');
            return;
        }

        setPushStatus('subscribing');
        setPushMessage('');

        try {
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                setPushStatus(permission === 'denied' ? 'denied' : 'default');
                setPushMessage(permission === 'denied'
                    ? 'Notifications blocked in browser settings'
                    : 'Notification permission was not granted.');
                return;
            }

            const registration = await ensureServiceWorkerRegistration();
            const vapid = await getPushPublicKey();
            setPushServerStatus({
                enabled: Boolean(vapid.enabled),
                reason: vapid.reason || (vapid.enabled ? 'valid' : 'missing_vapid_keys')
            });

            if (!vapid.enabled || !vapid.publicKey) {
                setPushStatus('server_disabled');
                setPushMessage('Push notifications are not configured on the server. Add valid VAPID keys and restart backend.');
                return;
            }

            let subscription = await registration.pushManager.getSubscription();
            if (subscription) {
                await subscription.unsubscribe();
            }

            subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(vapid.publicKey)
            });

            await subscribeToPush(subscription);
            setPushEnabled(true);
            setPushStatus('granted');
            setPushMessage('Notifications enabled');
        } catch (err) {
            console.error('Failed to subscribe:', err);
            setPushEnabled(false);
            setPushStatus('error');
            setPushMessage('Failed to enable push notifications. Check VAPID keys and browser permission.');
        }
    };

    const toggleBotState = async () => {
        setIsUpdatingBot(true);
        try {
            const newEnabledState = !botEnabled;
            await axios.post(`${BASE_URL}/bot-settings`, { enabled: newEnabledState });
            setBotEnabled(newEnabledState);
        } catch (error) {
            console.error('Failed to update bot state', error);
            alert('Failed to update AI Bot state');
        } finally {
            setIsUpdatingBot(false);
        }
    };

    const changeLiveStatus = async (newStatus) => {
        setIsUpdatingBot(true);
        try {
            await axios.post(`${BASE_URL}/bot-settings`, { liveStatus: newStatus });
            setLiveStatus(newStatus);
        } catch (error) {
            console.error('Failed to update live status', error);
            alert('Failed to update Live Status');
        } finally {
            setIsUpdatingBot(false);
        }
    };

    async function fetchMessages(phoneNumber) {
        try {
            const data = await getChatHistory(phoneNumber);
            setMessages(data);
        } catch (error) {
            console.error('Failed to load messages', error);
        }
    }

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
                timestamp: new Date().toISOString(),
                contextMessageId: replyingTo?.messageId
            };
            setMessages(prev => [...prev, tempMsg]);

            const textToSend = inputText;
            const contextId = replyingTo?.messageId;
            setInputText('');
            setReplyingTo(null);

            await sendTextMessage(activeNumber, textToSend, contextId);
            await fetchMessages(activeNumber); // Refresh
            await fetchConversations();
        } catch (error) {
            alert(`Failed to send message: ${error.response?.data?.error?.message || error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const onEmojiClick = (emojiObject) => {
        setInputText(prevInput => prevInput + emojiObject.emoji);
    };

    const handleReaction = async (msgIdToReact, emoji) => {
        if (!activeNumber || isSendingReaction || !msgIdToReact) return;
        setIsSendingReaction(true);
        try {
            await sendReaction(activeNumber, msgIdToReact, emoji);
            await fetchMessages(activeNumber);
        } catch (error) {
            console.error('Failed to send reaction:', error);
            alert('Failed to send reaction.');
        } finally {
            setIsSendingReaction(false);
            setSelectedMessageId(null);
        }
    };

    const handleDeleteMessage = async (msgMongoId) => {
        if (!window.confirm("Delete this message locally? (This won't delete it from the user's phone)")) return;

        try {
            await deleteLocalMessage(msgMongoId);
            setMessages(prev => prev.filter(m => m._id !== msgMongoId && m.messageId !== msgMongoId));
            setSelectedMessageId(null);
        } catch (error) {
            console.error('Failed to delete message:', error);
            alert('Failed to delete message.');
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

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file || !activeNumber) return;

        setIsLoading(true);
        try {
            const tempMsg = {
                _id: Date.now().toString(),
                type: 'image',
                from: 'me',
                status: 'sent',
                timestamp: new Date().toISOString()
            };
            setMessages(prev => [...prev, tempMsg]);

            await sendImageMessage(activeNumber, file);
            await fetchMessages(activeNumber); // Refresh
            await fetchConversations();
        } catch (error) {
            console.error('Failed to send image:', error);
            alert(`Failed to send image: ${error.response?.data?.error?.message || error.message}`);
        } finally {
            setIsLoading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleStartNewChat = async () => {
        if (!newPhoneNumber) return;

        setIsLoading(true);
        try {
            // Must send a template to initiate a 24h window if they haven't messaged us
            await sendTemplateMessage(newPhoneNumber, selectedTemplate);
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

    const activeConversation = conversations.find((conv) => conv._id === activeNumber);
    const activeLead = activeLeadContext || activeConversation?.lead;
    const isActiveAIPaused = Boolean(activeLead?.aiPaused || activeLead?.isAIPaused);
    const aiControlDisabled = isUpdatingBot || !activeNumber;
    const latestIntent = activeLead?.latestIntent || activeLead?.intent || 'unknown';
    const pushServerDisabled = pushServerStatus.enabled === false &&
        ['missing_vapid_keys', 'invalid_vapid_keys'].includes(pushServerStatus.reason);
    const leadSignalText = `Unclear: ${activeLead?.unclearCount || 0} · Personal: ${activeLead?.personalQuestionCount || 0} · Off-topic: ${activeLead?.offTopicCount || 0}`;

    const formatDateTime = (isoString) => {
        if (!isoString) return 'Not set';
        return new Date(isoString).toLocaleString([], {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };
    const pauseReasonTypeLabels = {
        serious_lead: 'Serious lead',
        safety_confusion: 'Safety/confusion',
        manual_or_unknown: 'Manual/unknown'
    };
    const pauseReasonTypeText = pauseReasonTypeLabels[activeLead?.pauseReasonType] || 'Not set';
    const autoResumeText = activeLead?.autoResumeEligible ? 'Yes' : 'No';

    const handleResumeAI = async () => {
        if (!activeNumber) return;

        setIsUpdatingBot(true);
        setChatControlMessage('');
        try {
            const response = await resumeAI(activeNumber);
            setActiveLeadContext(response.lead);
            await fetchConversations();
            await fetchUserContext(activeNumber);
            setChatControlMessage('AI resumed for this chat.');
        } catch (error) {
            setChatControlMessage(`Failed to resume AI: ${error.response?.data?.error || error.message}`);
        } finally {
            setIsUpdatingBot(false);
        }
    };

    const handlePauseAI = async () => {
        if (!activeNumber) return;

        setIsUpdatingBot(true);
        setChatControlMessage('');
        try {
            const response = await pauseAI(activeNumber);
            setActiveLeadContext(response.lead);
            await fetchConversations();
            await fetchUserContext(activeNumber);
            setChatControlMessage('AI paused for this chat.');
        } catch (error) {
            setChatControlMessage(`Failed to pause AI: ${error.response?.data?.error || error.message}`);
        } finally {
            setIsUpdatingBot(false);
        }
    };

    const handleResetLead = async () => {
        if (!activeNumber) return;

        const confirmReset = window.confirm(
            "Are you sure you want to reset this candidate's AI details? (Chat history will remain saved)."
        );
        if (!confirmReset) return;

        setIsUpdatingBot(true);
        setChatControlMessage('');
        try {
            const response = await resetUserContext(activeNumber);
            setActiveLeadContext(response.lead);
            await fetchConversations();
            await fetchUserContext(activeNumber);
            setChatControlMessage('Candidate AI details reset successfully.');
        } catch (error) {
            setChatControlMessage(`Failed to reset candidate details: ${error.response?.data?.error || error.message}`);
        } finally {
            setIsUpdatingBot(false);
        }
    };

    return (
        <div className={`chat-container ${activeNumber ? 'chat-active' : ''}`}>
            {/* Sidebar */}
            <div className="sidebar">
                <div className="sidebar-header">
                    <div className="sidebar-title-row">
                        <h2>Chats</h2>
                        <button className="new-chat-btn" onClick={() => setIsModalOpen(!isModalOpen)}>
                            + New
                        </button>
                    </div>

                    <div className="sidebar-controls-row">
                        {/* Bot Control Panel */}
                        <div className="bot-control-panel">
                            <select
                                value={liveStatus}
                                onChange={(e) => changeLiveStatus(e.target.value)}
                                disabled={isUpdatingBot}
                                className="status-dropdown"
                            >
                                <option value="Available 🟢">Available 🟢</option>
                                <option value="Busy 🔴">Busy 🔴</option>
                                <option value="Sleeping 😴">Sleeping 😴</option>
                                <option value="At the Gym 🏋️">At the Gym 🏋️</option>
                                <option value="Driving 🚗">Driving 🚗</option>
                            </select>
                            <button
                                className={`bot-toggle-btn ${botEnabled ? 'on' : 'off'}`}
                                onClick={toggleBotState}
                                disabled={isUpdatingBot}
                                title="Toggle AI Assistant Auto-Replies"
                            >
                                Bot: {botEnabled ? 'ON' : 'OFF'}
                            </button>
                        </div>

                        <div className="notification-control">
                            {pushEnabled ? (
                                <span className="notification-state enabled">Notifications enabled</span>
                            ) : pushStatus === 'denied' ? (
                                <span className="notification-state blocked">Notifications blocked in browser settings</span>
                            ) : (
                                <button
                                    className="new-chat-btn notification-btn"
                                    onClick={subscribeToPushNotifications}
                                    disabled={pushStatus === 'subscribing'}
                                    title="Enable mobile PWA push notifications"
                                >
                                    {pushStatus === 'subscribing' ? 'Enabling...' : 'Enable Notifications'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {pushMessage && (
                    <div className={`dashboard-inline-message ${pushStatus === 'error' || pushStatus === 'denied' || pushStatus === 'server_disabled' ? 'error' : 'success'}`}>
                        {pushMessage}
                    </div>
                )}

                {pushServerDisabled && (
                    <div className="push-server-note">
                        Server push keys missing/invalid.
                    </div>
                )}

                {dashboardNotice && (
                    <div className="dashboard-inline-message notice">
                        {dashboardNotice}
                    </div>
                )}

                {isModalOpen && (
                    <div className="modal-overlay">
                        <div className="premium-modal">
                            <div className="modal-header">
                                <h3>Start New Conversation</h3>
                                <button className="close-modal-btn" onClick={() => setIsModalOpen(false)}>×</button>
                            </div>
                            
                            <div className="modal-body">
                                <div className="form-group">
                                    <label>Recipient WhatsApp Number</label>
                                    <div className="phone-input-wrapper">
                                        <span className="country-code">+</span>
                                        <input
                                            type="text"
                                            placeholder="923001234567"
                                            value={newPhoneNumber}
                                            onChange={(e) => setNewPhoneNumber(e.target.value.replace(/[^0-9]/g, ''))}
                                        />
                                    </div>
                                    <small className="help-text">Include country code without '+' or '00'</small>
                                </div>

                                <div className="form-group">
                                    <label>Select Approved Template</label>
                                    <select 
                                        className="template-select"
                                        value={selectedTemplate}
                                        onChange={(e) => setSelectedTemplate(e.target.value)}
                                    >
                                        <option value="hello_world">hello_world (Default)</option>
                                        <option value="appointment_reminder">appointment_reminder</option>
                                        <option value="payment_update">payment_update</option>
                                    </select>
                                    <small className="help-text">WhatsApp requires sending a pre-approved template to start a 24-hour messaging window.</small>
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button className="btn-cancel" onClick={() => setIsModalOpen(false)}>Cancel</button>
                                <button className="btn-primary" onClick={handleStartNewChat} disabled={isLoading || !newPhoneNumber}>
                                    {isLoading ? 'Sending...' : 'Send Template'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="conversation-list">
                    {conversations.length === 0 && (
                        <div className="empty-conversations">
                            No conversations yet.
                        </div>
                    )}
                    {conversations.map((conv) => (
                        <div
                            key={conv._id}
                            className={`conversation-item ${activeNumber === conv._id ? 'active' : ''} ${conv.unreadCount > 0 ? 'unread' : ''}`}
                            onClick={() => setActiveNumber(conv._id)}
                        >
                            <div className="conv-header">
                                <span className="conv-phone">+{conv._id}</span>
                                <span className="conv-time">{formatTime(conv.timestamp)}</span>
                            </div>
                            {conv.lead && (
                                <div className="lead-badges">
                                    {conv.lead.aiPaused && <span className="lead-badge paused">AI paused</span>}
                                    {conv.lead.paymentSubmitted && <span className="lead-badge success">Receipt Sent 💵</span>}
                                    {conv.lead.bookInterested && !conv.lead.paymentSubmitted && <span className="lead-badge book">Book Rs. 300</span>}
                                    {conv.lead.targetExam && <span className="lead-badge exam">{conv.lead.targetExam}</span>}
                                    {conv.lead.targetWpm && <span className="lead-badge wpm">{conv.lead.targetWpm}</span>}
                                </div>
                            )}
                            <div className="conv-preview">
                                {conv.unreadCount > 0 && <span className="unread-badge">{conv.unreadCount}</span>}
                                {conv.lastMessageFrom && conv.lastMessageFrom !== conv._id && (
                                    <span className={`message-status conv-status ${conv.lastMessageStatus}`}>
                                        {conv.lastMessageStatus === 'read' ? (
                                            <svg viewBox="0 0 16 15" width="14" height="13" fill="currentColor"><path d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.879a.32.32 0 0 1-.484.033l-.358-.325a.319.319 0 0 0-.484.032l-.378.483a.418.418 0 0 0 .036.541l1.32 1.266c.143.14.361.125.484-.033l6.272-8.048a.366.366 0 0 0-.064-.512zm-4.1 0l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.879a.32.32 0 0 1-.484.033L1.891 7.769a.366.366 0 0 0-.515.006l-.423.433a.364.364 0 0 0 .006.514l3.258 3.185c.143.14.361.125.484-.033l6.272-8.048a.365.365 0 0 0-.063-.51z"></path></svg>
                                        ) : conv.lastMessageStatus === 'delivered' ? (
                                            <svg viewBox="0 0 16 15" width="14" height="13" fill="currentColor"><path d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.879a.32.32 0 0 1-.484.033l-.358-.325a.319.319 0 0 0-.484.032l-.378.483a.418.418 0 0 0 .036.541l1.32 1.266c.143.14.361.125.484-.033l6.272-8.048a.366.366 0 0 0-.064-.512zm-4.1 0l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.879a.32.32 0 0 1-.484.033L1.891 7.769a.366.366 0 0 0-.515.006l-.423.433a.364.364 0 0 0 .006.514l3.258 3.185c.143.14.361.125.484-.033l6.272-8.048a.365.365 0 0 0-.063-.51z"></path></svg>
                                        ) : (
                                            <svg viewBox="0 0 11 14" width="10" height="12" fill="currentColor"><path d="M10.426 3.114l-.478-.372a.365.365 0 0 0-.51.063L4.082 9.684a.32.32 0 0 1-.484.033L1.407 7.58a.366.366 0 0 0-.515.006l-.423.433a.364.364 0 0 0 .006.514l3.258 3.185c.143.14.361.125.484-.033l6.272-8.048a.365.365 0 0 0-.063-.51z"></path></svg>
                                        )}
                                    </span>
                                )}
                                <span className="preview-text">
                                    {conv.lastMessage?.startsWith('[URGENT]') || conv.lastMessage?.startsWith('[URGENT 🚨]') ? (
                                        <>
                                            <span className="urgent-tag">URGENT</span>
                                            {conv.lastMessage.replace('[URGENT] ', '').replace('[URGENT 🚨] ', '')}
                                        </>
                                    ) : (
                                        conv.lastMessage
                                    )}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Chat Area */}
            {activeNumber ? (
                <div className="chat-area">
                    <div className="chat-header">
                        <button className="back-btn" onClick={() => setActiveNumber(null)} aria-label="Back to chats">
                            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                                <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"></path>
                            </svg>
                        </button>
                        <div className="chat-title-block">
                            <h3>+{activeNumber}</h3>
                            {activeLead && (
                                <div className="chat-lead-line">
                                    {activeLead.name && <span>{activeLead.name}</span>}
                                    {(activeLead.targetExam || activeLead.serviceType) && <span>{activeLead.targetExam || activeLead.serviceType}</span>}
                                    {activeLead.targetWpm && <span>Goal: {activeLead.targetWpm}</span>}
                                    {activeLead.bookInterested && <span>Book: Rs. 300</span>}
                                </div>
                            )}
                        </div>
                        <div className="chat-header-actions">
                            <div className="chat-ai-status">
                                <span className={`ai-status-pill ${isActiveAIPaused ? 'paused' : 'active'}`}>
                                    AI: {isActiveAIPaused ? 'Paused' : 'Active'}
                                </span>
                                {isActiveAIPaused && (
                                    <>
                                        <span title={activeLead?.handoffReason || ''}>Reason: {activeLead?.handoffReason || 'Not set'}</span>
                                        <span>Paused: {formatDateTime(activeLead?.aiPausedAt)}</span>
                                        <span>Auto-resume: {autoResumeText}</span>
                                    </>
                                )}
                            </div>
                            {isActiveAIPaused ? (
                                <button
                                    type="button"
                                    className="resume-ai-btn"
                                    onClick={handleResumeAI}
                                    disabled={aiControlDisabled}
                                >
                                    {isUpdatingBot ? 'Updating...' : 'Resume AI'}
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    className="resume-ai-btn pause-ai-btn"
                                    onClick={handlePauseAI}
                                    disabled={aiControlDisabled}
                                >
                                    {isUpdatingBot ? 'Updating...' : 'Pause AI'}
                                </button>
                            )}
                            <button
                                type="button"
                                className="lead-details-btn"
                                onClick={() => setIsLeadDetailsOpen(true)}
                                disabled={!activeLead}
                            >
                                Candidate Details
                            </button>
                        </div>
                    </div>

                    {!botEnabled && (
                        <div className="global-bot-warning">
                            Global bot is off. Resume AI will not auto-reply until bot is on.
                        </div>
                    )}

                    {chatControlMessage && (
                        <div className={`chat-control-message ${chatControlMessage.startsWith('Failed') ? 'error' : 'success'}`}>
                            {chatControlMessage}
                        </div>
                    )}

                    {activeLead && isLeadDetailsOpen && (
                        <div
                            className="lead-details-backdrop"
                            role="presentation"
                            onClick={() => setIsLeadDetailsOpen(false)}
                        >
                            <aside
                                className="lead-details-drawer"
                                role="dialog"
                                aria-modal="true"
                                aria-labelledby="lead-details-title"
                                onClick={(event) => event.stopPropagation()}
                            >
                                <div className="lead-details-header">
                                    <div>
                                        <span className="lead-details-eyebrow">Selected Chat</span>
                                        <h3 id="lead-details-title">Candidate Details</h3>
                                        <p>+{activeNumber}</p>
                                    </div>
                                    <button
                                        type="button"
                                        className="lead-details-close"
                                        onClick={() => setIsLeadDetailsOpen(false)}
                                        aria-label="Close lead details"
                                    >
                                        ×
                                    </button>
                                </div>

                                <div className="lead-details-body">
                                    <div className="lead-summary-heading">
                                        <span>Candidate Summary</span>
                                        <strong>{isActiveAIPaused ? 'Handoff mode' : 'AI active'}</strong>
                                    </div>
                                    <div className="lead-summary-grid">
                                        <div className="lead-info-card">
                                            <span className="lead-label">Intent</span>
                                            <strong>{latestIntent}</strong>
                                        </div>
                                        <div className="lead-info-card">
                                            <span className="lead-label">Stage</span>
                                            <strong>{activeLead.stage || 'new'}</strong>
                                        </div>
                                        <div className="lead-info-card">
                                            <span className="lead-label">Target Exam</span>
                                            <strong>{activeLead.targetExam || activeLead.serviceType || 'Not set'}</strong>
                                        </div>
                                        <div className="lead-info-card">
                                            <span className="lead-label">Target WPM</span>
                                            <strong>{activeLead.targetWpm || 'Not set'}</strong>
                                        </div>
                                        <div className="lead-info-card">
                                            <span className="lead-label">Subject Interest</span>
                                            <strong>{activeLead.subjectInterest || 'Not set'}</strong>
                                        </div>
                                        <div className="lead-info-card">
                                            <span className="lead-label">Book Status</span>
                                            <strong>{activeLead.paymentSubmitted ? 'Payment Submitted' : activeLead.bookInterested ? 'Interested (Rs. 300)' : 'Not ordered'}</strong>
                                        </div>
                                        <div className="lead-info-card">
                                            <span className="lead-label">Readiness / Lead Score</span>
                                            <strong>{activeLead.leadScore ?? 0}</strong>
                                        </div>
                                        <div className="lead-info-card lead-summary-wide">
                                            <span className="lead-label">Signals</span>
                                            <strong>{leadSignalText}</strong>
                                        </div>
                                        <div className="lead-info-card lead-summary-wide">
                                            <span className="lead-label">Handoff Reason</span>
                                            <strong>{activeLead.handoffReason || 'Not set'}</strong>
                                        </div>
                                        <div className="lead-info-card">
                                            <span className="lead-label">Pause Type</span>
                                            <strong>{pauseReasonTypeText}</strong>
                                        </div>
                                        <div className="lead-info-card">
                                            <span className="lead-label">Paused At</span>
                                            <strong>{formatDateTime(activeLead.aiPausedAt)}</strong>
                                        </div>
                                        <div className="lead-info-card">
                                            <span className="lead-label">Auto-resume Eligible</span>
                                            <strong>{autoResumeText}</strong>
                                        </div>
                                        <div className="lead-info-card lead-summary-wide">
                                            <span className="lead-label">Summary</span>
                                            <strong>{activeLead.requirementSummary || activeLead.projectDetails || 'Not set'}</strong>
                                        </div>
                                    </div>

                                    <div className="lead-drawer-footer" style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                                        <button
                                            type="button"
                                            className="lead-reset-btn"
                                            onClick={handleResetLead}
                                            disabled={isUpdatingBot}
                                            style={{
                                                width: '100%',
                                                padding: '10px 14px',
                                                backgroundColor: '#dc2626',
                                                color: '#ffffff',
                                                border: 'none',
                                                borderRadius: '6px',
                                                fontWeight: '600',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '8px',
                                                fontSize: '13px'
                                            }}
                                        >
                                            🔄 Reset Candidate AI Details
                                        </button>
                                        <p style={{ margin: '8px 0 0', color: 'rgba(255,255,255,0.5)', fontSize: '11px', textAlign: 'center' }}>
                                            Chat history will remain saved in database. Only AI memory will be cleared.
                                        </p>
                                    </div>
                                </div>
                            </aside>
                        </div>
                    )}

                    <div className="messages-list" ref={messagesContainerRef}>
                        {messages.filter(m => m.type !== 'reaction').map((msg, index) => {
                            const isSentByMe = msg.from !== activeNumber;
                            const isSelected = selectedMessageId === msg._id;
                            const msgReactions = messages.filter(m => m.type === 'reaction' && m.contextMessageId === msg.messageId);
                            return (
                                <div
                                    key={msg._id || index}
                                    className={`message-bubble-wrapper ${isSentByMe ? 'sent' : 'received'}`}
                                    onClick={() => setSelectedMessageId(isSelected ? null : msg._id)}
                                >
                                    {isSelected && (
                                        <div className={`message-actions-overlay ${isSentByMe ? 'actions-right' : 'actions-left'}`}>
                                            <div className="quick-reactions">
                                                {['👍', '❤️', '😂', '😮', '😢', '🙏'].map(emoji => (
                                                    <span key={emoji} className="reaction-btn" onClick={(e) => { e.stopPropagation(); handleReaction(msg.messageId, emoji); }}>{emoji}</span>
                                                ))}
                                            </div>
                                            <button className="del-msg-btn" title="Reply" onClick={(e) => { e.stopPropagation(); setReplyingTo(msg); setSelectedMessageId(null); }}>↩️</button>
                                            <button className="del-msg-btn" title="Delete" onClick={(e) => { e.stopPropagation(); handleDeleteMessage(msg._id); }}>🗑️</button>
                                        </div>
                                    )}
                                    <div className={`message-bubble ${isSentByMe ? 'sent' : 'received'}`}>
                                        {msg.contextMessageId && (
                                            <div className={`reply-context-block ${isSentByMe ? 'sent-context' : 'received-context'}`}>
                                                {(() => {
                                                    const originalMsg = messages.find(m => m.messageId === msg.contextMessageId);
                                                    return originalMsg ? originalMsg.text : "Original message";
                                                })()}
                                            </div>
                                        )}
                                        {msg.type === 'audio' ? (
                                            <div className="audio-message">
                                                {msg.mediaId ? (
                                                    <audio controls src={`${BASE_URL}/media/${msg.mediaId}`} />
                                                ) : (
                                                    <span className="media-pending">Sending audio...</span>
                                                )}
                                            </div>
                                        ) : msg.type === 'image' ? (
                                            <div className="image-message">
                                                {msg.mediaId ? (
                                                    <img
                                                        src={`${BASE_URL}/media/${msg.mediaId}`}
                                                        alt="Photo"
                                                    />
                                                ) : (
                                                    <div className="media-placeholder">
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
                                                <span className={`message-status ${msg.status}`} title={msg.status}>
                                                    {msg.status === 'read' ? (
                                                        <svg viewBox="0 0 16 15" width="16" height="15" fill="currentColor"><path d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.879a.32.32 0 0 1-.484.033l-.358-.325a.319.319 0 0 0-.484.032l-.378.483a.418.418 0 0 0 .036.541l1.32 1.266c.143.14.361.125.484-.033l6.272-8.048a.366.366 0 0 0-.064-.512zm-4.1 0l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.879a.32.32 0 0 1-.484.033L1.891 7.769a.366.366 0 0 0-.515.006l-.423.433a.364.364 0 0 0 .006.514l3.258 3.185c.143.14.361.125.484-.033l6.272-8.048a.365.365 0 0 0-.063-.51z"></path></svg>
                                                    ) : msg.status === 'delivered' ? (
                                                        <svg viewBox="0 0 16 15" width="16" height="15" fill="currentColor"><path d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.879a.32.32 0 0 1-.484.033l-.358-.325a.319.319 0 0 0-.484.032l-.378.483a.418.418 0 0 0 .036.541l1.32 1.266c.143.14.361.125.484-.033l6.272-8.048a.366.366 0 0 0-.064-.512zm-4.1 0l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.879a.32.32 0 0 1-.484.033L1.891 7.769a.366.366 0 0 0-.515.006l-.423.433a.364.364 0 0 0 .006.514l3.258 3.185c.143.14.361.125.484-.033l6.272-8.048a.365.365 0 0 0-.063-.51z"></path></svg>
                                                    ) : (
                                                        <svg viewBox="0 0 11 14" width="11" height="14" fill="currentColor"><path d="M10.426 3.114l-.478-.372a.365.365 0 0 0-.51.063L4.082 9.684a.32.32 0 0 1-.484.033L1.407 7.58a.366.366 0 0 0-.515.006l-.423.433a.364.364 0 0 0 .006.514l3.258 3.185c.143.14.361.125.484-.033l6.272-8.048a.365.365 0 0 0-.063-.51z"></path></svg>
                                                    )}
                                                </span>
                                            )}
                                        </div>
                                        {msgReactions.length > 0 && (
                                            <div className="message-reactions">
                                                {msgReactions.map(r => <span key={r._id}>{r.text}</span>)}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </div>
                    <div className="composer-shell">
                        {replyingTo && (
                            <div className="replying-to-banner">
                                <div className="replying-to-copy">
                                    <span>Replying to</span>
                                    <div>
                                        {replyingTo.text}
                                    </div>
                                </div>
                                <button type="button" className="reply-cancel-btn" onClick={() => setReplyingTo(null)}>×</button>
                            </div>
                        )}
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
                                    className="emoji-toggle-btn"
                                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                    title="Add Emoji"
                                >
                                    <svg viewBox="0 0 24 24" aria-hidden="true">
                                        <path d="M12 22a10 10 0 1 1 10-10 10.012 10.012 0 0 1-10 10Zm0-2a8 8 0 1 0-8-8 8.009 8.009 0 0 0 8 8Zm-3.2-9.2a1.2 1.2 0 1 1 1.2-1.2 1.2 1.2 0 0 1-1.2 1.2Zm6.4 0a1.2 1.2 0 1 1 1.2-1.2 1.2 1.2 0 0 1-1.2 1.2ZM12 17a5.2 5.2 0 0 1-4.2-2.1l1.6-1.2a3.25 3.25 0 0 0 5.2 0l1.6 1.2A5.2 5.2 0 0 1 12 17Z"></path>
                                    </svg>
                                </button>
                                {showEmojiPicker && (
                                    <div className="emoji-picker-container">
                                        <EmojiPicker onEmojiClick={onEmojiClick} theme="light" />
                                    </div>
                                )}
                                <button
                                    type="button"
                                    className="attach-btn"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isLoading}
                                    title="Attach Image"
                                >
                                    <svg viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M1.816 15.556v.002c0 1.502.584 2.912 1.646 3.972s2.472 1.647 3.974 1.647a5.58 5.58 0 0 0 3.972-1.645l9.547-9.548c.769-.768 1.147-1.767 1.058-2.817-.079-.968-.548-1.927-1.319-2.698-1.594-1.592-4.068-1.711-5.517-.262l-7.916 7.915c-.881.881-.792 2.25.214 3.261.959.958 2.423 1.053 3.263.215l5.511-5.512c.28-.28.267-.722.053-.936l-.244-.244c-.191-.191-.567-.349-.957.04l-5.506 5.506c-.18.18-.635.127-.976-.214-.098-.097-.576-.613-.213-.973l7.915-7.917c.818-.817 2.267-.699 3.23.262.5.501.802 1.1.849 1.685.051.573-.156 1.111-.589 1.543l-9.547 9.549a3.97 3.97 0 0 1-2.829 1.171 3.975 3.975 0 0 1-2.83-1.173 3.973 3.973 0 0 1-1.172-2.828c0-1.071.415-2.076 1.172-2.83l7.209-7.211c.157-.157.264-.579.028-.814L11.5 4.36a.57.57 0 0 0-.834.018l-7.205 7.207a5.577 5.577 0 0 0-1.645 3.971z"></path>
                                    </svg>
                                </button>
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden-file-input"
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
                                <button type="button" className="cancel-btn" onClick={handleCancelRecording} title="Delete">
                                    <svg viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"></path>
                                    </svg>
                                </button>
                                <button type="button" className="send-btn active-send" onClick={handleStopRecording} disabled={isLoading} title="Send">
                                    <svg viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path>
                                    </svg>
                                </button>
                            </div>
                        ) : inputText.trim() ? (
                            <button type="submit" className="send-btn active-send" disabled={isLoading}>
                                <svg viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path>
                                </svg>
                            </button>
                        ) : (
                            <button type="button" className="send-btn" onClick={handleStartRecording} disabled={isLoading} title="Record Voice">
                                <svg viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M11.999 14.942c2.001 0 3.531-1.53 3.531-3.531V4.35c0-2.001-1.53-3.531-3.531-3.531S8.468 2.349 8.468 4.35v7.061c0 2.001 1.53 3.531 3.531 3.531zm6.238-3.53c0 3.531-2.942 6.002-6.237 6.002s-6.237-2.471-6.237-6.002H3.761c0 4.001 3.178 7.297 7.061 7.885v3.884h2.354v-3.884c3.884-.588 7.061-3.884 7.061-7.885h-2.002z"></path>
                                </svg>
                            </button>
                        )}
                    </form>
                    </div>
                </div>
            ) : (
                <div className="no-chat-selected">
                    <div className="empty-state-card">
                        <div className="empty-state-icon" aria-hidden="true">
                            <svg viewBox="0 0 24 24" fill="none">
                                <path d="M5 6.5A3.5 3.5 0 0 1 8.5 3h7A3.5 3.5 0 0 1 19 6.5v5A3.5 3.5 0 0 1 15.5 15H12l-4.2 3.15A.5.5 0 0 1 7 17.75V15.4a3.5 3.5 0 0 1-2-3.15v-5.75Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"></path>
                                <path d="M8.5 8h7M8.5 11h4.75" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"></path>
                            </svg>
                        </div>
                        <h3>No conversation selected</h3>
                        <p>Choose a chat from the inbox.</p>
                    </div>
                </div>
            )}
        </div>
    );
}
