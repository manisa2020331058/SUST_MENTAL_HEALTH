// src/pages/Resources.js
import React, { useState, useEffect } from 'react';
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
  FaHandHoldingHeart,
  FaExternalLinkAlt
} from 'react-icons/fa';
import '../styles/Resources.css';

const Resources = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [resources, setResources] = useState([]);
  const [podcasts, setPodcasts] = useState([]);

  useEffect(() => {
    const fetchResources = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/ai/getArticles'); 
        const data = await response.json();
        setResources(data);
      } catch (error) {
        console.error('Failed to fetch resources:', error);
      }
    };

    fetchResources();
  }, []);

  useEffect(() => {
    const fetchPodcasts = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/ai/podcasts');
        const data = await response.json();
        setPodcasts(data);
      } catch (error) {
        console.error('Failed to fetch podcasts:', error);
      }
    };

    fetchPodcasts();
  }, []);
  
  const filteredResources = resources.filter(resource =>
    resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    resource.summary.toLowerCase().includes(searchTerm.toLowerCase())
  );



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
      </div>

      <div className="resources-grid">
        {filteredResources.length > 0 ? (
          filteredResources.map((resource, index) => (
            <div key={index} className="resource-card">
              <div className="resource-card-header">
                <div className="resource-icon"><FaBook /></div>
                <span className="resource-type">Article</span>
              </div>
              <div className="resource-content">
                <h3>{resource.title}</h3>
                <p>{resource.summary}</p>
                <a
                  href={resource.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="resource-button-link"
                >
                  <button className="resource-button">
                    Start Reading <FaExternalLinkAlt className="external-icon" />
                  </button>
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

      {/* Podcast Section */}
      <section className="featured-resources">
        <h2>Podcast Episodes</h2>
        <div className="featured-grid">
          {podcasts.length > 0 ? (
            podcasts.map((podcast, index) => (
              <div key={index} className="featured-card">
                <FaPodcast className="featured-icon" />
                <h3>{podcast.title}</h3>
                <p>{podcast.summary.split('\n')[0]}</p> {/* first paragraph */}
                {podcast.link ? (
                  <a
                    href={podcast.link}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <button>Listen Now</button>
                  </a>
                ) : null}
              </div>
            ))
          ) : (
            <p>No podcast episodes available</p>
          )}
        </div>
      </section>
    </div>
  );
};

export default Resources;