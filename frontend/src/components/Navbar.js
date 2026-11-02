// src/components/Navbar.js
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { LayoutDashboard, LogOut } from 'lucide-react';
import '../styles/Navbar.css';
import sustLogo from '../images/sust- logo.png';

const DASHBOARDS = {
  admin: '/admin-dashboard',
  psychologist: '/psychologist',
  student: '/student-dashboard',
};

// Returns the logged-in user, or null if not logged in or the token expired
const readUser = () => {
  try {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    if (!token || !role) return null;

    const { exp } = jwtDecode(token);
    if (exp && exp * 1000 < Date.now()) {
      localStorage.clear();
      return null;
    }

    const email = localStorage.getItem('email') || '';
    const name = localStorage.getItem('name') || email.split('@')[0] || role;
    return { role, email, name };
  } catch {
    return null; // token missing or unreadable
  }
};

const Navbar = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(readUser);
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  // Close the menu when clicking anywhere outside it
  useEffect(() => {
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  // Stay in sync if the user logs in or out in another tab
  useEffect(() => {
    const onStorage = () => setUser(readUser());
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    setUser(null);
    setOpen(false);
    navigate('/login');
  };

  const initial = user ? (user.name || user.email || '?').charAt(0).toUpperCase() : '';

  return (
    <nav className="navbar-sust">
      <div className="navbar-container">
        <div className="navbar-logo">
          <div className="logo-box">
            <img src={sustLogo} alt="SUST Logo" className="sust-logo" />
          </div>
          <span className="university-name">Shahjalal University of Science and Technology</span>
        </div>

        <ul className="navbar-menu">
          <li><Link to="/resources">Resources</Link></li>
          <li>
            <a
              href="mailto:tarekahmad484@gmail.com"
              className="text-blue-600 hover:underline text-sm"
            >
              Contact us
            </a>
          </li>

          {user ? (
            <li className="nb-profile" ref={menuRef}>
              <button
                type="button"
                className="nb-avatar-btn"
                onClick={() => setOpen((o) => !o)}
                aria-haspopup="menu"
                aria-expanded={open}
                aria-label="Account menu"
              >
                <span className="nb-avatar">{initial}</span>
              </button>

              {open && (
                <div className="nb-menu" role="menu">
                 <div className="nb-menu-head">
                <span className="nb-avatar nb-avatar-lg">{initial}</span>
                 <div className="nb-head-text">
                <strong>{user.name}</strong>
                <span>{user.email}</span>
                 <em className="nb-role">{user.role}</em>
                </div>
                </div>
                  <Link
                    to={DASHBOARDS[user.role] || '/'}
                    className="nb-item"
                    role="menuitem"
                    onClick={() => setOpen(false)}
                  >
                    <LayoutDashboard size={16} /> Dashboard
                  </Link>
                  <button
                    type="button"
                    className="nb-item nb-logout"
                    role="menuitem"
                    onClick={handleLogout}
                  >
                    <LogOut size={16} /> Log out
                  </button>
                </div>
              )}
            </li>
          ) : (
            <li><Link to="/login" className="login-but">Login</Link></li>
          )}
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;