import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { NewFoodModal } from './NewFoodModal';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { toast } from 'sonner@2.0.3';
import type { MealType, FoodItem, MealItemData, Meal } from '../App';

interface MealEntryProps {
  mealType: MealType;
  currentDate: string;
  onBack: () => void;
}

interface FormItem {
  id: string;
  foodId: string;
  amountGrams?: number;
  amountCount?: number;
  variantName?: string;
  enabled?: boolean; // For checkbox behavior
}

export function MealEntry({ mealType, currentDate, onBack }: MealEntryProps) {
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [formItems, setFormItems] = useState<FormItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newFoodModalOpen, setNewFoodModalOpen] = useState(false);

  const userId = 'default_user';
  const isLunchOrDinner = mealType === 'lunch' || mealType === 'dinner';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load food items
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

      // Load existing meal data
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
        const existingMeal = mealsData.meals.find((m: Meal) => m.mealType === mealType);
        if (existingMeal && existingMeal.items.length > 0) {
          setFormItems(existingMeal.items.map((item: MealItemData) => ({
            id: crypto.randomUUID(),
            foodId: item.foodId,
            amountGrams: item.amountGrams,
            amountCount: item.amountCount,
            variantName: item.variantName,
            enabled: true // Set enabled to true for existing items
          })));
        } else if (isLunchOrDinner) {
          // Pre-populate lunch/dinner with Sabji, Chapati, Rice (in this order)
          setFormItems([
            { id: crypto.randomUUID(), foodId: '', amountGrams: 0, enabled: true }, // Sabji
            { id: crypto.randomUUID(), foodId: 'chapati', amountCount: 0, enabled: false }, // Chapati
            { id: crypto.randomUUID(), foodId: 'rice', amountGrams: 0, enabled: false } // Rice
          ]);
        } else {
          setFormItems([{ id: crypto.randomUUID(), foodId: '' }]);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load meal data');
    } finally {
      setLoading(false);
    }
  };

  const calculateCalories = (item: FormItem): number => {
    const food = foodItems.find(f => f.foodId === item.foodId);
    if (!food) return 0;

    if (food.amountType === 'grams' && item.amountGrams) {
      return item.amountGrams * (food.caloriesPerGram || 0);
    } else if (food.amountType === 'count' && item.amountCount) {
      return item.amountCount * (food.caloriesPerUnit || 0);
    }
    return 0;
  };

  const getTotalCalories = (): number => {
    return formItems.reduce((sum, item) => sum + calculateCalories(item), 0);
  };

  const handleAddItem = () => {
    setFormItems([...formItems, { id: crypto.randomUUID(), foodId: '' }]);
  };

  const handleRemoveItem = (id: string) => {
    setFormItems(formItems.filter(item => item.id !== id));
  };

  const handleItemChange = (id: string, field: string, value: any) => {
    setFormItems(formItems.map(item => {
      if (item.id === id) {
        if (field === 'foodId') {
          // Reset amounts when food changes
          return { ...item, foodId: value, amountGrams: undefined, amountCount: undefined };
        }
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const handleFoodSelect = (id: string, value: string) => {
    if (value === '__add_new__') {
      setNewFoodModalOpen(true);
    } else if (value === '__none__') {
      handleItemChange(id, 'foodId', '');
    } else {
      handleItemChange(id, 'foodId', value);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const mealItems: MealItemData[] = formItems
        .filter(item => {
          // For checkbox items, only include if enabled
          const isCheckboxItem = (item.foodId === 'chapati' || item.foodId === 'rice') && isLunchOrDinner;
          if (isCheckboxItem && !item.enabled) {
            return false;
          }
          // Regular filtering
          return item.foodId && item.foodId !== '' && (item.amountGrams || item.amountCount);
        })
        .map(item => ({
          foodId: item.foodId,
          amountGrams: item.amountGrams,
          amountCount: item.amountCount,
          variantName: item.variantName,
          calories: calculateCalories(item)
        }));

      const meal: Meal = {
        mealId: `${userId}_${currentDate}_${mealType}`,
        userId,
        mealDate: currentDate,
        mealType,
        items: mealItems
      };

      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-f5688a74/meals`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(meal)
        }
      );

      const data = await res.json();
      
      if (data.success) {
        toast.success('Meal saved successfully!');
        onBack();
      } else {
        toast.error('Failed to save meal');
      }
    } catch (error) {
      console.error('Error saving meal:', error);
      toast.error('Failed to save meal');
    } finally {
      setSaving(false);
    }
  };

  const getDisplayUnit = (food: FoodItem | undefined): string => {
    if (!food) return '';
    if (food.amountType === 'count') return 'count';
    if (food.category === 'dairy' || food.name.toLowerCase().includes('juice') || food.name.toLowerCase().includes('milk')) {
      return 'ml';
    }
    return 'g';
  };

  const getCalorieLabel = (food: FoodItem): string => {
    if (food.amountType === 'count') {
      return `${food.caloriesPerUnit} kcal/unit`;
    } else {
      const calPer100 = (food.caloriesPerGram || 0) * 100;
      const unit = food.category === 'dairy' || food.name.toLowerCase().includes('juice') || food.name.toLowerCase().includes('milk') ? 'ml' : 'g';
      return `${calPer100.toFixed(1)} kcal/100${unit}`;
    }
  };

  const formatCaloriesLabel = (food: FoodItem): string => {
    if (food.amountType === 'count') {
      return `${food.name} (${food.caloriesPerUnit} kcal/unit)`;
    } else {
      const calPer100 = (food.caloriesPerGram || 0) * 100;
      const unit = food.category === 'dairy' || food.name.toLowerCase().includes('juice') || food.name.toLowerCase().includes('milk') ? 'ml' : 'g';
      return `${food.name} (${calPer100.toFixed(1)} kcal/100${unit})`;
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

  const totalCalories = getTotalCalories();

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={onBack} className="rounded-full">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-gray-900 capitalize">{mealType}</h1>
            <p className="text-gray-600">
              {new Date(currentDate).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric' 
              })}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-600">Total Calories</p>
          <p className="text-green-600">{Math.round(totalCalories)} kcal</p>
        </div>
      </div>

      {/* Form Items */}
      <div className="space-y-4">
        {formItems.map((item, index) => {
          const selectedFood = foodItems.find(f => f.foodId === item.foodId);
          const itemCalories = calculateCalories(item);
          const displayUnit = getDisplayUnit(selectedFood);
          const isPredefLunchDinner = isLunchOrDinner && index < 3;
          
          // Check if this is a checkbox item (Chapati or Rice in lunch/dinner)
          const isChapatiRow = isPredefLunchDinner && index === 1;
          const isRiceRow = isPredefLunchDinner && index === 2;
          const isCheckboxItem = isChapatiRow || isRiceRow;
          const isSabjiRow = isPredefLunchDinner && index === 0;

          return (
            <Card key={item.id} className={`p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow ${isCheckboxItem && !item.enabled ? 'bg-gray-50' : ''}`}>
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-4">
                    {/* Checkbox Item (Chapati or Rice) */}
                    {isCheckboxItem ? (
                      <>
                        {/* Checkbox + Fixed Label */}
                        <div className="flex items-center gap-3">
                          <Checkbox
                            id={`checkbox-${item.id}`}
                            checked={item.enabled || false}
                            onCheckedChange={(checked) => handleItemChange(item.id, 'enabled', checked)}
                          />
                          <Label
                            htmlFor={`checkbox-${item.id}`}
                            className={`text-gray-900 cursor-pointer ${!item.enabled ? 'text-gray-400' : ''}`}
                          >
                            {isChapatiRow ? 'Chapati' : 'Rice'}
                          </Label>
                        </div>

                        {/* Amount Input - only visible when enabled */}
                        {item.enabled && selectedFood && (
                          <>
                            {selectedFood.amountType === 'grams' && (
                              <div className="space-y-2">
                                <Label className="text-sm text-gray-700">
                                  Amount ({displayUnit})
                                </Label>
                                <Input
                                  type="number"
                                  value={item.amountGrams || ''}
                                  onChange={(e) => handleItemChange(item.id, 'amountGrams', parseFloat(e.target.value) || 0)}
                                  placeholder="0"
                                  className="rounded-lg border-gray-300 focus:border-green-500 focus:ring-green-500 transition-colors"
                                />
                              </div>
                            )}

                            {selectedFood.amountType === 'count' && (
                              <div className="space-y-2">
                                <Label className="text-sm text-gray-700">Count</Label>
                                <Input
                                  type="number"
                                  value={item.amountCount || ''}
                                  onChange={(e) => handleItemChange(item.id, 'amountCount', parseInt(e.target.value) || 0)}
                                  placeholder="0"
                                  className="rounded-lg border-gray-300 focus:border-green-500 focus:ring-green-500 transition-colors"
                                />
                              </div>
                            )}

                            {/* Calories Display */}
                            {itemCalories > 0 && (
                              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                                <p className="text-sm text-gray-600">Calories</p>
                                <p className="text-green-600">{Math.round(itemCalories)} kcal</p>
                              </div>
                            )}
                          </>
                        )}
                      </>
                    ) : (
                      <>
                        {/* Regular Food Selection (Sabji or other meals) */}
                        <div className="space-y-2">
                          <Label className="text-sm text-gray-700">
                            {isSabjiRow ? 'Bhaji/Sabji' : 'Food Item'}
                          </Label>
                          <Select
                            value={item.foodId || '__none__'}
                            onValueChange={(value) => handleFoodSelect(item.id, value)}
                          >
                            <SelectTrigger className="rounded-xl border-2 border-gray-300 hover:border-green-400 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all duration-200 px-4 py-3">
                              <SelectValue placeholder="Select food" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-2 shadow-lg">
                              <SelectItem value="__none__" className="rounded-lg py-3 px-4 my-1 hover:bg-gray-100 cursor-pointer transition-colors">
                                <span className="text-gray-500 italic">None</span>
                              </SelectItem>
                              {foodItems.map((food) => (
                                <SelectItem key={food.foodId} value={food.foodId} className="rounded-lg py-3 px-4 my-1 hover:bg-green-50 cursor-pointer transition-colors">
                                  <span className="text-gray-800">{food.name}</span>
                                  <span className="text-gray-500 text-sm ml-2">({getCalorieLabel(food)})</span>
                                </SelectItem>
                              ))}
                              <SelectItem value="__add_new__" className="rounded-lg py-3 px-4 my-1 hover:bg-green-50 cursor-pointer transition-colors border-t-2 border-gray-200 mt-2">
                                <span className="text-green-600 font-medium">+ Other (Add new food)</span>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Amount Input */}
                        {selectedFood && (
                          <>
                            {selectedFood.amountType === 'grams' && (
                              <div className="space-y-2">
                                <Label className="text-sm text-gray-700">
                                  Amount ({displayUnit})
                                </Label>
                                <Input
                                  type="number"
                                  value={item.amountGrams || ''}
                                  onChange={(e) => handleItemChange(item.id, 'amountGrams', parseFloat(e.target.value) || 0)}
                                  placeholder="0"
                                  className="rounded-lg border-gray-300 focus:border-green-500 focus:ring-green-500 transition-colors"
                                />
                              </div>
                            )}

                            {selectedFood.amountType === 'count' && (
                              <div className="space-y-2">
                                <Label className="text-sm text-gray-700">Count</Label>
                                <Input
                                  type="number"
                                  value={item.amountCount || ''}
                                  onChange={(e) => handleItemChange(item.id, 'amountCount', parseInt(e.target.value) || 0)}
                                  placeholder="0"
                                  className="rounded-lg border-gray-300 focus:border-green-500 focus:ring-green-500 transition-colors"
                                />
                              </div>
                            )}
                          </>
                        )}

                        {/* Calories Display */}
                        {selectedFood && itemCalories > 0 && (
                          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                            <p className="text-sm text-gray-600">Calories</p>
                            <p className="text-green-600">{Math.round(itemCalories)} kcal</p>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Delete Button - only for non-predefined items */}
                  {!isPredefLunchDinner && formItems.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveItem(item.id)}
                      className="ml-4 rounded-full hover:bg-red-50 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Add Item Button */}
      <Button
        variant="outline"
        onClick={handleAddItem}
        className="w-full rounded-lg hover:bg-green-50 hover:text-green-600 hover:border-green-300 transition-colors"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add More Items
      </Button>

      {/* Save Button */}
      <Button
        onClick={handleSave}
        disabled={saving}
        className="w-full rounded-lg bg-green-600 hover:bg-green-700 transition-colors"
      >
        <Save className="h-4 w-4 mr-2" />
        {saving ? 'Saving...' : 'Save Meal'}
      </Button>

      {/* New Food Modal */}
      <NewFoodModal
        open={newFoodModalOpen}
        onOpenChange={setNewFoodModalOpen}
        onFoodAdded={loadData}
      />
    </div>
  );
}