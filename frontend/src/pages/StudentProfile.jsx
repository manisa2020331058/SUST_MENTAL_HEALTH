import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
    FaUser,
    FaCalendar,
    FaClipboardList,
    FaChartLine,
    FaSearch,
    FaTrash,
    FaCommentDots,
    FaClock,
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

import { User, Mail, Phone, MapPin, GraduationCap, Calendar, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

import '../styles/StudentProfile.css'; // Import your CSS styles

import api from '../utils/api'; // Adjust the import path as necessary

const StudentProfile = () => {
    const { studentId } = useParams() || { studentId: 'demo-student' };

    const [student, setStudent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [expandedSessions, setExpandedSessions] = useState({});
    const [selectedSession, setSelectedSession] = useState(null);
    const [sessionNotes, setSessionNotes] = useState('');
    const [isAddingNotes, setIsAddingNotes] = useState(false);
    const [upcomingSessions, setUpcomingSessions] = useState([]);
    const [isRescheduling, setIsRescheduling] = useState(false);

    const [pastSessions, setPastSessions] = useState([]);
    const [userId, setUserId] = useState(null);
    const [rescheduleData, setRescheduleData] = useState({
        date: '',
        time: ''
    });

    useEffect(() => {
        const fetchStudentInfo = async () => {
            try {
                const res = await api.psychologists.getStudentProfile(studentId);
                setStudent(res.data);
                console.log('Student Info:', res.data.personalInfo.profileImage);
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to fetch student info');
            } finally {
                setLoading(false);
            }
        };
        if (studentId) {
            fetchStudentInfo();
        }
    }, [studentId]);

    const fetchSessions = async () => {
        try {
            const [upcomingRes, pastRes] = await Promise.all([
                api.sessions.getUpcomingOfAStudent(studentId),
                api.sessions.getPastOfAStudent(studentId)
            ]);

            setUpcomingSessions(upcomingRes.data);
            setPastSessions(pastRes.data);

            console.log('Upcoming Sessions:', upcomingRes.data);
            console.log('Past Sessions:', pastRes.data);

            setLoading(false);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch student info');
            setLoading(false);
        }
    };

    useEffect(() => {
        if (studentId) {
            fetchSessions();
        }
    }, [studentId]);

    const toggleSessionExpand = (sessionId) => {
        setExpandedSessions(prev => ({
            ...prev,
            [sessionId]: !prev[sessionId]
        }));
    };

    const handleUpdateSession = async (sessionId, status) => {
        try {
            setLoading(true);
            await api.sessions.updateStatus(sessionId, status);
            fetchSessions();
            setError(null);
        } catch (err) {
            setError('Error updating session: ' + (err.response?.data?.message || err.message));
            toast.error("Error updating session: " + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    const openNotesModal = (session) => {
        setSelectedSession(session);
        setSessionNotes(session.notes || '');
        setIsAddingNotes(true);
    };

    const handleAddSessionNotes = async (e) => {
        e.preventDefault();

        if (!sessionNotes.trim()) {
            toast.error('Please enter session notes');
            return;
        }

        try {
            setLoading(true);

            await api.sessions.addNotes(selectedSession._id, sessionNotes);

            const [upcomingRes, pastRes] = await Promise.all([
                api.sessions.getUpcomingOfAStudent(studentId),
                api.sessions.getPastOfAStudent(studentId)
            ]);

            setUpcomingSessions(upcomingRes.data);
            setPastSessions(pastRes.data);

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

    const profileImage = student?.personalInfo.profileImage || '/default-profile.png';

    if (loading) return (
        <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading student information...</p>
        </div>
    );

    if (error) return (
        <div className="error-container">
            <div className="error-icon">⚠️</div>
            <p>{error || 'Something went wrong'}</p>
        </div>
    );

    return (
        <>

            <div className="student-profile-container">
                <div className="profile-wrapper">
                    {/* Modal for Adding Notes */}
                    {isAddingNotes && selectedSession && (
                        <div className="modal-backdrop">
                            <div className="modal-content">
                                <h3>Add Session Notes</h3>
                                <p className="session-info">
                                    Session with {selectedSession.student?.personalInfo?.name || 'Student'} on {new Date(selectedSession.date).toLocaleDateString()} at {selectedSession.time}
                                </p>

                                <form onSubmit={handleAddSessionNotes}>
                                    <div className="form-group">
                                        <label>Notes</label>
                                        <textarea
                                            value={sessionNotes}
                                            onChange={(e) => setSessionNotes(e.target.value)}
                                            rows="10"
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

                    {/* Profile Header */}
                    {/* <div className="profile-header">
                        <h2>
                            <div className="header-icon">
                                <FaUser />
                            </div>
                            Student Profile
                        </h2>
                    </div> */}

                    <div className="profile-content">
                        {/* Student Overview */}
                        <div className="student-overview">
                            <div className="profile-avatar overflow-hidden">
                                {student?.personalInfo?.profileImage ? (
                                    <img
                                        src={`http://localhost:5000/${student.personalInfo.profileImage}`}
                                        alt="Student Profile"
                                        className="avatar-image"
                                    />
                                ) : (
                                    student?.personalInfo?.name?.charAt(0) || 'S'
                                )}
                            </div>



                            <div className="student-basic-info">
                                <h3>{student?.personalInfo?.name || 'Unknown Student'}</h3>
                                <div className="student-id">
                                    ID: {student?.academicInfo?.registrationNumber || 'N/A'}
                                </div>
                                <div className="info-item">
                                    <GraduationCap size={18} />
                                    <span>{student?.academicInfo?.department || 'Unknown Department'}</span>
                                </div>
                                <div className="info-item">
                                    <Mail size={18} />
                                    <span>{student?.contactInfo?.email || 'No email provided'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Information Sections */}
                        <div className="info-sections">
                            <div className="info-section">
                                <h3>
                                    <User size={20} />
                                    Personal Information
                                </h3>
                                <div className="info-item">
                                    <User size={16} />
                                    <strong>Name:</strong>
                                    <span>{student?.personalInfo?.name || 'Unknown'}</span>
                                </div>
                                <div className="info-item">
                                    <Calendar size={16} />
                                    <strong>Age:</strong>
                                    <span>{student?.personalInfo?.age || 'Unknown'}</span>
                                </div>
                                <div className="info-item">
                                    <Calendar size={16} />
                                    <strong>DOB:</strong>
                                    <span>{student?.personalInfo?.dateOfBirth ? new Date(student.personalInfo.dateOfBirth).toLocaleDateString() : 'Unknown'}</span>
                                </div>
                            </div>

                            <div className="info-section">
                                <h3>
                                    <Phone size={20} />
                                    Contact Information
                                </h3>
                                <div className="info-item">
                                    <Mail size={16} />
                                    <strong>Email:</strong>
                                    <span>{student?.contactInfo?.email || 'Unknown'}</span>
                                </div>
                                <div className="info-item">
                                    <Phone size={16} />
                                    <strong>Phone:</strong>
                                    <span>{student?.contactInfo?.phoneNumber || 'Unknown'}</span>
                                </div>
                                <div className="info-item">
                                    <MapPin size={16} />
                                    <strong>Address:</strong>
                                    <span>{student?.contactInfo?.address || 'Unknown'}</span>
                                </div>
                            </div>

                            <div className="info-section">
                                <h3>
                                    <GraduationCap size={20} />
                                    Academic Information
                                </h3>
                                <div className="info-item">
                                    <GraduationCap size={16} />
                                    <strong>Department:</strong>
                                    <span>{student?.academicInfo?.department || 'Unknown'}</span>
                                </div>
                                <div className="info-item">
                                    <User size={16} />
                                    <strong>Reg. Number:</strong>
                                    <span>{student?.academicInfo?.registrationNumber || 'Unknown'}</span>
                                </div>
                                <div className="info-item">
                                    <CheckCircle size={16} />
                                    <strong>Status:</strong>
                                    <span>{student?.academicInfo?.academicStatus || 'Unknown'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Upcoming Sessions Section */}
                        <div className="sessions-section">
                            <h3>
                                <FaCalendar />
                                Upcoming Sessions
                                <span className="session-count">{upcomingSessions.length}</span>
                            </h3>

                            {upcomingSessions.length === 0 ? (
                                <div className="no-sessions-message">
                                    <p>No upcoming sessions scheduled.</p>
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
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Past Sessions Section */}
                        <div className="sessions-section past-sessions">
                            <h3>
                                <FaHistory />
                                Past Sessions
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
                </div>
            </div>
        </>
    );
};

export default StudentProfile;