// src/pages/Resources.js
import React, { useState } from 'react';
import { 
  FaBook, 
  FaVideo, 
  FaPodcast, 
  FaFilePdf, 
  FaSearch,
  FaFilter,
  FaHeartbeat,
  FaBrain,
  FaYinYang,
  FaHandHoldingHeart
} from 'react-icons/fa';
import '../styles/Resources.css';

const Resources = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]);

  const resourceCategories = [
    { 
      name: 'Mental Health', 
      icon: <FaBrain />,
      resources: [
        {
          title: 'Understanding Anxiety',
          type: 'Article',
          description: 'Comprehensive guide to understanding and managing anxiety disorders.',
          link: '#',
          icon: <FaBook />
        },
        {
          title: 'Depression Awareness',
          type: 'PDF',
          description: 'In-depth research on depression symptoms and treatment.',
          link: '#',
          icon: <FaFilePdf />
        }
      ]
    },
    { 
      name: 'Wellness', 
      icon: <FaHeartbeat />,
      resources: [
        {
          title: 'Mindfulness Techniques',
          type: 'Video',
          description: 'Learn practical mindfulness exercises for stress reduction.',
          link: '#',
          icon: <FaVideo />
        },
        {
          title: 'Meditation Guide',
          type: 'Podcast',
          description: 'Expert-led meditation techniques for mental clarity.',
          link: '#',
          icon: <FaYinYang />
        }
      ]
    },
    { 
      name: 'Self-Care', 
      icon: <FaHandHoldingHeart />,
      resources: [
        {
          title: 'Self-Care Strategies',
          type: 'Article',
          description: 'Practical self-care techniques for mental and emotional well-being.',
          link: '#',
          icon: <FaBook />
        }
      ]
    }
  ];

  const filteredResources = resourceCategories
    .flatMap(category => 
      category.resources.filter(resource => 
        resource.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
        (selectedCategories.length === 0 || 
         selectedCategories.includes(category.name))
      )
    );

  const toggleCategory = (category) => {
    setSelectedCategories(prev => 
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  return (
    <div className="resources-page">
      <header className="resources-header">
        <h1>Mental Health Resources</h1>
        <p>Empowering you with knowledge and support</p>
      </header>

      <div className="resources-search-container">
        <div className="search-input-wrapper">
          <FaSearch className="search-icon" />
          <input 
            type="text"
            placeholder="Search resources..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="category-filter">
          <FaFilter className="filter-icon" />
          <div className="category-buttons">
            {resourceCategories.map(category => (
              <button
                key={category.name}
                onClick={() => toggleCategory(category.name)}
                className={`category-btn ${
                  selectedCategories.includes(category.name) ? 'active' : ''
                }`}
              >
                {category.icon}
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="resources-grid">
        {filteredResources.length > 0 ? (
          filteredResources.map((resource, index) => (
            <div key={index} className="resource-card">
              <div className="resource-card-header">
                <div className="resource-icon">{resource.icon}</div>
                <span className="resource-type">{resource.type}</span>
              </div>
              <div className="resource-content">
                <h3>{resource.title}</h3>
                <p>{resource.description}</p>
                <a href={resource.link} className="resource-link">
                  Access Resource
                </a>
              </div>
            </div>
          ))
        ) : (
          <div className="no-resources">
            <p>No resources found matching your search</p>
          </div>
        )}
      </div>

      <section className="featured-resources">
        <h2>Featured Resources</h2>
        <div className="featured-grid">
          <div className="featured-card">
            <FaPodcast className="featured-icon" />
            <h3>Mental Health Podcast Series</h3>
            <p>Expert discussions on mental wellness</p>
            <button>Listen Now</button>
          </div>
          <div className="featured-card">
            <FaVideo className="featured-icon" />
            <h3>Wellness Webinars</h3>
            <p>Live sessions with mental health professionals</p>
            <button>Explore Webinars</button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Resources;