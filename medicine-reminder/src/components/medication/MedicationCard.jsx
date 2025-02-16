import { useState } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { 
  ClockIcon, 
  CalendarIcon, 
  TrashIcon, 
  PencilIcon,
  BellIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import MedicationForm from './MedicationForm';
import MedicineInfoModal from './MedicineInfoModal';
import axiosInstance from '../../services/axiosConfig';

export default function MedicationCard({ medication, onEdit, onDelete }) {
  const [isEditing, setIsEditing] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [medicineInfo, setMedicineInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleEdit = (updatedData) => {
    onEdit({ ...updatedData, _id: medication._id });
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this medication?')) {
      try {
        await onDelete(medication._id);
      } catch (error) {
        console.error('Failed to delete medication:', error);
      }
    }
  };

  const handleInfoClick = async () => {
    try {
      console.log('Info button clicked for medication:', medication);
      setLoading(true);
      
      const response = await axiosInstance.get(`/api/medications/${medication._id}/info`);
      console.log('API Response:', response.data);
      
      setMedicineInfo(response.data.medicineInfo);
      setShowInfo(true);
    } catch (error) {
      console.error('Failed to get medicine info:', error.response?.data || error);
    } finally {
      setLoading(false);
    }
  };

  const daysLeft = Math.ceil(
    (new Date(medication.duration.startDate).getTime() + 
    medication.duration.days * 24 * 60 * 60 * 1000 - 
    new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  if (isEditing) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="bg-white rounded-xl shadow-sm p-6"
      >
        <MedicationForm
          initialData={medication}
          onSubmit={handleEdit}
          onCancel={() => setIsEditing(false)}
          isEditing={true}
        />
      </motion.div>
    );
  }

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="bg-white rounded-xl shadow-sm overflow-hidden"
    >
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-2xl">💊</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {medication.name}
              </h3>
              <p className="text-sm text-gray-500">{medication.dosage}</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handleInfoClick}
              disabled={loading}
              className="text-blue-600 hover:text-blue-700 p-2 rounded-full hover:bg-blue-50"
              title="View Medicine Info"
            >
              <InformationCircleIcon className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setIsEditing(true)}
              className="text-gray-600 hover:text-gray-700 p-2 rounded-full hover:bg-gray-50"
            >
              <PencilIcon className="h-5 w-5" />
            </button>
            <button
              onClick={handleDelete}
              className="text-red-600 hover:text-red-700 p-2 rounded-full hover:bg-red-50"
            >
              <TrashIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-6 space-y-4">
        {/* Timing Section */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <ClockIcon className="h-5 w-5 text-blue-500" />
            <span>Daily Schedule</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {medication.timings.map((timing, idx) => (
              <div
                key={idx}
                className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm flex items-center space-x-1"
              >
                <BellIcon className="h-4 w-4" />
                <span>{timing.time}</span>
                <span className="text-blue-400">•</span>
                <span className="capitalize">{timing.period}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Duration Section */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <CalendarIcon className="h-5 w-5 text-green-500" />
            <span>Duration</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-xs text-gray-500">Started</p>
              <p className="text-sm font-medium text-gray-900">
                {format(new Date(medication.duration.startDate), 'MMM dd, yyyy')}
              </p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-xs text-gray-500">Days Left</p>
              <p className="text-sm font-medium text-gray-900">
                {daysLeft > 0 ? `${daysLeft} days` : 'Completed'}
              </p>
            </div>
          </div>
        </div>

        {/* Instructions Section */}
        {medication.instructions && (
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <InformationCircleIcon className="h-5 w-5 text-purple-500" />
              <span>Instructions</span>
            </div>
            <p className="text-sm text-gray-600 bg-purple-50 p-3 rounded-lg">
              {medication.instructions}
            </p>
          </div>
        )}

        {/* Progress Bar */}
        <div className="pt-2">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Progress</span>
            <span>
              {Math.min(100, Math.max(0, 
                Math.round((medication.duration.days - daysLeft) / medication.duration.days * 100)
              ))}%
            </span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ 
                width: `${Math.min(100, Math.max(0, 
                  (medication.duration.days - daysLeft) / medication.duration.days * 100
                ))}%` 
              }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
            />
          </div>
        </div>
      </div>

      <MedicineInfoModal
        isOpen={showInfo}
        onClose={() => setShowInfo(false)}
        medicineInfo={medicineInfo}
      />
    </motion.div>
  );
}