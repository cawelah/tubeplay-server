import React from 'react';
import { FiChevronDown, FiShuffle, FiSkipBack, FiSkipForward, FiPlay, FiPause, FiRepeat, FiHeart } from 'react-icons/fi';
import { usePlayer } from '../context/PlayerContext';

function formatTime(s) {
  if (!s && s !== 0) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

const NowPlaying = ({ onClose }) => {
  const {
    currentSong, isPlaying, progress, duration, volume, shuffle, repeat,
    togglePlay, nextSong, prevSong, setVolume, toggleShuffle, toggleRepeat, seekTo
  } = usePlayer();

  if (!currentSong) return null;

  const pct = duration ? (progress / duration) * 100 : 0;

  return (
    <div className="now-playing-overlay">
      <div className="now-playing">
        <div className="np-top">
          <button className="np-top-btn" onClick={onClose}><FiChevronDown size={22} /></button>
          <span className="np-top-label">Now Playing</span>
          <button className="np-top-btn"><FiHeart size={18} /></button>
        </div>

        <div className={`np-artwork ${isPlaying ? 'np-artwork-spin' : ''}`}>
          <img
            className="np-artwork-img"
            src={currentSong.thumbnail}
            alt={currentSong.title}
            onError={e => { e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect fill="%23333" width="48" height="48"/><text x="24" y="30" text-anchor="middle" fill="%231DB954" font-size="20">♪</text></svg>'; }}
          />
        </div>

        <div className="np-info">
          <div className="np-title">{currentSong.title}</div>
          <div className="np-artist">{currentSong.artist}</div>
        </div>

        <div className="np-progress-section">
          <div className="np-progress-wrap" onClick={e => {
            const rect = e.currentTarget.getBoundingClientRect();
            const p = (e.clientX - rect.left) / rect.width;
            seekTo(p * duration);
          }}>
            <div className="np-progress-fill" style={{ width: `${pct}%` }} />
          </div>
          <div className="np-times">
            <span>{formatTime(progress)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        <div className="np-controls">
          <button className={`np-btn ${shuffle ? 'active' : ''}`} onClick={toggleShuffle}>
            <FiShuffle size={20} />
          </button>
          <button className="np-btn" onClick={prevSong}>
            <FiSkipBack size={22} />
          </button>
          <button className="np-play-btn" onClick={togglePlay}>
            {isPlaying ? <FiPause size={24} /> : <FiPlay size={24} />}
          </button>
          <button className="np-btn" onClick={nextSong}>
            <FiSkipForward size={22} />
          </button>
          <button className={`np-btn ${repeat !== 'off' ? 'active' : ''}`} onClick={toggleRepeat}>
            <FiRepeat size={20} />
            {repeat === 'one' && <span className="repeat-badge">1</span>}
          </button>
        </div>

        <div className="np-bottom">
          <div className="np-volume-row">
            <button className="np-vol-btn" onClick={() => setVolume(volume > 0 ? 0 : 0.7)}>
              {volume === 0 ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07"/></svg>
              )}
            </button>
            <div className="np-volume-track" onClick={e => {
              const rect = e.currentTarget.getBoundingClientRect();
              setVolume(Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width)));
            }}>
              <div className="np-volume-fill" style={{ width: `${volume * 100}%` }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NowPlaying;
