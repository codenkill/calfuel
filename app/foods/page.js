"use client";

import { useAuth } from '../../lib/context/AuthContext';
import { useState, useEffect } from 'react';
import { getUserData } from '../../lib/firebase';

export default function FoodsPage() {
  const { user } = useAuth();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

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

  // Load user data
  useEffect(() => {
    async function loadUserData() {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const data = await getUserData(user.uid);
        if (data) {
          setUserData(data);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadUserData();
  }, [user]);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-gray-600 mb-4">Please sign in to access your foods</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Foods</h1>
            <p className="text-gray-500 mt-1">Manage your food database</p>
          </div>
          <button className="px-4 py-2 bg-[#4ade80] text-white rounded-lg hover:bg-[#22c55e] transition-colors duration-200 flex items-center">
            <span className="text-xl mr-1">+</span> Add Food
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative mb-8">
          <input
            type="text"
            placeholder="Search foods..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full max-w-md px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#4ade80] focus:border-transparent"
          />
          <button className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </div>

        {/* Food Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {foods.map((food, index) => (
            <div key={index} className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow duration-200">
              <h3 className="text-xl font-semibold text-gray-900">{food.name}</h3>
              <p className="text-gray-500 mb-4">{food.description}</p>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-900 font-medium">{food.serving}</p>
                  <p className="text-gray-500">{food.calories} kcal</p>
                </div>
                <div>
                  <p className="text-gray-700">Protein: {food.protein}g</p>
                  <p className="text-gray-700">Carbs: {food.carbs}g</p>
                  <p className="text-gray-700">Fat: {food.fat}g</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
} 