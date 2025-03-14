"use client";

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../../lib/context/AuthContext';
import { useState, useCallback, useMemo, memo } from 'react';
import ButtonPortal from './ButtonPortal';

const NavButton = memo(({ href, label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-lg transition-all duration-200 ${
      isActive
        ? 'bg-[#4ade80] text-white'
        : 'text-gray-600 hover:text-gray-900'
    }`}
  >
    {label}
  </button>
));

NavButton.displayName = 'NavButton';

const Navbar = () => {
  const { signOut } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);

  const handleNavigation = useCallback(async (path) => {
    if (pathname === path || isNavigating) return;
    setIsNavigating(true);
    await router.push(path);
    setIsNavigating(false);
  }, [pathname, router, isNavigating]);

  const handleSignOut = useCallback(async () => {
    if (isNavigating) return;
    setIsNavigating(true);
    await signOut();
    setIsNavigating(false);
  }, [signOut, isNavigating]);

  const navItems = useMemo(() => [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/dashboard/foods', label: 'Foods' },
    { href: '/dashboard/log-meal', label: 'Log Meal' }
  ], []);

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/dashboard" className="flex items-center mr-8">
              <Image
                src="/logo.svg"
                alt="CalFuel Logo"
                width={96}
                height={96}
                className="w-24 h-24 -my-4"
                priority
              />
            </Link>
            <div className="flex space-x-8">
              {navItems.map((item) => (
                <NavButton
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  isActive={pathname === item.href}
                  onClick={() => handleNavigation(item.href)}
                />
              ))}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <ButtonPortal />
            <button
              onClick={handleSignOut}
              disabled={isNavigating}
              className="text-gray-600 hover:text-gray-900"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
      {isNavigating && (
        <div className="h-1 bg-[#4ade80] animate-pulse fixed top-0 left-0 right-0"></div>
      )}
    </nav>
  );
};

export default memo(Navbar); 