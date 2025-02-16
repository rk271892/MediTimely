import { useNavigate } from 'react-router-dom';
import MedicationForm from '../components/medication/MedicationForm';
import { medicationService } from '../services/medication';

export default function AddMedication() {
  const navigate = useNavigate();

  const handleSubmit = async (data) => {
    try {
      await medicationService.addMedication(data);
      navigate('/medications');
    } catch (error) {
      console.error('Failed to add medication:', error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-6">Add New Medication</h1>
      <MedicationForm 
        onSubmit={handleSubmit}
        onCancel={() => navigate('/medications')}
      />
    </div>
  );
} 