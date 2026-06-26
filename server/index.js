const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();

const app = express();

const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',')
  : ['http://localhost:3000'];

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/search', require('./routes/search'));
app.use('/api/stream', require('./routes/stream'));
app.use('/api/playlists', require('./routes/playlists'));
app.use('/api/liked', require('./routes/liked'));
app.use('/api/downloads', require('./routes/downloads'));

app.use('/downloads', express.static(path.join(__dirname, 'downloads')));

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  const connected = await connectDB();
  if (!connected) {
    console.log('MongoDB no disponible - iniciando en modo sin base de datos');
  } else {
    console.log('MongoDB conectado correctamente');
  }
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`TubePlay server corriendo en puerto ${PORT}`);
  });
};

startServer();
