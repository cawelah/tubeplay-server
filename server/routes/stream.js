const express = require('express');
const path = require('path');
const { execSync, spawn } = require('child_process');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const https = require('https');
const http = require('http');
const User = require('../models/User');
const { isMongoConnected } = require('../config/demoDb');

const router = express.Router();

const authQuery = async (req, res, next) => {
  try {
    const token = req.query.token || req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Token requerido' });
    if (!isMongoConnected()) {
      if (token.startsWith('demo_')) { req.userId = 'demo_user'; return next(); }
      return res.status(401).json({ error: 'Token inválido' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ error: 'Usuario no encontrado' });
    req.userId = user._id;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token inválido' });
  }
};

function findYtDlp() {
  for (const name of ['./yt-dlp.exe', './yt-dlp']) {
    if (fs.existsSync(name)) return name;
  }
  try { execSync('yt-dlp --version', { stdio: 'pipe' }); return 'yt-dlp'; }
  catch { return null; }
}

router.get('/:videoId', authQuery, async (req, res) => {
  try {
    const { videoId } = req.params;

    if (videoId.startsWith('demo_')) {
      return sendDemoAudio(res);
    }

    const ytDlpBin = findYtDlp();
    if (ytDlpBin) {
      try {
        await streamYtDlp(ytDlpBin, videoId, req, res);
        return;
      } catch (e) {
        console.error('yt-dlp error:', e.message);
      }
    }

    try {
      await streamYtdlCore(videoId, req, res);
      return;
    } catch (e) {
      console.error('ytdl-core error:', e.message);
    }

    if (!res.headersSent) {
      res.status(503).json({ error: 'No se pudo reproducir esta canción.' });
    }
  } catch (error) {
    console.error('Stream error:', error.message);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Error al reproducir' });
    }
  }
});

function streamYtDlp(bin, videoId, req, res) {
  return new Promise((resolve, reject) => {
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    const proc = spawn(bin, [
      '--extractor-args', 'youtube:player_client=android',
      '--get-url',
      '--no-warnings',
      url
    ], { timeout: 30000, windowsHide: true });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (d) => { stdout += d.toString(); });
    proc.stderr.on('data', (d) => { stderr += d.toString(); });

    proc.on('close', (code) => {
      if (code !== 0 || !stdout.trim()) {
        return reject(new Error(stderr.trim() || `Exit code ${code}`));
      }
      const streamUrl = stdout.trim().split('\n')[0];
      if (!streamUrl || !streamUrl.startsWith('http')) {
        return reject(new Error('URL inválida'));
      }

      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Cache-Control', 'no-cache');

      const mod = streamUrl.startsWith('https') ? https : http;
      mod.get(streamUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (proxyRes) => {
        if (proxyRes.statusCode !== 200) {
          proxyRes.resume();
          return reject(new Error(`YouTube respondió ${proxyRes.statusCode}`));
        }
        proxyRes.pipe(res);
      }).on('error', reject);
    });

    req.on('close', () => { try { proc.kill(); } catch {} });
  });
}

function streamYtdlCore(videoId, req, res) {
  return new Promise((resolve, reject) => {
    try {
      const ytdl = require('ytdl-core');
      const agent = new https.Agent({
        rejectUnauthorized: false,
        keepAlive: true,
      });

      const stream = ytdl(videoId, {
        quality: 'highestaudio',
        filter: 'audioonly',
        highWaterMark: 1 << 25,
        requestOptions: {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept-Language': 'en-US,en;q=0.9',
          },
          httpsAgent: agent,
        },
      });

      let hasData = false;
      const timeout = setTimeout(() => {
        if (!hasData) { stream.destroy(); reject(new Error('Timeout ytdl-core')); }
      }, 20000);

      stream.on('info', (info, format) => {
        hasData = true;
        const mime = format?.mimeType || 'audio/mpeg';
        res.setHeader('Content-Type', mime.includes('audio') ? mime : 'audio/mpeg');
        res.setHeader('Accept-Ranges', 'bytes');
        stream.pipe(res);
      });

      stream.on('error', (err) => {
        clearTimeout(timeout);
        stream.destroy();
        reject(err);
      });

      stream.on('end', () => {
        clearTimeout(timeout);
        if (!res.headersSent) reject(new Error('Sin datos'));
        else resolve();
      });

      req.on('close', () => { clearTimeout(timeout); stream.destroy(); });
    } catch (err) {
      reject(err);
    }
  });
}

function sendDemoAudio(res) {
  const sr = 44100;
  const len = sr;
  const buf = Buffer.alloc(len * 2);
  for (let i = 0; i < len; i++) {
    const t = i / sr;
    const s = Math.sin(2 * Math.PI * 440 * t) * 0.3 + Math.sin(2 * Math.PI * 554 * t) * 0.15;
    buf.writeInt16LE(Math.floor(Math.max(-1, Math.min(1, s)) * 32767), i * 2);
  }
  const h = Buffer.alloc(44);
  h.write('RIFF', 0); h.writeUInt32LE(36 + buf.length, 4);
  h.write('WAVE', 8); h.write('fmt ', 12);
  h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20);
  h.writeUInt16LE(1, 22); h.writeUInt32LE(sr, 24);
  h.writeUInt32LE(sr * 2, 28); h.writeUInt16LE(2, 32);
  h.writeUInt16LE(16, 34); h.write('data', 36);
  h.writeUInt32LE(buf.length, 40);
  res.setHeader('Content-Type', 'audio/wav');
  res.setHeader('Content-Disposition', 'inline');
  res.setHeader('Cache-Control', 'no-cache');
  res.send(Buffer.concat([h, buf]));
}

module.exports = router;
