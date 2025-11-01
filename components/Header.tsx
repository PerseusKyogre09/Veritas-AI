
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
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#050505]/90 text-white backdrop-blur">
      <nav className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <HamburgerMenu
            onNavigate={onNavigate}
            isLoggedIn={isLoggedIn}
            onLogout={onLogout}
            communityPendingCount={communityPendingCount}
          />
          <button
            onClick={() => onNavigate(View.DASHBOARD)}
            className="flex items-center gap-2 rounded-md px-2 py-1 text-sm font-semibold tracking-tight text-white transition-transform hover:scale-[1.02]"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-black">
              <ShieldCheckIcon className="h-5 w-5" />
            </span>
            <span className="hidden text-base sm:block">Veritas AI</span>
          </button>
        </div>

        <div className="flex items-center gap-3 text-sm">
          <button
            onClick={() => onNavigate(View.COMMUNITY)}
            className="relative inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-white/70 transition-colors hover:border-white/30 hover:text-white"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary">
              <BellAlertIcon className="h-4 w-4" />
            </span>
            <span className="hidden sm:inline">Community</span>
            {communityPendingCount > 0 && (
              <span className="inline-flex min-h-[1.25rem] min-w-[1.25rem] items-center justify-center rounded-full bg-primary px-2 text-xs font-bold text-black">
                {communityPendingCount}
              </span>
            )}
          </button>
          <ThemeSwitcher theme={theme} onThemeChange={onThemeChange} />
          {isLoggedIn ? (
            <button
              onClick={() => onNavigate(View.PROFILE)}
              className="flex items-center gap-2 rounded-full border border-white/10 px-3 py-1.5 text-white/80 transition hover:border-white/20 hover:text-white"
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
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-black">
                  {userInitials}
                </span>
              )}
              <span className="hidden text-sm font-medium sm:inline">{displayName}</span>
            </button>
          ) : (
            <button
              onClick={onLogin}
              className="rounded-full bg-primary px-4 py-2 font-semibold text-black transition hover:bg-secondary"
            >
              Log In
            </button>
          )}
        </div>
      </nav>
    </header>
  );
};
