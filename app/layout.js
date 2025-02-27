'use client';

import { Inter } from 'next/font/google';
import './globals.css';
import { Suspense } from 'react';
import Loading from './loading';
import ErrorBoundary from './components/ErrorBoundary';
import { AuthProvider } from "@/lib/AuthContext";

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: "Macro Tracker",
  description: "Track your daily macro nutrients",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ErrorBoundary>
          <Suspense fallback={<Loading />}>
            <AuthProvider>{children}</AuthProvider>
          </Suspense>
        </ErrorBoundary>
      </body>
    </html>
  );
}
