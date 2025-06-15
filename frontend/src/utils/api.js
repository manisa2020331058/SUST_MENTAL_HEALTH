import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api',
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
  getPastOfAStudent: (studentId) => api.get(`/sessions/psychologist/pastOfAStudent/${studentId}`),
  getUpcomingOfAStudent: (studentId) => api.get(`/sessions/psychologist/upcomingOfAStudent/${studentId}`),
  getAll: (filters) => api.get('/sessions/psychologist/all', { params: filters }),
  getByStudent: (studentId) => api.get(`/sessions/student/${studentId}`),
  getSingle: (sessionId) => api.get(`/sessions/${sessionId}`),
  updateStatus: (sessionId, status) => api.patch(`/sessions/${sessionId}/status`, { status }),
  addNotes: (sessionId, notes) => api.patch(`/sessions/${sessionId}/notes`, { notes }),
  cancel: (sessionId, reason) => api.post(`/sessions/${sessionId}/cancel`, { reason }),
  reschedule: (sessionId, data) => api.post(`/sessions/${sessionId}/reschedule`, data),
  // New methods
  getAvailableSlots: (date, psychologistId) => api.get('/sessions/available-slots', { 
    params: { date, psychologistId } 
  }),
  getCalendar: (startDate, endDate) => api.get('/sessions/psychologist/calendar', { 
    params: { startDate, endDate } 
  })
};

const seminars ={
  getAll: () => api.get('/seminars/'),
  create: (seminarData) => api.post('/seminars/', seminarData),
  delete: (id) => api.delete(`/seminars/${id}`),
}

// Psychologist related API calls
const profile = {
  get: () => api.get('/psychologists/profile'),
  update: (data) => api.put('/psychologists/profile', data),
  updateAvailability: (data) => api.put('/psychologists/availability', data)
};

// Psychologist student related API calls
const psychologists = {
  getByEmail: (email) => api.get(`/psychologists/email/${email}`),
  getStudents: (psychologistId) => api.get(`/psychologists/getStudents/${psychologistId}`),
  getSessions: (psychologistId) => api.get(`/psychologists/getSessions/${psychologistId}`),
  getStudentInfo: (studentId) => api.get(`/psychologists/getStudentInfo/${studentId}`),
  getStudentProfile: (studentId) => api.get(`/psychologists/${studentId}/profile`),
};

// Student related API calls
const students = {
  getAll: () => api.get('/psychologists/students'),
  enroll: (data) => api.post('/psychologists/students/enroll', data),
  getOne: (id) => api.get(`/students/${id}`),
  update: (id, data) => api.put(`/students/${id}`, data),
};

// Admin related API calls
const admin = {
  getProfile: () => api.get('/admin/profile'),
  getUsers: () => api.get('/admin/users'),
  getPsychologists: () => api.get('/admin/psychologists'),
  updateUserStatus: (userId, data) => api.put('/admin/user-status', { userId, ...data }),
  updatePsychologistProfile: (psychologistId, data) => api.put(`/admin/psychologists/${psychologistId}`, data),
  enrollPsychologist: (enrollmentData) => {
    // Convert file to base64 if exists
    const processedData = {
      ...enrollmentData,
      profilePicture: enrollmentData.profilePicture 
        ? {
            filename: enrollmentData.profilePicture.name,
            content: enrollmentData.profilePicture ? URL.createObjectURL(enrollmentData.profilePicture) : null
          }
        : null
    };
  
    return api.post('/admin/psychologists', processedData);
  },
  
  updateAdminPermissions: (adminId, permissions) => api.put('/admin/admin-permissions', { adminId, permissions })
};


const messages = {
  // now points at GET /messages/psychologist/all
  getAllMessages: () => api.get('/messages/psychologist/all'),

  // GET /messages/:studentId
  getMessagesWithStudent: (studentId) =>
    api.get(`/messages/${studentId}`),

  // alias for above (if you like):
  getMessages: (recipientId) =>
    api.get(`/messages/${recipientId}`),

  // POST /messages
  sendMessage: (data) =>
    api.post('/messages', data),

  // PUT /messages/read/:senderId
  markAsRead: (senderId) =>
    api.put(`/messages/read/${senderId}`)
}
// Export all API functions
export default {
  ...api,
  sessions,
  seminars,
  profile,
  students,
  admin,
  messages,
  psychologists
};