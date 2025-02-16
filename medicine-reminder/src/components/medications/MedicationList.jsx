import { useState, useEffect } from 'react';
import axios from 'axios';
import { MedicationCard } from './MedicationCard';
import { motion, AnimatePresence } from 'framer-motion';
import { MedicationForm } from './MedicationForm';

export const MedicationList = () => {
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingMedication, setEditingMedication] = useState(null);

  useEffect(() => {
    fetchMedications();
  }, []);

  const fetchMedications = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/medications');
      setMedications(response.data);
    } catch (error) {
      console.error('Failed to fetch medications:', error);
      setError('Failed to load medications');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (medicationId) => {
    try {
      await axios.delete(`/api/medications/${medicationId}`);
      // Remove the medication from the list
      setMedications(medications.filter(med => med._id !== medicationId));
    } catch (error) {
      console.error('Failed to delete medication:', error);
    }
  };

  const handleEdit = (medication) => {
    setEditingMedication(medication);
  };

  const handleEditSuccess = (updatedMedication) => {
    setMedications(medications.map(med => 
      med._id === updatedMedication._id ? updatedMedication : med
    ));
    setEditingMedication(null);
  };

  if (loading) {
    return <div className="text-center py-4">Loading medications...</div>;
  }

  if (error) {
    return <div className="text-red-600 text-center py-4">{error}</div>;
  }

  if (medications.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No medications added yet.
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4">
      {editingMedication ? (
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold mb-4">Edit Medication</h2>
          <MedicationForm 
            initialData={editingMedication}
            onSuccess={handleEditSuccess}
          />
          <button 
            onClick={() => setEditingMedication(null)}
            className="mt-4 text-gray-600 hover:text-gray-800"
          >
            Cancel Edit
          </button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            {medications.map(medication => (
              <motion.div
                key={medication._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
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
      )}
    </div>
  );
}; 