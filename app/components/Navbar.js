"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../../lib/context/AuthContext';
import { useState } from 'react';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useAuth();
  const [isNavigating, setIsNavigating] = useState(false);

  const handleNavigation = (path) => {
    setIsNavigating(true);
    router.push(path);
  };

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-8">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <span className="text-xl font-semibold text-gray-900">CalFuel</span>
            </Link>
            <button 
              onClick={() => handleNavigation('/dashboard')}
              className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                pathname === '/dashboard' 
                  ? 'bg-[#4ade80] text-white' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              disabled={isNavigating}
            >
              Dashboard
            </button>
            <button 
              onClick={() => handleNavigation('/dashboard/foods')}
              className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                pathname === '/dashboard/foods' 
                  ? 'bg-[#4ade80] text-white' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              disabled={isNavigating}
            >
              Foods
            </button>
            <button 
              onClick={() => handleNavigation('/dashboard/log-meal')}
              className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                pathname === '/dashboard/log-meal' 
                  ? 'bg-[#4ade80] text-white' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              disabled={isNavigating}
            >
              Log Meal
            </button>
          </div>
          <button 
            onClick={signOut}
            className="text-gray-600 hover:text-gray-900"
            disabled={isNavigating}
          >
            Sign out
          </button>
        </div>
      </div>
      {isNavigating && (
        <div className="h-1 bg-[#4ade80] animate-pulse fixed top-0 left-0 right-0"></div>
      )}
    </nav>
  );
} 