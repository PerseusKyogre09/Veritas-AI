
import React from 'react';
import { View, Theme, UserProfile } from '../types';
import { ShieldCheckIcon } from './icons/ShieldCheckIcon';
import { ThemeSwitcher } from './ThemeSwitcher';
import { HamburgerMenu } from './HamburgerMenu';
import { BellAlertIcon } from './icons/BellAlertIcon';

interface HeaderProps {
  onNavigate: (view: View) => void;
  isLoggedIn: boolean;
  user: UserProfile | null;
  onLogin: () => void;
  onLogout: () => void | Promise<void>;
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
  communityPendingCount: number;
}

const resolveInitials = (profile: UserProfile | null): string => {
  const fallback = profile?.email ?? 'User';
  const source = profile?.displayName ?? fallback;
  const parts = source.split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return 'U';
  }

  const initials = parts.slice(0, 2).map(part => part[0]?.toUpperCase() ?? '').join('');
  return initials || fallback.slice(0, 2).toUpperCase();
};

const resolveDisplayName = (profile: UserProfile | null): string => {
  const preferred = profile?.displayName?.trim();
  if (preferred) {
    return preferred;
  }
  const email = profile?.email?.trim();
  if (email) {
    return email.split('@')[0] ?? email;
  }
  return 'Your profile';
};

export const Header: React.FC<HeaderProps> = ({ onNavigate, isLoggedIn, user, onLogin, onLogout, theme, onThemeChange, communityPendingCount }) => {
  const userInitials = resolveInitials(user);
  const displayName = resolveDisplayName(user);
  return (
    <header className="sticky top-0 z-50 border-b border-white/40 bg-white/80 backdrop-blur-md transition-colors duration-200 dark:border-gray-800/60 dark:bg-gray-900/80">
      <nav className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <HamburgerMenu
              onNavigate={onNavigate}
              isLoggedIn={isLoggedIn}
              onLogout={onLogout}
              communityPendingCount={communityPendingCount}
            />
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
            <button
              onClick={() => onNavigate(View.COMMUNITY)}
              className="relative inline-flex items-center gap-2 rounded-full border border-transparent bg-white/70 px-3 py-1.5 text-sm font-semibold text-gray-700 transition duration-200 hover:border-primary/30 hover:text-primary dark:bg-gray-900/70 dark:text-gray-200 dark:hover:border-accent/40 dark:hover:text-accent"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors duration-200 dark:bg-accent/10 dark:text-accent">
                <BellAlertIcon className="h-4 w-4" />
              </span>
              <span className="hidden sm:inline">Community</span>
              {communityPendingCount > 0 && (
                <span className="inline-flex min-h-[1.5rem] min-w-[1.5rem] items-center justify-center rounded-full bg-primary text-xs font-bold text-white dark:bg-accent">
                  {communityPendingCount}
                </span>
              )}
            </button>
            <ThemeSwitcher theme={theme} onThemeChange={onThemeChange} />
            {isLoggedIn ? (
              <button
                onClick={() => onNavigate(View.PROFILE)}
                className="flex items-center gap-2 rounded-full bg-white/70 px-3 py-1.5 text-sm font-semibold text-dark shadow-sm shadow-primary/10 transition-all duration-200 hover:-translate-y-[1px] hover:bg-white/90 dark:bg-gray-900/70 dark:text-gray-100"
                aria-label="Open profile"
                title="View your profile"
              >
                {user?.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={`${displayName}'s avatar`}
                    className="h-8 w-8 rounded-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-xs font-semibold uppercase text-white">
                    {userInitials}
                  </span>
                )}
                <span className="hidden text-sm font-medium sm:inline">{displayName}</span>
              </button>
            ) : (
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
