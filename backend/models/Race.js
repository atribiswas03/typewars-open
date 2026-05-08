const mongoose = require('mongoose');

const raceSchema = new mongoose.Schema({
  players: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    username: String,
    wpm: Number,
    accuracy: Number,
    rank: Number
  }],
  text: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Race', raceSchema);
