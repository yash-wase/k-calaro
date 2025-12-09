import { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { toast } from 'sonner@2.0.3';
import type { FoodItem } from '../App';

interface EditFoodProps {
  foodId: string;
  onBack: () => void;
}

export function EditFood({ foodId, onBack }: EditFoodProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [foodName, setFoodName] = useState('');
  const [amountType, setAmountType] = useState<'grams' | 'count'>('grams');
  const [calories, setCalories] = useState('');
  const [category, setCategory] = useState('');

  useEffect(() => {
    loadFoodItem();
  }, [foodId]);

  const loadFoodItem = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-f5688a74/food-items`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`
          }
        }
      );
      const data = await res.json();
      
      if (data.success) {
        const food = data.foodItems.find((f: FoodItem) => f.foodId === foodId);
        if (food) {
          setFoodName(food.name);
          setAmountType(food.amountType);
          setCategory(food.category);
          
          if (food.amountType === 'count') {
            setCalories((food.caloriesPerUnit || 0).toString());
          } else {
            const calPer100 = (food.caloriesPerGram || 0) * 100;
            setCalories(calPer100.toString());
          }
        } else {
          toast.error('Food item not found');
          onBack();
        }
      }
    } catch (error) {
      console.error('Error loading food item:', error);
      toast.error('Failed to load food item');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!foodName.trim() || !calories) {
      toast.error('Please fill all fields');
      return;
    }

    setSaving(true);
    try {
      const caloriesNum = parseFloat(calories);
      
      // We need to fetch all food items, update this one, and save back
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-f5688a74/food-items`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`
          }
        }
      );
      const data = await res.json();
      
      if (data.success) {
        const foodItems = data.foodItems;
        const index = foodItems.findIndex((f: FoodItem) => f.foodId === foodId);
        
        if (index !== -1) {
          // Update the food item
          const updatedFood: FoodItem = {
            ...foodItems[index],
            name: foodName.trim(),
            category,
            amountType,
            caloriesPerGram: amountType === 'grams' ? caloriesNum / 100 : undefined,
            caloriesPerUnit: amountType === 'count' ? caloriesNum : undefined
          };
          
          foodItems[index] = updatedFood;
          
          // Save back to server
          const updateRes = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-f5688a74/food-items/update`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${publicAnonKey}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ foodItems })
            }
          );

          const updateData = await updateRes.json();
          
          if (updateData.success) {
            toast.success('Food item updated successfully!');
            onBack();
          } else {
            toast.error('Failed to update food item');
          }
        }
      }
    } catch (error) {
      console.error('Error updating food:', error);
      toast.error('Failed to update food item');
    } finally {
      setSaving(false);
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

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={onBack} className="rounded-full">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-[var(--text-primary)]">Edit Food Item</h1>
          <p className="text-sm text-muted-foreground mt-1">Update food information</p>
        </div>
      </div>

      {/* Edit Form */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="food-name">Food Name</Label>
            <Input
              id="food-name"
              value={foodName}
              onChange={(e) => setFoodName(e.target.value)}
              placeholder="e.g., Oats, Orange Juice"
              className="rounded-lg"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="unit-type">Unit Type</Label>
            <Select value={amountType} onValueChange={(value: any) => setAmountType(value)}>
              <SelectTrigger id="unit-type" className="rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="grams">Measured in grams/ml</SelectItem>
                <SelectItem value="count">Counted (units)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="calories">
              {amountType === 'grams' ? 'Calories per 100g/100ml' : 'Calories per unit'}
            </Label>
            <Input
              id="calories"
              type="number"
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
              placeholder="e.g., 120"
              className="rounded-lg"
            />
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 rounded-lg bg-green-600 hover:bg-green-700"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button
              onClick={onBack}
              variant="outline"
              disabled={saving}
              className="flex-1 rounded-lg"
            >
              Cancel
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
