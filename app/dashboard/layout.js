"use client";

import { useAuth } from '../../lib/context/AuthContext';
import ProtectedRoute from '../../components/ProtectedRoute';
import Navbar from '../../app/components/Navbar';

export default function DashboardLayout({ children }) {
  const { user } = useAuth();

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="py-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
} 