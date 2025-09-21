
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
    <header className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-40">
      <nav className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <HamburgerMenu onNavigate={onNavigate} isLoggedIn={isLoggedIn} onLogout={onLogout} />
            <button onClick={() => onNavigate(View.DASHBOARD)} className="flex-shrink-0 flex items-center gap-2">
              <ShieldCheckIcon className="h-8 w-8 text-primary dark:text-accent" />
              <span className="font-bold text-xl text-dark dark:text-white hidden sm:block">Veritas AI</span>
            </button>
          </div>
          
          <div className="flex items-center gap-4">
            <ThemeSwitcher theme={theme} onThemeChange={onThemeChange} />
            {!isLoggedIn && (
              <button
                onClick={onLogin}
                className="bg-accent text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary transition-colors"
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
