import React, { useState, useRef, useEffect } from 'react';
import { Theme } from '../types';
import { SunIcon } from './icons/SunIcon';
import { MoonIcon } from './icons/MoonIcon';
import { ComputerDesktopIcon } from './icons/ComputerDesktopIcon';

interface ThemeSwitcherProps {
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
}

const themeOptions = [
  { value: Theme.LIGHT, label: 'Light', icon: <SunIcon className="h-5 w-5" /> },
  { value: Theme.DARK, label: 'Dark', icon: <MoonIcon className="h-5 w-5" /> },
  { value: Theme.SYSTEM, label: 'System', icon: <ComputerDesktopIcon className="h-5 w-5" /> },
];

export const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ theme, onThemeChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentThemeOption = themeOptions.find(opt => opt.value === theme) || themeOptions[2];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-light dark:focus:ring-offset-gray-800 focus:ring-accent"
        aria-label="Toggle theme"
      >
        {currentThemeOption.icon}
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 py-1 z-10">
          {themeOptions.map(option => (
            <button
              key={option.value}
              onClick={() => {
                onThemeChange(option.value);
                setIsOpen(false);
              }}
              className={`w-full text-left flex items-center px-4 py-2 text-sm ${
                theme === option.value
                  ? 'bg-gray-100 dark:bg-gray-700 text-dark dark:text-light'
                  : 'text-gray-700 dark:text-gray-300'
              } hover:bg-gray-100 dark:hover:bg-gray-700`}
            >
              <span className="mr-3">{option.icon}</span>
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
