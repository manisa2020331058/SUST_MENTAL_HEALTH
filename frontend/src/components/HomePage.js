// src/components/HomePage.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import '../styles/HomePage.css';
import '../styles/Navbar.css';
import individualCounselingIcon from '../images/counselling.png';
import workshopsIcon from '../images/workshop.png';
import stressManagementIcon from '../images/stress_management.png';
import psychologist2 from '../images/psychologist2.webp';
import psychologist3 from '../images/psychologist3.jpg';

// Seminar Card Component
const SeminarCard = ({ title, date, time, speaker, location, description }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Function to format date
  const formatDate = (dateString) => {
    const options = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  return (
    <div 
      className="seminar-card"
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      <div className="seminar-date">
        <span className="day">{new Date(date).getDate()}</span>
        <span className="month">{new Date(date).toLocaleString('default', { month: 'short' })}</span>
      </div>
      <div className="seminar-content">
        <h3>{title}</h3>
        <div className="seminar-details">
        <p className="seminar-full-date">{formatDate(date)}</p> 
          <div className="seminar-meta">
            <p><i className="icon-clock"></i> {time}</p>
            <p><i className="icon-user"></i> {speaker}</p>
            <p><i className="icon-location"></i> {location}</p>
          </div>
          
          {isExpanded && (
            <div className="seminar-description">
              <p>{description}</p>
              <button className="register-btn">Register Now</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Psychologist Card Component
const PsychologistCard = ({ name, specialization, image, description }) => {
  return (
    <div className="psychologist-card">
      <div className="psychologist-image">
        <img 
          src={image} 
          alt={name} 
          onError={(e) => {
            e.target.src = '/path/to/default-image.png'; // Fallback image
          }}
        />
      </div>
      <div className="psychologist-details">
        <h3>{name}</h3>
        <p className="specialization">{specialization}</p>
        <p className="description">{description}</p>
      </div>
    </div>
  );
};

const HomePage = () => {
  const services = [
    {
      icon: individualCounselingIcon,
      title: 'Individual Counseling',
      description: 'Personalized one-on-one support tailored to individual mental health needs',
      details: 'Our confidential counseling provides a safe space to explore personal challenges, develop coping strategies, and promote emotional well-being.'
    },
    {
      icon: workshopsIcon,
      title: 'Mental Health Workshops',
      description: 'Interactive group sessions for personal growth and skill development',
      details: 'Engaging workshops designed to enhance emotional intelligence, stress management, and overall mental resilience.'
    },
    {
      icon: stressManagementIcon,
      title: 'Stress Management',
      description: 'Comprehensive strategies to manage academic and personal stress',
      details: 'Learn evidence-based techniques to reduce anxiety, improve focus, and maintain mental health during challenging academic periods.'
    }
  ];

  const psychologists = [
    {
      name: "Dr. Amina Rahman",
      specialization: "Clinical Psychologist",
      image: psychologist2,
      description: "Specializing in student mental health with 10+ years of experience in university counseling."
    },
    {
      name: "Dr. Kamal Ahmed",
      specialization: "Counseling Psychologist",
      image: psychologist3,
      description: "Expert in cognitive behavioral therapy and stress management for young adults."
    }
  ];
  const seminars = [
    {
      title: "Understanding Student Mental Health",
      date: "2024-04-15",
      time: "2:00 PM - 4:00 PM",
      speaker: "Dr. Amina Rahman",
      location: "SUST Central Library, Conference Hall",
      description: "A comprehensive workshop exploring the unique mental health challenges faced by university students, offering practical coping strategies and support mechanisms."
    },
    {
      title: "Stress Management in Academic Life",
      date: "2024-05-22",
      time: "3:30 PM - 5:30 PM",
      speaker: "Dr. Kamal Ahmed",
      location: "Online Webinar",
      description: "Interactive session providing evidence-based techniques to manage academic stress, improve productivity, and maintain mental well-being."
    },
    {
      title: "Emotional Intelligence Workshop",
      date: "2024-06-10",
      time: "1:00 PM - 3:00 PM",
      speaker: "Ms. Fatima Islam",
      location: "SUST Psychology Department",
      description: "Develop crucial emotional intelligence skills to navigate personal and professional challenges effectively."
    }
  ];


  return (
    <div className="homepage">
      <Navbar />
      <div className="content">
        <section className="hero">
          <div className="hero-content">
            <h1>Empowering Mental Wellness at SUST</h1>
            <p>Comprehensive mental health support for SUST students. Your well-being is our priority.</p>
            <Link to="/login" className="cta-button">Access Support</Link>
          </div>
        </section>

        <section className="about">
          <div className="about-content">
            <h2>About SUST Mental Health Services</h2>
            <div className="about-grid">
              <div className="about-text">
                <p>At Shahjalal University of Science and Technology, we recognize the critical importance of mental health in academic success and personal development. Our dedicated Mental Health Portal provides comprehensive support tailored to the unique challenges faced by university students.</p>
                <ul className="about-highlights">
                  <li>Confidential and Professional Counseling</li>
                  <li>Personalized Mental Health Support</li>
                  <li>Holistic Approach to Student Well-being</li>
                  <li>Evidence-Based Intervention Strategies</li>
                </ul>
              </div>
              <div className="about-mission">
                <h3>Our Mission</h3>
                <p>To create a supportive environment that promotes mental health awareness, provides accessible counseling services, and empowers students to achieve their full potential.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="services">
          <div className="services-content">
            <h2>Our Comprehensive Services</h2>
            <div className="services-grid">
              {services.map((service, index) => (
                <div key={index} className="service-card">
                  <img src={service.icon} alt={service.title} />
                  <h3>{service.title}</h3>
                  <p>{service.description}</p>
                  <div className="service-hover-details">{service.details}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="psychologists">
          <div className="psychologists-content">
            <h2>Our Compassionate Psychologists</h2>
            <div className="psychologists-grid">
              {psychologists.map((psychologist, index) => (
                <PsychologistCard key={index} {...psychologist} />
              ))}
            </div>
          </div>
        </section>

        <section className="seminars">
        <div className="seminars-content">
          <h2>Upcoming Mental Health Seminars</h2>
          <div className="seminars-grid">
            {seminars.map((seminar, index) => (
              <SeminarCard key={index} {...seminar} />
            ))}
          </div>
        </div>
      </section>
      </div>
      <Footer />
    </div>
  );
};

export default HomePage;