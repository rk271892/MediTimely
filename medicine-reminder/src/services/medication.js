import axios from './axiosConfig';
import { format, parseISO } from 'date-fns';

const API_URL = 'http://localhost:3000/api';

// Add response interceptor to handle auth errors
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      authService.logout();
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };
};

export const medicationService = {
  async getMedications() {
    try {
      const response = await axios.get('/api/medications');
      console.log('Fetched medications:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching medications:', error);
      throw error;
    }
  },

  async addMedication(medicationData) {
    try {
      console.log('Adding medication:', medicationData);
      const response = await axios.post('/api/medications', medicationData);
      console.log('Add medication response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error adding medication:', error);
      throw error;
    }
  },

  async updateMedication(id, medicationData) {
    try {
      const response = await axios.put(`/api/medications/${id}`, medicationData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async deleteMedication(id) {
    try {
      console.log('Deleting medication:', id);
      await axios.delete(`/api/medications/${id}`);
      console.log('Medication deleted successfully');
    } catch (error) {
      console.error('Error deleting medication:', error);
      throw error;
    }
  },

  async createMedication(medicationData) {
    try {
      console.log('Service: Creating/Updating medication with data:', medicationData);
      
      // Check if we're updating an existing medication
      if (medicationData._id) {
        const response = await axios.put(
          `${API_URL}/medications/${medicationData._id}`,
          medicationData,
          getAuthHeaders()
        );
        console.log('Service: Update response:', response);
        return response.data;
      }
      
      // Creating new medication
      const response = await axios.post(
        `${API_URL}/medications`,
        medicationData,
        getAuthHeaders()
      );
      
      console.log('Service: Create response:', response);
      
      if (!response.data) {
        console.error('Service: No data in response:', response);
        throw new Error('No data received from server');
      }

      if (!response.data._id) {
        console.error('Service: No _id in response data:', response.data);
        throw new Error('Invalid medication data received');
      }
      
      console.log('Service: Successfully created/updated medication:', response.data);
      return response.data;

    } catch (error) {
      console.error('Service: Medication operation error:', error);
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw error;
    }
  }
}; 