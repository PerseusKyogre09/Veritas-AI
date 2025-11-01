
import React, { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { Analyzer } from './components/Analyzer';
import { History } from './components/History';
import { Profile } from './components/Profile';
import { Settings } from './components/Settings';
import { LoginModal } from './components/LoginModal';
import { AnalysisHistoryItem, View, Theme, UserProfile } from './types';
import { isFirebaseConfigured, listenToUserProfileChanges, signInWithGoogle, signOutUser } from './services/firebaseClient';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.DASHBOARD);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [analysisHistory, setAnalysisHistory] = useState<AnalysisHistoryItem[]>([]);
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [intendedView, setIntendedView] = useState<View | null>(null); // State for post-login navigation
  const [authInitializing, setAuthInitializing] = useState<boolean>(true);
  const [authenticating, setAuthenticating] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [theme, setTheme] = useState<Theme>(() => {
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme && Object.values(Theme).includes(storedTheme as Theme)) {
      return storedTheme as Theme;
    }
    return Theme.SYSTEM;
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
  }, []);

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
      setCurrentView(intendedView || View.DASHBOARD);
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
    setCurrentView(View.DASHBOARD);

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

  const handleShowLoginModal = () => {
    setAuthError(firebaseReady ? null : 'Sign-in is unavailable because Firebase is not configured.');
    setAuthenticating(false);
    setIntendedView(null); // Clear any previously intended view
    setShowLoginModal(true);
  };

  const handleCloseLoginModal = () => {
    setShowLoginModal(false);
    setIntendedView(null);
    setAuthError(null);
    setAuthenticating(false);
  };


  const renderContent = () => {
    switch (currentView) {
      case View.ANALYZER:
        return (
          <Analyzer 
            onAnalysisComplete={addAnalysisToHistory}
          />
        );
      case View.HISTORY:
        return <History history={analysisHistory} onNavigate={handleNavigation} />;
      case View.PROFILE:
        return <Profile onNavigate={handleNavigation} user={user} />;
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
          user={user}
          onLogin={handleShowLoginModal}
          onLogout={handleLogout}
          theme={theme}
          onThemeChange={handleThemeChange}
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
          isLoading={authenticating || authInitializing}
          error={authError}
        />
      )}
    </div>
  );
};

export default App;
