import React from 'react';
import { ShieldCheckIcon } from './icons/ShieldCheckIcon';

interface LoginModalProps {
  onClose: () => void;
  onLogin: () => void | Promise<void>;
  isLoading?: boolean;
  error?: string | null;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onClose, onLogin, isLoading = false, error = null }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6 backdrop-blur">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-[#0C0C0C] p-8 text-center text-white shadow-2xl shadow-black/60">
        <div className="pointer-events-none absolute -top-24 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 right-1/3 h-48 w-48 rounded-full bg-secondary/20 blur-3xl" />
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full border border-white/10 bg-white/5 p-2 text-white/60 transition-colors duration-150 hover:border-white/30 hover:text-white"
          aria-label="Close login modal"
        >
          &times;
        </button>
        <div className="relative space-y-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary via-secondary to-accent text-black shadow-lg shadow-primary/40">
            <ShieldCheckIcon className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-semibold tracking-tight">Access your profile</h3>
            <p className="text-sm leading-relaxed text-white/60">
              Save reports, sync history across devices, and unlock personalized literacy insights.
            </p>
          </div>
          {error && (
            <div className="rounded-2xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger shadow-sm">
              {error}
            </div>
          )}
          <div className="space-y-3">
            <button
              onClick={() => { void onLogin(); }}
              disabled={isLoading}
              className="w-full rounded-full bg-primary px-6 py-3 text-sm font-semibold text-black shadow-lg shadow-primary/40 transition-transform duration-200 hover:-translate-y-[2px] hover:bg-secondary disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/40"
              aria-busy={isLoading}
            >
              {isLoading ? 'Connecting…' : 'Log in / Sign up'}
            </button>
            <button
              onClick={onClose}
              disabled={isLoading}
              className="w-full rounded-full border border-white/20 bg-white/5 px-6 py-3 text-sm font-semibold text-white/70 transition-colors duration-200 hover:border-white/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              Maybe later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
