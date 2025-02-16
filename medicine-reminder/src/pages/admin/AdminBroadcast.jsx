import { useState } from 'react';
import axios from '../../services/axiosConfig';

export default function AdminBroadcast() {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'all',
    targetUsers: 'all'
  });

  const notificationTypes = [
    { value: 'all', label: 'All Channels' },
    { value: 'email', label: 'Email Only' },
    { value: 'sms', label: 'SMS Only' },
    { value: 'telegram', label: 'Telegram Only' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('/api/admin/broadcast', formData);
      if (response.data.success) {
        alert(`Broadcast sent successfully to ${response.data.userCount} users!`);
        // Reset form
        setFormData({
          title: '',
          content: '',
          type: 'all',
          targetUsers: 'all'
        });
      } else {
        alert('Failed to send broadcast: ' + response.data.message);
      }
    } catch (error) {
      console.error('Failed to broadcast message:', error);
      alert('Failed to send broadcast: ' + (error.response?.data?.message || error.message));
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Send Broadcast Message</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Title
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Message Content
          </label>
          <textarea
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            rows={4}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Notification Type
          </label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          >
            {notificationTypes.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Target Users
          </label>
          <select
            value={formData.targetUsers}
            onChange={(e) => setFormData({ ...formData, targetUsers: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          >
            <option value="all">All Users</option>
            <option value="active">Active Users</option>
            <option value="inactive">Inactive Users</option>
          </select>
        </div>

        <button
          type="submit"
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Send Broadcast
        </button>
      </form>
    </div>
  );
} 