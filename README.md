# K-CALRO — Calorie Monitor App

> A personal calorie tracking web app built with React + TypeScript, powered by a Supabase backend.

---

## 📖 Overview

**K-Calro** is a minimal, user-friendly calorie monitoring application designed to help you stay on top of your daily food intake. It allows you to log meals (breakfast, lunch, snacks, dinner), track calories against a personal daily limit, manage your custom food database, and review your progress over the course of a month.

The original UI design is available on Figma: [Kcalories Monitor App](https://www.figma.com/design/Liarkp574ZACmORGSFSKaM/Kcalories-Monitor-App).

---

## ✨ Features

### 🏠 Dashboard
- Displays today's date along with a personalized greeting
- Circular progress ring showing total calories consumed vs. your daily limit
- Color-coded indicator — green when within limit, red when exceeded
- Quick access cards for Breakfast, Lunch, Snacks, and Dinner — each showing the calories logged so far
- Navigation to Monthly Stats, Food Customization, and Settings

### 🍽️ Meal Entry
- Log food items for any of the four meal types: **Breakfast**, **Lunch**, **Snacks**, **Dinner**
- Lunch and Dinner come pre-populated with common Indian meal items (Sabji/Bhaji, Chapati, Rice) for faster entry
- Chapati and Rice are toggled via checkboxes — enable them only if you had them
- Select any food from your personal food database, or add a new one on the fly
- Calorie amounts calculated in real time as you enter quantities (grams or count)
- Add multiple food items to a single meal and delete entries you don't need

### 📅 Monthly View
- Calendar-based overview of your eating history
- Each day is colour-coded: **green** (within limit), **red** (exceeded limit), **white** (no data)
- Today's date is highlighted with a blue border
- Navigate between months using previous/next buttons
- Shows the daily calorie limit at the bottom of the legend

### 🥗 Customize Food Items
- Browse your entire food database in one place
- Add new food items with a name, category, and calorie value (per gram or per unit/count)
- Edit existing food items
- Delete items with a confirmation dialog to prevent accidental removal

### ⚙️ Settings
- Change display username
- Set or update your daily calorie limit (kcal)
- Toggle between **Light Mode** and **Dark Mode** (persisted in `localStorage`)

---

## 🗂️ Project Structure

```
kcalories_monitor_mvp/
├── index.html
├── package.json
├── vite.config.ts
└── src/
    ├── main.tsx               # App entry point
    ├── App.tsx                # Root component, view routing & shared types
    ├── index.css             # Global styles & CSS variables (light/dark themes)
    ├── components/
    │   ├── Dashboard.tsx      # Home screen with progress ring & meal cards
    │   ├── MealEntry.tsx      # Food logging form for a specific meal
    │   ├── MonthlyView.tsx    # Calendar view of monthly calorie history
    │   ├── CustomizeFoods.tsx # Food database management
    │   ├── EditFood.tsx       # Edit an existing food item
    │   ├── NewFoodModal.tsx   # Modal dialog to add a new food item
    │   ├── Settings.tsx       # User preferences (username, limit, theme)
    │   ├── Footer.tsx         # App footer
    │   └── ui/                # Radix UI-based component library (shadcn-style)
    ├── supabase/
    │   └── functions/         # Supabase Edge Functions (backend API)
    └── utils/
        └── supabase/
            └── info.ts        # Supabase project ID & public anon key
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | [React 18](https://react.dev/) + [TypeScript 5](https://www.typescriptlang.org/) |
| Build Tool | [Vite 6](https://vitejs.dev/) (with `@vitejs/plugin-react-swc`) |
| Backend / DB | [Supabase](https://supabase.com/) (PostgreSQL + Edge Functions via Hono) |
| UI Components | [Radix UI](https://www.radix-ui.com/) primitives (shadcn-style) |
| Icons | [Lucide React](https://lucide.dev/) |
| Styling | Vanilla CSS with CSS custom properties (light/dark theme) |
| Charts | [Recharts](https://recharts.org/) |
| Notifications | [Sonner](https://sonner.emilkowal.ski/) |
| Forms | [React Hook Form](https://react-hook-form.com/) |
| Date Picker | [React Day Picker](https://react-day-picker.js.org/) |
| Carousel | [Embla Carousel](https://www.embla-carousel.com/) |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18 or later
- **npm** v9 or later

### Installation

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd kcalories_monitor_mvp

# 2. Install dependencies
npm i

# 3. Start the development server
npm run dev
```

The app will be available at **http://localhost:3000** and the browser will open automatically.

### Build for Production

```bash
npm run build
```

The production bundle is output to the `build/` directory.

---

## ⚙️ Configuration

The app connects to a Supabase project for its backend. The connection credentials are stored in:

```
src/utils/supabase/info.ts
```

This file exports `projectId` and `publicAnonKey`. Replace these values with your own Supabase project credentials if you are self-hosting or forking this project.

All API calls are made to a Supabase Edge Function named `make-server-f5688a74` using the following endpoints:

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/user/:userId` | Fetch user profile |
| `POST` | `/user/:userId` | Update username or daily limit |
| `GET` | `/food-items` | Fetch all food items |
| `POST` | `/food-items` | Add a new food item |
| `PUT` | `/food-items/:foodId` | Update a food item |
| `DELETE` | `/food-items/:foodId` | Delete a food item |
| `GET` | `/meals/:userId/:date` | Fetch meals for a specific date |
| `POST` | `/meals` | Save or update a meal |
| `GET` | `/daily-summary/:userId/:date` | Fetch daily calorie summary |
| `GET` | `/monthly-summary/:userId/:year/:month` | Fetch monthly calorie summaries |

---

## 📦 Key Data Models

```typescript
// A food item in the database
interface FoodItem {
  foodId: string;
  name: string;
  category: string;
  amountType: 'grams' | 'count';
  caloriesPerGram?: number;   // used when amountType === 'grams'
  caloriesPerUnit?: number;   // used when amountType === 'count'
}

// A single food entry inside a meal
interface MealItemData {
  foodId: string;
  amountGrams?: number;
  amountCount?: number;
  variantName?: string;
  calories: number;
}

// A full meal (one per meal type per day)
interface Meal {
  mealId: string;    // format: `{userId}_{date}_{mealType}`
  userId: string;
  mealDate: string;  // ISO date string (YYYY-MM-DD)
  mealType: 'breakfast' | 'lunch' | 'snacks' | 'dinner';
  items: MealItemData[];
}

// A user profile
interface User {
  userId: string;
  username: string;
  dailyLimitKcal: number;
}

// A daily calorie summary
interface DailySummary {
  summaryId: string;
  userId: string;
  summaryDate: string;
  totalKcal: number;
  exceedsLimit: boolean;
}
```

---

## 🎨 Theming

The app supports **light** and **dark** modes, toggled from the Settings screen. The preference is saved in `localStorage` under the key `darkMode` and applied by adding/removing the `dark` class on `document.documentElement`.

CSS custom properties defined in `index.css` control all theme-sensitive colours (e.g. `--bg-main`, `--bg-card`, `--text-primary`), making it easy to extend or modify the theme.

---

## 📋 Attributions

See [`src/Attributions.md`](./src/Attributions.md) for third-party library and asset credits.