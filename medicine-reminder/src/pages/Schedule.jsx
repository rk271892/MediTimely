import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { medicationService } from '../services/medication';
import { useNavigate } from 'react-router-dom';
import MedicationForm from '../components/medication/MedicationForm';
import MedicationCard from '../components/medication/MedicationCard';
import { PlusIcon, ClockIcon, CalendarIcon, XMarkIcon } from '@heroicons/react/24/outline';

export default function Schedule() {
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    loadMedications();
  }, [user, navigate]);

  const loadMedications = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await medicationService.getMedications();
      setMedications(data);
    } catch (err) {
      console.error('Failed to load medications:', err);
      if (err.response?.status === 401) {
        navigate('/auth');
      } else {
        setError(err.response?.data?.message || 'Failed to load medications');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      console.log('Attempting to delete medication:', id);
      setLoading(true);
      setError(null);
      
      await medicationService.deleteMedication(id);
      
      // Update local state after successful deletion
      setMedications(prevMedications => 
        prevMedications.filter(med => med._id !== id)
      );
      
      console.log('Medication deleted successfully');
    } catch (err) {
      console.error('Failed to delete medication:', err);
      setError(err.response?.data?.message || 'Failed to delete medication');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMedication = async (medicationData) => {
    try {
      setLoading(true);
      setError(null);
      
      const isUpdate = Boolean(medicationData._id);
      console.log(`Schedule: ${isUpdate ? 'Updating' : 'Creating'} medication:`, medicationData);
      
      let response;
      try {
        response = await medicationService.createMedication(medicationData);
        console.log('Schedule: Response from medication service:', response);
      } catch (error) {
        console.error('Schedule: Operation failed:', error);
        throw error;
      }

      if (!response || !response._id) {
        console.error('Schedule: Invalid response:', response);
        throw new Error('Invalid response from server');
      }

      // Update local state
      if (isUpdate) {
        setMedications(prev => prev.map(med => 
          med._id === response._id ? response : med
        ));
      } else {
        setMedications(prev => [...prev, response]);
      }
      
      setShowAddForm(false);
      return response;

    } catch (error) {
      console.error('Schedule: Operation failed:', error);
      setError(error.message || `Failed to ${medicationData._id ? 'update' : 'add'} medication`);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <motion.div
          animate={{ 
            rotate: 360,
            scale: [1, 1.1, 1]
          }}
          transition={{ 
            rotate: { duration: 1.5, repeat: Infinity, ease: "linear" },
            scale: { duration: 1, repeat: Infinity }
          }}
          className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Medication Schedule
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Keep track of your medications and maintain a healthy routine
          </p>
        </motion.div>

        {/* Quick Stats */}
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
              <CalendarIcon className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Today's Doses</p>
              <p className="text-2xl font-semibold text-gray-900">
                {medications.reduce((acc, med) => acc + med.timings.length, 0)}
              </p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowAddForm(true)}
              className="w-full h-full flex items-center justify-center space-x-2 text-blue-600 hover:text-blue-700"
            >
              <PlusIcon className="h-5 w-5" />
              <span>Add New Medication</span>
            </motion.button>
          </div>
        </motion.div>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-8 p-4 bg-red-100 text-red-700 rounded-xl flex justify-between items-center"
            >
              <span>{error}</span>
              <button 
                onClick={() => setError(null)}
                className="text-red-500 hover:text-red-700"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Add Medication Form */}
        <AnimatePresence>
          {showAddForm && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            >
              <motion.div
                initial={{ y: 50 }}
                animate={{ y: 0 }}
                exit={{ y: 50 }}
                className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              >
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Add New Medication</h2>
                    <button
                      onClick={() => setShowAddForm(false)}
                      className="text-gray-400 hover:text-gray-500"
                    >
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </div>
                  <MedicationForm
                    onSubmit={handleAddMedication}
                    onCancel={() => setShowAddForm(false)}
                    isLoading={loading}
                  />
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Medications List */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="space-y-6"
        >
          {medications.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16 bg-white rounded-2xl shadow-sm"
            >
              <div className="max-w-sm mx-auto">
                <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No medications scheduled
                </h3>
                <p className="text-gray-500 mb-6">
                  Start by adding your first medication to keep track of your health routine
                </p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowAddForm(true)}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add Your First Medication
                </motion.button>
              </div>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}