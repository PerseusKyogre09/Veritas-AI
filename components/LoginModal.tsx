import React from 'react';

interface LoginModalProps {
  onClose: () => void;
  onLogin: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onClose, onLogin }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 max-w-sm w-full text-center">
        <h3 className="text-xl font-bold text-primary dark:text-accent mb-2">Access Your Profile</h3>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Log in or sign up to save your analysis history and view your personal profile.
        </p>
        <div className="space-y-3">
          <button
            onClick={onLogin}
            className="w-full bg-accent text-white font-bold py-2 px-4 rounded-lg hover:bg-primary transition-colors duration-300"
          >
            Log In / Sign Up
          </button>
          <button
            onClick={onClose}
            className="w-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold py-2 px-4 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-300"
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
};
