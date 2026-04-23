import axios from 'axios';

export const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/whatsapp';

// Fetch all unique conversations
export const getConversations = async () => {
  const response = await axios.get(`${BASE_URL}/conversations`);
  return response.data;
};

// Fetch chat history for a specific phone number
export const getChatHistory = async (phoneNumber) => {
  const response = await axios.get(`${BASE_URL}/messages/${phoneNumber}`);
  return response.data;
};

// Send a WhatsApp template message (e.g. 'hello_world')
export const sendTemplateMessage = async (toPhoneNumber, templateName = 'hello_world') => {
  const payload = {
    to: toPhoneNumber,
    type: 'template',
    templateName: templateName
  };
  const response = await axios.post(`${BASE_URL}/send`, payload);
  return response.data;
};

// Send a free-form text message (only works if user messaged you within 24h)
export const sendTextMessage = async (toPhoneNumber, textBody) => {
  const payload = {
    to: toPhoneNumber,
    type: 'text',
    textBody: textBody
  };
  const response = await axios.post(`${BASE_URL}/send`, payload);
  return response.data;
};

// Send a voice/audio message
export const sendAudioMessage = async (toPhoneNumber, audioBlob) => {
  const formData = new FormData();
  formData.append('audio', audioBlob, 'voice_message.ogg');
  formData.append('to', toPhoneNumber);

  const response = await axios.post(`${BASE_URL}/send-audio`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data;
};

// Send an image message
export const sendImageMessage = async (toPhoneNumber, imageFile) => {
  const formData = new FormData();
  formData.append('image', imageFile);
  formData.append('to', toPhoneNumber);

  const response = await axios.post(`${BASE_URL}/send-image`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data;
};

// Send a reaction to a specific message
export const sendReaction = async (toPhoneNumber, messageId, emoji) => {
  const payload = {
    to: toPhoneNumber,
    messageId: messageId,
    emoji: emoji
  };
  const response = await axios.post(`${BASE_URL}/send-reaction`, payload);
  return response.data;
};

// Delete a message locally from the MongoDB dashboard
export const deleteLocalMessage = async (messageId) => {
  const response = await axios.delete(`${BASE_URL}/messages/${messageId}`);
  return response.data;
};
