
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { Analyzer } from './components/Analyzer';
import { History } from './components/History';
import { Profile } from './components/Profile';
import { Settings } from './components/Settings';
import { LoginModal } from './components/LoginModal';
import { CommunityFeed } from './components/CommunityFeed';
import { LandingPage } from './components/LandingPage';
import { AnalysisHistoryItem, View, Theme, UserProfile, CommunityVoteItem, VoteDirection } from './types';
import { isFirebaseConfigured, listenToUserProfileChanges, signInWithGoogle, signOutUser } from './services/firebaseClient';
import { recordCommunityVote, streamCommunityFeed, upsertCommunityEntry } from './services/communityService';

const COMMUNITY_USER_STORAGE_KEY = 'veritas-community-user';

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

const describeCommunityError = (error: Error): string => {
  const message = error.message || 'Community feed is currently unavailable.';
  if (message.toLowerCase().includes('missing or insufficient permissions')) {
    return 'Community feed is unavailable because Firebase denied access. Confirm that you are signed in and that your Firestore security rules allow reads from the communityFeed collection for this account.';
  }
  return message;
};

const createCommunityEntryFromAnalysis = (item: AnalysisHistoryItem): CommunityVoteItem => ({
  id: item.id,
  headline: item.query || 'Untitled submission',
  summary: truncateSummary(item.result.summary ?? ''),
  timestamp: item.timestamp,
  credibilityScore: Math.max(0, Math.min(100, Math.round(item.result.credibilityScore))),
  aiVerdict: item.result.aiGeneration?.verdict,
  aiDetection: item.result.aiGeneration ?? null,
  supportCount: 0,
  disputeCount: 0,
  userVote: null,
});

