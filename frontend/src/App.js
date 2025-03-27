import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './components/HomePage';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import PsychologistDashboard from './pages/PsychologistDashboard';
import StudentDashboard from './pages/StudentDashboard';
import Resources from './pages/Resources.js';
const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/SUST-mental-support" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/resources" element={<Resources />} />
        <Route path="/psychologist" element={<PsychologistDashboard />} />
        <Route path="/student-dashboard" element={<StudentDashboard />} />
      </Routes>
    </Router>
  );
};

export default App;
