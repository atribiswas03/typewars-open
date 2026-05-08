import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, Download, Smartphone } from 'lucide-react';
import { useState, useEffect } from 'react';

const Footer = () => {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
      console.log('PWA: Already installed or running in standalone mode');
      setIsInstalled(true);
    }

    const handleBeforeInstallPrompt = (e) => {
      console.log('PWA: beforeinstallprompt event fired');
      e.preventDefault();
      setInstallPrompt(e);
    };

    const handleAppInstalled = () => {
      console.log('PWA: appinstalled event fired');
      setIsInstalled(true);
      setInstallPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) {
      console.log('PWA: No install prompt available');
      return;
    }
    console.log('PWA: Triggering install prompt');
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    console.log(`PWA: User response to install prompt: ${outcome}`);
    if (outcome === 'accepted') {
      setInstallPrompt(null);
    }
  };

  return (
    <motion.footer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed bottom-0 left-0 right-0 p-4 flex items-center justify-between pointer-events-none z-[100]"
    >
      <div className="flex items-center gap-4">
        <div className="font-mono text-[8px] text-cyber-neon/20 flex gap-4">
          <span className="hidden md:inline">V.1.2.0_STABLE</span>
          <span className="animate-pulse text-cyber-green hidden md:inline">STATUS: GRID_ONLINE</span>
        </div>

        <AnimatePresence>
          {installPrompt && !isInstalled && (
            <motion.button
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onClick={handleInstall}
              className="pointer-events-auto flex items-center gap-2 px-3 py-1.5 glass-card rounded-lg border border-cyber-green/20 hover:border-cyber-green/50 hover:bg-cyber-green/5 transition-all group"
            >
              <Smartphone className="w-3 h-3 text-cyber-green" />
              <span className="text-[8px] font-mono text-cyber-green uppercase tracking-widest">INSTALL APP</span>
              <Download className="w-3 h-3 text-cyber-green group-hover:translate-y-0.5 transition-transform" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      <motion.a
        href="https://atribiswas.vercel.app/"
        target="_blank"
        rel="noopener noreferrer"
        className="pointer-events-auto flex items-center gap-2 px-4 py-2 glass-card rounded-full border border-cyber-neon/20 hover:border-cyber-neon/50 hover:bg-cyber-neon/5 transition-all group"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <div className="flex flex-col items-end">
          <span className="text-[8px] font-mono text-cyber-neon/40 tracking-widest leading-none">CORE_DEVELOPER</span>
          <span className="text-[10px] font-bold text-white tracking-tighter group-hover:text-cyber-neon transition-colors">ATRI BISWAS</span>
        </div>
        <div className="w-8 h-8 rounded-full bg-cyber-neon/10 border border-cyber-neon/20 flex items-center justify-center group-hover:shadow-[0_0_10px_#00f3ff] transition-all">
          <ExternalLink className="w-3 h-3 text-cyber-neon" />
        </div>
      </motion.a>
    </motion.footer>
  );
};

export default Footer;

