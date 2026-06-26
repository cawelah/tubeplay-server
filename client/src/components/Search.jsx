import React, { useState, useCallback, useRef } from 'react';
import { FiSearch, FiHeart, FiPlus, FiDownload, FiPlay } from 'react-icons/fi';
import { usePlayer } from '../context/PlayerContext';
import { searchSongs, likeSong, unlikeSong, checkLiked, addSongToPlaylist, getPlaylists, requestDownload } from '../api/axios';

const Search = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [likedMap, setLikedMap] = useState({});
  const [showPlaylist, setShowPlaylist] = useState(null);
  const [playlists, setPlaylists] = useState([]);
  const [downloading, setDownloading] = useState({});
  const inputRef = useRef();
  const debounceRef = useRef();

  const { playSong } = usePlayer();

  const handleSearch = useCallback(async (q) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
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
    } catch (err) {}
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
      setShowPlaylist(null);
    } catch (err) {
      console.error('Add to playlist error:', err);
    }
  };

  const openPlaylistPicker = async (song) => {
    setShowPlaylist(song);
    try {
      const res = await getPlaylists();
      setPlaylists(res.data.playlists);
    } catch (err) {}
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

  const handlePlay = (song) => {
    playSong(song, results, results.findIndex(s => s.videoId === song.videoId));
  };

  return (
    <div className="page search-page">
      <div className="search-header">
        <h1>Buscar canciones</h1>
        <div className="search-input-container">
          <FiSearch size={20} className="search-icon" />
          <input
            ref={inputRef}
            type="text"
            className="search-input"
            placeholder="¿Qué quieres escuchar?"
            value={query}
            onChange={handleInputChange}
            autoFocus
          />
        </div>
      </div>

      {loading && (
        <div className="loading-container">
          <div className="spinner" />
          <p>Buscando...</p>
        </div>
      )}

      {!loading && query && results.length === 0 && (
        <div className="empty-state">
          <p>No se encontraron resultados para "{query}"</p>
        </div>
      )}

      {!query && (
        <div className="empty-state">
          <FiSearch size={64} />
          <h3>Busca tu música favorita</h3>
          <p>Millones de canciones de YouTube al instante</p>
        </div>
      )}

      <div className="song-grid">
        {results.map(song => (
          <div key={song.videoId} className="song-card">
            <div className="song-card-image" onClick={() => handlePlay(song)}>
              <img src={song.thumbnail} alt={song.title} />
              <div className="song-card-overlay">
                <FiPlay size={32} />
              </div>
            </div>
            <div className="song-card-info">
              <p className="song-card-title">{song.title}</p>
              <p className="song-card-artist">{song.artist}</p>
            </div>
            <div className="song-card-actions">
              <button
                className={`btn-icon ${likedMap[song.videoId] ? 'liked' : ''}`}
                onClick={() => toggleLike(song)}
                title="Favorito"
              >
                <FiHeart size={16} fill={likedMap[song.videoId] ? '#1DB954' : 'none'} />
              </button>
              <button
                className="btn-icon"
                onClick={() => openPlaylistPicker(song)}
                title="Añadir a playlist"
              >
                <FiPlus size={16} />
              </button>
              <button
                className="btn-icon"
                onClick={() => handleDownload(song)}
                title="Descargar MP3"
                disabled={downloading[song.videoId]}
              >
                <FiDownload size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {showPlaylist && (
        <div className="modal-overlay" onClick={() => setShowPlaylist(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Añadir a playlist</h3>
            <div className="playlist-picker">
              {playlists.length === 0 && <p>No hay playlists. Crea una primero.</p>}
              {playlists.map(pl => (
                <button
                  key={pl._id}
                  className="playlist-picker-item"
                  onClick={() => handleAddToPlaylist(pl._id, showPlaylist)}
                >
                  ♪ {pl.name}
                </button>
              ))}
            </div>
            <button className="btn-sm btn-secondary" onClick={() => setShowPlaylist(null)}>Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Search;
