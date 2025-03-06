"use client";

import { useState } from 'react';
import { useAuth } from '../../../lib/context/AuthContext';
import { useData } from '../../../lib/context/DataContext';
import Modal from '../../../app/components/Modal';

export default function LogMealPage() {
  const { user } = useAuth();
  const { foods, addNewMeal, mealHistory, updateExistingMeal, deleteMealItem, removeMealFromToday, loading, error } = useData();
  const [selectedFood, setSelectedFood] = useState('');
  const [amount, setAmount] = useState('');
  const [mealName, setMealName] = useState('');
  const [selectedFoods, setSelectedFoods] = useState([]);
  const [editingMeal, setEditingMeal] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deletingMealId, setDeletingMealId] = useState(null);
  const [mealToDelete, setMealToDelete] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const handleAddFood = () => {
    const foodToAdd = foods.find(food => food.id === selectedFood);
    if (foodToAdd && amount) {
      const multiplier = parseFloat(amount) / 100;
      const newFood = {
        id: foodToAdd.id,
        name: foodToAdd.name,
        amount: parseFloat(amount),
        calories: Math.round(foodToAdd.calories * multiplier),
        protein: Math.round(foodToAdd.protein * multiplier),
        carbs: Math.round(foodToAdd.carbs * multiplier),
        fat: Math.round(foodToAdd.fat * multiplier)
      };
      setSelectedFoods([...selectedFoods, newFood]);
      setSelectedFood('');
      setAmount('');
    }
  };

  const handleRemoveFood = (index) => {
    setSelectedFoods(foods => foods.filter((_, i) => i !== index));
  };

  const totalNutrition = selectedFoods.reduce((acc, food) => ({
    calories: acc.calories + food.calories,
    protein: acc.protein + food.protein,
    carbs: acc.carbs + food.carbs,
    fat: acc.fat + food.fat
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

  const handleSaveMeal = async () => {
    if (!mealName || selectedFoods.length === 0) return;

    const mealData = {
      name: mealName,
      foods: selectedFoods,
      totalCalories: totalNutrition.calories,
      totalProtein: totalNutrition.protein,
      totalCarbs: totalNutrition.carbs,
      totalFat: totalNutrition.fat
    };

    const success = await addNewMeal(mealData);
    if (success) {
      setMealName('');
      setSelectedFoods([]);
    }
  };

  const handleEditMeal = (meal) => {
    setEditingMeal(meal);
    setMealName(meal.name);
    setSelectedFoods(meal.foods);
    setIsEditModalOpen(true);
  };

  const handleUpdateMeal = async () => {
    if (!editingMeal || !mealName || selectedFoods.length === 0) return;

    const updatedMealData = {
      name: mealName,
      foods: selectedFoods,
      totalCalories: totalNutrition.calories,
      totalProtein: totalNutrition.protein,
      totalCarbs: totalNutrition.carbs,
      totalFat: totalNutrition.fat
    };

    const success = await updateExistingMeal(
      editingMeal.date,
      updatedMealData,
      editingMeal.timestamp
    );

    if (success) {
      setIsEditModalOpen(false);
      setEditingMeal(null);
      setMealName('');
      setSelectedFoods([]);
    }
  };

  const handleDeleteMeal = async (date, timestamp) => {
    setMealToDelete({ date, timestamp });
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!mealToDelete) return;
    
    setDeletingMealId(mealToDelete.timestamp);
    const mealDate = mealToDelete.date || new Date(mealToDelete.timestamp).toISOString().split('T')[0];
    
    try {
      const success = await deleteMealItem(mealDate, mealToDelete.timestamp);
      if (!success) {
        alert('Failed to delete meal. Please try again.');
      }
    } catch (err) {
      console.error('Error deleting meal:', err);
      alert('Error deleting meal. Please try again.');
    } finally {
      setDeletingMealId(null);
      setMealToDelete(null);
      setIsDeleteModalOpen(false);
    }
  };

  const handleAddToToday = async (meal) => {
    const mealData = {
      name: meal.name,
      foods: meal.foods,
      totalCalories: meal.totalCalories,
      totalProtein: meal.totalProtein,
      totalCarbs: meal.totalCarbs,
      totalFat: meal.totalFat
    };

    const success = await addNewMeal(mealData);
    if (success) {
      const notification = document.createElement('div');
      notification.className = 'fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg transition-opacity duration-500';
      notification.textContent = 'Meal added to today\'s log';
      document.body.appendChild(notification);
      setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 500);
      }, 2000);
    }
  };

  const handleRemoveFromToday = async (meal) => {
    const success = await removeMealFromToday(meal.timestamp);
    if (success) {
      const notification = document.createElement('div');
      notification.className = 'fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg transition-opacity duration-500';
      notification.textContent = 'Meal removed from today\'s dashboard';
      document.body.appendChild(notification);
      setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 500);
      }, 2000);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-gray-600 mb-4">Please sign in to log meals</p>
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
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">Log Meal</h1>
          <p className="mt-1 text-sm text-gray-500">Record what you've eaten</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Select Foods Section */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-1">Select Foods</h2>
              <p className="text-sm text-gray-500 mb-6">Add foods to your meal</p>

              <div className="space-y-4">
                <div className="flex flex-wrap gap-4">
                  <select
                    value={selectedFood}
                    onChange={(e) => setSelectedFood(e.target.value)}
                    className="flex-1 min-w-[200px] px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="">Select food</option>
                    {foods.map((food) => (
                      <option key={food.id} value={food.id}>
                        {food.name}
                      </option>
                    ))}
                  </select>

                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Amount"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-24 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                    <select className="w-16 px-2 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent">
                      <option>g</option>
                    </select>
                  </div>

                  <button
                    onClick={handleAddFood}
                    disabled={!selectedFood || !amount}
                    className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    Add
                  </button>
                </div>

                {/* Selected Foods List */}
                <div className="space-y-2">
                  {selectedFoods.map((food, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <h3 className="font-medium text-gray-900">{food.name}</h3>
                        <p className="text-sm text-gray-500">{food.amount}g</p>
                      </div>
                      <div className="flex items-center space-x-4">
                        <p className="text-sm text-gray-700">
                          {food.calories} kcal
                        </p>
                        <button
                          onClick={() => handleRemoveFood(index)}
                          className="text-red-500 hover:text-red-600 focus:outline-none"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Meal Summary Section */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-1">Meal Summary</h2>
              <p className="text-sm text-gray-500 mb-6">Review and save your meal</p>

              <div className="space-y-6">
                <input
                  type="text"
                  placeholder="Meal name (e.g., Breakfast)"
                  value={mealName}
                  onChange={(e) => setMealName(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Calories</p>
                    <p className="text-2xl font-bold text-gray-900">{totalNutrition.calories} kcal</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Protein</p>
                    <p className="text-lg font-semibold text-gray-900">{totalNutrition.protein}g</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Carbs</p>
                    <p className="text-lg font-semibold text-gray-900">{totalNutrition.carbs}g</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Fat</p>
                    <p className="text-lg font-semibold text-gray-900">{totalNutrition.fat}g</p>
                  </div>
                </div>

                <button
                  onClick={isEditModalOpen ? handleUpdateMeal : handleSaveMeal}
                  disabled={!mealName || selectedFoods.length === 0}
                  className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isEditModalOpen ? 'Update Meal' : 'Save Meal'}
                </button>
              </div>
            </div>
          </div>

          {/* Meal History Section */}
          <div className="bg-white rounded-lg shadow p-6 flex flex-col">
            <h2 className="text-lg font-medium text-gray-900 mb-1">Meal History</h2>
            <p className="text-sm text-gray-500 mb-6">Your recurring meals</p>

            <div className="space-y-4 overflow-y-auto flex-1 pr-2" style={{ maxHeight: '32rem' }}>
              {mealHistory.map((meal, index) => (
                <div
                  key={meal.timestamp}
                  className={`border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200 ${
                    deletingMealId === meal.timestamp ? 'opacity-50' : ''
                  } ${meal.isToday ? 'border-green-200 bg-green-50' : ''}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-gray-900">{meal.name}</h3>
                        {meal.isToday && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                            Today
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">Added on {formatDate(meal.addedDate || meal.timestamp)}</p>
                    </div>
                    <div className="flex space-x-2">
                      {meal.isToday ? (
                        <button
                          onClick={() => handleRemoveFromToday(meal)}
                          disabled={deletingMealId === meal.timestamp}
                          className="text-gray-500 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 rounded-lg px-3 py-1 text-sm font-medium disabled:opacity-50 border border-gray-300"
                          title="Remove from today's dashboard"
                        >
                          Remove Today
                        </button>
                      ) : (
                        <button
                          onClick={() => handleAddToToday(meal)}
                          disabled={deletingMealId === meal.timestamp}
                          className="text-green-500 hover:text-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 rounded-lg px-3 py-1 text-sm font-medium disabled:opacity-50 border border-green-500"
                          title="Use this meal today"
                        >
                          Use Today
                        </button>
                      )}
                      <button
                        onClick={() => handleEditMeal(meal)}
                        disabled={deletingMealId === meal.timestamp}
                        className="text-green-500 hover:text-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 rounded-full p-1 disabled:opacity-50"
                        title="Edit meal"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteMeal(meal.date, meal.timestamp)}
                        disabled={deletingMealId === meal.timestamp}
                        className="text-red-500 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded-full p-1 disabled:opacity-50"
                        title="Delete meal"
                      >
                        {deletingMealId === meal.timestamp ? (
                          <div className="h-5 w-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-sm">
                    <div>
                      <p className="text-gray-500">Calories</p>
                      <p className="font-medium">{meal.totalCalories} kcal</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Protein</p>
                      <p className="font-medium">{meal.totalProtein}g</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Carbs</p>
                      <p className="font-medium">{meal.totalCarbs}g</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Fat</p>
                      <p className="font-medium">{meal.totalFat}g</p>
                    </div>
                  </div>
                </div>
              ))}

              {mealHistory.length === 0 && (
                <p className="text-center text-gray-500 py-4">No meals logged yet</p>
              )}
            </div>
          </div>
        </div>

        {/* Edit Meal Modal */}
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingMeal(null);
            setMealName('');
            setSelectedFoods([]);
          }}
          title="Edit Meal"
        >
          <div className="space-y-6">
            <p className="text-sm text-gray-500 mb-4">
              Edit your meal details below
            </p>

            {/* Food Selection Form */}
            <div className="space-y-4">
              <div className="flex flex-wrap gap-4">
                <select
                  value={selectedFood}
                  onChange={(e) => setSelectedFood(e.target.value)}
                  className="flex-1 min-w-[200px] px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Select food</option>
                  {foods.map((food) => (
                    <option key={food.id} value={food.id}>
                      {food.name}
                    </option>
                  ))}
                </select>

                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-24 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <select className="w-16 px-2 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent">
                    <option>g</option>
                  </select>
                </div>

                <button
                  onClick={handleAddFood}
                  disabled={!selectedFood || !amount}
                  className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  Add
                </button>
              </div>

              {/* Selected Foods List */}
              <div className="max-h-60 overflow-y-auto space-y-2">
                {selectedFoods.map((food, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <h3 className="font-medium text-gray-900">{food.name}</h3>
                      <p className="text-sm text-gray-500">{food.amount}g</p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <p className="text-sm text-gray-700">
                        {food.calories} kcal
                      </p>
                      <button
                        onClick={() => handleRemoveFood(index)}
                        className="text-red-500 hover:text-red-600 focus:outline-none"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Meal Details */}
              <div className="space-y-4 pt-4 border-t border-gray-200">
                <input
                  type="text"
                  placeholder="Meal name (e.g., Breakfast)"
                  value={mealName}
                  onChange={(e) => setMealName(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Calories</p>
                    <p className="text-xl font-bold text-gray-900">{totalNutrition.calories} kcal</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Protein</p>
                    <p className="text-lg font-semibold text-gray-900">{totalNutrition.protein}g</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Carbs</p>
                    <p className="text-lg font-semibold text-gray-900">{totalNutrition.carbs}g</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Fat</p>
                    <p className="text-lg font-semibold text-gray-900">{totalNutrition.fat}g</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-4 pt-4">
                <button
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingMeal(null);
                    setMealName('');
                    setSelectedFoods([]);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateMeal}
                  disabled={!mealName || selectedFoods.length === 0}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Update Meal
                </button>
              </div>
            </div>
          </div>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setMealToDelete(null);
          }}
          title="Delete Meal"
        >
          <div className="space-y-6">
            <p className="text-sm text-gray-500">
              Are you sure you want to delete this meal? This action cannot be undone.
            </p>

            <div className="flex justify-end space-x-4">
              <button
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setMealToDelete(null);
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