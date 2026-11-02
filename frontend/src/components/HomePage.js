import React, { useEffect, useState } from 'react';
import { Brain, HeartPulse, Wind, CloudRain, Moon,Clock, User, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import '../styles/HomePage.css';
import '../styles/Navbar.css';
import individualCounselingIcon from '../images/counseling.jpeg';
import workshopsIcon from '../images/seminar.jpeg';
import stressManagementIcon from '../images/resource.jpg';
import api from "../utils/api";

// A seminar counts as upcoming until the end of its day
const isUpcoming = (dateString) => {
  const endOfDay = new Date(dateString);
  endOfDay.setHours(23, 59, 59, 999);
  return endOfDay >= new Date();
};


const SeminarCard = ({ title, date, time, speaker, location, description }) => {
  const d = new Date(date);
  const fullDate = d.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <article className="sm-card">
      <div className="sm-badge">
        <span className="sm-day">{d.getDate()}</span>
        <span className="sm-month">{d.toLocaleString('en-US', { month: 'short' })}</span>
      </div>

      <div className="sm-body">
        <h3 className="sm-title">{title}</h3>
        <p className="sm-date">{fullDate}</p>

        <ul className="sm-meta">
          {time && <li><Clock size={16} /> {time}</li>}
          {speaker && <li><User size={16} /> {speaker}</li>}
          {location && <li><MapPin size={16} /> {location}</li>}
        </ul>

        {description && <p className="sm-desc">{description}</p>}
      </div>
    </article>
  );
};
const concerns = [
  {
    title: 'Stress',
    Icon: Brain,
    signs: [
      'Feeling overwhelmed by deadlines and exams',
      'Headaches, tiredness or tense muscles',
      'Irritability or a short temper',
      'Difficulty relaxing, even when you have time',
    ],
  },
  {
    title: 'Anxiety',
    Icon: Wind,
    signs: [
      'Constant worry that is hard to switch off',
      'Restlessness or a racing heart',
      'Avoiding situations that make you afraid',
      'Trouble concentrating',
    ],
  },
  {
    title: 'Low mood',
    Icon: CloudRain,
    signs: [
      'Feeling sad or empty most days',
      'Losing interest in things you used to enjoy',
      'Pulling away from friends and classes',
      'Changes in appetite or energy',
    ],
  },
  {
    title: 'Sleep problems',
    Icon: Moon,
    signs: [
      'Trouble falling or staying asleep',
      'Waking up exhausted',
      'Sleeping far more than usual',
      'Racing thoughts at night',
    ],
  },
];
const serviceDetails = [
  {
    image: individualCounselingIcon,
    title: "Individual Counseling",
    description: "Personalized one-on-one support for students",
    category: "Support",
  },
  {
    image: workshopsIcon,
    title: "Mental Health Seminars",
    description: "Educational workshops and awareness programs",
    category: "Education",
  },
  {
    image: stressManagementIcon,
    title: "Mental Wellness Resources",
    description: "Comprehensive support materials and guides",
    category: "Information",
  },
];

const HomePage = () => {
  const [seminars, setSeminars] = useState([]);
  const [showAllSeminars, setShowAllSeminars] = useState(false);

  useEffect(() => {
    const fetchSeminars = async () => {
  try {
    const response = await api.get('/seminars');
    const data = Array.isArray(response.data) ? response.data : [];
    const upcoming = data
      .filter((s) => isUpcoming(s.date))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
    setSeminars(upcoming);
  } catch (error) {
    console.error("Failed to fetch seminars:", error);
  }
};
 fetchSeminars();
}, []);

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
                Empowering Mental Wellness <br />
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

          <section className="ab-section">
  <div className="ab-inner">
    <header className="ab-head">
      <span className="ab-eyebrow">Understanding mental health</span>
      <h2>A healthy mind is more than the absence of illness</h2>
      <p>
        Mental health is how we think, feel and cope with studies, relationships
        and everyday life. Like physical health, it changes over time, and getting
        support early makes a real difference.
      </p>
    </header>

    <div className="ab-grid">
      {concerns.map(({ title, Icon, signs }) => (
        <article key={title} className="ab-card">
          <div className="ab-icon"><Icon size={22} /></div>
          <h3>{title}</h3>
          <p className="ab-sub">You may notice</p>
          <ul>
            {signs.map((s) => <li key={s}>{s}</li>)}
          </ul>
        </article>
      ))}
    </div>

    <p className="ab-note">
      Noticing some of these signs doesn't mean something is wrong with you, and
      this page can't diagnose anything. If they last more than a couple of weeks
      or get in the way of your studies and daily life, please talk to a
      counselor. If you are ever in immediate danger or thinking about harming
      yourself, contact National Emergency Helpline at 999 or go to the nearest hospital
      right away.
    </p>

  
  </div>
</section>
        <section className="services">
          <div className="services-content">
            <div className="services-grid">
              {serviceDetails.map((service, index) => (
                <div key={index} className="service-card">
                  <div className="service-image-wrapper">
                    <img src={service.image} alt={service.title} className="service-image" />
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

        <section className="seminars">
          <div className="seminars-content">
            <h2>Upcoming Mental Health Seminars</h2>

            {seminars.length === 0 ? (
              <p className="no-seminars">
                No seminars are scheduled right now. Please check back soon.
              </p>
            ) : (
             <div className="sm-list">
                 {(showAllSeminars ? seminars : seminars.slice(0, 6)).map((seminar, index) => (
                <SeminarCard key={seminar._id || index} {...seminar} />
                 ))}
           </div>
            )}

            {seminars.length > 6 && (
              <div className="see-more-container">
                <button
                  className="see-more-button"
                  onClick={() => setShowAllSeminars(!showAllSeminars)}
                >
                  {showAllSeminars ? "See Less" : "See More"}
                </button>
              </div>
            )}
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
};

export default HomePage;