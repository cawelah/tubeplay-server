const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();

const app = express();

process.on('uncaughtException', (err) => {
  console.log('UNCAUGHT EXCEPTION:', err.message, err.stack);
});
process.on('unhandledRejection', (reason) => {
  console.log('UNHANDLED REJECTION:', reason);
});

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

app.get('/', (req, res) => {
  res.json({ app: 'TubePlay API', version: '1.0.0' });
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/search', require('./routes/search'));
app.use('/api/stream', require('./routes/stream'));
app.use('/api/playlists', require('./routes/playlists'));
app.use('/api/liked', require('./routes/liked'));
app.use('/api/downloads', require('./routes/downloads'));

app.use('/downloads', express.static(path.join(__dirname, 'downloads')));

const PORT = process.env.PORT || 5000;

console.log('STARTUP: Node version:', process.version);
console.log('STARTUP: PID:', process.pid);
console.log('STARTUP: PORT env:', PORT);

app.listen(PORT, '::', () => {
  console.log(`TubePlay server corriendo en puerto ${PORT}`);
  connectDB().then(connected => {
    if (connected) console.log('MongoDB conectado correctamente');
    else console.log('MongoDB no disponible - modo sin base de datos');
  }).catch(err => {
    console.log('Error conectando MongoDB:', err.message);
  });
});
