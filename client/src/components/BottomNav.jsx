import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiSearch, FiHeart, FiDownload, FiHome, FiLogOut } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { getPlaylists, createPlaylist } from '../api/axios';

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [playlists, setPlaylists] = useState([]);
  const [showMenu, setShowMenu] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    if (showMenu) loadPlaylists();
  }, [showMenu]);

  const loadPlaylists = async () => {
    try {
      const res = await getPlaylists();
      setPlaylists(res.data.playlists);
    } catch (err) {}
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      await createPlaylist({ name: newName });
      setNewName('');
      setShowCreate(false);
      loadPlaylists();
    } catch (err) {}
  };

  const tabs = [
    { path: '/', icon: FiSearch, label: 'Buscar' },
    { path: '/liked', icon: FiHeart, label: 'Favoritos' },
    { path: '/downloads', icon: FiDownload, label: 'Descargas' }
  ];

  return (
    <>
      <nav className="bottom-nav">
        <div className="bottom-nav-inner">
          {tabs.map(tab => (
            <button
              key={tab.path}
              className={`nav-tab ${location.pathname === tab.path ? 'active' : ''}`}
              onClick={() => navigate(tab.path)}
            >
              <tab.icon size={22} />
              <span>{tab.label}</span>
            </button>
          ))}
          <button
            className={`nav-tab ${showMenu ? 'active' : ''}`}
            onClick={() => setShowMenu(!showMenu)}
          >
            <div className="nav-avatar">
              {user?.username?.[0]?.toUpperCase() || '?'}
            </div>
            <span>Biblioteca</span>
          </button>
        </div>
      </nav>

      {showMenu && (
        <div className="menu-overlay" onClick={() => setShowMenu(false)}>
          <div className="menu-panel" onClick={e => e.stopPropagation()}>
            <div className="menu-header">
              <div className="menu-user">
                <div className="menu-avatar">{user?.username?.[0]?.toUpperCase()}</div>
                <div>
                  <p className="menu-username">{user?.username}</p>
                  <p className="menu-email">{user?.email}</p>
                </div>
              </div>
              <button className="menu-logout" onClick={logout}>
                <FiLogOut size={18} /> Cerrar sesión
              </button>
            </div>

            <div className="menu-section">
              <div className="menu-section-title">
                <span>Playlists</span>
                <button className="btn-sm" onClick={() => setShowCreate(true)}>+ Nueva</button>
              </div>

              {showCreate && (
                <div className="create-playlist-inline">
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

              {playlists.length === 0 && <p className="menu-empty">Sin playlists aún</p>}
              {playlists.map(pl => (
                <button
                  key={pl._id}
                  className="menu-playlist-item"
                  onClick={() => { navigate(`/playlist/${pl._id}`); setShowMenu(false); }}
                >
                  <div className="pl-icon">♪</div>
                  <span>{pl.name}</span>
                  <span className="pl-count">{pl.songs?.length || 0}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BottomNav;
