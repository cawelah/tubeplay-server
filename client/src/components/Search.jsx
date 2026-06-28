import React, { useState, useCallback, useRef } from 'react';
import { FiSearch, FiHeart, FiMoreHorizontal, FiPlus, FiDownload } from 'react-icons/fi';
import { usePlayer } from '../context/PlayerContext';
import { searchSongs, likeSong, unlikeSong, checkLiked, addSongToPlaylist, getPlaylists, requestDownload } from '../api/axios';
import { useNavigate } from 'react-router-dom';

const browseGenres = [
  { label: 'Pop', color: '#d840b6', query: 'pop music' },
  { label: 'Hip Hop', color: '#ba5d07', query: 'hip hop' },
  { label: 'Rock', color: '#e81123', query: 'rock music' },
  { label: 'Electronic', color: '#1e3264', query: 'electronic' },
  { label: 'R&B', color: '#bc5900', query: 'rnb music' },
  { label: 'Latin', color: '#d84000', query: 'latin music' },
  { label: 'Jazz', color: '#0d73ec', query: 'jazz' },
  { label: 'Classical', color: '#1e3264', query: 'classical music' },
  { label: 'Reggae', color: '#148a08', query: 'reggae' },
  { label: 'Country', color: '#7d4b32', query: 'country music' },
  { label: 'Indie', color: '#d840b6', query: 'indie music' },
  { label: 'Chill', color: '#0a8c8a', query: 'chill music' },
];

function formatDuration(seconds) {
  if (!seconds && seconds !== 0) return '';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const Search = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [likedMap, setLikedMap] = useState({});
  const [menuSong, setMenuSong] = useState(null);
  const [playlists, setPlaylists] = useState([]);
  const [downloading, setDownloading] = useState({});
  const inputRef = useRef();
  const debounceRef = useRef();
  const navigate = useNavigate();

  const { playSong } = usePlayer();

  const handleSearch = useCallback(async (q) => {
    if (!q.trim()) { setResults([]); return; }
    setLoading(true);
    try {
      const res = await searchSongs(q);
      setResults(res.data.results);
      res.data.results.forEach(song => checkLikedStatus(song.videoId));
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const checkLikedStatus = async (videoId) => {
    try {
      const res = await checkLiked(videoId);
      setLikedMap(prev => ({ ...prev, [videoId]: res.data.liked }));
    } catch {}
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => handleSearch(val), 400);
  };

  const toggleLike = async (song) => {
    try {
      if (likedMap[song.videoId]) {
        await unlikeSong(song.videoId);
        setLikedMap(prev => ({ ...prev, [song.videoId]: false }));
      } else {
        await likeSong(song);
        setLikedMap(prev => ({ ...prev, [song.videoId]: true }));
      }
    } catch (err) {
      console.error('Like error:', err);
    }
  };

  const handleAddToPlaylist = async (playlistId, song) => {
    try {
      await addSongToPlaylist(playlistId, song);
      setMenuSong(null);
    } catch (err) {
      console.error('Add to playlist error:', err);
    }
  };

  const openMenu = async (song) => {
    setMenuSong(song);
    try {
      const res = await getPlaylists();
      setPlaylists(res.data.playlists);
    } catch {}
  };

  const handleDownload = async (song, quality = '128') => {
    setDownloading(prev => ({ ...prev, [song.videoId]: true }));
    try {
      await requestDownload({ ...song, quality });
      setDownloading(prev => ({ ...prev, [song.videoId]: false }));
    } catch (err) {
      console.error('Download error:', err);
      setDownloading(prev => ({ ...prev, [song.videoId]: false }));
    }
  };

  const handleGenreClick = async (genre) => {
    navigate(`/search?q=${encodeURIComponent(genre.query)}`);
    setQuery(genre.query);
    await handleSearch(genre.query);
  };

  const handlePlay = (song) => {
    playSong(song, results, results.findIndex(s => s.videoId === song.videoId));
  };

  return (
    <div className="page search-page">
      <div className="search-header">
        <div className="search-input-container">
          <FiSearch size={18} className="search-icon" />
          <input
            ref={inputRef}
            type="text"
            className="search-input"
            placeholder="What do you want to listen to?"
            value={query}
            onChange={handleInputChange}
            autoFocus
          />
        </div>
      </div>

      {!query && !loading && (
        <>
          <h2 className="browse-title">Browse all</h2>
          <div className="browse-grid">
            {browseGenres.map((genre) => (
              <button
                key={genre.label}
                className="browse-card"
                style={{ background: genre.color }}
                onClick={() => handleGenreClick(genre)}
              >
                <span className="browse-label">{genre.label}</span>
              </button>
            ))}
          </div>
        </>
      )}

      {loading && (
        <div className="loading-container">
          <div className="spinner" />
          <p>Searching...</p>
        </div>
      )}

      {!loading && query && results.length === 0 && (
        <div className="empty-state">
          <h3>No results found</h3>
          <p>Try a different search term</p>
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="search-results">
          {results.map(song => (
            <div
              key={song.videoId}
              className="search-result-item"
              onClick={() => handlePlay(song)}
            >
              <img
                src={song.thumbnail}
                alt={song.title}
                className="search-result-img"
                loading="lazy"
                onError={e => { e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect fill="%23333" width="48" height="48"/><text x="24" y="30" text-anchor="middle" fill="%231DB954" font-size="20">♪</text></svg>'; }}
              />
              <div className="search-result-info">
                <div className="search-result-title">{song.title}</div>
                <div className="search-result-artist">{song.artist}</div>
              </div>
              <div className="search-result-duration">
                {formatDuration(song.durationSeconds)}
              </div>
              <button
                className="search-result-menu"
                onClick={e => { e.stopPropagation(); openMenu(song); }}
              >
                <FiMoreHorizontal size={18} />
              </button>
            </div>
          ))}
        </div>
      )}

      {menuSong && (
        <div className="modal-overlay" onClick={() => setMenuSong(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Song options</h3>
            <div className="playlist-picker">
              <button className="playlist-picker-item" onClick={() => { toggleLike(menuSong); setMenuSong(null); }}>
                <FiHeart size={16} style={{ marginRight: 8, verticalAlign: 'middle' }} />
                {likedMap[menuSong.videoId] ? 'Remove from likes' : 'Like'}
              </button>
              {playlists.length === 0 && <p className="menu-empty">No playlists yet.</p>}
              {playlists.map(pl => (
                <button key={pl._id} className="playlist-picker-item" onClick={() => handleAddToPlaylist(pl._id, menuSong)}>
                  <FiPlus size={16} style={{ marginRight: 8, verticalAlign: 'middle' }} />
                  Add to {pl.name}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button className="btn-sm btn-secondary" onClick={() => setMenuSong(null)} style={{ flex: 1 }}>Cancel</button>
              <button className="btn-sm" onClick={() => { handleDownload(menuSong); setMenuSong(null); }} style={{ flex: 1 }}>
                {downloading[menuSong.videoId] ? 'Downloading...' : 'Download'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Search;
