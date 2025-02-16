import { useState, useEffect } from 'react';
import axios from '../../services/axiosConfig';
import {
  UserIcon,
  BellIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

export default function AdminOverview() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  const [userTelegramStats, setUserTelegramStats] = useState({
    total: 0,
    withTelegram: 0
  });

  useEffect(() => {
    // Debug log to check admin token
    console.log('Admin token:', localStorage.getItem('adminToken'));
    console.log('Is admin:', localStorage.getItem('isAdmin'));
    
    fetchStats();
    fetchTelegramStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Log the request headers
      const adminToken = localStorage.getItem('adminToken');
      console.log('Making request with token:', adminToken);
      
      const response = await axios.get('/api/admin/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch admin stats:', error);
      console.log('Error response:', error.response?.data);
      setError(error.message);
    }
  };

  const fetchTelegramStats = async () => {
    try {
      const response = await axios.get('/api/admin/users');
      const users = response.data;
      setUserTelegramStats({
        total: users.length,
        withTelegram: users.filter(user => user.telegramChatId).length
      });
    } catch (error) {
      console.error('Failed to fetch Telegram stats:', error);
    }
  };

  const testBroadcast = async () => {
    try {
      const response = await axios.post('/api/admin/test-broadcast');
      alert(`Broadcast test sent to ${response.data.totalUsers} users!`);
    } catch (error) {
      alert('Failed to send test broadcast: ' + error.message);
    }
  };

  const cards = [
    { name: 'Total Users', value: stats?.totalUsers, icon: UserIcon, color: 'bg-blue-500' },
    { name: 'Active Medications', value: stats?.totalMedications, icon: BellIcon, color: 'bg-green-500' },
    { name: 'Active Notifications', value: stats?.activeNotifications, icon: BellIcon, color: 'bg-yellow-500' },
    { name: 'Completed Reminders', value: stats?.completedReminders, icon: CheckCircleIcon, color: 'bg-purple-500' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">Admin Overview</h1>
      
      <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.name}
            className="overflow-hidden rounded-lg bg-white shadow"
          >
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <card.icon
                    className={`h-6 w-6 text-white p-1 rounded-full ${card.color}`}
                  />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {card.name}
                    </dt>
                    <dd className="text-lg font-semibold text-gray-900">
                      {card.value}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="stat">
        <div className="stat-title">Users with Telegram</div>
        <div className="stat-value">
          {userTelegramStats.withTelegram}/{userTelegramStats.total}
        </div>
      </div>

      <button 
        onClick={testBroadcast}
        className="btn btn-primary"
      >
        Test Broadcast
      </button>
    </div>
  );
} 