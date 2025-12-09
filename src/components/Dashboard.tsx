import { useState, useEffect } from 'react';
import { Coffee, UtensilsCrossed, Cookie, Moon, Calendar, Settings, Plus, ChevronDown } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { toast } from 'sonner@2.0.3';
import type { MealType, User, DailySummary, Meal, FoodItem } from '../App';

interface DashboardProps {
  currentDate: string;
  onMealSelect: (mealType: MealType) => void;
  onViewMonthly: () => void;
  onViewCustomizeFoods: () => void;
  onViewSettings: () => void;
}

export function Dashboard({ currentDate, onMealSelect, onViewMonthly, onViewCustomizeFoods, onViewSettings }: DashboardProps) {
  const [user, setUser] = useState<User | null>(null);
  const [dailySummary, setDailySummary] = useState<DailySummary | null>(null);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newLimit, setNewLimit] = useState<string>('');
  const [newUsername, setNewUsername] = useState<string>('');
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const userId = 'default_user';

  useEffect(() => {
    loadData();
  }, [currentDate]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Fetch user
      const userRes = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-f5688a74/user/${userId}`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`
          }
        }
      );
      const userData = await userRes.json();
      
      if (userData.success) {
        setUser(userData.user);
        setNewLimit(userData.user.dailyLimitKcal.toString());
        setNewUsername(userData.user.username);
      }

      // Fetch food items
      const foodRes = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-f5688a74/food-items`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`
          }
        }
      );
      const foodData = await foodRes.json();
      
      if (foodData.success) {
        setFoodItems(foodData.foodItems);
      }

      // Fetch meals for today
      const mealsRes = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-f5688a74/meals/${userId}/${currentDate}`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`
          }
        }
      );
      const mealsData = await mealsRes.json();
      
      if (mealsData.success) {
        setMeals(mealsData.meals);
      }

      // Fetch daily summary
      const summaryRes = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-f5688a74/daily-summary/${userId}/${currentDate}`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`
          }
        }
      );
      const summaryData = await summaryRes.json();
      
      if (summaryData.success) {
        setDailySummary(summaryData.summary);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateLimit = async () => {
    if (!user) return;

    try {
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-f5688a74/user/${userId}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            dailyLimitKcal: parseInt(newLimit)
          })
        }
      );

      const data = await res.json();
      
      if (data.success) {
        setUser(data.user);
        setSettingsDialogOpen(false);
        toast.success('Daily limit updated!');
        loadData();
      }
    } catch (error) {
      console.error('Error updating limit:', error);
      toast.error('Failed to update limit');
    }
  };

  const handleUpdateUsername = async () => {
    if (!user) return;

    try {
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-f5688a74/user/${userId}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            username: newUsername
          })
        }
      );

      const data = await res.json();
      
      if (data.success) {
        setUser(data.user);
        setSettingsDialogOpen(false);
        toast.success('Username updated!');
        loadData();
      }
    } catch (error) {
      console.error('Error updating username:', error);
      toast.error('Failed to update username');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const totalCalories = dailySummary?.totalKcal || 0;
  const dailyLimit = user?.dailyLimitKcal || 2000;
  const percentage = Math.min((totalCalories / dailyLimit) * 100, 100);
  const exceedsLimit = totalCalories > dailyLimit;

  const getMealForType = (mealType: MealType): Meal | null => {
    return meals.find(m => m.mealType === mealType) || null;
  };

  const getFoodName = (foodId: string): string => {
    const food = foodItems.find(f => f.foodId === foodId);
    return food?.name || foodId;
  };

  const getUnit = (foodId: string): string => {
    const food = foodItems.find(f => f.foodId === foodId);
    if (!food) return '';
    return food.amountType === 'count' ? 'count' : 'g';
  };

  const mealsList = [
    { type: 'breakfast' as MealType, label: 'Breakfast', icon: Coffee, color: 'from-yellow-400 to-orange-400' },
    { type: 'lunch' as MealType, label: 'Lunch', icon: UtensilsCrossed, color: 'from-green-400 to-teal-400' },
    { type: 'snacks' as MealType, label: 'Snacks', icon: Cookie, color: 'from-pink-400 to-purple-400' },
    { type: 'dinner' as MealType, label: 'Dinner', icon: Moon, color: 'from-blue-400 to-indigo-400' }
  ];

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[var(--text-primary)] text-5xl font-bold special-heading">K-CALRO</h1>
          <p className='text-sm text-muted-foreground italic'>Hey, {user?.username||"there"}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {new Date(currentDate).toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onViewMonthly}>
            <Calendar className="h-4 w-4 mr-2" />
            Monthly
          </Button>
          <Button variant="outline" size="icon" onClick={onViewSettings}>
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Two Column Layout for Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Today's Progress */}
        <Card className="p-8">
          <h2 className="text-[var(--text-primary)] mb-6">Today&apos;s Progress</h2>
          <div className="flex flex-col items-center">
            <div className="relative w-64 h-64">
              <svg className="transform -rotate-90 w-64 h-64">
                <circle
                  cx="128"
                  cy="128"
                  r="120"
                  stroke="currentColor"
                  strokeWidth="16"
                  fill="transparent"
                  className="text-gray-200"
                />
                <circle
                  cx="128"
                  cy="128"
                  r="120"
                  stroke="currentColor"
                  strokeWidth="16"
                  fill="transparent"
                  strokeDasharray={`${2 * Math.PI * 120}`}
                  strokeDashoffset={`${2 * Math.PI * 120 * (1 - percentage / 100)}`}
                  className={exceedsLimit ? 'text-red-500' : 'text-green-500'}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-sm text-muted-foreground">Today&apos;s Total</p>
                <p className={`text-5xl mt-2 ${exceedsLimit ? 'text-red-600' : 'text-green-600'}`}>
                  {Math.round(totalCalories)}
                </p>
                <p className="text-sm text-muted-foreground mt-1">kcal</p>
              </div>
            </div>
            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Daily Limit: <span className="font-semibold">{dailyLimit} kcal</span>
              </p>
              {exceedsLimit && (
                <p className="text-red-600 mt-2">
                  ⚠️ Exceeded by {Math.round(totalCalories - dailyLimit)} kcal
                </p>
              )}
            </div>
          </div>
        </Card>

        {/* Right: Log Your Meals */}
        <Card className="p-8">
          <h2 className="text-[var(--text-primary)] mb-6">Log Your Meals</h2>
          <div className="grid grid-cols-2 gap-4">
            {mealsList.map((meal) => {
              const Icon = meal.icon;
              const mealData = getMealForType(meal.type);
              const mealTotal = mealData?.items.reduce((sum, item) => sum + item.calories, 0) || 0;

              return (
                <button
                  key={meal.type}
                  onClick={() => onMealSelect(meal.type)}
                  className="p-4 rounded-xl bg-[var(--bg-card)] border-2 border-border hover:border-green-400 hover:shadow-lg transition-all duration-200 text-left group"
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${meal.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <div className="text-center">
                      <p className="text-[var(--text-primary)]">{meal.label}</p>
                      {mealTotal > 0 && (
                        <p className="text-sm text-green-500 mt-1">{Math.round(mealTotal)} kcal</p>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Bottom Row - Two Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* View Monthly Stats */}
        <Card 
          className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
          onClick={onViewMonthly}
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center flex-shrink-0">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-[var(--text-primary)]">View Monthly Stats</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Track your progress over the month
              </p>
            </div>
          </div>
        </Card>

        {/* Customize Food Items */}
        <Card 
          className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
          onClick={onViewCustomizeFoods}
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center flex-shrink-0">
              <Settings className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-[var(--text-primary)]">Customize Food Items</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Edit and manage your food database
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Bottom CTA Bar */}
      <Card className="bg-gradient-to-r from-green-500 to-teal-500 text-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-white">Ready to track your meals?</h3>
            <p className="text-green-50 text-sm mt-1">
              Start logging your food intake to stay on track with your goals
            </p>
          </div>
          <Button
            onClick={() => onMealSelect('breakfast')}
            variant="secondary"
            className="bg-white text-green-600 hover:bg-green-50"
          >
            Log First Meal
          </Button>
        </div>
      </Card>
    </div>
  );
}