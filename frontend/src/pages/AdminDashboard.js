import React, { useState, useEffect, useRef } from 'react';
import api from '../utils/api';
import '../styles/AdminDashboard.css';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from 'react-toastify';


const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [psychologists, setPsychologists] = useState([]);
  const [activeTab, setActiveTab] = useState('users');
  const [adminProfile, setAdminProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // New state for enrollment modal
  const [isEnrollmentModalOpen, setIsEnrollmentModalOpen] = useState(false);
  const [enrollmentFormData, setEnrollmentFormData] = useState({
    personalInfo: {
      name: '',
      gender: '',
      dateOfBirth: '',
      bio: ''
    },
    professionalInfo: {
      specialization: '',
      qualifications: [{ 
        uniqueId: `qual-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        degree: '', 
        institution: '', 
        year: '' 
      }],
      yearsOfExperience: 0,
      expertise: [],
      languages: []
    },
    contactInfo: {
      email: '',
      phoneNumber: '',
      officeLocation: ''
    }
  });
  const fileInputRef = useRef(null);
  useEffect(() => {
    fetchAdminProfile();
    if (activeTab === 'users') {
      fetchUsers();
    } else if (activeTab === 'psychologists') {
      fetchPsychologists();
    }
  }, [activeTab]);


  const fetchAdminProfile = async () => {
    try {
      setLoading(true);
      const response = await api.admin.getProfile();
      setAdminProfile(response.data);
    } catch (error) {
      setError('Error fetching admin profile: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.admin.getUsers();
      setUsers(response.data);
    } catch (error) {
      setError('Error fetching users: ' + error.message);
    } finally {
      setLoading(false);
    }
  };



  const fetchPsychologists = async () => {
    try {
      setLoading(true);
      const response = await api.admin.getPsychologists();
      setPsychologists(response.data);
    } catch (error) {
      setError('Error fetching psychologists: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUserStatus = async (userId, newStatus) => {
    try {
      setLoading(true);
      await api.admin.updateUserStatus(userId, { status: newStatus });
      fetchUsers(); // Refresh user list
      setError(null);
    } catch (error) {
      setError('Error updating user status: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePsychologistStatus = async (psychologistId, newStatus) => {
    try {
      setLoading(true);
      await api.admin.updatePsychologistProfile(psychologistId, { status: newStatus });
      fetchPsychologists(); // Refresh psychologist list
      setError(null);
    } catch (error) {
      setError('Error updating psychologist status: ' + error.message);
    } finally {
      setLoading(false);
    }
  };



  const handleEnrollmentInputChange = (e) => {
    const { name, value } = e.target;
    const [section, field] = name.split('.');
    
    setEnrollmentFormData(prev => {
      const updated = { ...prev };
      if (section === 'personalInfo' || section === 'contactInfo') {
        updated[section][field] = value;
      } else if (section === 'professionalInfo') {
        updated.professionalInfo[field] = value;
      } else {
        updated[name] = value;
      }
      return updated;
    });
  };
  const handleQualificationChange = (index, e) => {
    const { name, value } = e.target;
    const updatedQualifications = [...enrollmentFormData.professionalInfo.qualifications];
    updatedQualifications[index][name] = value;
    
    setEnrollmentFormData(prev => ({
      ...prev,
      professionalInfo: {
        ...prev.professionalInfo,
        qualifications: updatedQualifications
      }
    }));
  };

  const addQualification = () => {
    setEnrollmentFormData(prev => ({
      ...prev,
      professionalInfo: {
        ...prev.professionalInfo,
        qualifications: [
          ...prev.professionalInfo.qualifications, 
          { uniqueId: `qual-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          degree: '', 
          institution: '', 
          year: '' }
        ]
      }
    }));
  };

  const handlePsychologistEnrollment = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      // Create FormData for file upload
      const formData = new FormData();
      
      // Append all form data fields
      // Personal Info
      formData.append('personalInfo.name', enrollmentFormData.personalInfo.name);
      formData.append('personalInfo.gender', enrollmentFormData.personalInfo.gender);
      formData.append('personalInfo.dateOfBirth', enrollmentFormData.personalInfo.dateOfBirth);
      formData.append('personalInfo.bio', enrollmentFormData.personalInfo.bio);
      
      // Professional Info
      formData.append('professionalInfo.specialization', enrollmentFormData.professionalInfo.specialization);
      formData.append('professionalInfo.yearsOfExperience', enrollmentFormData.professionalInfo.yearsOfExperience);
      
      // Append qualifications as JSON
      formData.append('professionalInfo.qualifications', JSON.stringify(enrollmentFormData.professionalInfo.qualifications));
      
      // Append expertise and languages as JSON
      formData.append('professionalInfo.expertise', JSON.stringify(enrollmentFormData.professionalInfo.expertise));
      formData.append('professionalInfo.languages', JSON.stringify(enrollmentFormData.professionalInfo.languages));
      
      // Contact Info
      formData.append('contactInfo.email', enrollmentFormData.contactInfo.email);
      formData.append('contactInfo.phoneNumber', enrollmentFormData.contactInfo.phoneNumber);
      formData.append('contactInfo.officeLocation', enrollmentFormData.contactInfo.officeLocation);
      
      // Append profile picture if exists
      if (enrollmentFormData.profilePicture) {
        formData.append('profilePicture', enrollmentFormData.profilePicture);
      }
      
      // Modify the API call to support FormData
      const response = await api.admin.enrollPsychologist(formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Add new psychologist to the list if we're on the psychologists tab
      if (activeTab === 'psychologists') {
        setPsychologists(prev => [...prev, response.data.psychologist]);
      }
      
      toast.success("Psychologist Enrollment Successful!");
      
      // Reset form and close modal
      setEnrollmentFormData({
        personalInfo: {
          name: '',
          gender: '',
          dateOfBirth: '',
          bio: '',
          profileImage: ''
        },
        professionalInfo: {
          specialization: '',
          qualifications: [{ degree: '', institution: '', year: '' }],
          yearsOfExperience: 0,
          expertise: [],
          languages: []
        },
        contactInfo: {
          email:'',
          phoneNumber: '',
          officeLocation: ''
        },
        profilePicture: null // Reset profile picture
      });
      
      setIsEnrollmentModalOpen(false);
      setError(null);
    } catch (error) {
      setError('Error enrolling psychologist: ' + error.message);
      toast.error("Enrollment Failed! Please try again.");
    } finally {
      setLoading(false);
    }
  };


  /*const renderUserManagement = () => (
    <div className="user-management">
      <h2>User Management</h2>
      {loading ? (
        <div className="loading">Loading users...</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user._id}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{user.role}</td>
                <td>
                  <span className={`status-badge ${user.status}`}>
                    {user.status}
                  </span>
                </td>
                <td>
                  <button
                    onClick={() => handleUpdateUserStatus(
                      user._id,
                      user.status === 'active' ? 'suspended' : 'active'
                    )}
                    className={user.status === 'active' ? 'suspend-btn' : 'activate-btn'}
                  >
                    {user.status === 'active' ? 'Suspend' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
  */
  const renderPsychologistManagement = () => (
    
    <div className="psychologist-management">
      <div className="management-header">
        <h2>Psychologist Management</h2>
        <button 
          onClick={() => setIsEnrollmentModalOpen(true)}
          className="enroll-psychologist-btn"
        >
          Enroll New Psychologist
        </button>
      </div>
      
      {loading ? (
        <div className="loading">Loading psychologists...</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Specialization</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {psychologists.map(psych => (
              <tr key={psych._id}>
                <td>{psych.personalInfo?.name}</td>
                <td>{psych.contactInfo?.email}</td>
                <td>{psych.professionalInfo?.specialization}</td>
                <td>
                  <span className={`status-badge ${psych.status}`}>
                    {psych.status}
                  </span>
                </td>
                <td>
                  <button
                    onClick={() => handleUpdatePsychologistStatus(
                      psych._id ,
                      psych.status === 'active' ? 'suspended' : 'active'
                    )}
                    className={psych.status === 'active' ? 'suspend-btn' : 'activate-btn'}
                  >
                    {psych.status === 'active' ? 'Suspend' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      
      {/* Psychologist Enrollment Modal */}
      {isEnrollmentModalOpen && (
  <div className="psychologist-enrollment-modal">
    <div className="psychologist-enrollment-modal-content">
      <form 
        onSubmit={handlePsychologistEnrollment} 
        className="psychologist-enrollment-form"
      >
        {/* Modal Header */}
        <h3>Enroll New Psychologist</h3>
        
        {/* Error Handling */}
        {error && <div className="error-message">{error}</div>}
        
        {/* Login Credentials Section */}
        <div className="form-section login-credentials">
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="contactInfo.email"
              value={enrollmentFormData.contactInfo.email}
              onChange={handleEnrollmentInputChange}
              required
            />
          </div>
          <div className="form-section profile-picture">
  <div className="form-group">
    <label>Profile Picture</label>
    <div className="file-upload-container">
      <input
        type="file"
        name="profilePicture"
        accept="image/jpeg,image/png,image/gif,image/webp"
        onChange={(e) => {
          const file = e.target.files[0];
          setEnrollmentFormData(prevData => ({
            ...prevData,
            profilePicture: file
          }));
        }}
        className="file-input"
      />
      {enrollmentFormData.profilePicture ? (
        <div className="file-preview">
          <img 
            src={URL.createObjectURL(enrollmentFormData.profilePicture)} 
            alt="Profile Preview" 
            className="preview-image"
          />
          <button 
            type="button" 
            onClick={() => {
              setEnrollmentFormData(prevData => ({
                ...prevData,
                profilePicture: null
              }));
              // Reset file input
              if (fileInputRef.current) {
                fileInputRef.current.value = '';
              }
            }}
            className="remove-image-btn"
          >
            Remove
          </button>
        </div>
      ) : (
        <div className="file-upload-placeholder">
          Click to upload profile picture
        </div>
      )}
    </div>
  </div>
</div>
        </div>


        {/* Personal Information Section */}
        <div className="form-section personal-info">
          <div className="form-group">
            <label>Name</label>
            <input
              type="text"
              name="personalInfo.name"
              value={enrollmentFormData.personalInfo.name}
              onChange={handleEnrollmentInputChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Gender</label>
            <select
              name="personalInfo.gender"
              value={enrollmentFormData.personalInfo.gender}
              onChange={handleEnrollmentInputChange}
              required
            >
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="form-group">
            <label>Date of Birth</label>
            <input
              type="date"
              name="personalInfo.dateOfBirth"
              value={enrollmentFormData.personalInfo.dateOfBirth}
              onChange={handleEnrollmentInputChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Bio</label>
            <textarea
              name="personalInfo.bio"
              value={enrollmentFormData.personalInfo.bio}
              onChange={handleEnrollmentInputChange}
              maxLength={500}
            />
          </div>
        </div>

        {/* Professional Information Section */}
        <div className="form-section professional-info">
          <div className="form-group">
            <label>Specialization</label>
            <input
              type="text"
              name="professionalInfo.specialization"
              value={enrollmentFormData.professionalInfo.specialization}
              onChange={handleEnrollmentInputChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Years of Experience</label>
            <input
              type="number"
              name="professionalInfo.yearsOfExperience"
              value={enrollmentFormData.professionalInfo.yearsOfExperience}
              onChange={handleEnrollmentInputChange}
              min="0"
            />
          </div>

          {/* Qualifications Subsection */}
          <div className="qualifications-section">
            <h4>Qualifications</h4>
            <button 
              type="button"
              onClick={addQualification}
              className="add-qualification-btn"
            >
              Add Qualification
            </button>
            {enrollmentFormData.professionalInfo.qualifications.map((qual, index) => (
              <div 
                key={qual.uniqueId || `qualification-${index}`} 
                className="qualification-row"
              >
                <input
                  type="text"
                  name="degree"
                  placeholder="Degree"
                  value={qual.degree}
                  onChange={(e) => handleQualificationChange(index, e)}
                  required
                />
                <input
                  type="text"
                  name="institution"
                  placeholder="Institution"
                  value={qual.institution}
                  onChange={(e) => handleQualificationChange(index, e)}
                  required
                />
                <input
                  type="number"
                  name="year"
                  placeholder="Year"
                  value={qual.year}
                  onChange={(e) => handleQualificationChange(index, e)}
                  required
                />
              </div>
            ))}
          </div>
        </div>

        {/* Contact Information Section */}
        <div className="form-section contact-info">
          <div className="form-group">
            <label>Phone Number</label>
            <input
              type="tel"
              name="contactInfo.phoneNumber"
              value={enrollmentFormData.contactInfo.phoneNumber}
              onChange={handleEnrollmentInputChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Office Location</label>
            <input
              type="text"
              name="contactInfo.officeLocation"
              value={enrollmentFormData.contactInfo.officeLocation}
              onChange={handleEnrollmentInputChange}
            />
          </div>
        </div>

        {/* Modal Actions */}
        <div className="modal-actions">
          <button 
            type="button"
            className="cancel-btn"
            onClick={() => setIsEnrollmentModalOpen(false)}
          >
            Cancel
          </button>
          <button 
            type="submit"
            className="submit-btn"
            disabled={loading}
          >
            {loading ? 'Enrolling...' : 'Enroll Psychologist'}
          </button>
        </div>
      </form>
    </div>
  </div>
)}
  </div>
);


const renderAdminProfile = () => (
  <div className="admin-profile">
    <h2>Admin Profile</h2>
    {loading ? (
      <div className="loading">Loading profile...</div>
    ) : adminProfile ? (
      <div className="profile-details">
        <div className="profile-picture">
          <img src={adminProfile.profilePicture || 'default-avatar.jpg'} alt="Admin Profile" />
        </div>
        <div className="profile-info">
          <p><strong>Name:</strong> {adminProfile.name}</p>
          <p><strong>Email:</strong> {adminProfile.email}</p>
          <p><strong>Role:</strong> {adminProfile.role}</p>
          <p><strong>Last Login:</strong> {adminProfile.lastLogin}</p>
          <p><strong>Account Created:</strong> {adminProfile.createdAt}</p>
          <p><strong>Contact:</strong> {adminProfile.phoneNumber}</p>
          <p><strong>Permissions:</strong></p>
          <ul>
            {adminProfile.permissions?.map((permission, index) => (
              <li key={`permission-${index}-${permission}`}>
                {permission}
              </li>
            ))}
          </ul>
          <div className="recent-activity">
            <h4>Recent Activity</h4>
            <ul>
              {adminProfile.recentActivity?.slice(0, 3).map((activity, index) => (
                <li key={`activity-${index}`}>{activity}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    ) : (
      <p>No profile data available</p>
    )}
  </div>
);

  return (
    <div>  <ToastContainer position="top-right" autoClose={3000} />
    <div className="admin-dashboard">
      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}
      <div className="sidebar">
        <button
          className={activeTab === 'psychologists' ? 'active' : ''}
          onClick={() => setActiveTab('psychologists')}
        >
          Psychologists
        </button>
        <button
          className={activeTab === 'profile' ? 'active' : ''}
          onClick={() => setActiveTab('profile')}
        >
          Profile
        </button>
      </div>
      <div className="main-content">

        {activeTab === 'psychologists' && renderPsychologistManagement()}
        {activeTab === 'profile' && renderAdminProfile()}
      </div>
    </div>
    </div>
  );
};

export default AdminDashboard;