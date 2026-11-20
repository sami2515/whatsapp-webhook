import axios from 'axios';
import { io } from 'socket.io-client';

export const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/messages';
// For Socket.io: if VITE_SOCKET_URL is set, use it; otherwise use current origin or localhost:5000 in dev
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || (
    typeof window !== 'undefined' && window.location.hostname === 'localhost'
        ? 'http://localhost:5000'
        : (import.meta.env.VITE_API_BASE_URL || window.location.origin)
);

// Initialize real-time Socket.io client with auto reconnect
export const socket = io(SOCKET_URL, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    timeout: 10000
});

// Fetch all conversations
export const getConversations = async () => {
    const res = await axios.get(`${API_BASE}/conversations`);
    return res.data;
};

// Fetch chat messages for a specific phone number
export const getChatHistory = async (phone) => {
    const res = await axios.get(`${API_BASE}/messages/${phone}`);
    return res.data;
};

// Send a plain text message
export const sendTextMessage = async (to, text, senderName = 'Admin') => {
    const res = await axios.post(`${API_BASE}/messages`, {
        to,
        from: 'me',
        senderName,
        text,
        type: 'text',
        direction: 'outgoing'
    });
    return res.data;
};

// Send an image message (uploaded to Cloudinary by backend)
export const sendImageMessage = async (to, imageFile, caption = '', senderName = 'Admin') => {
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('to', to);
    formData.append('from', 'me');
    formData.append('senderName', senderName);
    formData.append('text', caption);
    formData.append('direction', 'outgoing');

    const res = await axios.post(`${API_BASE}/messages/send-image`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
};

// Delete a message
export const deleteLocalMessage = async (messageId) => {
    const res = await axios.delete(`${API_BASE}/messages/${messageId}`);
    return res.data;
};

// Save / update contact details
export const saveContact = async (phone, name) => {
    const res = await axios.post(`${API_BASE}/contacts`, { phone, name });
    return res.data;
};
