// src/pages/SessionManagement.jsx
import React, { useState, useEffect } from 'react';
import { 
  FaCalendar, 
  FaClock, 
  FaUser, 
  FaCheckCircle, 
  FaTimesCircle, 
  FaPencilAlt, 
  FaPlus,
  FaAngleDown,
  FaAngleUp,
  FaHistory,
  FaNotesMedical
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import api from '../utils/api';
import '../styles/PsychologistProfile.css';

const SessionsManagement = () => {
  // States
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [pastSessions, setPastSessions] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showNewSessionForm, setShowNewSessionForm] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [isAddingNotes, setIsAddingNotes] = useState(false);
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
  const [expandedSessions, setExpandedSessions] = useState({});

  // New session form state
  const [newSession, setNewSession] = useState({
    studentId: '',
    date: '',
    time: '',
    type: 'individual',
    description: '',
    duration: 60
  });

  // Notes form state
  const [sessionNotes, setSessionNotes] = useState('');

  // Reschedule form state
  const [rescheduleData, setRescheduleData] = useState({
    date: '',
    time: ''
  });

  // Fetch all required data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [upcomingRes, pastRes, studentsRes] = await Promise.all([
          api.sessions.getUpcoming(),
          api.sessions.getPast(),
          api.students.getAll()
        ]);
        
        setUpcomingSessions(upcomingRes.data);
        setPastSessions(pastRes.data);
        setStudents(studentsRes.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load sessions data. Please try again later.');
        toast.error('Failed to load sessions data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Fetch available time slots when date changes
  useEffect(() => {
    if (newSession.date) {
      fetchAvailableTimeSlots(newSession.date);
    }
  }, [newSession.date]);

  // Also fetch time slots for reschedule
  useEffect(() => {
    if (rescheduleData.date && isRescheduling) {
      fetchAvailableTimeSlots(rescheduleData.date);
    }
  }, [rescheduleData.date, isRescheduling]);

  const fetchAvailableTimeSlots = async (date) => {
    try {
      setLoading(true);
      const response = await api.sessions.getAvailableSlots(date);
      setAvailableTimeSlots(response.data.availableSlots || []);
    } catch (error) {
      console.error('Error fetching time slots:', error);
      toast.error('Could not load available time slots');
      setAvailableTimeSlots([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleSessionExpand = (sessionId) => {
    setExpandedSessions(prev => ({
      ...prev,
      [sessionId]: !prev[sessionId]
    }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewSession(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRescheduleChange = (e) => {
    const { name, value } = e.target;
    setRescheduleData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCreateSession = async (e) => {
    e.preventDefault();
    
    if (!newSession.studentId || !newSession.date || !newSession.time) {
      toast.error('Please fill all required fields');
      return;
    }
    
    try {
      setLoading(true);
      await api.sessions.create(newSession);
      toast.success('Session scheduled successfully!');
      
      // Refresh upcoming sessions
      const upcomingRes = await api.sessions.getUpcoming();
      setUpcomingSessions(upcomingRes.data);
      
      // Reset form and close it
      setNewSession({
        studentId: '',
        date: '',
        time: '',
        type: 'individual',
        description: '',
        duration: 60
      });
      setShowNewSessionForm(false);
    } catch (error) {
      console.error('Error creating session:', error);
      toast.error(error.response?.data?.message || 'Failed to schedule session');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (sessionId, status) => {
    try {
      setLoading(true);
      await api.sessions.updateStatus(sessionId, status);
      
      // Refresh sessions lists
      const [upcomingRes, pastRes] = await Promise.all([
        api.sessions.getUpcoming(),
        api.sessions.getPast()
      ]);
      
      setUpcomingSessions(upcomingRes.data);
      setPastSessions(pastRes.data);
      
      toast.success(`Session marked as ${status}`);
    } catch (error) {
      console.error('Error updating session:', error);
      toast.error('Failed to update session status');
    } finally {
      setLoading(false);
    }
  };

  const handleAddNotes = async (e) => {
    e.preventDefault();
    
    if (!sessionNotes.trim()) {
      toast.error('Please enter session notes');
      return;
    }
    
    try {
      setLoading(true);
      await api.sessions.addNotes(selectedSession._id, { notes: sessionNotes });
      
      // Refresh sessions
      const [upcomingRes, pastRes] = await Promise.all([
        api.sessions.getUpcoming(),
        api.sessions.getPast()
      ]);
      
      setUpcomingSessions(upcomingRes.data);
      setPastSessions(pastRes.data);
      
      // Close notes modal
      setIsAddingNotes(false);
      setSelectedSession(null);
      setSessionNotes('');
      
      toast.success('Session notes added successfully');
    } catch (error) {
      console.error('Error adding notes:', error);
      toast.error('Failed to add session notes');
    } finally {
      setLoading(false);
    }
  };

  const handleRescheduleSession = async (e) => {
    e.preventDefault();
    
    if (!rescheduleData.date || !rescheduleData.time) {
      toast.error('Please select a new date and time');
      return;
    }
    
    try {
      setLoading(true);
      await api.sessions.reschedule(selectedSession._id, rescheduleData);
      
      // Refresh sessions
      const upcomingRes = await api.sessions.getUpcoming();
      setUpcomingSessions(upcomingRes.data);
      
      // Close reschedule modal
      setIsRescheduling(false);
      setSelectedSession(null);
      setRescheduleData({ date: '', time: '' });
      
      toast.success('Session rescheduled successfully');
    } catch (error) {
      console.error('Error rescheduling session:', error);
      toast.error(error.response?.data?.message || 'Failed to reschedule session');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSession = async (sessionId) => {
    if (!window.confirm('Are you sure you want to cancel this session?')) {
      return;
    }
    
    try {
      setLoading(true);
      await api.sessions.cancel(sessionId, { reason: 'Cancelled by psychologist' });
      
      // Refresh sessions
      const [upcomingRes, pastRes] = await Promise.all([
        api.sessions.getUpcoming(),
        api.sessions.getPast()
      ]);
      
      setUpcomingSessions(upcomingRes.data);
      setPastSessions(pastRes.data);
      
      toast.success('Session cancelled');
    } catch (error) {
      console.error('Error cancelling session:', error);
      toast.error('Failed to cancel session');
    } finally {
      setLoading(false);
    }
  };

  const openNotesModal = (session) => {
    setSelectedSession(session);
    setSessionNotes(session.notes || '');
    setIsAddingNotes(true);
  };

  const openRescheduleModal = (session) => {
    setSelectedSession(session);
    setRescheduleData({
      date: '',
      time: ''
    });
    setIsRescheduling(true);
  };

  if (loading && upcomingSessions.length === 0 && pastSessions.length === 0) {
    return <div className="loading-spinner">Loading sessions...</div>;
  }

  if (error) {
    return (
      <div className="error-container">
        <p className="error-message">{error}</p>
        <button 
          className="retry-button" 
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="sessions-container">
      {/* Header with button to create new session */}
      <div className="sessions-header">
        <h2>Session Management</h2>
        <button 
          className="new-session-btn"
          onClick={() => setShowNewSessionForm(true)}
        >
          <FaPlus /> Schedule New Session
        </button>
      </div>

      {/* New Session Form Modal */}
      {showNewSessionForm && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <h3>Schedule New Session</h3>
            <form onSubmit={handleCreateSession}>
              <div className="form-group">
                <label>Student</label>
                <select 
                  name="studentId" 
                  value={newSession.studentId}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select a student</option>
                  {students.map(student => (
                    <option key={student.studentId} value={student.studentId}>
                      {student.personalInfo?.name || 'Unknown'} - {student.academicInfo?.registrationNumber || 'No ID'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Session Type</label>
                <select 
                  name="type" 
                  value={newSession.type}
                  onChange={handleInputChange}
                  required
                >
                  <option value="individual">Individual</option>
                  <option value="group">Group</option>
                  <option value="emergency">Emergency</option>
                </select>
              </div>

              <div className="form-group">
                <label>Date</label>
                <input 
                  type="date" 
                  name="date"
                  value={newSession.date}
                  onChange={handleInputChange}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>

              {newSession.date && (
                <div className="form-group">
                  <label>Available Time Slots</label>
                  {availableTimeSlots.length > 0 ? (
                    <div className="time-slots-container">
                      {availableTimeSlots.map((slot, index) => (
                        <div 
                          key={index}
                          className={`time-slot ${newSession.time === slot.time ? 'selected' : ''}`}
                          onClick={() => setNewSession({...newSession, time: slot.time})}
                        >
                          {slot.time}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="no-slots-message">No available time slots for this date</p>
                  )}
                </div>
              )}

              <div className="form-group">
                <label>Duration (minutes)</label>
                <select 
                  name="duration" 
                  value={newSession.duration}
                  onChange={handleInputChange}
                >
                  <option value={30}>30 minutes</option>
                  <option value={60}>60 minutes</option>
                  <option value={90}>90 minutes</option>
                  <option value={120}>120 minutes</option>
                </select>
              </div>

              <div className="form-group">
                <label>Description (optional)</label>
                <textarea
                  name="description"
                  value={newSession.description}
                  onChange={handleInputChange}
                  rows="3"
                  placeholder="Enter session details..."
                ></textarea>
              </div>

              <div className="form-actions">
                <button 
                  type="button" 
                  onClick={() => setShowNewSessionForm(false)}
                  className="cancel-btn"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="submit-btn"
                  disabled={loading || !newSession.studentId || !newSession.date || !newSession.time}
                >
                  {loading ? 'Scheduling...' : 'Schedule Session'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Notes Modal */}
      {isAddingNotes && selectedSession && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <h3>Add Session Notes</h3>
            <p className="session-info">
              Session with {selectedSession.student?.personalInfo?.name || 'Student'} on {new Date(selectedSession.date).toLocaleDateString()} at {selectedSession.time}
            </p>
            
            <form onSubmit={handleAddNotes}>
              <div className="form-group">
                <label>Notes</label>
                <textarea
                  value={sessionNotes}
                  onChange={(e) => setSessionNotes(e.target.value)}
                  rows="5"
                  placeholder="Enter session notes..."
                  required
                ></textarea>
              </div>

              <div className="form-actions">
                <button 
                  type="button" 
                  onClick={() => {
                    setIsAddingNotes(false);
                    setSelectedSession(null);
                  }}
                  className="cancel-btn"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="submit-btn"
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save Notes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {isRescheduling && selectedSession && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <h3>Reschedule Session</h3>
            <p className="session-info">
              Session with {selectedSession.student?.personalInfo?.name || 'Student'} currently scheduled for {new Date(selectedSession.date).toLocaleDateString()} at {selectedSession.time}
            </p>
            
            <form onSubmit={handleRescheduleSession}>
              <div className="form-group">
                <label>New Date</label>
                <input 
                  type="date" 
                  name="date"
                  value={rescheduleData.date}
                  onChange={handleRescheduleChange}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>

              {rescheduleData.date && (
                <div className="form-group">
                  <label>New Time</label>
                  {availableTimeSlots.length > 0 ? (
                    <div className="time-slots-container">
                      {availableTimeSlots.map((slot, index) => (
                        <div 
                          key={index}
                          className={`time-slot ${rescheduleData.time === slot.time ? 'selected' : ''}`}
                          onClick={() => setRescheduleData({...rescheduleData, time: slot.time})}
                        >
                          {slot.time}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="no-slots-message">No available time slots for this date</p>
                  )}
                </div>
              )}

              <div className="form-actions">
                <button 
                  type="button" 
                  onClick={() => {
                    setIsRescheduling(false);
                    setSelectedSession(null);
                  }}
                  className="cancel-btn"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="submit-btn"
                  disabled={loading || !rescheduleData.date || !rescheduleData.time}
                >
                  {loading ? 'Rescheduling...' : 'Reschedule Session'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upcoming Sessions Section */}
      <div className="sessions-section">
        <h3>
          <FaCalendar /> Upcoming Sessions
          <span className="session-count">{upcomingSessions.length}</span>
        </h3>
        
        {upcomingSessions.length === 0 ? (
          <div className="no-sessions-message">
            <p>No upcoming sessions scheduled.</p>
            <button 
              className="schedule-btn"
              onClick={() => setShowNewSessionForm(true)}
            >
              <FaPlus /> Schedule a session
            </button>
          </div>
        ) : (
          <div className="sessions-grid">
            {upcomingSessions.map(session => (
              <div 
                key={session._id} 
                className={`session-card ${session.status}`}
              >
                <div 
                  className="session-header"
                  onClick={() => toggleSessionExpand(session._id)}
                >
                  <h4>
                    {session.student?.personalInfo?.name || 'Student'}
                    <span className="session-type">{session.type}</span>
                  </h4>
                  <div className="session-expand-icon">
                    {expandedSessions[session._id] ? <FaAngleUp /> : <FaAngleDown />}
                  </div>
                </div>

                <div className="session-meta">
                  <span className="session-date">
                    <FaCalendar /> {new Date(session.date).toLocaleDateString()}
                  </span>
                  <span className="session-time">
                    <FaClock /> {session.time}
                  </span>
                  <span className={`session-status ${session.status}`}>
                    {session.status}
                  </span>
                </div>

                <div className={`session-details ${expandedSessions[session._id] ? 'expanded' : ''}`}>
                  <div className="student-info">
                    <p><strong>Student ID:</strong> {session.student?.academicInfo?.registrationNumber || 'N/A'}</p>
                    <p><strong>Department:</strong> {session.student?.academicInfo?.department || 'N/A'}</p>
                    {session.student?.contactInfo?.email && (
                      <p><strong>Email:</strong> {session.student.contactInfo.email}</p>
                    )}
                  </div>

                  {session.description && (
                    <div className="session-description">
                      <h5>Description:</h5>
                      <p>{session.description}</p>
                    </div>
                  )}
                  
                  {session.notes && (
                    <div className="session-notes">
                      <h5>Notes:</h5>
                      <p>{session.notes}</p>
                    </div>
                  )}

                  <div className="session-actions">
                    <button 
                      onClick={() => handleUpdateStatus(session._id, 'completed')}
                      className="complete-btn"
                      title="Mark as Complete"
                    >
                      <FaCheckCircle /> Complete
                    </button>
                    <button 
                      onClick={() => openNotesModal(session)}
                      className="notes-btn"
                      title="Add Notes"
                    >
                      <FaNotesMedical /> Notes
                    </button>
                    <button 
                      onClick={() => openRescheduleModal(session)}
                      className="reschedule-btn"
                      title="Reschedule"
                    >
                      <FaCalendar /> Reschedule
                    </button>
                    <button 
                      onClick={() => handleCancelSession(session._id)}
                      className="cancel-btn"
                      title="Cancel Session"
                    >
                      <FaTimesCircle /> Cancel
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

     {/* Past Sessions Section */}
<div className="sessions-section past-sessions">
  <h3>
    <FaHistory /> Past Sessions
    <span className="session-count">{pastSessions.length}</span>
  </h3>
  
  {pastSessions.length === 0 ? (
    <div className="no-sessions-message">
      <p>No past sessions found.</p>
    </div>
  ) : (
    <div className="sessions-grid">
      {pastSessions.map(session => (
        <div 
          key={session._id} 
          className={`session-card ${session.status}`}
        >
          <div 
            className="session-header"
            onClick={() => toggleSessionExpand(session._id)}
          >
            <h4>
              {session.student?.personalInfo?.name || 'Student'}
              <span className="session-type">{session.type}</span>
            </h4>
            <div className="session-expand-icon">
              {expandedSessions[session._id] ? <FaAngleUp /> : <FaAngleDown />}
            </div>
          </div>

          <div className="session-meta">
            <span className="session-date">
              <FaCalendar /> {new Date(session.date).toLocaleDateString()}
            </span>
            <span className="session-time">
              <FaClock /> {session.time}
            </span>
            <span className={`session-status ${session.status}`}>
              {session.status}
            </span>
          </div>

          <div className={`session-details ${expandedSessions[session._id] ? 'expanded' : ''}`}>
            <div className="student-info">
              <p><strong>Student ID:</strong> {session.student?.academicInfo?.registrationNumber || 'N/A'}</p>
              <p><strong>Department:</strong> {session.student?.academicInfo?.department || 'N/A'}</p>
              {session.student?.contactInfo?.email && (
                <p><strong>Email:</strong> {session.student.contactInfo.email}</p>
              )}
            </div>

            {session.description && (
              <div className="session-description">
                <h5>Description:</h5>
                <p>{session.description}</p>
              </div>
            )}
            
            {session.notes ? (
              <div className="session-notes">
                <h5>Notes:</h5>
                <p>{session.notes}</p>
              </div>
            ) : (
              <div className="session-notes-empty">
                <p>No session notes recorded.</p>
              </div>
            )}

            {session.feedback && (
              <div className="session-feedback">
                <h5>Student Feedback:</h5>
                <div className="rating">
                  Rating: {session.feedback.rating}/5
                </div>
                {session.feedback.comment && (
                  <p>{session.feedback.comment}</p>
                )}
              </div>
            )}

            <div className="session-actions">
              <button 
                onClick={() => openNotesModal(session)}
                className="notes-btn"
                title="Add Notes"
              >
                <FaNotesMedical /> {session.notes ? 'Update Notes' : 'Add Notes'}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )}
</div>

    </div>
  );
};
export default SessionsManagement;