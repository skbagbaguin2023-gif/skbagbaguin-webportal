import React from 'react';
import { useTheme } from '../context/ThemeContext.tsx';
import { Sun, Moon } from 'lucide-react';

interface ThemeToggleProps {
  className?: string;
  variant?: 'header' | 'floating' | 'admin';
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ 
  className = '',
  variant = 'header',
}) => {
  const { theme, isDark, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      type="button"
      aria-label={isDark ? 'Switch to Light Mode' : 'Switch to High-Contrast Dark Mode'}
      title={isDark ? 'Switch to Light Mode' : 'Switch to High-Contrast Dark Mode (Low Light Reading)'}
      className={`p-2 rounded-lg transition-colors cursor-pointer flex items-center justify-center ${
        variant === 'header'
          ? 'text-amber-300 hover:text-white hover:bg-white/10'
          : variant === 'admin'
          ? 'text-slate-600 dark:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          : 'bg-[#081830] text-amber-400 border border-white/20 hover:bg-navy-800'
      } ${className}`}
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-amber-400 transition-transform duration-200 rotate-0 hover:rotate-45" />
      ) : (
        <Moon className="w-4 h-4 text-amber-300 transition-transform duration-200" />
      )}
    </button>
  );
};
