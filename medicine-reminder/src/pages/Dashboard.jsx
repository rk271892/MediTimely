import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { PlusIcon, ClockIcon, BellIcon, CalendarIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext.jsx';
import { medicationService } from '../services/medication';
import { format } from 'date-fns';
import { useNavigate, Link } from 'react-router-dom';
import MedicationCard from '../components/medication/MedicationCard';
import MedicationForm from '../components/medication/MedicationForm';

const howToUse = [
  {
    title: "Add Your Medications",
    description: "Click on 'Add Medication' to enter your medicine details including name, dosage, and timing.",
    icon: PlusIcon
  },
  {
    title: "Set Reminders",
    description: "Choose when you need to take each medication. We'll send you reminders via SMS.",
    icon: BellIcon
  },
  {
    title: "Track Your Schedule",
    description: "View and manage all your medications in one place. Never miss a dose.",
    icon: ClockIcon
  }
];

export default function Dashboard() {
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showAddForm, setShowAddForm] = useState(false);

  // Temporary debug code - remove after checking
  console.log('Current user data:', user);

  useEffect(() => {
    loadMedications();
  }, []);

  const loadMedications = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await medicationService.getMedications();
      setMedications(data);
    } catch (err) {
      console.error('Failed to load medications:', err);
      setError('Unable to load your medications');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMedication = () => {
    navigate('/add-medication');
  };

  const handleDelete = async (id) => {
    try {
      await medicationService.deleteMedication(id);
      setMedications(medications.filter(med => med._id !== id));
    } catch (err) {
      setError('Failed to delete medication');
      console.error(err);
    }
  };

  const handleEdit = async (updatedMedication) => {
    try {
      await medicationService.updateMedication(updatedMedication._id, updatedMedication);
      setMedications(medications.map(med => 
        med._id === updatedMedication._id ? updatedMedication : med
      ));
    } catch (err) {
      setError('Failed to update medication');
      console.error(err);
    }
  };

  // Add this helper function to check if a time is past for today
  const isTimePassed = (timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const now = new Date();
    const timeToday = new Date();
    timeToday.setHours(hours, minutes, 0);
    return timeToday < now;
  };

  // Add this function to get the display date
  const getScheduleDisplay = () => {
    const now = new Date();
    const allTimingsPassed = medications
      .flatMap(med => med.timings)
      .every(timing => isTimePassed(timing.time));

    return allTimingsPassed ? 'Tomorrow' : 'Today';
  };

  // Update the getScheduledMedications function to handle both today and tomorrow
  const getScheduledMedications = (forTomorrow = false) => {
    const now = new Date();
    return medications
      .flatMap(med => med.timings.map(timing => ({
        ...med,
        timing,
        passed: isTimePassed(timing.time)
      })))
      .filter(med => {
        if (forTomorrow) {
          return isTimePassed(med.timing.time); // Show passed times for tomorrow
        }
        return !isTimePassed(med.timing.time); // Show upcoming times for today
      })
      .sort((a, b) => a.timing.time.localeCompare(b.timing.time));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user?.name?.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}!
        </h1>
        <p className="mt-2 text-gray-600">
          Here's your medication overview for today
        </p>
      </motion.div>

      {/* Quick Stats Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
      >
        <div className="bg-white rounded-xl shadow-sm p-6 flex items-center space-x-4">
          <div className="bg-blue-100 p-3 rounded-lg">
            <ClockIcon className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Active Medications</p>
            <p className="text-2xl font-semibold text-gray-900">{medications.length}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 flex items-center space-x-4">
          <div className="bg-green-100 p-3 rounded-lg">
            <BellIcon className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Today's Doses</p>
            <p className="text-2xl font-semibold text-gray-900">
              {medications.reduce((acc, med) => acc + med.timings.length, 0)}
            </p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 flex items-center space-x-4">
          <div className="bg-purple-100 p-3 rounded-lg">
            <CalendarIcon className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Upcoming Refills</p>
            <p className="text-2xl font-semibold text-gray-900">
              {medications.filter(med => {
                const daysLeft = Math.ceil(
                  (new Date(med.duration.startDate).getTime() + 
                  med.duration.days * 24 * 60 * 60 * 1000 - 
                  new Date().getTime()) / (1000 * 60 * 60 * 24)
                );
                return daysLeft <= 7 && daysLeft > 0;
              }).length}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Schedule Sections */}
      <div className="space-y-8">
        {/* Today's Schedule */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl shadow-sm p-6"
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">
              Today's Schedule
            </h2>
            <span className="text-sm text-gray-500">
              {format(new Date(), 'MMMM d, yyyy')}
            </span>
          </div>
          <div className="space-y-4">
            {getScheduledMedications(false).length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No more medications scheduled for today
              </div>
            ) : (
              getScheduledMedications(false).map((med, index) => (
                <motion.div
                  key={`${med._id}-${med.timing.time}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-xl">💊</span>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{med.name}</h3>
                      <p className="text-sm text-gray-500">{med.dosage}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm flex items-center space-x-1">
                      <ClockIcon className="h-4 w-4" />
                      <span>{med.timing.time}</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-sm text-gray-500 capitalize">
                        {med.timing.period}
                      </span>
                      <span className="text-xs text-gray-400">
                        In {getTimeUntil(med.timing.time)}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>

        {/* Tomorrow's Schedule */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl shadow-sm p-6"
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">
              Tomorrow's Schedule
            </h2>
            <span className="text-sm text-gray-500">
              {format(new Date().setDate(new Date().getDate() + 1), 'MMMM d, yyyy')}
            </span>
          </div>
          <div className="space-y-4">
            {getScheduledMedications(true).length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No medications scheduled for tomorrow
              </div>
            ) : (
              getScheduledMedications(true).map((med, index) => (
                <motion.div
                  key={`tomorrow-${med._id}-${med.timing.time}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <span className="text-xl">💊</span>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{med.name}</h3>
                      <p className="text-sm text-gray-500">{med.dosage}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-sm flex items-center space-x-1">
                      <ClockIcon className="h-4 w-4" />
                      <span>{med.timing.time}</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-sm text-gray-500 capitalize">
                        {med.timing.period}
                      </span>
                      <span className="text-xs text-purple-400">
                        Tomorrow at {format(parseTime(med.timing.time), 'h:mm a')}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
      </div>

      {/* Medications List */}
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Your Medications</h2>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleAddMedication}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <PlusIcon className="h-5 w-5" />
            <span>Add New</span>
          </motion.button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AnimatePresence mode="popLayout">
            {medications.map((medication, index) => (
              <motion.div
                key={medication._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.1 }}
              >
                <MedicationCard
                  medication={medication}
                  onDelete={handleDelete}
                  onEdit={handleEdit}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Add Medication Modal */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6"
            >
              <h2 className="text-2xl font-semibold mb-6">Add New Medication</h2>
              <MedicationForm
                onSubmit={handleAddMedication}
                onCancel={() => setShowAddForm(false)}
                isLoading={loading}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Add these helper functions at the end of the component
function parseTime(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0);
  return date;
}

function getTimeUntil(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const now = new Date();
  const target = new Date();
  target.setHours(hours, minutes, 0);
  
  if (target < now) {
    target.setDate(target.getDate() + 1);
  }
  
  const diff = target - now;
  const hoursLeft = Math.floor(diff / (1000 * 60 * 60));
  const minutesLeft = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hoursLeft === 0) {
    return `${minutesLeft} minutes`;
  }
  return `${hoursLeft}h ${minutesLeft}m`;
} 