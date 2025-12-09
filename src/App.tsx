import { useState, useEffect } from 'react';
import { Dashboard } from './components/Dashboard';
import { MealEntry } from './components/MealEntry';
import { MonthlyView } from './components/MonthlyView';
import { CustomizeFoods } from './components/CustomizeFoods';
import { Settings } from './components/Settings';
import { EditFood } from './components/EditFood';
import { Footer } from './components/Footer';
import { Toaster } from './components/ui/sonner';

export type MealType = 'breakfast' | 'lunch' | 'snacks' | 'dinner';

export interface FoodItem {
  foodId: string;
  name: string;
  category: string;
  amountType: 'grams' | 'count';
  caloriesPerGram?: number;
  caloriesPerUnit?: number;
}

export interface MealItemData {
  foodId: string;
  amountGrams?: number;
  amountCount?: number;
  variantName?: string;
  calories: number;
}

export interface Meal {
  mealId: string;
  userId: string;
  mealDate: string;
  mealType: MealType;
  items: MealItemData[];
}

export interface User {
  userId: string;
  username: string;
  dailyLimitKcal: number;
}

export interface DailySummary {
  summaryId: string;
  userId: string;
  summaryDate: string;
  totalKcal: number;
  exceedsLimit: boolean;
}

export type ViewType = 'dashboard' | 'meal-entry' | 'monthly' | 'customize-foods' | 'settings' | 'edit-food';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [selectedMealType, setSelectedMealType] = useState<MealType>('breakfast');
  const [selectedFoodId, setSelectedFoodId] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  const handleMealSelect = (mealType: MealType) => {
    setSelectedMealType(mealType);
    setCurrentView('meal-entry');
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
  };

  const handleViewMonthly = () => {
    setCurrentView('monthly');
  };

  const handleViewCustomizeFoods = () => {
    setCurrentView('customize-foods');
  };

  const handleViewSettings = () => {
    setCurrentView('settings');
  };

  const handleViewEditFood = (foodId: string) => {
    setSelectedFoodId(foodId);
    setCurrentView('edit-food');
  };

  const handleBackToCustomizeFoods = () => {
    setCurrentView('customize-foods');
  };

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-primary)] transition-colors flex flex-col">
      <div className="flex-1">
        {currentView === 'dashboard' && (
          <Dashboard
            currentDate={currentDate}
            onMealSelect={handleMealSelect}
            onViewMonthly={handleViewMonthly}
            onViewCustomizeFoods={handleViewCustomizeFoods}
            onViewSettings={handleViewSettings}
          />
        )}

        {currentView === 'meal-entry' && (
          <MealEntry
            mealType={selectedMealType}
            currentDate={currentDate}
            onBack={handleBackToDashboard}
          />
        )}

        {currentView === 'monthly' && (
          <MonthlyView
            currentDate={currentDate}
            onBack={handleBackToDashboard}
          />
        )}

        {currentView === 'customize-foods' && (
          <CustomizeFoods
            onBack={handleBackToDashboard}
            onEditFood={handleViewEditFood}
          />
        )}

        {currentView === 'settings' && (
          <Settings
            onBack={handleBackToDashboard}
          />
        )}

        {currentView === 'edit-food' && (
          <EditFood
            foodId={selectedFoodId}
            onBack={handleBackToCustomizeFoods}
          />
        )}
      </div>

      <Footer />
      <Toaster />
    </div>
  );
}