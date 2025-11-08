
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
      <div className="mx-auto max-w-xl space-y-6 rounded-3xl border border-dashed border-white/20 bg-white/5 p-8 text-center text-white shadow-inner shadow-black/40">
        <h2 className="text-2xl font-semibold">You are not signed in</h2>
        <p className="text-sm text-white/60">
          Sign in to personalize your experience, sync your analysis history, and participate in the community trust ledger when it launches.
        </p>
        <div className="text-sm text-white/40">
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
    <div className="mx-auto max-w-4xl space-y-8 text-white">
      <div className="space-y-2">
        <h2 className="text-3xl font-semibold tracking-tight">Your profile</h2>
        <p className="text-sm text-white/50">Centralize your preferences, jump into past work, and monitor upcoming insights.</p>
      </div>

      <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#0C0C0C] p-8 shadow-2xl shadow-black/60 sm:p-10">
        <div className="flex flex-col gap-8">
          {/* User Info */}
          <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
            <div className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-secondary to-accent text-3xl font-bold text-black shadow-lg shadow-primary/40">
              {user.photoURL ? (
                <img src={user.photoURL} alt={`${displayName}'s avatar`} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                initials
              )}
            </div>
            <div>
              <h3 className="text-2xl font-semibold">{displayName}</h3>
              <p className="text-sm text-white/50">{email}</p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.35em] text-white/60">
                <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-1">
                  Beta access
                </span>
                {joined && (
                  <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-1">
                    Joined {joined}
                  </span>
                )}
                {lastActive && (
                  <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-1">
                    Active {lastActive}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Quick access</h4>
            <div className="grid gap-4 md:grid-cols-2">
              <button
                onClick={() => onNavigate(View.HISTORY)}
                className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-left shadow-sm shadow-black/40 transition duration-200 hover:-translate-y-[1px] hover:border-white/20"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/20 text-primary transition-colors duration-200 group-hover:bg-primary group-hover:text-black">
                  <ClockIcon className="h-6 w-6" />
                </span>
                <div className="space-y-1">
                  <span className="font-semibold text-white">View analysis history</span>
                  <p className="text-sm text-white/50">Return to previous verdicts and narratives.</p>
                </div>
              </button>
              <button
                onClick={() => onNavigate(View.SETTINGS)}
                className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-left shadow-sm shadow-black/40 transition duration-200 hover:-translate-y-[1px] hover:border-white/20"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/20 text-primary transition-colors duration-200 group-hover:bg-primary group-hover:text-black">
                  <Cog6ToothIcon className="h-6 w-6" />
                </span>
                <div className="space-y-1">
                  <span className="font-semibold text-white">Account settings</span>
                  <p className="text-sm text-white/50">Adjust theme preferences and identity.</p>
                </div>
              </button>
              <div className="flex items-center gap-4 rounded-2xl border border-dashed border-white/15 bg-white/5 px-5 py-4 text-left opacity-80 shadow-inner shadow-black/40">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-white/40">
                  <ChartPieIcon className="h-6 w-6" />
                </span>
                <div className="space-y-1">
                  <span className="font-semibold text-white/60">Insight analytics</span>
                  <p className="text-sm text-white/40">Coming soon: trend dashboards and impact metrics.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
