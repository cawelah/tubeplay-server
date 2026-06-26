import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiHome, FiSearch, FiHeart, FiDownload, FiPlus, FiLogOut } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { getPlaylists, createPlaylist } from '../api/axios';

const Sidebar = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [playlists, setPlaylists] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    loadPlaylists();
  }, []);

  const loadPlaylists = async () => {
    try {
      const res = await getPlaylists();
      setPlaylists(res.data.playlists);
    } catch (err) {
      console.error('Error loading playlists:', err);
    }
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      await createPlaylist({ name: newName });
      setNewName('');
      setShowCreate(false);
      loadPlaylists();
    } catch (err) {
      console.error('Error creating playlist:', err);
    }
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <svg viewBox="0 0 24 24" width="32" height="32" fill="#1DB954">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
        </svg>
        <span className="sidebar-brand">TubePlay</span>
      </div>

      <nav className="sidebar-nav">
        <Link to="/" className={`sidebar-link ${location.pathname === '/' ? 'active' : ''}`}>
          <FiSearch size={20} />
          <span>Buscar</span>
        </Link>
        <Link to="/liked" className={`sidebar-link ${location.pathname === '/liked' ? 'active' : ''}`}>
          <FiHeart size={20} />
          <span>Favoritos</span>
        </Link>
        <Link to="/downloads" className={`sidebar-link ${location.pathname === '/downloads' ? 'active' : ''}`}>
          <FiDownload size={20} />
          <span>Descargas</span>
        </Link>
      </nav>

      <div className="sidebar-section">
        <div className="sidebar-section-header">
          <span>Tu Biblioteca</span>
          <button className="btn-icon" onClick={() => setShowCreate(true)} title="Crear playlist">
            <FiPlus size={18} />
          </button>
        </div>

        {showCreate && (
          <div className="create-playlist">
            <input
              type="text"
              placeholder="Nombre de la playlist"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              autoFocus
            />
            <div className="create-actions">
              <button className="btn-sm" onClick={handleCreate}>Crear</button>
              <button className="btn-sm btn-secondary" onClick={() => setShowCreate(false)}>Cancelar</button>
            </div>
          </div>
        )}

        <div className="sidebar-playlists">
          {playlists.map(pl => (
            <Link
              key={pl._id}
              to={`/playlist/${pl._id}`}
              className={`sidebar-link playlist-link ${location.pathname === `/playlist/${pl._id}` ? 'active' : ''}`}
            >
              <span className="playlist-icon">♪</span>
              <span className="playlist-name">{pl.name}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="sidebar-user">
        <div className="user-info">
          <div className="user-avatar">{user?.username?.[0]?.toUpperCase()}</div>
          <span className="user-name">{user?.username}</span>
        </div>
        <button className="btn-icon" onClick={logout} title="Cerrar sesión">
          <FiLogOut size={16} />
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
