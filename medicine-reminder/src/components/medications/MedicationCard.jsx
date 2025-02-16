import { useState } from 'react';
import { format } from 'date-fns';
import { InformationCircleIcon, TrashIcon } from '@heroicons/react/24/outline';
import { MedicineInfoModal } from './MedicineInfoModal';
import axios from '../../services/axiosConfig';

export const MedicationCard = ({ medication, onDelete, onEdit }) => {
  const [showInfo, setShowInfo] = useState(false);
  const [medicineInfo, setMedicineInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleInfoClick = async () => {
    try {
      setLoading(true);
      console.log('Fetching info for medication:', medication._id);
      
      const response = await axios.get(`/api/medications/${medication._id}/info`);
      console.log('Medicine info response:', response.data);
      
      setMedicineInfo(response.data.medicineInfo);
      setShowInfo(true);
    } catch (error) {
      console.error('Failed to get medicine info:', error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{medication.name}</h3>
          <p className="text-sm text-gray-600">{medication.dosage}</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleInfoClick}
            disabled={loading}
            className="text-blue-600 hover:text-blue-700 p-2 rounded-full hover:bg-blue-50 transition-colors"
            title="View Medicine Info"
          >
            <InformationCircleIcon className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => onEdit(medication)}
            className="text-blue-600 hover:text-blue-800"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(medication._id)}
            className="text-red-600 hover:text-red-800"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="mt-4">
        <div className="text-sm text-gray-600 space-y-1">
          <p><strong>Start Date:</strong> {format(new Date(medication.duration.startDate), 'PPP')}</p>
          <p><strong>Duration:</strong> {medication.duration.days} days</p>
          {medication.instructions && (
            <p><strong>Instructions:</strong> {medication.instructions}</p>
          )}
        </div>

        <div className="mt-3">
          <p className="text-sm font-medium text-gray-900">Timings:</p>
          <div className="mt-1 flex flex-wrap gap-2">
            {medication.timings.map((timing, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
              >
                {timing.time} ({timing.period})
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-2 text-xs text-gray-500">
        {loading && 'Loading info...'}
        {medicineInfo && 'Info loaded'}
        {showInfo && 'Modal should show'}
      </div>

      <MedicineInfoModal
        isOpen={showInfo}
        onClose={() => {
          console.log('Closing modal');
          setShowInfo(false);
        }}
        medicineInfo={medicineInfo}
      />
    </div>
  );
}; 