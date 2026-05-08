import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { socket } from '../services/socket';
import { Loader2, Users, Trophy, Settings, LogOut, Zap, Target, TrendingUp } from 'lucide-react';
import logo from '../assets/logo.png';
import API_BASE_URL from '../services/api';

const LobbyPage = () => {
  const [isSearching, setIsSearching] = useState(false);
  const [playersOnline, setPlayersOnline] = useState(0);
  const [userStats, setUserStats] = useState({
    globalRank: 0,
    bestWPM: 0,
    wins: 0,
    losses: 0,
    level: 1,
    xp: 0
  });
  const username = localStorage.getItem('tw_username') || 'GUEST';
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('tw_token');
    if (!token && !localStorage.getItem('tw_username')) {
      navigate('/');
      return;
    }

    const fetchUserStats = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/users/stats/${encodeURIComponent(username)}`);
        if (response.ok) {
          const data = await response.json();
          setUserStats(data);
        }
      } catch (error) {
        console.error('Error fetching user stats:', error);
      }
    };

    fetchUserStats();
    socket.connect();

    socket.on('match_found', ({ roomId, quote, players, matchDuration }) => {
      navigate(`/battle/${roomId}`, { state: { quote, players, matchDuration, mode: 'battle' } });
    });

    return () => {
      socket.off('match_found');
      socket.emit('leave_matchmaking'); // Failsafe: leave queue if user navigates away
    };
  }, [navigate, username]);

  const startMatchmaking = () => {
    setIsSearching(true);
    socket.emit('join_matchmaking', { username });
  };

  const abortMatchmaking = () => {
    setIsSearching(false);
    socket.emit('leave_matchmaking');
  };

  const startDailyChallenge = async () => {
    try {
      console.log('Starting Daily Challenge for level:', userStats.level);
      const response = await fetch(`${API_BASE_URL}/api/game/paragraph?level=${userStats.level || 1}`);
      if (!response.ok) throw new Error('API_UNAVAILABLE');
      const { quote, matchDuration } = await response.json();
      
      navigate(`/battle/challenge-${Date.now()}`, { 
        state: { 
          quote, 
          players: [{ id: 'user', username, progress: 0, wpm: 0, accuracy: 100, isFinished: false }],
          mode: 'challenge',
          matchDuration
        } 
      });
    } catch (err) {
      console.error('Error starting challenge:', err);
      // Fallback in case API is down
      navigate(`/battle/challenge-fallback`, {
        state: {
          quote: "The neon lights flickered as the console hummed with rhythmic data streams.",
          players: [{ id: 'user', username, progress: 0, wpm: 0, accuracy: 100, isFinished: false }],
          mode: 'challenge',
          matchDuration: 45
        }
      });
    }
  };

  const startTraining = async () => {
    try {
      console.log('Starting Training mode');
      const response = await fetch(`${API_BASE_URL}/api/game/paragraph?level=1`);
      if (!response.ok) throw new Error('API_UNAVAILABLE');
      const { quote, matchDuration } = await response.json();
      
      navigate(`/battle/training-${Date.now()}`, { 
        state: { 
          quote, 
          players: [{ id: 'user', username, progress: 0, wpm: 0, accuracy: 100, isFinished: false }],
          mode: 'training',
          matchDuration
        } 
      });
    } catch (err) {
      console.error('Error starting training:', err);
      navigate(`/battle/training-fallback`, {
        state: {
          quote: "Deep within the mainframe, shadows danced between the logic gates.",
          players: [{ id: 'user', username, progress: 0, wpm: 0, accuracy: 100, isFinished: false }],
          mode: 'training',
          matchDuration: 45
        }
      });
    }
  };

  const handleLogout = async () => {
    const currentUsername = localStorage.getItem('tw_username');
    if (currentUsername) {
      try {
        await fetch(`${API_BASE_URL}/api/users/guest/${encodeURIComponent(currentUsername)}`, { 
          method: 'DELETE' 
        });
      } catch (err) {
        console.error('Failed to terminate guest session:', err);
      }
    }
    localStorage.removeItem('tw_token');
    localStorage.removeItem('tw_username');
    localStorage.removeItem('tw_user_id');
    navigate('/');
  };

  const getLevelTitle = (level) => {
    if (level < 5) return 'NEURAL_RECRUIT';
    if (level < 10) return 'DATA_OPERATIVE';
    if (level < 20) return 'CYBER_STALKER';
    if (level < 35) return 'NET_RUNNER';
    if (level < 50) return 'SYSTEM_ARCHITECT';
    return 'GHOST_IN_THE_SHELL';
  };

  const getLevelProgress = (xp, level) => {
    const currentLevelXP = level === 1 ? 0 : Math.pow(level - 1, 1/0.6) * 100;
    const nextLevelXP = Math.pow(level, 1/0.6) * 100;
    const progress = ((xp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;
    return Math.min(Math.max(progress, 0), 100);
  };

  return (
    <div className="flex-grow flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-cyber-purple/5 blur-[120px]"></div>
        <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-cyber-neon/5 blur-[120px]"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 flex flex-col items-center"
      >
        <img src={logo} alt="TypeWars" className="w-12 h-12 md:w-20 md:h-20 drop-shadow-[0_0_10px_rgba(0,243,255,0.3)] mb-2" />
        <h2 className="text-xl md:text-2xl font-black italic tracking-tighter neon-text">TYPE<span className="text-cyber-purple">WARS</span></h2>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-12 gap-6 relative z-10"
      >
        {/* Profile Section */}
        <div className="md:col-span-4 space-y-6">
          <div className="glass-card p-6 rounded-2xl border-l-4 border-cyber-neon flex flex-col items-center text-center">
            <div className="relative mb-4 group">
              <div className="w-24 h-24 rounded-full border-2 border-cyber-neon flex items-center justify-center bg-cyber-neon/10 group-hover:scale-105 transition-transform duration-500">
                <Users className="w-12 h-12 text-cyber-neon" />
              </div>
              <div className="absolute -bottom-1 -right-1 bg-cyber-black border border-cyber-neon px-2 py-1 rounded text-[10px] font-bold text-cyber-neon shadow-[0_0_10px_#00f3ff]">
                LVL_{userStats.level.toString().padStart(2, '0')}
              </div>
            </div>
            
            <h2 className="text-2xl font-bold font-mono tracking-tight text-white mb-1 uppercase">{username}</h2>
            <p className="text-cyber-neon/60 text-[10px] font-mono tracking-widest mb-6">
              {getLevelTitle(userStats.level)}
            </p>

            <div className="w-full space-y-2">
              <div className="flex justify-between text-[8px] font-mono text-cyber-neon/40 uppercase">
                <span>XP_PROGRESS</span>
                <span>{Math.round(getLevelProgress(userStats.xp, userStats.level))}%</span>
              </div>
              <div className="w-full h-1.5 bg-cyber-black/50 rounded-full overflow-hidden border border-cyber-neon/10">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${getLevelProgress(userStats.xp, userStats.level)}%` }}
                  className="h-full bg-cyber-neon shadow-[0_0_15px_#00f3ff]"
                ></motion.div>
              </div>
            </div>

            <button 
              onClick={handleLogout}
              className="mt-8 flex items-center gap-2 text-[10px] font-mono text-cyber-pink hover:text-white transition-colors group"
            >
              <LogOut className="w-3 h-3 group-hover:-translate-x-1 transition-transform" />
              TERMINATE_SESSION
            </button>
          </div>

          <div className="glass-card p-6 rounded-2xl border-l-4 border-cyber-purple space-y-4">
            <h3 className="text-xs font-mono text-cyber-purple uppercase tracking-widest mb-2 flex items-center gap-2">
              <TrendingUp className="w-3 h-3" /> NEURAL_STATS
            </h3>
            <div className="flex items-center justify-between border-b border-cyber-neon/5 pb-3">
              <span className="text-[10px] font-mono text-cyber-neon/40">GLOBAL_RANK</span>
              <span className="font-bold text-cyber-purple font-mono">#{userStats.globalRank.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between border-b border-cyber-neon/5 pb-3">
              <span className="text-[10px] font-mono text-cyber-neon/40">BEST_WPM</span>
              <span className="font-bold text-cyber-green font-mono">{userStats.bestWPM}</span>
            </div>
            <div className="flex items-center justify-between border-b border-cyber-neon/5 pb-3">
              <span className="text-[10px] font-mono text-cyber-neon/40">BATTLES_WON</span>
              <span className="font-bold text-white font-mono">{userStats.wins} / {userStats.wins + userStats.losses}</span>
            </div>
            <button 
              onClick={() => navigate('/leaderboard')}
              className="w-full flex items-center justify-center gap-2 text-[10px] font-mono text-cyber-neon hover:bg-cyber-neon/10 py-2 rounded-lg transition-all"
            >
              <Trophy className="w-3 h-3" />
              ACCESS_LEADERBOARD
            </button>
          </div>
        </div>

        {/* Action Section */}
        <div className="md:col-span-8 flex flex-col gap-6">
          <div className="glass-card p-12 rounded-2xl border-b-2 border-cyber-neon flex flex-col items-center justify-center text-center gap-8 min-h-[400px] relative overflow-hidden group">
            <div className="absolute inset-0 bg-cyber-neon/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
            
            <AnimatePresence mode="wait">
              {!isSearching ? (
                <motion.div 
                  key="ready"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.1 }}
                  className="space-y-8"
                >
                  <div className="space-y-2">
                    <h1 className="text-3xl md:text-5xl font-bold font-mono tracking-tighter neon-text">SYSTEM_READY</h1>
                    <p className="text-cyber-neon/50 font-mono text-xs max-w-md mx-auto leading-relaxed">
                      NEURAL_LINK_ESTABLISHED. MATCHMAKING_ALGORITHM_CALIBRATED. 
                      READY_TO_ENGAGE_IN_COGNITIVE_COMBAT?
                    </p>
                  </div>
                  
                  <button 
                    onClick={startMatchmaking}
                    className="relative px-8 md:px-16 py-4 md:py-6 rounded-xl font-black text-xl md:text-2xl tracking-widest overflow-hidden group/btn transition-all active:scale-95"
                  >
                    <div className="absolute inset-0 bg-cyber-neon group-hover/btn:bg-white transition-colors"></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700"></div>
                    <span className="relative text-cyber-black text-sm md:text-base">ENTER_BATTLE</span>
                  </button>
                </motion.div>
              ) : (
                <motion.div 
                  key="searching"
                  initial={{ opacity: 0, scale: 1.1 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="flex flex-col items-center gap-8"
                >
                  <div className="relative">
                    <Loader2 className="w-24 h-24 text-cyber-neon animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-12 h-12 bg-cyber-neon/20 rounded-full animate-ping"></div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <h2 className="text-3xl font-bold font-mono animate-pulse tracking-tighter">SEARCHING_TARGETS...</h2>
                    <div className="flex gap-1 justify-center">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="w-1 h-1 bg-cyber-neon rounded-full animate-bounce" style={{ animationDelay: `${i * 0.2}s` }}></div>
                      ))}
                    </div>
                  </div>

                  <p className="text-[10px] font-mono text-cyber-neon/30 animate-pulse">
                    LINKING_TO_GLOBAL_GRID... BYTES_ENCRYPTED: {Math.floor(Math.random() * 999)}KB
                  </p>
                  
                  <button 
                    onClick={abortMatchmaking}
                    className="text-cyber-pink hover:text-white font-mono text-[10px] tracking-widest border border-cyber-pink/30 px-4 py-2 rounded-lg hover:bg-cyber-pink/10 transition-all"
                  >
                    ABORT_LINKING
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <button 
              onClick={() => {
                if (userStats.hasCompletedDaily) {
                  alert('DAILY_CHALLENGE_ALREADY_COMPLETED_TODAY. TRY_AGAIN_TOMORROW.');
                  return;
                }
                startDailyChallenge();
              }}
              className={`glass-card p-6 rounded-2xl border-t-2 group transition-colors text-left ${
                userStats.hasCompletedDaily 
                ? 'border-cyber-pink/30 opacity-50 cursor-not-allowed' 
                : 'border-cyber-green/30 hover:border-cyber-green'
              }`}
            >
              <Zap className={`w-6 h-6 mb-4 transition-transform ${
                userStats.hasCompletedDaily ? 'text-cyber-pink' : 'text-cyber-green group-hover:scale-110'
              }`} />
              <h4 className="text-sm font-bold font-mono mb-1 text-white uppercase">
                {userStats.hasCompletedDaily ? 'CHALLENGE_COMPLETED' : 'DAILY_CHALLENGE'}
              </h4>
              <p className="text-[10px] font-mono text-cyber-neon/40 uppercase">
                {userStats.hasCompletedDaily ? 'RETURN_TOMORROW_FOR_NEXT_SYNC' : '5X_XP_MULTIPLIER_ACTIVE'}
              </p>
            </button>
            <button 
              onClick={startTraining}
              className="glass-card p-6 rounded-2xl border-t-2 border-cyber-purple/30 group hover:border-cyber-purple transition-colors text-left"
            >
              <Target className="w-6 h-6 text-cyber-purple mb-4 group-hover:scale-110 transition-transform" />
              <h4 className="text-sm font-bold font-mono mb-1 text-white uppercase">TRAINING_MODE</h4>
              <p className="text-[10px] font-mono text-cyber-neon/40 uppercase">PRACTICE_NEURAL_SPEED</p>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default LobbyPage;
