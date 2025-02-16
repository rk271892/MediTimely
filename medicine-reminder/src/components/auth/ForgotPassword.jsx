import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const { resetPassword } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setMessage('');
      setLoading(true);
      await resetPassword(email);
      setMessage('Password reset link has been sent to your Telegram');
    } catch (err) {
      console.error('Password reset error:', err);
      if (err.response?.data?.needsTelegram) {
        setError('Please connect your Telegram account first. Go to Profile to connect Telegram.');
      } else {
        setError('Failed to reset password. Please check your email address.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-md w-full mx-auto p-6"
    >
      <h2 className="text-3xl font-bold text-center mb-6">Reset Password</h2>
      <p className="text-gray-600 text-center mb-8">
        Enter your email address and we'll send you instructions to reset your password.
      </p>

      {error && (
        <div className="bg-red-50 text-red-500 p-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {message && (
        <div className="bg-green-50 text-green-500 p-3 rounded-lg mb-6">
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email Address
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Sending...' : 'Reset Password'}
        </button>

        <div className="text-center space-y-2">
          <Link
            to="/login"
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            Back to Login
          </Link>
        </div>
      </form>
    </motion.div>
  );
} 