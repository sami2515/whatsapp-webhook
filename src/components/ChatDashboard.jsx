import React, { useState, useEffect, useRef, useMemo } from 'react';
import EmojiPicker from 'emoji-picker-react';
import {
  socket,
  getConversations,
  getChatHistory,
  sendTextMessage,
  sendImageMessage,
  deleteLocalMessage,
  saveContact
} from '../services/whatsapp';
import './ChatDashboard.css';

export default function ChatDashboard() {
  const [conversations, setConversations] = useState([]);
  const [activeChat, setActiveChat] = useState(null); // phone string
  const [activeContact, setActiveContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [isSending, setIsSending] = useState(false);
  const [previewModalImage, setPreviewModalImage] = useState(null);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [newChatPhone, setNewChatPhone] = useState('');
  const [newChatName, setNewChatName] = useState('');

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const fileInputRef = useRef(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  // 1. Setup Socket.io real-time connection and listeners
  useEffect(() => {
    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    // Incoming new message from any source (Cloudinary image, mobile sync, webhook, or dashboard)
    const onNewMessage = (msg) => {
      // If belongs to the currently opened chat, append
      setActiveChat((currentActive) => {
        if (currentActive && (msg.from === currentActive || msg.to === currentActive)) {
          setMessages((prev) => {
            if (prev.some((m) => (m._id && m._id === msg._id) || (m.messageId && m.messageId === msg.messageId))) {
              return prev;
            }
            return [...prev, msg];
          });
        }
        return currentActive;
      });

      // Refresh conversations list to update latest snippet and order
      loadConversations();
    };

    const onMessageDeleted = ({ id, messageId }) => {
      setMessages((prev) => prev.filter((m) => m._id !== id && m.messageId !== messageId));
      loadConversations();
    };

    socket.on('new_message', onNewMessage);
    socket.on('message_deleted', onMessageDeleted);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('new_message', onNewMessage);
      socket.off('message_deleted', onMessageDeleted);
    };
  }, []);

  // 2. Fetch conversations
  const loadConversations = async () => {
    try {
      const data = await getConversations();
      if (Array.isArray(data)) {
        setConversations(data);
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    }
  };

  useEffect(() => {
    loadConversations();
    // 10s fallback interval
    const interval = setInterval(loadConversations, 10000);
    return () => clearInterval(interval);
  }, []);

  // 3. Load chat history when active chat changes
  const loadMessages = async (phone) => {
    try {
      const data = await getChatHistory(phone);
      if (Array.isArray(data)) {
        setMessages(data);
      }
    } catch (err) {
      console.error('Failed to load messages for', phone, err);
    }
  };

  const handleSelectChat = (conv) => {
    setActiveChat(conv.phone);
    setActiveContact(conv);
    loadMessages(conv.phone);
    setShowEmojiPicker(false);
  };

  // 4. Scroll tracking and auto-scroll
  const scrollToBottom = (behavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    scrollToBottom('auto');
  }, [activeChat]);

  useEffect(() => {
    // When a new message comes in, scroll if near bottom
    if (!showScrollBottom) {
      scrollToBottom('smooth');
    }
  }, [messages.length]);

  const handleScroll = () => {
    if (!messagesContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const distanceToBottom = scrollHeight - scrollTop - clientHeight;
    setShowScrollBottom(distanceToBottom > 200);
  };

  // 5. Handle image selection
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const url = URL.createObjectURL(file);
      setImagePreviewUrl(url);
    }
    // reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const cancelSelectedImage = () => {
    setSelectedImage(null);
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
      setImagePreviewUrl('');
    }
  };

  // 6. Send message
  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!activeChat || (!inputText.trim() && !selectedImage) || isSending) return;

    setIsSending(true);
    const textToSend = inputText.trim();
    const imageToSend = selectedImage;

    // Reset inputs immediately for snappy UX
    setInputText('');
    cancelSelectedImage();
    setShowEmojiPicker(false);

    try {
      if (imageToSend) {
        // Uploads image to Cloudinary and creates message with Cloudinary URL
        await sendImageMessage(activeChat, imageToSend, textToSend, 'You');
      } else {
        await sendTextMessage(activeChat, textToSend, 'You');
      }
      await loadMessages(activeChat);
      await loadConversations();
    } catch (err) {
      console.error('Error sending message:', err);
      alert('Failed to send message. Please check backend connection.');
    } finally {
      setIsSending(false);
    }
  };

  // 7. Delete message
  const handleDeleteMsg = async (msgId) => {
    if (!window.confirm('Delete this message?')) return;
    try {
      await deleteLocalMessage(msgId);
      setMessages((prev) => prev.filter((m) => m._id !== msgId && m.messageId !== msgId));
      loadConversations();
    } catch (err) {
      console.error('Failed to delete message:', err);
    }
  };

  // 8. Start new chat
  const handleStartNewChat = async (e) => {
    e.preventDefault();
    const phone = newChatPhone.trim().replace(/\s+/g, '');
    if (!phone) return;

    const name = newChatName.trim();
    if (name) {
      try {
        await saveContact(phone, name);
      } catch (_) {}
    }

    const newConv = {
      phone,
      name: name || phone,
      unreadCount: 0,
      lastMessage: { text: 'New chat', timestamp: new Date() }
    };

    setConversations((prev) => {
      const exists = prev.find((c) => c.phone === phone);
      if (exists) return prev;
      return [newConv, ...prev];
    });

    setActiveChat(phone);
    setActiveContact(newConv);
    setMessages([]);
    setShowNewChatModal(false);
    setNewChatPhone('');
    setNewChatName('');
  };

  // 9. Format helpers
  const formatTime = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDateHeader = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Group messages by calendar date
  const groupedMessages = useMemo(() => {
    const groups = [];
    let currentDate = null;
    let currentBatch = [];

    messages.forEach((msg) => {
      const dateStr = formatDateHeader(msg.timestamp || msg.createdAt);
      if (dateStr !== currentDate) {
        if (currentBatch.length > 0) {
          groups.push({ date: currentDate, items: currentBatch });
        }
        currentDate = dateStr;
        currentBatch = [msg];
      } else {
        currentBatch.push(msg);
      }
    });

    if (currentBatch.length > 0) {
      groups.push({ date: currentDate, items: currentBatch });
    }

    return groups;
  }, [messages]);

  // Filter conversations
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const q = searchQuery.toLowerCase();
    return conversations.filter(
      (c) => c.phone?.toLowerCase().includes(q) || c.name?.toLowerCase().includes(q)
    );
  }, [conversations, searchQuery]);

  return (
    <div className="wa-app-layout">
      {/* 1. Left Sidebar: Chats List */}
      <aside className="wa-sidebar">
        {/* Top Header */}
        <header className="wa-sidebar-header">
          <div className="wa-user-avatar" title="My Profile">
            <span>WA</span>
          </div>
          <div className="wa-header-info">
            <h1 className="wa-app-title">WhatsApp Live</h1>
            <div className={`wa-status-pill ${isConnected ? 'online' : 'offline'}`}>
              <span className="wa-status-dot"></span>
              {isConnected ? 'Connected' : 'Reconnecting...'}
            </div>
          </div>
          <button
            className="wa-icon-btn wa-new-chat-btn"
            title="Start New Chat"
            onClick={() => setShowNewChatModal(true)}
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M19 11h-6V5h-2v6H5v2h6v6h2v-6h6z" />
            </svg>
          </button>
        </header>

        {/* Search Bar */}
        <div className="wa-search-container">
          <div className="wa-search-bar">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
              <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
            </svg>
            <input
              type="text"
              placeholder="Search or start new chat"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="wa-clear-search" onClick={() => setSearchQuery('')}>
                ×
              </button>
            )}
          </div>
        </div>

        {/* Conversations List */}
        <div className="wa-chat-list">
          {filteredConversations.length === 0 ? (
            <div className="wa-empty-chat-list">
              <p>No conversations found</p>
              <button
                className="wa-btn-secondary"
                onClick={() => setShowNewChatModal(true)}
              >
                + Start a New Chat
              </button>
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const isActive = activeChat === conv.phone;
              const initials = (conv.name || conv.phone || '?').slice(0, 2).toUpperCase();
              return (
                <div
                  key={conv.phone}
                  className={`wa-chat-item ${isActive ? 'active' : ''}`}
                  onClick={() => handleSelectChat(conv)}
                >
                  <div className="wa-contact-avatar">
                    {conv.avatarUrl ? (
                      <img src={conv.avatarUrl} alt={conv.name} />
                    ) : (
                      <span>{initials}</span>
                    )}
                  </div>
                  <div className="wa-chat-item-content">
                    <div className="wa-chat-item-top">
                      <span className="wa-contact-name">{conv.name || conv.phone}</span>
                      <span className="wa-message-time">
                        {formatTime(conv.lastMessage?.timestamp)}
                      </span>
                    </div>
                    <div className="wa-chat-item-bottom">
                      <span className="wa-last-message-snippet">
                        {conv.lastMessage?.direction === 'outgoing' && (
                          <span className="wa-outgoing-tick">✓ </span>
                        )}
                        {conv.lastMessage?.text || 'No messages'}
                      </span>
                      {conv.unreadCount > 0 && (
                        <span className="wa-unread-badge">{conv.unreadCount}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </aside>

      {/* 2. Right Pane: Active Chat Area */}
      <main className="wa-main-chat">
        {activeChat ? (
          <>
            {/* Active Chat Header */}
            <header className="wa-chat-header">
              <div className="wa-contact-avatar">
                <span>{(activeContact?.name || activeChat).slice(0, 2).toUpperCase()}</span>
              </div>
              <div className="wa-active-chat-info">
                <h2 className="wa-active-name">{activeContact?.name || activeChat}</h2>
                <span className="wa-active-phone">{activeChat}</span>
              </div>
              <div className="wa-header-actions">
                <div className="wa-db-badge" title="Saved to MongoDB & Cloudinary">
                  MongoDB Synced ☁️
                </div>
              </div>
            </header>

            {/* Messages Body */}
            <div
              className="wa-messages-container"
              ref={messagesContainerRef}
              onScroll={handleScroll}
            >
              {groupedMessages.length === 0 ? (
                <div className="wa-no-messages-notice">
                  <div className="wa-lock-shield">🔒</div>
                  <p>Messages are saved in MongoDB and images in Cloudinary.</p>
                  <span>Say hello to start the conversation!</span>
                </div>
              ) : (
                groupedMessages.map((group, gIdx) => (
                  <div key={gIdx} className="wa-date-group">
                    <div className="wa-date-separator">
                      <span>{group.date}</span>
                    </div>

                    {group.items.map((msg, mIdx) => {
                      const isOutgoing = msg.direction === 'outgoing';
                      const hasImage = Boolean(msg.mediaUrl);
                      return (
                        <div
                          key={msg._id || msg.messageId || mIdx}
                          className={`wa-message-row ${isOutgoing ? 'outgoing' : 'incoming'}`}
                        >
                          <div className="wa-message-bubble">
                            {/* Sender Name for incoming messages */}
                            {!isOutgoing && (
                              <div className="wa-bubble-sender-name">
                                {msg.senderName || msg.from}
                              </div>
                            )}

                            {/* Cloudinary Image Preview */}
                            {hasImage && (
                              <div
                                className="wa-bubble-image-wrapper"
                                onClick={() => setPreviewModalImage(msg.mediaUrl)}
                              >
                                <img
                                  src={msg.mediaUrl}
                                  alt="Attached"
                                  className="wa-bubble-image"
                                  loading="lazy"
                                />
                                <div className="wa-image-overlay">🔍 Click to expand</div>
                              </div>
                            )}

                            {/* Text Body */}
                            {msg.text && (
                              <div className="wa-bubble-text">{msg.text}</div>
                            )}

                            {/* Time & Delivery Status */}
                            <div className="wa-bubble-footer">
                              <span className="wa-bubble-timestamp">
                                {formatTime(msg.timestamp || msg.createdAt)}
                              </span>
                              {isOutgoing && (
                                <span className="wa-bubble-status" title={msg.status}>
                                  ✓✓
                                </span>
                              )}
                              <button
                                className="wa-bubble-delete-btn"
                                title="Delete message"
                                onClick={() => handleDeleteMsg(msg._id || msg.messageId)}
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Scroll to bottom button */}
            {showScrollBottom && (
              <button
                className="wa-scroll-to-bottom-btn"
                onClick={() => scrollToBottom('smooth')}
                title="Scroll to bottom"
              >
                ↓
              </button>
            )}

            {/* Selected Image Preview before Send */}
            {imagePreviewUrl && (
              <div className="wa-image-preview-dock">
                <div className="wa-preview-dock-inner">
                  <img src={imagePreviewUrl} alt="To upload" />
                  <div className="wa-preview-dock-info">
                    <span>Ready to upload to Cloudinary</span>
                    <button className="wa-btn-cancel-image" onClick={cancelSelectedImage}>
                      ✕ Remove
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Input Footer */}
            <footer className="wa-chat-footer">
              {/* Attach File Button */}
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept="image/*"
                onChange={handleImageChange}
              />
              <button
                className="wa-icon-btn"
                title="Attach Photo (Cloudinary)"
                onClick={() => fileInputRef.current?.click()}
                disabled={isSending}
              >
                <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                  <path d="M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5a2.5 2.5 0 0 1 5 0v10.5c0 .83-.67 1.5-1.5 1.5s-1.5-.67-1.5-1.5V6H9v9.5a3 3 0 0 0 6 0V5C15 2.24 12.76 0 10 0S5 2.24 5 5v12.5c0 3.04 2.46 5.5 5.5 5.5s5.5-2.46 5.5-5.5V6h-1.5z" />
                </svg>
              </button>

              {/* Emoji Button */}
              <div className="wa-emoji-wrapper">
                <button
                  type="button"
                  className="wa-icon-btn"
                  title="Emoji"
                  onClick={() => setShowEmojiPicker((prev) => !prev)}
                >
                  😊
                </button>
                {showEmojiPicker && (
                  <div className="wa-emoji-popover">
                    <EmojiPicker
                      theme="dark"
                      onEmojiClick={(emojiData) => {
                        setInputText((prev) => prev + emojiData.emoji);
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Text Input */}
              <form className="wa-input-form" onSubmit={handleSendMessage}>
                <input
                  type="text"
                  placeholder={selectedImage ? 'Add a caption...' : 'Type a message...'}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  disabled={isSending}
                  autoFocus
                />
                <button
                  type="submit"
                  className="wa-send-btn"
                  title="Send message"
                  disabled={isSending || (!inputText.trim() && !selectedImage)}
                >
                  {isSending ? (
                    <span className="wa-spinner">⏳</span>
                  ) : (
                    <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                    </svg>
                  )}
                </button>
              </form>
            </footer>
          </>
        ) : (
          /* Empty Welcome Screen */
          <div className="wa-empty-chat-pane">
            <div className="wa-welcome-content">
              <div className="wa-welcome-hero-icon">💬</div>
              <h2>WhatsApp Web Live</h2>
              <p>
                Connected to <strong>MongoDB</strong> database and <strong>Cloudinary</strong> for images.
              </p>
              <div className="wa-welcome-features">
                <div className="wa-feature-card">
                  <span>📅</span>
                  <strong>Date & Time</strong>
                  <p>Organized by day and precise timestamps</p>
                </div>
                <div className="wa-feature-card">
                  <span>👤</span>
                  <strong>Sender Names</strong>
                  <p>Clearly identified for every incoming contact</p>
                </div>
                <div className="wa-feature-card">
                  <span>☁️</span>
                  <strong>Cloudinary Images</strong>
                  <p>Instant upload with high-res previews</p>
                </div>
              </div>
              <button
                className="wa-btn-primary"
                onClick={() => setShowNewChatModal(true)}
              >
                + Start a New Chat
              </button>
            </div>
          </div>
        )}
      </main>

      {/* 3. Modal: New Chat */}
      {showNewChatModal && (
        <div className="wa-modal-backdrop" onClick={() => setShowNewChatModal(false)}>
          <div className="wa-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="wa-modal-header">
              <h3>Start New Chat</h3>
              <button className="wa-close-btn" onClick={() => setShowNewChatModal(false)}>
                ✕
              </button>
            </div>
            <form onSubmit={handleStartNewChat}>
              <div className="wa-form-group">
                <label>Phone Number (with country code):</label>
                <input
                  type="text"
                  placeholder="+923001234567 or 18774134258"
                  value={newChatPhone}
                  onChange={(e) => setNewChatPhone(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div className="wa-form-group">
                <label>Contact Name (Optional):</label>
                <input
                  type="text"
                  placeholder="e.g. Ali Khan, Payoneer, Client"
                  value={newChatName}
                  onChange={(e) => setNewChatName(e.target.value)}
                />
              </div>
              <div className="wa-modal-actions">
                <button
                  type="button"
                  className="wa-btn-secondary"
                  onClick={() => setShowNewChatModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="wa-btn-primary">
                  Open Chat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Modal: Fullscreen Image Lightbox */}
      {previewModalImage && (
        <div className="wa-lightbox-backdrop" onClick={() => setPreviewModalImage(null)}>
          <div className="wa-lightbox-content" onClick={(e) => e.stopPropagation()}>
            <img src={previewModalImage} alt="Fullscreen preview" />
            <div className="wa-lightbox-actions">
              <a
                href={previewModalImage}
                target="_blank"
                rel="noreferrer"
                download
                className="wa-btn-secondary"
              >
                Open Full Size ↗
              </a>
              <button
                className="wa-btn-primary"
                onClick={() => setPreviewModalImage(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
