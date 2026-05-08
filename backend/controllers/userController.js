const User = require('../models/User');

exports.getLeaderboard = async (req, res) => {
  try {
    const users = await User.find()
      .sort({ bestWPM: -1 })
      .limit(10)
      .select('username bestWPM averageWPM level xp');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getUserStats = async (req, res) => {
  const { username } = req.params;
  try {
    let user = await User.findOne({ username });
    
    if (!user) {
      // Create new user if not found
      user = new User({ username });
      await user.save();
    }
    
    // Calculate global rank based on bestWPM
    const rank = await User.countDocuments({ 
      $or: [
        { bestWPM: { $gt: user.bestWPM } },
        { bestWPM: user.bestWPM, _id: { $lt: user._id } }
      ]
    }) + 1;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let hasCompletedDaily = false;
    if (user.dailyStats?.lastChallengeDate && new Date(user.dailyStats.lastChallengeDate).getTime() >= today.getTime()) {
      hasCompletedDaily = user.dailyStats.challengeCount >= 1;
    }

    res.json({
      username: user.username,
      globalRank: rank,
      bestWPM: user.bestWPM,
      wins: user.gamesWon,
      losses: user.gamesPlayed - user.gamesWon,
      totalGames: user.gamesPlayed,
      level: user.level,
      xp: user.xp,
      hasCompletedDaily
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateStats = async (req, res) => {
  const { username, wpm, accuracy, mode } = req.body; // mode: 'battle', 'challenge', 'training'
  try {
    let user = await User.findOne({ username });
    if (!user) {
      user = new User({ username });
    }

    // Daily limit logic
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (!user.dailyStats.lastChallengeDate || new Date(user.dailyStats.lastChallengeDate).getTime() < today.getTime()) {
      user.dailyStats.lastChallengeDate = today;
      user.dailyStats.challengeCount = 0;
      user.dailyStats.trainingCount = 0;
    }

    if (mode === 'challenge') {
      if (user.dailyStats.challengeCount >= 1) {
        return res.status(403).json({ message: 'DAILY_CHALLENGE_LIMIT_REACHED' });
      }
      user.dailyStats.challengeCount += 1;
    } else if (mode === 'training') {
      // Training mode does not affect any XP or WPM
      return res.json(user);
    }

    user.gamesPlayed += 1;
    if (wpm > user.bestWPM) user.bestWPM = wpm;
    
    // Simple average calculation
    user.averageWPM = ((user.averageWPM * (user.gamesPlayed - 1)) + wpm) / user.gamesPlayed;
    
    // XP and Leveling logic (Infinite)
    let xpMultiplier = 2;
    if (mode === 'challenge') xpMultiplier = 5; // Challenge gives more XP
    
    const xpGained = Math.round(wpm * (accuracy / 100) * xpMultiplier);
    user.xp += xpGained;
    
    // level = floor((xp/100)^0.6) + 1
    user.level = Math.floor(Math.pow(user.xp / 100, 0.6)) + 1;

    await user.save();
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteGuest = async (req, res) => {
  const { username } = req.params;
  try {
    const user = await User.findOne({ username });
    if (user && !user.email) {
      await User.deleteOne({ _id: user._id });
      return res.json({ message: 'GUEST_RECORD_TERMINATED' });
    }
    res.status(400).json({ message: 'NOT_A_GUEST_OR_USER_NOT_FOUND' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
