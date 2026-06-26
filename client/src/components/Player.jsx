import React from 'react';
import { FiPlay, FiPause, FiSkipBack, FiSkipForward, FiShuffle, FiRepeat } from 'react-icons/fi';
import { FaVolumeUp, FaVolumeMute } from 'react-icons/fa';
import { usePlayer } from '../context/PlayerContext';

const Player = () => {
  const {
    currentSong, isPlaying, progress, duration, volume, shuffle, repeat,
    togglePlay, nextSong, prevSong, seekTo, setVolume, toggleShuffle, toggleRepeat
  } = usePlayer();

  const formatTime = (seconds) => {
    if (!seconds) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleProgressChange = (e) => {
    const newTime = (e.target.value / 100) * duration;
    seekTo(newTime);
  };

  const handleVolumeChange = (e) => {
    setVolume(e.target.value / 100);
  };

  if (!currentSong) return null;

  return (
    <footer className="player">
      <div className="player-song-info">
        <img
          src={currentSong.thumbnail}
          alt={currentSong.title}
          className="player-thumbnail"
          onError={e => { e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect fill="%23333" width="48" height="48"/><text x="24" y="30" text-anchor="middle" fill="%231DB954" font-size="20">♪</text></svg>'; }}
        />
        <div className="player-text">
          <p className="player-title">{currentSong.title}</p>
          <p className="player-artist">{currentSong.artist}</p>
        </div>
      </div>

      <div className="player-controls">
        <div className="player-buttons">
          <button className={`control-btn ${shuffle ? 'active' : ''}`} onClick={toggleShuffle} title="Aleatorio">
            <FiShuffle size={18} />
          </button>
          <button className="control-btn" onClick={prevSong} title="Anterior">
            <FiSkipBack size={22} />
          </button>
          <button className="control-btn play-btn" onClick={togglePlay} title={isPlaying ? 'Pausa' : 'Play'}>
            {isPlaying ? <FiPause size={24} /> : <FiPlay size={24} />}
          </button>
          <button className="control-btn" onClick={nextSong} title="Siguiente">
            <FiSkipForward size={22} />
          </button>
          <button className={`control-btn ${repeat !== 'off' ? 'active' : ''}`} onClick={toggleRepeat} title="Repetir">
            <FiRepeat size={18} />
            {repeat === 'one' && <span className="repeat-one">1</span>}
          </button>
        </div>
        <div className="progress-bar-container">
          <span className="time">{formatTime(progress)}</span>
          <input
            type="range"
            className="progress-bar"
            min="0"
            max="100"
            value={duration ? (progress / duration) * 100 : 0}
            onChange={handleProgressChange}
          />
          <span className="time">{formatTime(duration)}</span>
        </div>
      </div>

      <div className="player-volume">
        <button className="control-btn" onClick={() => setVolume(volume === 0 ? 0.7 : 0)}>
          {volume === 0 ? <FaVolumeMute size={18} /> : <FaVolumeUp size={18} />}
        </button>
        <input
          type="range"
          className="volume-bar"
          min="0"
          max="100"
          value={volume * 100}
          onChange={handleVolumeChange}
        />
      </div>
    </footer>
  );
};

export default Player;
