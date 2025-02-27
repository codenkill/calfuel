'use client';

import Loading from '../loading';
import { Suspense } from 'react';
import { AuthProvider } from "@/lib/AuthContext";

export default function ClientLayout({ children }) {
  return (
    <Suspense fallback={<Loading />}>
      <AuthProvider>
        {children}
      </AuthProvider>
    </Suspense>
  );
} 