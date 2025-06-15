import React, { useState, useRef, useEffect ,useCallback} from 'react';
import { User, Mail, Phone, MapPin, GraduationCap, Calendar, Camera, UserCheck } from 'lucide-react';
import { 
  FaUser,        // Student Enrollment
  FaCalendar,    // Therapy Schedule
  FaClipboardList, // Seminars
  FaChartLine,   // Overview
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
  FaNotesMedical    // Search
} from 'react-icons/fa';
import '../styles/PsychologistDashboard.css';
import api from '../utils/api';
import { PsychologistProfile } from './PsychologistProfile';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from 'react-toastify';
import { useChat } from '../contexts/ChatContext';
import { useNavigate } from 'react-router-dom';
import PsychologistOverview from './PsychologistOverview';
import PsychologyStudentEnrollment from './PsychologyStudentEnrollment';
import '../styles/chat.css';

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
  const [messages, setMessages] = useState({});  // Object to store messages by student
  const [activeChat, setActiveChat] = useState(null);  // Currently selected student
  const [newMessage, setNewMessage] = useState('');
  const [enrolledStudents, setEnrolledStudents] = useState([]);
  const { socket, sendMessage: socketSendMessage } = useChat();
  const messagesEndRef = useRef(null);
  // Data State
  const [profile, setProfile] = useState(defaultProfile);
  const [isEnrollmentModalOpen, setIsEnrollmentModalOpen] = useState(false);
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
    location: ''
  });

  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
const [expandedSessions, setExpandedSessions] = useState({});
const [selectedSession, setSelectedSession] = useState(null);
const [isAddingNotes, setIsAddingNotes] = useState(false);
const [isRescheduling, setIsRescheduling] = useState(false);
const [sessionNotes, setSessionNotes] = useState('');
const [rescheduleData, setRescheduleData] = useState({
  date: '',
  time: ''
});
const [showNewSessionForm, setShowNewSessionForm] = useState(false);
const [showModal, setShowModal] = useState(false);
   // New state for editing profile
   const [editedProfile, setEditedProfile] = useState(defaultProfile);
   const [isEditing, setIsEditing] = useState(false);
   const [drafts, setDrafts] = useState({}); 
   const [chatSearch, setChatSearch] = useState('')
  
     // Add this useEffect for socket connection

     // after you load your profile from api.profile.get():
const [meId, setMeId] = useState(null);


useEffect(() => {
  if (socket) {
    socket.on('message', (newMessage) => {
      setMessages(prev => ({
        ...prev,
        [newMessage.sender]: [...(prev[newMessage.sender] || []), newMessage]
      }));
      
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    });

    return () => socket.off('message');
  }
}, [socket]);


const handleDraftChange = e => {
  setDrafts(d => ({ 
    ...d,
    [activeChat.userId]: e.target.value 
  }));
};

useEffect(() => {
  if (!activeChat) return;

  api.messages.getMessages(activeChat.userId)
    .then(res => {
      setMessages(m => ({ 
        ...m, 
        [activeChat.userId]: res.data 
      }));
    })
    .catch(err => {
      console.error('Fetch chat failed', err);
      toast.error('Could not load conversation');
    });
}, [activeChat]);

useEffect(() => {
  if (!activeChat) return;
  const sid = activeChat.userId;

  // 1) call server
  api.messages.markAsRead(sid).catch(console.error);

  // 2) update local state
  setMessages(prev => ({
    ...prev,
    [sid]: (prev[sid]||[]).map(m => ({ ...m, read: true }))
  }));
}, [activeChat]);
   // Utility function to handle input changes
   const handleInputChange = useCallback((section, field, value) => {
     setEditedProfile(prevProfile => ({
       ...prevProfile,
       [section]: {
         ...prevProfile[section],
         [field]: value
       }
     }));
   }, []);
   
   // Add function to fetch messages
   const fetchMessages = useCallback(async () => {
    try {
      const response = await api.messages.getAllMessages();
      console.log('Messages response:', response.data); // For debugging
  
      // Group messages by student
      const messagesByStudent = response.data.reduce((acc, message) => {
        // Determine if the current user is the sender or recipient
        const studentId = message.sender._id === profile.userId 
          ? message.recipient._id 
          : message.sender._id;
  
        if (!acc[studentId]) {
          acc[studentId] = [];
        }
        acc[studentId].push(message);
        return acc;
      }, {});
  
      console.log('Grouped messages:', messagesByStudent); // For debugging
      setMessages(messagesByStudent);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to fetch messages');
    }
  }, [profile.userId]);

  

  
   
   const fetchEnrolledStudents = useCallback(async () => {
    try {
      const response = await api.students.getAll();
      setEnrolledStudents(response.data);
      
      // Fetch messages for each student
      response.data.forEach(async (student) => {
        const messagesResponse = await api.messages.getMessages(student.userId);
        setMessages(prev => ({
          ...prev,
          [student.userId]: messagesResponse.data
        }));
      });
    } catch (error) {
      console.error('Error fetching enrolled students:', error);
    }
  }, []);

  
  // Add this to your useEffect dependencies
  useEffect(() => {
    if (activeSection === 'messages') {
      fetchMessages();
      fetchEnrolledStudents();
    }
  }, [activeSection, fetchEnrolledStudents]);



