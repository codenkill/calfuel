"use client";

import { useAuth } from '../../lib/context/AuthContext';
import { useData } from '../../lib/context/DataContext';
import { Suspense } from 'react';

// Loading skeleton component
function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div className="bg-white rounded-lg shadow p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/4 mb-6"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-2 bg-gray-200 rounded w-full"></div>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-white rounded-lg shadow p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/4 mb-6"></div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Error Banner Component
function ErrorBanner({ message, isOffline }) {
  return (
    <div className={`mb-4 p-4 rounded-lg ${isOffline ? 'bg-yellow-50' : 'bg-red-50'}`}>
      <div className="flex items-center">
        <div className={`flex-shrink-0 ${isOffline ? 'text-yellow-400' : 'text-red-400'}`}>
          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <p className={`text-sm ${isOffline ? 'text-yellow-700' : 'text-red-700'}`}>
            {message}
          </p>
        </div>
      </div>
    </div>
  );
}

// Daily Progress Component
function DailyProgress({ dailyProgress }) {
  return (
    <div className="bg-white rounded-lg shadow p-6 mb-8">
      <h2 className="text-lg font-medium text-gray-900 mb-6">Daily Progress</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Object.entries(dailyProgress).map(([macro, { current, target }]) => (
          <div key={macro} className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700 capitalize">{macro}</span>
              <span className="text-sm text-gray-500">{current} / {target}</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#4ade80] rounded-full transition-all duration-500"
                style={{ width: `${Math.min((current / target) * 100, 100)}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Today's Meals Component
function TodaysMeals({ meals }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-6">Today's Meals</h2>
      <div className="space-y-4">
        {meals.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No meals logged today</p>
        ) : (
          meals.map((meal, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h3 className="font-medium text-gray-900">{meal.name}</h3>
                <p className="text-sm text-gray-500">
                  {new Date(meal.time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                </p>
              </div>
              <span className="text-gray-700">{meal.calories} kcal</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { dailyProgress, todaysMeals, loading, error, isOffline } = useData();

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-gray-600 mb-4">Please sign in to access your dashboard</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {(error || isOffline) && (
          <ErrorBanner message={error} isOffline={isOffline} />
        )}
        <Suspense fallback={<DashboardSkeleton />}>
          {loading ? (
            <DashboardSkeleton />
          ) : (
            <>
              <DailyProgress dailyProgress={dailyProgress} />
              <TodaysMeals meals={todaysMeals} />
            </>
          )}
        </Suspense>
      </main>
    </div>
  );
}