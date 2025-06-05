import React, { useState, useEffect } from 'react';
import '../styles/PsychologistProfile.css';

const defaultProfile = {
  personalInfo: {
    name: '',
    gender: '',
    dateOfBirth: '',
    profileImage: '',
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

export const PsychologistProfile = ({ 
  profile, 
  loading, 
  error, 
  onProfileUpdate 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState(defaultProfile);



  useEffect(() => {
    if (profile && typeof profile === 'object') {
      const sanitizedProfile = {
        personalInfo: {
          name: sanitizeValue(profile.personalInfo?.name),
          gender: sanitizeValue(profile.personalInfo?.gender),
          dateOfBirth: sanitizeValue(profile.personalInfo?.dateOfBirth),
          profileImage: sanitizeValue(profile.personalInfo?.profileImage),
        },
        professionalInfo: {
          specialization: sanitizeValue(profile.professionalInfo?.specialization),
          qualifications: sanitizeValue(profile.professionalInfo?.qualifications),
          yearsOfExperience: sanitizeValue(profile.professionalInfo?.yearsOfExperience),
        },
        contactInfo: {
          email: sanitizeValue(profile.contactInfo?.email),
          phoneNumber: sanitizeValue(profile.contactInfo?.phoneNumber),
          officeLocation: sanitizeValue(profile.contactInfo?.officeLocation),
        },
        availabilitySchedule: Array.isArray(profile.availabilitySchedule) 
          ? profile.availabilitySchedule.map(slot => ({
              day: sanitizeValue(slot.day),
              startTime: sanitizeValue(slot.startTime),
              endTime: sanitizeValue(slot.endTime)
            }))
          : []
      };
      setEditedProfile(sanitizedProfile);
    }
  }, [profile]);

  useEffect(() => {
    if (profile && typeof profile === 'object') {
      setEditedProfile(profile);
    }
  }, [profile]);
  const handleProfileUpdate = (e) => {
    e.preventDefault();
    onProfileUpdate(editedProfile, () => setIsEditing(false));
  };

  if (loading) {
    return <div className="loading-spinner">Loading profile...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="psychologist-profile-container">
      <div className="profile-header">
        <h2>Psychologist Profile</h2>
        <button 
          onClick={() => setIsEditing(!isEditing)}
          className="edit-profile-btn"
        >
          {isEditing ? 'Cancel' : 'Edit Profile'}
        </button>
      </div>

      {isEditing ? (
        <ProfileEditForm 
          editedProfile={editedProfile}
          setEditedProfile={setEditedProfile}
          handleProfileUpdate={handleProfileUpdate}
        />
      ) : (
        <ProfileView profile={editedProfile} />
      )}
    </div>
  );
};

const ProfileView = ({ profile }) => {
  
  if (!profile || typeof profile !== 'object') {
    return <div className="error-message">Invalid profile data</div>;
  }

  return (
    <div className="profile-view">
      <section className="profile-section">
        <h3>Personal Information</h3>
        <div className="info-group">
          <p><strong>Name:</strong> {sanitizeValue(profile.personalInfo?.name) || 'Not specified'}</p>
          <p><strong>Gender:</strong> {sanitizeValue(profile.personalInfo?.gender) || 'Not specified'}</p>
          <p><strong>Date of Birth:</strong> {sanitizeValue(profile.personalInfo?.dateOfBirth) || 'Not specified'}</p>
          <p><strong>profileImage:</strong>{sanitizeValue(profile.profileImage) || 'Not specified'}</p>
        </div>
      </section>

      <section className="profile-section">
        <h3>Professional Information</h3>
        <div className="info-group">
          <p><strong>Specialization:</strong> {sanitizeValue(profile.professionalInfo?.specialization) || 'Not specified'}</p>
          <p><strong>Qualifications:</strong> {sanitizeValue(profile.professionalInfo?.qualifications) || 'Not specified'}</p>
          <p><strong>Years of Experience:</strong> {sanitizeValue(profile.professionalInfo?.yearsOfExperience) || 'Not specified'}</p>
        </div>
      </section>

      <section className="profile-section">
        <h3>Contact Information</h3>
        <div className="info-group">
          <p><strong>Email:</strong> {sanitizeValue(profile.contactInfo?.email) || 'Not specified'}</p>
          <p><strong>Phone:</strong> {sanitizeValue(profile.contactInfo?.phoneNumber) || 'Not specified'}</p>
          <p><strong>Office Location:</strong> {sanitizeValue(profile.contactInfo?.officeLocation) || 'Not specified'}</p>
        </div>
      </section>

      <section className="profile-section">
        <h3>Availability Schedule</h3>
        <div className="schedule-list">
          {Array.isArray(profile.availabilitySchedule) && profile.availabilitySchedule.length > 0 ? (
            profile.availabilitySchedule.map((slot, index) => (
              <div key={index} className="schedule-item">
                <p>{sanitizeValue(slot.day)}: {sanitizeValue(slot.startTime)} - {sanitizeValue(slot.endTime)}</p>
              </div>
            ))
          ) : (
            <p>No availability schedule set</p>
          )}
        </div>
      </section>
    </div>
  );
};

const ProfileEditForm = ({
  editedProfile,
  setEditedProfile,
  handleProfileUpdate
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const handleInputChange = (section, field, value) => {
    setEditedProfile(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: sanitizeValue(value)
      }
    }));
  };

  return (
    <form onSubmit={handleProfileUpdate} className="profile-form">
       <div className="profile-picture-section">
          <div className="profile-picture-upload">
            <label className="profile-picture-label">Profile Picture</label>
            <input 
              type="file" 
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files[0];
                const reader = new FileReader();
                reader.onloadend = () => {
                  handleInputChange('personalInfo', 'profileImage', {
                    file: file,
                    preview: reader.result
                  });
                };
                reader.readAsDataURL(file);
              }}
              className="profile-picture-input"
              id="profilePictureUpload"
            />
            {editedProfile.personalInfo.profileImage ? (
              <div className='profile-picture-preview'>
                <img 
                  src={
                    typeof editedProfile.personalInfo.profileImage === 'object' 
                      ? editedProfile.personalInfo.profileImage.preview 
                      : editedProfile.personalInfo.profileImage
                  }
                  alt="Profile Picture Preview" 
                  className="preview-image"
                />
                <button 
                  type="button"
                  onClick={() => {
                    handleInputChange('personalInfo', 'profileImage', null);
                  }} 
                  className="remove-image-btn"
                >
                  Remove
                </button>
              </div>
            ) : (
              <label htmlFor="profilePictureUpload" className="upload-placeholder">
                <div className="upload-icon">+</div>
                Click to upload profile picture
              </label>
            )}
          </div>
        </div>
      <div className="form-section">
        <h3>Personal Information</h3>
        <div className="form-row">
          <div className="form-group">
            <label>Name</label>
            <input
              type="text"
              value={editedProfile.personalInfo.name}
              onChange={(e) => handleInputChange('personalInfo', 'name', e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Gender</label>
            <select
              value={editedProfile.personalInfo.gender}
              onChange={(e) => handleInputChange('personalInfo', 'gender', e.target.value)}
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
              value={editedProfile.personalInfo.dateOfBirth}
              onChange={(e) => handleInputChange('personalInfo', 'dateOfBirth', e.target.value)}
              required
            />
          </div>
        </div>
      </div>

      <div className="form-section">
        <h3>Professional Information</h3>
        <div className="form-row">
          <div className="form-group">
            <label>Specialization</label>
            <input
              type="text"
              value={editedProfile.professionalInfo.specialization}
              onChange={(e) => handleInputChange('professionalInfo', 'specialization', e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Qualifications</label>
            <input
              type="text"
              value={editedProfile.professionalInfo.qualifications}
              onChange={(e) => handleInputChange('professionalInfo', 'qualifications', e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Years of Experience</label>
            <input
              type="number"
              value={editedProfile.professionalInfo.yearsOfExperience}
              onChange={(e) => handleInputChange('professionalInfo', 'yearsOfExperience', e.target.value)}
              min="0"
              required
            />
          </div>
        </div>
      </div>

      <div className="form-section">
        <h3>Contact Information</h3>
        <div className="form-row">
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={editedProfile.contactInfo.email}
              onChange={(e) => handleInputChange('contactInfo', 'email', e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Phone Number</label>
            <input
              type="tel"
              value={editedProfile.contactInfo.phoneNumber}
              onChange={(e) => handleInputChange('contactInfo', 'phoneNumber', e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Office Location</label>
            <input
              type="text"
              value={editedProfile.contactInfo.officeLocation}
              onChange={(e) => handleInputChange('contactInfo', 'officeLocation', e.target.value)}
              required
            />
          </div>
        </div>
      </div>

      <div className="form-actions">
          <button 
            type="button" 
            onClick={() => setIsEditing(false)} 
            className="cancel-btn"
          >
            Cancel
          </button>
          <button type="submit" className="update-profile-btn">
            Update Profile
          </button>
        </div>
    </form>
  );
};