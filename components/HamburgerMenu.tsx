
import React, { useState, useRef, useEffect } from 'react';
import { View } from '../types';
import { Bars3Icon } from './icons/Bars3Icon';
import { XMarkIcon } from './icons/XMarkIcon';
import { HomeIcon } from './icons/HomeIcon';
import { ClockIcon } from './icons/ClockIcon';
import { UserCircleIcon } from './icons/UserCircleIcon';
import { Cog6ToothIcon } from './icons/Cog6ToothIcon';
import { ArrowLeftOnRectangleIcon } from './icons/ArrowLeftOnRectangleIcon';
import { BellAlertIcon } from './icons/BellAlertIcon';

interface HamburgerMenuProps {
    onNavigate: (view: View) => void;
    isLoggedIn: boolean;
    onLogout: () => void | Promise<void>;
    communityPendingCount: number;
}

export const HamburgerMenu: React.FC<HamburgerMenuProps> = ({ onNavigate, isLoggedIn, onLogout, communityPendingCount }) => {
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
    };

    const menuItems = [
        { label: 'Home', view: View.DASHBOARD, icon: <HomeIcon className="mr-3 h-6 w-6" /> },
        { label: 'Community feed', view: View.COMMUNITY, icon: <BellAlertIcon className="mr-3 h-6 w-6" />, badge: communityPendingCount > 0 ? Math.min(communityPendingCount, 99) : undefined },
        { label: 'History', view: View.HISTORY, icon: <ClockIcon className="mr-3 h-6 w-6" /> },
        { label: 'Profile', view: View.PROFILE, icon: <UserCircleIcon className="mr-3 h-6 w-6" /> },
        { label: 'Settings', view: View.SETTINGS, icon: <Cog6ToothIcon className="mr-3 h-6 w-6" /> },
    ];

    return (
        <div ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="rounded-md border border-white/10 bg-white/5 p-2 text-white transition hover:border-white/30 hover:text-primary"
                aria-label="Open main menu"
                aria-expanded={isOpen}
            >
                <Bars3Icon className="h-6 w-6" />
            </button>

            <div
                className={`fixed inset-0 z-40 bg-black/70 backdrop-blur transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
                onClick={() => setIsOpen(false)}
                aria-hidden="true"
            ></div>

            <div
                className={`fixed top-0 left-0 z-50 flex h-full w-80 transform flex-col border-r border-white/10 bg-[#050505] text-white shadow-2xl shadow-black/60 transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
            >
                <div className="flex items-center justify-between px-5 py-4">
                    <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-white/50">Navigation</h2>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="rounded-md border border-white/10 bg-white/5 p-2 text-white/60 transition hover:border-white/30 hover:text-white"
                        aria-label="Close menu"
                    >
                        <XMarkIcon className="h-5 w-5" />
                    </button>
                </div>
                <nav className="flex grow flex-col justify-between px-4 pb-6">
                    <ul className="space-y-1">
                        {menuItems.map(item => (
                            <li key={item.label}>
                                <button
                                    onClick={() => handleNavigation(item.view)}
                                    className="group flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium text-white/70 transition duration-150 hover:bg-white/5 hover:text-white"
                                >
                                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/5 text-white transition duration-150 group-hover:bg-primary group-hover:text-black">
                                        {item.icon}
                                    </span>
                                    <span className="flex-1 text-left">{item.label}</span>
                                    {item.badge !== undefined ? (
                                        <span className="inline-flex min-h-[1.5rem] min-w-[1.5rem] items-center justify-center rounded-full bg-primary px-2 text-xs font-bold text-black">
                                            {item.badge}
                                        </span>
                                    ) : null}
                                </button>
                            </li>
                        ))}
                    </ul>
                    {isLoggedIn && (
                        <ul className="mt-6 space-y-1 border-t border-white/10 pt-4">
                            <li>
                                <button
                                    onClick={handleLogoutClick}
                                    className="group flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium text-danger transition duration-150 hover:bg-danger/10"
                                >
                                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-danger/10 text-danger transition duration-150 group-hover:bg-danger group-hover:text-black">
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
