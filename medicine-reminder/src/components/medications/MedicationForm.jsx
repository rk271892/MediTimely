import React, { useState, useEffect } from 'react';
import axios from '../../services/axiosConfig';
import { InteractionWarningModal } from './InteractionWarningModal';

export default function MedicationForm({ onSuccess, initialData = null }) {
  const [showInteractionWarning, setShowInteractionWarning] = useState(false);
  const [interactions, setInteractions] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    dosage: '',
    duration: {
      startDate: new Date().toISOString().split('T')[0],
      days: 7
    },
    timings: [
      {
        time: '09:00',
        period: 'morning'
      }
    ],
    instructions: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load initial data if editing
  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let response;
      
      if (initialData) {
        // Update existing medication
        response = await axios.put(`/api/medications/${initialData._id}`, formData);
      } else {
        // Create new medication
        response = await axios.post('/api/medications', formData);
      }

      if (response.data.success) {
        onSuccess(response.data.medication);
        
        if (!initialData) {
          // Only reset form for new medications
          setFormData({
            name: '',
            dosage: '',
            duration: {
              startDate: new Date().toISOString().split('T')[0],
              days: 7
            },
            timings: [
              {
                time: '09:00',
                period: 'morning'
              }
            ],
            instructions: ''
          });
        }
      } else {
        setError(response.data.message || 'Failed to save medication');
      }
    } catch (error) {
      console.error('Error saving medication:', error);
      setError(error.response?.data?.message || 'Failed to save medication');
    } finally {
      setLoading(false);
    }
  };

  const addTiming = () => {
    setFormData(prev => ({
      ...prev,
      timings: [
        ...prev.timings,
        {
          time: '09:00',
          period: 'morning'
        }
      ]
    }));
  };

  const removeTiming = (index) => {
    setFormData(prev => ({
      ...prev,
      timings: prev.timings.filter((_, i) => i !== index)
    }));
  };

  const updateTiming = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      timings: prev.timings.map((timing, i) => 
        i === index ? { ...timing, [field]: value } : timing
      )
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 text-red-500 p-4 rounded-lg">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Medication Name
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Dosage
        </label>
        <input
          type="text"
          value={formData.dosage}
          onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Start Date
          </label>
          <input
            type="date"
            value={formData.duration.startDate}
            onChange={(e) => setFormData({
              ...formData,
              duration: { ...formData.duration, startDate: e.target.value }
            })}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Duration (days)
          </label>
          <input
            type="number"
            value={formData.duration.days}
            onChange={(e) => setFormData({
              ...formData,
              duration: { ...formData.duration, days: parseInt(e.target.value) }
            })}
            required
            min="1"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Timings
        </label>
        {formData.timings.map((timing, index) => (
          <div key={index} className="flex gap-4 mb-2">
            <input
              type="time"
              value={timing.time}
              onChange={(e) => updateTiming(index, 'time', e.target.value)}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            <select
              value={timing.period}
              onChange={(e) => updateTiming(index, 'period', e.target.value)}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="morning">Morning</option>
              <option value="afternoon">Afternoon</option>
              <option value="evening">Evening</option>
              <option value="night">Night</option>
            </select>
            {formData.timings.length > 1 && (
              <button
                type="button"
                onClick={() => removeTiming(index)}
                className="mt-1 p-2 text-red-600 hover:text-red-800"
              >
                Remove
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={addTiming}
          className="mt-2 text-blue-600 hover:text-blue-800"
        >
          + Add another time
        </button>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Instructions
        </label>
        <textarea
          value={formData.instructions}
          onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
      >
        {loading ? 'Saving...' : 'Save Medication'}
      </button>

      {showInteractionWarning && (
        <InteractionWarningModal
          interactions={interactions}
          onClose={() => setShowInteractionWarning(false)}
          onContinue={() => {
            setShowInteractionWarning(false);
            // Only call onSuccess if we have medication data
            if (response?.data?.medication) {
              onSuccess(response.data.medication);
            }
          }}
        />
      )}
    </form>
  );
} 