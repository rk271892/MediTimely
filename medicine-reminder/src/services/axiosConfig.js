import axios from 'axios';

// Create a new axios instance with default config
const instance = axios.create({
  baseURL: 'http://localhost:3000',
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  withCredentials: true
});

// Add request interceptor for debugging
instance.interceptors.request.use(
  config => {
    // Check if it's an admin route
    if (config.url.startsWith('/api/admin')) {
      const adminToken = localStorage.getItem('adminToken');
      console.log('Admin request detected:', {
        url: config.url,
        hasAdminToken: !!adminToken
      });
      
      if (adminToken) {
        config.headers.Authorization = `Bearer ${adminToken}`;
      }
    } else {
      const token = localStorage.getItem('token');
      if (token) {
        console.log('Adding token to request');
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    
    // Ensure data is properly stringified for POST requests
    if (config.method === 'post' && config.data) {
      config.data = JSON.stringify(config.data);
    }
    
    // Log only non-sensitive parts of the request
    const sanitizedConfig = {
      url: config.url,
      method: config.method,
      headers: {
        ...config.headers,
        Authorization: config.headers.Authorization ? 'Bearer [HIDDEN]' : undefined
      }
    };
    console.log('API Request:', sanitizedConfig);
    
    return config;
  },
  error => {
    console.error('Request error:', error.message);
    return Promise.reject(error);
  }
);

// Add response interceptor
instance.interceptors.response.use(
  response => {
    // Log only non-sensitive parts of the response
    const sanitizedResponse = {
      status: response.status,
      statusText: response.statusText,
      url: response.config.url
    };
    console.log('API Response:', sanitizedResponse);
    return response;
  },
  error => {
    console.error('Response error:', {
      status: error.response?.status,
      message: error.message,
      url: error.config?.url
    });
    
    // Handle authentication errors
    if (error.response?.status === 401 || error.response?.status === 403) {
      if (error.config.url.startsWith('/api/admin')) {
        // Clear admin credentials and redirect to admin login
        localStorage.removeItem('adminToken');
        localStorage.removeItem('isAdmin');
        window.location.href = '/admin/login';
      } else {
        // Clear regular credentials and redirect to login
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default instance; 