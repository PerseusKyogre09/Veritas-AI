
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
  onLogout: () => void;
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

    const handleLogoutClick = () => {
        onLogout();
        setIsOpen(false);
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
                className="p-2 rounded-md text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-accent"
                aria-label="Open main menu"
                aria-expanded={isOpen}
            >
                <Bars3Icon className="h-6 w-6" />
            </button>

            {/* Overlay */}
            <div className={`fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsOpen(false)} aria-hidden="true"></div>
            
            {/* Menu Panel */}
            <div className={`fixed top-0 left-0 h-full w-72 bg-white dark:bg-gray-800 shadow-xl z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} flex flex-col`}>
                <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                    <h2 className="font-bold text-lg text-primary dark:text-accent">Menu</h2>
                    <button onClick={() => setIsOpen(false)} className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700" aria-label="Close menu">
                       <XMarkIcon className="h-6 w-6 text-gray-500 dark:text-gray-300" />
                    </button>
                </div>
                <nav className="flex-grow flex flex-col justify-between p-4">
                    <ul>
                        {menuItems.map(item => (
                            <li key={item.label}>
                                <button
                                    onClick={() => handleNavigation(item.view)}
                                    className="w-full flex items-center p-3 rounded-md text-left text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                >
                                    {item.icon}
                                    {item.label}
                                </button>
                            </li>
                        ))}
                    </ul>
                     {isLoggedIn && (
                        <ul className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                            <li>
                                 <button
                                    onClick={handleLogoutClick}
                                    className="w-full flex items-center p-3 rounded-md text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                 >
                                    <ArrowLeftOnRectangleIcon className="h-6 w-6 mr-3" />
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
