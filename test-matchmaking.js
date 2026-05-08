const { io } = require('socket.io-client');

const socket = io('http://127.0.0.1:5001', {
  transports: ['websocket']
});

console.log('Connecting to TypeWars backend...');

socket.on('connect', () => {
  console.log('Connected! Joining matchmaking as "TestPlayer"...');
  socket.emit('join_matchmaking', { username: 'TestPlayer' });
});

socket.on('match_found', ({ roomId, players }) => {
  console.log(`Match Found! Room: ${roomId}`);
  console.log('Players:', players.map(p => `${p.username} (${p.id})`).join(', '));
});

socket.on('countdown', (count) => {
  console.log(`Countdown: ${count}`);
});

socket.on('game_start', () => {
  console.log('Game Started!');
});

socket.on('progress_update', (players) => {
  const bot = players.find(p => p.username !== 'TestPlayer');
  if (bot) {
    console.log(`Bot Progress: ${Math.round(bot.progress)}% | WPM: ${bot.wpm}`);
  }
});

socket.on('all_finished', () => {
  console.log('Game Finished!');
  process.exit(0);
});

setTimeout(() => {
  console.log('Test timeout after 30 seconds.');
  process.exit(1);
}, 30000);
