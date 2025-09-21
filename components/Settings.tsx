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
    <div className="max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold text-dark dark:text-white mb-6">Settings</h2>
      <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg space-y-8">
        {/* Appearance Settings */}
        <div>
          <h3 className="text-xl font-semibold text-dark dark:text-white mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">Appearance</h3>
          <div className="flex items-center justify-between">
            <label className="text-gray-700 dark:text-gray-300" id="theme-label">Interface Theme</label>
            <ThemeSwitcher theme={theme} onThemeChange={onThemeChange} />
          </div>
        </div>

        {/* Profile Settings */}
        <div>
          <h3 className="text-xl font-semibold text-dark dark:text-white mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">Profile Information</h3>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
              <input type="text" id="name" defaultValue="Demo User" className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-accent focus:border-accent sm:text-sm bg-light dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white" />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email Address</label>
              <input type="email" id="email" defaultValue="demo.user@example.com" className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-accent focus:border-accent sm:text-sm bg-light dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white" />
            </div>
            <div className="flex justify-end">
                <button type="submit" className="bg-accent text-white font-bold py-2 px-4 rounded-lg hover:bg-primary transition-colors duration-300">
                    Save Changes
                </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};