const express = require('express');
const LikedSong = require('../models/LikedSong');
const auth = require('../middleware/auth');
const { demoDb, isMongoConnected } = require('../config/demoDb');

const router = express.Router();

router.use(auth);

router.get('/', async (req, res) => {
  try {
    if (!isMongoConnected()) {
      const songs = demoDb.likedSongs.filter(s => s.user === req.userId);
      return res.json({ songs });
    }
    const songs = await LikedSong.find({ user: req.userId }).sort({ createdAt: -1 });
    res.json({ songs });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { videoId, title, artist, thumbnail, duration, durationSeconds } = req.body;
    if (!isMongoConnected()) {
      const existing = demoDb.likedSongs.find(s => s.user === req.userId && s.videoId === videoId);
      if (existing) return res.json({ song: existing, message: 'Ya está en favoritos' });
      const song = {
        _id: `like_${Date.now()}`,
        user: req.userId,
        videoId, title, artist, thumbnail, duration, durationSeconds,
        createdAt: new Date()
      };
      demoDb.likedSongs.push(song);
      return res.status(201).json({ song });
    }
    const existing = await LikedSong.findOne({ user: req.userId, videoId });
    if (existing) return res.json({ song: existing, message: 'Ya está en favoritos' });
    const song = new LikedSong({ user: req.userId, videoId, title, artist, thumbnail, duration, durationSeconds });
    await song.save();
    res.status(201).json({ song });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:videoId', async (req, res) => {
  try {
    if (!isMongoConnected()) {
      const idx = demoDb.likedSongs.findIndex(s => s.user === req.userId && s.videoId === req.params.videoId);
      if (idx !== -1) demoDb.likedSongs.splice(idx, 1);
      return res.json({ message: 'Eliminado de favoritos' });
    }
    await LikedSong.findOneAndDelete({ user: req.userId, videoId: req.params.videoId });
    res.json({ message: 'Eliminado de favoritos' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/check/:videoId', async (req, res) => {
  try {
    if (!isMongoConnected()) {
      const song = demoDb.likedSongs.find(s => s.user === req.userId && s.videoId === req.params.videoId);
      return res.json({ liked: !!song });
    }
    const song = await LikedSong.findOne({ user: req.userId, videoId: req.params.videoId });
    res.json({ liked: !!song });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
