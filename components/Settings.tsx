import React from 'react';
import { Theme } from '../types';
import { ThemeSwitcher } from './ThemeSwitcher';

interface SettingsProps {
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
}

export const Settings: React.FC<SettingsProps> = ({ theme, onThemeChange }) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would submit changes to a backend.
    // For now, it just prevents the form from reloading.
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="space-y-2">
        <h2 className="text-3xl font-semibold tracking-tight text-dark dark:text-white">Settings</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">Personalize your experience and keep your contact information current.</p>
      </div>

      <div className="overflow-hidden rounded-3xl border border-white/40 bg-white/70 p-8 shadow-2xl shadow-primary/10 backdrop-blur-md transition-colors duration-200 dark:border-gray-800/60 dark:bg-gray-900/70 dark:shadow-black/30 sm:p-10">
        <div className="space-y-10">
          {/* Appearance Settings */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="text-lg font-semibold text-dark dark:text-white">Appearance</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Fine-tune the interface theme across devices.</p>
              </div>
              <ThemeSwitcher theme={theme} onThemeChange={onThemeChange} />
            </div>
            <div className="rounded-2xl border border-dashed border-primary/30 bg-white/60 px-5 py-4 text-xs text-gray-500 dark:border-accent/30 dark:bg-gray-900/60 dark:text-gray-400">
              <strong className="font-semibold text-primary dark:text-accent">Pro tip:</strong> System theme follows your OS preference, switching automatically as your environment changes.
            </div>
          </section>

          {/* Profile Settings */}
          <section className="space-y-6">
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-dark dark:text-white">Profile information</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Update details used for alerts, collaboration, and saved history.</p>
            </div>
            <form className="grid gap-6 md:grid-cols-2" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label htmlFor="name" className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">Name</label>
                <input
                  type="text"
                  id="name"
                  defaultValue="Demo User"
                  className="w-full rounded-2xl border border-white/40 bg-white/80 px-4 py-3 text-sm text-gray-800 shadow-inner shadow-primary/10 focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/30 dark:border-gray-700/60 dark:bg-gray-900/70 dark:text-gray-100 dark:focus:border-accent/50 dark:focus:ring-accent/30"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="email" className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">Email Address</label>
                <input
                  type="email"
                  id="email"
                  defaultValue="demo.user@example.com"
                  className="w-full rounded-2xl border border-white/40 bg-white/80 px-4 py-3 text-sm text-gray-800 shadow-inner shadow-primary/10 focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/30 dark:border-gray-700/60 dark:bg-gray-900/70 dark:text-gray-100 dark:focus:border-accent/50 dark:focus:ring-accent/30"
                />
              </div>
              <div className="md:col-span-2">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Data is encrypted at rest and synced across sessions.</span>
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-primary via-accent to-secondary px-6 py-2.5 text-xs font-semibold uppercase tracking-[0.3em] text-white shadow-lg shadow-primary/30 transition-transform duration-200 hover:-translate-y-[2px] hover:shadow-2xl"
                  >
                    Save changes
                  </button>
                </div>
              </div>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
};