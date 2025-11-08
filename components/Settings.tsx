import React, { useEffect, useState } from 'react';
import { Theme, UserProfile } from '../types';
import { ThemeSwitcher } from './ThemeSwitcher';

interface SettingsProps {
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
  user: UserProfile | null;
}

const deriveDisplayName = (profile: UserProfile | null): string => {
  if (!profile) {
    return '';
  }
  if (profile.displayName && profile.displayName.trim().length > 0) {
    return profile.displayName.trim();
  }
  if (profile.email) {
    const [localPart] = profile.email.split('@');
    return localPart ?? profile.email;
  }
  return '';
};

export const Settings: React.FC<SettingsProps> = ({ theme, onThemeChange, user }) => {
  const [name, setName] = useState<string>(() => deriveDisplayName(user));
  const [email, setEmail] = useState<string>(() => user?.email ?? '');

  useEffect(() => {
    setName(deriveDisplayName(user));
    setEmail(user?.email ?? '');
  }, [user?.displayName, user?.email]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real implementation this is where profile updates would be persisted to Firestore.
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8 text-white">
      <div className="space-y-2">
        <h2 className="text-3xl font-semibold tracking-tight">Settings</h2>
        <p className="text-sm text-white/50">Personalize your experience and keep your contact information current.</p>
      </div>

      <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#0C0C0C] p-8 shadow-2xl shadow-black/60 sm:p-10">
        <div className="space-y-10">
          {/* Appearance Settings */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="text-lg font-semibold">Appearance</h3>
                <p className="text-xs text-white/50">Fine-tune the interface theme across devices.</p>
              </div>
              <ThemeSwitcher theme={theme} onThemeChange={onThemeChange} />
            </div>
            <div className="rounded-2xl border border-dashed border-white/20 bg-white/5 px-5 py-4 text-xs text-white/50">
              <strong className="font-semibold text-white">Pro tip:</strong> System theme follows your OS preference, switching automatically as your environment changes.
            </div>
          </section>

          {/* Profile Settings */}
          <section className="space-y-6">
            <div className="space-y-1">
              <h3 className="text-lg font-semibold">Profile information</h3>
              <p className="text-xs text-white/50">Update details used for alerts, collaboration, and saved history.</p>
            </div>
            <form className="grid gap-6 md:grid-cols-2" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label htmlFor="name" className="text-xs font-semibold uppercase tracking-[0.3em] text-white/50">Name</label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-[#111111] px-4 py-3 text-sm text-white/80 shadow-inner shadow-black/40 focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="email" className="text-xs font-semibold uppercase tracking-[0.3em] text-white/50">Email Address</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-[#111111] px-4 py-3 text-sm text-white/80 shadow-inner shadow-black/40 focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div className="md:col-span-2">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-xs text-white/50">Data is encrypted at rest and synced across sessions.</span>
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-2.5 text-xs font-semibold uppercase tracking-[0.3em] text-black shadow-lg shadow-primary/40 transition-transform duration-200 hover:-translate-y-[2px] hover:bg-secondary"
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