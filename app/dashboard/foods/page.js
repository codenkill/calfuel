"use client";

import { useState } from 'react';
import { useAuth } from '../../../lib/context/AuthContext';
import { useData } from '../../../lib/context/DataContext';
import Modal from '../../../app/components/Modal';

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
  const { foods, addNewFood, deleteFoodItem, loading, error } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [foodType, setFoodType] = useState('single');
  const [foodToDelete, setFoodToDelete] = useState(null);
  const [newFood, setNewFood] = useState({
    name: '',
    description: foodType === 'single' ? 'Single ingredient' : 'Multi-ingredient',
    serving: '100',
    unit: 'g',
    calories: '',
    protein: '',
    carbs: '',
    fat: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewFood(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async () => {
    // Validate required fields
    if (!newFood.name || !newFood.serving || !newFood.calories || 
        !newFood.protein || !newFood.carbs || !newFood.fat) {
      alert('Please fill in all fields');
      return;
    }

    // Convert numeric fields
    const foodData = {
      name: newFood.name,
      description: newFood.description,
      serving: Number(newFood.serving),
      unit: newFood.unit,
      calories: Number(newFood.calories),
      protein: Number(newFood.protein),
      carbs: Number(newFood.carbs),
      fat: Number(newFood.fat),
      type: foodType
    };

    try {
      const success = await addNewFood(foodData);
      if (success) {
        setIsModalOpen(false);
        setNewFood({
          name: '',
          description: foodType === 'single' ? 'Single ingredient' : 'Multi-ingredient',
          serving: '100',
          unit: 'g',
          calories: '',
          protein: '',
          carbs: '',
          fat: ''
        });
      }
    } catch (error) {
      alert('Failed to add food. Please try again.');
    }
  };

  const handleDelete = async (food) => {
    setFoodToDelete(food);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!foodToDelete) return;
    
    const success = await deleteFoodItem(foodToDelete.id);
    if (!success) {
      alert('Failed to delete food. Please try again.');
    }
    setIsDeleteModalOpen(false);
    setFoodToDelete(null);
  };

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
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
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
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-500 hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Add Food
          </button>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {foods.map((food) => (
            <div
              key={food.id}
              className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow duration-300 ease-in-out"
            >
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">{food.name}</h3>
                  <button
                    onClick={() => handleDelete(food)}
                    className="text-gray-400 hover:text-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded-full p-1"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
                <p className="mt-1 text-sm text-gray-500">{food.description}</p>
                <p className="mt-1 text-sm text-gray-500">{food.serving}{food.unit} serving</p>
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

        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Add New Food"
        >
          <div className="space-y-6">
            <p className="text-sm text-gray-500">
              Enter the food details and nutritional information below.
            </p>

            <div className="flex space-x-4 mb-6">
              <button
                className={`px-4 py-2 rounded-lg ${
                  foodType === 'single'
                    ? 'bg-green-500 text-white hover:bg-green-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                onClick={() => {
                  setFoodType('single');
                  setNewFood(prev => ({
                    ...prev,
                    description: 'Single ingredient'
                  }));
                }}
              >
                Single Food
              </button>
              <button
                className={`px-4 py-2 rounded-lg ${
                  foodType === 'multi'
                    ? 'bg-green-500 text-white hover:bg-green-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                onClick={() => {
                  setFoodType('multi');
                  setNewFood(prev => ({
                    ...prev,
                    description: 'Multi-ingredient'
                  }));
                }}
              >
                Multi-Ingredient
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Food Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={newFood.name}
                  onChange={handleInputChange}
                  placeholder="e.g., Greek Yogurt or Homemade Bread"
                  className="mt-1 block w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Serving Size
                  </label>
                  <input
                    type="number"
                    name="serving"
                    value={newFood.serving}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Unit
                  </label>
                  <select
                    name="unit"
                    value={newFood.unit}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="g">g</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Calories
                </label>
                <input
                  type="number"
                  name="calories"
                  value={newFood.calories}
                  onChange={handleInputChange}
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
                    name="protein"
                    value={newFood.protein}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Carbs (g)
                  </label>
                  <input
                    type="number"
                    name="carbs"
                    value={newFood.carbs}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Fat (g)
                  </label>
                  <input
                    type="number"
                    name="fat"
                    value={newFood.fat}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              >
                Add Food
              </button>
            </div>
          </div>
        </Modal>

        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setFoodToDelete(null);
          }}
          title="Delete Food"
        >
          <div className="space-y-6">
            <p className="text-sm text-gray-500">
              Are you sure you want to delete {foodToDelete?.name}? This action cannot be undone.
            </p>

            <div className="flex justify-end space-x-4">
              <button
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setFoodToDelete(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                Delete
              </button>
            </div>
          </div>
        </Modal>
      </main>
    </div>
  );
} 