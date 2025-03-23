import React, { useState, useEffect } from 'react';
import { 
  FaUser,        // Student Enrollment
  FaCalendar,    // Therapy Schedule
  FaClipboardList, // Seminars
  FaChartLine,   // Overview
  FaSearch      // Search
} from 'react-icons/fa';
import '../styles/PsychologistDashboard.css';
import api from '../utils/api'; // Assuming you have an api module

const PsychologistDashboard = () => {
  // State for search and active section
  const [searchRegistration, setSearchRegistration] = useState('');
  const [activeSection, setActiveSection] = useState('overview');

  // State for student enrollment
  const [newStudent, setNewStudent] = useState({
    // Personal Information
    name: '',
    gender: '',
    dateOfBirth: '',
    age: '',
  
    // Contact Information
    email: '',
    phoneNumber: '',
    alternatePhoneNumber: '',
    communicationPreference: '',
  
    // Academic Information
    registrationNumber: '',
    department: '',
    session: '',
    currentYear: '',
    cgpa: '',
    scholarshipStatus: ''
  });
  
  // State for therapy session
  const [therapySession, setTherapySession] = useState({
    registrationNumber: '',
    type: '',
    date: '',
    time: '',
    description: '',
    duration: '',
    followUpNeeded: ''
  });

  // State for seminar creation
  const [newSeminar, setNewSeminar] = useState({
    title: '',
    date: '',
    time: '',
    location: '',
    description: '',
    maxParticipants: ''
  });

  // State for sessions
  const [sessions, setSessions] = useState({
    upcoming: [],
    past: []
  });
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
  const [sessionError, setSessionError] = useState('');

  // Mock data stores (to be replaced with backend integration)
  const [studentEnrollments, setStudentEnrollments] = useState([]);
  const [therapySessions, setTherapySessions] = useState([]);
  const [seminars, setSeminars] = useState([]);

  // Handler for student enrollment
  const handleStudentEnrollment = (e) => {
    e.preventDefault();
    const enrolledStudent = {
      ...newStudent,
      id: studentEnrollments.length + 1
    };
    
    setStudentEnrollments([...studentEnrollments, enrolledStudent]);
    
    // Reset form
    setNewStudent({
      name: '',
      registrationNumber: '',
      department: '',
      session: '',
      gender: '',
      age: '',
      email: '',
      phoneNumber: '',
      currentYear: '',
      communicationPreference: ''
    });

    // TODO: Send to backend
    alert('Student Enrolled Successfully');
  };

  // Handler for therapy session scheduling
  const handleScheduleTherapySession = (e) => {
    e.preventDefault();
    const sessionToSchedule = {
      ...therapySession,
      id: therapySessions.length + 1
    };

    setTherapySessions([...therapySessions, sessionToSchedule]);

    // Reset form
    setTherapySession({
      registrationNumber: '',
      type: '',
      date: '',
      time: '',
      description: '',
      duration: '',
      followUpNeeded: ''
    });

    // TODO: Send to backend
    alert('Therapy Session Scheduled Successfully');
  };

  // Handler for seminar creation
  const handleSeminarCreate = (e) => {
    e.preventDefault();
    const seminarToAdd = {
      ...newSeminar,
      id: seminars.length + 1
    };

    setSeminars([...seminars, seminarToAdd]);

    // Reset form
    setNewSeminar({
      title: '',
      date: '',
      time: '',
      location: '',
      description: '',
      maxParticipants: ''
    });

    // TODO: Send to backend
    alert('Seminar Created Successfully');
  };

  // Search handler
  const handleSearch = () => {
    // TODO: Implement search logic
    // This could be a call to backend to find student by registration number
    const foundStudent = studentEnrollments.find(
      student => student.registrationNumber === searchRegistration
    );

    if (foundStudent) {
      // Maybe set a selected student state or navigate to student details
      console.log('Student Found:', foundStudent);
    } else {
      alert('No student found with this registration number');
    }
  };

  // Fetch sessions
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        // Fetch upcoming sessions
        const upcomingResponse = await api.get('/sessions/psychologist?timeframe=upcoming');
        // Fetch past sessions
        const pastResponse = await api.get('/sessions/psychologist?timeframe=past');

        setSessions({
          upcoming: upcomingResponse.data,
          past: pastResponse.data
        });
      } catch (error) {
        console.error('Error fetching sessions:', error);
      }
    };

    fetchSessions();
  }, []);

  // Handle session scheduling
  const handleScheduleSession = async (studentId) => {
    try {
      if (!selectedTimeSlot) {
        setSessionError('Please select a time slot');
        return;
      }

      const response = await api.post('/sessions', {
        studentId,
        date: selectedDate.toISOString().split('T')[0],
        startTime: selectedTimeSlot
      });

      // Update sessions list
      setSessions(prev => ({
        ...prev,
        upcoming: [...prev.upcoming, response.data]
      }));

      setSessionError('');
    } catch (error) {
      setSessionError(error.response?.data?.message || 'Failed to schedule session');
    }
  };

  // Render session card
  const renderSessionCard = (session) => (
    <div key={session._id} className="session-card">
      <div className="session-header">
        <h4>{session.student.personalInfo.name}</h4>
        <span className={`status-badge ${session.status}`}>
          {session.status}
        </span>
      </div>
      <div className="session-time">
        <p>
          <strong>Date:</strong> {new Date(session.sessionDetails.date).toLocaleDateString()}
        </p>
        <p>
          <strong>Time:</strong> {session.sessionDetails.startTime} - {session.sessionDetails.endTime}
        </p>
      </div>
      <div className="student-info">
        <p><strong>Department:</strong> {session.student.academicInfo.department}</p>
        <p><strong>Registration:</strong> {session.student.academicInfo.registrationNumber}</p>
      </div>
      {session.notes && (
        <div className="session-notes">
          <p><strong>Notes:</strong> {session.notes}</p>
        </div>
      )}
      {session.status === 'scheduled' && (
        <div className="session-actions">
          <button onClick={() => handleUpdateStatus(session._id, 'completed')}>
            Mark Complete
          </button>
          <button onClick={() => handleUpdateStatus(session._id, 'cancelled')}>
            Cancel
          </button>
        </div>
      )}
    </div>
  );

  // Render Sections
  const renderOverview = () => (
    <div className="overview-section">
      <h2>Dashboard Overview</h2>
      <div className="overview-cards">
        <div className="overview-card">
          <h3>Total Students</h3>
          <p>{studentEnrollments.length}</p>
        </div>
        <div className="overview-card">
          <h3>Upcoming Sessions</h3>
          <p>{therapySessions.length}</p>
        </div>
        <div className="overview-card">
          <h3>Seminars</h3>
          <p>{seminars.length}</p>
        </div>
      </div>
    </div>
  );

  // Render methods for each section (Student Enrollment, Therapy Session, Seminars)
  // ... (Use the detailed forms from the previous response)
  // I'll include the student enrollment form as an example
  const renderStudentEnrollment = () => (
    <div className="student-enrollment-section">
      <h2>Student Enrollment</h2>
      <form onSubmit={handleStudentEnrollment}>
        {/* Personal Information */}
        <div className="form-section">
          <h3>Personal Information</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Full Name</label>
              <input 
                type="text" 
                value={newStudent.name}
                onChange={(e) => setNewStudent({...newStudent, name: e.target.value})}
                placeholder="Enter full name"
                required 
              />
            </div>
            <div className="form-group">
              <label>Gender</label>
              <select 
                value={newStudent.gender}
                onChange={(e) => setNewStudent({...newStudent, gender: e.target.value})}
                required
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Date of Birth</label>
              <input 
                type="date" 
                value={newStudent.dateOfBirth}
                onChange={(e) => setNewStudent({...newStudent, dateOfBirth: e.target.value})}
                required 
              />
            </div>
            <div className="form-group">
              <label>Age</label>
              <input 
                type="number" 
                value={newStudent.age}
                onChange={(e) => setNewStudent({...newStudent, age: e.target.value})}
                min="17"
                max="35"
                required 
              />
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="form-section">
          <h3>Contact Information</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Email Address</label>
              <input 
                type="email" 
                value={newStudent.email}
                onChange={(e) => setNewStudent({...newStudent, email: e.target.value})}
                placeholder="Enter email address"
                required 
              />
            </div>
            <div className="form-group">
              <label>Phone Number</label>
              <input 
                type="tel" 
                value={newStudent.phoneNumber}
                onChange={(e) => setNewStudent({...newStudent, phoneNumber: e.target.value})}
                placeholder="Enter phone number"
                pattern="[0-9]{11}"
                required 
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Alternative Contact Number</label>
              <input 
                type="tel" 
                value={newStudent.alternatePhoneNumber}
                onChange={(e) => setNewStudent({...newStudent, alternatePhoneNumber: e.target.value})}
                placeholder="Enter alternative phone number"
              />
            </div>
            <div className="form-group">
              <label>Preferred Communication Method</label>
              <select 
                value={newStudent.communicationPreference}
                onChange={(e) => setNewStudent({...newStudent, communicationPreference: e.target.value})}
                required
              >
                <option value="">Select Preference</option>
                <option value="Email">Email</option>
                <option value="Phone">Phone</option>
                <option value="Both">Both</option>
              </select>
            </div>
          </div>
        </div>

        {/* Academic Information */}
        <div className="form-section">
          <h3>Academic Information</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Registration Number</label>
              <input 
                type="text" 
                value={newStudent.registrationNumber}
                onChange={(e) => setNewStudent({...newStudent, registrationNumber: e.target.value})}
                placeholder="Enter registration number"
                required 
              />
            </div>
            <div className="form-group">
              <label>Department</label>
              <select 
                value={newStudent.department}
                onChange={(e) => setNewStudent({...newStudent, department: e.target.value})}
                required
              >
                <option value="">Select Department</option>
                <option value="Computer Science">Computer Science</option>
                <option value="Engineering">Engineering</option>
                <option value="Business Administration">Business Administration</option>
                <option value="Social Sciences">Social Sciences</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Academic Session</label>
              <input 
                type="text" 
                value={newStudent.session}
                onChange={(e) => setNewStudent({...newStudent, session: e.target.value})}
                placeholder="e.g., 2019-2020"
                required 
              />
            </div>
            <div className="form-group">
              <label>Current Year/Semester</label>
              <select 
                value={newStudent.currentYear}
                onChange={(e) => setNewStudent({...newStudent, currentYear: e.target.value})}
                required
              >
                <option value="">Select Current Year</option>
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option>
                <option value="4th Year">4th Year</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>CGPA</label>
              <input 
                type="number" 
                step="0.01"
                min="0"
                max="4.00"
                value={newStudent.cgpa}
                onChange={(e) => setNewStudent({...newStudent, cgpa: e.target.value})}
                placeholder="Enter CGPA"
              />
            </div>
            <div className="form-group">
              <label>Scholarship Status</label>
              <select 
                value={newStudent.scholarshipStatus}
                onChange={(e) => setNewStudent({...newStudent, scholarshipStatus: e.target.value})}
              >
                <option value="">Select Scholarship Status</option>
                <option value="None">None</option>
                <option value="Partial">Partial</option>
                <option value="Full">Full</option>
              </select>
            </div>
          </div>
        </div>

        <button type="submit" className="submit-btn">Enroll Student</button>
      </form>
    </div>
  );

  // Main Sidebar
  const renderSidebar = () => (
    <div className="dashboard-sidebar">
      <div className="search-container">
        <input 
          type="text" 
          placeholder="Search by Registration Number"
          value={searchRegistration}
          onChange={(e) => setSearchRegistration(e.target.value)}
        />
        <button onClick={handleSearch}>
          <FaSearch />
        </button>
      </div>

      <div className="sidebar-menu">
        <button 
          onClick={() => setActiveSection('overview')}
          className={activeSection === 'overview' ? 'active' : ''}
        >
          <FaChartLine /> Overview
        </button>
        <button 
          onClick={() => setActiveSection('studentEnrollment')}
          className={activeSection === 'studentEnrollment' ? 'active' : ''}
        >
          <FaUser /> Student Enrollment
        </button>
        <button 
          onClick={() => setActiveSection('therapySchedule')}
          className={activeSection === 'therapySchedule' ? 'active' : ''}
        >
          <FaCalendar /> Therapy Schedule
        </button>
        <button 
          onClick={() => setActiveSection('seminars')}
          className={activeSection === 'seminars' ? 'active' : ''}
        >
          <FaClipboardList /> Seminars
        </button>
        <button 
          onClick={() => setActiveSection('sessions')}
          className={activeSection === 'sessions' ? 'active' : ''}
        >
          Sessions
        </button>
      </div>
    </div>
  );

  // Content Rendering
  const renderContent = () => {
    switch(activeSection) {
      case 'overview':
        return renderOverview();
      case 'studentEnrollment':
        return renderStudentEnrollment();
      case 'therapySchedule':
        // Add therapy session scheduling render method
        return <div>Therapy Schedule Content</div>;
      case 'seminars':
        // Add seminar creation render method
        return <div>Seminars Content</div>;
      case 'sessions':
        return (
          <div className="sessions-container">
            <div className="dashboard-section">
              <h2>Upcoming Sessions</h2>
              <div className="sessions-grid">
                {Object.entries(sessions.upcoming).map(([date, dateSessions]) => (
                  <div key={date} className="date-group">
                    <h3>{new Date(date).toLocaleDateString()}</h3>
                    {dateSessions.map(renderSessionCard)}
                  </div>
                ))}
              </div>
            </div>

            <div className="dashboard-section">
              <h2>Past Sessions</h2>
              <div className="sessions-grid">
                {Object.entries(sessions.past).map(([date, dateSessions]) => (
                  <div key={date} className="date-group">
                    <h3>{new Date(date).toLocaleDateString()}</h3>
                    {dateSessions.map(renderSessionCard)}
                  </div>
                ))}
              </div>
            </div>

            {sessionError && (
              <div className="error-message">
                {sessionError}
              </div>
            )}
          </div>
        );
      default:
        return renderOverview();
    }
  };

  return (
    <div className="psychologist-dashboard">
      {renderSidebar()}
      <div className="dashboard-content">
        {renderContent()}
      </div>
    </div>
  );
};

export default PsychologistDashboard;