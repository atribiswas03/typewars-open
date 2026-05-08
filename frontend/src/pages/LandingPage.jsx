import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Terminal, Shield, Zap, Mail, Lock, User, ArrowRight, Eye, EyeOff } from 'lucide-react';
import logo from '../assets/logo.png';
import API_BASE_URL from '../services/api';

const LandingPage = () => {
  const [mode, setMode] = useState('guest'); // guest, login, register, forgot, verify, reset
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    otp: ''
  });
  const [notification, setNotification] = useState(null); // { message, type: 'error' | 'success' }
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const showNotification = (message, type = 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setNotification(null);
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setNotification(null);

    let endpoint = '/api/auth/login';
    let bodyData = { ...formData };

    if (mode === 'guest') endpoint = '/api/auth/guest';
    else if (mode === 'register') endpoint = '/api/auth/register';
    else if (mode === 'verify') endpoint = '/api/auth/verify-otp';
    else if (mode === 'forgot') endpoint = '/api/auth/forgot-password';
    else if (mode === 'reset') {
      endpoint = '/api/auth/reset-password';
      bodyData = { email: formData.email, otp: formData.otp, newPassword: formData.password };
    }

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData)
      });

      const data = await response.json();

      if (response.ok) {
        if (mode === 'register') {
          setMode('verify');
          showNotification('NEURAL_LINK_ESTABLISHED. CHECK_EMAIL_FOR_OTP.', 'success');
        } else if (mode === 'forgot') {
          setMode('reset');
          showNotification('RECOVERY_LINK_SENT. CHECK_EMAIL.', 'success');
        } else if (mode === 'reset') {
          showNotification('ENCRYPTION_KEY_UPDATED. REBOOTING_LINK...', 'success');
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        } else if (mode === 'verify') {
          showNotification('IDENTITY_VERIFIED. ACCESS_GRANTED.', 'success');
          setTimeout(() => {
            localStorage.setItem('tw_token', data.token);
            localStorage.setItem('tw_username', data.username);
            localStorage.setItem('tw_user_id', data._id);
            navigate('/lobby');
          }, 1000);
        } else {
          localStorage.setItem('tw_token', data.token);
          localStorage.setItem('tw_username', data.username);
          localStorage.setItem('tw_user_id', data._id);
          navigate('/lobby');
        }
      } else {
        if (data.redirect) {
          showNotification(data.message, 'error');
          setTimeout(() => {
            setMode('login');
            setNotification(null);
          }, 3000);
        } else {
          showNotification(data.message || 'AUTHENTICATION_FAILED', 'error');
        }
      }
    } catch (err) {
      showNotification('CONNECTION_ERROR', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-grow flex flex-col items-center justify-center p-4 overflow-hidden">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyber-neon/5 rounded-full blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyber-purple/5 rounded-full blur-[100px] animate-pulse delay-1000"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12 relative"
      >
        <div className="flex flex-col items-center gap-4">
          <motion.img 
            src={logo} 
            alt="TypeWars Logo" 
            className="w-32 h-32 md:w-48 md:h-48 drop-shadow-[0_0_20px_rgba(0,243,255,0.3)]"
            initial={{ scale: 0.8, rotate: -5 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ 
              type: "spring",
              stiffness: 260,
              damping: 20 
            }}
          />
          <h1 className="text-5xl md:text-8xl font-bold tracking-tighter neon-text mb-2 glitch-hover" data-text="TYPEWARS">
            TYPE<span className="text-cyber-purple">WARS</span>
          </h1>
        </div>
        <div className="flex items-center justify-center gap-2 text-cyber-neon/60 font-mono text-xs tracking-[0.2em]">
          <span className="w-8 h-[1px] bg-cyber-neon/20"></span>
          SYSTEM_READY: MULTIPLAYER_TYPING_BATTLE
          <span className="w-8 h-[1px] bg-cyber-neon/20"></span>
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="glass-card p-8 rounded-2xl w-full max-w-md border-t-2 border-cyber-neon relative z-10"
      >
        {/* Mode Toggle */}
        <div className="flex p-1 bg-cyber-black/50 rounded-lg mb-8 border border-cyber-neon/10">
          {['guest', 'login', 'register'].map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setNotification(null); }}
              className={`flex-1 py-2 text-[10px] font-mono rounded transition-all ${
                mode === m ? 'bg-cyber-neon text-cyber-black font-bold shadow-[0_0_10px_#00f3ff]' : 'text-cyber-neon/40 hover:text-cyber-neon/70'
              }`}
            >
              {m.toUpperCase()}
            </button>
          ))}
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-4"
            >
              {(mode === 'guest' || mode === 'register') && (
                <div className="space-y-2">
                  <label className="block text-[10px] font-mono text-cyber-neon/50 ml-1">IDENTIFIER</label>
                  <div className="relative group">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyber-neon group-focus-within:text-cyber-purple transition-colors" />
                    <input 
                      type="text" 
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      placeholder="ENTER_NAME..."
                      className="w-full bg-cyber-black/50 border border-cyber-neon/20 p-3 pl-10 rounded-lg focus:border-cyber-neon focus:outline-none text-cyber-neon placeholder:text-cyber-neon/20 font-mono text-sm transition-all focus:ring-1 focus:ring-cyber-neon/30"
                      maxLength={15}
                      required={mode !== 'forgot'}
                    />
                  </div>
                </div>
              )}

              {(mode === 'login' || mode === 'register' || mode === 'forgot' || mode === 'verify') && (
                <div className="space-y-2">
                  <label className="block text-[10px] font-mono text-cyber-neon/50 ml-1">NEURAL_LINK (EMAIL)</label>
                  <div className="relative group">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyber-neon group-focus-within:text-cyber-purple transition-colors" />
                    <input 
                      type="email" 
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="ACCESS_EMAIL..."
                      className="w-full bg-cyber-black/50 border border-cyber-neon/20 p-3 pl-10 rounded-lg focus:border-cyber-neon focus:outline-none text-cyber-neon placeholder:text-cyber-neon/20 font-mono text-sm transition-all focus:ring-1 focus:ring-cyber-neon/30"
                      required
                    />
                  </div>
                </div>
              )}

              {(mode === 'verify' || mode === 'reset') && (
                <div className="space-y-2">
                  <label className="block text-[10px] font-mono text-cyber-neon/50 ml-1">SECURE_OTP (6-DIGITS)</label>
                  <div className="relative group">
                    <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyber-neon group-focus-within:text-cyber-purple transition-colors" />
                    <input 
                      type="text" 
                      name="otp"
                      value={formData.otp}
                      onChange={handleInputChange}
                      placeholder="XXXXXX"
                      className="w-full bg-cyber-black/50 border border-cyber-neon/20 p-3 pl-10 rounded-lg focus:border-cyber-neon focus:outline-none text-cyber-neon placeholder:text-cyber-neon/20 font-mono text-sm tracking-[0.5em] transition-all focus:ring-1 focus:ring-cyber-neon/30"
                      maxLength={6}
                      required
                    />
                  </div>
                </div>
              )}

              {(mode === 'login' || mode === 'register' || mode === 'reset') && (
                <div className="space-y-2">
                  <label className="block text-[10px] font-mono text-cyber-neon/50 ml-1">
                    {mode === 'reset' ? 'NEW_ENCRYPTION_KEY' : 'ENCRYPTION_KEY (PASSWORD)'}
                  </label>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyber-neon group-focus-within:text-cyber-purple transition-colors" />
                    <input 
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder={mode === 'reset' ? "REWRITE_KEY..." : "••••••••"}
                      className="w-full bg-cyber-black/50 border border-cyber-neon/20 p-3 px-10 rounded-lg focus:border-cyber-neon focus:outline-none text-cyber-neon placeholder:text-cyber-neon/20 font-mono text-sm transition-all focus:ring-1 focus:ring-cyber-neon/30"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-cyber-neon/50 hover:text-cyber-neon transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              {mode === 'login' && (
                <div className="flex justify-end px-1">
                  <button 
                    type="button"
                    onClick={() => { setMode('forgot'); setNotification(null); }}
                    className="text-[9px] font-mono text-cyber-neon/40 hover:text-cyber-neon transition-colors tracking-widest"
                  >
                    FORGOT_ENCRYPTION_KEY?
                  </button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {notification && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`p-3 rounded-lg border font-mono text-[10px] text-center ${
                notification.type === 'success'
                  ? 'bg-cyber-green/10 border-cyber-green text-cyber-green shadow-[0_0_10px_rgba(0,255,65,0.2)]'
                  : 'bg-cyber-pink/10 border-cyber-pink text-cyber-pink shadow-[0_0_10px_rgba(255,0,85,0.2)]'
              }`}
            >
              [{notification.type === 'success' ? 'SYSTEM' : 'ERROR'}]: {notification.message}
            </motion.div>
          )}

          <button 
            type="submit"
            disabled={loading}
            className="w-full relative overflow-hidden group neon-button p-4 rounded-lg font-bold text-lg flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            {loading ? (
              <span className="animate-pulse">INITIALIZING...</span>
            ) : (
              <>
                <Zap className="w-5 h-5 group-hover:text-cyber-purple transition-colors" />
                <span className="tracking-widest uppercase">
                  {mode === 'guest' ? 'ENTER_THE_VOID' : mode === 'login' ? 'ESTABLISH_LINK' : mode === 'forgot' ? 'REQUEST_OTP' : mode === 'reset' ? 'REWRITE_KEY' : 'INITIALIZE_CORE'}
                </span>
                <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 grid grid-cols-3 gap-4 text-center text-[8px] font-mono opacity-30">
          <div className="flex flex-col items-center gap-1 group hover:opacity-100 transition-opacity">
            <Shield className="w-3 h-3 text-cyber-neon" />
            <span>SECURE_LINK</span>
          </div>
          <div className="flex flex-col items-center gap-1 group hover:opacity-100 transition-opacity">
            <Zap className="w-3 h-3 text-cyber-green" />
            <span>FAST_WPM</span>
          </div>
          <div className="flex flex-col items-center gap-1 group hover:opacity-100 transition-opacity">
            <Terminal className="w-3 h-3 text-cyber-purple" />
            <span>NEURAL_GRID</span>
          </div>
        </div>
      </motion.div>


    </div>
  );
};

export default LandingPage;
