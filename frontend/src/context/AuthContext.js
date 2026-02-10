import React, { createContext, useState, useEffect } from 'react';
import api from '../utils/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      loadUser();
    } else {
      setLoading(false);
    }
  }, []);

  const loadUser = async () => {
    try {
      const { data } = await api.get('/api/auth/me');
      setUser(data.user);
    } catch (error) {
      // Only remove token if it's an auth error, not a network error
      if (error.response && error.response.status === 401) {
        localStorage.removeItem('token');
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const { data } = await api.post('/api/auth/login', { email, password });
      localStorage.setItem('token', data.token);
      setUser(data.user);
    } catch (error) {
      // Handle network errors specifically
      if (!error.response) {
        const networkError = error.message || 'Cannot connect to server. Please make sure the backend is running.';
        throw new Error(networkError);
      }
      // Re-throw with more context for API errors
      const respErr = error.response?.data?.error;
      let errorMessage;
      if (typeof respErr === 'string') {
        errorMessage = respErr;
      } else if (respErr && typeof respErr === 'object') {
        errorMessage = respErr.message || JSON.stringify(respErr);
      } else {
        errorMessage = error.message || 'Login failed';
      }
      throw new Error(errorMessage);
    }
  };

  const register = async (name, email, password) => {
    try {
      const { data } = await api.post('/api/auth/register', { name, email, password });
      localStorage.setItem('token', data.token);
      setUser(data.user);
    } catch (error) {
      // Handle network errors specifically
      if (!error.response) {
        const networkError = error.message || 'Cannot connect to server. Please make sure the backend is running.';
        throw new Error(networkError);
      }
      // Re-throw with more context for API errors
      const respErr = error.response?.data?.error;
      let errorMessage;
      if (typeof respErr === 'string') {
        errorMessage = respErr;
      } else if (respErr && typeof respErr === 'object') {
        errorMessage = respErr.message || JSON.stringify(respErr);
      } else {
        errorMessage = error.message || 'Registration failed';
      }
      throw new Error(errorMessage);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    // Clear API authorization header
    delete api.defaults.headers.common['Authorization'];
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, loadUser }}>
      {children}
    </AuthContext.Provider>
  );
  
};