
import React from 'react';
import { View, Theme } from '../types';
import { ShieldCheckIcon } from './icons/ShieldCheckIcon';
import { ThemeSwitcher } from './ThemeSwitcher';
import { HamburgerMenu } from './HamburgerMenu';

interface HeaderProps {
  onNavigate: (view: View) => void;
  isLoggedIn: boolean;
  onLogin: () => void;
  onLogout: () => void;
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
}

export const Header: React.FC<HeaderProps> = ({ onNavigate, isLoggedIn, onLogin, onLogout, theme, onThemeChange }) => {
  return (
    <header className="sticky top-0 z-50 border-b border-white/40 bg-white/80 backdrop-blur-md transition-colors duration-200 dark:border-gray-800/60 dark:bg-gray-900/80">
      <nav className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <HamburgerMenu onNavigate={onNavigate} isLoggedIn={isLoggedIn} onLogout={onLogout} />
            <button onClick={() => onNavigate(View.DASHBOARD)} className="flex shrink-0 items-center gap-2 rounded-full px-2 py-1 transition-transform duration-200 hover:scale-[1.02]">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-white shadow-inner shadow-primary/20">
                <ShieldCheckIcon className="h-6 w-6" />
              </div>
              <span className="hidden text-xl font-semibold tracking-tight text-dark dark:text-white sm:block">
                Veritas AI
              </span>
            </button>
          </div>
          
          <div className="flex items-center gap-3">
            <ThemeSwitcher theme={theme} onThemeChange={onThemeChange} />
            {!isLoggedIn && (
              <button
                onClick={onLogin}
                className="rounded-full bg-gradient-to-r from-primary to-accent px-4 py-2 text-sm font-semibold text-white shadow-md shadow-primary/20 transition-transform duration-200 hover:-translate-y-[1px] hover:shadow-lg"
              >
                Log In
              </button>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
};
