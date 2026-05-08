import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, Zap, Target, Users, ArrowLeft, Share2, Shield } from 'lucide-react';
import logo from '../assets/logo.png';
import API_BASE_URL from '../services/api';

const ProfilePage = () => {
  const { username } = useParams();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/users/stats/${encodeURIComponent(username)}`);
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (err) {
        console.error('Error fetching public stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [username]);

  const getLevelTitle = (level) => {
    if (level < 5) return 'NEURAL_RECRUIT';
    if (level < 10) return 'DATA_OPERATIVE';
    if (level < 20) return 'CYBER_STALKER';
    if (level < 35) return 'NET_RUNNER';
    if (level < 50) return 'SYSTEM_ARCHITECT';
    return 'GHOST_IN_THE_SHELL';
  };

  const calculateXpProgress = (xp) => {
    if (!xp) return { progress: 0, nextLevelXp: 100 };
    const level = Math.floor(Math.pow(xp / 100, 0.6)) + 1;
    const currentLevelXp = level === 1 ? 0 : Math.round(100 * Math.pow(level - 1, 1 / 0.6));
    const nextLevelXp = Math.round(100 * Math.pow(level, 1 / 0.6));
    const progress = ((xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100;
    return {
      progress: Math.min(Math.max(progress, 0), 100),
      nextLevelXp
    };
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center font-mono text-cyber-neon">
      <div className="animate-pulse">SYNCHRONIZING_NEURAL_STATS...</div>
    </div>
  );

  if (!stats) return (
    <div className="min-h-screen flex flex-col items-center justify-center font-mono text-cyber-pink gap-4">
      <div className="text-2xl">[ERROR]: OPERATIVE_NOT_FOUND</div>
      <button onClick={() => navigate('/')} className="text-xs border border-cyber-pink/30 px-4 py-2 rounded hover:bg-cyber-pink/10">
        RETURN_TO_BASE
      </button>
    </div>
  );

  const { progress, nextLevelXp } = calculateXpProgress(stats.xp);

  return (
    <div className="flex-grow p-4 md:p-8 flex items-center justify-center relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyber-neon/5 rounded-full blur-[120px]"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card max-w-2xl w-full p-8 md:p-12 rounded-[2.5rem] border-t-4 border-cyber-neon relative z-10 text-center"
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-2xl bg-cyber-black border-2 border-cyber-neon flex items-center justify-center shadow-[0_0_20px_#00f3ff] overflow-hidden">
          <img src={logo} alt="TypeWars" className="w-full h-full object-cover" />
        </div>

        <div className="mt-8 mb-12">
          <h1 className="text-2xl md:text-5xl font-black neon-text italic mb-2 uppercase tracking-tighter">{stats.username}</h1>
          <div className="flex items-center justify-center gap-3">
            <span className="text-cyber-neon/40 font-mono text-xs tracking-[0.4em] uppercase">{getLevelTitle(stats.level)}</span>
            <span className="px-3 py-1 bg-cyber-neon/10 border border-cyber-neon/20 rounded text-cyber-neon font-mono text-xs font-bold">LVL_{stats.level}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-cyber-black/40 p-6 rounded-2xl border border-white/5 flex flex-col items-center gap-2">
            <Trophy className="w-5 h-5 text-cyber-purple" />
            <div className="text-2xl font-black text-white font-mono">#{stats.globalRank}</div>
            <div className="text-[8px] font-mono text-cyber-neon/30 uppercase tracking-widest">GLOBAL_RANK</div>
          </div>
          <div className="bg-cyber-black/40 p-6 rounded-2xl border border-white/5 flex flex-col items-center gap-2">
            <Zap className="w-5 h-5 text-cyber-green" />
            <div className="text-2xl font-black text-white font-mono">{stats.bestWPM}</div>
            <div className="text-[8px] font-mono text-cyber-neon/30 uppercase tracking-widest">BEST_WPM</div>
          </div>
          <div className="bg-cyber-black/40 p-6 rounded-2xl border border-white/5 flex flex-col items-center gap-2 col-span-2 md:col-span-1">
            <Users className="w-5 h-5 text-cyber-neon" />
            <div className="text-2xl font-black text-white font-mono">{stats.wins}</div>
            <div className="text-[8px] font-mono text-cyber-neon/30 uppercase tracking-widest">BATTLES_WON</div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-cyber-neon/5 border border-cyber-neon/10 text-left">
            <div className="flex justify-between text-[10px] font-mono text-cyber-neon/40 mb-2 uppercase">
              <span>NEURAL_PROGRESS</span>
              <span>{stats.xp.toLocaleString()} / {nextLevelXp.toLocaleString()} XP</span>
            </div>
            <div className="h-2 bg-cyber-black rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                className="h-full bg-cyber-neon shadow-[0_0_10px_#00f3ff]"
              ></motion.div>
            </div>
            <div className="flex justify-between mt-2 text-[8px] font-mono text-cyber-neon/20 uppercase tracking-widest">
              <span>LVL {stats.level}</span>
              <span>LVL {stats.level + 1}</span>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <button 
              onClick={() => navigate('/')}
              className="flex-1 neon-button py-4 rounded-xl font-bold flex items-center justify-center gap-2 group"
            >
              <Zap className="w-4 h-4" />
              CHALLENGE_THIS_OPERATIVE
            </button>
            <button 
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                alert("PROFILE_LINK_COPIED_TO_CLIPBOARD");
              }}
              className="px-6 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all flex items-center justify-center"
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="mt-12 text-[8px] font-mono text-cyber-neon/20 uppercase tracking-[0.5em]">
          ENCRYPTED_PROFILE_TRANSMISSION
        </div>
      </motion.div>
    </div>
  );
};

export default ProfilePage;
