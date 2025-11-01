
import React from 'react';
import { View } from '../types';
import { ClockIcon } from './icons/ClockIcon';
import { ChartPieIcon } from './icons/ChartPieIcon';
import { Cog6ToothIcon } from './icons/Cog6ToothIcon';

interface ProfileProps {
  onNavigate: (view: View) => void;
}

export const Profile: React.FC<ProfileProps> = ({ onNavigate }) => {
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
            <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-primary via-accent to-secondary text-3xl font-bold text-white shadow-lg shadow-primary/30">
              DU
            </div>
            <div>
              <h3 className="text-2xl font-semibold text-dark dark:text-white">Demo User</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">demo.user@example.com</p>
              <div className="mt-3 inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-primary dark:border-accent/30 dark:bg-accent/10 dark:text-accent">
                Beta access
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
