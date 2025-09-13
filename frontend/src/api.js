import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://task-management-ffe9.onrender.com/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Debug: Log baseURL to verify
console.log('API baseURL:', import.meta.env.VITE_API_URL);

export default api;
