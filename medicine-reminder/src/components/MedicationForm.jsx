import React, { useState } from 'react';
import axios from '../services/axiosConfig';
import { format } from 'date-fns';

const MedicationForm = ({ onSubmitSuccess }) => {
  const [medication, setMedication] = useState({
    name: '',
    dosage: '',
    timings: [{ time: '', period: 'AM' }],
    duration: {
      days: 7,
      startDate: format(new Date(), 'yyyy-MM-dd')
    },
    instructions: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      // Validate form data
      if (!medication.name || !medication.dosage || medication.timings.length === 0) {
        setError('Please fill in all required fields');
        return;
      }

      // Validate timings
      const invalidTiming = medication.timings.some(timing => !timing.time);
      if (invalidTiming) {
        setError('Please enter valid times for all timings');
        return;
      }

      // Format the data
      const formattedData = {
        ...medication,
        timings: medication.timings.map(timing => ({
          time: timing.time,
          period: timing.period
        })),
        duration: {
          days: parseInt(medication.duration.days),
          startDate: medication.duration.startDate
        }
      };

      console.log('Submitting medication data:', formattedData);

      // Send the request
      const response = await axios.post('/medications', formattedData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      console.log('Server response:', response);

      if (!response?.data || response.data.success === false) {
        throw new Error(response?.data?.message || 'Invalid response from server');
      }

      // Clear form and show success message
      setMedication({
        name: '',
        dosage: '',
        timings: [{ time: '', period: 'AM' }],
        duration: {
          days: 7,
          startDate: format(new Date(), 'yyyy-MM-dd')
        },
        instructions: ''
      });

      // Show success message
      setSuccess(response.data.message || 'Medication added successfully!');
      setTimeout(() => setSuccess(''), 3000);

      // Refresh medications list if onSubmitSuccess is provided
      if (onSubmitSuccess) {
        onSubmitSuccess();
      }

    } catch (error) {
      console.error('Form submission error:', error);
      let errorMessage;
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.errors) {
        errorMessage = error.response.data.errors.join(', ');
      } else {
        errorMessage = error.message || 'Failed to add medication';
      }
      setError(errorMessage);
      setTimeout(() => setError(''), 5000);
    }
  };

  return (
    <div>
      {/* Render your form here */}
    </div>
  );
};

export default MedicationForm; 