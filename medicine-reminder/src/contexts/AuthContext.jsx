import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from '../services/axiosConfig';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing tokens
    const token = localStorage.getItem('token');
    const adminToken = localStorage.getItem('adminToken');
    
    if (adminToken) {
      // If admin token exists, fetch admin user data
      fetchUserData(adminToken, true);
    } else if (token) {
      // If regular token exists, fetch regular user data
      fetchUserData(token, false);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUserData = async (token, isAdmin) => {
    try {
      const response = await axios.get(isAdmin ? '/api/admin/me' : '/api/auth/me');
      if (response.data.user) {
        // Make sure isAdmin is explicitly set for admin users
        const userData = isAdmin ? { ...response.data.user, isAdmin: true } : response.data.user;
        console.log('Setting user data:', userData);
        setUser(userData);
      }
    } catch (error) {
      console.error('Failed to fetch user data:', error);
      // Clear tokens on error
      localStorage.removeItem(isAdmin ? 'adminToken' : 'token');
      if (isAdmin) localStorage.removeItem('isAdmin');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      // Only log non-sensitive data
      console.log('Authentication attempt for:', email);

      const response = await axios.post('/api/auth/login', { email, password });
      
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        setUser(response.data.user);
      }
    } catch (error) {
      console.error('Login failed for:', email);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('adminToken');
    localStorage.removeItem('isAdmin');
    setUser(null);
  };

  const register = async (userData) => {
    try {
      const response = await axios.post('/api/auth/register', userData);
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      setUser(user);
      return response.data;
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    }
  };

  const updateUser = async (userData) => {
    try {
      const response = await axios.put('/api/auth/profile', userData);
      setUser(response.data.user);
      return response.data.user;
    } catch (error) {
      console.error('Update user error:', error);
      throw error;
    }
  };

  const resetPassword = async (email) => {
    try {
      const response = await axios.post('/api/auth/reset-password', { email });
      return response.data;
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    }
  };

  const resetPasswordConfirm = async (token, newPassword) => {
    try {
      const response = await axios.post('/api/auth/reset-password-confirm', {
        token,
        newPassword
      });
      return response.data;
    } catch (error) {
      console.error('Reset password confirm error:', error);
      throw error;
    }
  };

  const value = {
    user,
    setUser,
    loading,
    login,
    register,
    logout,
    updateUser,
    resetPassword,
    resetPasswordConfirm
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
} 