import React, { useState, useEffect } from 'react';
import { FiDownload, FiTrash2, FiPlay, FiArrowLeft } from 'react-icons/fi';
import { usePlayer } from '../context/PlayerContext';
import { getDownloads, deleteDownload, requestDownload } from '../api/axios';
import { Link } from 'react-router-dom';

const Downloads = () => {
  const [downloads, setDownloads] = useState([]);
  const [showQuality, setShowQuality] = useState(null);
  const { playSong } = usePlayer();

  useEffect(() => {
    loadDownloads();
  }, []);

  const loadDownloads = async () => {
    try {
      const res = await getDownloads();
      setDownloads(res.data.downloads);
    } catch (err) {
      console.error('Error loading downloads:', err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteDownload(id);
      setDownloads(prev => prev.filter(d => d._id !== id));
    } catch (err) {
      console.error('Error deleting download:', err);
    }
  };

  const handleDownload = async (song) => {
    try {
      await requestDownload(song);
      loadDownloads();
    } catch (err) {
      console.error('Download error:', err);
    }
  };

  const handlePlayLocal = async (download) => {
    if (download.fileUrl) {
      const song = {
        videoId: download.videoId,
        title: download.title,
        artist: download.artist,
        thumbnail: download.thumbnail,
        duration: download.duration,
        localUrl: download.fileUrl
      };
      playSong(song);
    }
  };

  const formatSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="page downloads-page">
      <Link to="/" className="back-link"><FiArrowLeft size={20} /> Volver</Link>

      <div className="page-header">
        <FiDownload size={32} />
        <h1>Descargas</h1>
        <p className="page-subtitle">Tus canciones descargadas en MP3</p>
      </div>

      <div className="songs-list">
        {downloads.length === 0 && (
          <div className="empty-state">
            <FiDownload size={48} />
            <h3>Sin descargas</h3>
            <p>Descarga canciones para escuchar sin internet</p>
          </div>
        )}
        {downloads.map(d => (
          <div key={d._id} className="song-row">
            <span className={`status-indicator ${d.status}`} />
            <img src={d.thumbnail} alt={d.title} className="song-row-img" />
            <div className="song-row-info">
              <p className="song-row-title">{d.title}</p>
              <p className="song-row-artist">{d.artist} · {d.quality}kbps {d.fileSize ? `· ${formatSize(d.fileSize)}` : ''}</p>
            </div>
            <span className="download-status">{d.status === 'completed' ? '✓' : d.status === 'downloading' ? '⏳' : '✗'}</span>
            {d.status === 'completed' && (
              <button className="btn-icon" onClick={() => handlePlayLocal(d)} title="Reproducir">
                <FiPlay size={16} />
              </button>
            )}
            {d.status === 'completed' && (
              <button className="btn-icon" onClick={() => handleDelete(d._id)} title="Eliminar">
                <FiTrash2 size={14} />
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="download-section">
        <h3>Descargar nueva canción</h3>
        <p>Busca una canción y usa el icono de descarga para descargarla en MP3.</p>
        <Link to="/" className="btn-primary">
          <FiSearch size={18} /> Ir a buscar
        </Link>
      </div>
    </div>
  );
};

export default Downloads;
