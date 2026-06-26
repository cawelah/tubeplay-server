const express = require('express');
const { spawn } = require('child_process');
const https = require('https');
const jwt = require('jsonwebtoken');
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

router.get('/:videoId', authQuery, async (req, res) => {
  try {
    const { videoId } = req.params;

    if (videoId.startsWith('demo_')) {
      return sendDemoAudio(res);
    }

    // 1) Intentar con yt-dlp (más confiable)
    try {
      console.log(`Stream: intentando con yt-dlp para ${videoId}`);
      await streamYtDlp(videoId, req, res);
      return;
    } catch (e) {
      console.log(`yt-dlp falló: ${e.message}`);
    }

    // 2) Fallback a ytdl-core
    try {
      console.log(`Stream: intentando con ytdl-core para ${videoId}`);
      await streamYtdlCore(videoId, req, res);
      return;
    } catch (e) {
      console.log(`ytdl-core falló: ${e.message}`);
    }

    // 3) Error final
    if (!res.headersSent) {
      res.status(503).json({ error: 'No se pudo reproducir. Asegúrate de tener yt-dlp instalado.' });
    }

  } catch (error) {
    console.error('Stream error general:', error.message);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Error al reproducir' });
    }
  }
});

async function streamYtdlCore(videoId, req, res) {
  return new Promise((resolve, reject) => {
    try {
      const ytdl = require('ytdl-core');
      const stream = ytdl(videoId, {
        quality: 'highestaudio',
        filter: 'audioonly',
        highWaterMark: 1 << 25
      });

      let hasData = false;

      stream.on('info', () => { hasData = true; });

      stream.on('progress', () => {
        if (!hasData) hasData = true;
      });

      stream.on('response', () => {
        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Accept-Ranges', 'bytes');
        stream.pipe(res);
      });

      stream.on('error', (err) => {
        stream.destroy();
        reject(err);
      });

      stream.on('end', () => {
        if (!hasData) reject(new Error('Sin datos de ytdl-core'));
        else if (!res.headersSent) reject(new Error('Sin envio de headers'));
        else resolve();
      });

      req.on('close', () => stream.destroy());

      setTimeout(() => {
        if (!hasData) { stream.destroy(); reject(new Error('Timeout ytdl-core')); }
      }, 12000);

    } catch (err) {
      reject(err);
    }
  });
}

async function streamYtDlp(videoId, req, res) {
  return new Promise((resolve, reject) => {
    const url = `https://www.youtube.com/watch?v=${videoId}`;

    const getUrl = spawn('yt-dlp', [
      '-f', 'bestaudio/best',
      '--get-url',
      '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      '--extractor-retries', '3',
      '--no-warnings',
      '--no-check-certificate',
      url
    ], { stdio: ['ignore', 'pipe', 'pipe'] });

    let audioUrl = '';
    let stderr = '';
    const timeout = setTimeout(() => {
      getUrl.kill('SIGTERM');
      reject(new Error('Timeout obteniendo URL'));
    }, 15000);

    getUrl.stdout.on('data', (data) => {
      audioUrl += data.toString();
    });

    getUrl.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    getUrl.on('close', (code) => {
      clearTimeout(timeout);
      if (code !== 0 || !audioUrl.trim()) {
        return reject(new Error(`yt-dlp exit code ${code}: ${stderr.slice(0, 200)}`));
      }
      audioUrl = audioUrl.trim().split('\n')[0];
      console.log(`Stream URL obtenida para ${videoId}`);

      const https = require('https');
      https.get(audioUrl, (audioRes) => {
        if (audioRes.statusCode !== 200) {
          return reject(new Error(`Audio source HTTP ${audioRes.statusCode}`));
        }
        res.setHeader('Content-Type', audioRes.headers['content-type'] || 'audio/mpeg');
        res.setHeader('Accept-Ranges', 'bytes');
        audioRes.pipe(res);
        audioRes.on('end', () => {
          if (res.headersSent) { res.end(); resolve(); }
          else reject(new Error('Sin datos'));
        });
      }).on('error', (err) => {
        reject(new Error(`HTTP get error: ${err.message}`));
      });
    });

    getUrl.on('error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });

    req.on('close', () => {
      clearTimeout(timeout);
      getUrl.kill('SIGTERM');
    });
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
