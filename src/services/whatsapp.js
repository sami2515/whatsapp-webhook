import axios from 'axios';

export const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://whatsapp-webhook-awel.onrender.com/api/whatsapp';

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

// Send a 'hello_world' WhatsApp template message
export const sendHelloWorldMessage = async (toPhoneNumber) => {
  const payload = {
    to: toPhoneNumber,
    type: 'template',
    templateName: 'hello_world'
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
