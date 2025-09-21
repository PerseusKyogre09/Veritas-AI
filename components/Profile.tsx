
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
    <div className="max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold text-dark dark:text-white mb-6">User Profile</h2>
      <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg space-y-8">
        
        {/* User Info */}
        <div className="flex items-center space-x-4">
            <div className="w-20 h-20 bg-primary/20 dark:bg-accent/20 rounded-full flex items-center justify-center">
                <span className="text-3xl font-bold text-primary dark:text-accent">DU</span>
            </div>
            <div>
                <h3 className="text-2xl font-bold text-dark dark:text-white">Demo User</h3>
                <p className="text-gray-500 dark:text-gray-400">demo.user@example.com</p>
            </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h4 className="text-xl font-semibold text-dark dark:text-white mb-4">Quick Access</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button 
              onClick={() => onNavigate(View.HISTORY)}
              className="flex items-center p-4 bg-light dark:bg-gray-700/50 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-left"
            >
              <ClockIcon className="h-6 w-6 text-primary dark:text-accent mr-3 flex-shrink-0" />
              <div>
                <span className="font-semibold">View Analysis History</span>
                <p className="text-sm text-gray-500 dark:text-gray-400">Review your past analyses.</p>
              </div>
            </button>
             <button 
              onClick={() => onNavigate(View.SETTINGS)}
              className="flex items-center p-4 bg-light dark:bg-gray-700/50 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-left"
            >
              <Cog6ToothIcon className="h-6 w-6 text-primary dark:text-accent mr-3 flex-shrink-0" />
              <div>
                <span className="font-semibold">Account Settings</span>
                 <p className="text-sm text-gray-500 dark:text-gray-400">Manage theme and profile.</p>
              </div>
            </button>
            <div 
              className="flex items-center p-4 bg-light dark:bg-gray-700/50 rounded-lg cursor-not-allowed opacity-60"
            >
              <ChartPieIcon className="h-6 w-6 text-gray-400 mr-3 flex-shrink-0" />
              <div>
                <span className="font-semibold">View Analytics</span>
                 <p className="text-sm text-gray-500 dark:text-gray-400">(Coming Soon)</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
