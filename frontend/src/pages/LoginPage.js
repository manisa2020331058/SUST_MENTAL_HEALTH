// src/components/LoginPage.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEnvelope, FaLock } from 'react-icons/fa'; // Using react-icons for icons
import '../styles/LoginPage.css';
import sustLogo from '../images/sust- logo.png';
import backgroundImage from '../images/sust_bg3.jpg';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('');
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    
    // Input validation
    if (!email || !password || !role) {
      setError('Please enter email, password, and select a role');
      return;
    }
  
    try {
      const response = await fetch('http://localhost:5000/api/users/login', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ 
          email, 
          password,
          role // Include role in the request
        })
      });
  
      // Parse response
      const data = await response.json();
  
      // Check for error response
      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }
  
      // Validate role match
      if (data.role !== role) {
        throw new Error('Role mismatch');
      }
  
      // Successful login
      localStorage.setItem('token', data.token);
      localStorage.setItem('role', data.role);
      localStorage.setItem('email', data.email);
  
      // Navigation
      switch(data.role) {
        case 'admin':
          navigate('/admin-dashboard');
          break;
        case 'psychologist':
          navigate('/psychologist');
          break;
        case 'student':
          navigate('/student-dashboard');
          break;
        default:
          setError('Unknown user role');
      }
  
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message);
    }
  };

  return (
    <div className="login-page">
      <div 
        className="login-background" 
        style={{backgroundImage: `url(${backgroundImage})`}}
      >
        <div className="login-background-overlay"></div>
      </div>
      
      <div className="login-content">
        <div className="login-wrapper">
          <div className="login-header">
            <img src={sustLogo} alt="SUST Logo" className="sust-logo" />
            <h1>Mental Health Portal</h1>
          </div>
          
          <form onSubmit={handleLogin} className="login-form">
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <div className="input-container">
                <div className="input-icon">
                  <FaEnvelope />
                </div>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="input-container">
                <div className="input-icon">
                  <FaLock />
                </div>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                />
              </div>
            </div>

            <div className="form-group role-group">
              <label>Login Role</label>
              <div className="role-selection">
                {['student', 'psychologist', 'admin'].map(roleOption => (
                  <label key={roleOption} className="role-option">
                    <input
                      type="radio"
                      name="role"
                      value={roleOption}
                      checked={role === roleOption}
                      onChange={(e) => setRole(e.target.value)}
                    />
                    <span>{roleOption.charAt(0).toUpperCase() + roleOption.slice(1)}</span>
                  </label>
                ))}
              </div>
            </div>

            {error && <div className="error-message">{error}</div>}

            <button type="submit" className="login-button">
              Secure Login
            </button>
          </form>

          <div className="login-footer">
            <p>Enrollment Information</p>
            <ul>
              <li>Students: Enrolled by Psychologists</li>
              <li>Psychologists: Verified by Admin</li>
              <li>Physical Verification Required</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;