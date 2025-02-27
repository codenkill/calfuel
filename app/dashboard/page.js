'use client';

import { useState } from 'react';
import { Button } from '@/components/button';


export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <nav className="flex justify-between items-center p-4 bg-white shadow-md rounded-lg">
        <div className="flex space-x-4">
          <a href="#" className="px-4 py-2 bg-green-500 text-white rounded-md">Dashboard</a>
          <a href="#" className="px-4 py-2 text-gray-700">Foods</a>
          <a href="#" className="px-4 py-2 text-gray-700">Log Meal</a>
        </div>
        <div className="flex space-x-4">
          <a href="#" className="px-4 py-2 text-gray-700">Settings</a>
          <a href="#" className="px-4 py-2 text-gray-700">Profile</a>
        </div>
      </nav>
      <header className="mt-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-gray-500">Track your nutrition and manage your meals</p>
      </header>
    </div>
  );
}