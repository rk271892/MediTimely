import { useState, useEffect } from 'react';
import axios from '../../services/axiosConfig';

export default function ManageMedications() {
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMedications();
  }, []);

  const fetchMedications = async () => {
    try {
      const response = await axios.get('/api/admin/medications');
      console.log('Fetched medications:', response.data);
      setMedications(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch medications:', error);
      setError('Failed to load medications');
      setLoading(false);
    }
  };

  const handleDelete = async (medicationId) => {
    if (!window.confirm('Are you sure you want to delete this medication?')) {
      return;
    }

    try {
      await axios.delete(`/api/admin/medications/${medicationId}`);
      setMedications(medications.filter(med => med._id !== medicationId));
    } catch (error) {
      console.error('Failed to delete medication:', error);
      setError('Failed to delete medication');
    }
  };

  const handleToggleStatus = async (medicationId, currentStatus) => {
    try {
      const response = await axios.patch(`/api/admin/medications/${medicationId}/status`, {
        active: !currentStatus
      });
      
      setMedications(medications.map(med => 
        med._id === medicationId ? response.data : med
      ));
    } catch (error) {
      console.error('Failed to toggle medication status:', error);
      setError('Failed to update medication status');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Manage Medications</h1>
      
      {error && (
        <div className="bg-red-50 text-red-500 p-4 rounded-lg mb-4">
          {error}
        </div>
      )}

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Schedule
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {medications.map((medication) => (
              <tr key={medication._id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {medication.name}
                  </div>
                  <div className="text-sm text-gray-500">
                    {medication.dosage}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {medication.userId?.name}
                  </div>
                  <div className="text-sm text-gray-500">
                    {medication.userId?.email}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {medication.timings?.map(timing => (
                      `${timing.time} (${timing.period})`
                    )).join(', ')}
                  </div>
                  <div className="text-sm text-gray-500">
                    {`${medication.duration?.days} days from ${medication.duration?.startDate}`}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                    ${medication.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {medication.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <button
                    onClick={() => handleToggleStatus(medication._id, medication.active)}
                    className={`${
                      medication.active ? 'text-yellow-600 hover:text-yellow-900' : 'text-green-600 hover:text-green-900'
                    }`}
                  >
                    {medication.active ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => handleDelete(medication._id)}
                    className="text-red-600 hover:text-red-900 ml-2"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 