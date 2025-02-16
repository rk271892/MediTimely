import { MedicationList } from '../components/medications';
import { useState, useEffect } from 'react';
import axios from '../services/axiosConfig';

export default function Medications() {
  const [telegramLink, setTelegramLink] = useState('');
  const [telegramStatus, setTelegramStatus] = useState({ connected: false, loading: true });

  useEffect(() => {
    // Get Telegram connection status
    const checkTelegramStatus = async () => {
      try {
        const response = await axios.get('/api/auth/me');
        setTelegramStatus({
          connected: !!response.data.user.telegramChatId,
          loading: false
        });
      } catch (error) {
        console.error('Failed to check Telegram status:', error);
        setTelegramStatus({ connected: false, loading: false });
      }
    };

    checkTelegramStatus();
  }, []);

  const getTelegramLink = async () => {
    try {
      const response = await axios.get('/api/telegram/connect-link');
      setTelegramLink(response.data.link);
    } catch (error) {
      console.error('Failed to get Telegram link:', error);
    }
  };

  const testTelegramConnection = async () => {
    try {
      await axios.post('/api/telegram/test');
      alert('Test message sent! Check your Telegram.');
    } catch (error) {
      alert('Failed to send test message. Please make sure you connected Telegram.');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">My Medications</h1>
      <MedicationList />
      {!telegramStatus.connected && (
        <button 
          onClick={getTelegramLink}
          className="btn btn-primary"
        >
          Connect Telegram
        </button>
      )}
      {telegramLink && (
        <div className="alert alert-info">
          <p>Click this link to connect Telegram:</p>
          <a href={telegramLink} target="_blank" rel="noopener noreferrer">
            {telegramLink}
          </a>
        </div>
      )}
      {telegramStatus.connected && (
        <button 
          onClick={testTelegramConnection}
          className="btn btn-secondary"
        >
          Test Telegram Connection
        </button>
      )}
    </div>
  );
} 