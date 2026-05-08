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

        <div className="p-2 md:p-6 overflow-x-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="relative">
                <Loader2 className="w-12 h-12 text-cyber-neon animate-spin" />
                <div className="absolute inset-0 blur-lg bg-cyber-neon/20 animate-pulse" />
              </div>
              <p className="font-mono text-[10px] text-cyber-neon/40 animate-pulse uppercase tracking-[0.5em]">RETRIEVING_DATA_FROM_MAIN_FRAME...</p>
            </div>
          ) : (
            <table className="w-full text-left font-mono border-separate border-spacing-y-3">
              <thead>
                <tr className="text-cyber-neon/30 text-[10px] uppercase tracking-[0.3em]">
                  <th className="px-6 py-4">Rank</th>
                  <th className="px-6 py-4">Operative</th>
                  <th className="px-6 py-4">Peak_Speed</th>
                  <th className="px-6 py-4 text-right">Neural_Level</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((user, idx) => {
                  const isTop3 = idx < 3;
                  const rankColors = [
                    'text-[#FFD700] drop-shadow-[0_0_8px_rgba(255,215,0,0.5)]', // Gold
                    'text-[#C0C0C0] drop-shadow-[0_0_8px_rgba(192,192,192,0.5)]', // Silver
                    'text-[#CD7F32] drop-shadow-[0_0_8px_rgba(205,127,50,0.5)]', // Bronze
                  ];

                  return (
                    <motion.tr 
                      key={user._id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="group transition-all duration-300 relative"
                    >
                      {/* Rank Cell */}
                      <td className="px-6 py-5 bg-white/[0.02] group-hover:bg-white/[0.05] rounded-l-2xl border-y border-l border-white/5 group-hover:border-cyber-neon/30 transition-all">
                        <div className="flex items-center gap-4">
                          <span className={`text-2xl font-black italic w-10 ${isTop3 ? rankColors[idx] : 'text-white/20'}`}>
                            {(idx + 1).toString().padStart(2, '0')}
                          </span>
                          {idx === 0 && (
                            <div className="relative">
                              <Shield className="w-4 h-4 text-[#FFD700] animate-pulse" />
                              <div className="absolute inset-0 blur-sm bg-[#FFD700]/30 animate-pulse" />
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Operative Cell */}
                      <td className="px-6 py-5 bg-white/[0.02] group-hover:bg-white/[0.05] border-y border-white/5 group-hover:border-cyber-neon/30 transition-all">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-xl border flex items-center justify-center text-lg font-black transition-all duration-500
                            ${idx === 0 ? 'bg-[#FFD700]/10 border-[#FFD700]/30 text-[#FFD700]' : 
                              idx === 1 ? 'bg-[#C0C0C0]/10 border-[#C0C0C0]/30 text-[#C0C0C0]' :
                              idx === 2 ? 'bg-[#CD7F32]/10 border-[#CD7F32]/30 text-[#CD7F32]' :
                              'bg-white/5 border-white/10 text-white/40'}`}>
                            {user.username[0].toUpperCase()}
                          </div>
                          <div className="flex flex-col">
                            <span className={`font-black text-lg transition-colors tracking-tight uppercase group-hover:text-white
                              ${isTop3 ? 'text-white' : 'text-white/60'}`}>
                              {user.username}
                            </span>
                            <span className="text-[7px] text-white/20 uppercase tracking-[0.4em] font-bold">
                              {idx === 0 ? 'SYSTEM_CHAMPION' : idx < 5 ? 'ELITE_OPERATIVE' : 'ACTIVE_OPERATIVE'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Speed Cell */}
                      <td className="px-6 py-5 bg-white/[0.02] group-hover:bg-white/[0.05] border-y border-white/5 group-hover:border-cyber-neon/30 transition-all">
                        <div className="flex items-center gap-4">
                          <div className="flex flex-col min-w-[80px]">
                            <div className="flex items-end gap-1">
                              <span className="font-black text-2xl text-white group-hover:text-cyber-neon transition-colors leading-none">
                                {user.bestWPM}
                              </span>
                              <span className="text-[10px] text-white/20 font-bold mb-1">WPM</span>
                            </div>
                            <div className="w-full h-1 bg-white/5 rounded-full mt-2 overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min(user.bestWPM / 1.5, 100)}%` }}
                                className={`h-full ${isTop3 ? 'bg-cyber-neon' : 'bg-white/20'}`}
                              />
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Level Cell */}
                      <td className="px-6 py-5 bg-white/[0.02] group-hover:bg-white/[0.05] rounded-r-2xl border-y border-r border-white/5 group-hover:border-cyber-neon/30 text-right transition-all">
                        <div className="inline-flex flex-col items-end gap-1">
                          <span className="text-[8px] text-white/20 font-bold uppercase tracking-widest">Neural_Level</span>
                          <div className={`px-3 py-1 rounded border text-[10px] font-black tracking-tighter transition-all duration-300
                            ${idx === 0 ? 'bg-[#FFD700]/10 border-[#FFD700]/30 text-[#FFD700] shadow-[0_0_15px_rgba(255,215,0,0.1)]' :
                              'bg-cyber-purple/10 border-cyber-purple/30 text-cyber-purple shadow-[0_0_10px_rgba(188,0,255,0.1)]'}`}>
                            LVL_{user.level.toString().padStart(2, '0')}
                          </div>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
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