const ensureCommunityUserId = (): string => {
  if (typeof window === 'undefined') {
    return 'preview-user';
  }

  const existing = window.localStorage.getItem(COMMUNITY_USER_STORAGE_KEY);
  if (existing) {
    return existing;
  }

  const generated = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `user-${Date.now().toString(36)}-${Math.random().toString(36).slice(-8)}`;

  window.localStorage.setItem(COMMUNITY_USER_STORAGE_KEY, generated);
  return generated;
};

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.LANDING);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [analysisHistory, setAnalysisHistory] = useState<AnalysisHistoryItem[]>([]);
  const [communityFeed, setCommunityFeed] = useState<CommunityVoteItem[]>([]);
  const [communityLoading, setCommunityLoading] = useState<boolean>(true);
  const [communityError, setCommunityError] = useState<string | null>(null);
  const [communityUserId] = useState<string>(() => ensureCommunityUserId());
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [intendedView, setIntendedView] = useState<View | null>(null);
  const [authInitializing, setAuthInitializing] = useState<boolean>(true);
  const [authenticating, setAuthenticating] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [theme, setTheme] = useState<Theme>(() => {
    const storedTheme = typeof window !== 'undefined' ? localStorage.getItem('theme') : null;
    if (storedTheme && Object.values(Theme).includes(storedTheme as Theme)) {
      return storedTheme as Theme;
    }
    return Theme.DARK;
  });

  const isLoggedIn = Boolean(user);
  const firebaseReady = isFirebaseConfigured();

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const applyTheme = () => {
      if (theme === Theme.LIGHT) {
        document.documentElement.classList.remove('dark');
      } else if (theme === Theme.DARK) {
        document.documentElement.classList.add('dark');
      } else {
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
    let isMounted = true;
    const unsubscribe = listenToUserProfileChanges((profile) => {
      if (!isMounted) {
        return;
      }
      setUser(profile);
      setAuthInitializing(false);
      if (!profile) {
        setIntendedView(null);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!isLoggedIn && [View.PROFILE, View.HISTORY, View.SETTINGS].includes(currentView)) {
      setCurrentView(View.DASHBOARD);
    }
  }, [isLoggedIn, currentView]);

  const effectiveCommunityUserId = useMemo(
    () => user?.uid ?? communityUserId,
    [user?.uid, communityUserId],
  );

  useEffect(() => {
    setCommunityLoading(true);
    const unsubscribe = streamCommunityFeed(
      effectiveCommunityUserId,
      (items) => {
        setCommunityFeed(items);
        setCommunityLoading(false);
        setCommunityError(null);
      },
      (error) => {
        setCommunityError(describeCommunityError(error));
        setCommunityLoading(false);
      },
    );

    return () => {
      unsubscribe();
    };
  }, [effectiveCommunityUserId]);

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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const addAnalysisToHistory = useCallback((item: AnalysisHistoryItem) => {
    setAnalysisHistory(prev => [item, ...prev]);
    const entry = createCommunityEntryFromAnalysis(item);
    void upsertCommunityEntry(entry).catch((error) => {
      console.error('Failed to sync community entry:', error);
      setCommunityError('Unable to sync the latest analysis with the community feed.');
    });
  }, []);

  const handleCommunityVote = useCallback((entryId: string, direction: VoteDirection) => {
    if (!isLoggedIn) {
      setIntendedView(View.COMMUNITY);
      setShowLoginModal(true);
      return;
    }

    let voteToPersist: VoteDirection | null = null;

    setCommunityFeed(prev =>
      prev.map(entry => {
        if (entry.id !== entryId) {
          return entry;
        }

        const currentVote = entry.userVote;
        voteToPersist = currentVote === direction ? null : direction;

        let supportCount = entry.supportCount;
        let disputeCount = entry.disputeCount;

        if (currentVote === 'up') {
          supportCount = Math.max(0, supportCount - 1);
        }

        if (currentVote === 'down') {
          disputeCount = Math.max(0, disputeCount - 1);
        }

        if (voteToPersist === 'up') {
          supportCount += 1;
        }

        if (voteToPersist === 'down') {
          disputeCount += 1;
        }

        return { ...entry, supportCount, disputeCount, userVote: voteToPersist };
      })
    );

    void recordCommunityVote(entryId, effectiveCommunityUserId, voteToPersist).catch((error) => {
      console.error('Failed to record community vote:', error);
      setCommunityError(`Unable to record your vote: ${error.message}`);
    });
  }, [effectiveCommunityUserId, isLoggedIn]);

  const resolveAuthErrorMessage = (error: unknown): string => {
    const errorCode = typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code: unknown }).code)
      : null;

    switch (errorCode) {
      case 'auth/popup-closed-by-user':
        return 'The sign-in popup was closed before completing authentication.';
      case 'auth/popup-blocked':
        return 'Your browser blocked the sign-in popup. Please allow popups for this site and try again.';
      case 'auth/cancelled-popup-request':
        return 'Another sign-in request is already in progress.';
      case 'auth/network-request-failed':
        return 'The network connection was interrupted during sign-in. Check your connection and retry.';
      default:
        break;
    }

    if (error instanceof Error && error.message) {
      return error.message;
    }
    return 'We could not complete the sign-in request. Please try again.';
  };

  const handleLogin = async () => {
    if (!firebaseReady) {
      setAuthError('Sign-in is unavailable because Firebase is not configured.');
      return;
    }

    setAuthError(null);
    setAuthenticating(true);
    try {
      await signInWithGoogle();
      setShowLoginModal(false);
        setCurrentView(prev => intendedView ?? prev ?? View.DASHBOARD);
      setIntendedView(null);
    } catch (error) {
      const message = resolveAuthErrorMessage(error);
      setAuthError(message);
    } finally {
      setAuthenticating(false);
    }
  };

  const handleLogout = async () => {
  setAuthError(null);
  setIntendedView(null);
  setCurrentView(View.LANDING);

    if (!firebaseReady) {
      setUser(null);
      return;
    }

    try {
      await signOutUser();
    } catch (error) {
      console.error('Failed to sign the user out of Firebase.', error);
    }
  };

  const handleShowLoginModal = (targetView: View | null = null) => {
    setAuthError(firebaseReady ? null : 'Sign-in is unavailable because Firebase is not configured.');
    setAuthenticating(false);
    setIntendedView(targetView);
    setShowLoginModal(true);
  };

  const handleCloseLoginModal = () => {
    setShowLoginModal(false);
    setIntendedView(null);
    setAuthError(null);
    setAuthenticating(false);
  };

  const communityPendingCount = isLoggedIn
    ? communityFeed.filter(entry => entry.userVote === null).length
    : communityFeed.length;
  const communityBadgeCount = Math.min(communityPendingCount, 99);

  const renderContent = () => {
    switch (currentView) {
      case View.LANDING:
        return (
          <LandingPage
            onStartAnalyzer={() => handleNavigation(View.ANALYZER)}
            onLogin={() => handleShowLoginModal(View.LANDING)}
            isLoggedIn={isLoggedIn}
          />
        );
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
            isLoading={communityLoading}
            errorMessage={communityError}
          />
        );
      case View.HISTORY:
        return <History history={analysisHistory} onNavigate={handleNavigation} />;
      case View.PROFILE:
        return <Profile onNavigate={handleNavigation} user={user} />;
      case View.SETTINGS:
        return <Settings theme={theme} onThemeChange={handleThemeChange} user={user} />;
      case View.DASHBOARD:
      default:
        return <Dashboard onNavigate={() => handleNavigation(View.ANALYZER)} />;
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050505] font-sans text-white">
      <div className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-[520px] w-[960px] -translate-y-1/2 rounded-full bg-primary/20 blur-3xl" />
      <div className="pointer-events-none absolute -left-24 bottom-6 h-72 w-72 rounded-full bg-secondary/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 top-1/3 h-64 w-64 rounded-full bg-accent/20 blur-3xl" />

      <div className="relative flex min-h-screen flex-col">
        <Header
          onNavigate={handleNavigation}
          isLoggedIn={isLoggedIn}
          user={user}
          onLogin={() => handleShowLoginModal()}
          onLogout={handleLogout}
          theme={theme}
          onThemeChange={handleThemeChange}
          communityPendingCount={communityBadgeCount}
        />
        <main className="flex-grow">
          <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-12 sm:px-6 lg:px-8 lg:pt-16">
            {renderContent()}
          </div>
        </main>
        <footer className="border-t border-white/10 bg-black/50 py-6 text-center text-sm text-white/50">
          <p>&copy; {new Date().getFullYear()} Veritas AI · Fostering a more informed digital citizenry.</p>
        </footer>
      </div>

      {showLoginModal && (
        <LoginModal
          onClose={handleCloseLoginModal}
          onLogin={handleLogin}
          isLoading={authenticating || authInitializing}
          error={authError}
        />
      )}
    </div>
  );
};

export default App;
