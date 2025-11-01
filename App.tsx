
import React, { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { Analyzer } from './components/Analyzer';
import { History } from './components/History';
import { Profile } from './components/Profile';
import { Settings } from './components/Settings';
import { LoginModal } from './components/LoginModal';
import { CommunityFeed } from './components/CommunityFeed';
import { AnalysisHistoryItem, View, Theme, CommunityVoteItem, VoteDirection } from './types';

const COMMUNITY_FEED_STORAGE_KEY = 'veritas-community-feed';

const DEFAULT_COMMUNITY_FEED: CommunityVoteItem[] = [
  {
    id: 'sample-001',
    headline: 'Community check: Viral coastal evacuation rumor',
    summary:
      'Regional emergency managers denied the claim that the governor ordered an overnight coastal evacuation. Community monitors traced the originating post to a satire page.',
    timestamp: '2025-10-18T14:45:00.000Z',
    credibilityScore: 58,
    aiVerdict: 'Possibly AI-assisted',
    supportCount: 14,
    disputeCount: 5,
    userVote: null,
  },
  {
    id: 'sample-002',
    headline: 'Fact-check: Celebrity endorses miracle supplement',
    summary:
      'Digital forensics flagged the video endorsement as a deepfake stitched from a previous interview. No reputable outlet corroborated the celebrity partnership or the supplement claims.',
    timestamp: '2025-10-16T18:20:00.000Z',
    credibilityScore: 32,
    aiVerdict: 'Likely AI-generated',
    supportCount: 21,
    disputeCount: 3,
    userVote: null,
  },
  {
    id: 'sample-003',
    headline: 'Local alert: Citywide water shutoff warning',
    summary:
      'City utilities confirmed scheduled maintenance will impact two downtown blocks for four hours. Posts predicting a citywide, day-long outage were inaccurate and removed by moderators.',
    timestamp: '2025-10-11T09:10:00.000Z',
    credibilityScore: 74,
    aiVerdict: 'Likely human-authored',
    supportCount: 9,
    disputeCount: 2,
    userVote: null,
  },
];

const allowedVerdicts: Array<CommunityVoteItem['aiVerdict']> = [
  'Likely AI-generated',
  'Possibly AI-assisted',
  'Likely human-authored',
];

const sanitizeVoteDirection = (value: unknown): VoteDirection | null => {
  if (value === 'up' || value === 'down') {
    return value;
  }
  return null;
};

const truncateSummary = (value: string, limit = 260): string => {
  const safeValue = value?.trim?.() ?? '';
  if (safeValue.length === 0) {
    return 'No community summary available yet.';
  }
  if (safeValue.length <= limit) {
    return safeValue;
  }
  return `${safeValue.slice(0, limit - 3)}...`;
};

const sanitizeCommunityFeed = (raw: unknown): CommunityVoteItem[] => {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw.reduce<CommunityVoteItem[]>((acc, entry) => {
    if (!entry || typeof entry !== 'object') {
      return acc;
    }

    const id = typeof (entry as { id?: unknown }).id === 'string' ? (entry as { id: string }).id : null;
    if (!id) {
      return acc;
    }

    const headline = typeof (entry as { headline?: unknown }).headline === 'string'
      ? (entry as { headline: string }).headline
      : 'Community submission';

    const summaryRaw = typeof (entry as { summary?: unknown }).summary === 'string'
      ? (entry as { summary: string }).summary
      : '';

    const timestamp = typeof (entry as { timestamp?: unknown }).timestamp === 'string'
      ? (entry as { timestamp: string }).timestamp
      : new Date().toISOString();

    const credibilityScoreRaw = Number((entry as { credibilityScore?: unknown }).credibilityScore);
    const credibilityScore = Number.isFinite(credibilityScoreRaw)
      ? Math.max(0, Math.min(100, Math.round(credibilityScoreRaw)))
      : 0;

    const aiVerdictRaw = (entry as { aiVerdict?: unknown }).aiVerdict;
    const aiVerdict = typeof aiVerdictRaw === 'string' && allowedVerdicts.includes(aiVerdictRaw as CommunityVoteItem['aiVerdict'])
      ? (aiVerdictRaw as CommunityVoteItem['aiVerdict'])
      : undefined;

    const supportRaw = Number((entry as { supportCount?: unknown }).supportCount);
    const disputeRaw = Number((entry as { disputeCount?: unknown }).disputeCount);
    const supportCount = Number.isFinite(supportRaw) ? Math.max(0, Math.round(supportRaw)) : 0;
    const disputeCount = Number.isFinite(disputeRaw) ? Math.max(0, Math.round(disputeRaw)) : 0;

    const userVote = sanitizeVoteDirection((entry as { userVote?: unknown }).userVote);

    acc.push({
      id,
      headline,
      summary: truncateSummary(summaryRaw),
      timestamp,
      credibilityScore,
      aiVerdict,
      supportCount,
      disputeCount,
      userVote,
    });

    return acc;
  }, []);
};

const cloneDefaultCommunityFeed = (): CommunityVoteItem[] =>
  DEFAULT_COMMUNITY_FEED.map((item) => ({ ...item }));

const loadInitialCommunityFeed = (): CommunityVoteItem[] => {
  if (typeof window === 'undefined') {
    return cloneDefaultCommunityFeed();
  }

  try {
    const stored = window.localStorage.getItem(COMMUNITY_FEED_STORAGE_KEY);
    if (!stored) {
      return cloneDefaultCommunityFeed();
    }

    const parsed = JSON.parse(stored);
    const sanitized = sanitizeCommunityFeed(parsed);
    return sanitized.length > 0 ? sanitized : cloneDefaultCommunityFeed();
  } catch (error) {
    console.warn('Failed to load community feed from storage:', error);
    return cloneDefaultCommunityFeed();
  }
};

const createCommunityEntryFromAnalysis = (item: AnalysisHistoryItem): CommunityVoteItem => ({
  id: item.id,
  headline: item.query || 'Untitled submission',
  summary: truncateSummary(item.result.summary ?? ''),
  timestamp: item.timestamp,
  credibilityScore: Math.max(0, Math.min(100, Math.round(item.result.credibilityScore))),
  aiVerdict: item.result.aiGeneration?.verdict,
  supportCount: 0,
  disputeCount: 0,
  userVote: null,
});

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.DASHBOARD);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [analysisHistory, setAnalysisHistory] = useState<AnalysisHistoryItem[]>([]);
  const [communityFeed, setCommunityFeed] = useState<CommunityVoteItem[]>(() => loadInitialCommunityFeed());
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [intendedView, setIntendedView] = useState<View | null>(null); // State for post-login navigation
  const [theme, setTheme] = useState<Theme>(() => {
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme && Object.values(Theme).includes(storedTheme as Theme)) {
      return storedTheme as Theme;
    }
    return Theme.SYSTEM;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const applyTheme = () => {
        if (theme === Theme.LIGHT) {
            document.documentElement.classList.remove('dark');
        } else if (theme === Theme.DARK) {
            document.documentElement.classList.add('dark');
        } else { // System
            if (mediaQuery.matches) {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        }
    };

    applyTheme();
    
    const mediaQueryListener = () => applyTheme();
    mediaQuery.addEventListener('change', mediaQueryListener);
    return () => mediaQuery.removeEventListener('change', mediaQueryListener);
  }, [theme]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      window.localStorage.setItem(COMMUNITY_FEED_STORAGE_KEY, JSON.stringify(communityFeed));
    } catch (error) {
      console.warn('Unable to persist community feed state:', error);
    }
  }, [communityFeed]);

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const handleNavigation = (view: View) => {
    const protectedViews = [View.PROFILE, View.HISTORY, View.SETTINGS];
    if (protectedViews.includes(view) && !isLoggedIn) {
      setIntendedView(view);
      setShowLoginModal(true);
      return;
    }
    setCurrentView(view);
  };

  const addAnalysisToHistory = useCallback((item: AnalysisHistoryItem) => {
    setAnalysisHistory(prev => [item, ...prev]);
    setCommunityFeed(prev => {
      if (prev.some(entry => entry.id === item.id)) {
        return prev;
      }

      const next = [createCommunityEntryFromAnalysis(item), ...prev];
      return next.slice(0, 50);
    });
  }, []);

  const handleCommunityVote = useCallback((entryId: string, direction: VoteDirection) => {
    if (!isLoggedIn) {
      setIntendedView(View.COMMUNITY);
      setShowLoginModal(true);
      return;
    }

    setCommunityFeed(prev =>
      prev.map(entry => {
        if (entry.id !== entryId) {
          return entry;
        }

        let supportCount = entry.supportCount;
        let disputeCount = entry.disputeCount;
        const currentVote = entry.userVote;

        if (currentVote === direction) {
          if (direction === 'up') {
            supportCount = Math.max(0, supportCount - 1);
          } else {
            disputeCount = Math.max(0, disputeCount - 1);
          }

          return { ...entry, supportCount, disputeCount, userVote: null };
        }

        if (direction === 'up') {
          supportCount += 1;
          if (currentVote === 'down') {
            disputeCount = Math.max(0, disputeCount - 1);
          }

          return { ...entry, supportCount, disputeCount, userVote: 'up' };
        }

        disputeCount += 1;
        if (currentVote === 'up') {
          supportCount = Math.max(0, supportCount - 1);
        }

        return { ...entry, supportCount, disputeCount, userVote: 'down' };
      })
    );
  }, [isLoggedIn, setIntendedView, setShowLoginModal]);

  const handleLogin = () => {
    setIsLoggedIn(true);
    setShowLoginModal(false);
    // After login, navigate to the last intended view, or the dashboard as a default.
    setCurrentView(intendedView || View.DASHBOARD);
    setIntendedView(null);
  };
  
  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentView(View.DASHBOARD);
    setIntendedView(null);
  };

  const handleShowLoginModal = (targetView: View | null = null) => {
    setIntendedView(targetView);
    setShowLoginModal(true);
  };

  const handleCloseLoginModal = () => {
      setShowLoginModal(false);
      setIntendedView(null);
  }

  const communityPendingCount = isLoggedIn
    ? communityFeed.filter(entry => entry.userVote === null).length
    : 0;


  const renderContent = () => {
    switch (currentView) {
      case View.ANALYZER:
        return (
          <Analyzer 
            onAnalysisComplete={addAnalysisToHistory}
          />
        );
      case View.COMMUNITY:
        return (
          <CommunityFeed
            items={communityFeed}
            onVote={handleCommunityVote}
            onNavigate={handleNavigation}
            isLoggedIn={isLoggedIn}
            onRequestLogin={() => handleShowLoginModal(View.COMMUNITY)}
          />
        );
      case View.HISTORY:
        return <History history={analysisHistory} onNavigate={handleNavigation} />;
      case View.PROFILE:
        return <Profile onNavigate={handleNavigation} />;
      case View.SETTINGS:
        return <Settings theme={theme} onThemeChange={handleThemeChange} />;
      case View.DASHBOARD:
      default:
        return <Dashboard onNavigate={() => handleNavigation(View.ANALYZER)} />;
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-light via-white to-slate-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 font-sans text-dark dark:text-gray-100 transition-colors duration-200">
      <div className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-[520px] w-[960px] -translate-y-1/2 rounded-full bg-primary/10 blur-3xl dark:bg-accent/20" />
      <div className="pointer-events-none absolute -left-24 bottom-6 h-72 w-72 rounded-full bg-accent/10 blur-3xl dark:bg-primary/30" />
      <div className="pointer-events-none absolute -right-16 top-1/3 h-64 w-64 rounded-full bg-secondary/10 blur-3xl dark:bg-secondary/20" />

      <div className="relative flex min-h-screen flex-col">
        <Header 
          onNavigate={handleNavigation}
          isLoggedIn={isLoggedIn}
          onLogin={() => handleShowLoginModal()}
          onLogout={handleLogout}
          theme={theme}
          onThemeChange={handleThemeChange}
          communityPendingCount={communityPendingCount}
        />
        <main className="flex-grow">
          <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-12 sm:px-6 lg:px-8 lg:pt-16">
            {renderContent()}
          </div>
        </main>
        <footer className="relative border-t border-white/40 bg-white/70 py-6 text-center text-sm text-gray-600 backdrop-blur dark:border-gray-800/80 dark:bg-gray-900/70 dark:text-gray-400">
          <p>&copy; {new Date().getFullYear()} Veritas AI · Fostering a more informed digital citizenry.</p>
        </footer>
      </div>

      {showLoginModal && (
        <LoginModal 
          onClose={handleCloseLoginModal}
          onLogin={handleLogin}
        />
      )}
    </div>
  );
};

export default App;
