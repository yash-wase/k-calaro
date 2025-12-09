import { useState, useEffect } from 'react';
import { ArrowLeft, Edit2, Trash2, Plus } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { toast } from 'sonner@2.0.3';
import { NewFoodModal } from './NewFoodModal';
import type { FoodItem } from '../App';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';

interface CustomizeFoodsProps {
  onBack: () => void;
  onEditFood: (foodId: string) => void;
}

export function CustomizeFoods({ onBack, onEditFood }: CustomizeFoodsProps) {
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newFoodModalOpen, setNewFoodModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [foodToDelete, setFoodToDelete] = useState<FoodItem | null>(null);

  useEffect(() => {
    loadFoodItems();
  }, []);

  const loadFoodItems = async () => {
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
        setFoodItems(data.foodItems);
      }
    } catch (error) {
      console.error('Error loading food items:', error);
      toast.error('Failed to load food items');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (food: FoodItem) => {
    setFoodToDelete(food);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!foodToDelete) return;

    try {
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-f5688a74/food-items/${foodToDelete.foodId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`
          }
        }
      );

      const data = await res.json();
      
      if (data.success) {
        toast.success('Food item deleted successfully');
        loadFoodItems();
      } else {
        toast.error('Failed to delete food item');
      }
    } catch (error) {
      console.error('Error deleting food item:', error);
      toast.error('Failed to delete food item');
    } finally {
      setDeleteDialogOpen(false);
      setFoodToDelete(null);
    }
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
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={onBack} className="rounded-full">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-[var(--text-primary)]">Customize Food Items</h1>
            <p className="text-sm text-muted-foreground mt-1">Edit and manage your food database</p>
          </div>
        </div>
      </div>

      {/* Add New Food Button */}
      <Button
        onClick={() => setNewFoodModalOpen(true)}
        className="w-full rounded-lg bg-green-600 hover:bg-green-700 transition-colors"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add New Food
      </Button>

      {/* Food Items List */}
      <div className="space-y-3">
        {foodItems.map((food) => (
          <Card 
            key={food.foodId} 
            className="p-4 hover:shadow-md transition-shadow cursor-pointer relative"
            onClick={() => onEditFood(food.foodId)}
          >
            <div className="flex items-center justify-between gap-4">
              {/* Left: Calories */}
              <div className="min-w-[140px]">
                <p className="text-sm text-muted-foreground">{getCalorieLabel(food)}</p>
              </div>

              {/* Center: Food Name */}
              <div className="flex-1">
                <p className="text-[var(--text-primary)]">{food.name}</p>
              </div>

              {/* Right: Delete Button */}
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full hover:bg-red-50 hover:text-red-600 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent card click when clicking delete
                    handleDeleteClick(food);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* New Food Modal */}
      <NewFoodModal
        open={newFoodModalOpen}
        onOpenChange={setNewFoodModalOpen}
        onFoodAdded={loadFoodItems}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Food Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{foodToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}