// src/components/HomePage.js
import React, { useEffect,useState,Suspense } from 'react';
import { 
  Brain, 
  HeartPulse 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import '../styles/HomePage.css';
import '../styles/Navbar.css';
import individualCounselingIcon from '../images/counseling.jpeg';
import workshopsIcon from '../images/seminar.jpeg';
import stressManagementIcon from '../images/resource.jpg';
import psychologist2 from '../images/psychologist2.webp';
import psychologist3 from '../images/psychologist3.jpg';
import api from "../utils/api";



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
const PsychologistCard = ({ name, specialization, image }) => {
 return (
  <div className="psychologist-card">
  <img 
    src={image} 
    alt={`${name}'s profile`}
    onError={(e) => {
      e.target.src = '../image/default-avatar.png'; // Fallback image
    }}
  />
  <div className="psychologist-card-info">
    <h3>{name}</h3>
    <p>{specialization}</p>
  </div>
</div>
    );
};

const HomePage = () => {
  const [psychologists, setPsychologists] = useState([]); // Store fetched psychologists
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  

  useEffect(() => {
    const fetchPsychologists = async () => {
      try {
        setLoading(true);
        const response = await api.admin.getPsychologists(); // Fetch from backend
        setPsychologists(response.data); // Store the fetched data
      } catch (error) {
        setError("Error fetching psychologists: " + error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPsychologists();
  }, []);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;
  const serviceDetails = [
    {
      image: individualCounselingIcon,
      title: "Individual Counseling",
      description: "Personalized one-on-one support for students",
      category: "Support"
    },
    {
      image: workshopsIcon,
      title: "Mental Health Seminars",
      description: "Educational workshops and awareness programs",
      category: "Education"
    },
    {
      image:stressManagementIcon,
      title: "Mental Wellness Resources",
      description: "Comprehensive support materials and guides",
      category: "Information"
  
    }
  ]
 
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
      <div className="hero-background"></div>
      <div className="hero-overlay"></div>
      <div className="hero-content">
        <div className="hero-text-container">
          <div className="hero-decorative-elements">
            <Brain className="hero-decorator-icon left-icon" />
            <HeartPulse className="hero-decorator-icon right-icon" />
          </div>
          
          <h1 className="hero-title">
            Empowering Mental Wellness 
            <br />
            at <span className="highlight">SUST</span>
          </h1>
          
          <p className="hero-subtitle">
            Comprehensive mental health support for SUST students. 
            Your well-being is our priority.
          </p>
          
          <Link to="/login" className="hero-cta-button">
            Access Support
          </Link>
        </div>
      </div>
    </section>

        <section className="about">
      <div className="about-content">
        <div className="about-frame">
          <div className="about-frame-content">
            <div className="about-highlights">
              <h3>About Our Services</h3>
              <ul>
                {[
                  "Confidential and Professional Counseling",
                  "Personalized Mental Health Support", 
                  "Holistic Approach to Student Well-being"
                ].map((highlight, index) => (
                  <li key={index}>
                    <span className="highlight-icon">•</span>
                    {highlight}
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="about-mission">
              <h3>Our Mission</h3>
              <p>To create a supportive environment that promotes mental health awareness, provides accessible counseling services, and empowers students to achieve their full potential.</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section className="services">
      <div className="services-content">
        <div className="services-grid">
          {serviceDetails.map((service, index) => (
            <div key={index} className="service-card">
              <div className="service-image-wrapper">
                <img 
                  src={service.image} 
                  alt={service.title} 
                  className="service-image"
                />
                <div className="service-overlay">
                  <h3>{service.title}</h3>
                  <p>{service.description}</p>
                  <span className="service-category">{service.category}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
   </section>

    <section className="psychologists">
           <div className="psychologists-section">
              <h2>Meet Our Psychologists</h2>
              <Suspense fallback={<div className="loading-grid">Loading...</div>}>
             <div className="psychologist-grid">
               {psychologists.map((psych) => (
                <PsychologistCard 
                 key={psych._id}
                 name={psych.personalInfo.name}
                 specialization={psych.professionalInfo.specialization}
                 
               />
                ))}
             </div>
             </Suspense>
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