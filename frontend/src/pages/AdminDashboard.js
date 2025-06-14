"use client"

import { useState, useEffect } from "react"
import api from "../utils/api"
import "../styles/AdminDashboard.css"
import { toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import { ToastContainer } from "react-toastify"

import { FaSignOutAlt, FaEnvelope, FaUserMd, FaUsers, FaUser } from "react-icons/fa"

const AdminDashboard = () => {
  const handleLogout = () => {
    // Remove the token from local storage.
    // The token might be stored under different keys, so we'll clear the most common ones.
    localStorage.removeItem("token")
    localStorage.removeItem("userInfo") // If you store user info separately

    // Redirect to the login page
    window.location.href = "http://localhost:3000/login"
  }

  const [users, setUsers] = useState([])
  const [psychologists, setPsychologists] = useState([])
  const [activeTab, setActiveTab] = useState("psychologists")
  const [adminProfile, setAdminProfile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Email management state
  const [emailModalOpen, setEmailModalOpen] = useState(false)
  const [emailFormData, setEmailFormData] = useState({
    subject: "",
    message: "",
    htmlMessage: "",
    targetRoles: [],
    recipients: [],
  })
  const [emailTemplates, setEmailTemplates] = useState([])
  const [userEmails, setUserEmails] = useState([])

  // New state for enrollment modal
  const [isEnrollmentModalOpen, setIsEnrollmentModalOpen] = useState(false)
  const [enrollmentFormData, setEnrollmentFormData] = useState({
    personalInfo: {
      name: "",
      gender: "",
      dateOfBirth: "",
      bio: "",
      profileImage: "",
    },
    professionalInfo: {
      specialization: "",
      qualifications: [
        {
          uniqueId: `qual-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          degree: "",
          institution: "",
          year: "",
        },
      ],
      yearsOfExperience: 0,
      expertise: [],
      languages: [],
    },
    contactInfo: {
      email: "",
      phoneNumber: "",
      officeLocation: "",
    },
  })

  const convertFileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result)
      reader.onerror = (error) => reject(error)
    })
  }

  useEffect(() => {
    fetchAdminProfile()
    if (activeTab === "users") {
      fetchUsers()
    } else if (activeTab === "psychologists") {
      fetchPsychologists()
    } else if (activeTab === "emails") {
      fetchUserEmails()
    }
  }, [activeTab])

  const fetchAdminProfile = async () => {
    try {
      setLoading(true)
      const response = await api.admin.getProfile()
      setAdminProfile(response.data)
    } catch (error) {
      setError("Error fetching admin profile: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await api.admin.getUsers()
      setUsers(response.data)
    } catch (error) {
      setError("Error fetching users: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchPsychologists = async () => {
    try {
      setLoading(true)
      const response = await api.admin.getPsychologists()
      setPsychologists(response.data)
    } catch (error) {
      setError("Error fetching psychologists: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  // Email management functions
  const fetchEmailTemplates = async () => {
    try {
      const response = await api.get("/admin/email-templates")
      setEmailTemplates(response.data)
    } catch (error) {
      setError("Error fetching email templates: " + error.message)
    }
  }

  const fetchUserEmails = async (roles = "") => {
    try {
      const response = await api.get(`/admin/emails${roles ? `?roles=${roles}` : ""}`)
      setUserEmails(response.data.emails)
    } catch (error) {
      setError("Error fetching user emails: " + error.message)
    }
  }

  const handleSendBulkEmail = async (e) => {
    e.preventDefault()

    try {
      setLoading(true)
      const response = await api.post("/admin/send-bulk-email", emailFormData)

      toast.success(`Email sent successfully to ${response.data.recipientCount} recipients!`)

      // Reset form and close modal
      setEmailFormData({
        subject: "",
        message: "",
        htmlMessage: "",
        targetRoles: [],
        recipients: [],
      })
      setEmailModalOpen(false)
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleEmailInputChange = (e) => {
    const { name, value } = e.target
    setEmailFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleRoleSelection = (role) => {
    setEmailFormData((prev) => ({
      ...prev,
      targetRoles: prev.targetRoles.includes(role)
        ? prev.targetRoles.filter((r) => r !== role)
        : [...prev.targetRoles, role],
    }))
  }

  const loadEmailTemplate = (template) => {
    setEmailFormData((prev) => ({
      ...prev,
      subject: template.subject,
      message: template.content,
    }))
  }

  const handleUpdateUserStatus = async (userId, newStatus) => {
    try {
      setLoading(true)
      await api.admin.updateUserStatus(userId, { status: newStatus })
      fetchUsers() // Refresh user list
      setError(null)
    } catch (error) {
      setError("Error updating user status: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdatePsychologistStatus = async (psychologistId, newStatus) => {
    try {
      setLoading(true)
      await api.admin.updatePsychologistProfile(psychologistId, { status: newStatus })

      // Update the local state immediately for better UX
      setPsychologists((prev) =>
        prev.map((psych) => (psych._id === psychologistId ? { ...psych, status: newStatus } : psych)),
      )

      setError(null)
      toast.success(`Psychologist status updated to ${newStatus}`)
    } catch (error) {
      setError("Error updating psychologist status: " + error.message)
      toast.error("Failed to update psychologist status")
    } finally {
      setLoading(false)
    }
  }

  const handleDeletePsychologist = async (psychologistId, psychologistName) => {
    // Show confirmation dialog
    const isConfirmed = window.confirm(
      `Are you sure you want to delete ${psychologistName}? This action cannot be undone and will permanently remove the psychologist and their user account.`,
    )

    if (!isConfirmed) {
      return
    }

    try {
      setLoading(true)
      const response = await api.delete(`/admin/psychologists/${psychologistId}`)

      // Remove the deleted psychologist from the local state
      setPsychologists((prev) => prev.filter((psych) => psych._id !== psychologistId))

      toast.success(`${psychologistName} has been deleted successfully`)
      setError(null)
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message
      setError("Error deleting psychologist: " + errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleEnrollmentInputChange = (e) => {
    const { name, value } = e.target
    const [section, field] = name.split(".")

    setEnrollmentFormData((prev) => {
      const updated = { ...prev }
      if (section === "personalInfo" || section === "contactInfo") {
        updated[section][field] = value
      } else if (section === "professionalInfo") {
        updated.professionalInfo[field] = value
      } else {
        updated[name] = value
      }
      return updated
    })
  }
  const handleQualificationChange = (index, e) => {
    const { name, value } = e.target
    const updatedQualifications = [...enrollmentFormData.professionalInfo.qualifications]
    updatedQualifications[index][name] = value

    setEnrollmentFormData((prev) => ({
      ...prev,
      professionalInfo: {
        ...prev.professionalInfo,
        qualifications: updatedQualifications,
      },
    }))
  }

  const addQualification = () => {
    setEnrollmentFormData((prev) => ({
      ...prev,
      professionalInfo: {
        ...prev.professionalInfo,
        qualifications: [
          ...prev.professionalInfo.qualifications,
          {
            uniqueId: `qual-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            degree: "",
            institution: "",
            year: "",
          },
        ],
      },
    }))
  }

  const handlePsychologistEnrollment = async (e) => {
    e.preventDefault()

    try {
      setLoading(true)
      const profilePictureBase64 = enrollmentFormData.profilePicture
        ? await convertFileToBase64(enrollmentFormData.profilePicture)
        : null

      const cleanedQualifications = enrollmentFormData.professionalInfo.qualifications.map((qual) => {
        const { uniqueId, ...qualWithoutId } = qual
        return qualWithoutId
      })

      // Prepare data for JSON submission
      const enrollmentData = {
        personalInfo: {
          name: enrollmentFormData.personalInfo.name,
          gender: enrollmentFormData.personalInfo.gender,
          dateOfBirth: enrollmentFormData.personalInfo.dateOfBirth,
          bio: enrollmentFormData.personalInfo.bio,
          profileImage: profilePictureBase64
            ? profilePictureBase64 // Directly pass the base64 string
            : null,
        },
        professionalInfo: {
          specialization: enrollmentFormData.professionalInfo.specialization,
          yearsOfExperience: enrollmentFormData.professionalInfo.yearsOfExperience,
          qualifications: cleanedQualifications,
        },
        contactInfo: {
          email: enrollmentFormData.contactInfo.email,
          phoneNumber: enrollmentFormData.contactInfo.phoneNumber,
          officeLocation: enrollmentFormData.contactInfo.officeLocation,
        },
      }

      console.log("Enrollment Data:", enrollmentData)

      const response = await api.admin.enrollPsychologist(enrollmentData)

      // FIXED: Add new psychologist to the list with proper format
      if (activeTab === "psychologists" && response.data.psychologist) {
        setPsychologists((prev) => [...prev, response.data.psychologist])
      }

      toast.success("Psychologist Enrollment Successful!")

      // Reset form and close modal
      setEnrollmentFormData({
        personalInfo: {
          name: "",
          gender: "",
          dateOfBirth: "",
          bio: "",
          profileImage: "",
        },
        professionalInfo: {
          specialization: "",
          qualifications: [
            {
              uniqueId: `qual-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              degree: "",
              institution: "",
              year: "",
            },
          ],
          yearsOfExperience: 0,
          expertise: [],
          languages: [],
        },
        contactInfo: {
          email: "",
          phoneNumber: "",
          officeLocation: "",
        },
        profilePicture: null, // Reset profile picture
      })

      setIsEnrollmentModalOpen(false)
      setError(null)
    } catch (error) {
      console.error("Full Enrollment Error:", error)

      // More detailed error handling
      const errorMessage = error.response?.data?.message || error.message || "Error enrolling psychologist"

      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // Email Management Component
  const renderEmailManagement = () => (
    <div className="email-management">
      <div className="management-header">
        <h2>Email Management</h2>
        <button
          onClick={() => {
            setEmailModalOpen(true)
            fetchEmailTemplates()
            fetchUserEmails()
          }}
          className="send-email-btn"
        >
          <FaEnvelope /> Send Email Alert
        </button>
      </div>

      <div className="email-stats">
        <div className="stat-card">
          <h3>Total Active Users</h3>
          <p>{userEmails.length}</p>
        </div>
        <div className="stat-card">
          <h3>Students</h3>
          <p>{userEmails.filter((u) => u.role === "student").length}</p>
        </div>
        <div className="stat-card">
          <h3>Psychologists</h3>
          <p>{userEmails.filter((u) => u.role === "psychologist").length}</p>
        </div>
        <div className="stat-card">
          <h3>Admins</h3>
          <p>{userEmails.filter((u) => u.role === "admin").length}</p>
        </div>
      </div>

      {/* Email Modal */}
      {emailModalOpen && (
        <div className="email-modal">
          <div className="email-modal-content">
            <form onSubmit={handleSendBulkEmail} className="email-form">
              <div className="modal-header">
                <h3>Send Email Alert</h3>
                <button type="button" onClick={() => setEmailModalOpen(false)} className="close-btn">
                  ×
                </button>
              </div>

              {error && <div className="error-message">{error}</div>}

              {/* Email Templates */}
              <div className="form-section">
                <label>Quick Templates</label>
                <div className="template-buttons">
                  {emailTemplates.map((template) => (
                    <button
                      key={template.id}
                      type="button"
                      onClick={() => loadEmailTemplate(template)}
                      className="template-btn"
                    >
                      {template.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Target Audience */}
              <div className="form-section">
                <label>Target Audience</label>
                <div className="role-selection">
                  {["student", "psychologist", "admin"].map((role) => (
                    <label key={role} className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={emailFormData.targetRoles.includes(role)}
                        onChange={() => handleRoleSelection(role)}
                      />
                      {role.charAt(0).toUpperCase() + role.slice(1)}s
                    </label>
                  ))}
                </div>
                <p className="recipient-count">
                  Recipients:{" "}
                  {emailFormData.targetRoles.length === 0
                    ? userEmails.length
                    : userEmails.filter((u) => emailFormData.targetRoles.includes(u.role)).length}
                </p>
              </div>

              {/* Email Content */}
              <div className="form-section">
                <label>Subject</label>
                <input
                  type="text"
                  name="subject"
                  value={emailFormData.subject}
                  onChange={handleEmailInputChange}
                  required
                  placeholder="Enter email subject"
                />
              </div>

              <div className="form-section">
                <label>Message</label>
                <textarea
                  name="message"
                  value={emailFormData.message}
                  onChange={handleEmailInputChange}
                  required
                  rows="6"
                  placeholder="Enter your message here..."
                />
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => setEmailModalOpen(false)} className="cancel-btn">
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="send-btn">
                  {loading ? "Sending..." : "Send Email"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )

  const renderUserManagement = () => (
    <div className="user-management">
      <div className="management-header">
        <h2>User Management</h2>
      </div>
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
            {users.map((user) => (
              <tr key={user._id}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{user.role}</td>
                <td>
                  <span className={`status-badge ${user.status}`}>{user.status}</span>
                </td>
                <td>
                  <div className="action-buttons">
                    <button
                      onClick={() =>
                        handleUpdateUserStatus(user._id, user.status === "active" ? "suspended" : "active")
                      }
                      className={user.status === "active" ? "suspend-btn" : "activate-btn"}
                    >
                      {user.status === "active" ? "Suspend" : "Activate"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )

  const renderPsychologistManagement = () => (
    <div className="psychologist-management">
      <div className="management-header">
        <h2>Psychologist Management</h2>
        <button onClick={() => setIsEnrollmentModalOpen(true)} className="enroll-psychologist-btn">
          <FaUserMd /> Enroll New Psychologist
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
            {psychologists.map((psych) => (
              <tr key={psych._id}>
                <td>{psych.personalInfo?.name}</td>
                <td>{psych.contactInfo?.email}</td>
                <td>{psych.professionalInfo?.specialization}</td>
                <td>
                  <span className={`status-badge ${psych.status}`}>{psych.status}</span>
                </td>
                <td>
                  <div className="action-buttons">
                    <button
                      onClick={() =>
                        handleUpdatePsychologistStatus(psych._id, psych.status === "active" ? "suspended" : "active")
                      }
                      className={psych.status === "active" ? "suspend-btn" : "activate-btn"}
                    >
                      {psych.status === "active" ? "Suspend" : "Activate"}
                    </button>
                    <button
                      onClick={() => handleDeletePsychologist(psych._id, psych.personalInfo?.name)}
                      className="delete-btn"
                      title="Delete Psychologist"
                    >
                      Delete
                    </button>
                  </div>
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
            <form onSubmit={handlePsychologistEnrollment} className="psychologist-enrollment-form">
              {/* Modal Header */}
              <div className="modal-header">
                <h3>Enroll New Psychologist</h3>
                <button type="button" onClick={() => setIsEnrollmentModalOpen(false)} className="close-btn">
                  ×
                </button>
              </div>

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
                {/* Profile Picture Upload */}
                <div className="form-group profile-picture-upload">
                  <label>Profile Picture</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0]
                      setEnrollmentFormData((prevData) => ({
                        ...prevData,
                        profilePicture: file,
                      }))
                    }}
                    className="file-input"
                  />
                  {enrollmentFormData.profilePicture ? (
                    <div className="profile-picture-preview">
                      <img
                        src={URL.createObjectURL(enrollmentFormData.profilePicture) || "/placeholder.svg"}
                        alt="Profile Preview"
                        className="preview-image"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setEnrollmentFormData((prevData) => ({
                            ...prevData,
                            profilePicture: null,
                          }))
                        }}
                        className="remove-image-btn"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="upload-placeholder">Click to upload profile picture</div>
                  )}
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
                  {enrollmentFormData.professionalInfo.qualifications.map((qual, index) => (
                    <div key={qual.uniqueId} className="qualification-row">
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
                <button type="button" className="cancel-btn" onClick={() => setIsEnrollmentModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="submit-btn" disabled={loading}>
                  {loading ? "Enrolling..." : "Enroll Psychologist"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )

  const renderAdminProfile = () => (
    <div className="admin-profile">
      <h2>Admin Profile</h2>
      {loading ? (
        <div className="loading">Loading profile...</div>
      ) : adminProfile ? (
        <div className="profile-details">
          <div className="profile-picture">
            <img src={adminProfile.profilePicture || "/placeholder.svg?height=150&width=150"} alt="Admin Profile" />
          </div>
          <div className="profile-info">
            <p>
              <strong>Name:</strong> {adminProfile.name}
            </p>
            <p>
              <strong>Email:</strong> {adminProfile.email}
            </p>
            <p>
              <strong>Role:</strong> {adminProfile.role}
            </p>
            <p>
              <strong>Last Login:</strong> {adminProfile.lastLogin}
            </p>
            <p>
              <strong>Account Created:</strong> {adminProfile.createdAt}
            </p>
            <p>
              <strong>Contact:</strong> {adminProfile.phoneNumber}
            </p>
            <p>
              <strong>Permissions:</strong>
            </p>
            <ul>
              {adminProfile.permissions?.map((permission, index) => (
                <li key={`permission-${index}-${permission}`}>{permission}</li>
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
  )

  return (
    <div>
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="admin-dashboard">
        {error && (
          <div className="error-message">
            {error}
            <button onClick={() => setError(null)}>Dismiss</button>
          </div>
        )}
        <div className="sidebar">
          <button
            className={activeTab === "psychologists" ? "active" : ""}
            onClick={() => setActiveTab("psychologists")}
          >
            <FaUserMd /> Psychologists
          </button>
          <button className={activeTab === "users" ? "active" : ""} onClick={() => setActiveTab("users")}>
            <FaUsers /> Users
          </button>
          <button className={activeTab === "emails" ? "active" : ""} onClick={() => setActiveTab("emails")}>
            <FaEnvelope /> Email Alerts
          </button>
          <button className={activeTab === "profile" ? "active" : ""} onClick={() => setActiveTab("profile")}>
            <FaUser /> Profile
          </button>
          <button className="logout-button" onClick={handleLogout}>
            <FaSignOutAlt /> Logout
          </button>
        </div>
        <div className="main-content">
          {activeTab === "psychologists" && renderPsychologistManagement()}
          {activeTab === "users" && renderUserManagement()}
          {activeTab === "emails" && renderEmailManagement()}
          {activeTab === "profile" && renderAdminProfile()}
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
