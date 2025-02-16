import axios from 'axios';

const instance = axios.create({
  baseURL: 'http://localhost:3000',
  timeout: 5000,
});

// Add request interceptor
instance.interceptors.request.use(
  (config) => {
    console.log('Making request to:', config.url);
    
    if (config.url.startsWith('/api/admin')) {
      const adminToken = localStorage.getItem('adminToken');
      console.log('Admin request, token:', adminToken ? 'present' : 'missing');
      
      if (adminToken) {
        config.headers.Authorization = `Bearer ${adminToken}`;
      }
      // Add a custom header to identify admin requests
      config.headers['X-Admin-Request'] = 'true';
    } else {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    
    console.log('Request headers:', config.headers);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Update the response interceptor
instance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 403 || error.response?.status === 401) {
      // Check if this is an admin route
      if (error.config.url.startsWith('/api/admin')) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('isAdmin');
        window.location.href = '/admin/login'; // Change this to admin login
      } else {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
    console.error('Response error:', error.response || error);
    return Promise.reject(error);
  }
);

export default instance; 