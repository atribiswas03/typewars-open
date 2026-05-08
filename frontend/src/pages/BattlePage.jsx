import { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { socket } from '../services/socket';
import { Zap, Target, Timer, Trophy, AlertCircle, ChevronRight, Share2, Home, Link, Image as ImageIcon, X, DownloadCloud } from 'lucide-react';
import confetti from 'canvas-confetti';
import html2canvas from 'html2canvas';
import logo from '../assets/logo.png';

const BattlePage = () => {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  const { 
    quote: initialQuote, 
    players: initialPlayers, 
    mode: initialMode, 
    matchDuration: initialMatchDuration 
  } = location.state || {};

  const recoveredMode = initialMode || (roomId?.startsWith('challenge') ? 'challenge' : roomId?.startsWith('training') ? 'training' : 'battle');

  const savedInputInit = sessionStorage.getItem(`tw_room_${roomId}_input`) || '';
  const savedTimeInit = sessionStorage.getItem(`tw_solo_time_${roomId}`);
  const savedStartTimeInit = sessionStorage.getItem(`tw_room_${roomId}_startTime`);
  
  const [quote, setQuote] = useState(initialQuote || '');
  const [players, setPlayers] = useState(initialPlayers || []);
  const [mode, setMode] = useState(recoveredMode);
  const [userInput, setUserInput] = useState(savedInputInit);
  const [startTime, setStartTime] = useState(savedStartTimeInit ? parseInt(savedStartTimeInit) : null);
  const [countdown, setCountdown] = useState(null);
  const [matchTime, setMatchTime] = useState(savedTimeInit && recoveredMode !== 'battle' ? parseInt(savedTimeInit) : (initialMatchDuration || 60));
  const [gameState, setGameState] = useState(savedInputInit ? 'playing' : 'waiting'); 
  const [stats, setStats] = useState({ wpm: 0, accuracy: 100 });
  const [totalKeystrokes, setTotalKeystrokes] = useState(savedInputInit.length);
  const [myRank, setMyRank] = useState(null);
  const [activeEffects, setActiveEffects] = useState([]); 
  const [xpGained, setXpGained] = useState(0);
  const [notification, setNotification] = useState(null); 
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [cooldowns, setCooldowns] = useState({ freeze: 0, glitch: 0 });
  const [isSyncing, setIsSyncing] = useState(!initialQuote && recoveredMode === 'battle');

  const inputRef = useRef(null);
  const scorecardRef = useRef(null);
  const statsRef = useRef(stats);

  // Persistence: Save/Load Solo Quotes
  useEffect(() => {
    if (mode !== 'battle' && roomId) {
      if (initialQuote) {
        sessionStorage.setItem(`tw_solo_quote_${roomId}`, initialQuote);
      } else {
        const saved = sessionStorage.getItem(`tw_solo_quote_${roomId}`);
        if (saved) {
          setQuote(saved);
          setIsSyncing(false);
        }
      }
    }
  }, [mode, roomId, initialQuote]);

  // Initial Progress Calculation on Reload
  useEffect(() => {
    if (quote && userInput && stats.wpm === 0) {
      let correct = 0;
      for (let i = 0; i < userInput.length; i++) {
        if (userInput[i] === quote[i]) correct++;
      }
      const currentAcc = userInput.length > 0 ? Math.round((correct / userInput.length) * 100) : 100;
      
      let currentWpm = 0;
      if (startTime) {
        const elapsedMin = (Date.now() - startTime) / 60000;
        currentWpm = elapsedMin > 0 ? Math.round((userInput.length / 5) / elapsedMin) : 0;
      }

      setStats({ wpm: currentWpm, accuracy: currentAcc });
      
      if (mode === 'battle') {
        const progress = (userInput.length / quote.length) * 100;
        socket.emit('update_progress', { roomId, progress, wpm: currentWpm, accuracy: currentAcc });
      }
    }
  }, [quote, startTime]);

  useEffect(() => {
    if (userInput && roomId) {
      sessionStorage.setItem(`tw_room_${roomId}_input`, userInput);
    }
  }, [userInput, roomId]);

  // Persistence: Save Solo Match Time
  useEffect(() => {
    if (mode !== 'battle' && roomId && gameState === 'playing') {
      sessionStorage.setItem(`tw_solo_time_${roomId}`, matchTime.toString());
    }
  }, [matchTime, mode, roomId, gameState]);

  // Global Focus Handler
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if (e.ctrlKey || e.altKey || e.metaKey) return;
      if (document.activeElement === inputRef.current) return;
      
      const frozen = activeEffects.some(ef => ef.type === 'freeze' && ef.endTime > Date.now());
      if (gameState === 'playing' && !frozen) {
        if (inputRef.current) {
          inputRef.current.focus();
          const len = inputRef.current.value.length;
          inputRef.current.setSelectionRange(len, len);
        }
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [gameState, activeEffects]);

  useEffect(() => {
    statsRef.current = stats;
  }, [stats]);

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleShareLink = async () => {
    const username = localStorage.getItem('tw_username') || 'Operative';
    const shareUrl = `${window.location.origin}/profile/${encodeURIComponent(username)}`;
    const shareData = {
      title: 'TypeWars Status',
      text: `Peak WPM: ${stats.wpm}. Join the battle!`,
      url: shareUrl
    };

    try {
      if (navigator.share) await navigator.share(shareData);
      else {
        await navigator.clipboard.writeText(shareUrl);
        showNotification("PROFILE_LINK_COPIED", "success");
      }
    } catch (err) { console.error(err); }
    setShowShareOptions(false);
  };

  const handleGenerateCard = async () => {
    if (!scorecardRef.current) return;
    showNotification("GENERATING_INTEL...", "info");
    try {
      const canvas = await html2canvas(scorecardRef.current, { backgroundColor: '#050505', scale: 2 });
      const link = document.createElement('a');
      link.href = canvas.toDataURL("image/png");
      link.download = `TypeWars_Scorecard.png`;
      link.click();
      showNotification("TRANSMISSION_READY", "success");
    } catch (err) { console.error(err); }
    setShowShareOptions(false);
  };

  const handleGameFinish = (finalWpm, finalAccuracy, wasCompleted = false) => {
    setGameState(prev => {
      if (prev === 'finished') return prev;

      // In solo modes (challenge/training), we manually set the rank
      if (mode !== 'battle') {
        setMyRank(wasCompleted ? 1 : 2);
      }

      socket.emit('update_stats', { 
        username: localStorage.getItem('tw_username'),
        wpm: finalWpm, accuracy: finalAccuracy, mode: mode
      });
      const calculatedXp = mode === 'training' 
        ? 0 
        : Math.round(finalWpm * (finalAccuracy / 100) * (mode === 'challenge' ? 5 : 2));
      setXpGained(calculatedXp);
      if (roomId) {
        sessionStorage.removeItem(`tw_room_${roomId}_input`);
        sessionStorage.removeItem(`tw_solo_time_${roomId}`);
        sessionStorage.removeItem(`tw_room_${roomId}_startTime`);
      }
      return 'finished';
    });
  };

  // Socket Core Logic
  useEffect(() => {
    if (!roomId) {
      navigate('/lobby');
      return;
    }

    if (!initialQuote && mode === 'battle') {
      setIsSyncing(true);
      socket.emit('rejoin_room', { roomId, username: localStorage.getItem('tw_username') });
    }

    const onCountdown = (count) => {
      setCountdown(count);
      setGameState('starting');
    };

    const onGameStart = () => {
      setGameState('playing');
      setStartTime(prev => {
        if (prev) return prev;
        const now = Date.now();
        sessionStorage.setItem(`tw_room_${roomId}_startTime`, now.toString());
        return now;
      });
      setCountdown(null);
      setTimeout(() => inputRef.current?.focus(), 100);
    };

    const onMatchFound = ({ quote, players, matchDuration, timeRemaining }) => {
      if (quote) setQuote(quote);
      if (players) setPlayers(players);
      setMatchTime(timeRemaining || matchDuration || 60);
      setIsSyncing(false);
    };

    socket.on('countdown', onCountdown);
    socket.on('game_start', onGameStart);
    socket.on('timer_update', (rem) => setMatchTime(rem));
    socket.on('progress_update', (p) => setPlayers(p));
    socket.on('match_found', onMatchFound);
    socket.on('game_finished', ({ rank, isTimeUp }) => {
      setMyRank(rank);
      if (isTimeUp) showNotification("TIME_EXPIRED", "error");
      if (rank === 1) confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
    });
    socket.on('player_finished_notification', ({ username, rank }) => {
      showNotification(`${username} FINISHED: #${rank}`, rank === 1 ? 'success' : 'info');
    });
    socket.on('all_finished', (p) => { setPlayers(p); setGameState('finished'); });
    socket.on('powerup_triggered', ({ type, senderUsername, senderId }) => {
      if (senderId !== socket.id) {
        const duration = type === 'freeze' ? 2000 : 3000;
        setActiveEffects(prev => [...prev, { type, endTime: Date.now() + duration }]);
        showNotification(`${senderUsername || 'OPPONENT'} USED ${type?.toUpperCase()}`, 'error');
        if (type === 'glitch') {
          document.body.classList.add('glitch-shake');
          setTimeout(() => document.body.classList.remove('glitch-shake'), 500);
        }
      }
    });

    return () => {
      socket.off('countdown'); socket.off('game_start'); socket.off('timer_update');
      socket.off('progress_update'); socket.off('match_found'); socket.off('game_finished');
      socket.off('player_finished_notification'); socket.off('all_finished'); socket.off('powerup_triggered');
    };
  }, [roomId, navigate, initialQuote, mode]);

  // Intervals
  useEffect(() => {
    const int = setInterval(() => {
      setActiveEffects(prev => prev.filter(e => e.endTime > Date.now()));
    }, 100);
    return () => clearInterval(int);
  }, []);

  useEffect(() => {
    if (mode !== 'battle' && gameState === 'waiting') setGameState('starting');
  }, [mode, gameState]);

  useEffect(() => {
    if (mode === 'battle' || gameState !== 'starting') return;
    let val = 3;
    setCountdown(val);
    const int = setInterval(() => {
      val--;
      if (val >= 0) setCountdown(val);
      else {
        clearInterval(int);
        setGameState('playing');
        setStartTime(prev => {
          if (prev) return prev;
          const now = Date.now();
          sessionStorage.setItem(`tw_room_${roomId}_startTime`, now.toString());
          return now;
        });
        setCountdown(null);
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    }, 1000);
    return () => clearInterval(int);
  }, [mode, gameState === 'starting', roomId]);

  useEffect(() => {
    if (mode === 'battle' || gameState !== 'playing') return;
    const int = setInterval(() => {
      setMatchTime(prev => {
        if (prev <= 1) {
          clearInterval(int);
          handleGameFinish(statsRef.current.wpm, statsRef.current.accuracy, false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(int);
  }, [mode, gameState === 'playing']);

  useEffect(() => {
    const int = setInterval(() => {
      setCooldowns(p => ({ freeze: Math.max(0, p.freeze - 0.1), glitch: Math.max(0, p.glitch - 0.1) }));
    }, 100);
    return () => clearInterval(int);
  }, []);

  const isFrozen = activeEffects.some(e => e.type === 'freeze' && e.endTime > Date.now());
  const isGlitched = activeEffects.some(e => e.type === 'glitch' && e.endTime > Date.now());

  const handleInputChange = (e) => {
    if (gameState !== 'playing' || isFrozen || !quote) return;
    
    const value = e.target.value;
    
    // Strict Training: Disallow backspace/delete operations
    if (value.length < userInput.length) return;
    
    // Strict Training: Only allow appending to the end!
    // This prevents a critical bug where reloading resets the cursor to index 0,
    // causing the user to overwrite the start of the string, dropping precision to 0%.
    if (!value.startsWith(userInput)) {
      // Force cursor to the very end
      const len = userInput.length;
      e.target.setSelectionRange(len, len);
      return;
    }
    
    // Prevent typing beyond the paragraph length
    if (value.length > quote.length) return;

    setUserInput(value);

    // Calculate accuracy based on all typed characters
    let correct = 0;
    for (let i = 0; i < value.length; i++) {
      if (value[i] === quote[i]) correct++;
    }

    const progress = (value.length / quote.length) * 100;
    const elapsedMin = (Date.now() - (startTime || Date.now())) / 60000;
    
    const currentWpm = elapsedMin > 0 ? Math.round((value.length / 5) / elapsedMin) : 0;
    const currentAcc = value.length > 0 ? Math.round((correct / value.length) * 100) : 100;

    setStats({ wpm: currentWpm, accuracy: currentAcc });
    
    if (mode === 'battle' && roomId) {
      socket.emit('update_progress', { roomId, progress, wpm: currentWpm, accuracy: currentAcc });
    }
    
    // Auto-finish exactly when reaching the end of the paragraph
    if (value.length === quote.length) {
      handleGameFinish(currentWpm, currentAcc, true);
    }
  };

  const usePowerup = (type) => {
    if (cooldowns[type] > 0 || gameState !== 'playing' || isFrozen) return;
    socket.emit('use_powerup', { roomId, type });
    setCooldowns(p => ({ ...p, [type]: 10 }));
  };

  const renderQuote = () => {
    if (!quote) return <div className="text-cyber-neon/40 animate-pulse font-mono">INITIALIZING_DATA_STREAM...</div>;
    const chars = quote.split('');
    const GLITCH = "!@#$%^&*()_+{}|:<>?~`-=[]\\;',./";
    return chars.map((char, index) => {
      let displayChar = char;
      let colorClass = "text-white/20";
      let cursor = (index === userInput.length && gameState === 'playing') ? "bg-cyber-neon/30 border-l-2 border-cyber-neon animate-pulse" : "";
      if (isGlitched && index >= userInput.length && Math.random() > 0.8) {
        displayChar = GLITCH[Math.floor(Math.random() * GLITCH.length)];
        colorClass = "text-cyber-purple animate-pulse";
      }
      if (index < userInput.length) {
        colorClass = userInput[index] === char ? "text-cyber-neon drop-shadow-[0_0_8px_rgba(0,243,255,0.5)]" : "text-cyber-pink bg-cyber-pink/20";
      }
      return <span key={index} className={`${colorClass} ${cursor} transition-all duration-75 font-mono`}>{displayChar}</span>;
    });
  };

  return (
    <div className="flex-grow p-4 flex flex-col items-center justify-center">
      <AnimatePresence>
        {isSyncing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-cyber-black z-[100] flex flex-col items-center justify-center">
            <div className="text-cyber-neon text-xl font-mono animate-pulse tracking-[0.5em] mb-4 uppercase">Neural_Sync_Active</div>
            <div className="w-64 h-1 bg-white/5 rounded-full overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: "100%" }} transition={{ duration: 1.5, repeat: Infinity }} className="h-full bg-cyber-neon" /></div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-4 gap-6 relative">
        <div className="lg:col-span-1 space-y-4">
          <div className="glass-card p-6 rounded-2xl border-l-4 border-cyber-neon">
            <div className="flex items-center gap-3 mb-6"><Timer className="w-5 h-5 text-cyber-neon" /><span className="text-[10px] font-mono tracking-widest text-cyber-neon/60 uppercase">NEURAL_SPEED</span></div>
            <div className="text-3xl md:text-5xl font-black font-mono text-white mb-1">{stats.wpm}<span className="text-sm font-normal text-cyber-neon/40 ml-2">WPM</span></div>
            <div className="w-full h-1 bg-cyber-black rounded-full overflow-hidden mt-4"><motion.div animate={{ width: `${Math.min(stats.wpm, 150) / 1.5}%` }} className="h-full bg-cyber-neon" /></div>
          </div>
          <div className="glass-card p-6 rounded-2xl border-l-4 border-cyber-purple">
            <div className="flex items-center gap-3 mb-6"><Target className="w-5 h-5 text-cyber-purple" /><span className="text-[10px] font-mono tracking-widest text-cyber-purple/60 uppercase">PRECISION</span></div>
            <div className="text-3xl md:text-5xl font-black font-mono text-white mb-1">{stats.accuracy}<span className="text-sm font-normal text-cyber-purple/40 ml-2">%</span></div>
          </div>
          <div className="glass-card p-6 rounded-2xl border-l-4 border-cyber-pink">
            <div className="flex items-center gap-3 mb-6"><Timer className="w-5 h-5 text-cyber-pink" /><span className="text-[10px] font-mono tracking-widest text-cyber-pink/60 uppercase">TIME_LEFT</span></div>
            <div className={`text-3xl md:text-5xl font-black font-mono mb-1 ${matchTime <= 10 ? 'text-cyber-pink animate-pulse' : 'text-white'}`}>{matchTime}<span className="text-sm font-normal text-cyber-pink/40 ml-2">s</span></div>
          </div>
          {mode === 'battle' && (
            <div className="glass-card p-6 rounded-2xl space-y-4">
              <p className="text-[8px] font-mono text-cyber-neon/40 uppercase tracking-widest">TACTICAL_APPS</p>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => usePowerup('freeze')} disabled={cooldowns.freeze > 0 || gameState !== 'playing' || isFrozen} className="relative p-3 bg-cyber-neon/5 border border-cyber-neon/20 rounded-xl hover:bg-cyber-neon/10 transition-all flex flex-col items-center gap-2 overflow-hidden disabled:opacity-30">
                  {cooldowns.freeze > 0 && <div style={{ height: `${(cooldowns.freeze / 10) * 100}%` }} className="absolute bottom-0 left-0 w-full bg-cyber-neon/20" />}
                  <Zap className="w-4 h-4 text-cyber-neon relative z-10" /><span className="text-[8px] font-mono text-cyber-neon relative z-10">{cooldowns.freeze > 0 ? `${cooldowns.freeze.toFixed(1)}s` : 'FREEZE'}</span>
                </button>
                <button onClick={() => usePowerup('glitch')} disabled={cooldowns.glitch > 0 || gameState !== 'playing' || isFrozen} className="relative p-3 bg-cyber-purple/5 border border-cyber-purple/20 rounded-xl hover:bg-cyber-purple/10 transition-all flex flex-col items-center gap-2 overflow-hidden disabled:opacity-30">
                  {cooldowns.glitch > 0 && <div style={{ height: `${(cooldowns.glitch / 10) * 100}%` }} className="absolute bottom-0 left-0 w-full bg-cyber-purple/20" />}
                  <AlertCircle className="w-4 h-4 text-cyber-purple relative z-10" /><span className="text-[8px] font-mono text-cyber-purple relative z-10">{cooldowns.glitch > 0 ? `${cooldowns.glitch.toFixed(1)}s` : 'GLITCH'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-3 space-y-6">
          <div className={`glass-card p-6 md:p-10 rounded-3xl min-h-[300px] md:min-h-[400px] flex flex-col justify-between border border-white/5 relative overflow-hidden ${isFrozen ? 'grayscale blur-[1px]' : ''}`}>
            {isFrozen && <div className="absolute inset-0 z-20 flex items-center justify-center bg-cyber-neon/5 backdrop-blur-[2px]"><div className="text-4xl font-black text-cyber-neon animate-pulse font-mono tracking-tighter">SYSTEM_FROZEN</div></div>}
            <div className="relative z-10">
              <div className="text-xl md:text-3xl font-mono leading-relaxed mb-8 md:mb-12 select-none">
                {renderQuote()}
              </div>
              <textarea 
                ref={inputRef} 
                value={userInput} 
                onChange={handleInputChange} 
                onKeyDown={(e) => {
                  if (e.key === 'Backspace' || e.key === 'Delete') {
                    e.preventDefault();
                  }
                }}
                disabled={gameState !== 'playing' || isFrozen} 
                className="absolute inset-0 w-full h-full opacity-0 cursor-default" 
                autoFocus 
              />
            </div>
            <AnimatePresence>{countdown !== null && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 flex items-center justify-center bg-cyber-black/80 backdrop-blur-xl z-30"><motion.div key={countdown} initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 2, opacity: 0 }} className="text-[12rem] font-black italic neon-text">{countdown === 0 ? "GO!" : countdown}</motion.div></motion.div>}</AnimatePresence>
          </div>
          <div className="glass-card p-6 rounded-2xl space-y-6">
            <p className="text-[8px] font-mono text-cyber-neon/40 uppercase tracking-widest">UNIT_PROGRESS_SYNC</p>
            <div className="space-y-6">{players.map((p) => (
              <div key={p.id} className="space-y-2">
                <div className="flex justify-between items-end"><div className="flex items-center gap-3"><div className={`w-8 h-8 rounded bg-cyber-neon/10 border border-cyber-neon/30 flex items-center justify-center text-[10px] font-bold ${p.id === socket.id ? 'text-cyber-neon' : 'text-white/40'}`}>{p.username?.[0] || '?'}</div><div className="flex flex-col"><span className={`text-xs font-bold font-mono ${p.id === socket.id ? 'text-cyber-neon' : 'text-white/60'}`}>{p.username} {p.id === socket.id && "(YOU)"}</span><span className="text-[8px] font-mono text-white/20 uppercase">{p.wpm} WPM // {p.accuracy}% ACC</span></div></div><span className="text-[10px] font-mono text-cyber-neon">{Math.round(p.progress)}%</span></div>
                <div className="h-1.5 bg-cyber-black rounded-full overflow-hidden border border-white/5"><motion.div initial={{ width: 0 }} animate={{ width: `${p.progress}%` }} className={`h-full rounded-full ${p.id === socket.id ? 'bg-cyber-neon shadow-[0_0_10px_#00f3ff]' : 'bg-white/10'}`} /></div>
              </div>
            ))}</div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {gameState === 'finished' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 bg-cyber-black/95 backdrop-blur-xl z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, y: 40 }} animate={{ scale: 1, y: 0 }} className="glass-card p-12 rounded-[2rem] max-w-2xl w-full text-center border-t-4 border-cyber-neon relative overflow-hidden">
              <div className="mb-8"><Trophy className={`w-16 h-16 mx-auto mb-4 ${myRank === 1 ? 'text-cyber-neon animate-bounce' : 'text-white/20'}`} /><h2 className="text-6xl font-black mb-2 neon-text italic italic tracking-tighter uppercase">{myRank === 1 ? "Winner" : "Defeated"}</h2><p className="font-mono text-cyber-neon/40 text-[10px] tracking-[0.3em] uppercase">{myRank === 1 ? "Supremacy_Established" : "Battle_Log_Terminated"} // Rank: #{myRank}</p></div>
              <div className="grid grid-cols-3 gap-4 mb-12">
                <div className="bg-cyber-black/40 p-6 rounded-2xl border border-white/5"><div className="text-2xl font-black text-white font-mono">{stats.wpm}</div><div className="text-[8px] font-mono text-cyber-neon/40 uppercase">Final_WPM</div></div>
                <div className="bg-cyber-black/40 p-6 rounded-2xl border border-white/5"><div className="text-2xl font-black text-white font-mono">{stats.accuracy}%</div><div className="text-[8px] font-mono text-cyber-neon/40 uppercase">Accuracy</div></div>
                <div className="bg-cyber-neon/10 p-6 rounded-2xl border border-cyber-neon/20"><div className="text-2xl font-black text-cyber-neon font-mono">+{xpGained}</div><div className="text-[8px] font-mono text-cyber-neon uppercase">XP_Gained</div></div>
              </div>
              <div className="flex gap-4"><button onClick={() => navigate('/lobby')} className="flex-1 neon-button py-4 rounded-xl font-bold flex items-center justify-center gap-2 group"><Home className="w-4 h-4" />Return_Base</button><button onClick={() => setShowShareOptions(true)} className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all"><Share2 className="w-4 h-4" />Share_Intel</button></div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {notification && (
          <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100]">
            <div className={`px-8 py-3 rounded-xl border backdrop-blur-xl flex items-center gap-4 ${notification.type === 'success' ? 'border-cyber-neon bg-cyber-neon/10 text-cyber-neon' : 'border-cyber-pink bg-cyber-pink/10 text-cyber-pink'}`}>
              <div className="w-1.5 h-1.5 rounded-full bg-current animate-ping" /><span className="font-mono font-bold tracking-widest text-[10px] uppercase">{notification.message}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Hidden scorecard for card generation */}
      <div className="fixed -left-[2000px] top-0">
        <div ref={scorecardRef} className="w-[600px] p-12 bg-[#050505] border-t-8 border-cyber-neon relative overflow-hidden">
          <div className="flex items-center gap-6 mb-8">
            <img src={logo} alt="TypeWars" className="w-16 h-16 drop-shadow-[0_0_10px_#00f3ff]" />
            <h1 className="text-5xl font-black text-white italic tracking-tighter">TYPE<span className="text-cyber-neon">WARS</span></h1>
          </div>
          <div className="text-6xl font-black text-white uppercase tracking-tighter mb-8">{localStorage.getItem('tw_username')}</div>
          <div className="grid grid-cols-2 gap-8">
            <div className="p-8 bg-white/5 border border-white/10 rounded-3xl">
              <div className="text-4xl font-black text-white">{stats.wpm} WPM</div>
            </div>
            <div className="p-8 bg-white/5 border border-white/10 rounded-3xl">
              <div className="text-4xl font-black text-white">{stats.accuracy}% ACC</div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default BattlePage;
