import React from 'react';
import { ShieldCheckIcon } from './icons/ShieldCheckIcon';

interface LoginModalProps {
  onClose: () => void;
  onLogin: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onClose, onLogin }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/70 p-6 backdrop-blur">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/30 bg-white/80 p-8 text-center shadow-2xl shadow-primary/20 backdrop-blur-lg transition-colors duration-200 dark:border-gray-800/50 dark:bg-gray-900/80 dark:shadow-black/40">
        <div className="pointer-events-none absolute -top-24 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-primary/20 blur-3xl dark:bg-accent/25" />
        <div className="pointer-events-none absolute -bottom-24 right-1/3 h-48 w-48 rounded-full bg-secondary/20 blur-3xl dark:bg-secondary/25" />
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full bg-white/60 p-2 text-gray-500 transition-colors duration-150 hover:text-gray-700 dark:bg-gray-900/70 dark:text-gray-300 dark:hover:text-white"
          aria-label="Close login modal"
        >
          &times;
        </button>
        <div className="relative space-y-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary via-accent to-secondary text-white shadow-lg shadow-primary/30">
            <ShieldCheckIcon className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-semibold tracking-tight text-dark dark:text-white">Access your profile</h3>
            <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">
              Save reports, sync history across devices, and unlock personalized literacy insights.
            </p>
          </div>
          <div className="space-y-3">
            <button
              onClick={onLogin}
              className="w-full rounded-full bg-gradient-to-r from-primary via-accent to-secondary px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/30 transition-transform duration-200 hover:-translate-y-[2px] hover:shadow-2xl"
            >
              Log in / Sign up
            </button>
            <button
              onClick={onClose}
              className="w-full rounded-full border border-primary/20 bg-white/70 px-6 py-3 text-sm font-semibold text-primary transition-colors duration-200 hover:border-primary hover:text-primary dark:border-accent/30 dark:bg-gray-900/70 dark:text-accent"
            >
              Maybe later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
