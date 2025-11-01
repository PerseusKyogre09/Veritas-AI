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
        className="rounded-full border border-white/40 bg-white/70 p-2 text-primary shadow-sm shadow-primary/10 transition duration-150 hover:bg-white/90 dark:border-gray-700/60 dark:bg-gray-900/70 dark:text-accent"
        aria-label="Toggle theme"
      >
        {currentThemeOption.icon}
      </button>
      {isOpen && (
        <div className="absolute right-0 z-10 mt-3 w-44 overflow-hidden rounded-2xl border border-white/40 bg-white/90 py-2 text-sm shadow-xl shadow-primary/10 backdrop-blur dark:border-gray-800/60 dark:bg-gray-900/90 dark:shadow-black/30">
          {themeOptions.map(option => (
            <button
              key={option.value}
              onClick={() => {
                onThemeChange(option.value);
                setIsOpen(false);
              }}
              className={`flex w-full items-center gap-3 px-4 py-2 transition duration-150 ${
                theme === option.value
                  ? 'text-primary dark:text-accent'
                  : 'text-gray-600 dark:text-gray-300'
              } hover:bg-white/70 hover:text-primary dark:hover:bg-gray-800/80 dark:hover:text-accent`}
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
