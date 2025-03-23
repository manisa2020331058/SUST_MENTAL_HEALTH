import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Handle specific error cases
      switch (error.response.status) {
        case 401:
          // Unauthorized - clear token and redirect to login
          localStorage.removeItem('token');
          window.location.href = '/login';
          break;
        case 403:
          // Forbidden
          console.error('Access forbidden');
          break;
        case 404:
          // Not found
          console.error('Resource not found');
          break;
        default:
          // Other errors
          console.error('API Error:', error.response.data);
      }
    } else if (error.request) {
      // Network error
      console.error('Network Error:', error.request);
    } else {
      // Other errors
      console.error('Error:', error.message);
    }
    return Promise.reject(error);
  }
);

// Session related API calls
const sessions = {
  getUpcoming: () => api.get('/sessions/psychologist?timeframe=upcoming'),
  getPast: () => api.get('/sessions/psychologist?timeframe=past'),
  create: (data) => api.post('/sessions', data),
  updateStatus: (sessionId, status) => api.patch(`/sessions/${sessionId}/status`, { status }),
  addNotes: (sessionId, notes) => api.patch(`/sessions/${sessionId}/notes`, { notes })
};

// Student related API calls
const students = {
  getAll: () => api.get('/psychologist/students'),
  enroll: (data) => api.post('/psychologist/students/enroll', data),
  getOne: (id) => api.get(`/students/${id}`),
  update: (id, data) => api.put(`/students/${id}`, data)
};

// Profile related API calls
const profile = {
  get: () => api.get('/psychologist/profile'),
  update: (data) => api.put('/psychologist/profile', data),
  updateAvailability: (data) => api.put('/psychologist/availability', data)
};

// Export all API functions
export default {
  ...api,
  sessions,
  students,
  profile
};