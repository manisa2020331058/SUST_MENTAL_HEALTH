// src/pages/StudentDashboard.js

import React, { useState, useEffect, useRef } from 'react';
import { 
  FaCommentDots, 
  FaPaperPlane, 
  FaTimes, 
  FaEdit,
  FaCalendarPlus
} from 'react-icons/fa';
import api from '../utils/api';
import '../styles/studentDashboard.css';
import { toast } from 'react-toastify';
import { useChat } from '../contexts/ChatContext';

const StudentDashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    studentProfile: {
      studentId: null,
      userId: null,
      personalInfo: {},
      academicInfo: {},
      contactInfo: {},
      status: ''
    },
    createdBy: null,
    pastSessions: [],
    upcomingSessions: []
  });
  const [sessionNotifications, setSessionNotifications] = useState([]);
const [showNotification, setShowNotification] = useState(false);


  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasPsychologist, setHasPsychologist] = useState(false);
const [messages, setMessages] = useState([]);
const [newMessage, setNewMessage] = useState('');
const [isChatOpen, setIsChatOpen] = useState(false);
  const messagesEndRef = useRef(null);
  const { socket, messages: chatMessages, sendMessage: socketSendMessage } = useChat();


 

    const addToGoogleCalendar = (session) => {
    // Get session details
    const title = `Counseling Session with ${session.psychologist?.name || 'Psychologist'}`;
    const startDate = new Date(session.sessionDetails?.date || session.date);
    const [startHours, startMinutes] = (session.sessionDetails?.startTime || session.time).split(':');
    startDate.setHours(parseInt(startHours), parseInt(startMinutes));
    
    // Create end date (default to 1 hour later if no duration specified)
    const endDate = new Date(startDate);
    endDate.setMinutes(endDate.getMinutes() + (session.duration || 60));
    
    // Format dates for Google Calendar URL
    const formatDate = (date) => {
      return date.toISOString().replace(/-|:|\.\d+/g, '');
    };
    
    // Create Google Calendar URL
    const googleCalendarUrl = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${formatDate(startDate)}/${formatDate(endDate)}&details=${encodeURIComponent('Counseling session appointment')}&location=${encodeURIComponent(session.location || 'University Counseling Center')}`;
    
    // Open the Google Calendar link in a new tab
    window.open(googleCalendarUrl, '_blank');
  };
 // Handle profile picture upload
 const handleProfilePictureUpdate = async (event) => {
  const file = event.target.files[0];

  if (!file) {
    toast.error('No file selected');
    return;
  }

  try {
    const base64Image = await convertFileToBase64(file);
    
    // Send the image inside personalInfo
    await api.post('/students/profile-picture', { 
      personalInfo: { profileImage: base64Image } 
    });

    // Fetch updated dashboard data
    const updatedDashboardResponse = await api.get('/students/dashboard-info');
    setDashboardData(updatedDashboardResponse.data);

    toast.success('Profile picture updated successfully');
  } catch (error) {
    console.error('Profile Picture Upload Error:', error);
    toast.error(error.response?.data?.error || 'Failed to upload profile picture');
  }
};


    // Remove Profile Picture Handler
    const handleRemoveProfilePicture = async () => {
      try {
        await api.delete('/students/profile-picture');
    
        // Fetch updated dashboard data
        const updatedDashboardResponse = await api.get('/students/dashboard-info');
        setDashboardData(updatedDashboardResponse.data);
    
        toast.success('Profile picture removed successfully');
      } catch (error) {
        console.error('Profile Picture Remove Error:', error);
        toast.error(error.response?.data?.error || 'Failed to remove profile picture');
      }
    };
    
  // Fetch Dashboard Data
 
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        const dashboardResponse = await api.get('/students/dashboard-info');
     
        if (dashboardResponse.data.studentProfile.personalInfo.profileImage) {
          const profileImage = dashboardResponse.data.studentProfile.personalInfo.profileImage;
          dashboardResponse.data.studentProfile.personalInfo.profileImage = 
            `http://localhost:5000/${profileImage.replace(/^\/+/, '')}`;
        }

        setDashboardData(dashboardResponse.data);
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
  

   // Scroll to bottom of messages
   useEffect(() => {
    if (socket) {
      socket.on('message', (message) => {
        setMessages(prev => [...prev, message]);
        // Scroll to bottom on new message
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
      });

      return () => {
        socket.off('message');
      };
    }
  }, [socket]);

  // Initial messages fetch
  useEffect(() => {
    const fetchMessages = async () => {
      if (dashboardData.createdBy) {
        try {
          const response = await api.messages.getMessages(dashboardData.createdBy._id);
          setMessages(response.data);
          setHasPsychologist(true);
        } catch (error) {
          console.error('Error fetching messages:', error);
        }
      }
    };

    fetchMessages();
  }, [dashboardData.createdBy]);
  
  useEffect(() => {
  if ('Notification' in window) {
    Notification.requestPermission();
  }
}, []);

