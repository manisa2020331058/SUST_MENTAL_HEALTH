// // src/components/LoginPage.js
// import React, { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { FaEnvelope, FaLock } from 'react-icons/fa'; // Using react-icons for icons
// import '../styles/LoginPage.css';
// import sustLogo from '../images/sust- logo.png';
// import backgroundImage from '../images/sust_bg3.jpg';

// const LoginPage = () => {
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [role, setRole] = useState('');
//   const [error, setError] = useState('');

//   const navigate = useNavigate();
//   const handleLogin = async (e) => {
//     e.preventDefault();
//     setError('');
    
//     // Input validation
//     if (!email || !password || !role) {
//       setError('Please enter email, password, and select a role');
//       return;
//     }
  
//     try {
//       const response = await fetch('http://localhost:5000/api/users/login', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json'
//         },
//         body: JSON.stringify({
//           email,
//           password,
//           role // Include role in the request
//         })
//       });
  
//       // Parse response
//       const data = await response.json();
  
//       // Check for error response
//       if (!response.ok) {
//         throw new Error(data.message || 'Login failed');
//       }
  
//       // Validate role match
//       if (data.role !== role) {
//         throw new Error('Role mismatch');
//       }
  
//       // Successful login
//       localStorage.setItem('token', data.token);
//       localStorage.setItem('role', data.role);
//       localStorage.setItem('email', data.email);
  
//       // Navigation
//       switch(data.role) {
//         case 'admin':
//           navigate('/admin-dashboard');
//           break;
//         case 'psychologist':
//           navigate('/psychologist');
//           break;
//         case 'student':
//           navigate('/student-dashboard');
//           break;
//         default:
//           setError('Unknown user role');
//       }
  
//     } catch (err) {
//       console.error('Login error:', err);
//       setError(err.message);
//     }
//   };

//   return (
//     <div className="login-page">
//       <div
//         className="login-background"
//         style={{backgroundImage: `url(${backgroundImage})`}}
//       >
//         <div className="login-background-overlay"></div>
//       </div>
      
//       <div className="login-content">
//         <div className="login-wrapper">
//           <div className="login-header">
//             <img src={sustLogo} alt="SUST Logo" className="sust-logo" />
//             <h1>Mental Health Portal</h1>
//           </div>
          
//           <form onSubmit={handleLogin} className="login-form">
//             <div className="form-group">
//               <label htmlFor="email">Email Address</label>
//               <div className="input-container">
//                 <div className="input-icon">
//                   <FaEnvelope />
//                 </div>
//                 <input
//                   type="email"
//                   id="email"
//                   value={email}
//                   onChange={(e) => setEmail(e.target.value)}
//                   placeholder="Enter your email"
//                   required
//                 />
//               </div>
//             </div>

//             <div className="form-group">
//               <label htmlFor="password">Password</label>
//               <div className="input-container">
//                 <div className="input-icon">
//                   <FaLock />
//                 </div>
//                 <input
//                   type="password"
//                   id="password"
//                   value={password}
//                   onChange={(e) => setPassword(e.target.value)}
//                   placeholder="Enter your password"
//                   required
//                 />
//               </div>
//             </div>

//             <div className="form-group role-group">
//               <label>Login Role</label>
//               <div className="role-selection">
//                 {['student', 'psychologist', 'admin'].map(roleOption => (
//                   <label key={roleOption} className="role-option">
//                     <input
//                       type="radio"
//                       name="role"
//                       value={roleOption}
//                       checked={role === roleOption}
//                       onChange={(e) => setRole(e.target.value)}
//                     />
//                     <span>{roleOption.charAt(0).toUpperCase() + roleOption.slice(1)}</span>
//                   </label>
//                 ))}
//               </div>
//             </div>

//             {error && <div className="error-message">{error}</div>}

//             <button type="submit" className="login-button">
//               Secure Login
//             </button>
//           </form>

//           <div className="login-footer">
//             <p>Enrollment Information</p>
//             <ul>
//               <li>Students: Enrolled by Psychologists</li>
//               <li>Psychologists: Verified by Admin</li>
//               <li>Physical Verification Required</li>
//             </ul>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default LoginPage;


