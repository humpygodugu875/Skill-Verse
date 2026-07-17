import axios from 'axios';
import { useAuthStore } from '../store';

let API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
if (API_BASE_URL.endsWith('/')) {
  API_BASE_URL = API_BASE_URL.slice(0, -1);
}
if (!API_BASE_URL.endsWith('/api') && !API_BASE_URL.endsWith('/api/v1')) {
  API_BASE_URL = `${API_BASE_URL}/api`;
}


export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // Enforces 15s timeout
});

// Outgoing request interceptor attaching session token
apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor mapping standard error codes
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const customError = {
      message: error.response?.data?.message || 'An unexpected request error occurred.',
      code: error.response?.data?.code || 'UNKNOWN_ERROR',
      status: error.response?.status || 500,
      errors: error.response?.data?.errors || [],
    };
    return Promise.reject(customError);
  }
);
