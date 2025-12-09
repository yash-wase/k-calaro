import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { toast } from 'sonner@2.0.3';

interface NewFoodModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFoodAdded: () => void;
}

export function NewFoodModal({ open, onOpenChange, onFoodAdded }: NewFoodModalProps) {
  const [foodName, setFoodName] = useState('');
  const [foodType, setFoodType] = useState<'solid' | 'liquid' | 'countable'>('solid');
  const [caloriesValue, setCaloriesValue] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!foodName.trim() || !caloriesValue) {
      toast.error('Please fill all fields');
      return;
    }

    setSaving(true);
    try {
      const calories = parseFloat(caloriesValue);
      
      let newFood;
      if (foodType === 'solid') {
        newFood = {
          name: foodName.trim(),
          category: 'custom',
          amountType: 'grams',
          caloriesPerGram: calories / 100 // Convert per 100g to per gram
        };
      } else if (foodType === 'liquid') {
        newFood = {
          name: foodName.trim(),
          category: 'custom',
          amountType: 'grams', // We'll use grams for ml too
          caloriesPerGram: calories / 100 // Convert per 100ml to per ml
        };
      } else {
        newFood = {
          name: foodName.trim(),
          category: 'custom',
          amountType: 'count',
          caloriesPerUnit: calories
        };
      }

      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-f5688a74/food-items/add`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(newFood)
        }
      );

      const data = await res.json();
      
      if (data.success) {
        toast.success('Food item added successfully!');
        setFoodName('');
        setFoodType('solid');
        setCaloriesValue('');
        onOpenChange(false);
        onFoodAdded();
      } else {
        toast.error(data.error || 'Failed to add food item');
      }
    } catch (error) {
      console.error('Error adding food:', error);
      toast.error('Failed to add food item');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Food Item</DialogTitle>
          <DialogDescription>
            Add a custom food item to your database
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
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
            <Label htmlFor="food-type">Food Type</Label>
            <Select value={foodType} onValueChange={(value: any) => setFoodType(value)}>
              <SelectTrigger id="food-type" className="rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="solid">Solid (measured in grams)</SelectItem>
                <SelectItem value="liquid">Liquid (measured in ml)</SelectItem>
                <SelectItem value="countable">Countable (fruits/eggs/units)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="calories">
              {foodType === 'solid' && 'Calories per 100g'}
              {foodType === 'liquid' && 'Calories per 100ml'}
              {foodType === 'countable' && 'Calories per 1 unit'}
            </Label>
            <Input
              id="calories"
              type="number"
              value={caloriesValue}
              onChange={(e) => setCaloriesValue(e.target.value)}
              placeholder="e.g., 120"
              className="rounded-lg"
            />
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? 'Adding...' : 'Add Food Item'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}