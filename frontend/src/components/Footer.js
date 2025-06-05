// src/components/Footer.js
import React from 'react';
import { Link } from 'react-router-dom';
import { 
  FaMapMarkerAlt, 
  FaPhone, 
  FaEnvelope, 
  FaFacebook, 
  FaTwitter, 
  FaLinkedin, 
  FaInstagram 
} from 'react-icons/fa';
import '../styles/Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-section university-info">
          <h3>Shahjalal University of Science and Technology</h3>
          <p>Established in 1991, SUST is a premier public university in Bangladesh</p>
          <div className="contact-info">
            <div className="contact-item">
              <FaMapMarkerAlt />
              <span>Sylhet, Bangladesh - 3114</span>
            </div>
            <div className="contact-item">
              <FaPhone />
              <span>+88-0821-714479</span>
            </div>
            <div className="contact-item">
              <FaEnvelope />
              <span>info@sust.edu.bd</span>
            </div>
          </div>
        </div>

        <div className="footer-section quick-links">
          <h4>Quick Links</h4>
          <ul>
            <li><Link to="/resources">Mental Health Resources</Link></li>
            <li><Link to="/counseling">Counseling Services</Link></li>
            <li><Link to="/workshops">Upcoming Workshops</Link></li>
            <li><Link to="/contact">Contact Us</Link></li>
          </ul>
        </div>

        <div className="footer-section support-links">
          <h4>Support</h4>
          <ul>
            <li><Link to="/faq">FAQ</Link></li>
            <li><Link to="/privacy">Privacy Policy</Link></li>
            <li><Link to="/terms">Terms of Service</Link></li>
            <li><Link to="/emergency">Emergency Support</Link></li>
          </ul>
        </div>

        <div className="footer-section social-media">
          <h4>Connect With Us</h4>
          <div className="social-icons">
            <a href="https://www.facebook.com/sust.edu.bd" target="_blank" rel="noopener noreferrer">
              <FaFacebook />
            </a>
            <a href="https://www.twitter.com/sust_official" target="_blank" rel="noopener noreferrer">
              <FaTwitter />
            </a>
            <a href="https://www.linkedin.com/school/sust" target="_blank" rel="noopener noreferrer">
              <FaLinkedin />
            </a>
            <a href="https://www.instagram.com/sust_official" target="_blank" rel="noopener noreferrer">
              <FaInstagram />
            </a>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} SUST Mental Health Portal. All Rights Reserved.</p>
        <p>Developed by SUST IT Department</p>
      </div>
    </footer>
  );
};

export default Footer;