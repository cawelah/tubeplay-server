const mongoose = require('mongoose');

const likedSongSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  videoId: {
    type: String,
    required: true
  },
  title: String,
  artist: String,
  thumbnail: String,
  duration: String,
  durationSeconds: Number
}, { timestamps: true });

likedSongSchema.index({ user: 1, videoId: 1 }, { unique: true });

module.exports = mongoose.model('LikedSong', likedSongSchema);
