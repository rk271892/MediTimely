import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import Button from '../common/Button';
import Input from '../common/Input';
import { format, parseISO } from 'date-fns';
import { useNavigate } from 'react-router-dom';

// Add these helper functions at the top of your file
const convertTo24Hour = (time, period) => {
  if (!time) return '';
  
  let [hours, minutes] = time.split(':');
  hours = parseInt(hours);
  
  if (period === 'PM' && hours !== 12) {
    hours += 12;
  } else if (period === 'AM' && hours === 12) {
    hours = 0;
  }
  
  return `${hours.toString().padStart(2, '0')}:${minutes}`;
};

const convertTo12Hour = (time) => {
  if (!time) return { time: '', period: 'AM' };
  
  let [hours, minutes] = time.split(':');
  hours = parseInt(hours);
  
  let period = 'AM';
  if (hours >= 12) {
    period = 'PM';
    if (hours > 12) hours -= 12;
  } else if (hours === 0) {
    hours = 12;
  }
  
  return {
    time: `${hours.toString().padStart(2, '0')}:${minutes}`,
    period
  };
};

export default function MedicationForm({ onSubmit, onCancel, isLoading, initialData, isEditing }) {
  const navigate = useNavigate();
  // Format initial data if it exists
  const getInitialData = () => {
    if (initialData) {
      return {
        ...initialData,
        duration: {
          ...initialData.duration,
          startDate: initialData.duration.startDate.includes('T')
            ? format(new Date(initialData.duration.startDate), 'yyyy-MM-dd')
            : initialData.duration.startDate
        }
      };
    }
    return {
      name: '',
      dosage: '',
      timings: [{ time: '', period: 'AM' }],
      duration: {
        days: 7,
        startDate: format(new Date(), 'yyyy-MM-dd')
      },
      instructions: ''
    };
  };

  const [formData, setFormData] = useState(getInitialData());

  // Convert initial timings to 12-hour format
  useEffect(() => {
    if (initialData?.timings) {
      const converted = initialData.timings.map(timing => ({
        ...timing,
        ...convertTo12Hour(timing.time)
      }));
      setFormData(prev => ({ ...prev, timings: converted }));
    }
  }, [initialData]);

  const periods = [
    { value: 'morning', label: '🌅 Morning' },
    { value: 'afternoon', label: '☀️ Afternoon' },
    { value: 'evening', label: '🌆 Evening' },
    { value: 'night', label: '🌙 Night' }
  ];

  const addTiming = () => {
    setFormData({
      ...formData,
      timings: [...formData.timings, { time: '', period: 'AM' }]
    });
  };

  const removeTiming = (index) => {
    setFormData({
      ...formData,
      timings: formData.timings.filter((_, i) => i !== index)
    });
  };

  const updateTiming = (index, field, value) => {
    const newTimings = [...formData.timings];
    newTimings[index] = { ...newTimings[index], [field]: value };
    setFormData({ ...formData, timings: newTimings });
  };

  const handleTimeChange = (index, value) => {
    const updatedTimings = [...formData.timings];
    const [hours] = value.split(':');
    const period = parseInt(hours) >= 12 ? 'PM' : 'AM';
    
    updatedTimings[index] = {
      ...updatedTimings[index],
      time: value,
      period
    };
    
    console.log('Time changed:', {
      value,
      hours: parseInt(hours),
      period,
      timing: updatedTimings[index]
    });
    
    setFormData({ ...formData, timings: updatedTimings });
  };

  const handlePeriodChange = (index, period) => {
    const updatedTimings = [...formData.timings];
    updatedTimings[index] = {
      ...updatedTimings[index],
      period
    };
    setFormData({ ...formData, timings: updatedTimings });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      console.log('Starting form submission...');
      
      // Ensure we have valid form data
      if (!formData.name || !formData.dosage || formData.timings.length === 0) {
        throw new Error('Please fill in all required fields');
      }

      // Convert times to 24-hour format before submitting
      const convertedTimings = formData.timings.map(timing => ({
        ...timing,
        time: convertTo24Hour(timing.time, timing.period)
      }));

      console.log('Submitting medication with timings:', {
        original: formData.timings,
        converted: convertedTimings
      });

      const formattedData = {
        ...formData,
        duration: {
          ...formData.duration,
          days: parseInt(formData.duration.days),
          startDate: format(parseISO(formData.duration.startDate), 'yyyy-MM-dd')
        },
        timings: convertedTimings
      };

      console.log('Submitting formatted data:', formattedData);
      
      const response = await onSubmit(formattedData);
      console.log('Form: Response from submit:', response);

      if (!response || !response._id) {
        console.error('Form: Invalid response:', response);
        throw new Error('Invalid response from server');
      }

      console.log(`Form: Successfully ${isEditing ? 'updated' : 'created'} medication:`, response);

      // Close the form on success
      if (onCancel) {
        onCancel();
      }

      return response;
    } catch (error) {
      console.error('Form submission error:', error);
      throw error;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-sm p-6"
    >
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        {isEditing ? 'Edit Medication' : 'Add New Medication'}
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          {/* Medicine Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Medicine Name
            </label>
            <Input
              type="text"
              placeholder="Enter medicine name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          {/* Dosage */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              How many tablets/amount at a time?
            </label>
            <Input
              type="text"
              placeholder="Example: 1 tablet, 2 drops, 5ml"
              value={formData.dosage}
              onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
              required
            />
          </div>

          {/* Timings */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              When do you need to take this medicine?
            </label>
            {formData.timings.map((timing, index) => (
              <div key={index} className="flex items-center space-x-4 mb-4 bg-gray-50 p-4 rounded-lg">
                <div className="flex-1">
                  <select
                    value={timing.period}
                    onChange={(e) => handlePeriodChange(index, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {periods.map(period => (
                      <option key={period.value} value={period.value}>
                        {period.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <Input
                    type="time"
                    value={timing.time}
                    onChange={(e) => handleTimeChange(index, e.target.value)}
                    required
                  />
                  <span className="ml-2 text-gray-600">
                    {timing.period}
                  </span>
                </div>
                {formData.timings.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeTiming(index)}
                    className="p-2 text-red-500 hover:text-red-700"
                    title="Remove this timing"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="secondary"
              onClick={addTiming}
              className="flex items-center"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Add Another Time
            </Button>
          </div>

          {/* Duration */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                For how many days?
              </label>
              <div className="flex items-center space-x-4">
                <Input
                  type="number"
                  min="1"
                  value={formData.duration.days}
                  onChange={(e) => setFormData({
                    ...formData,
                    duration: { ...formData.duration, days: parseInt(e.target.value) }
                  })}
                  required
                />
                <span className="text-gray-600">days</span>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={formData.duration.startDate}
                onChange={(e) => setFormData({
                  ...formData,
                  duration: {
                    ...formData.duration,
                    startDate: e.target.value
                  }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
          </div>

          {/* Special Instructions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Any special instructions? (Optional)
            </label>
            <textarea
              placeholder="Example: Take after meals, Take with warm water"
              value={formData.instructions}
              onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              rows={2}
            />
          </div>
        </div>

        <div className="flex space-x-4 pt-4">
          <Button type="submit" className="flex-1 bg-gray-500 hover:bg-gray-800 text-white">
            {isEditing ? 'Save Changes' : 'Add Medicine'}
          </Button>
          {onCancel && (
            <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">
              Cancel
            </Button>
          )}
        </div>
      </form>
    </motion.div>
  );
}