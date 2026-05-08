import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Trophy, ArrowLeft, Zap, Target, Loader2, Shield } from 'lucide-react';
import logo from '../assets/logo.png';
import API_BASE_URL from '../services/api';

const LeaderboardPage = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/users/leaderboard`);
        if (response.ok) {
          const data = await response.json();
          setLeaderboard(data);
        }
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  return (
    <div className="flex-grow p-4 md:p-8 max-w-5xl mx-auto relative overflow-hidden flex flex-col">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyber-neon/5 rounded-full blur-[150px]"></div>
      </div>

      <button 
        onClick={() => navigate('/lobby')}
        className="flex items-center gap-2 text-cyber-neon/40 hover:text-cyber-neon transition mb-12 font-mono group relative z-10"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> 
        <span className="tracking-widest text-[10px]">RETURN_TO_LOBBY</span>
      </button>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-[2rem] overflow-hidden border-b-8 border-cyber-neon relative z-10"
      >
        <div className="p-10 bg-gradient-to-br from-cyber-neon/10 to-transparent border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <img src={logo} alt="TypeWars" className="w-16 h-16 drop-shadow-[0_0_10px_rgba(0,243,255,0.3)]" />
            <div className="space-y-2">
              <h1 className="text-3xl md:text-5xl font-black neon-text italic tracking-tighter">GLOBAL_RANKINGS</h1>
              <p className="text-cyber-neon/40 font-mono text-[10px] tracking-[0.4em] uppercase">TOP_OPERATIVES_IN_THE_GRID</p>
            </div>
          </div>
          <div className="relative">
            <Trophy className="w-20 h-20 text-cyber-neon opacity-20 absolute -top-4 -left-4 animate-pulse" />
            <Trophy className="w-16 h-16 text-cyber-neon relative z-10" />
          </div>
        </div>

        <div className="p-6 overflow-x-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="w-12 h-12 text-cyber-neon animate-spin" />
              <p className="font-mono text-[10px] text-cyber-neon/40 animate-pulse uppercase">RETRIEVING_DATA_FROM_MAIN_FRAME...</p>
            </div>
          ) : (
            <table className="w-full text-left font-mono">
              <thead>
                <tr className="text-cyber-neon/30 text-[10px] uppercase tracking-widest border-b border-white/5">
                  <th className="p-6">RANK</th>
                  <th className="p-6">OPERATIVE</th>
                  <th className="p-6">SPEED_WPM</th>
                  <th className="p-6">NEURAL_LEVEL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {leaderboard.map((user, idx) => (
                  <motion.tr 
                    key={user._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="group hover:bg-white/[0.02] transition-colors relative"
                  >
                    <td className="p-6">
                      <div className="flex items-center gap-4">
                        <span className={`text-2xl font-black italic ${idx < 3 ? 'text-cyber-neon neon-text' : 'text-white/20'}`}>
                          {idx + 1 < 10 ? `0${idx + 1}` : idx + 1}
                        </span>
                        {idx === 0 && <Shield className="w-4 h-4 text-cyber-neon animate-pulse" />}
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="flex flex-col">
                        <span className="font-black text-white text-lg group-hover:text-cyber-neon transition-colors tracking-tight uppercase">
                          {user.username}
                        </span>
                        <span className="text-[8px] text-white/20 uppercase tracking-widest">ACTIVE_OPERATIVE</span>
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-cyber-neon/5 border border-cyber-neon/10 flex items-center justify-center">
                          <Zap className="w-4 h-4 text-cyber-neon" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-black text-xl text-white">{user.bestWPM}</span>
                          <span className="text-[8px] text-cyber-neon/40 uppercase">PEAK_SPEED</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="flex items-center gap-2">
                        <div className="px-3 py-1 bg-cyber-purple/10 border border-cyber-purple/30 rounded text-[10px] font-bold text-cyber-purple shadow-[0_0_10px_rgba(188,0,255,0.2)]">
                          LVL_{user.level.toString().padStart(2, '0')}
                        </div>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </motion.div>

      <div className="mt-12 flex justify-between items-center opacity-20 font-mono text-[8px] uppercase tracking-[0.5em]">
        <span>ENCRYPTED_DATA_TRANSMISSION</span>
        <span>SECURE_LINK_ACTIVE</span>
        <span>SYNC_TIMESTAMP: {new Date().toLocaleTimeString()}</span>
      </div>
    </div>
  );
};

export default LeaderboardPage;
