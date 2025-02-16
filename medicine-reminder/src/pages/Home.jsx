import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoginForm from '../components/auth/LoginForm';
import RegisterForm from '../components/auth/RegisterForm';
import { 
  BeakerIcon, 
  BellIcon, 
  ChartBarIcon, 
  ShieldCheckIcon 
} from '@heroicons/react/24/outline';

const features = [
  {
    icon: BeakerIcon,
    title: "Smart Medication Tracking",
    description: "Easily manage all your medications in one place with intelligent tracking and scheduling."
  },
  {
    icon: BellIcon,
    title: "Timely Reminders",
    description: "Never miss a dose with customizable reminders through SMS, Telegram, or push notifications."
  },
  {
    icon: ChartBarIcon,
    title: "Health Insights",
    description: "Track your medication adherence and get insights about your health patterns."
  },
  {
    icon: ShieldCheckIcon,
    title: "Secure & Private",
    description: "Your health data is encrypted and protected with the highest security standards."
  }
];

export default function Home() {
  const [isLogin, setIsLogin] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Navigation */}
      <nav className="absolute top-0 left-0 right-0 p-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="text-2xl font-bold text-blue-600">MediTimely</div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="min-h-screen flex">
        {/* Left Side - Content */}
        <div className="flex-1 pt-32 pb-12 px-8">
          <div className="max-w-2xl mx-auto">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl font-bold text-gray-900 mb-6"
            >
              Your Personal <span className="text-blue-600">Medicine</span> Assistant
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl text-gray-600 mb-12"
            >
              Stay on track with your medications, get timely reminders, and manage your health journey effectively.
            </motion.p>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all"
                >
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side - Auth Form */}
        <div className="w-[600px] bg-white shadow-2xl flex flex-col items-center justify-center p-12">
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-full max-w-md"
          >
            {/* Auth Toggle */}
            <div className="flex justify-center mb-8">
              <div className="bg-gray-100 p-1 rounded-lg inline-flex">
                <button
                  className={`px-6 py-2 rounded-md transition-colors ${
                    isLogin ? 'bg-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => setIsLogin(true)}
                >
                  Login
                </button>
                <button
                  className={`px-6 py-2 rounded-md transition-colors ${
                    !isLogin ? 'bg-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => setIsLogin(false)}
                >
                  Register
                </button>
              </div>
            </div>

            {/* Auth Forms */}
            <AnimatePresence mode="wait">
              {isLogin ? <LoginForm /> : <RegisterForm />}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </div>
  );
}