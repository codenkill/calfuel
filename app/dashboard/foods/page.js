"use client";

import { useAuth } from '../../../lib/context/AuthContext';
import { useState } from 'react';

// Loading skeleton component
function FoodSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow p-6 animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
        <div>
          <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-full"></div>
        </div>
      </div>
    </div>
  );
}

export default function FoodsPage() {
  const { user } = useAuth();

  // Sample food data - replace with real data from Firebase later
  const foods = [
    {
      name: 'Greek Yogurt',
      description: 'Single ingredient',
      serving: '100g serving',
      calories: 133,
      protein: 10,
      carbs: 4,
      fat: 9
    },
    {
      name: 'Protein Smoothie',
      description: '4 ingredients',
      serving: '300ml serving',
      calories: 245,
      protein: 24,
      carbs: 30,
      fat: 5
    }
  ];

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-gray-600 mb-4">Please sign in to access your foods</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Foods</h1>
            <p className="mt-1 text-sm text-gray-500">Manage your food database</p>
          </div>
          <button
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Add Food
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {foods.map((food, index) => (
            <div
              key={index}
              className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow duration-300 ease-in-out"
            >
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">{food.name}</h3>
                </div>
                <p className="mt-1 text-sm text-gray-500">{food.description}</p>
                <p className="mt-1 text-sm text-gray-500">{food.serving}</p>
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Calories</p>
                    <p className="mt-1 text-lg font-semibold text-gray-900">{food.calories}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Protein</p>
                    <p className="mt-1 text-lg font-semibold text-gray-900">{food.protein}g</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Carbs</p>
                    <p className="mt-1 text-lg font-semibold text-gray-900">{food.carbs}g</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Fat</p>
                    <p className="mt-1 text-lg font-semibold text-gray-900">{food.fat}g</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
} 