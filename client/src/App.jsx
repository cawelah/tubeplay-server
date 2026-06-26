import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import BottomNav from './components/BottomNav';
import PlayerBar from './components/PlayerBar';
import NowPlaying from './components/NowPlaying';
import Search from './components/Search';
import PlaylistView from './components/PlaylistView';
import LikedSongs from './components/LikedSongs';
import Downloads from './components/Downloads';
import Login from './components/Login';
import Register from './components/Register';
import PhoneFrame from './components/PhoneFrame';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  return user ? children : <Navigate to="/login" />;
};

function App() {
  const { user, loading } = useAuth();
  const [showNowPlaying, setShowNowPlaying] = useState(false);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p className="loading-text">Cargando TubePlay...</p>
      </div>
    );
  }

  return (
    <PhoneFrame>
      <div className="app-container">
        {user && <BottomNav />}
        <main className={`main-content ${!user ? 'no-nav' : ''}`}>
          <Routes>
            <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
            <Route path="/register" element={user ? <Navigate to="/" /> : <Register />} />
            <Route path="/" element={<ProtectedRoute><Search /></ProtectedRoute>} />
            <Route path="/playlist/:id" element={<ProtectedRoute><PlaylistView /></ProtectedRoute>} />
            <Route path="/liked" element={<ProtectedRoute><LikedSongs /></ProtectedRoute>} />
            <Route path="/downloads" element={<ProtectedRoute><Downloads /></ProtectedRoute>} />
          </Routes>
        </main>
        {user && <PlayerBar onExpand={() => setShowNowPlaying(true)} />}
        {user && showNowPlaying && <NowPlaying onClose={() => setShowNowPlaying(false)} />}
      </div>
    </PhoneFrame>
  );
}

export default App;
