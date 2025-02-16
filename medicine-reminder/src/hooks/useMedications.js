import { useState, useEffect } from 'react';
import { medicationService } from '../services/medication';
import { useAuth } from '../contexts/AuthContext.jsx';

export function useMedications() {
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  const fetchMedications = async () => {
    if (!user) {
      setMedications([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await medicationService.getAllMedications();
      setMedications(data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch medications');
    } finally {
      setLoading(false);
    }
  };

  const addMedication = async (medicationData) => {
    try {
      const newMedication = await medicationService.addMedication(medicationData);
      setMedications(prev => [...prev, newMedication]);
      return newMedication;
    } catch (err) {
      throw err;
    }
  };

  const updateMedication = async (id, medicationData) => {
    try {
      const updatedMedication = await medicationService.updateMedication(id, medicationData);
      setMedications(prev => 
        prev.map(med => med._id === id ? updatedMedication : med)
      );
      return updatedMedication;
    } catch (err) {
      throw err;
    }
  };

  const deleteMedication = async (id) => {
    try {
      await medicationService.deleteMedication(id);
      setMedications(prev => prev.filter(med => med._id !== id));
    } catch (err) {
      throw err;
    }
  };

  useEffect(() => {
    fetchMedications();
  }, [user]);

  return {
    medications,
    loading,
    error,
    addMedication,
    updateMedication,
    deleteMedication,
    refreshMedications: fetchMedications
  };
}
