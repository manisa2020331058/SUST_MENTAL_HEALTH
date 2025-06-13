import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './components/HomePage';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import PsychologistDashboard from './pages/PsychologistDashboard';
import StudentDashboard from './pages/StudentDashboard';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Resources from './pages/Resources.js';
import { ChatProvider } from './contexts/ChatContext';
import StudentProfile from './pages/StudentProfile.jsx';
const App = () => {
  return (
    <Router>
      <ChatProvider>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/resources" element={<Resources />} />
        <Route path="/psychologist" element={<PsychologistDashboard />} />
        <Route path="/student-dashboard" element={<StudentDashboard />} />
        <Route path="/psychologist/viewstudent/:studentId" element={<StudentProfile />} />
      </Routes>
      <ToastContainer 
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      </ChatProvider>
    </Router>
  );
};

export default App;
