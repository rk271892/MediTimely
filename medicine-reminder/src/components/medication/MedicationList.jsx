import { useState, useEffect } from 'react';
import { medicationService } from '../../services/medication';
import { useAuth } from '../../contexts/AuthContext.jsx';
import MedicationCard from './MedicationCard';
import MedicationForm from './MedicationForm';

export default function MedicationList() {
  const { user } = useAuth();
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    loadMedications();
  }, [refreshKey]);

  const loadMedications = async () => {
    try {
      setLoading(true);
      const data = await medicationService.getMedications();
      setMedications(data);
      setError(null);
    } catch (err) {
      setError('Failed to load medications');
      console.error('Error loading medications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await medicationService.deleteMedication(id);
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Failed to delete medication:', error);
      setError('Failed to delete medication');
    }
  };

  const handleAdd = async (medicationData) => {
    try {
      const newMedication = await medicationService.addMedication(medicationData);
      setRefreshKey(prev => prev + 1);
      setShowAddForm(false);
    } catch (error) {
      console.error('Failed to add medication:', error);
      setError('Failed to add medication');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">My Medications</h1>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Add Medication
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {medications.map(medication => (
            <MedicationCard
              key={medication._id}
              medication={medication}
              onDelete={() => handleDelete(medication._id)}
            />
          ))}
        </div>
      )}

      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
            <MedicationForm
              onSubmit={handleAdd}
              onCancel={() => setShowAddForm(false)}
              isLoading={loading}
            />
          </div>
        </div>
      )}
    </div>
  );
}

