'use client';

import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="w-9 h-9" />;

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="relative flex items-center justify-between w-full px-5 py-3 rounded-[20px] bg-[var(--surface)] hover:bg-white/10 transition-all duration-500 group overflow-hidden border border-white/5 active:scale-95 shadow-lg"
    >
      <div className="flex items-center space-x-4">
        <div className="p-1.5 rounded-[12px] bg-vibe-pink/10 group-hover:bg-vibe-pink/20 transition-colors duration-500">
            {theme === 'dark' ? (
                <Sun size={18} className="text-vibe-pink" />
            ) : (
                <Moon size={18} className="text-vibe-pink" />
            )}
        </div>
        <span className="font-semibold text-sm text-[var(--foreground)] opacity-60 group-hover:opacity-100 transition-opacity duration-500">
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
        </span>
      </div>
      
      <motion.div 
        animate={{ x: theme === 'dark' ? 0 : 4 }}
        className="text-[10px] font-bold uppercase tracking-widest text-vibe-pink opacity-40 group-hover:opacity-100 transition-all"
      >
        Mode
      </motion.div>
    </button>
  );
}
