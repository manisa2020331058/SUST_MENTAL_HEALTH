// src/pages/Resources.js
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FaBook, FaPodcast, FaSearch, FaExternalLinkAlt } from 'react-icons/fa';
import '../styles/Resources.css';
import Navbar from '../components/Navbar';

// RSS summaries can contain HTML tags; show plain text only
const clean = (text = '') =>
  String(text)
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const fetchList = async (url) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  const data = await res.json();
  return Array.isArray(data) ? data : [];
};

const Resources = () => {
  const [tab, setTab] = useState('articles');
  const [search, setSearch] = useState('');
  const [articles, setArticles] = useState([]);
  const [podcasts, setPodcasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    const [a, p] = await Promise.allSettled([
      fetchList('/api/ai/getArticles'),
      fetchList('/api/ai/podcasts'),
    ]);
    if (a.status === 'fulfilled') setArticles(a.value);
    if (p.status === 'fulfilled') setPodcasts(p.value);
    if (a.status === 'rejected' && p.status === 'rejected') {
      setError('We could not load resources right now. Please try again in a moment.');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const q = search.trim().toLowerCase();
  const matches = (item) =>
    !q || `${item.title || ''} ${clean(item.summary)}`.toLowerCase().includes(q);

  const list = (tab === 'articles' ? articles : podcasts).filter(matches);

  return (
    <div className="rs-page">
      <Navbar />
      <header className="rs-hero">
        <h1>Mental Health Resources</h1>
        <p>Articles and podcasts to help you understand, cope and grow.</p>

        <div className="rs-search">
          <FaSearch className="rs-search-icon" />
          <input
            type="text"
            placeholder="Search resources..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search resources"
          />
        </div>
      </header>

      <main className="rs-main">
        <div className="rs-tabs" role="tablist">
          <button
            role="tab"
            aria-selected={tab === 'articles'}
            className={`rs-tab ${tab === 'articles' ? 'active' : ''}`}
            onClick={() => setTab('articles')}
          >
            <FaBook /> Articles <span>{articles.length}</span>
          </button>
          <button
            role="tab"
            aria-selected={tab === 'podcasts'}
            className={`rs-tab ${tab === 'podcasts' ? 'active' : ''}`}
            onClick={() => setTab('podcasts')}
          >
            <FaPodcast /> Podcasts <span>{podcasts.length}</span>
          </button>
        </div>

        {loading && (
          <p className="rs-state">
            Loading resources… the server may take up to a minute to wake up.
          </p>
        )}

        {!loading && error && (
          <div className="rs-state">
            <p>{error}</p>
            <button className="rs-retry" onClick={load}>Try again</button>
          </div>
        )}

        {!loading && !error && list.length === 0 && (
          <p className="rs-state">
            {q ? 'No resources match your search.' : 'Nothing to show here yet.'}
          </p>
        )}

        {!loading && !error && list.length > 0 && (
          <div className="rs-grid">
            {list.map((item, i) => (
              <article key={item.link || i} className="rs-card">
                <div className="rs-card-top">
                  <span className="rs-icon">
                    {tab === 'articles' ? <FaBook /> : <FaPodcast />}
                  </span>
                  <span className="rs-tag">
                    {tab === 'articles' ? 'Article' : 'Podcast'}
                  </span>
                </div>
                <h3>{item.title || 'Untitled'}</h3>
                <p>{clean(item.summary)}</p>
                {item.link && (
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rs-link"
                  >
                    {tab === 'articles' ? 'Read article' : 'Listen now'}
                    <FaExternalLinkAlt size={12} />
                  </a>
                )}
              </article>
            ))}
          </div>
        )}

        <aside className="rs-note">
          <strong>Need to talk to someone?</strong>{' '}
          These resources are for general information and are not a substitute for
          professional care. <Link to="/login">Log in</Link> to reach a university
          counselor. If you or someone you know is in immediate danger, contact your
          local emergency number or go to the nearest hospital.
        </aside>
      </main>
    </div>
  );
};

export default Resources;