// src/pages/StudentDashboard.js
import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import '../styles/studentDashboard.css';

const StudentDashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    studentProfile: {
      studentId: null,      // Student model ID
      userId: null,         // User model ID
      personalInfo: {},
      academicInfo: {},
      contactInfo: {},
      profilePicture: null,
      status: ''
    },
    createdBy: null,       // Psychologist data with both IDs
    pastSessions: [],
    upcomingSessions: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  // Fetch Dashboard Data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch dashboard info
        const dashboardResponse = await api.get('/students/dashboard-info');
        console.log('Dashboard Response:', dashboardResponse.data);
        
        setDashboardData(dashboardResponse.data);

        // Fetch messages if there's an assigned psychologist
        if (dashboardResponse.data.createdBy) {
          try {
            const messagesResponse = await api.get('/students/messages');
            setMessages(messagesResponse.data);
          } catch (messageError) {
            console.warn('Messages Fetch Error:', messageError);
            setMessages([]);
          }
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Dashboard Fetch Error:', error);
        setError({
          message: error.response?.data?.message || 'An unexpected error occurred',
          status: error.response?.status || 500
        });
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Handle profile picture upload
  const handleProfilePictureUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('profilePicture', file);

    try {
      const response = await api.post('/students/profile-picture', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setDashboardData(prev => ({
        ...prev,
        studentProfile: {
          ...prev.studentProfile,
          profilePicture: response.data.profilePicture
        }
      }));
    } catch (error) {
      console.error('Profile Picture Upload Error:', error);
    }
  };

  // Send Message Handler
  const sendMessage = async () => {
    if (!newMessage.trim() || !dashboardData.createdBy) return;

    try {
      await api.post('/students/messages', {
        message: newMessage.trim(),
        recipientId: dashboardData.createdBy.psychologistId // Use psychologist model ID
      });
      
      // Refresh messages
      const messagesResponse = await api.get('/students/messages');
      setMessages(messagesResponse.data);
      
      setNewMessage('');
    } catch (error) {
      console.error('Message Send Error:', error);
    }
  };

  if (isLoading) {
    return <div className="loading-container"><div className="loading-spinner"></div></div>;
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>Dashboard Loading Error</h2>
        <p>Status: {error.status}</p>
        <p>Message: {error.message}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  const { studentProfile, createdBy, upcomingSessions, pastSessions } = dashboardData;

  return (
    <div className="student-dashboard">
      {/* Profile Section */}
      <div className="dashboard-section profile-section">
        <div className="profile-container">
          <div className="profile-image-section">
            <div className="profile-image">
              {studentProfile?.profilePicture ? (
                <img 
                  src={studentProfile.profilePicture} 
                  alt="Profile"
                  className="passport-photo"
                />
              ) : (
                <div className="profile-placeholder">
                  <i className="fas fa-user"></i>
                </div>
              )}
            </div>
            <div className="profile-picture-upload">
              <input 
                type="file" 
                accept="image/*"
                onChange={handleProfilePictureUpload}
                id="profile-upload"
                className="hidden-input"
              />
              <label htmlFor="profile-upload" className="upload-button">
                Update Photo
              </label>
            </div>
          </div>

          <div className="profile-details">
            <div className="profile-header">
              <h2>{studentProfile?.personalInfo?.name}</h2>
              <p className="student-id">
                ID: {studentProfile?.academicInfo?.registrationNumber}
              </p>
            </div>

            <div className="info-sections">
              <div className="info-group">
                <h3>Personal Information</h3>
                <p><strong>Gender:</strong> {studentProfile?.personalInfo?.gender}</p>
                <p><strong>Date of Birth:</strong> {new Date(studentProfile?.personalInfo?.dateOfBirth).toLocaleDateString()}</p>
              </div>

              <div className="info-group">
                <h3>Academic Information</h3>
                <p><strong>Department:</strong> {studentProfile?.academicInfo?.department}</p>
                <p><strong>Session:</strong> {studentProfile?.academicInfo?.session}</p>
                <p><strong>Current Year:</strong> {studentProfile?.academicInfo?.currentYear}</p>
              </div>

              <div className="info-group">
                <h3>Contact Information</h3>
                <p><strong>Email:</strong> {studentProfile?.contactInfo?.email}</p>
                <p><strong>Phone:</strong> {studentProfile?.contactInfo?.phoneNumber}</p>
                <p><strong>Address:</strong> {studentProfile?.contactInfo?.address}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Assigned Psychologist Section */}
      <div className="dashboard-section psychologist-section">
        <h2 className="section-title">My Psychologist</h2>
        {createdBy ? (
          <div className="psychologist-details">
            <h3>{createdBy.name}</h3>
            <div className="psychologist-info">
              <div className="info-group">
                <p><strong>Specialization:</strong> {createdBy.specialization}</p>
                <p><strong>Email:</strong> {createdBy.email}</p>
                <p><strong>Phone:</strong> {createdBy.phoneNumber}</p>
                {createdBy.officeLocation && (
                  <p><strong>Office:</strong> {createdBy.officeLocation}</p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="no-psychologist-warning">
            <p>No psychologist has been assigned yet.</p>
            <p>Please contact the university counseling center.</p>
          </div>
        )}
      </div>

      {/* Sessions Section */}
      <div className="dashboard-section sessions-section">
        <h2 className="section-title">Upcoming Sessions</h2>
        <div className="sessions-container">
          {upcomingSessions.length > 0 ? (
            upcomingSessions.map((session) => (
              <div key={session.sessionId} className="session-card">
                <div className="session-header">
                  <h3>Session with {session.psychologist.name}</h3>
                  <span className={`status-badge ${session.status}`}>
                    {session.status}
                  </span>
                </div>
                <div className="session-details">
                  <p><strong>Date:</strong> {new Date(session.sessionDetails.date).toLocaleDateString()}</p>
                  <p><strong>Time:</strong> {session.sessionDetails.startTime} - {session.sessionDetails.endTime}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="no-sessions">No upcoming sessions scheduled</p>
          )}
        </div>

        <h2 className="section-title">Past Sessions</h2>
        <div className="sessions-container">
          {pastSessions.length > 0 ? (
            pastSessions.map((session) => (
              <div key={session.sessionId} className="session-card past">
                <div className="session-header">
                  <h3>Session with {session.psychologist.name}</h3>
                  <span className={`status-badge ${session.status}`}>
                    {session.status}
                  </span>
                </div>
                <div className="session-details">
                  <p><strong>Date:</strong> {new Date(session.sessionDetails.date).toLocaleDateString()}</p>
                  <p><strong>Time:</strong> {session.sessionDetails.startTime} - {session.sessionDetails.endTime}</p>
                  {session.notes && (
                    <p><strong>Notes:</strong> {session.notes}</p>
                  )}
                  {session.feedback && (
                    <div className="session-feedback">
                      <p><strong>Rating:</strong> {session.feedback.rating}/5</p>
                      {session.feedback.comments && (
                        <p><strong>Comments:</strong> {session.feedback.comments}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="no-sessions">No past sessions</p>
          )}
        </div>
      </div>

      {/* Messaging Section */}
      {createdBy && (
        <div className="dashboard-section messaging-section">
          <h2 className="section-title">Messages</h2>
          <div className="messaging-container">
            <div className="message-list">
              {messages.length > 0 ? (
                messages.map((message, index) => (
                  <div 
                    key={index} 
                    className={`message ${
                      message.senderId === studentProfile.userId ? 'sent' : 'received'
                    }`}
                  >
                    {message.content}
                    <span className="message-time">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))
              ) : (
                <p>No messages yet</p>
              )}
            </div>
            <div className="message-input">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message"
              />
              <button 
                onClick={sendMessage}
                disabled={!newMessage.trim()}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;