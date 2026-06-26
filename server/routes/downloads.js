const express = require('express');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const Download = require('../models/Download');
const auth = require('../middleware/auth');
const { demoDb, isMongoConnected } = require('../config/demoDb');

const router = express.Router();

const DOWNLOADS_DIR = path.join(__dirname, '..', 'downloads');

if (!fs.existsSync(DOWNLOADS_DIR)) {
  fs.mkdirSync(DOWNLOADS_DIR, { recursive: true });
}

router.use(auth);

router.get('/', async (req, res) => {
  try {
    if (!isMongoConnected()) {
      const downloads = demoDb.downloads
        .filter(d => d.user === req.userId)
        .map(d => ({
          ...d,
          fileUrl: d.status === 'completed' ? `/api/downloads/file/${d._id}` : null
        }));
      return res.json({ downloads });
    }
    const downloads = await Download.find({ user: req.userId }).sort({ createdAt: -1 });
    const enriched = downloads.map(d => ({
      ...d.toObject(),
      fileUrl: d.status === 'completed' ? `/api/downloads/file/${d._id}` : null
    }));
    res.json({ downloads: enriched });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { videoId, title, artist, thumbnail, duration, quality = '128' } = req.body;

    if (!isMongoConnected()) {
      const existing = demoDb.downloads.find(d => d.user === req.userId && d.videoId === videoId && d.quality === quality);
      if (existing && existing.status === 'completed') {
        return res.json({ download: existing, message: 'Ya descargado' });
      }
      const download = {
        _id: `dl_${Date.now()}`,
        user: req.userId, videoId, title, artist, thumbnail, duration, quality,
        status: 'downloading', filePath: '', fileName: '', fileSize: 0,
        createdAt: new Date()
      };
      demoDb.downloads.push(download);
      setTimeout(() => {
        download.status = 'completed';
        download.fileName = `${title?.replace(/[^a-zA-Z0-9]/g, '_')}.mp3`;
        download.fileSize = Math.floor(Math.random() * 5000000) + 1000000;
      }, 1500);
      return res.json({ download, message: 'Descarga iniciada (demo)' });
    }

    const existing = await Download.findOne({ user: req.userId, videoId, quality });
    if (existing && existing.status === 'completed') {
      return res.json({ download: existing, message: 'Ya descargado' });
    }

    const download = new Download({ user: req.userId, videoId, title, artist, thumbnail, duration, quality, status: 'downloading' });
    await download.save();

    const safeTitle = title.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50);
    const fileName = `${safeTitle}_${videoId}_${quality}.mp3`;
    const filePath = path.join(DOWNLOADS_DIR, fileName);
    const qualityMap = { '128': '128k', '256': '256k', '320': '320k' };
    const bitrate = qualityMap[quality] || '128k';
    const ytDlpPath = 'yt-dlp';
    const command = `"${ytDlpPath}" -x --audio-format mp3 --audio-quality ${bitrate} -o "${filePath}" https://www.youtube.com/watch?v=${videoId}`;

    exec(command, { timeout: 300000 }, async (error) => {
      if (error) { download.status = 'failed'; await download.save(); return; }
      try {
        const stats = fs.statSync(filePath);
        download.status = 'completed';
        download.filePath = filePath;
        download.fileName = fileName;
        download.fileSize = stats.size;
        await download.save();
      } catch { download.status = 'failed'; await download.save(); }
    });

    res.json({ download, message: 'Descarga iniciada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    if (!isMongoConnected()) {
      const idx = demoDb.downloads.findIndex(d => d._id === req.params.id && d.user === req.userId);
      if (idx === -1) return res.status(404).json({ error: 'Descarga no encontrada' });
      demoDb.downloads.splice(idx, 1);
      return res.json({ message: 'Descarga eliminada' });
    }
    const download = await Download.findOne({ _id: req.params.id, user: req.userId });
    if (!download) return res.status(404).json({ error: 'Descarga no encontrada' });
    if (download.filePath && fs.existsSync(download.filePath)) fs.unlinkSync(download.filePath);
    await Download.findByIdAndDelete(req.params.id);
    res.json({ message: 'Descarga eliminada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/file/:id', async (req, res) => {
  try {
    if (!isMongoConnected()) {
      const download = demoDb.downloads.find(d => d._id === req.params.id && d.user === req.userId);
      if (!download) return res.status(404).json({ error: 'Archivo no encontrado' });
      const buf = Buffer.alloc(1024 * 100);
      res.setHeader('Content-Type', 'audio/mpeg');
      return res.send(buf);
    }
    const download = await Download.findOne({ _id: req.params.id, user: req.userId });
    if (!download || !download.filePath || !fs.existsSync(download.filePath)) {
      return res.status(404).json({ error: 'Archivo no encontrado' });
    }
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Disposition', `attachment; filename="${download.fileName}"`);
    fs.createReadStream(download.filePath).pipe(res);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
