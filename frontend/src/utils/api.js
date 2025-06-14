import axios from "axios"

// Set the base URL for your API
const baseURL = process.env.REACT_APP_API_URL || "http://localhost:5000/api"

// Create axios instance with default config
const apiClient = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
})

// Add request interceptor to include auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem("token")
      localStorage.removeItem("userInfo")
      window.location.href = "/login"
    }
    return Promise.reject(error)
  },
)

// Base API methods
const api = {
  get: async (url, config = {}) => {
    try {
      const response = await apiClient.get(url, config)
      return response
    } catch (error) {
      console.error(`GET request failed for ${url}:`, error)
      throw error
    }
  },

  post: async (url, data = {}, config = {}) => {
    try {
      const response = await apiClient.post(url, data, config)
      return response
    } catch (error) {
      console.error(`POST request failed for ${url}:`, error)
      throw error
    }
  },

  put: async (url, data = {}, config = {}) => {
    try {
      const response = await apiClient.put(url, data, config)
      return response
    } catch (error) {
      console.error(`PUT request failed for ${url}:`, error)
      throw error
    }
  },

  delete: async (url, config = {}) => {
    try {
      const response = await apiClient.delete(url, config)
      return response
    } catch (error) {
      console.error(`DELETE request failed for ${url}:`, error)
      throw error
    }
  },

  // Authentication APIs
  auth: {
    login: (credentials) => api.post("/users/login", credentials),
    register: (userData) => api.post("/users/register", userData),
    logout: () => {
      localStorage.removeItem("token")
      localStorage.removeItem("userInfo")
      return Promise.resolve()
    },
    getCurrentUser: () => api.get("/users/profile"),
    changePassword: (passwordData) => api.put("/users/change-password", passwordData),
  },

  // Admin APIs
  admin: {
    // Profile and Authentication
    getProfile: () => api.get("/admin/profile"),
    login: (credentials) => api.post("/admin/login", credentials),
    createInitialAdmin: (adminData) => api.post("/admin/initial-setup", adminData),
    createAdmin: (adminData) => api.post("/admin/create-admin", adminData),
    changePassword: (passwordData) => api.put("/admin/change-password", passwordData),

    // User Management
    getUsers: () => api.get("/admin/users"),
    updateUserStatus: (userId, statusData) => api.put("/admin/user-status", { userId, ...statusData }),
    updateAdminPermissions: (adminId, permissions) => api.put("/admin/admin-permissions", { adminId, permissions }),

    // Psychologist Management
    getPsychologists: () => api.get("/admin/psychologists"),
    enrollPsychologist: (psychologistData) => api.post("/admin/psychologists", psychologistData),
    updatePsychologistProfile: (psychologistId, updateData) =>
      api.put(`/admin/psychologists/${psychologistId}`, updateData),
    deletePsychologist: (psychologistId) => api.delete(`/admin/psychologists/${psychologistId}`),

    // Email Management
    getUserEmails: (roles) => api.get(`/admin/emails${roles ? `?roles=${roles}` : ""}`),
    sendBulkEmail: (emailData) => api.post("/admin/send-bulk-email", emailData),
    sendPersonalizedEmails: (emailData) => api.post("/admin/send-personalized-emails", emailData),
    getEmailTemplates: () => api.get("/admin/email-templates"),
  },

  // Student APIs
  students: {
    getProfile: () => api.get("/students/profile"),
    updateProfile: (profileData) => api.put("/students/profile", profileData),
    getSessions: () => api.get("/students/sessions"),
    bookSession: (sessionData) => api.post("/students/sessions", sessionData),
    cancelSession: (sessionId) => api.put(`/students/sessions/${sessionId}/cancel`),
    getSeminars: () => api.get("/students/seminars"),
    registerForSeminar: (seminarId) => api.post(`/students/seminars/${seminarId}/register`),
    getAssignedPsychologist: () => api.get("/students/psychologist"),
  },

  // Psychologist APIs
  psychologists: {
    getProfile: () => api.get("/psychologists/profile"),
    updateProfile: (profileData) => api.put("/psychologists/profile", profileData),
    getSchedule: () => api.get("/psychologists/schedule"),
    updateSchedule: (scheduleData) => api.put("/psychologists/schedule", scheduleData),
    getSessions: () => api.get("/psychologists/sessions"),
    updateSession: (sessionId, sessionData) => api.put(`/psychologists/sessions/${sessionId}`, sessionData),
    getStudents: () => api.get("/psychologists/students"),
    addSessionNotes: (sessionId, notes) => api.put(`/psychologists/sessions/${sessionId}/notes`, { notes }),
    getAvailableSlots: (date) => api.get(`/psychologists/available-slots?date=${date}`),
  },

  // Session APIs
  sessions: {
    getAll: () => api.get("/sessions"),
    getById: (sessionId) => api.get(`/sessions/${sessionId}`),
    create: (sessionData) => api.post("/sessions", sessionData),
    update: (sessionId, sessionData) => api.put(`/sessions/${sessionId}`, sessionData),
    delete: (sessionId) => api.delete(`/sessions/${sessionId}`),
    addFeedback: (sessionId, feedback) => api.post(`/sessions/${sessionId}/feedback`, feedback),
  },

  // Seminar APIs
  seminars: {
    getAll: () => api.get("/seminars"),
    getById: (seminarId) => api.get(`/seminars/${seminarId}`),
    create: (seminarData) => api.post("/seminars", seminarData),
    update: (seminarId, seminarData) => api.put(`/seminars/${seminarId}`, seminarData),
    delete: (seminarId) => api.delete(`/seminars/${seminarId}`),
    register: (seminarId) => api.post(`/seminars/${seminarId}/register`),
    unregister: (seminarId) => api.delete(`/seminars/${seminarId}/register`),
  },

  // Message APIs (for chat functionality)
  messages: {
    getConversation: (userId) => api.get(`/messages/conversation/${userId}`),
    sendMessage: (messageData) => api.post("/messages", messageData),
    markAsRead: (messageId) => api.put(`/messages/${messageId}/read`),
    getUnreadCount: () => api.get("/messages/unread-count"),
  },

  // AI Chat APIs
  ai: {
    sendMessage: (messageData) => api.post("/ai/chat", messageData),
    getChatHistory: () => api.get("/ai/chat-history"),
    clearChatHistory: () => api.delete("/ai/chat-history"),
  },
}

export default api
