import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, Trophy, User, Home } from 'lucide-react';
import logo from '../assets/logo.png';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const username = localStorage.getItem('tw_username');

  const handleLogout = () => {
    localStorage.removeItem('tw_token');
    localStorage.removeItem('tw_username');
    localStorage.removeItem('tw_user_id');
    navigate('/');
  };

  // Don't show navbar on the landing page
  if (location.pathname === '/') return null;

  return (
    <nav className="fixed top-0 left-0 w-full z-[80] px-4 md:px-8 py-2 md:py-3">
      <div className="max-w-7xl mx-auto glass-card flex items-center justify-between px-4 py-2 rounded-xl border border-white/5 shadow-[0_8px_32px_rgba(0,0,0,0.8)] backdrop-blur-md">
        <Link to="/lobby" className="flex items-center gap-3 group">
          <img src={logo} alt="TypeWars" className="w-8 h-8 md:w-10 md:h-10 drop-shadow-[0_0_8px_#00f3ff] group-hover:scale-110 transition-transform duration-500" />
          <span className="text-xl md:text-2xl font-black italic tracking-tighter neon-text">TYPE<span className="text-cyber-purple">WARS</span></span>
        </Link>

        <div className="flex items-center gap-4 md:gap-8">
          <Link to="/lobby" className={`text-[10px] font-mono flex items-center gap-2 transition-all ${location.pathname === '/lobby' ? 'text-cyber-neon shadow-neon' : 'text-white/40 hover:text-white'}`}>
            <Home className="w-4 h-4" /> <span className="hidden sm:inline">BASE</span>
          </Link>
          <Link to="/leaderboard" className={`text-[10px] font-mono flex items-center gap-2 transition-all ${location.pathname === '/leaderboard' ? 'text-cyber-neon shadow-neon' : 'text-white/40 hover:text-white'}`}>
            <Trophy className="w-4 h-4" /> <span className="hidden sm:inline">LEADERBOARD</span>
          </Link>
          <Link to={`/profile/${username}`} className={`text-[10px] font-mono flex items-center gap-2 transition-all ${location.pathname.startsWith('/profile') ? 'text-cyber-neon shadow-neon' : 'text-white/40 hover:text-white'}`}>
            <User className="w-4 h-4" /> <span className="hidden sm:inline">PROFILE</span>
          </Link>
          <div className="h-6 w-[1px] bg-white/10 hidden sm:block"></div>
          <button 
            onClick={handleLogout} 
            className="text-[10px] font-mono text-cyber-pink/60 hover:text-cyber-pink hover:bg-cyber-pink/5 px-3 py-1.5 rounded-lg border border-transparent hover:border-cyber-pink/20 flex items-center gap-2 transition-all"
          >
            <LogOut className="w-4 h-4" /> <span className="hidden sm:inline">EXIT</span>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
