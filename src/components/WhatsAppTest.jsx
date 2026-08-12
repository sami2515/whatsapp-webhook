import { useState } from 'react';
import { sendHelloWorldMessage } from '../services/whatsapp';

export default function WhatsAppTest() {
    const [phoneNumber, setPhoneNumber] = useState('');
    const [status, setStatus] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSend = async () => {
        if (!phoneNumber) {
            setStatus("Please enter a phone number.");
            return;
        }

        setIsLoading(true);
        setStatus("Sending message...");

        try {
            await sendHelloWorldMessage(phoneNumber);
            setStatus("✅ Message sent successfully!");
        } catch (error) {
            setStatus(`❌ Failed to send message: ${error.response?.data?.error?.message || error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{ padding: '20px', maxWidth: '400px', margin: '0 auto', fontFamily: 'sans-serif' }}>
            <h2>Test WhatsApp API</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <input
                    type="text"
                    placeholder="Phone number (e.g., 15551234567)"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    style={{ padding: '10px', fontSize: '16px' }}
                />

                <button
                    onClick={handleSend}
                    disabled={isLoading}
                    style={{
                        padding: '10px',
                        fontSize: '16px',
                        backgroundColor: isLoading ? '#ccc' : '#25D366',
                        color: 'white',
                        border: 'none',
                        cursor: isLoading ? 'not-allowed' : 'pointer'
                    }}
                >
                    {isLoading ? 'Sending...' : 'Send Hello World'}
                </button>
            </div>

            {status && <p style={{ marginTop: '15px', fontWeight: 'bold' }}>{status}</p>}
        </div>
    );
}