// src/components/LoginPage.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEnvelope, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa'; // Using react-icons for icons
import sustLogo from '../images/sust- logo.png';
import backgroundImage from '../images/sust_bg3.jpg';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [focusedField, setFocusedField] = useState('');

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Input validation
    if (!email || !password || !role) {
      setError('Please enter email, password, and select a role');
      setIsLoading(false);
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
      switch (data.role) {
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
    } finally {
      setIsLoading(false);
    }
  };

  const containerStyle = {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    fontFamily: "'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    overflow: 'hidden'
  };

  const backgroundStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundImage: `url(${backgroundImage})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    zIndex: 1
  };

  const overlayStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.4) 0%, rgba(118, 75, 162, 0.4) 100%)',
    zIndex: 2
  };

  const contentStyle = {
    position: 'relative',
    zIndex: 3,
    width: '100%',
    maxWidth: '450px',
    padding: '0 20px'
  };

  const cardStyle = {
    background: 'rgba(255, 255, 255, 0.15)',
    backdropFilter: 'blur(20px)',
    borderRadius: '24px',
    padding: '48px 40px',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3), 0 8px 20px rgba(0, 0, 0, 0.2)',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    animation: 'slideUp 0.8s ease-out'
  };

  const headerStyle = {
    textAlign: 'center',
    marginBottom: '40px'
  };

  const logoStyle = {
    width: '80px',
    height: '80px',
    marginBottom: '20px',
    borderRadius: '50%',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
    transition: 'transform 0.3s ease'
  };

  const titleStyle = {
    fontSize: '28px',
    fontWeight: '700',
    color: '#FFFFFF',
    margin: '0',
    textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
    letterSpacing: '0.5px'
  };

  const formGroupStyle = {
    marginBottom: '24px'
  };

  const labelStyle = {
    display: 'block',
    fontSize: '14px',
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: '8px',
    letterSpacing: '0.025em',
    textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
  };

  const inputContainerStyle = {
    position: 'relative',
    display: 'flex',
    alignItems: 'center'
  };

  const inputIconStyle = {
    position: 'absolute',
    left: '16px',
    zIndex: 2,
    color: '#9CA3AF',
    fontSize: '16px',
    transition: 'all 0.3s ease'
  };

  const passwordToggleStyle = {
    position: 'absolute',
    right: '16px',
    zIndex: 2,
    color: '#9CA3AF',
    fontSize: '16px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    padding: '4px'
  };

  const getInputStyle = (fieldName, hasRightIcon = false) => ({
    width: '100%',
    padding: hasRightIcon ? '16px 48px 16px 48px' : '16px 16px 16px 48px',
    fontSize: '16px',
    border: `2px solid ${focusedField === fieldName ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.3)'}`,
    borderRadius: '12px',
    outline: 'none',
    transition: 'all 0.3s ease',
    backgroundColor: focusedField === fieldName ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.8)',
    boxShadow: focusedField === fieldName ? '0 0 0 3px rgba(255, 255, 255, 0.2)' : 'none',
    transform: focusedField === fieldName ? 'translateY(-1px)' : 'translateY(0)',
    color: '#2D3748'
  });

  const roleGroupStyle = {
    marginBottom: '32px'
  };

  const roleSelectionStyle = {
    display: 'flex',
    gap: '12px',
    marginTop: '8px'
  };

  const getRoleOptionStyle = (roleOption) => ({
    flex: 1,
    position: 'relative',
    cursor: 'pointer'
  });

  const getRoleInputStyle = (roleOption) => ({
    position: 'absolute',
    opacity: 0,
    cursor: 'pointer'
  });

  const getRoleLabelStyle = (roleOption) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '12px 16px',
    fontSize: '14px',
    fontWeight: '600',
    borderRadius: '10px',
    border: `2px solid ${role === roleOption ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.3)'}`,
    backgroundColor: role === roleOption ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.7)',
    color: role === roleOption ? '#667eea' : '#2D3748',
    transition: 'all 0.3s ease',
    transform: role === roleOption ? 'translateY(-2px)' : 'translateY(0)',
    boxShadow: role === roleOption ? '0 4px 12px rgba(255, 255, 255, 0.3)' : '0 2px 4px rgba(0, 0, 0, 0.1)',
    textTransform: 'capitalize'
  });

  const errorStyle = {
    backgroundColor: '#FEF2F2',
    color: '#DC2626',
    padding: '12px 16px',
    borderRadius: '8px',
    fontSize: '14px',
    marginBottom: '20px',
    border: '1px solid #FECACA',
    animation: 'shake 0.5s ease-in-out'
  };

  const buttonStyle = {
    width: '100%',
    padding: '16px',
    fontSize: '16px',
    fontWeight: '600',
    color: '#FFFFFF',
    background: isLoading ? '#9CA3AF' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    border: 'none',
    borderRadius: '12px',
    cursor: isLoading ? 'not-allowed' : 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: isLoading ? 'none' : '0 4px 15px rgba(102, 126, 234, 0.4)',
    transform: isLoading ? 'none' : 'translateY(0)',
    marginBottom: '32px',
    position: 'relative',
    overflow: 'hidden'
  };

  const footerStyle = {
    textAlign: 'center',
    padding: '24px',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '16px',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    backdropFilter: 'blur(10px)'
  };

  const footerTitleStyle = {
    fontSize: '16px',
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: '12px',
    margin: '0 0 12px 0',
    textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
  };

  const footerListStyle = {
    listStyle: 'none',
    padding: '0',
    margin: '0',
    fontSize: '14px',
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: '1.6'
  };

  const footerItemStyle = {
    padding: '4px 0',
    position: 'relative'
  };

  // Add keyframe animations via style tag
  const animations = `
    <style>
      @keyframes slideUp {
        from {
          opacity: 0;
          transform: translateY(30px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        75% { transform: translateX(5px); }
      }
      .login-button:hover:not(:disabled) {
        transform: translateY(-2px) !important;
        box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5) !important;
      }
      .sust-logo:hover {
        transform: scale(1.05) !important;
      }
    </style>
  `;

  return (
    <>
      <div dangerouslySetInnerHTML={{ __html: animations }} />
      <div style={containerStyle}>
        <div style={backgroundStyle}></div>
        <div style={overlayStyle}></div>

        <div style={contentStyle}>
          <div style={cardStyle}>
            <div style={headerStyle}>
              <img
                src={sustLogo}
                alt="SUST Logo"
                className="sust-logo"
                style={logoStyle}
              />
              <h1 style={titleStyle}>Mental Health Portal</h1>
            </div>

            <form onSubmit={handleLogin}>
              <div style={formGroupStyle}>
                <label htmlFor="email" style={labelStyle}>Email Address</label>
                <div style={inputContainerStyle}>
                  <div style={{
                    ...inputIconStyle,
                    color: focusedField === 'email' ? '#667eea' : '#9CA3AF',
                    transform: focusedField === 'email' ? 'scale(1.1)' : 'scale(1)'
                  }}>
                    <FaEnvelope />
                  </div>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField('')}
                    placeholder="Enter your email"
                    style={getInputStyle('email')}
                    required
                  />
                </div>
              </div>

              <div style={formGroupStyle}>
                <label htmlFor="password" style={labelStyle}>Password</label>
                <div style={inputContainerStyle}>
                  <div style={{
                    ...inputIconStyle,
                    color: focusedField === 'password' ? '#667eea' : '#9CA3AF',
                    transform: focusedField === 'password' ? 'scale(1.1)' : 'scale(1)'
                  }}>
                    <FaLock />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField('')}
                    placeholder="Enter your password"
                    style={getInputStyle('password', true)}
                    required
                  />
                  <div
                    style={{
                      ...passwordToggleStyle,
                      color: showPassword ? '#667eea' : '#9CA3AF'
                    }}
                    onClick={() => setShowPassword(!showPassword)}
                    onMouseEnter={(e) => e.target.style.color = '#667eea'}
                    onMouseLeave={(e) => e.target.style.color = showPassword ? '#667eea' : '#9CA3AF'}
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </div>
                </div>
              </div>

              <div style={roleGroupStyle}>
                <label style={labelStyle}>Login Role</label>
                <div style={roleSelectionStyle}>
                  {['student', 'psychologist', 'admin'].map(roleOption => (
                    <label key={roleOption} style={getRoleOptionStyle(roleOption)}>
                      <input
                        type="radio"
                        name="role"
                        value={roleOption}
                        checked={role === roleOption}
                        onChange={(e) => setRole(e.target.value)}
                        style={getRoleInputStyle(roleOption)}
                      />
                      <span style={getRoleLabelStyle(roleOption)}>
                        {roleOption.charAt(0).toUpperCase() + roleOption.slice(1)}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {error && <div style={errorStyle}>{error}</div>}

              <button
                type="submit"
                className="login-button"
                style={buttonStyle}
                disabled={isLoading}
              >
                {isLoading ? (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid transparent',
                      borderTop: '2px solid #ffffff',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }}></div>
                    Signing In...
                  </span>
                ) : (
                  'Secure Login'
                )}
              </button>
            </form>

            <div style={footerStyle}>
              <p style={footerTitleStyle}>Enrollment Information</p>
              <ul style={footerListStyle}>
                <li style={footerItemStyle}>Students: Enrolled by Psychologists</li>
                <li style={footerItemStyle}>Psychologists: Verified by Admin</li>
                <li style={footerItemStyle}>Physical Verification Required</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LoginPage;