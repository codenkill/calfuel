"use client";

import { AuthProvider } from '../../lib/context/AuthContext';
import { DataProvider } from '../../lib/context/DataContext';
import ClientLayout from './ClientLayout';

export default function Providers({ children }) {
  return (
    <AuthProvider>
      <DataProvider>
        <ClientLayout>{children}</ClientLayout>
      </DataProvider>
    </AuthProvider>
  );
} 