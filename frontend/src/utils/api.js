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
      switch (error.response.status) {
        case 401:
          localStorage.removeItem('token');
          window.location.href = '/login';
          break;
        case 403:
          console.error('Access forbidden');
          break;
        case 404:
          console.error('Resource not found');
          break;
        default:
          console.error('API Error:', error.response.data);
      }
    }
    return Promise.reject(error);
  }
);

// Session related API calls
const sessions = {
  create: (data) => api.post('/sessions', data),
  getUpcoming: () => api.get('/sessions/psychologist/upcoming'),
  getPast: () => api.get('/sessions/psychologist/past'),
  getAll: (filters) => api.get('/sessions/psychologist/all', { params: filters }),
  getByStudent: (studentId) => api.get(`/sessions/student/${studentId}`),
  getSingle: (sessionId) => api.get(`/sessions/${sessionId}`),
  updateStatus: (sessionId, status) => api.patch(`/sessions/${sessionId}/status`, { status }),
  addNotes: (sessionId, notes) => api.patch(`/sessions/${sessionId}/notes`, { notes }),
  cancel: (sessionId, reason) => api.post(`/sessions/${sessionId}/cancel`, { reason }),
  reschedule: (sessionId, data) => api.post(`/sessions/${sessionId}/reschedule`, data)
};

// Psychologist related API calls
const profile = {
  get: () => api.get('/psychologists/profile'),
  update: (data) => api.put('/psychologists/profile', data),
  updateAvailability: (data) => api.put('/psychologists/availability', data)
};

// Student related API calls
const students = {
  getAll: () => api.get('/psychologists/students'),
  enroll: (data) => api.post('/psychologists/students/enroll', data),
  getOne: (id) => api.get(`/students/${id}`),
  update: (id, data) => api.put(`/students/${id}`, data)
};

// Admin related API calls
const admin = {
  getProfile: () => api.get('/admin/profile'),
  getUsers: () => api.get('/admin/users'),
  getPsychologists: () => api.get('/admin/psychologists'),
  updateUserStatus: (userId, data) => api.put('/admin/user-status', { userId, ...data }),
  updatePsychologistProfile: (psychologistId, data) => api.put(`/admin/psychologists/${psychologistId}`, data),
  enrollPsychologist: (data) => api.post('/admin/psychologists', data),
  updateAdminPermissions: (adminId, permissions) => api.put('/admin/admin-permissions', { adminId, permissions })
};

// Export all API functions
export default {
  ...api,
  sessions,
  profile,
  students,
  admin
};