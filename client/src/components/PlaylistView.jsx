import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FiPlay, FiTrash2, FiEdit2, FiArrowLeft, FiHeart } from 'react-icons/fi';
import { usePlayer } from '../context/PlayerContext';
import { getPlaylist, updatePlaylist, deletePlaylist, removeSongFromPlaylist } from '../api/axios';

const PlaylistView = () => {
  const { id } = useParams();
  const [playlist, setPlaylist] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const { playSong } = usePlayer();

  useEffect(() => {
    loadPlaylist();
  }, [id]);

  const loadPlaylist = async () => {
    try {
      const res = await getPlaylist(id);
      setPlaylist(res.data.playlist);
      setEditName(res.data.playlist.name);
      setEditDesc(res.data.playlist.description || '');
    } catch (err) {
      console.error('Error loading playlist:', err);
    }
  };

  const handleSaveEdit = async () => {
    try {
      await updatePlaylist(id, { name: editName, description: editDesc });
      setEditing(false);
      loadPlaylist();
    } catch (err) {
      console.error('Error updating playlist:', err);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('¿Eliminar esta playlist?')) return;
    try {
      await deletePlaylist(id);
      window.location.href = '/';
    } catch (err) {
      console.error('Error deleting playlist:', err);
    }
  };

  const handleRemoveSong = async (videoId) => {
    try {
      await removeSongFromPlaylist(id, videoId);
      loadPlaylist();
    } catch (err) {
      console.error('Error removing song:', err);
    }
  };

  const handlePlayAll = () => {
    if (playlist?.songs?.length > 0) {
      playSong(playlist.songs[0], playlist.songs, 0);
    }
  };

  if (!playlist) return <div className="loading-container"><div className="spinner" /></div>;

  return (
    <div className="page playlist-page">
      <Link to="/" className="back-link"><FiArrowLeft size={20} /> Volver</Link>

      <div className="playlist-header">
        <div className="playlist-image-large">
          {playlist.songs?.[0]?.thumbnail ? (
            <img src={playlist.songs[0].thumbnail} alt={playlist.name} />
          ) : (
            <div className="playlist-placeholder">♪</div>
          )}
        </div>
        <div className="playlist-info">
          <span className="label">PLAYLIST</span>
          {editing ? (
            <div className="edit-fields">
              <input value={editName} onChange={e => setEditName(e.target.value)} className="edit-input" />
              <textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} className="edit-textarea" placeholder="Descripción" />
              <div className="edit-actions">
                <button className="btn-sm" onClick={handleSaveEdit}>Guardar</button>
                <button className="btn-sm btn-secondary" onClick={() => setEditing(false)}>Cancelar</button>
              </div>
            </div>
          ) : (
            <>
              <h1>{playlist.name}</h1>
              {playlist.description && <p className="playlist-desc">{playlist.description}</p>}
              <p className="playlist-meta">{playlist.songs?.length || 0} canciones</p>
              <div className="playlist-actions">
                <button className="btn-primary" onClick={handlePlayAll}>
                  <FiPlay size={20} /> Reproducir
                </button>
                <button className="btn-icon" onClick={() => setEditing(true)} title="Editar"><FiEdit2 size={18} /></button>
                <button className="btn-icon" onClick={handleDelete} title="Eliminar"><FiTrash2 size={18} /></button>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="songs-list">
        {playlist.songs?.length === 0 && (
          <div className="empty-state"><p>Esta playlist está vacía. Busca canciones para añadir.</p></div>
        )}
        {playlist.songs?.map((song, index) => (
          <div key={song.videoId} className="song-row" onClick={() => playSong(song, playlist.songs, index)}>
            <span className="song-index">{index + 1}</span>
            <img src={song.thumbnail} alt={song.title} className="song-row-img" />
            <div className="song-row-info">
              <p className="song-row-title">{song.title}</p>
              <p className="song-row-artist">{song.artist}</p>
            </div>
            <button
              className="btn-icon"
              onClick={e => { e.stopPropagation(); handleRemoveSong(song.videoId); }}
              title="Quitar"
            >
              <FiTrash2 size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PlaylistView;
