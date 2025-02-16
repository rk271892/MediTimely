import axios from 'axios';

const API_URL = 'http://localhost:3000/api/auth';

// Add request interceptor
axios.interceptors.request.use(
  config => {
    console.log('Making request:', config.url, config.data);
    return config;
  },
  error => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor
axios.interceptors.response.use(
  response => {
    console.log('Received response:', response.data);
    return response;
  },
  error => {
    console.error('Response error:', error.response?.data || error.message);
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

export const authService = {
  async register(userData) {
    const response = await axios.post(`${API_URL}/register`, userData);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
    }
    return response.data;
  },

  async login(credentials) {
    try {
      const response = await axios.post(`${API_URL}/login`, credentials);
      
      // Add debugging
      console.log('Login response:', response.data);
      
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
  },

  async updateUser(userData) {
    try {
      const response = await axios.put(
        `${API_URL}/profile`,
        userData,
        getAuthHeaders()
      );
      
      if (response.data.user) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      
      return response.data;
    } catch (error) {
      console.error('Update user error:', error);
      throw error;
    }
  },

  getCurrentUser() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    // Add debugging
    console.log('getCurrentUser:', {
      token: !!token,
      user: JSON.parse(user)
    });
    
    if (token && user) {
      return JSON.parse(user);
    }
    return null;
  },

  initializeAuth() {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }
};
