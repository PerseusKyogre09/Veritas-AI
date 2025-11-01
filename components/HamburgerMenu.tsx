
import React, { useState, useRef, useEffect } from 'react';
import { View } from '../types';
import { Bars3Icon } from './icons/Bars3Icon';
import { XMarkIcon } from './icons/XMarkIcon';
import { HomeIcon } from './icons/HomeIcon';
import { ClockIcon } from './icons/ClockIcon';
import { UserCircleIcon } from './icons/UserCircleIcon';
import { Cog6ToothIcon } from './icons/Cog6ToothIcon';
import { ArrowLeftOnRectangleIcon } from './icons/ArrowLeftOnRectangleIcon';

interface HamburgerMenuProps {
  onNavigate: (view: View) => void;
  isLoggedIn: boolean;
    onLogout: () => void | Promise<void>;
}

export const HamburgerMenu: React.FC<HamburgerMenuProps> = ({ onNavigate, isLoggedIn, onLogout }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
          if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
            setIsOpen(false);
          }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleNavigation = (view: View) => {
        onNavigate(view);
        setIsOpen(false);
    };

    const handleLogoutClick = async () => {
        try {
            await onLogout();
        } finally {
            setIsOpen(false);
        }
    }
    
    const menuItems = [
        { label: 'Home', view: View.DASHBOARD, icon: <HomeIcon className="h-6 w-6 mr-3" /> },
        { label: 'History', view: View.HISTORY, icon: <ClockIcon className="h-6 w-6 mr-3" /> },
        { label: 'Profile', view: View.PROFILE, icon: <UserCircleIcon className="h-6 w-6 mr-3" /> },
        { label: 'Settings', view: View.SETTINGS, icon: <Cog6ToothIcon className="h-6 w-6 mr-3" /> },
    ];

    return (
        <div ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="rounded-full bg-white/70 p-2 text-primary shadow-sm shadow-primary/10 transition duration-150 hover:bg-white/90 hover:text-primary dark:bg-gray-900/70 dark:text-accent dark:hover:bg-gray-900"
                aria-label="Open main menu"
                aria-expanded={isOpen}
            >
                <Bars3Icon className="h-6 w-6" />
            </button>

            {/* Overlay */}
            <div className={`fixed inset-0 z-40 bg-gray-900/70 backdrop-blur transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsOpen(false)} aria-hidden="true"></div>
            
            {/* Menu Panel */}
            <div className={`fixed top-0 left-0 z-50 flex h-full w-80 transform flex-col border-r border-white/20 bg-white/70 text-dark shadow-2xl shadow-primary/20 backdrop-blur-lg transition-transform duration-300 ease-in-out dark:border-gray-800/50 dark:bg-gray-900/80 dark:text-gray-100 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="flex items-center justify-between px-5 py-4">
                    <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-primary dark:text-accent">Navigation</h2>
                    <button onClick={() => setIsOpen(false)} className="rounded-full bg-white/60 p-2 text-gray-500 transition duration-150 hover:text-primary dark:bg-gray-900/70 dark:text-gray-300 dark:hover:text-accent" aria-label="Close menu">
                       <XMarkIcon className="h-5 w-5" />
                    </button>
                </div>
                <nav className="flex grow flex-col justify-between px-4 pb-6">
                    <ul className="space-y-1">
                        {menuItems.map(item => (
                            <li key={item.label}>
                                <button
                                    onClick={() => handleNavigation(item.view)}
                                    className="group flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium text-gray-700 transition duration-150 hover:bg-white/80 hover:text-primary dark:text-gray-200 dark:hover:bg-gray-800/80 dark:hover:text-accent"
                                >
                                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary transition duration-150 group-hover:bg-primary group-hover:text-white dark:bg-accent/10 dark:text-accent dark:group-hover:bg-accent dark:group-hover:text-gray-900">
                                        {item.icon}
                                    </span>
                                    {item.label}
                                </button>
                            </li>
                        ))}
                    </ul>
                     {isLoggedIn && (
                        <ul className="mt-6 space-y-1 border-t border-white/30 pt-4 dark:border-gray-800/60">
                            <li>
                                 <button
                                    onClick={handleLogoutClick}
                                    className="group flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium text-red-600 transition duration-150 hover:bg-red-50/80 dark:text-red-300 dark:hover:bg-red-900/40"
                                 >
                                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-50 text-red-500 transition duration-150 group-hover:bg-red-500 group-hover:text-white dark:bg-red-900/30 dark:text-red-300 dark:group-hover:bg-red-500">
                                        <ArrowLeftOnRectangleIcon className="h-6 w-6" />
                                    </span>
                                    Log Out
                                 </button>
                            </li>
                        </ul>
                     )}
                </nav>
            </div>
        </div>
    );
};
