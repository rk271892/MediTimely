import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import MedicationForm from '../medication/MedicationForm';
import axios from '../../services/axiosConfig';

export default function Dashboard() {
  const { currentUser } = useAuth();
  const [isAddMedicationOpen, setIsAddMedicationOpen] = useState(false);

  // Add effect to monitor state changes
  useEffect(() => {
    console.log('isAddMedicationOpen changed:', isAddMedicationOpen);
  }, [isAddMedicationOpen]);

  const handleSubmit = async (medicationData) => {
    console.log('Attempting to submit medication:', medicationData);
    try {
      const response = await axios.post('/api/medications', medicationData);
      console.log('Medication added:', response.data);
      setIsAddMedicationOpen(false);  // Close modal after successful submission
      return response.data;
    } catch (error) {
      console.error('Failed to add medication:', error);
      throw error;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-6">Welcome, {currentUser?.email}</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Medication Summary Card */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-4">Medication Summary</h2>
          <div className="space-y-2">
            <p>Total Medications: 5</p>
            <p>Due Today: 3</p>
            <Link 
              to="/medications" 
              className="text-blue-600 hover:text-blue-800 block mt-4"
            >
              View All Medications →
            </Link>
          </div>
        </div>

        {/* Today's Schedule Card */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-4">Today's Schedule</h2>
          <div className="space-y-2">
            <p>Next Medication: 2:00 PM</p>
            <p>Remaining Today: 4</p>
            <Link 
              to="/schedule" 
              className="text-blue-600 hover:text-blue-800 block mt-4"
            >
              View Full Schedule →
            </Link>
          </div>
        </div>

        {/* Quick Actions Card */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <button 
              type="button"
              className="w-full text-left px-4 py-2 bg-blue-50 text-blue-700 rounded hover:bg-blue-100"
              onClick={() => {
                console.log('Add Medication button clicked - Before setState');
                setIsAddMedicationOpen(true);
                console.log('Add Medication button clicked - After setState');
              }}
            >
              Add New Medication
            </button>
            <button className="w-full text-left px-4 py-2 bg-blue-50 text-blue-700 rounded hover:bg-blue-100">
              Set Reminder
            </button>
            <button className="w-full text-left px-4 py-2 bg-blue-50 text-blue-700 rounded hover:bg-blue-100">
              View Reports
            </button>
          </div>
        </div>
      </div>

      {isAddMedicationOpen ? (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsAddMedicationOpen(false);
            }
          }}
        >
          <div 
            className="max-w-2xl w-full"
            onClick={(e) => e.stopPropagation()}  // Prevent modal from closing when clicking inside
          >
            <MedicationForm
              onSubmit={handleSubmit}
              onCancel={() => {
                console.log('Cancel clicked');
                setIsAddMedicationOpen(false);
              }}
              isLoading={false}
              isEditing={false}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
} 