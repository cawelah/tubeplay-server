const express = require('express');
const Playlist = require('../models/Playlist');
const auth = require('../middleware/auth');
const { demoDb, isMongoConnected } = require('../config/demoDb');

const router = express.Router();

router.use(auth);

router.get('/', async (req, res) => {
  try {
    if (!isMongoConnected()) {
      const userPlaylists = demoDb.playlists.filter(p => p.user === req.userId);
      return res.json({ playlists: userPlaylists });
    }
    const playlists = await Playlist.find({ user: req.userId }).sort({ updatedAt: -1 });
    res.json({ playlists });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    if (!isMongoConnected()) {
      const pl = demoDb.playlists.find(p => p._id === req.params.id && p.user === req.userId);
      if (!pl) return res.status(404).json({ error: 'Playlist no encontrada' });
      return res.json({ playlist: pl });
    }
    const playlist = await Playlist.findOne({ _id: req.params.id, user: req.userId });
    if (!playlist) return res.status(404).json({ error: 'Playlist no encontrada' });
    res.json({ playlist });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!isMongoConnected()) {
      const pl = {
        _id: `pl_${Date.now()}`,
        name,
        description: description || '',
        imageUrl: '',
        user: req.userId,
        songs: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      demoDb.playlists.push(pl);
      return res.status(201).json({ playlist: pl });
    }
    const playlist = new Playlist({ name, description, user: req.userId });
    await playlist.save();
    res.status(201).json({ playlist });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, description, songs } = req.body;
    if (!isMongoConnected()) {
      const pl = demoDb.playlists.find(p => p._id === req.params.id && p.user === req.userId);
      if (!pl) return res.status(404).json({ error: 'Playlist no encontrada' });
      if (name !== undefined) pl.name = name;
      if (description !== undefined) pl.description = description;
      if (songs !== undefined) pl.songs = songs;
      pl.updatedAt = new Date();
      return res.json({ playlist: pl });
    }
    const playlist = await Playlist.findOneAndUpdate(
      { _id: req.params.id, user: req.userId },
      { name, description, songs },
      { new: true }
    );
    if (!playlist) return res.status(404).json({ error: 'Playlist no encontrada' });
    res.json({ playlist });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    if (!isMongoConnected()) {
      const idx = demoDb.playlists.findIndex(p => p._id === req.params.id && p.user === req.userId);
      if (idx === -1) return res.status(404).json({ error: 'Playlist no encontrada' });
      demoDb.playlists.splice(idx, 1);
      return res.json({ message: 'Playlist eliminada' });
    }
    const playlist = await Playlist.findOneAndDelete({ _id: req.params.id, user: req.userId });
    if (!playlist) return res.status(404).json({ error: 'Playlist no encontrada' });
    res.json({ message: 'Playlist eliminada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/songs', async (req, res) => {
  try {
    const { videoId, title, artist, thumbnail, duration, durationSeconds } = req.body;
    if (!isMongoConnected()) {
      const pl = demoDb.playlists.find(p => p._id === req.params.id && p.user === req.userId);
      if (!pl) return res.status(404).json({ error: 'Playlist no encontrada' });
      if (!pl.songs.find(s => s.videoId === videoId)) {
        pl.songs.push({ videoId, title, artist, thumbnail, duration, durationSeconds, addedAt: new Date() });
      }
      pl.updatedAt = new Date();
      return res.json({ playlist: pl });
    }
    const playlist = await Playlist.findOne({ _id: req.params.id, user: req.userId });
    if (!playlist) return res.status(404).json({ error: 'Playlist no encontrada' });
    const exists = playlist.songs.find(s => s.videoId === videoId);
    if (!exists) {
      playlist.songs.push({ videoId, title, artist, thumbnail, duration, durationSeconds });
      await playlist.save();
    }
    res.json({ playlist });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id/songs/:videoId', async (req, res) => {
  try {
    if (!isMongoConnected()) {
      const pl = demoDb.playlists.find(p => p._id === req.params.id && p.user === req.userId);
      if (!pl) return res.status(404).json({ error: 'Playlist no encontrada' });
      pl.songs = pl.songs.filter(s => s.videoId !== req.params.videoId);
      pl.updatedAt = new Date();
      return res.json({ playlist: pl });
    }
    const playlist = await Playlist.findOne({ _id: req.params.id, user: req.userId });
    if (!playlist) return res.status(404).json({ error: 'Playlist no encontrada' });
    playlist.songs = playlist.songs.filter(s => s.videoId !== req.params.videoId);
    await playlist.save();
    res.json({ playlist });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
