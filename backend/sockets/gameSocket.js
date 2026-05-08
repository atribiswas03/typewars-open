const { v4: uuidv4 } = require('uuid');
const { generateParagraph } = require('../utils/paragraphGenerator');

const rooms = new Map(); // roomId -> roomData
const waitingPlayers = [];
const matchmakingTimers = new Map(); // socket.id -> setTimeout

const BOT_NAMES = [
  "NEON_STALKER", "CYBER_WOLF", "DATA_GHOST", "ZERO_DAY", "VOID_RUNNER",
  "SILICON_SAMURAI", "GLITCH_HUNTER", "BINARY_REAPER", "NEURAL_WRAITH",
  "CHROME_RAVEN", "ECHO_PROTOCOL", "MATRIX_WALKER", "QUANTUM_PHANTOM"
];

let matchmakingPool = [];
let poolTimer = null;

module.exports = (io) => {
  const startMatch = async (players, humanPlayers) => {
    const roomId = uuidv4();
    
    // Calculate average level for paragraph generation
    const avgLevel = Math.round(humanPlayers.reduce((acc, p) => acc + (p.level || 1), 0) / humanPlayers.length) || 1;
    const quote = await generateParagraph(avgLevel);
    
    // Calculate match duration
    const wordCount = quote.split(' ').length;
    const matchDuration = Math.max(30, Math.min(120, Math.ceil((wordCount / 20) * 60) + 15));

    const roomData = {
      id: roomId,
      players: players.map(p => ({
        id: p.id,
        username: p.username,
        progress: 0,
        wpm: 0,
        accuracy: 100,
        isFinished: false,
        isBot: !!p.isBot,
        bestWPM: p.bestWPM || 40
      })),
      quote,
      startTime: null,
      status: 'waiting',
      matchDuration,
      timeRemaining: matchDuration
    };

    rooms.set(roomId, roomData);

    humanPlayers.forEach(p => {
      const socket = io.sockets.sockets.get(p.id);
      if (socket) socket.join(roomId);
    });

    io.to(roomId).emit('match_found', { 
      roomId, 
      quote, 
      players: roomData.players, 
      matchDuration 
    });

    let countdown = 5;
    const countdownInterval = setInterval(() => {
      io.to(roomId).emit('countdown', countdown);
      if (countdown === 0) {
        clearInterval(countdownInterval);
        roomData.startTime = Date.now();
        roomData.status = 'playing';
        io.to(roomId).emit('game_start');
        
        // Start logic for all bots in the room
        roomData.players.forEach(p => {
          if (p.isBot) {
            startBotLogic(roomId, p.id, p.bestWPM);
          }
        });
        
        startMatchTimer(roomId);
      }
      countdown--;
    }, 1000);
  };

  const startBotLogic = (roomId, botId, humanBestWPM) => {
    const room = rooms.get(roomId);
    if (!room) return;

    const bot = room.players.find(p => p.id === botId);
    const humanPlayer = room.players.find(p => !p.isBot);
    
    // Adjust bot WPM based on human player's bestWPM
    let targetWPM = Math.max(30, (humanBestWPM || 40) + (Math.random() * 20 - 10)); 
    
    let currentChars = 0;
    const botInterval = setInterval(() => {
      const currentRoom = rooms.get(roomId);
      if (!currentRoom || currentRoom.status !== 'playing') {
        clearInterval(botInterval);
        return;
      }

      // Check if bot is frozen
      if (bot.isFrozen && bot.freezeUntil > Date.now()) {
        return; 
      }

      // Dynamic speed adjustment: bot tries to stay competitive but not impossible
      if (humanPlayer && humanPlayer.wpm > 0) {
        // Bot targets human's current WPM + some variance
        const dynamicTarget = Math.max(30, humanPlayer.wpm + (Math.random() * 10 - 5));
        targetWPM = (targetWPM * 0.9) + (dynamicTarget * 0.1); // Smooth transition
      }

      const charsPerSecond = (targetWPM * 5) / 60;
      const totalChars = room.quote.length;

      currentChars += charsPerSecond * 0.5; // Update every 500ms
      const progress = Math.min((currentChars / totalChars) * 100, 100);
      
      bot.progress = progress;
      bot.wpm = Math.round(targetWPM);
      bot.accuracy = 95 + Math.random() * 5;

      io.to(roomId).emit('progress_update', currentRoom.players);

      if (progress >= 100) {
        bot.isFinished = true;
        bot.finishTime = Date.now();
        const finishedPlayers = currentRoom.players.filter(p => p.isFinished).length;
        bot.rank = finishedPlayers;

        if (finishedPlayers === currentRoom.players.length) {
          currentRoom.status = 'finished';
          io.to(roomId).emit('all_finished', currentRoom.players);
          rooms.delete(roomId);
        }
        clearInterval(botInterval);
      }
    }, 500);
  };  const startMatchTimer = (roomId) => {
    const room = rooms.get(roomId);
    if (!room) return;

    const timerInterval = setInterval(() => {
      const currentRoom = rooms.get(roomId);
      if (!currentRoom || currentRoom.status !== 'playing') {
        clearInterval(timerInterval);
        return;
      }

      currentRoom.timeRemaining--;
      io.to(roomId).emit('timer_update', currentRoom.timeRemaining);

      if (currentRoom.timeRemaining <= 0) {
        clearInterval(timerInterval);
        finishMatch(roomId, true); // true means time's up
      }
    }, 1000);
  };

  const finishMatch = (roomId, isTimeUp = false) => {
    const room = rooms.get(roomId);
    if (!room) return;

    room.status = 'finished';
    
    // If time is up, mark all unfinished players as finished
    if (isTimeUp) {
      room.players.forEach(player => {
        if (!player.isFinished) {
          player.isFinished = true;
          player.finishTime = Date.now();
          // Rank will be assigned below
        }
      });
    }

    // Assign final ranks based on progress
    const sortedPlayers = [...room.players].sort((a, b) => {
      if (a.progress !== b.progress) return b.progress - a.progress;
      return a.finishTime - b.finishTime;
    });

    sortedPlayers.forEach((player, index) => {
      player.rank = index + 1;
      const socket = io.sockets.sockets.get(player.id);
      if (socket && !player.isBot) {
        socket.emit('game_finished', { rank: player.rank, isTimeUp });
      }
    });

    io.to(roomId).emit('all_finished', room.players);
    rooms.delete(roomId);
  };

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join_matchmaking', async ({ username }) => {
      socket.username = username;
      
      try {
        const User = require('../models/User');
        const user = await User.findOne({ username });
        if (user) {
          socket.bestWPM = user.bestWPM;
          socket.level = user.level;
        }
      } catch (err) {
        console.error('Error fetching user stats:', err);
      }

      // Add to pool
      if (!matchmakingPool.some(p => p.id === socket.id)) {
        matchmakingPool.push({
          id: socket.id,
          username: socket.username,
          level: socket.level || 1,
          bestWPM: socket.bestWPM || 40
        });
      }

      // If pool reaches 5, start immediately
      if (matchmakingPool.length >= 5) {
        if (poolTimer) {
          clearTimeout(poolTimer);
          poolTimer = null;
        }
        const players = matchmakingPool.splice(0, 5);
        await startMatch(players, players);
        return;
      }

      // Start pool timer if not already running
      if (!poolTimer) {
        poolTimer = setTimeout(() => {
          const humanPlayers = [...matchmakingPool];
          matchmakingPool = [];
          poolTimer = null;

          if (humanPlayers.length === 0) return;

          const totalPlayers = 5;
          const roomPlayers = [...humanPlayers];
          
          // Fill remaining slots with bots
          while (roomPlayers.length < totalPlayers) {
            const botName = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)] + "_" + Math.floor(Math.random() * 99);
            roomPlayers.push({
              id: 'bot_' + uuidv4(),
              username: botName,
              isBot: true,
              bestWPM: humanPlayers[0].bestWPM || 40,
              level: humanPlayers[0].level || 1
            });
          }

          startMatch(roomPlayers, humanPlayers);
        }, 8000); // Wait 8 seconds for more humans
      }
    });

    socket.on('leave_matchmaking', () => {
      const poolIndex = matchmakingPool.findIndex(p => p.id === socket.id);
      if (poolIndex !== -1) {
        matchmakingPool.splice(poolIndex, 1);
        if (matchmakingPool.length === 0 && poolTimer) {
          clearTimeout(poolTimer);
          poolTimer = null;
        }
      }
    });

    socket.on('update_progress', ({ roomId, progress, wpm, accuracy }) => {
      const room = rooms.get(roomId);
      if (!room) return;

      const player = room.players.find(p => p.id === socket.id);
      if (player) {
        player.progress = progress;
        player.wpm = wpm;
        player.accuracy = accuracy;

        io.to(roomId).emit('progress_update', room.players);

        if (progress >= 100 && !player.isFinished) {
          player.isFinished = true;
          const finishTime = Date.now();
          player.finishTime = finishTime;
          
          const finishedPlayers = room.players.filter(p => p.isFinished).length;
          player.rank = finishedPlayers;

          socket.emit('game_finished', { rank: player.rank });
          
          // Notify everyone in the room
          io.to(roomId).emit('player_finished_notification', {
            username: player.username,
            rank: player.rank
          });

          if (finishedPlayers === room.players.length) {
            finishMatch(roomId);
          }
        }
      }
    });

    socket.on('rejoin_room', ({ roomId, username }) => {
      const room = rooms.get(roomId);
      if (!room) {
        socket.emit('error', { message: 'ROOM_NOT_FOUND' });
        return;
      }

      const player = room.players.find(p => p.username === username);
      if (!player) {
        socket.emit('error', { message: 'NOT_A_PARTICIPANT' });
        return;
      }

      // Update player ID to current socket
      player.id = socket.id;
      socket.username = username;
      socket.join(roomId);

      // Send current state
      socket.emit('match_found', {
        roomId,
        quote: room.quote,
        players: room.players,
        matchDuration: room.matchDuration,
        timeRemaining: room.timeRemaining,
        isRejoin: true
      });

      if (room.status === 'playing') {
        socket.emit('game_start');
      }
    });

    socket.on('use_powerup', ({ roomId, type }) => {
      const room = rooms.get(roomId);
      if (!room || room.status !== 'playing') return;

      // Apply to all opponents
      room.players.forEach(p => {
        if (p.id !== socket.id) {
          if (p.isBot) {
            if (type === 'freeze') {
              p.isFrozen = true;
              p.freezeUntil = Date.now() + 2000;
              setTimeout(() => { p.isFrozen = false; }, 2000);
            }
          }
        }
      });

      // Broadcast powerup event to the room
      io.to(roomId).emit('powerup_triggered', { 
        type, 
        senderId: socket.id,
        senderUsername: socket.username 
      });
    });

    socket.on('update_stats', async ({ username, wpm, accuracy, mode }) => {
      try {
        const User = require('../models/User');
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
          if (user.dailyStats.challengeCount >= 1) return;
          user.dailyStats.challengeCount += 1;
        } else if (mode === 'training') {
          // Training mode should not add any XP or affect WPM/stats
          return;
        }

        user.gamesPlayed += 1;
        if (wpm > user.bestWPM) user.bestWPM = wpm;
        user.averageWPM = ((user.averageWPM * (user.gamesPlayed - 1)) + wpm) / user.gamesPlayed;
        
        let xpMultiplier = 2;
        if (mode === 'challenge') xpMultiplier = 5;
        const xpGained = Math.round(wpm * (accuracy / 100) * xpMultiplier);
        
        user.xp += xpGained;
        user.level = Math.floor(Math.pow(user.xp / 100, 0.6)) + 1;

        await user.save();
      } catch (error) {
        console.error('Error updating stats via socket:', error);
      }
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
      
      // Clear matchmaking timer
      if (matchmakingTimers.has(socket.id)) {
        clearTimeout(matchmakingTimers.get(socket.id));
        matchmakingTimers.delete(socket.id);
      }

      const index = waitingPlayers.findIndex(p => p.id === socket.id);
      if (index !== -1) waitingPlayers.splice(index, 1);

      const poolIndex = matchmakingPool.findIndex(p => p.id === socket.id);
      if (poolIndex !== -1) {
        matchmakingPool.splice(poolIndex, 1);
        if (matchmakingPool.length === 0 && poolTimer) {
          clearTimeout(poolTimer);
          poolTimer = null;
        }
      }
      
      // Handle player leaving room during game - Delay deletion for reloads
      for (const [roomId, room] of rooms.entries()) {
        const player = room.players.find(p => p.id === socket.id);
        if (player) {
          io.to(roomId).emit('player_disconnected', socket.id);
          
          // Only delete if all human players are gone or after a grace period
          setTimeout(() => {
            const currentRoom = rooms.get(roomId);
            if (currentRoom) {
              const activeHumans = currentRoom.players.filter(p => !p.isBot && io.sockets.sockets.has(p.id));
              if (activeHumans.length === 0) {
                rooms.delete(roomId);
              }
            }
          }, 60000); // 60s grace period for reloads
          break;
        }
      }
    });
  });
};
