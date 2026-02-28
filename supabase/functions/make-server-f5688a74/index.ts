import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
import * as kv from './kv_store.ts';


const app = new Hono();

app.use('*', cors());
app.use('*', logger(console.log));

// Types
interface User {
  userId: string;
  username: string;
  dailyLimitKcal: number;
}

interface FoodItem {
  foodId: string;
  name: string;
  category: string;
  amountType: 'grams' | 'count';
  caloriesPerGram?: number;
  caloriesPerUnit?: number;
}

interface MealItem {
  foodId: string;
  amountGrams?: number;
  amountCount?: number;
  variantName?: string;
  calories: number;
}

interface Meal {
  mealId: string;
  userId: string;
  mealDate: string;
  mealType: 'breakfast' | 'lunch' | 'snacks' | 'dinner';
  items: MealItem[];
}

interface DailySummary {
  summaryId: string;
  userId: string;
  summaryDate: string;
  totalKcal: number;
  exceedsLimit: boolean;
}

// Initialize food items
async function initializeFoodItems() {
  const existing = await kv.get('food_items');
  if (!existing) {
    const foodItems: FoodItem[] = [
      {
        foodId: 'chapati',
        name: 'Chapati',
        category: 'grains',
        amountType: 'count',
        caloriesPerUnit: 120
      },
      {
        foodId: 'rice',
        name: 'Rice (Cooked)',
        category: 'grains',
        amountType: 'grams',
        caloriesPerGram: 1.3
      },
      {
        foodId: 'mixed_sabji',
        name: 'Mixed Sabji',
        category: 'vegetables',
        amountType: 'grams',
        caloriesPerGram: 0.9
      },
      {
        foodId: 'paneer_sabji',
        name: 'Paneer Sabji',
        category: 'vegetables',
        amountType: 'grams',
        caloriesPerGram: 2
      },
      {
        foodId: 'banana',
        name: 'Banana',
        category: 'fruits',
        amountType: 'grams',
        caloriesPerGram: 0.89
      },
      {
        foodId: 'apple',
        name: 'Apple',
        category: 'fruits',
        amountType: 'grams',
        caloriesPerGram: 0.52
      },
      {
        foodId: 'milk',
        name: 'Milk',
        category: 'dairy',
        amountType: 'grams',
        caloriesPerGram: 0.42
      },
      {
        foodId: 'egg',
        name: 'Egg (Boiled)',
        category: 'protein',
        amountType: 'count',
        caloriesPerUnit: 78
      },
      {
        foodId: 'dal',
        name: 'Dal (Cooked)',
        category: 'protein',
        amountType: 'grams',
        caloriesPerGram: 1.16
      }
    ];
    await kv.set('food_items', foodItems);
  } else {
    // Deduplicate existing food items by foodId
    const foodItems = Array.isArray(existing) ? existing : [];
    const uniqueFoodItems = foodItems.reduce((acc: FoodItem[], current: FoodItem) => {
      const isDuplicate = acc.find(item => item.foodId === current.foodId);
      if (!isDuplicate) {
        acc.push(current);
      }
      return acc;
    }, []);

    // Only update if deduplication was needed
    if (uniqueFoodItems.length !== foodItems.length) {
      console.log(`Deduplicated food items: ${foodItems.length} -> ${uniqueFoodItems.length}`);
      await kv.set('food_items', uniqueFoodItems);
    }
  }
}

// Initialize default user
async function getOrCreateUser(userId: string = 'default_user'): Promise<User> {
  const userKey = `user:${userId}`;
  const existingUser = await kv.get(userKey);

  if (!existingUser) {
    const newUser: User = {
      userId,
      username: 'User',
      dailyLimitKcal: 2000
    };
    await kv.set(userKey, newUser);
    return newUser;
  }

  return existingUser as User;
}

// Routes

