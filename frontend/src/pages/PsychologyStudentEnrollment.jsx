import React, { useState, useCallback } from 'react';
import { User, Mail, Phone, MapPin, Calendar, GraduationCap, FileText, Camera, Check } from 'lucide-react';

import api from '../utils/api';
import { toast } from 'react-toastify';


const PsychologyEnrollmentForm = () => {

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isEnrollmentModalOpen, setIsEnrollmentModalOpen] = useState(false);

  const [newStudent, setNewStudent] = useState({
    name: '',
    gender: '',
    profilePicture: null,
    dateOfBirth: '',
    age: '',
    email: '',
    phoneNumber: '',
    address: '',
    alternatePhoneNumber: '',
    communicationPreference: '',
    registrationNumber: '',
    department: '',
    session: '',
    currentYear: ''
  });

  const [currentSection, setCurrentSection] = useState(0);
  const [completedSections, setCompletedSections] = useState(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [students, setStudents] = useState([]);

  const sections = [
    { title: 'Personal Information', icon: User },
    { title: 'Contact Information', icon: Mail },
    { title: 'Academic Information', icon: GraduationCap }
  ];

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
  }, []);

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


  const validateSection = (sectionIndex) => {
    switch (sectionIndex) {
      case 0:
        return newStudent.name && newStudent.gender && newStudent.dateOfBirth && newStudent.age;
      case 1:
        return newStudent.email && newStudent.phoneNumber && newStudent.address && newStudent.communicationPreference;
      case 2:
        return newStudent.registrationNumber && newStudent.department && newStudent.session && newStudent.currentYear;
      default:
        return false;
    }
  };

  const nextSection = () => {
    if (validateSection(currentSection)) {
      setCompletedSections(prev => new Set([...prev, currentSection]));
      if (currentSection < sections.length - 1) {
        setCurrentSection(currentSection + 1);
      }
    }
  };

  const prevSection = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
    }
  };

  const renderPersonalInformation = () => (
    <div className="section-content">
      <div className="profile-section">
        <div className="profile-picture-container">
          <div className="profile-picture-upload">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setNewStudent({ ...newStudent, profilePicture: e.target.files[0] })}
              className="profile-picture-input"
              id="profilePictureUpload"
            />
            {newStudent.profilePicture ? (
              <div className='profile-picture-preview'>
                <img
                  src={URL.createObjectURL(newStudent.profilePicture)}
                  alt="Profile Picture Preview"
                  className="preview-image"
                />
                <button
                  type="button"
                  onClick={() => setNewStudent(prev => ({ ...prev, profilePicture: null }))}
                  className="remove-image-btn"
                  aria-label="Remove image"
                >
                  ×
                </button>
              </div>
            ) : (
              <label htmlFor="profilePictureUpload" className="upload-placeholder">
                <Camera size={32} />
                <span>Upload Photo</span>
              </label>
            )}
          </div>
        </div>
      </div>

      <div className="form-grid">
        <div className="input-group">
          <label className="input-label">
            <User size={18} />
            Full Name
          </label>
          <input
            type="text"
            value={newStudent.name}
            onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
            placeholder="Enter your full name"
            className="form-input"
            required
          />
        </div>

        <div className="input-group">
          <label className="input-label">
            <User size={18} />
            Gender
          </label>
          <select
            value={newStudent.gender}
            onChange={(e) => setNewStudent({ ...newStudent, gender: e.target.value })}
            className="form-select"
            required
          >
            <option value="">Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
            <option value="Prefer not to say">Prefer not to say</option>
          </select>
        </div>

        <div className="input-group">
          <label className="input-label">
            <Calendar size={18} />
            Date of Birth
          </label>
          <input
            type="date"
            value={newStudent.dateOfBirth}
            onChange={(e) => setNewStudent({ ...newStudent, dateOfBirth: e.target.value })}
            className="form-input"
            required
          />
        </div>

        <div className="input-group">
          <label className="input-label">
            <Calendar size={18} />
            Age
          </label>
          <input
            type="number"
            value={newStudent.age}
            onChange={(e) => setNewStudent({ ...newStudent, age: e.target.value })}
            min="17"
            max="35"
            placeholder="Age"
            className="form-input"
            required
          />
        </div>
      </div>
    </div>
  );

  const renderContactInformation = () => (
    <div className="section-content">
      <div className="form-grid">
        <div className="input-group full-width">
          <label className="input-label">
            <Mail size={18} />
            Email Address
          </label>
          <input
            type="email"
            value={newStudent.email}
            onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
            placeholder="your.email@example.com"
            className="form-input"
            required
          />
        </div>

        <div className="input-group">
          <label className="input-label">
            <Phone size={18} />
            Primary Phone
          </label>
          <input
            type="tel"
            value={newStudent.phoneNumber}
            onChange={(e) => setNewStudent({ ...newStudent, phoneNumber: e.target.value })}
            placeholder="Enter phone number"
            className="form-input"
            required
          />
        </div>

        <div className="input-group">
          <label className="input-label">
            <Phone size={18} />
            Alternative Phone
          </label>
          <input
            type="tel"
            value={newStudent.alternatePhoneNumber}
            onChange={(e) => setNewStudent({ ...newStudent, alternatePhoneNumber: e.target.value })}
            placeholder="Alternative number (optional)"
            className="form-input"
          />
        </div>

        <div className="input-group full-width">
          <label className="input-label">
            <MapPin size={18} />
            Address
          </label>
          <input
            type="text"
            value={newStudent.address}
            onChange={(e) => setNewStudent({ ...newStudent, address: e.target.value })}
            placeholder="Enter your complete address"
            className="form-input"
            required
          />
        </div>

        <div className="input-group">
          <label className="input-label">
            <Mail size={18} />
            Communication Preference
          </label>
          <select
            value={newStudent.communicationPreference}
            onChange={(e) => setNewStudent({ ...newStudent, communicationPreference: e.target.value })}
            className="form-select"
            required
          >
            <option value="">Select Preference</option>
            <option value="Email">Email</option>
            <option value="Phone">Phone</option>
            <option value="Both">Both Email & Phone</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderAcademicInformation = () => (
    <div className="section-content">
      <div className="form-grid">
        <div className="input-group">
          <label className="input-label">
            <FileText size={18} />
            Registration Number
          </label>
          <input
            type="text"
            value={newStudent.registrationNumber}
            onChange={(e) => setNewStudent({ ...newStudent, registrationNumber: e.target.value })}
            placeholder="Enter registration number"
            className="form-input"
            required
          />
        </div>

        <div className="input-group">
          <label className="input-label">
            <GraduationCap size={18} />
            Department
          </label>
          <select
            value={newStudent.department}
            onChange={(e) => setNewStudent({ ...newStudent, department: e.target.value })}
            className="form-select"
            required
          >
            <option value="">Select Department</option>
            <option value="Computer Science">Computer Science and Engineering</option>
            <option value="Electrical and Electronics Engineering">Electrical and Electronics Engineering</option>
            <option value="Business Administration">Business Administration</option>
            <option value="Social Sciences">Social Sciences</option>
          </select>
        </div>

        <div className="input-group">
          <label className="input-label">
            <Calendar size={18} />
            Academic Session
          </label>
          <input
            type="text"
            value={newStudent.session}
            onChange={(e) => setNewStudent({ ...newStudent, session: e.target.value })}
            placeholder="e.g., 2023-2024"
            className="form-input"
            required
          />
        </div>

        <div className="input-group">
          <label className="input-label">
            <GraduationCap size={18} />
            Current Year
          </label>
          <select
            value={newStudent.currentYear}
            onChange={(e) => setNewStudent({ ...newStudent, currentYear: e.target.value })}
            className="form-select"
            required
          >
            <option value="">Select Current Year</option>
            <option value="1st Year">1st Year</option>
            <option value="2nd Year">2nd Year</option>
            <option value="3rd Year">3rd Year</option>
            <option value="4th Year">4th Year</option>
            <option value="Master's 1st Year">Master's 1st Year</option>
            <option value="Master's 2nd Year">Master's 2nd Year</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderCurrentSection = () => {
    switch (currentSection) {
      case 0: return renderPersonalInformation();
      case 1: return renderContactInformation();
      case 2: return renderAcademicInformation();
      default: return null;
    }
  };

  return (
    <div className="enrollment-container">
      <div className="enrollment-card">
        <div className="header">
          <div className="header-content">
            <h1>Student Enrollment</h1>
            <p>Psychology Student Registration Form</p>
          </div>
        </div>

        <div className="progress-container">
          <div className="progress-steps">
            {sections.map((section, index) => {
              const Icon = section.icon;
              const isActive = index === currentSection;
              const isCompleted = completedSections.has(index);

              return (
                <div
                  key={index}
                  className={`progress-step ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                >
                  <div className="step-icon">
                    {isCompleted ? <Check size={20} /> : <Icon size={20} />}
                  </div>
                  <span className="step-label">{section.title}</span>
                </div>
              );
            })}
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${((currentSection + 1) / sections.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="enrollment-form">
          <div className="section-header">
            <h2>{sections[currentSection].title}</h2>
            <div className="section-indicator">
              Step {currentSection + 1} of {sections.length}
            </div>
          </div>

          {renderCurrentSection()}

          <div className="form-actions">
            {currentSection > 0 && (
              <button
                type="button"
                onClick={prevSection}
                className="btn btn-secondary"
              >
                Previous
              </button>
            )}

            {currentSection < sections.length - 1 ? (
              <button
                type="button"
                onClick={nextSection}
                className="btn btn-primary"
                disabled={!validateSection(currentSection)}
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleEnrollStudent}
                className="btn btn-primary submit-btn"
                disabled={!validateSection(currentSection) || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="spinner" />
                    Enrolling...
                  </>
                ) : (
                  'Complete Enrollment'
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
  /* Soothing Sea-Green Palette */
  :root {
    --sea-light:   #B3E6E2;  /* pale aqua */
    --sea-base:    #3AAFA9;  /* fresh sea-green */
    --sea-dark:    #206F6A;  /* deep teal-green */
    --off-white:   #F0F9F8;  /* very light mint */
    --border-subtle:#8ACAC3; /* soft sea-green */
    --text-dark:   #0F3D38;  /* almost black with green hint */
  }

  .enrollment-container {
    min-height: 100vh;
    background: linear-gradient(135deg, var(--sea-light) 0%, var(--sea-base) 100%);
    padding: 2rem;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  }

  .enrollment-card {
    max-width: 800px;
    margin: 0 auto;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(20px);
    border-radius: 24px;
    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, 0.2);
  }

  .header {
    background: linear-gradient(135deg, var(--sea-dark) 0%, var(--sea-base) 100%);
    padding: 3rem 2rem;
    text-align: center;
    position: relative;
    overflow: hidden;
  }

  .header::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="50" cy="50" r="1" fill="rgba(255,255,255,0.1)"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
    opacity: 0.1;
  }

  .header-content { position: relative; z-index: 1; }

  .header h1 {
    color: white;
    font-size: 2.5rem;
    font-weight: 700;
    margin: 0 0 .5rem 0;
    text-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }

  .header p {
    color: rgba(255,255,255,0.9);
    font-size: 1.1rem;
    margin: 0;
    font-weight: 300;
  }

  .progress-container {
    padding: 2rem;
    background: rgba(255,255,255,0.8);
    border-bottom: 1px solid rgba(0,0,0,0.05);
  }

  .progress-steps {
    display: flex;
    justify-content: space-between;
    margin-bottom: 1rem;
    position: relative;
  }

  .progress-step {
    display: flex;
    flex-direction: column;
    align-items: center;
    flex: 1;
    position: relative;
    transition: all 0.3s ease;
  }

  .step-icon {
    width: 48px; height: 48px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--off-white);
    color: var(--text-dark);
    transition: all 0.3s ease;
    margin-bottom: .5rem;
    border: 3px solid transparent;
  }

  .progress-step.active .step-icon {
    background: linear-gradient(135deg, var(--sea-base), var(--sea-dark));
    color: white;
    transform: scale(1.1);
    box-shadow: 0 8px 25px rgba(58,175,169,0.3);
  }

  .progress-step.completed .step-icon {
    background: linear-gradient(135deg, var(--sea-dark), var(--sea-base));
    color: white;
  }

  .step-label {
    font-size: .875rem;
    font-weight: 500;
    color: var(--text-dark);
    text-align: center;
    transition: color 0.3s ease;
  }

  .progress-step.active .step-label {
    color: var(--sea-base);
    font-weight: 600;
  }

  .progress-step.completed .step-label {
    color: var(--sea-dark);
    font-weight: 600;
  }

  .progress-bar {
    height: 4px;
    background: var(--off-white);
    border-radius: 2px;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--sea-base), var(--sea-dark));
    border-radius: 2px;
    transition: width 0.5s ease;
  }

  .enrollment-form { padding: 2rem; }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
  }

  .section-header h2 {
    font-size: 1.75rem;
    font-weight: 600;
    color: var(--text-dark);
    margin: 0;
  }

  .section-indicator {
    background: linear-gradient(135deg, var(--sea-base), var(--sea-dark));
    color: white;
    padding: .5rem 1rem;
    border-radius: 12px;
    font-size: .875rem;
    font-weight: 500;
  }

  .section-content { margin-bottom: 2rem; }

  .profile-section {
    display: flex;
    justify-content: center;
    margin-bottom: 2rem;
  }

  .upload-placeholder {
    width: 120px; height: 120px;
    border: 3px dashed var(--border-subtle);
    border-radius: 50%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s ease;
    background: rgba(255,255,255,0.8);
  }

  .upload-placeholder:hover {
    border-color: var(--sea-base);
    background: rgba(58,175,169,0.05);
    transform: scale(1.05);
  }

  .upload-placeholder span {
    font-size: .875rem;
    color: var(--text-dark);
    margin-top: .5rem;
    text-align: center;
  }

  .form-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px,1fr));
    gap: 1.5rem;
  }

  .form-input,
  .form-select {
    padding: .875rem 1rem;
    border: 2px solid var(--border-subtle);
    border-radius: 12px;
    font-size: 1rem;
    transition: all 0.3s ease;
    background: rgba(255,255,255,0.8);
    backdrop-filter: blur(10px);
  }

  .form-input:focus,
  .form-select:focus {
    outline: none;
    border-color: var(--sea-base);
    box-shadow: 0 0 0 3px rgba(58,175,169,0.2);
    background: white;
    transform: translateY(-1px);
  }

  .form-actions {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    margin-top: 3rem;
  }

  .btn {
    padding: .875rem 2rem;
    border: none;
    border-radius: 12px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    gap: .5rem;
    min-height: 48px;
  }

  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none !important;
  }

  .btn-primary {
    background: linear-gradient(135deg, var(--sea-base), var(--sea-dark));
    color: white;
    box-shadow: 0 4px 12px rgba(58,175,169,0.3);
  }

  .btn-primary:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(58,175,169,0.4);
  }

  .btn-secondary {
    background: rgba(240,249,248,0.1);
    color: var(--text-dark);
    border: 2px solid var(--border-subtle);
  }

  .btn-secondary:hover {
    background: rgba(240,249,248,0.15);
    transform: translateY(-1px);
  }

  .submit-btn { margin-left: auto; }

  .spinner {
    width: 20px; height: 20px;
    border: 2px solid rgba(240,249,248,0.3);
    border-radius: 50%;
    border-top-color: var(--sea-base);
    animation: spin 1s ease-in-out infinite;
  }

  @keyframes spin { to { transform: rotate(360deg); } }

  @media (max-width: 768px) {
    .enrollment-container { padding: 1rem; }
    .header { padding: 2rem 1rem; }
    .header h1 { font-size: 2rem; }
    .progress-container,
    .enrollment-form { padding: 1.5rem; }
    .form-grid { grid-template-columns: 1fr; }
    .progress-steps {
      flex-direction: column;
      gap: 1rem;
    }
    .progress-step {
      flex-direction: row;
      justify-content: flex-start;
    }
    .step-icon {
      margin-bottom: 0;
      margin-right: 1rem;
    }
    .section-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 1rem;
    }
    .form-actions { flex-direction: column; }
  }
`}</style>
    </div>
  );
};

export default PsychologyEnrollmentForm;