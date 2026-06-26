import React from 'react';
import { FiPlay, FiPause, FiSkipBack, FiSkipForward, FiChevronUp } from 'react-icons/fi';
import { usePlayer } from '../context/PlayerContext';

const PlayerBar = ({ onExpand }) => {
  const { currentSong, isPlaying, progress, duration, togglePlay, nextSong, prevSong, seekTo } = usePlayer();

  const formatTime = (s) => {
    if (!s) return '0:00';
    return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`;
  };

  if (!currentSong) return null;

  const pct = duration ? (progress / duration) * 100 : 0;

  return (
    <div className="player-bar">
      <div className="player-bar-progress-wrap">
        <input
          type="range"
          className="player-bar-progress"
          min="0"
          max="100"
          value={pct}
          onClick={e => e.stopPropagation()}
          onChange={e => { e.stopPropagation(); seekTo((e.target.value / 100) * duration); }}
        />
      </div>
      <div className="player-bar-content" onClick={onExpand}>
        <img
          src={currentSong.thumbnail}
          alt=""
          className="player-bar-img"
          onError={e => { e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect fill="%23333" width="48" height="48"/><text x="24" y="30" text-anchor="middle" fill="%231DB954" font-size="20">♪</text></svg>'; }}
        />
        <div className="player-bar-info">
          <p className="player-bar-title">{currentSong.title}</p>
          <p className="player-bar-artist">{currentSong.artist}</p>
        </div>
        <div className="player-bar-actions" onClick={e => e.stopPropagation()}>
          <button className="bar-btn" onClick={prevSong}><FiSkipBack size={18} /></button>
          <button className="bar-btn bar-play" onClick={togglePlay}>
            {isPlaying ? <FiPause size={20} /> : <FiPlay size={20} />}
          </button>
          <button className="bar-btn" onClick={nextSong}><FiSkipForward size={18} /></button>
        </div>
        <button className="bar-btn bar-expand" onClick={onExpand}><FiChevronUp size={20} /></button>
      </div>
    </div>
  );
};

export default PlayerBar;