// Function to show browser notification
const showBrowserNotification = (title, body) => {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, {
      body: body,
      icon: '/logo.png'  // Add a path to your logo
    });
  }
};

  useEffect(() => {
  const fetchNotifications = async () => {
    try {
      const response = await api.get('/students/session-notifications');
      setSessionNotifications(response.data.notifications);
      
      // Show notification if there are upcoming sessions
      if (response.data.notifications.length > 0) {
        setShowNotification(true);
        
        // Check for sessions that are about to start soon (within 30 minutes)
        const soonSessions = response.data.notifications.filter(
          notification => notification.timeUntil.hours === 0 && notification.timeUntil.minutes <= 30
        );
        
        // Show browser notification for soon sessions
        soonSessions.forEach(session => {
          showBrowserNotification(
            'Session Starting Soon',
            `Your session with ${session.psychologistName} starts in ${session.timeUntil.text}.`
          );
        });
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };
  
  fetchNotifications();
  
  // Set up periodic checks for notifications
  const notificationInterval = setInterval(fetchNotifications, 5 * 60 * 1000); // Check every 5 minutes
  
  return () => clearInterval(notificationInterval);
}, []);


// Utility function to convert file to base64
const convertFileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
};


const SessionNotificationBanner = () => {
  if (!showNotification || sessionNotifications.length === 0) return null;
  
  return (
    <div className="session-notification-banner">
      <div className="notification-content">
        <h3>Upcoming Session Reminder</h3>
        <p>You have {sessionNotifications.length} upcoming session(s) in the next 24 hours</p>
        {sessionNotifications.map((notification, index) => (
          <div key={index} className="notification-item">
            <p><strong>{notification.title}</strong></p>
            <p>Date: {notification.date} at {notification.time}</p>
            <p>Time remaining: {notification.timeUntil.text}</p>
          </div>
        ))}
      </div>
      <button 
        className="close-notification"
        onClick={() => setShowNotification(false)}
      >
        <FaTimes />
      </button>
    </div>
  );
};


// Update the sendMessage function to use Socket.IO
const handleSendMessage = () => {
  if (!newMessage.trim() || !dashboardData.createdBy) return;

  try {
    // Get the psychologist's user ID from dashboardData
    const recipientId = dashboardData.createdBy.userId; // Make sure this matches your data structure
    
    if (!recipientId) {
      console.error('No recipient ID found');
      toast.error('Unable to send message: No recipient found');
      return;
    }

    socketSendMessage(recipientId, newMessage.trim());
    setNewMessage('');
  } catch (error) {
    console.error('Message Send Error:', error);
    toast.error('Failed to send message');
  }
};


const handleOpenChat = async () => {
  setIsChatOpen(true);
  if (dashboardData.createdBy) {
    try {
      await api.messages.markAsRead(dashboardData.createdBy._id);
      // Refresh messages
      const response = await api.messages.getMessages(dashboardData.createdBy._id);
      setMessages(response.data);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
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
        <SessionNotificationBanner />
      {/* Profile Section */}
      <div className="dashboard-section profile-section">
        <div className="profile-container">
          {/* Profile Picture Upload */}
          <div className="profile-picture-upload">
  <label className="profile-picture-label">Profile Picture</label>

  {/* Profile Picture Preview */}
  {dashboardData.studentProfile.personalInfo.profileImage ? (
    <div className="profile-picture-preview">
      <img 
        src={dashboardData.studentProfile.personalInfo.profileImage} 
        alt="Profile" 
        className="preview-image"
      />
      <div className="profile-picture-actions">
        {/* Edit Profile Picture */}
        <label 
          htmlFor="profilePictureUpload" 
          className="edit-profile-picture"
        >
          <FaEdit />
        </label>

        {/* Remove Profile Picture */}
        <button 
          onClick={handleRemoveProfilePicture}
          className="remove-profile-picture"
        >
          <FaTimes />
        </button>
      </div>
    </div>
  ) : (
    <button onClick={() => document.getElementById('profilePictureUpload').click()} className="upload-placeholder">
      <div className="upload-icon">+</div>
      Upload Profile Picture
    </button>
  )}

  {/* Hidden File Input */}
  <input 
    type="file" 
    accept="image/*"
    className="profile-picture-input"
    id="profilePictureUpload"
    onChange={handleProfilePictureUpdate} 
    style={{ display: 'none' }} // Hide input field
  />
</div>

  
          {/* Profile Details */}
          <div className="profile-details">
            <h2>{dashboardData.studentProfile.personalInfo.name}</h2>
            <div className="profile-info-grid">
              <div className="info-group">
                <h3>Personal Information</h3>
                <p><strong>Gender:</strong> {dashboardData.studentProfile.personalInfo.gender}</p>
                <p><strong>Date of Birth:</strong> {new Date(dashboardData.studentProfile.personalInfo.dateOfBirth).toLocaleDateString()}</p>
              </div>
  
              <div className="info-group">
                <h3>Academic Information</h3>
                <p><strong>Department:</strong> {dashboardData.studentProfile.academicInfo.department}</p>
                <p><strong>Registration:</strong> {dashboardData.studentProfile.academicInfo.registrationNumber}</p>
                <p><strong>Current Year:</strong> {dashboardData.studentProfile.academicInfo.currentYear}</p>
              </div>
  
              <div className="info-group">
                <h3>Contact Information</h3>
                <p><strong>Email:</strong> {dashboardData.studentProfile.contactInfo.email}</p>
                <p><strong>Phone:</strong> {dashboardData.studentProfile.contactInfo.phoneNumber}</p>
                <p><strong>Address:</strong> {dashboardData.studentProfile.contactInfo.address}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
        
        {/* Chat Widget */}
    {dashboardData.createdBy && (
      <div className="chat-widget">
        <div 
          className="chat-trigger"
          onClick={() => setIsChatOpen(!isChatOpen)}
        >
          <FaCommentDots />
          {!isChatOpen && messages.filter(m => !m.read).length > 0 && (
            <span className="chat-notification-badge">
              {messages.filter(m => !m.read).length}
            </span>
          )}
        </div>

        {isChatOpen && (
          <div className="chat-modal">
            <div className="chat-header">
              <h3>
                Chat with {dashboardData.createdBy?.name || 'Psychologist'}
              </h3>
              <button 
                className="close-chat"
                onClick={() => setIsChatOpen(false)}
              >
                <FaTimes />
              </button>
            </div>

            <div className="chat-messages">
              {messages.map((msg, index) => (
                <div 
                  key={msg._id || index} 
                  className={`message ${
                    msg.sender === dashboardData.studentProfile.userId 
                      ? 'sent' 
                      : 'received'
                  }`}
                >
                  <div className="message-content">{msg.content}</div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="chat-input">
              <textarea 
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />
              <button 
                onClick={handleSendMessage}
                disabled={!newMessage.trim()}
              >
                <FaPaperPlane />
              </button>
            </div>
          </div>
        )}
      </div>
    )}
       
       {/* Psychologist Section */}
       <div className="dashboard-section psychologist-section">
        <h2>My Psychologist</h2>
        {dashboardData.createdBy ? (
          <div className="psychologist-details">
            <div className="psychologist-info">
              <p><strong>Name:</strong> {dashboardData.createdBy.name}</p>
              <p><strong>Specialization:</strong> {dashboardData.createdBy.specialization}</p>
              <p><strong>Contact:</strong> {dashboardData.createdBy.email}</p>
            </div>
          </div>
        ) : (
          <p>No psychologist has been assigned yet.</p>
        )}
      </div>
  
      {/* Sessions Section */}
      {/* Inside your render method, find the upcoming sessions section */}
<div className="dashboard-section upcoming-sessions-section">
  <h2>Upcoming Sessions</h2>
  {dashboardData.upcomingSessions && dashboardData.upcomingSessions.length > 0 ? (
    <div className="sessions-grid">
      {dashboardData.upcomingSessions.map((session) => (
        <div key={session.sessionId} className="session-card">
          <div className="session-header">
            <h3>{session.psychologist?.name || 'Unknown Psychologist'}</h3>
            <span className={`status-badge ${session.status || 'scheduled'}`}>
              {session.status || 'Scheduled'}
            </span>
          </div>
          
          <div className="session-details">
            <p>
              <strong>Date:</strong> {session.sessionDetails?.date 
                ? new Date(session.sessionDetails.date).toLocaleDateString() 
                : session.date 
                  ? new Date(session.date).toLocaleDateString()
                  : 'Not specified'}
            </p>
            <p>
              <strong>Time:</strong> {session.sessionDetails?.startTime || session.time || 'Not specified'}
              {(session.sessionDetails?.endTime || session.endTime) && 
                ` - ${session.sessionDetails?.endTime || session.endTime}`}
            </p>
            {/* Add other session details as needed */}
          </div>
          
          {/* Add the action buttons here */}
          <div className="session-actions">
            <button 
              className="session-action-btn"
              onClick={() => addToGoogleCalendar(session)}
            >
              <FaCalendarPlus /> Add to Calendar
            </button>
            {/* You can add other action buttons here if needed */}
          </div>
        </div>
      ))}
    </div>
  ) : (
    <p>No upcoming sessions scheduled.</p>
  )}
</div>
      
      <div className="dashboard-section past-sessions-section">
  <h2>Past Sessions</h2>
  {dashboardData.pastSessions && dashboardData.pastSessions.length > 0 ? (
    <div className="sessions-grid">
      {dashboardData.pastSessions.map((session, index) => (
        <div key={session.sessionId || index} className="session-card">
          <div className="session-header">
            <h3>{session.psychologist?.name || 'Unknown Psychologist'}</h3>
            <span className={`status-badge ${session.status || 'unknown'}`}>
              {session.status || 'Unknown'}
            </span>
          </div>
          <div className="session-details">
            {session.sessionDetails?.date && (
              <p>
                <strong>Date:</strong> {new Date(session.sessionDetails.date).toLocaleDateString()}
              </p>
            )}
            {session.sessionDetails?.startTime && (
              <p>
                <strong>Time:</strong> {session.sessionDetails.startTime} 
                {session.sessionDetails.endTime && ` - ${session.sessionDetails.endTime}`}
              </p>
            )}
            {session.sessionDetails?.type && (
              <p><strong>Type:</strong> {session.sessionDetails.type}</p>
            )}
            {session.notes && (
              <div className="session-notes">
                <strong>Notes:</strong>
                <p>{session.notes}</p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  ) : (
    <p>No past sessions found.</p>
  )}
</div>

    </div>
  );
};  
export default StudentDashboard;