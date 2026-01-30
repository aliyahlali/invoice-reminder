import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5002/api',
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