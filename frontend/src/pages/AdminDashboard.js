// src/pages/AdminDashboard.js
import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import '../styles/AdminDashboard.css';

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [psychologists, setPsychologists] = useState([]);
  const [activeTab, setActiveTab] = useState('users');
  const [adminProfile, setAdminProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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

  const renderUserManagement = () => (
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

  const renderPsychologistManagement = () => (
    <div className="psychologist-management">
      <h2>Psychologist Management</h2>
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
                      psych._id,
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
    </div>
  );

  const renderAdminProfile = () => (
    <div className="admin-profile">
      <h2>Admin Profile</h2>
      {loading ? (
        <div className="loading">Loading profile...</div>
      ) : adminProfile ? (
        <div className="profile-details">
          <p><strong>Name:</strong> {adminProfile.name}</p>
          <p><strong>Email:</strong> {adminProfile.email}</p>
          <p><strong>Role:</strong> {adminProfile.role}</p>
          <p><strong>Permissions:</strong></p>
          <ul>
            {adminProfile.permissions?.map((permission, index) => (
              <li key={index}>{permission}</li>
            ))}
          </ul>
        </div>
      ) : (
        <p>No profile data available</p>
      )}
    </div>
  );

  return (
    <div className="admin-dashboard">
      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}
      <div className="sidebar">
        <button
          className={activeTab === 'users' ? 'active' : ''}
          onClick={() => setActiveTab('users')}
        >
          Users
        </button>
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
        {activeTab === 'users' && renderUserManagement()}
        {activeTab === 'psychologists' && renderPsychologistManagement()}
        {activeTab === 'profile' && renderAdminProfile()}
      </div>
    </div>
  );
};

export default AdminDashboard;