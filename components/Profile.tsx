
import React from 'react';
import { View, UserProfile } from '../types';
import { ClockIcon } from './icons/ClockIcon';
import { ChartPieIcon } from './icons/ChartPieIcon';
import { Cog6ToothIcon } from './icons/Cog6ToothIcon';

interface ProfileProps {
  onNavigate: (view: View) => void;
  user: UserProfile | null;
}

const resolveInitials = (profile: UserProfile | null): string => {
  if (!profile) {
    return 'U';
  }
  const name = profile.displayName ?? profile.email ?? 'User';
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return 'U';
  }
  const initials = parts.slice(0, 2).map(part => part[0]?.toUpperCase() ?? '').join('');
  return initials || 'U';
};

const formatDate = (value?: string): string | null => {
  if (!value) {
    return null;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed.toLocaleDateString();
};

const formatDateTime = (value?: string): string | null => {
  if (!value) {
    return null;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed.toLocaleString();
};

export const Profile: React.FC<ProfileProps> = ({ onNavigate, user }) => {
  if (!user) {
    return (
      <div className="mx-auto max-w-xl space-y-6 rounded-3xl border border-dashed border-primary/30 bg-white/70 p-8 text-center shadow-inner shadow-primary/10 backdrop-blur dark:border-accent/30 dark:bg-gray-900/70 dark:shadow-black/30">
        <h2 className="text-2xl font-semibold text-dark dark:text-white">You are not signed in</h2>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Sign in to personalize your experience, sync your analysis history, and participate in the community trust ledger when it launches.
        </p>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Return to the dashboard to continue exploring insights.
        </div>
      </div>
    );
  }

  const initials = resolveInitials(user);
  const displayName = user.displayName ?? (user.email ? user.email.split('@')[0] ?? user.email : 'Community Investigator');
  const email = user.email ?? 'No email on record';
  const joined = formatDate(user.createdAt);
  const lastActive = formatDateTime(user.lastLoginAt);

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="space-y-2">
        <h2 className="text-3xl font-semibold tracking-tight text-dark dark:text-white">Your profile</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">Centralize your preferences, jump into past work, and monitor upcoming insights.</p>
      </div>

      <div className="overflow-hidden rounded-3xl border border-white/40 bg-white/70 p-8 shadow-2xl shadow-primary/10 backdrop-blur-md transition-colors duration-200 dark:border-gray-800/60 dark:bg-gray-900/70 dark:shadow-black/30 sm:p-10">
        <div className="flex flex-col gap-8">
          {/* User Info */}
          <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
            <div className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-accent to-secondary text-3xl font-bold text-white shadow-lg shadow-primary/30">
              {user.photoURL ? (
                <img src={user.photoURL} alt={`${displayName}'s avatar`} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                initials
              )}
            </div>
            <div>
              <h3 className="text-2xl font-semibold text-dark dark:text-white">{displayName}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{email}</p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.35em] text-primary dark:text-accent">
                <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-4 py-1 dark:border-accent/30 dark:bg-accent/10">
                  Beta access
                </span>
                {joined && (
                  <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-4 py-1 dark:border-accent/30 dark:bg-accent/10">
                    Joined {joined}
                  </span>
                )}
                {lastActive && (
                  <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-4 py-1 dark:border-accent/30 dark:bg-accent/10">
                    Active {lastActive}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-dark dark:text-white">Quick access</h4>
            <div className="grid gap-4 md:grid-cols-2">
              <button
                onClick={() => onNavigate(View.HISTORY)}
                className="group flex items-center gap-4 rounded-2xl border border-white/40 bg-white/60 px-5 py-4 text-left shadow-sm shadow-primary/5 transition duration-200 hover:-translate-y-[1px] hover:shadow-xl dark:border-gray-700/60 dark:bg-gray-900/70 dark:shadow-black/20"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary transition-colors duration-200 group-hover:bg-primary group-hover:text-white dark:bg-accent/15 dark:text-accent dark:group-hover:bg-accent dark:group-hover:text-gray-900">
                  <ClockIcon className="h-6 w-6" />
                </span>
                <div className="space-y-1">
                  <span className="font-semibold text-dark dark:text-white">View analysis history</span>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Return to previous verdicts and narratives.</p>
                </div>
              </button>
              <button
                onClick={() => onNavigate(View.SETTINGS)}
                className="group flex items-center gap-4 rounded-2xl border border-white/40 bg-white/60 px-5 py-4 text-left shadow-sm shadow-primary/5 transition duration-200 hover:-translate-y-[1px] hover:shadow-xl dark:border-gray-700/60 dark:bg-gray-900/70 dark:shadow-black/20"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary transition-colors duration-200 group-hover:bg-primary group-hover:text-white dark:bg-accent/15 dark:text-accent dark:group-hover:bg-accent dark:group-hover:text-gray-900">
                  <Cog6ToothIcon className="h-6 w-6" />
                </span>
                <div className="space-y-1">
                  <span className="font-semibold text-dark dark:text-white">Account settings</span>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Adjust theme preferences and identity.</p>
                </div>
              </button>
              <div className="flex items-center gap-4 rounded-2xl border border-dashed border-primary/30 bg-white/50 px-5 py-4 text-left opacity-70 shadow-inner shadow-primary/10 dark:border-accent/30 dark:bg-gray-900/50 dark:shadow-black/20">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-200 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                  <ChartPieIcon className="h-6 w-6" />
                </span>
                <div className="space-y-1">
                  <span className="font-semibold text-gray-600 dark:text-gray-300">Insight analytics</span>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Coming soon: trend dashboards and impact metrics.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
