import React, { useState, useEffect, useCallback } from 'react';
import { FiPlay } from 'react-icons/fi';
import { usePlayer } from '../context/PlayerContext';
import { searchSongs } from '../api/axios';
import { useNavigate } from 'react-router-dom';

const categories = [
  { label: 'Trending', query: 'trending music' },
  { label: 'Pop', query: 'pop music' },
  { label: 'Hits 2024', query: 'hits 2024' },
  { label: 'Rock', query: 'rock music' },
  { label: 'Hip Hop', query: 'hip hop' },
  { label: 'Electronic', query: 'electronic music' },
];

const quickColors = [
  'linear-gradient(135deg, #8400ff, #ff00cc)',
  'linear-gradient(135deg, #1DB954, #169c46)',
  'linear-gradient(135deg, #ff6b6b, #ffa500)',
  'linear-gradient(135deg, #4facfe, #00f2fe)',
  'linear-gradient(135deg, #a18cd1, #fbc2eb)',
  'linear-gradient(135deg, #f093fb, #f5576c)',
];

const Home = () => {
  const [sections, setSections] = useState([]);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const { playSong } = usePlayer();
  const navigate = useNavigate();

  const loadSections = useCallback(async () => {
    setLoading(true);
    try {
      const results = await Promise.all(
        categories.slice(0, 4).map(async (cat) => {
          try {
            const res = await searchSongs(cat.query, 8);
            return { ...cat, songs: res.data.results || [] };
          } catch { return { ...cat, songs: [] }; }
        })
      );
      setSections(results.filter(s => s.songs.length > 0));
    } catch (err) {
      console.error('Error loading home:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadSections(); }, [loadSections]);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('recentlyPlayed') || '[]');
      setRecent(stored);
    } catch {}
  }, []);

  const handlePlay = (song, list) => {
    playSong(song, list, list.indexOf(song));
    try {
      const stored = JSON.parse(localStorage.getItem('recentlyPlayed') || '[]');
      const updated = [song, ...stored.filter(s => s.videoId !== song.videoId)].slice(0, 10);
      localStorage.setItem('recentlyPlayed', JSON.stringify(updated));
      setRecent(updated);
    } catch {}
  };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="home-page">
      <div className="home-header">
        <div>
          <p className="home-greeting-label">{greeting()}</p>
          <h1 className="home-greeting">Welcome back</h1>
        </div>
        <button className="home-settings-btn">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
        </button>
      </div>

      <div className="home-quick-access">
        {categories.slice(0, 6).map((cat, i) => (
          <button
            key={i}
            className="home-quick-card"
            style={{ background: quickColors[i] }}
            onClick={() => {
              const section = sections.find(s => s.label === cat.label);
              if (section?.songs?.[0]) {
                handlePlay(section.songs[0], section.songs);
              } else {
                navigate(`/search?q=${encodeURIComponent(cat.query)}`);
              }
            }}
          >
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {recent.length > 0 && (
        <div className="home-section">
          <div className="home-section-header">
            <h2 className="home-section-title">Recently played</h2>
          </div>
          <div className="home-section-row">
            {recent.slice(0, 6).map((song) => (
              <div key={song.videoId} className="home-card" onClick={() => handlePlay(song, recent)}>
                <div className="home-card-image">
                  <img src={song.thumbnail} alt={song.title} loading="lazy" />
                  <div className="home-card-overlay">
                    <div className="home-card-play-btn"><FiPlay size={22} /></div>
                  </div>
                </div>
                <p className="home-card-title">{song.title}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="home-sections">
          {[1, 2].map(i => (
            <div key={i} className="home-section">
              <div className="home-section-skeleton-title" />
              <div className="home-section-row">
                {[1, 2, 3, 4].map(j => (
                  <div key={j} className="home-card-skeleton" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="home-sections">
          {sections.map((section) => (
            <div key={section.label} className="home-section">
              <div className="home-section-header">
                <h2 className="home-section-title">{section.label}</h2>
                <button className="home-section-seeall" onClick={() => navigate(`/search?q=${encodeURIComponent(section.query)}`)}>Show all</button>
              </div>
              <div className="home-section-row">
                {section.songs.slice(0, 6).map((song, i) => (
                  <div key={song.videoId} className="home-card" onClick={() => handlePlay(song, section.songs)}>
                    <div className="home-card-image">
                      <img src={song.thumbnail} alt={song.title} loading="lazy" />
                      <div className="home-card-overlay">
                        <div className="home-card-play-btn"><FiPlay size={22} /></div>
                      </div>
                    </div>
                    <p className="home-card-title">{song.title}</p>
                    <p className="home-card-artist">{song.artist}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Home;
