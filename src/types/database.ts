export type IngredientCategory =
  | "Produce"
  | "Meat & Seafood"
  | "Dairy & Eggs"
  | "Bakery"
  | "Frozen"
  | "Pantry"
  | "Canned Goods"
  | "Condiments"
  | "Snacks"
  | "Beverages"
  | "Other";

export type DishTag =
  | "quick"
  | "slow-cooker"
  | "instant-pot"
  | "vegetarian"
  | "vegan"
  | "kid-friendly"
  | "date-night"
  | "comfort-food"
  | "healthy"
  | "leftovers-friendly"
  | "one-pot"
  | "grilling"
  | "seafood"
  | "pasta"
  | "soup";

export const DISH_TAGS: { value: DishTag; label: string; color: string }[] = [
  { value: "quick", label: "Quick", color: "#4A9B6F" },
  { value: "slow-cooker", label: "Slow Cooker", color: "#8B6914" },
  { value: "instant-pot", label: "Instant Pot", color: "#4A7FA5" },
  { value: "vegetarian", label: "Vegetarian", color: "#6B9B4A" },
  { value: "vegan", label: "Vegan", color: "#4A9B6F" },
  { value: "kid-friendly", label: "Kid-Friendly", color: "#D97757" },
  { value: "date-night", label: "Date Night", color: "#9B4A7F" },
  { value: "comfort-food", label: "Comfort Food", color: "#C49A2A" },
  { value: "healthy", label: "Healthy", color: "#4A9B6F" },
  { value: "leftovers-friendly", label: "Leftovers OK", color: "#7A6F5E" },
  { value: "one-pot", label: "One Pot", color: "#4A7FA5" },
  { value: "grilling", label: "Grilling", color: "#C45242" },
  { value: "seafood", label: "Seafood", color: "#4A7FA5" },
  { value: "pasta", label: "Pasta", color: "#C49A2A" },
  { value: "soup", label: "Soup", color: "#8B6914" },
];

export const INGREDIENT_CATEGORIES: IngredientCategory[] = [
  "Produce",
  "Meat & Seafood",
  "Dairy & Eggs",
  "Bakery",
  "Frozen",
  "Pantry",
  "Canned Goods",
  "Condiments",
  "Snacks",
  "Beverages",
  "Other",
];

export const APPLIANCES = [
  "Air Fryer",
  "Crockpot",
  "Instant Pot",
  "Grill",
  "Smoker",
  "Oven",
  "Stovetop",
  "Microwave",
  "Blender",
  "Food Processor",
] as const;

export type Appliance = (typeof APPLIANCES)[number];

export const FUN_OPTIONS: { emoji: string; label: string }[] = [
  { emoji: "🌙", label: "Date Night" },
  { emoji: "🥡", label: "Screw it — Takeout" },
  { emoji: "🏡", label: "Dinner at Friends'" },
  { emoji: "🍕", label: "Pizza Night" },
  { emoji: "🎉", label: "Special Occasion" },
];

export interface Ingredient {
  name: string;
  quantity: string;
  unit: string;
  category: IngredientCategory;
}

export interface Family {
  id: string;
  name: string;
  share_code: string;
  members: string[];
  created_at: string;
  updated_at: string;
}

export interface ChefAssignment {
  id: string;
  family_id: string;
  chef_date: string;
  chef_name: string;
  created_at: string;
}

export interface Dish {
  id: string;
  family_id: string;
  name: string;
  tags: string[];
  source_url: string | null;
  ingredients: Ingredient[];
  instructions: string | null;
  prep_time: number | null;
  cook_time: number | null;
  servings: number;
  image_url: string | null;
  notes: string | null;
  is_favorite: boolean;
  is_memory: boolean;
  memory_story: string | null;
  memory_image_url: string | null;
  appliances: string[];
  created_at: string;
  updated_at: string;
}

export interface MealPlan {
  id: string;
  family_id: string;
  dish_id: string | null;
  meal_date: string;
  custom_name: string | null;
  position: number;
  votes: Record<string, 1 | -1>;
  vote_count: number;
  created_at: string;
  dish?: Dish;
}

export interface DinnerActivity {
  id: string;
  family_id: string;
  activity_date: string;
  title: string;
  start_time: string | null;
  end_time: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ShoppingItem {
  id: string;
  family_id: string;
  name: string;
  quantity: string | null;
  category: string;
  is_checked: boolean;
  source: "manual" | "auto";
  meal_plan_id: string | null;
  pantry_item_id: string | null;
  pantry_note: string | null;
  created_at: string;
}

export interface DayPlan {
  date: string;
  dayName: string;
  shortName: string;
  dayNumber: string;
  isToday: boolean;
  meals: MealPlan[];
  activities?: DinnerActivity[];
  chef?: string | null;
}

export interface PantryItem {
  id: string;
  family_id: string;
  name: string;
  quantity: number;
  unit: string | null;
  category: string | null;
  expiry_date: string | null;
  low_stock_threshold: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  daysUntilExpiry?: number | null;
  lowStock?: boolean;
}

export interface MealTemplateMeal {
  dayOfWeek: number;
  dishId?: string | null;
  dishName?: string | null;
  customName?: string | null;
}

export interface MealTemplate {
  id: string;
  family_id: string;
  name: string;
  description: string | null;
  meals: MealTemplateMeal[];
  created_at: string;
  updated_at: string;
}
