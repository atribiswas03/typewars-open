const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, unique: true, sparse: true },
  password: { type: String },
  xp: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  gamesPlayed: { type: Number, default: 0 },
  gamesWon: { type: Number, default: 0 },
  averageWPM: { type: Number, default: 0 },
  bestWPM: { type: Number, default: 0 },
  achievements: [{ type: String }],
  otp: {
    code: String,
    expiresAt: Date,
    attempts: { type: Number, default: 0 }
  },
  isVerified: { type: Boolean, default: false },
  dailyStats: {
    lastChallengeDate: Date,
    challengeCount: { type: Number, default: 0 },
    trainingCount: { type: Number, default: 0 }
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
