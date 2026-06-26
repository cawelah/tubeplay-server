const mongoose = require('mongoose');

const downloadSchema = new mongoose.Schema({
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
  quality: {
    type: String,
    enum: ['128', '256', '320'],
    default: '128'
  },
  filePath: String,
  fileName: String,
  fileSize: Number,
  status: {
    type: String,
    enum: ['downloading', 'completed', 'failed'],
    default: 'downloading'
  }
}, { timestamps: true });

module.exports = mongoose.model('Download', downloadSchema);
