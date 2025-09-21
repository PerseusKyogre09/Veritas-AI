
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
    <div className="bg-light dark:bg-gray-900 min-h-screen font-sans text-dark dark:text-gray-100 flex flex-col">
      <Header 
        onNavigate={handleNavigation}
        isLoggedIn={isLoggedIn}
        onLogin={handleShowLoginModal}
        onLogout={handleLogout}
        theme={theme}
        onThemeChange={handleThemeChange}
      />
      <main className="flex-grow container mx-auto px-4 py-8">
        {renderContent()}
      </main>
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-4 text-center text-gray-500 dark:text-gray-400 text-sm">
        <p>&copy; {new Date().getFullYear()} Veritas AI. Fostering a more informed digital citizenry.</p>
      </footer>
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
