import React, { useState, useEffect } from 'react';
import { FiPlay, FiHeart, FiTrash2, FiArrowLeft } from 'react-icons/fi';
import { usePlayer } from '../context/PlayerContext';
import { getLikedSongs, unlikeSong } from '../api/axios';
import { Link } from 'react-router-dom';

const LikedSongs = () => {
  const [songs, setSongs] = useState([]);
  const { playSong } = usePlayer();

  useEffect(() => {
    loadLiked();
  }, []);

  const loadLiked = async () => {
    try {
      const res = await getLikedSongs();
      setSongs(res.data.songs);
    } catch (err) {
      console.error('Error loading liked songs:', err);
    }
  };

  const handleUnlike = async (videoId) => {
    try {
      await unlikeSong(videoId);
      setSongs(prev => prev.filter(s => s.videoId !== videoId));
    } catch (err) {
      console.error('Error unliking song:', err);
    }
  };

  const handlePlayAll = () => {
    if (songs.length > 0) {
      playSong(songs[0], songs, 0);
    }
  };

  return (
    <div className="page liked-page">
      <Link to="/" className="back-link"><FiArrowLeft size={20} /> Volver</Link>

      <div className="playlist-header liked-header">
        <div className="playlist-image-large liked-image">
          <FiHeart size={48} fill="#1DB954" />
        </div>
        <div className="playlist-info">
          <span className="label">PLAYLIST</span>
          <h1>Tus Favoritos</h1>
          <p className="playlist-meta">{songs.length} canciones</p>
          {songs.length > 0 && (
            <button className="btn-primary" onClick={handlePlayAll}>
              <FiPlay size={20} /> Reproducir
            </button>
          )}
        </div>
      </div>

      <div className="songs-list">
        {songs.length === 0 && (
          <div className="empty-state">
            <FiHeart size={48} />
            <h3>No hay canciones favoritas</h3>
            <p>Guarda tus canciones favoritas con el corazón ♥</p>
          </div>
        )}
        {songs.map((song, index) => (
          <div key={song._id} className="song-row" onClick={() => playSong(song, songs, index)}>
            <span className="song-index">{index + 1}</span>
            <img src={song.thumbnail} alt={song.title} className="song-row-img" />
            <div className="song-row-info">
              <p className="song-row-title">{song.title}</p>
              <p className="song-row-artist">{song.artist}</p>
            </div>
            <button
              className="btn-icon liked"
              onClick={e => { e.stopPropagation(); handleUnlike(song.videoId); }}
              title="Quitar de favoritos"
            >
              <FiHeart size={16} fill="#1DB954" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LikedSongs;
