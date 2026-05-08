import { Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import LandingPage from './pages/LandingPage';
import LobbyPage from './pages/LobbyPage';
import BattlePage from './pages/BattlePage';
import LeaderboardPage from './pages/LeaderboardPage';
import ProfilePage from './pages/ProfilePage';
import MatrixBackground from './components/MatrixBackground';
import Footer from './components/Footer';
import Navbar from './components/Navbar';
import API_BASE_URL from './services/api';

function App() {
  const location = useLocation();
  const isLanding = location.pathname === '/';

  useEffect(() => {
    const handleBeforeUnload = () => {
      const username = localStorage.getItem('tw_username');
      if (username) {
        // Attempt to clean up guest account on exit.
        // If the user is registered, the backend will safely ignore this request.
        fetch(`${API_BASE_URL}/api/users/guest/${encodeURIComponent(username)}`, { 
          method: 'DELETE',
          keepalive: true
        }).catch(err => console.error('Failed cleanup:', err));
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  return (
    <div className="min-h-screen bg-cyber-black text-cyber-neon selection:bg-cyber-neon selection:text-cyber-black flex flex-col">
      <MatrixBackground />
      <Navbar />
      <main className={`flex-grow flex flex-col ${isLanding ? '' : 'pt-16 md:pt-20'}`}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/lobby" element={<LobbyPage />} />
          <Route path="/battle/:roomId" element={<BattlePage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/profile/:username" element={<ProfilePage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;
