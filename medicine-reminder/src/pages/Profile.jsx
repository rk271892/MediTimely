import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext.jsx';
import { 
  TELEGRAM_BOT_USERNAME, 
  API_BASE_URL,
  TELEGRAM_CHAT_ID 
} from '../config/constants';
import {
  UserCircleIcon,
  EnvelopeIcon,
  PhoneIcon,
  BellIcon,
  ClockIcon,
  CalendarIcon,
  PencilIcon,
  ArrowTopRightOnSquareIcon,
  ArrowPathIcon,
  PencilSquareIcon,
  ArrowRightOnRectangleIcon,
  ClipboardDocumentListIcon,
  ChatBubbleLeftIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { medicationService } from '../services/medication';
import ProfileEditForm from '../components/profile/ProfileEditForm';
import Button from '../components/common/Button';
import axios from '../services/axiosConfig';

const statCards = [
  { 
    title: "Total Medications", 
    icon: ClipboardDocumentListIcon,
    key: "totalMedications",
    color: "bg-blue-500"
  },
  { 
    title: "Active Medications", 
    icon: CalendarIcon,
    key: "activeMedications",
    color: "bg-green-500"
  },
  { 
    title: "Upcoming Doses", 
    icon: BellIcon,
    key: "upcomingDoses",
    color: "bg-purple-500"
  },
  { 
    title: "Completed", 
    icon: CheckCircleIcon,
    key: "completedMedications",
    color: "bg-orange-500"
  }
];

export default function Profile() {
  const { user, logout, updateUser } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [stats, setStats] = useState({
    totalMedications: 0,
    activeMedications: 0,
    upcomingDoses: 0,
    completedMedications: 0
  });
  const [updateStatus, setUpdateStatus] = useState({ type: '', message: '' });
  const [showEditForm, setShowEditForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showCompleteSetup, setShowCompleteSetup] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setIsLoading(true);
        await loadStats();
        setError(null);
      } catch (err) {
        console.error('Error loading profile:', err);
        setError('Failed to load profile data');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadProfile();
  }, []);

  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  const loadStats = async () => {
    try {
      const medications = await medicationService.getMedications();
      const now = new Date();
      
      const active = medications.filter(med => {
        const endDate = new Date(med.duration.startDate);
        endDate.setDate(endDate.getDate() + med.duration.days);
        return endDate > now;
      });

      const completed = medications.filter(med => {
        const endDate = new Date(med.duration.startDate);
        endDate.setDate(endDate.getDate() + med.duration.days);
        return endDate <= now;
      });

      const upcomingDoses = medications.reduce((acc, med) => 
        acc + med.timings.length, 0);

      setStats({
        totalMedications: medications.length,
        activeMedications: active.length,
        upcomingDoses,
        completedMedications: completed.length
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
      setError('Failed to load medication statistics');
    }
  };

  const handleUpdateProfile = async (updatedData) => {
    try {
      setIsLoading(true);
      setUpdateStatus({ type: '', message: '' });
      await updateUser(updatedData);
      setIsEditing(false);
      setUpdateStatus({
        type: 'success',
        message: 'Profile updated successfully!'
      });
      // Refresh stats
      loadStats();
    } catch (error) {
      console.error('Failed to update profile:', error);
      setUpdateStatus({
        type: 'error',
        message: error.response?.data?.message || 'Failed to update profile'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTelegramConnect = async () => {
    try {
      console.log('Connecting to Telegram bot:', TELEGRAM_BOT_USERNAME);
      window.open(`https://t.me/${TELEGRAM_BOT_USERNAME}`, '_blank');
      
      // Log user's Telegram status
      console.log('Current user:', user);
      console.log('Telegram connection status:', {
        chatId: user?.telegramChatId,
        isConnected: isTelegramConnected
      });

      alert(`Please follow these steps:
        1. Send /start to the bot
        2. Wait for a response
        3. Come back here and click 'Complete Setup'`);
      
      setShowCompleteSetup(true);
    } catch (error) {
      console.error('Failed to connect to Telegram:', error);
      setError('Failed to connect to Telegram. Please try again.');
    }
  };

  const handleCompleteSetup = async () => {
    try {
      setLoading(true);
      console.log('Completing Telegram setup...');
      const response = await axios.post('/api/notifications/complete-telegram-setup');
      console.log('Setup response:', response.data);

      if (!response.data.success) {
        throw new Error('Failed to complete Telegram setup');
      }

      if (response.data.success) {
        alert('Successfully connected to Telegram!');
        window.location.reload();
      } else {
        alert('Could not find your Telegram chat. Please make sure you sent /start to the bot.');
      }
    } catch (error) {
      console.error('Setup error:', error);
      setError('Failed to complete setup. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditProfile = async (formData) => {
    try {
      setLoading(true);
      const updatedUser = await updateUser(formData);
      setUser(updatedUser);
      setIsEditing(false);
      setUpdateStatus({ type: 'success', message: 'Profile updated successfully!' });
    } catch (error) {
      console.error('Failed to update profile:', error);
      setUpdateStatus({ type: 'error', message: error.message || 'Failed to update profile' });
    } finally {
      setLoading(false);
    }
  };

  const isTelegramConnected = user?.telegramChatId && user.telegramChatId !== '';

  // Add this console log to debug
  console.log('Profile - User Data:', {
    user,
    telegramChatId: user?.telegramChatId,
    isConnected: isTelegramConnected
  });

  const getTelegramInstructions = () => {
    if (isTelegramConnected) {
      return "✅ Connected to Telegram for medication reminders";
    }
    return (
      <div className="space-y-2">
        <p>To connect with Telegram:</p>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>Click the "Connect to Telegram" button</li>
          <li>Open the bot in Telegram</li>
          <li>Click "Start" in the Telegram chat</li>
          <li>Refresh this page to see the updated status</li>
        </ol>
      </div>
    );
  };

  const refreshTelegramStatus = async () => {
    try {
      setRefreshing(true);
      const response = await axios.get('/api/auth/me');
      updateUser(response.data.user);
    } catch (error) {
      console.error('Failed to refresh status:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-7xl mx-auto space-y-8"
      >
        {/* Profile Header */}
        <motion.div 
          variants={itemVariants}
          className="relative bg-white rounded-2xl shadow-lg overflow-hidden"
        >
          <div className="h-40 bg-gradient-to-r from-blue-600 to-indigo-600" />
          <div className="relative px-6 pb-6">
            <div className="flex flex-col sm:flex-row items-center sm:space-x-6">
              <div className="-mt-20 relative">
                <div className="h-36 w-36 rounded-full ring-4 ring-white bg-white shadow-lg">
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full rounded-full bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center">
                      <UserCircleIcon className="h-24 w-24 text-blue-500" />
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setIsEditing(true)}
                  className="absolute bottom-0 right-0 p-2.5 bg-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
                >
                  <PencilSquareIcon className="h-5 w-5 text-blue-600" />
                </button>
              </div>
              <div className="mt-6 sm:mt-0 text-center sm:text-left flex-1">
                <h1 className="text-3xl font-bold text-gray-900">{user?.name || 'Loading...'}</h1>
                <p className="text-gray-500 mt-1">
                  {user?.email || 'Loading...'}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div 
          variants={itemVariants}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {statCards.map((stat) => (
            <motion.div
              key={stat.key}
              whileHover={{ scale: 1.02 }}
              className="bg-white rounded-xl shadow-sm p-6 transition-all duration-300"
            >
              <div className="flex items-center space-x-4">
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">{stat.title}</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {stats[stat.key]}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Contact Information */}
        <motion.div 
          variants={itemVariants}
          className="bg-white rounded-xl shadow-sm p-8"
        >
          <h2 className="text-xl font-semibold mb-6 flex items-center">
            <EnvelopeIcon className="h-6 w-6 mr-2 text-blue-600" />
            Contact Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="space-y-2">
              <p className="text-sm text-gray-500">Email</p>
              <p className="text-gray-900 flex items-center">
                <EnvelopeIcon className="h-5 w-5 mr-2 text-gray-400" />
                {user?.email}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-gray-500">Phone</p>
              <p className="text-gray-900 flex items-center">
                <PhoneIcon className="h-5 w-5 mr-2 text-gray-400" />
                {user?.phone}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-gray-500">WhatsApp</p>
              <p className="text-gray-900 flex items-center">
                <ChatBubbleLeftIcon className="h-5 w-5 mr-2 text-gray-400" />
                {user?.whatsappNumber || 'Not connected'}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Telegram Connection */}
        <motion.div 
          variants={itemVariants}
          className="bg-white rounded-xl shadow-sm p-8"
        >
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-semibold mb-2">Telegram Connection</h2>
              <p className="text-gray-500">{getTelegramInstructions()}</p>
            </div>
            <div className="flex items-center space-x-4">
              {isTelegramConnected ? (
                <button
                  onClick={refreshTelegramStatus}
                  className="p-2 text-gray-600 hover:text-gray-800 rounded-full hover:bg-gray-100 transition-all duration-300"
                  disabled={refreshing}
                >
                  <ArrowPathIcon className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
                </button>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleTelegramConnect}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-300"
                >
                  Connect Telegram
                  <ArrowRightOnRectangleIcon className="ml-2 h-5 w-5" />
                </motion.button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Profile Actions */}
        <motion.div 
          variants={itemVariants}
          className="flex justify-end space-x-4"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 text-blue-600 hover:text-blue-700 font-medium rounded-lg hover:bg-blue-50 transition-all duration-300"
          >
            Edit Profile
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={logout}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-300"
          >
            Logout
          </motion.button>
        </motion.div>
      </motion.div>

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {isEditing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6"
            >
              <ProfileEditForm
                user={user}
                onSubmit={handleEditProfile}
                onCancel={() => setIsEditing(false)}
                isLoading={loading}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}