import React from 'react';
import { FiPlay, FiPause, FiSkipBack, FiSkipForward, FiShuffle, FiRepeat, FiChevronDown, FiHeart } from 'react-icons/fi';
import { FaVolumeUp, FaVolumeMute } from 'react-icons/fa';
import { usePlayer } from '../context/PlayerContext';

const NowPlaying = ({ onClose }) => {
  const {
    currentSong, isPlaying, progress, duration, volume, shuffle, repeat,
    togglePlay, nextSong, prevSong, seekTo, setVolume, toggleShuffle, toggleRepeat
  } = usePlayer();

  const formatTime = (s) => {
    if (!s) return '0:00';
    return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`;
  };

  if (!currentSong) return null;

  const pct = duration ? (progress / duration) * 100 : 0;

  return (
    <div className="now-playing-overlay">
      <div className="now-playing">
        <div className="np-handle-bar" onClick={onClose}>
          <div className="np-handle" />
        </div>

        <div className="np-header">
          <button className="np-header-btn" onClick={onClose}>
            <FiChevronDown size={26} />
          </button>
          <span className="np-header-label">REPRODUCIENDO</span>
          <button className="np-header-btn">
            <FiHeart size={20} />
          </button>
        </div>

        <div className="np-artwork">
          <img
            src={currentSong.thumbnail}
            alt={currentSong.title}
            onError={e => { e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300"><rect fill="%23333" width="300" height="300"/><text x="150" y="170" text-anchor="middle" fill="%231DB954" font-size="80">♪</text></svg>'; }}
          />
        </div>

        <div className="np-info">
          <div className="np-text">
            <p className="np-title">{currentSong.title}</p>
            <p className="np-artist">{currentSong.artist}</p>
          </div>
        </div>

        <div className="np-progress-section">
          <input
            type="range"
            className="np-progress"
            min="0"
            max="100"
            value={pct}
            onChange={e => seekTo((e.target.value / 100) * (duration || 1))}
          />
          <div className="np-times">
            <span>{formatTime(progress)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        <div className="np-controls">
          <button className={`np-btn ${shuffle ? 'active' : ''}`} onClick={toggleShuffle}>
            <FiShuffle size={22} />
          </button>
          <button className="np-btn" onClick={prevSong}>
            <FiSkipBack size={30} />
          </button>
          <button className="np-play-btn" onClick={togglePlay}>
            {isPlaying ? <FiPause size={34} /> : <FiPlay size={34} />}
          </button>
          <button className="np-btn" onClick={nextSong}>
            <FiSkipForward size={30} />
          </button>
          <button className={`np-btn ${repeat !== 'off' ? 'active' : ''}`} onClick={toggleRepeat}>
            <FiRepeat size={22} />
            {repeat === 'one' && <span className="repeat-badge">1</span>}
          </button>
        </div>

        <div className="np-volume-row">
          <button className="np-btn" onClick={() => setVolume(volume === 0 ? 0.7 : 0)}>
            {volume === 0 ? <FaVolumeMute size={16} /> : <FaVolumeUp size={16} />}
          </button>
          <input
            type="range"
            className="np-volume-bar"
            min="0"
            max="100"
            value={volume * 100}
            onChange={e => setVolume(e.target.value / 100)}
          />
        </div>
      </div>
    </div>
  );
};

export default NowPlaying;
