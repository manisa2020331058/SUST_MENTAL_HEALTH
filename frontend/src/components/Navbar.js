// src/components/Navbar.js
import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Navbar.css';
import sustLogo from '../images/sust- logo.png';
import Resources from '../pages/Resources';

const Navbar = () => {
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
          <li><Link to="/contact">Contact</Link></li>
          <li><Link to="/login" className="login-but">Login</Link></li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;