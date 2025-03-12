"use client";

import { useAuth } from '../../lib/context/AuthContext';
import { useData } from '../../lib/context/DataContext';
import { useState } from 'react';
import Modal from '../../app/components/Modal';

// Loading skeleton component
function LoadingSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
      </div>
    </div>
  );
}

// Error banner component
function ErrorBanner({ message, isOffline }) {
  return (
    <div className={`mb-6 px-4 py-3 rounded-lg ${
      isOffline ? 'bg-yellow-50 border border-yellow-200 text-yellow-600' : 'bg-red-50 border border-red-200 text-red-600'
    }`}>
      {message}
    </div>
  );
}

// Daily Progress component
function DailyProgress({ progress, onEditTarget }) {
  return (
    <div className="bg-white rounded-lg shadow p-6 mb-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-medium text-gray-900">Daily Progress</h2>
        <button
          onClick={onEditTarget}
          className="text-sm text-green-500 hover:text-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
        >
          Edit Targets
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-medium text-gray-500">Calories</h3>
          <div className="mt-1">
            <span className="text-2xl font-semibold">{progress.calories.current}</span>
            <span className="text-gray-500"> / {progress.calories.target}</span>
          </div>
          <div className="mt-2 h-2 bg-gray-200 rounded-full">
            <div
              className="h-2 bg-green-500 rounded-full"
              style={{ width: `${Math.min(100, (progress.calories.current / progress.calories.target) * 100)}%` }}
            ></div>
          </div>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-medium text-gray-500">Protein</h3>
          <div className="mt-1">
            <span className="text-2xl font-semibold">{progress.protein.current}g</span>
            <span className="text-gray-500"> / {progress.protein.target}g</span>
          </div>
          <div className="mt-2 h-2 bg-gray-200 rounded-full">
            <div
              className="h-2 bg-green-500 rounded-full"
              style={{ width: `${Math.min(100, (progress.protein.current / progress.protein.target) * 100)}%` }}
            ></div>
          </div>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-medium text-gray-500">Carbs</h3>
          <div className="mt-1">
            <span className="text-2xl font-semibold">{progress.carbs.current}g</span>
            <span className="text-gray-500"> / {progress.carbs.target}g</span>
          </div>
          <div className="mt-2 h-2 bg-gray-200 rounded-full">
            <div
              className="h-2 bg-green-500 rounded-full"
              style={{ width: `${Math.min(100, (progress.carbs.current / progress.carbs.target) * 100)}%` }}
            ></div>
          </div>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-medium text-gray-500">Fat</h3>
          <div className="mt-1">
            <span className="text-2xl font-semibold">{progress.fat.current}g</span>
            <span className="text-gray-500"> / {progress.fat.target}g</span>
          </div>
          <div className="mt-2 h-2 bg-gray-200 rounded-full">
            <div
              className="h-2 bg-green-500 rounded-full"
              style={{ width: `${Math.min(100, (progress.fat.current / progress.fat.target) * 100)}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Today's Meals component
function TodaysMeals({ meals }) {
  if (meals.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-6">Today's Meals</h2>
        <p className="text-gray-500 text-center py-8">No meals logged today</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-6">Today's Meals</h2>
      <div className="space-y-4">
        {meals.map((meal, index) => (
          <div
            key={index}
            className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow duration-200"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium text-gray-900">{meal.name}</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {new Date(meal.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              <div className="text-right">
                <p className="font-medium text-gray-900">{meal.totalCalories} kcal</p>
                <p className="text-sm text-gray-500 mt-1">
                  P: {meal.totalProtein}g • C: {meal.totalCarbs}g • F: {meal.totalFat}g
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { userData, todaysMeals, loading, error, isOffline, updateTargets } = useData();
  const [isEditingTargets, setIsEditingTargets] = useState(false);
  const [newTargets, setNewTargets] = useState({
    calories: 2000,
    protein: 140,
    carbs: 250,
    fat: 70
  });

  // Calculate daily progress
  const dailyProgress = {
    calories: {
      current: todaysMeals.reduce((sum, meal) => sum + (meal.totalCalories || 0), 0),
      target: userData?.targets?.calories || 2000
    },
    protein: {
      current: todaysMeals.reduce((sum, meal) => sum + (meal.totalProtein || 0), 0),
      target: userData?.targets?.protein || 140
    },
    carbs: {
      current: todaysMeals.reduce((sum, meal) => sum + (meal.totalCarbs || 0), 0),
      target: userData?.targets?.carbs || 250
    },
    fat: {
      current: todaysMeals.reduce((sum, meal) => sum + (meal.totalFat || 0), 0),
      target: userData?.targets?.fat || 70
    }
  };

  const handleEditTargets = () => {
    setNewTargets(userData?.targets || {
      calories: 2000,
      protein: 140,
      carbs: 250,
      fat: 70
    });
    setIsEditingTargets(true);
  };

  const handleSaveTargets = async () => {
    await updateTargets(newTargets);
    setIsEditingTargets(false);
  };

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

        {loading ? (
          <LoadingSkeleton />
        ) : (
          <>
            <DailyProgress
              progress={dailyProgress}
              onEditTarget={handleEditTargets}
            />
            <TodaysMeals meals={todaysMeals} />
          </>
        )}

        <Modal
          isOpen={isEditingTargets}
          onClose={() => setIsEditingTargets(false)}
          title="Edit Daily Targets"
        >
          <div className="space-y-6">
            <p className="text-sm text-gray-500">
              Set your daily macro and calorie targets.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Daily Calories
                </label>
                <input
                  type="number"
                  value={newTargets.calories}
                  onChange={(e) =>
                    setNewTargets((prev) => ({
                      ...prev,
                      calories: Number(e.target.value)
                    }))
                  }
                  className="mt-1 block w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Protein (g)
                  </label>
                  <input
                    type="number"
                    value={newTargets.protein}
                    onChange={(e) =>
                      setNewTargets((prev) => ({
                        ...prev,
                        protein: Number(e.target.value)
                      }))
                    }
                    className="mt-1 block w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Carbs (g)
                  </label>
                  <input
                    type="number"
                    value={newTargets.carbs}
                    onChange={(e) =>
                      setNewTargets((prev) => ({
                        ...prev,
                        carbs: Number(e.target.value)
                      }))
                    }
                    className="mt-1 block w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Fat (g)
                  </label>
                  <input
                    type="number"
                    value={newTargets.fat}
                    onChange={(e) =>
                      setNewTargets((prev) => ({
                        ...prev,
                        fat: Number(e.target.value)
                      }))
                    }
                    className="mt-1 block w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setIsEditingTargets(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTargets}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              >
                Save Changes
              </button>
            </div>
          </div>
        </Modal>
      </main>
    </div>
  );
}