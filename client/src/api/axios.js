import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

API.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

API.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const searchSongs = (q, maxResults = 20) =>
  API.get('/search', { params: { q, maxResults } });

export const streamSong = videoId => {
  const token = localStorage.getItem('token');
  return `${API.defaults.baseURL}/stream/${videoId}?token=${token}`;
};

export const getPlaylists = () =>
  API.get('/playlists');

export const getPlaylist = id =>
  API.get(`/playlists/${id}`);

export const createPlaylist = data =>
  API.post('/playlists', data);

export const updatePlaylist = (id, data) =>
  API.put(`/playlists/${id}`, data);

export const deletePlaylist = id =>
  API.delete(`/playlists/${id}`);

export const addSongToPlaylist = (id, song) =>
  API.post(`/playlists/${id}/songs`, song);

export const removeSongFromPlaylist = (id, videoId) =>
  API.delete(`/playlists/${id}/songs/${videoId}`);

export const getLikedSongs = () =>
  API.get('/liked');

export const likeSong = song =>
  API.post('/liked', song);

export const unlikeSong = videoId =>
  API.delete(`/liked/${videoId}`);

export const checkLiked = videoId =>
  API.get(`/liked/check/${videoId}`);

export const getDownloads = () =>
  API.get('/downloads');

export const requestDownload = data =>
  API.post('/downloads', data);

export const deleteDownload = id =>
  API.delete(`/downloads/${id}`);

export const login = (email, password) =>
  API.post('/auth/login', { email, password });

export const register = (username, email, password) =>
  API.post('/auth/register', { username, email, password });

export const getMe = () =>
  API.get('/auth/me');

export default API;
