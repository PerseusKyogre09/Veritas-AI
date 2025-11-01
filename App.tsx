
import React, { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { Analyzer } from './components/Analyzer';
import { History } from './components/History';
import { Profile } from './components/Profile';
import { Settings } from './components/Settings';
import { LoginModal } from './components/LoginModal';
import { AnalysisHistoryItem, View, Theme } from './types';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.DASHBOARD);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [analysisHistory, setAnalysisHistory] = useState<AnalysisHistoryItem[]>([]);
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

  const handleShowLoginModal = () => {
      setIntendedView(null); // Clear any previously intended view
      setShowLoginModal(true);
  }

  const handleCloseLoginModal = () => {
      setShowLoginModal(false);
      setIntendedView(null);
  }


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
        />
      )}
    </div>
  );
};

export default App;