// Get or create user
app.get('/make-server-f5688a74/user/:userId', async (c) => {
  try {
    const userId = c.req.param('userId');
    const user = await getOrCreateUser(userId);
    return c.json({ success: true, user });
  } catch (error) {
    console.log('Error getting user:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Update user
app.post('/make-server-f5688a74/user/:userId', async (c) => {
  try {
    const userId = c.req.param('userId');
    const body = await c.req.json();
    const userKey = `user:${userId}`;

    const existingUser = await kv.get(userKey) as User;
    const updatedUser: User = {
      ...existingUser,
      ...body,
      userId
    };

    await kv.set(userKey, updatedUser);
    return c.json({ success: true, user: updatedUser });
  } catch (error) {
    console.log('Error updating user:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Get all food items
app.get('/make-server-f5688a74/food-items', async (c) => {
  try {
    await initializeFoodItems();
    const foodItems = await kv.get('food_items');
    return c.json({ success: true, foodItems });
  } catch (error) {
    console.log('Error getting food items:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Add new food item
app.post('/make-server-f5688a74/food-items/add', async (c) => {
  try {
    await initializeFoodItems();
    const newFood = await c.req.json();

    const existingFoodItems = await kv.get('food_items') || [];
    const foodItems = Array.isArray(existingFoodItems) ? existingFoodItems : [];

    // Generate ID from name
    const foodId = newFood.name.toLowerCase().replace(/[^a-z0-9]+/g, '_');

    // Check if food item with this ID already exists
    const existingFood = foodItems.find((item: FoodItem) => item.foodId === foodId);
    if (existingFood) {
      return c.json({
        success: false,
        error: 'A food item with this name already exists'
      }, 400);
    }

    const foodItem: FoodItem = {
      foodId,
      name: newFood.name,
      category: newFood.category || 'custom',
      amountType: newFood.amountType,
      caloriesPerGram: newFood.caloriesPerGram,
      caloriesPerUnit: newFood.caloriesPerUnit
    };

    foodItems.push(foodItem);
    await kv.set('food_items', foodItems);

    return c.json({ success: true, foodItem });
  } catch (error) {
    console.log('Error adding food item:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Delete food item
app.delete('/make-server-f5688a74/food-items/:foodId', async (c) => {
  try {
    const foodId = c.req.param('foodId');
    const existingFoodItems = await kv.get('food_items') || [];
    const foodItems = Array.isArray(existingFoodItems) ? existingFoodItems : [];

    const filteredFoodItems = foodItems.filter((item: FoodItem) => item.foodId !== foodId);
    await kv.set('food_items', filteredFoodItems);

    return c.json({ success: true });
  } catch (error) {
    console.log('Error deleting food item:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Update food items (bulk update)
app.post('/make-server-f5688a74/food-items/update', async (c) => {
  try {
    const body = await c.req.json();
    const foodItems = body.foodItems;

    if (!Array.isArray(foodItems)) {
      return c.json({ success: false, error: 'Invalid food items data' }, 400);
    }

    await kv.set('food_items', foodItems);
    return c.json({ success: true });
  } catch (error) {
    console.log('Error updating food items:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Get meals for a specific date
app.get('/make-server-f5688a74/meals/:userId/:date', async (c) => {
  try {
    const userId = c.req.param('userId');
    const date = c.req.param('date');
    const mealsKey = `meals:${userId}:${date}`;

    const meals = await kv.get(mealsKey) || [];
    return c.json({ success: true, meals });
  } catch (error) {
    console.log('Error getting meals:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Save a meal
app.post('/make-server-f5688a74/meals', async (c) => {
  try {
    const meal: Meal = await c.req.json();
    const mealsKey = `meals:${meal.userId}:${meal.mealDate}`;

    const existingMeals = await kv.get(mealsKey) || [];
    const meals = Array.isArray(existingMeals) ? existingMeals : [];

    // Check if meal already exists, update it
    const mealIndex = meals.findIndex((m: Meal) => m.mealId === meal.mealId);
    if (mealIndex >= 0) {
      meals[mealIndex] = meal;
    } else {
      meals.push(meal);
    }

    await kv.set(mealsKey, meals);

    // Update daily summary
    const totalKcal = meals.reduce((sum: number, m: Meal) => {
      const mealTotal = m.items.reduce((itemSum, item) => itemSum + item.calories, 0);
      return sum + mealTotal;
    }, 0);

    const user = await getOrCreateUser(meal.userId);
    const summaryKey = `daily_summary:${meal.userId}:${meal.mealDate}`;
    const summary: DailySummary = {
      summaryId: `summary_${meal.userId}_${meal.mealDate}`,
      userId: meal.userId,
      summaryDate: meal.mealDate,
      totalKcal,
      exceedsLimit: totalKcal > user.dailyLimitKcal
    };

    await kv.set(summaryKey, summary);

    return c.json({ success: true, meal, summary });
  } catch (error) {
    console.log('Error saving meal:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Delete a meal
app.delete('/make-server-f5688a74/meals/:userId/:date/:mealId', async (c) => {
  try {
    const userId = c.req.param('userId');
    const date = c.req.param('date');
    const mealId = c.req.param('mealId');
    const mealsKey = `meals:${userId}:${date}`;

    const existingMeals = await kv.get(mealsKey) || [];
    const meals = Array.isArray(existingMeals) ? existingMeals : [];

    const filteredMeals = meals.filter((m: Meal) => m.mealId !== mealId);
    await kv.set(mealsKey, filteredMeals);

    // Update daily summary
    const totalKcal = filteredMeals.reduce((sum: number, m: Meal) => {
      const mealTotal = m.items.reduce((itemSum, item) => itemSum + item.calories, 0);
      return sum + mealTotal;
    }, 0);

    const user = await getOrCreateUser(userId);
    const summaryKey = `daily_summary:${userId}:${date}`;
    const summary: DailySummary = {
      summaryId: `summary_${userId}_${date}`,
      userId,
      summaryDate: date,
      totalKcal,
      exceedsLimit: totalKcal > user.dailyLimitKcal
    };

    await kv.set(summaryKey, summary);

    return c.json({ success: true, summary });
  } catch (error) {
    console.log('Error deleting meal:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Get daily summary
app.get('/make-server-f5688a74/daily-summary/:userId/:date', async (c) => {
  try {
    const userId = c.req.param('userId');
    const date = c.req.param('date');
    const summaryKey = `daily_summary:${userId}:${date}`;

    const summary = await kv.get(summaryKey);
    if (!summary) {
      const user = await getOrCreateUser(userId);
      return c.json({
        success: true,
        summary: {
          summaryId: `summary_${userId}_${date}`,
          userId,
          summaryDate: date,
          totalKcal: 0,
          exceedsLimit: false
        }
      });
    }

    return c.json({ success: true, summary });
  } catch (error) {
    console.log('Error getting daily summary:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Get monthly summary
app.get('/make-server-f5688a74/monthly-summary/:userId/:year/:month', async (c) => {
  try {
    const userId = c.req.param('userId');
    const year = c.req.param('year');
    const month = c.req.param('month');

    const prefix = `daily_summary:${userId}:${year}-${month}`;
    const summaries = await kv.getByPrefix(prefix);

    return c.json({ success: true, summaries });
  } catch (error) {
    console.log('Error getting monthly summary:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

Deno.serve(app.fetch);