// Memoized fetch functions
const fetchSessions = useCallback(async () => {
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
}, []); // No dependencies as it uses local state setters

// Fetch available time slots when date changes
// Fetch available time slots when date changes
const fetchAvailableTimeSlots = async (date) => {
  if (!date) {
    console.warn('No date provided to fetchAvailableTimeSlots');
    setAvailableTimeSlots([]);
    return;
  }
  
  try {
    setLoading(true);
    
    // Option 1: If you store psychologistId in your profile state
    const psychologistId = profile.psychologistId;
    
    if (!psychologistId) {
      // Option 2: If psychologistId is not in state, fetch it
      const profileResponse = await api.profile.get();
      const fetchedPsychologistId = profileResponse.data.psychologistId;
      
      if (!fetchedPsychologistId) {
        throw new Error('Could not determine psychologist ID');
      }
      
      const response = await api.sessions.getAvailableSlots(date, fetchedPsychologistId);
      setAvailableTimeSlots(response.data.availableSlots || []);
    } else {
      // Use the psychologistId from state
      const response = await api.sessions.getAvailableSlots(date, psychologistId);
      setAvailableTimeSlots(response.data.availableSlots || []);
    }
  } catch (error) {
    console.error('Error fetching time slots:', error);
    toast.error('Could not load available time slots. Please try again.');
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

const handleAddSessionNotes = async (e) => {
  e.preventDefault();
  
  if (!sessionNotes.trim()) {
    toast.error('Please enter session notes');
    return;
  }
  
  try {
    setLoading(true);

    await api.sessions.addNotes(selectedSession._id,  sessionNotes );
    
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

    await api.sessions.cancel(sessionId, 'Cancelled by psychologist' );
    
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

const handleRescheduleChange = (e) => {
  const { name, value } = e.target;
  setRescheduleData(prev => ({
    ...prev,
    [name]: value
  }));
};

const fetchStudents = useCallback(async () => {
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
}, []); // No dependencies as it uses local state setters

const fetchSeminars = useCallback(async () => {
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
}, []);

  // Form States
  const [newStudent, setNewStudent] = useState({
    name: '',
    gender: '',
    dateOfBirth: '',
    age: '',
    email: '',
    phoneNumber: '',
    profileImage: '',
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        switch (activeSection) {
          case 'sessions':
            await fetchSessions();
            break;
          case 'students':
            await fetchStudents();
            break;
          case 'seminars':
            await fetchSeminars();
            break;
          case 'overview':
            await Promise.all([
              fetchStudents(),
              fetchSessions(),
              fetchSeminars()
            ]);
            break;
          default:
            break;
        }
      } catch (error) {
        console.error(`Error fetching data for ${activeSection}:`, error);
        // Optionally handle error (e.g., show error toast)
      }
    };
  
    fetchData();
  }, [activeSection, fetchSessions, fetchStudents, fetchSeminars]);



  const fetchPsychologistData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.profile.get();
      
      if (!response || !response.data) {
        throw new Error('No profile data received');
      }
  
      const data = response.data;

           setMeId(data.userId);   
      // Sanitize and structure the profile data
      const sanitizedProfile = {
        personalInfo: {
          name: sanitizeValue(data.personalInfo?.name),
          gender: sanitizeValue(data.personalInfo?.gender),
          dateOfBirth: sanitizeValue(data.personalInfo?.dateOfBirth),
          profileImage: sanitizeValue(data.personalInfo?.profileImage),
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
  }, []); 
 
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
  const convertFileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  };

  const handleEnrollStudent = useCallback(async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const imageBase64 = newStudent.profilePicture 
        ? await convertFileToBase64(newStudent.profilePicture) 
        : null;
      
      const studentData = {
        personalInfo: {
          name: newStudent.name,
          gender: newStudent.gender,
          dateOfBirth: newStudent.dateOfBirth,
          age: newStudent.age,
          profileImage: imageBase64
        },
        contactInfo: {
          email: newStudent.email,
          phoneNumber: newStudent.phoneNumber,
          alternatePhoneNumber: newStudent.alternatePhoneNumber,
          address: newStudent.address
        },
        academicInfo: {
          registrationNumber: newStudent.registrationNumber,
          department: newStudent.department,
          session: newStudent.session,
          currentYear: newStudent.currentYear,
        }
      };
      
      const response = await api.students.enroll(studentData);
      await fetchStudents();
      // Success toast
      toast.success(response.data.message || "Student enrolled successfully!");
      
      // Reset form
      setNewStudent({
        name: '', gender: '', dateOfBirth: '', age: '', email: '',
        profileImage: '', phoneNumber: '', alternatePhoneNumber: '',
        communicationPreference: '', registrationNumber: '', 
        department: '', session: '', currentYear: '', address: ''
      });

      setIsEnrollmentModalOpen(false);
      setError(null);
    } catch (err) {
      console.error('Error:', err);
      setError('Error enrolling student: ' + (err.response?.data?.message || err.message));
      toast.error("Error enrolling student: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  }, [newStudent, fetchStudents]); // Dependencies: newStudent and fetchStudents


  const handleUpdateSession = async (sessionId, status) => {
    try {
      setLoading(true);
      await api.sessions.updateStatus(sessionId,  status );
      fetchSessions();
      setError(null);
    } catch (err) {
      setError('Error updating session: ' + (err.response?.data?.message || err.message));
      toast.error("Error updating session: " + (err.response?.data?.message || err.message));
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

  const handleProfileUpdate = useCallback(async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      // Prepare profile data for submission
      const profileData = {
        personalInfo: {
          name: editedProfile.personalInfo.name,
          gender: editedProfile.personalInfo.gender,
          dateOfBirth: editedProfile.personalInfo.dateOfBirth,
          profileImage: null // We'll handle this separately
        },
        professionalInfo: {
          specialization: editedProfile.professionalInfo.specialization,
          qualifications: editedProfile.professionalInfo.qualifications,
          yearsOfExperience: editedProfile.professionalInfo.yearsOfExperience
        },
        contactInfo: {
          email: editedProfile.contactInfo.email,
          phoneNumber: editedProfile.contactInfo.phoneNumber,
          officeLocation: editedProfile.contactInfo.officeLocation
        }
      };
  
      // Handle profile image upload
      let profileImageUrl = profile.personalInfo.profileImage;
      if (editedProfile.personalInfo.profileImage?.file) {
        // Convert file to base64
        const imageBase64 = await convertFileToBase64(editedProfile.personalInfo.profileImage.file);
        
        // Upload image and get URL (adjust based on your API)
        const imageUploadResponse = await api.profile.uploadImage(imageBase64);
        profileImageUrl = imageUploadResponse.data.imageUrl;
        
        // Add image URL to profile data
        profileData.personalInfo.profileImage = profileImageUrl;
      }
  
      // Update profile
      await api.profile.update(profileData);
      
      // Fetch updated profile data
      await fetchPsychologistData();
      
      // Optional: Show success toast
      toast.success("Profile updated successfully!");
      
      // Close edit mode or reset form
      setIsEditing(false);
    } catch (err) {
      console.error('Profile update error:', err);
      toast.error("Error updating profile: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  }, [editedProfile, profile, fetchPsychologistData]);

  useEffect(() => {
    if (profile) {
      setEditedProfile(profile);
    }
  }, [profile]);

  


  const handleCreateSeminar = async (e) => {
    e.preventDefault()
    if (!newSeminar.title || !newSeminar.date || !newSeminar.time) {
      setError('Please fill in all required fields')
      return
    }
    try {
      setLoading(true)
      await api.seminars.create(newSeminar)
      await fetchSeminars()
      setNewSeminar({ title: '', description: '', date: '', time: '', location: '', maxParticipants: '' })
      setError(null)
      setShowModal(false)
      toast.success('Seminar created!')
    } catch (err) {
      setError('Error: ' + (err.response?.data?.message || err.message))
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteSeminar = async (id) => {
    if (!window.confirm('Delete this seminar?')) return
    try {
      setLoading(true)
      await api.seminars.delete(id)
      await fetchSeminars()
      toast.success('Deleted!')
    } catch (err) {
      setError('Error: ' + (err.response?.data?.message || err.message))
    } finally {
      setLoading(false)
    }
  }
const handleSendMessage = async () => {
  if (!activeChat) return;
  const text = (drafts[activeChat.userId] || '').trim();
  if (!text) return;   // nothing to send

  try {
    setLoading(true);

    // 1) Persist
    const payload = { recipient: activeChat.userId, content: text };
    const res = await api.messages.sendMessage(payload);

    // 2) Optimistic UI
    setMessages(msgs => ({
      ...msgs,
      [activeChat.userId]: [
        ...(msgs[activeChat.userId] || []),
        res.data
      ]
    }));

    // 3) Optional socket
    socketSendMessage(res.data);

    // 4) Clear draft for this chat
    setDrafts(d => ({ ...d, [activeChat.userId]: '' }));
  } catch (err) {
    console.error(err);
    toast.error('Failed to send message');
  } finally {
    setLoading(false);
  }
};
  const renderOverview = PsychologistOverview;


  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formProgress, setFormProgress] = useState(0);
  
  
  // Calculate form progress
  React.useEffect(() => {
      const fields = Object.values(newStudent);
      const filledFields = fields.filter(field => field !== '' && field !== null).length;
      const progress = (filledFields / fields.length) * 100;
      setFormProgress(progress);
  }, [newStudent]);
  
  const FormSection = ({ title, icon: Icon, children }) => (
      <div className="form-section">
          <div className="section-header">
              <Icon className="section-icon" size={24} />
              <h3>{title}</h3>
          </div>
          {children}
      </div>
  );

  const InputGroup = ({ label, icon: Icon, children, required = false }) => (
      <div className="form-group">
          <label className="form-label">
              {Icon && <Icon size={18} className="label-icon" />}
              {label}
              {required && <span className="required">*</span>}
          </label>
          {children}
      </div>
  );


  // const renderStudentEnrollment = () => (
  //   <div className="student-enrollment-section">
  //     <h2>Student Enrollment</h2>
  //     <form onSubmit={handleEnrollStudent}>
  //       {/* Personal Information */}
  //       <div className="form-section">
  //         <h3>Personal Information</h3>
  //         <div className="form-row">
  //           <div className="form-group">
  //             <label>Full Name</label>
  //             <input 
  //               type="text" 
  //               value={newStudent.name}
  //               onChange={(e) => setNewStudent({...newStudent, name: e.target.value})}
  //               placeholder="Enter full name"
  //               required 
  //             />
  //           </div>
  //           <div className="form-group">
  //             <label>Gender</label>
  //             <select 
  //               value={newStudent.gender}
  //               onChange={(e) => setNewStudent({...newStudent, gender: e.target.value})}
  //               required
  //             >
  //               <option value="">Select Gender</option>
  //               <option value="Male">Male</option>
  //               <option value="Female">Female</option>
  //               <option value="Other">Other</option>
  //             </select>
  //           </div>
  //         </div>
  //         <div className="form-row">
  //         <div className="profile-picture-upload">
  //   <label className="profile-picture-label">Profile Picture</label>
  //   <input 
  //     type="file" 
  //     accept="image/*"
  //     onChange={(e) => setNewStudent({...newStudent, profilePicture: e.target.files[0]})}
  //     className="profile-picture-input"
  //     id="profilePictureUpload"
  //   />
  //   {newStudent.profilePicture ? (
  //     <div className='profile-picture-preview'>
  //       <img 
  //         src={URL.createObjectURL(newStudent.profilePicture)} 
  //         alt="Profile Picture Preview" 
  //         className="preview-image"
  //       />
  //       <button 
  //         type="button"
  //         onClick={() => {
  //           setNewStudent(prevData => ({ 
  //             ...prevData, 
  //             profilePicture: null 
  //           }));
  //         }} 
  //         className="remove-image-btn"
  //       >
  //         Remove
  //       </button>
  //     </div>
  //   ) : (
  //     <label htmlFor="profilePictureUpload" className="upload-placeholder">
  //       <div className="upload-icon">+</div>
  //       Click to upload profile picture
  //     </label>
  //   )}
  // </div>
  //        </div>

  //         <div className="form-row">
  //           <div className="form-group">
  //             <label>Date of Birth</label>
  //             <input 
  //               type="date" 
  //               value={newStudent.dateOfBirth}
  //               onChange={(e) => setNewStudent({...newStudent, dateOfBirth: e.target.value})}
  //               required 
  //             />
  //           </div>
  //           <div className="form-group">
  //             <label>Age</label>
  //             <input 
  //               type="number" 
  //               value={newStudent.age}
  //               onChange={(e) => setNewStudent({...newStudent, age: e.target.value})}
  //               min="17"
  //               max="35"
  //               required 
  //             />
  //           </div>
  //         </div>
  //       </div>

  //       {/* Contact Information */}
  //       <div className="form-section">
  //         <h3>Contact Information</h3>
  //         <div className="form-row">
  //           <div className="form-group">
  //             <label>Email Address</label>
  //             <input 
  //               type="email" 
  //               value={newStudent.email}
  //               onChange={(e) => setNewStudent({...newStudent, email: e.target.value})}
  //               placeholder="Enter email address"
  //               required 
  //             />
  //           </div>
  //           <div className="form-group">
  //             <label>Phone Number</label>
  //             <input 
  //               type="tel" 
  //               value={newStudent.phoneNumber}
  //               onChange={(e) => setNewStudent({...newStudent, phoneNumber: e.target.value})}
  //               placeholder="Enter phone number"
  //               pattern="[0-9]{11}"
  //               required 
  //             />
  //           </div>
  //           <div className="form-group">
  //             <label>Address</label>
  //             <input 
  //               type="text" 
  //               value={newStudent.address}
  //               onChange={(e) => setNewStudent({...newStudent, address:e.target.value})}
  //               placeholder="Enter address"
          
  //               required 
  //             />
  //           </div>
  //         </div>

  //         <div className="form-row">
  //           <div className="form-group">
  //             <label>Alternative Contact Number</label>
  //             <input 
  //               type="tel" 
  //               value={newStudent.alternatePhoneNumber}
  //               onChange={(e) => setNewStudent({...newStudent, alternatePhoneNumber: e.target.value})}
  //               placeholder="Enter alternative phone number"
  //             />
  //           </div>
  //           <div className="form-group">
  //             <label>Preferred Communication Method</label>
  //             <select 
  //               value={newStudent.communicationPreference}
  //               onChange={(e) => setNewStudent({...newStudent, communicationPreference: e.target.value})}
  //               required
  //             >
  //               <option value="">Select Preference</option>
  //               <option value="Email">Email</option>
  //               <option value="Phone">Phone</option>
  //               <option value="Both">Both</option>
  //             </select>
  //           </div>
  //         </div>
  //       </div>

  //       {/* Academic Information */}
  //       <div className="form-section">
  //         <h3>Academic Information</h3>
  //         <div className="form-row">
  //           <div className="form-group">
  //             <label>Registration Number</label>
  //             <input 
  //               type="text" 
  //               value={newStudent.registrationNumber}
  //               onChange={(e) => setNewStudent({...newStudent, registrationNumber: e.target.value})}
  //               placeholder="Enter registration number"
  //               required 
  //             />
  //           </div>
  //           <div className="form-group">
  //             <label>Department</label>
  //             <select 
  //               value={newStudent.department}
  //               onChange={(e) => setNewStudent({...newStudent, department: e.target.value})}
  //               required
  //             >
  //               <option value="">Select Department</option>
  //               <option value="Computer Science">Computer Science</option>
  //               <option value="Engineering">Engineering</option>
  //               <option value="Business Administration">Business Administration</option>
  //               <option value="Social Sciences">Social Sciences</option>
  //             </select>
  //           </div>
  //         </div>

  //         <div className="form-row">
  //           <div className="form-group">
  //             <label>Academic Session</label>
  //             <input 
  //               type="text" 
  //               value={newStudent.session}
  //               onChange={(e) => setNewStudent({...newStudent, session: e.target.value})}
  //               placeholder="e.g., 2019-2020"
  //               required 
  //             />
  //           </div>
  //           <div className="form-group">
  //             <label>Current Year/Semester</label>
  //             <select 
  //               value={newStudent.currentYear}
  //               onChange={(e) => setNewStudent({...newStudent, currentYear: e.target.value})}
  //               required
  //             >
  //               <option value="">Select Current Year</option>
  //               <option value="1st Year">1st Year</option>
  //               <option value="2nd Year">2nd Year</option>
  //               <option value="3rd Year">3rd Year</option>
  //               <option value="4th Year">4th Year</option>
  //             </select>
  //           </div>
  //         </div>
  //       </div>

  //       <button type="submit" className="submit-btn">Enroll Student</button>
  //     </form>
  //   </div>
  // );



 const renderSessions = () => (
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
                onChange={(e) => setNewSession({...newSession, studentId: e.target.value})}
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
                onChange={(e) => setNewSession({...newSession, type: e.target.value})}
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
                onChange={(e) => setNewSession({...newSession, date: e.target.value})}
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>

            {newSession.date && (
            <div className="form-group">
              <label>Available Time Slots</label>
              {loading ? (
                <p>Loading available time slots...</p>
              ) : availableTimeSlots.length > 0 ? (
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
                onChange={(e) => setNewSession({...newSession, duration: e.target.value})}
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
                onChange={(e) => setNewSession({...newSession, description: e.target.value})}
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
                    onClick={() => handleUpdateSession(session._id, 'completed')}
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

 const renderSeminars = () => {
  // compute “today midnight”
  const today = new Date()
  today.setHours(0,0,0,0)

  // filter out past seminars
  const upcoming = seminars.filter(s => new Date(s.date) >= today)

  return (
    <div className="seminars-section">

      {/* HEADER + LIST: only render when modal closed */}
      {!showModal && (
        <>
          <div className="seminars-header">
            <h2>Upcoming Mental Health Seminars</h2>
            <button
              className="add-seminar-btn"
              onClick={() => setShowModal(true)}
            >
              + Add New Seminar
            </button>
          </div>

          <div className="seminars-list">
            {upcoming.length > 0 ? (
              <div className="seminar-cards">
                {upcoming.map((s) => (
                  <div key={s._id} className="seminar-card">
                    <h4>{s.title}</h4>
                    <p>{s.description}</p>
                    <div className="seminar-details">
                      <p><strong>Date:</strong> {new Date(s.date).toLocaleDateString()}</p>
                      <p><strong>Time:</strong> {s.time}</p>
                      <p><strong>Location:</strong> {s.location}</p>
                      <p><strong>Participants:</strong> {s.registeredParticipants}/{s.maxParticipants}</p>
                    </div>
                    <button
                      className="delete-button"
                      onClick={() => handleDeleteSeminar(s._id)}
                    >
                      <FaTrash className="delete-icon" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p>No upcoming seminars</p>
            )}
          </div>
        </>
      )}

      {/* MODAL: only render when showModal === true */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button
              className="modal-close"
              onClick={() => setShowModal(false)}
            >
              ×
            </button>
            <form onSubmit={handleCreateSeminar} className="create-seminar-form">
              <h3>Create New Seminar</h3>
              {error && <p className="error">{error}</p>}

              {/* your form fields */}
              <div className="modal-form-group">
                <label>Title</label>
                <input
                  type="text"
                  value={newSeminar.title}
                  onChange={e => setNewSeminar({ ...newSeminar, title: e.target.value })}
                  required
                />
              </div>

              <div className="modal-form-group">
                <label>Description</label>
                <textarea
                  value={newSeminar.description}
                  onChange={e => setNewSeminar({ ...newSeminar, description: e.target.value })}
                  required
                />
              </div>

              <div className="modal-form-row">
                <div className="modal-form-group">
                  <label>Date</label>
                  <input
                    type="date"
                    value={newSeminar.date}
                    onChange={e => setNewSeminar({ ...newSeminar, date: e.target.value })}
                    required
                  />
                </div>
                <div className="modal-form-group">
                  <label>Time</label>
                  <input
                    type="time"
                    value={newSeminar.time}
                    onChange={e => setNewSeminar({ ...newSeminar, time: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="modal-form-group">
                <label>Location</label>
                <input
                  type="text"
                  value={newSeminar.location}
                  onChange={e => setNewSeminar({ ...newSeminar, location: e.target.value })}
                  required
                />
              </div>

              <div className="modal-form-group">
                <label>Maximum Participants</label>
                <input
                  type="number"
                  min="1"
                  value={newSeminar.maxParticipants}
                  onChange={e => setNewSeminar({
                    ...newSeminar,
                    maxParticipants: parseInt(e.target.value) || ''
                  })}
                  required
                />
              </div>

              <button
                type="submit"
                className="create-seminar-btn"
                disabled={loading}
              >
                {loading ? 'Saving…' : 'Create Seminar'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
  
 const renderMessages = () => {
  const filteredStudents = students.filter(s =>
    s.personalInfo.name.toLowerCase().includes(chatSearch.toLowerCase())
  );

  return (
    <div className="messages-section">
      {/* LEFT: Student List */}
      <div className="students-list">
        <h3>Student Conversations</h3>

        {/* ✅ Search Box inserted carefully */}
        <div className="chat-search">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search students..."
            value={chatSearch}
            onChange={e => setChatSearch(e.target.value)}
            className="search-input"
          />
        </div>

        {/* ✅ Map filtered students only */}
        {filteredStudents.map(student => {
          const thread = messages[student.userId] || [];
          const unreadCount = thread.filter(
            m => !m.read && String(m.sender._id || m.sender) === String(student.userId)
          ).length;

          return (
            <div
              key={student.userId}
              className={`student-chat-item ${activeChat?.userId === student.userId ? 'active' : ''}`}
              onClick={() => setActiveChat(student)}
            >
              <div className="student-info">
                <h4>{student.personalInfo.name}</h4>
                <p>{student.academicInfo.department}</p>
              </div>
              {unreadCount > 0 && <span className="unread-badge">{unreadCount}</span>}
            </div>
          );
        })}
      </div>

      {/* RIGHT: Chat Area */}
      <div className="chat-area">
        {!activeChat ? (
          <div className="no-chat-selected">Select a student to start chatting</div>
        ) : (
          <>
            <div className="chat-header">
              <h3>{activeChat.personalInfo.name}</h3>
              <p>
                {activeChat.academicInfo.department} -{' '}
                {activeChat.academicInfo.registrationNumber}
              </p>
            </div>

            <div className="chat-messages">
              {(messages[activeChat.userId] || []).map(msg => {
                const senderId = msg.sender._id ? msg.sender._id : msg.sender;
                const fromMe = String(senderId) === String(meId);

                return (
                  <div
                    key={msg._id}
                    className={`message ${fromMe ? 'sent' : 'received'}`}
                  >
                    <div className="message-header">
                      {fromMe ? 'You' : activeChat.personalInfo.name}
                    </div>
                    <div className="message-content">{msg.content}</div>
                    <div className="message-time">
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <div className="chat-input">
              <textarea
                value={drafts[activeChat.userId] || ''}
                onChange={handleDraftChange}
                placeholder="Type your message…"
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />
              <button
                onClick={handleSendMessage}
                disabled={!(drafts[activeChat.userId] || '').trim()}
              >
                Send
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

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
        return (<PsychologyStudentEnrollment/>);
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
        case 'messages':
        return renderMessages();
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
          <li className={activeSection === 'messages' ? 'active' : ''}>
            <button onClick={() => setActiveSection('messages')}>
                <FaCommentDots /> Messages
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
            {activeSection === 'overview' && (<PsychologistOverview profile={profile} />)}
            {activeSection === 'profile' && (
              <PsychologistProfile
                profile={profile}
                loading={false}
                error={error}
                onProfileUpdate={handleProfileUpdate}
              />
            )}
            {activeSection === 'sessions' && renderSessions()}
            {activeSection === 'students' && <PsychologyStudentEnrollment/>}
            {activeSection === 'seminars' && renderSeminars()}
            {activeSection === 'messages' && renderMessages()}
          </>
        )}
      </main>
    </div>
  );
};

export default PsychologistDashboard;