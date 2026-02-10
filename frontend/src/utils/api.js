import axios from 'axios';

// Use environment variable for API URL, with appropriate defaults
const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // In production (deployed), construct the backend URL from current domain
  if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    // Replace 'frontend' or standard port with backend service URL
    const hostname = window.location.hostname;
    // Assumes backend is at same domain or a specific backend URL
    // Update this to match your actual backend URL on Render
    if (hostname.includes('onrender.com')) {
      // If frontend is on render, backend should be too
      return 'https://invoice-reminder-3.onrender.com'; 
    }
  }
  
  // Default to localhost for development
  return 'http://localhost:5002';
};

const VITE_API_URL = getApiBaseUrl();

const api = axios.create({
  baseURL: VITE_API_URL,
  timeout: 10000 // 10 second timeout
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor for better error handling
api.interceptors.response.use(
  response => response,
  error => {
    // Handle network errors
    if (!error.response) {
      if (error.code === 'ECONNABORTED') {
        error.message = 'Request timeout. The server is taking too long to respond.';
      } else if (error.message === 'Network Error') {
        error.message = 'Cannot connect to server. Please make sure the backend server is running on port 5002.';
      } else {
        error.message = `Network error: ${error.message || 'Unable to reach the server'}`;
      }
    }
    return Promise.reject(error);
  }
);

export default api;  