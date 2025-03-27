import React, { useState, useEffect } from 'react';
import { 
  FaUser,        // Student Enrollment
  FaCalendar,    // Therapy Schedule
  FaClipboardList, // Seminars
  FaChartLine,   // Overview
  FaSearch      // Search
} from 'react-icons/fa';
import '../styles/PsychologistDashboard.css';
import api from '../utils/api';
import { PsychologistProfile } from './PsychologistProfile';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from 'react-toastify';

const defaultProfile = {
  personalInfo: {
    name: '',
    gender: '',
    dateOfBirth: '',
  },
  professionalInfo: {
    specialization: '',
    qualifications: '',
    yearsOfExperience: '',
  },
  contactInfo: {
    email: '',
    phoneNumber: '',
    officeLocation: '',
  },
  availabilitySchedule: []
};

const sanitizeValue = (value) => {
  if (value === null || value === undefined) return '';
  return String(value).trim();
};

const PsychologistDashboard = () => {
  // UI State
  const [activeSection, setActiveSection] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Data State
  const [profile, setProfile] = useState(defaultProfile);
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [pastSessions, setPastSessions] = useState([]);
  const [students, setStudents] = useState([]);
  const [seminars, setSeminars] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [newSeminar, setNewSeminar] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
   
    registeredParticipants: 0
  });

  // Form States
  const [newStudent, setNewStudent] = useState({
    name: '',
    gender: '',
    dateOfBirth: '',
    age: '',
    email: '',
    phoneNumber: '',
    alternatePhoneNumber: '',
    communicationPreference: '',
    registrationNumber: '',
    department: '',
    session: '',
    currentYear: '',
    address:'',
  });

  const [newSession, setNewSession] = useState({
    studentId: '',
    date: '',
    time: '',
    type: 'individual',
    description: '',
    duration: 60
  });

  useEffect(() => {
    fetchPsychologistData();
  }, []);

  useEffect(() => {
    if (activeSection === 'sessions') {
      fetchSessions();
    } else if (activeSection === 'students') {
      fetchStudents();
    } else if (activeSection === 'seminars') {
      fetchSeminars();
    }
  }, [activeSection]);

  const fetchPsychologistData = async () => {
    try {
      setLoading(true);
      const response = await api.profile.get();
      
      if (!response || !response.data) {
        throw new Error('No profile data received');
      }

      const data = response.data;
      
      // Sanitize and structure the profile data
      const sanitizedProfile = {
        personalInfo: {
          name: sanitizeValue(data.personalInfo?.name),
          gender: sanitizeValue(data.personalInfo?.gender),
          dateOfBirth: sanitizeValue(data.personalInfo?.dateOfBirth),
        },
        professionalInfo: {
          specialization: sanitizeValue(data.professionalInfo?.specialization),
          qualifications: sanitizeValue(data.professionalInfo?.qualifications),
          yearsOfExperience: sanitizeValue(data.professionalInfo?.yearsOfExperience),
        },
        contactInfo: {
          email: sanitizeValue(data.contactInfo?.email),
          phoneNumber: sanitizeValue(data.contactInfo?.phoneNumber),
          officeLocation: sanitizeValue(data.contactInfo?.officeLocation),
        },
        availabilitySchedule: Array.isArray(data.availabilitySchedule) 
          ? data.availabilitySchedule.map(slot => ({
              day: sanitizeValue(slot.day),
              startTime: sanitizeValue(slot.startTime),
              endTime: sanitizeValue(slot.endTime)
            }))
          : []
      };

      setProfile(sanitizedProfile);
      setError(null);
    } catch (err) {
      console.error('Profile fetch error:', err);
      setError('Error fetching profile: ' + (err.response?.data?.message || err.message));
      setProfile(defaultProfile);
    } finally {
      setLoading(false);
    }
  };

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const [upcomingRes, pastRes] = await Promise.all([
        api.sessions.getUpcoming(),
        api.sessions.getPast()
      ]);
      
      if (!upcomingRes.data || !pastRes.data) {
        throw new Error('Failed to fetch sessions data');
      }
      
      setUpcomingSessions(upcomingRes.data);
      setPastSessions(pastRes.data);
      setError(null);
    } catch (err) {
      setError('Error fetching sessions: ' + (err.response?.data?.message || err.message));
      setUpcomingSessions([]);
      setPastSessions([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await api.students.getAll();
      setStudents(response.data);
      setError(null);
    } catch (err) {
      setError('Error fetching students: ' + (err.response?.data?.message || err.message));
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSeminars = async () => {
    try {
      setLoading(true);
      const response = await api.seminars.getAll();
      if (!response.data) {
        throw new Error('No seminars data received');
      }
      setSeminars(response.data);
      setError(null);
    } catch (err) {
      setError('Error fetching seminars: ' + (err.response?.data?.message || err.message));
      setSeminars([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSession = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!newSession.studentId || !newSession.date || !newSession.time) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      await api.sessions.create(newSession);
      await fetchSessions();
      setNewSession({
        studentId: '',
        date: '',
        time: '',
        type: 'individual',
        description: '',
        duration: 60
      });
      setError(null);
    } catch (err) {
      setError('Error creating session: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleEnrollStudent = async (e) => {
    console.log('newStudent:', newStudent);
    const token = localStorage.getItem('token');
    console.log('token:', token);
    e.preventDefault();
    try {
      setLoading(true);
      const studentData = {
        personalInfo: {
          name: newStudent.name,
          gender: newStudent.gender,
          dateOfBirth: newStudent.dateOfBirth,
          age: newStudent.age
        },
        contactInfo: {
          email: newStudent.email,
          phoneNumber: newStudent.phoneNumber,
          alternatePhoneNumber: newStudent.alternatePhoneNumber,
          address:newStudent.address
        },
        academicInfo: {
          registrationNumber: newStudent.registrationNumber,
          department: newStudent.department,
          session: newStudent.session,
          currentYear: newStudent.currentYear,
        }
      };
      const response = await api.students.enroll(studentData);
      console.log('Request payload:', response.config.data);
      console.log('Request headers:', response.config.headers);
      console.log('Response:', response);
      fetchStudents();
      setNewStudent({
        name: '',
        gender: '',
        dateOfBirth: '',
        age: '',
        email: '',
        phoneNumber: '',
        alternatePhoneNumber: '',
        communicationPreference: '',
        registrationNumber: '',
        department: '',
        session: '',
        currentYear: '',
        address:''
      });
      setError(null);
      alert("Student enrolled successfully!");
    } catch (err) {
      console.error('Error:', err);
      console.log('Error response:', err.response);
      setError('Error enrolling student: ' + (err.response?.data?.message || err.message));
     
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSession = async (sessionId, status) => {
    try {
      setLoading(true);
      await api.sessions.updateStatus(sessionId, { status });
      fetchSessions();
      setError(null);
    } catch (err) {
      setError('Error updating session: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleAddNotes = async (sessionId, notes) => {
    try {
      setLoading(true);
      await api.sessions.addNotes(sessionId, { notes });
      fetchSessions();
      setError(null);
    } catch (err) {
      setError('Error adding notes: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (updatedProfile, onSuccess) => {
    try {
      setLoading(true);
      // Ensure the updated profile data is properly sanitized before sending
      const sanitizedProfile = {
        personalInfo: {
          name: sanitizeValue(updatedProfile.personalInfo?.name),
          gender: sanitizeValue(updatedProfile.personalInfo?.gender),
          dateOfBirth: sanitizeValue(updatedProfile.personalInfo?.dateOfBirth),
        },
        professionalInfo: {
          specialization: sanitizeValue(updatedProfile.professionalInfo?.specialization),
          qualifications: sanitizeValue(updatedProfile.professionalInfo?.qualifications),
          yearsOfExperience: sanitizeValue(updatedProfile.professionalInfo?.yearsOfExperience),
        },
        contactInfo: {
          email: sanitizeValue(updatedProfile.contactInfo?.email),
          phoneNumber: sanitizeValue(updatedProfile.contactInfo?.phoneNumber),
          officeLocation: sanitizeValue(updatedProfile.contactInfo?.officeLocation),
        },
        availabilitySchedule: Array.isArray(updatedProfile.availabilitySchedule) 
          ? updatedProfile.availabilitySchedule.map(slot => ({
              day: sanitizeValue(slot.day),
              startTime: sanitizeValue(slot.startTime),
              endTime: sanitizeValue(slot.endTime)
            }))
          : []
      };

      await api.profile.update(sanitizedProfile);
      await fetchPsychologistData();
      if (typeof onSuccess === 'function') {
        onSuccess();
      }
      setError(null);
    } catch (err) {
      console.error('Profile update error:', err);
      setError('Error updating profile: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSeminar = async (e) => {
    e.preventDefault();
    
    if (!newSeminar.title || !newSeminar.date || !newSeminar.time) {
      setError('Please fill in all required fields for the seminar');
      return;
    }

    try {
      setLoading(true);
      await api.seminars.create(newSeminar);
      await fetchSeminars();
      setNewSeminar({
        title: '',
        description: '',
        date: '',
        time: '',
        location: '',
        maxParticipants: 50,
        registeredParticipants: 0
      });
      setError(null);
    } catch (err) {
      setError('Error creating seminar: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const renderOverview = () => (
    <div className="overview-section">
      <h2>Dashboard Overview</h2>
      <div className="overview-cards">
        <div className="overview-card">
          <h3>Total Students</h3>
          <p>{students?.length || 0}</p>
        </div>
        <div className="overview-card">
          <h3>Upcoming Sessions</h3>
          <p>{upcomingSessions?.length || 0}</p>
        </div>
        <div className="overview-card">
          <h3>Seminars</h3>
          <p>{seminars?.length || 0}</p>
        </div>
      </div>
    </div>
  );

  const renderStudentEnrollment = () => (
    <div className="student-enrollment-section">
      <h2>Student Enrollment</h2>
      <form onSubmit={handleEnrollStudent}>
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
            <div className="form-group">
              <label>Address</label>
              <input 
                type="text" 
                value={newStudent.address}
                onChange={(e) => setNewStudent({...newStudent, address:e.target.value})}
                placeholder="Enter address"
          
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
        </div>

        <button type="submit" className="submit-btn">Enroll Student</button>
      </form>
    </div>
  );

  const renderSessions = () => (
    <div className="sessions-container">
      <div className="dashboard-section">
        <h2>Upcoming Sessions</h2>
        <div className="sessions-grid">
          {upcomingSessions.map((session, index) => (
            <div key={index} className="session-card">
              <div className="session-header">
                <h4>{session.student.name}</h4>
                <span className={`status-badge ${session.status}`}>
                  {session.status}
                </span>
              </div>
              <div className="session-time">
                <p>
                  <strong>Date:</strong> {new Date(session.date).toLocaleDateString()}
                </p>
                <p>
                  <strong>Time:</strong> {session.time}
                </p>
              </div>
              <div className="student-info">
                <p><strong>Department:</strong> {session.student.department}</p>
                <p><strong>Registration:</strong> {session.student.registrationNumber}</p>
              </div>
              {session.notes && (
                <div className="session-notes">
                  <p><strong>Notes:</strong> {session.notes}</p>
                </div>
              )}
              {session.status === 'scheduled' && (
                <div className="session-actions">
                  <button onClick={() => handleUpdateSession(session.id, 'completed')}>
                    Mark Complete
                  </button>
                  <button onClick={() => handleUpdateSession(session.id, 'cancelled')}>
                    Cancel
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="dashboard-section">
        <h2>Past Sessions</h2>
        <div className="sessions-grid">
          {pastSessions.map((session, index) => (
            <div key={index} className="session-card">
              <div className="session-header">
                <h4>{session.student.name}</h4>
                <span className={`status-badge ${session.status}`}>
                  {session.status}
                </span>
              </div>
              <div className="session-time">
                <p>
                  <strong>Date:</strong> {new Date(session.date).toLocaleDateString()}
                </p>
                <p>
                  <strong>Time:</strong> {session.time}
                </p>
              </div>
              <div className="student-info">
                <p><strong>Department:</strong> {session.student.department}</p>
                <p><strong>Registration:</strong> {session.student.registrationNumber}</p>
              </div>
              {session.notes && (
                <div className="session-notes">
                  <p><strong>Notes:</strong> {session.notes}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderSeminars = () => (
    <div className="seminars-section">
      <h2>Seminars</h2>
      
      <form onSubmit={handleCreateSeminar} className="create-seminar-form">
        <h3>Create New Seminar</h3>
        <div className="form-row">
          <div className="form-group">
            <label>Title</label>
            <input
              type="text"
              value={newSeminar.title}
              onChange={(e) => setNewSeminar({...newSeminar, title: e.target.value})}
              required
            />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea
              value={newSeminar.description}
              onChange={(e) => setNewSeminar({...newSeminar, description: e.target.value})}
              required
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Date</label>
            <input
              type="date"
              value={newSeminar.date}
              onChange={(e) => setNewSeminar({...newSeminar, date: e.target.value})}
              required
            />
          </div>
          <div className="form-group">
            <label>Time</label>
            <input
              type="time"
              value={newSeminar.time}
              onChange={(e) => setNewSeminar({...newSeminar, time: e.target.value})}
              required
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Location</label>
            <input
              type="text"
              value={newSeminar.location}
              onChange={(e) => setNewSeminar({...newSeminar, location: e.target.value})}
              required
            />
          </div>
          <div className="form-group">
            <label>Maximum Participants</label>
            <input
              type="number"
              value={newSeminar.maxParticipants}
              onChange={(e) => setNewSeminar({...newSeminar, maxParticipants: parseInt(e.target.value)})}
              min="1"
              required
            />
          </div>
        </div>

        <button type="submit" className="create-seminar-btn">Create Seminar</button>
      </form>

      <div className="seminars-list">
        <h3>Upcoming Seminars</h3>
        {seminars.length > 0 ? (
          <div className="seminar-cards">
            {seminars.map((seminar) => (
              <div key={seminar._id} className="seminar-card">
                <h4>{seminar.title}</h4>
                <p>{seminar.description}</p>
                <div className="seminar-details">
                  <p><strong>Date:</strong> {new Date(seminar.date).toLocaleDateString()}</p>
                  <p><strong>Time:</strong> {seminar.time}</p>
                  <p><strong>Location:</strong> {seminar.location}</p>
                  <p><strong>Participants:</strong> {seminar.registeredParticipants}/{seminar.maxParticipants}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p>No seminars scheduled</p>
        )}
      </div>
    </div>
  );

  const renderSidebar = () => (
    <nav className="dashboard-nav">
      <ul>
        <li className={activeSection === 'overview' ? 'active' : ''}>
          <button onClick={() => setActiveSection('overview')}>
            <FaChartLine /> Overview
          </button>
        </li>
        <li className={activeSection === 'profile' ? 'active' : ''}>
          <button onClick={() => setActiveSection('profile')}>
            <FaUser /> Profile
          </button>
        </li>
        <li className={activeSection === 'sessions' ? 'active' : ''}>
          <button onClick={() => setActiveSection('sessions')}>
            <FaCalendar /> Sessions
          </button>
        </li>
        <li className={activeSection === 'students' ? 'active' : ''}>
          <button onClick={() => setActiveSection('students')}>
            <FaClipboardList /> Students
          </button>
        </li>
        <li className={activeSection === 'seminars' ? 'active' : ''}>
          <button onClick={() => setActiveSection('seminars')}>
            <FaClipboardList /> Seminars
          </button>
        </li>
      </ul>
    </nav>
  );

  const renderContent = () => {
    switch(activeSection) {
      case 'overview':
        return renderOverview();
      case 'students':
        return renderStudentEnrollment();
      case 'sessions':
        return renderSessions();
      case 'seminars':
        return renderSeminars();
      case 'profile':
        return (
          <PsychologistProfile
            profile={profile}
            loading={false}
            error={error}
            onProfileUpdate={handleProfileUpdate}
          />
        );
      default:
        return renderOverview();
    }
  };

  return (
    <div className="psychologist-dashboard">
      <nav className="dashboard-nav">
        <ul>
          <li className={activeSection === 'overview' ? 'active' : ''}>
            <button onClick={() => setActiveSection('overview')}>
              <FaChartLine /> Overview
            </button>
          </li>
          <li className={activeSection === 'profile' ? 'active' : ''}>
            <button onClick={() => setActiveSection('profile')}>
              <FaUser /> Profile
            </button>
          </li>
          <li className={activeSection === 'sessions' ? 'active' : ''}>
            <button onClick={() => setActiveSection('sessions')}>
              <FaCalendar /> Sessions
            </button>
          </li>
          <li className={activeSection === 'students' ? 'active' : ''}>
            <button onClick={() => setActiveSection('students')}>
              <FaClipboardList /> Students
            </button>
          </li>
          <li className={activeSection === 'seminars' ? 'active' : ''}>
            <button onClick={() => setActiveSection('seminars')}>
              <FaClipboardList /> Seminars
            </button>
          </li>
        </ul>
      </nav>

      <main className="dashboard-content">
        {error && (
          <div className="error-banner">
            {error}
            <button onClick={() => setError(null)}>✕</button>
          </div>
        )}
        
        {loading && <div className="loading-spinner">Loading...</div>}
        
        {!loading && (
          <>
            {activeSection === 'overview' && renderOverview()}
            {activeSection === 'profile' && (
              <PsychologistProfile
                profile={profile}
                loading={false}
                error={error}
                onProfileUpdate={handleProfileUpdate}
              />
            )}
            {activeSection === 'sessions' && renderSessions()}
            {activeSection === 'students' && renderStudentEnrollment()}
            {activeSection === 'seminars' && renderSeminars()}
          </>
        )}
      </main>
    </div>
  );
};

export default PsychologistDashboard;