export interface Ingredient {
  id: string;
  name: string;
}

export enum MealType {
  Breakfast = "Breakfast",
  Lunch = "Lunch",
  Dinner = "Dinner",
  Snack = "Snack",
  Dessert = "Dessert"
}

export interface Recipe {
  name: string;
  cuisine: string; // e.g., "Italian", "Mexican", "Chinese" - To be provided by Gemini
  mealType: MealType; // The specific meal type this recipe is for - To be provided by Gemini
  ingredientsFromMyList: string[]; // Ingredients Gemini identified from user's input list
  additionalCommonIngredients: string[]; // Other common staples Gemini assumes are available
  instructions: string;
}

export interface SavedRecipe extends Recipe {
  id: string; // Unique ID for the saved recipe instance
  dateSaved: string; // ISO string of when the recipe was saved
}

export interface IngredientDetail {
  name: string; // Original name from recipe's combined ingredient list
  status: 'owned' | 'needed';
  estimatedCostTJ: string | null; // e.g., "$2.99", "N/A", "Price Varies" - only if status is 'needed'
  isAtTraderJoes: boolean | null; // Confirmation if it's likely a TJ's item - only if status is 'needed'
}

export interface SuggestedRecipeIngredient {
  item: string;
  source: 'fromMyList' | 'newTraderJoesItem' | 'commonStaple';
}
export interface SuggestedRecipe {
  name: string;
  mealType: MealType; // Added: To be provided by Gemini
  cuisine: string; // Added: To be provided by Gemini
  ingredientsNeeded: SuggestedRecipeIngredient[];
  instructions: string;
  estimatedNewItemsCost: string; // Added: Estimated cost of new TJ's items for THIS recipe
}

export interface GrocerySuggestionResponse {
  traderJoesSuggestions: string[];
  suggestedRecipes: SuggestedRecipe[];
}

export enum Tab {
  Ingredients = "My Ingredients",
  MealIdeas = "Meal Ideas",
  SmartShopping = "Smart Shopping (TJ's)",
  SavedRecipes = "Saved Recipes",
  ShoppingList = "Shopping List" // New tab
}

// For Gemini response when fetching costs
export interface TraderJoeItemCost {
    name: string;
    price: string | null; // e.g., "$3.99", "Price Varies", or null if not found/applicable
    atTraderJoes: boolean; // true if it's a TJ item, false otherwise
}