const express = require('express');
const axios = require('axios');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const { q, maxResults = 20 } = req.query;
    if (!q) {
      return res.status(400).json({ error: 'Query parameter "q" is required' });
    }

    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey || apiKey === 'your_youtube_api_key_here') {
      // Modo demo: resultados simulados
      const demoResults = generateDemoResults(q, parseInt(maxResults));
      return res.json(demoResults);
    }

    const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
      params: {
        part: 'snippet',
        maxResults,
        q,
        type: 'video',
        videoCategoryId: '10',
        key: apiKey
      }
    });

    const videoIds = response.data.items.map(item => item.id.videoId);
    const statsResponse = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
      params: {
        part: 'contentDetails,statistics',
        id: videoIds.join(','),
        key: apiKey
      }
    });

    const statsMap = {};
    statsResponse.data.items.forEach(item => {
      statsMap[item.id] = {
        duration: item.contentDetails.duration,
        durationSeconds: parseDuration(item.contentDetails.duration),
        viewCount: item.statistics.viewCount
      };
    });

    const results = response.data.items.map(item => ({
      videoId: item.id.videoId,
      title: item.snippet.title,
      artist: item.snippet.channelTitle,
      thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium?.url,
      duration: statsMap[item.id.videoId]?.duration || 'PT0S',
      durationSeconds: statsMap[item.id.videoId]?.durationSeconds || 0
    }));

    res.json({ results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

function parseDuration(duration) {
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  const hours = parseInt(match[1]) || 0;
  const minutes = parseInt(match[2]) || 0;
  const seconds = parseInt(match[3]) || 0;
  return hours * 3600 + minutes * 60 + seconds;
}

function generateDemoResults(query, maxResults) {
  const demos = [];
  const prefixes = ['🎵', '♪', '🎶', '▶', '🎤'];
  const suffixes = ['(Official Video)', '(Audio)', '(Lyrics)', '(Remix)', '(Live)'];
  const artists = ['Artist One', 'Singer Two', 'Band Three', 'DJ Four', 'Crew Five'];

  for (let i = 0; i < maxResults; i++) {
    const prefix = prefixes[i % prefixes.length];
    const suffix = suffixes[i % suffixes.length];
    demos.push({
      videoId: `demo_${i}_${Date.now()}`,
      title: `${prefix} ${query} ${suffix} - Song ${i + 1}`,
      artist: artists[i % artists.length],
      thumbnail: `https://picsum.photos/seed/${query}${i}/480/360`,
      duration: `PT${Math.floor(Math.random() * 5) + 2}M${Math.floor(Math.random() * 60)}S`,
      durationSeconds: Math.floor(Math.random() * 300) + 120,
      viewCount: Math.floor(Math.random() * 10000000)
    });
  }
  return { results: demos };
}

module.exports = router;
