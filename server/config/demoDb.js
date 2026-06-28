// Almacenamiento en memoria cuando MongoDB no está disponible
const demoDb = {
  users: [
    { _id: 'demo_user_1', username: 'DemoUser', email: 'demo@tubeplay.app', password: 'demo123' },
    { _id: 'demo_user_2', username: 'Test', email: 'test@test.com', password: 'test123' },
  ],
  playlists: [],
  likedSongs: [],
  downloads: []
};

let idCounter = 1;
const genId = () => `demo_${idCounter++}`;

const demoAuth = {
  token: null,
  demoUser: null
};

demoAuth.init = () => {
  const userId = genId();
  demoAuth.demoUser = {
    _id: userId,
    username: 'DemoUser',
    email: 'demo@tubeplay.app'
  };
  demoAuth.token = 'demo_token_tubeplay_2024';
  return demoAuth;
};

const mongoose = require('mongoose');

const isMongoConnected = () => {
  try {
    return mongoose.connection.readyState === 1;
  } catch {
    return false;
  }
};

module.exports = { demoDb, demoAuth, genId, isMongoConnected };
