'use client';

import ErrorBoundary from './ErrorBoundary';
import Loading from '../loading';
import { Suspense } from 'react';
import { AuthProvider } from "@/lib/AuthContext";

export default function ClientLayout({ children }) {
  return (
    <ErrorBoundary>
      <Suspense fallback={<Loading />}>
        <AuthProvider>{children}</AuthProvider>
      </Suspense>
    </ErrorBoundary>
  );
} 