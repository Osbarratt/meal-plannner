
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Ingredient, MealType, Recipe, Tab, GrocerySuggestionResponse, SavedRecipe, IngredientDetail, TraderJoeItemCost, SuggestedRecipe } from './types';
import { ALL_MEAL_TYPES, FRIDGE_COLOR, FREEZER_COLOR, PANTRY_COLOR } from './constants';
import IngredientList from './components/IngredientList';
import RecipeCard from './components/RecipeCard';
import TabsComponent from './components/Tabs';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorDisplay from './components/ErrorDisplay';
import { generateRecipes, suggestGroceries, getIngredientCostsForRecipe } from './services/geminiService';
import SuggestedRecipeCard from './components/SuggestedRecipeCard';
import SavedRecipesView from './components/SavedRecipesView';
import ShoppingListView from './components/ShoppingListView'; // New component

// Helper icons (simple SVG components)
const FridgeIcon: React.FC<{className?: string}> = ({className}) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 ${className}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 3h15M4.5 3v18M4.5 3h15V1.5M4.5 21h15M4.5 21V6m0-3V1.5m0 4.5v15m15-18V1.5m0 3v15m0-15h-15M7.5 6H9m0 0V4.5M9 6v2.25M7.5 15H9m0 0v-2.25M9 15v2.25m3-9h1.5m0 0V4.5M12 6v2.25m0 9h1.5m0 0v-2.25M12 15v2.25" />
  </svg>
);

const FreezerIcon: React.FC<{className?: string}> = ({className}) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 ${className}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9.75v6.75m0 0l-3-3m3 3l3-3m-8.25 6a4.5 4.5 0 01-1.423-8.654l.058-.035A4.5 4.5 0 0110.5 3.75a4.5 4.5 0 014.288 5.863l.058.035a4.5 4.5 0 01-1.423 8.654A4.5 4.5 0 013.75 16.5z" />
  </svg>
);

const PantryIcon: React.FC<{className?: string}> = ({className}) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 ${className}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h7.5" />
  </svg>
);

const DEFAULT_FRIDGE_ITEMS: Ingredient[] = [
  { id: 'f_init_1', name: 'Parsley' }, { id: 'f_init_2', name: 'Avocado Ranch Salad Kit' }, { id: 'f_init_3', name: 'Everything Bagels' }, { id: 'f_init_4', name: 'Almond Chipotle Dip' }, { id: 'f_init_5', name: 'Kiwi' }, { id: 'f_init_6', name: 'Bruschetta sauce' }, { id: 'f_init_7', name: 'Avocados' }, { id: 'f_init_8', name: 'Grape Tomatoes' }, { id: 'f_init_9', name: 'Burrata Filling' }, { id: 'f_init_10', name: 'Grilled Chicken Breast' }, { id: 'f_init_11', name: 'Chili onion Hummus' }, { id: 'f_init_12', name: 'Deli Meats' }, { id: 'f_init_13', name: 'Gruyère/Cheddar Mix' }, { id: 'f_init_14', name: 'Baguette' },
];
const DEFAULT_FREEZER_ITEMS: Ingredient[] = [ { id: 'fz_init_1', name: 'Chicken Mole' }, { id: 'fz_init_2', name: 'Brown Rice' }, { id: 'fz_init_3', name: 'Ground Beef' }];
const DEFAULT_PANTRY_ITEMS: Ingredient[] = [ { id: 'p_init_1', name: 'Quinoa' }, { id: 'p_init_2', name: 'White Rice' }, { id: 'p_init_3', name: "Dried Pasta's" }];


const App: React.FC = () => {
  const [fridgeItems, setFridgeItems] = useState<Ingredient[]>(() => JSON.parse(localStorage.getItem('fridgeItems') || JSON.stringify(DEFAULT_FRIDGE_ITEMS)));
  const [freezerItems, setFreezerItems] = useState<Ingredient[]>(() => JSON.parse(localStorage.getItem('freezerItems') || JSON.stringify(DEFAULT_FREEZER_ITEMS)));
  const [pantryItems, setPantryItems] = useState<Ingredient[]>(() => JSON.parse(localStorage.getItem('pantryItems') || JSON.stringify(DEFAULT_PANTRY_ITEMS)));
  const [savedRecipes, setSavedRecipes] = useState<SavedRecipe[]>(() => JSON.parse(localStorage.getItem('savedRecipes') || '[]'));
  const [shoppingListItems, setShoppingListItems] = useState<string[]>(() => JSON.parse(localStorage.getItem('shoppingListItems') || '[]'));

  const [selectedMealTypes, setSelectedMealTypes] = useState<MealType[]>([]);
  const [smartShoppingSelectedMealTypes, setSmartShoppingSelectedMealTypes] = useState<MealType[]>([]); // For Smart Shopping tab
  
  const [generatedRecipes, setGeneratedRecipes] = useState<Recipe[]>([]);
  const [budget, setBudget] = useState<string>('');
  const [grocerySuggestions, setGrocerySuggestions] = useState<GrocerySuggestionResponse | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>(Tab.Ingredients);

  const [expandedSavedRecipeData, setExpandedSavedRecipeData] = useState<Map<string, { details: IngredientDetail[]; isLoading: boolean; error: string | null }>>(new Map());

  const allUserIngredients = useMemo(() => 
    [...fridgeItems, ...freezerItems, ...pantryItems].map(i => i.name.toLowerCase()),
    [fridgeItems, freezerItems, pantryItems]
  );

  const persistItems = useCallback((key: string, items: Ingredient[] | SavedRecipe[] | string[]) => {
    localStorage.setItem(key, JSON.stringify(items));
  }, []);

  useEffect(() => { persistItems('fridgeItems', fridgeItems); }, [fridgeItems, persistItems]);
  useEffect(() => { persistItems('freezerItems', freezerItems); }, [freezerItems, persistItems]);
  useEffect(() => { persistItems('pantryItems', pantryItems); }, [pantryItems, persistItems]);
  useEffect(() => { persistItems('savedRecipes', savedRecipes); }, [savedRecipes, persistItems]);
  useEffect(() => { persistItems('shoppingListItems', shoppingListItems); }, [shoppingListItems, persistItems]);


  const handleAddIngredient = (categorySetter: React.Dispatch<React.SetStateAction<Ingredient[]>>, name: string) => {
    if (name.trim() === '') return;
    categorySetter(prev => [...prev, { id: Date.now().toString(), name: name.trim() }]);
  };

  const handleDeleteIngredient = (categorySetter: React.Dispatch<React.SetStateAction<Ingredient[]>>, id: string) => {
    categorySetter(prev => prev.filter(item => item.id !== id));
  };

  const handleMealTypeToggle = (mealType: MealType, forSmartShopping: boolean = false) => {
    const setter = forSmartShopping ? setSmartShoppingSelectedMealTypes : setSelectedMealTypes;
    setter(prev =>
      prev.includes(mealType) ? prev.filter(mt => mt !== mealType) : [...prev, mealType]
    );
  };

  const handleGenerateRecipes = useCallback(async () => {
    if (selectedMealTypes.length === 0) {
      setError("Please select at least one meal type for 'Meal Ideas'.");
      return;
    }
    const currentIngredients = [...fridgeItems, ...freezerItems, ...pantryItems];
    setIsLoading(true);
    setError(null);
    setGeneratedRecipes([]);
    try {
      const recipes = await generateRecipes(currentIngredients, selectedMealTypes);
      setGeneratedRecipes(recipes);
    } catch (err) {
      console.error(err);
      setError((err as Error).message || "Failed to generate recipes. Check your API key and network.");
    } finally {
      setIsLoading(false);
    }
  }, [selectedMealTypes, fridgeItems, freezerItems, pantryItems]);

  const handleSuggestGroceries = useCallback(async () => {
    if (!budget || isNaN(parseFloat(budget)) || parseFloat(budget) <= 0) {
      setError("Please enter a valid budget.");
      return;
    }
    if (smartShoppingSelectedMealTypes.length === 0) {
      setError("Please select at least one meal type for Smart Shopping.");
      return;
    }
    const currentIngredients = [...fridgeItems, ...freezerItems, ...pantryItems];
    
    setIsLoading(true);
    setError(null);
    setGrocerySuggestions(null);
    try {
      const suggestions = await suggestGroceries(currentIngredients, parseFloat(budget), smartShoppingSelectedMealTypes);
      setGrocerySuggestions(suggestions);
    } catch (err) {
      console.error(err);
      setError((err as Error).message || "Failed to suggest groceries. Check your API key and network.");
    } finally {
      setIsLoading(false);
    }
  }, [budget, smartShoppingSelectedMealTypes, fridgeItems, freezerItems, pantryItems]);

  const handleSaveStandardRecipe = useCallback((recipeToSave: Recipe) => {
    setSavedRecipes(prev => {
      const isAlreadySaved = prev.some(r => r.name === recipeToSave.name && r.mealType === recipeToSave.mealType && r.cuisine === recipeToSave.cuisine);
      if (isAlreadySaved) {
        setError(`${recipeToSave.name} is already saved.`);
        return prev;
      }
      const newSavedRecipe: SavedRecipe = {
        ...recipeToSave,
        id: Date.now().toString(),
        dateSaved: new Date().toISOString(),
      };
      return [newSavedRecipe, ...prev];
    });
  }, []);
  
  const handleSaveSuggestedRecipe = useCallback((suggestedRecipeToSave: SuggestedRecipe) => {
    setSavedRecipes(prev => {
      const isAlreadySaved = prev.some(r => r.name === suggestedRecipeToSave.name && r.mealType === suggestedRecipeToSave.mealType && r.cuisine === suggestedRecipeToSave.cuisine);
      if (isAlreadySaved) {
        setError(`${suggestedRecipeToSave.name} is already saved.`);
        return prev;
      }
      
      const ingredientsFromMyList = suggestedRecipeToSave.ingredientsNeeded
        .filter(ing => ing.source === 'fromMyList')
        .map(ing => ing.item);
      const additionalCommonIngredients = suggestedRecipeToSave.ingredientsNeeded
        .filter(ing => ing.source === 'commonStaple')
        .map(ing => ing.item);

      const newSavedRecipe: SavedRecipe = {
        id: Date.now().toString() + '-suggested',
        dateSaved: new Date().toISOString(),
        name: suggestedRecipeToSave.name,
        cuisine: suggestedRecipeToSave.cuisine,
        mealType: suggestedRecipeToSave.mealType,
        ingredientsFromMyList,
        additionalCommonIngredients,
        instructions: suggestedRecipeToSave.instructions,
      };
      
      const newTraderJoesItems = suggestedRecipeToSave.ingredientsNeeded
        .filter(ing => ing.source === 'newTraderJoesItem')
        .map(ing => ing.item);
      
      setShoppingListItems(currentShoppingList => {
        const uniqueNewItems = newTraderJoesItems.filter(item => !currentShoppingList.includes(item));
        return [...currentShoppingList, ...uniqueNewItems];
      });

      return [newSavedRecipe, ...prev];
    });
  }, []);


  const handleDeleteSavedRecipe = useCallback((recipeId: string) => {
    // Note: This does not automatically remove items from shopping list for simplicity.
    // User can clear shopping list manually.
    setSavedRecipes(prev => prev.filter(r => r.id !== recipeId));
    setExpandedSavedRecipeData(prev => {
      const newMap = new Map(prev);
      newMap.delete(recipeId);
      return newMap;
    });
  }, []);
  
  const handleClearShoppingList = useCallback(() => {
    setShoppingListItems([]);
  }, []);

  const handleFetchSavedRecipeDetails = useCallback(async (recipe: SavedRecipe) => {
    setExpandedSavedRecipeData(prev => new Map(prev).set(recipe.id, { details: [], isLoading: true, error: null }));
    try {
      const recipeIngredients = [
        ...recipe.ingredientsFromMyList,
        ...recipe.additionalCommonIngredients
      ].filter(name => name && name.trim() !== "");

      const neededIngredientsNames: string[] = [];
      const initialDetails: IngredientDetail[] = recipeIngredients.map(name => {
        const isOwned = allUserIngredients.includes(name.toLowerCase());
        if (!isOwned) {
          neededIngredientsNames.push(name);
        }
        return { name: name, status: isOwned ? 'owned' : 'needed', estimatedCostTJ: null, isAtTraderJoes: null };
      });

      let finalDetails = initialDetails;
      if (neededIngredientsNames.length > 0) {
        const costs: TraderJoeItemCost[] = await getIngredientCostsForRecipe(neededIngredientsNames);
        const costMap = new Map(costs.map(cost => [cost.name.toLowerCase(), cost]));
        finalDetails = initialDetails.map(detail => {
          if (detail.status === 'needed') {
            const costInfo = costMap.get(detail.name.toLowerCase());
            return { ...detail, estimatedCostTJ: costInfo?.price || "N/A", isAtTraderJoes: costInfo?.atTraderJoes || false };
          }
          return detail;
        });
      }
      setExpandedSavedRecipeData(prev => new Map(prev).set(recipe.id, { details: finalDetails, isLoading: false, error: null }));
    } catch (err) {
      console.error("Error fetching saved recipe details:", err);
      const errorMessage = (err as Error).message || "Failed to fetch ingredient costs for the saved recipe.";
      setExpandedSavedRecipeData(prev => new Map(prev).set(recipe.id, { details: [], isLoading: false, error: errorMessage }));
      setError(errorMessage);
    }
  }, [allUserIngredients]);


  return (
    <div className="container mx-auto p-4 md:p-8 max-w-5xl">
      <header className="text-center mb-10">
        <h1 className="text-5xl font-playfair font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-400 to-sky-400">
          Culinary Companion AI
        </h1>
        <p className="text-slate-400 mt-2 text-lg">Your smart kitchen assistant for meal ideas and grocery planning.</p>
      </header>

      <TabsComponent activeTab={activeTab} setActiveTab={setActiveTab} />

      {isLoading && <LoadingSpinner />}
      {error && <ErrorDisplay message={error} onClose={() => setError(null)} />}

      <main className="mt-8 p-6 bg-slate-800 shadow-2xl rounded-lg">
        {activeTab === Tab.Ingredients && (
          <div className="grid md:grid-cols-3 gap-6">
            <IngredientList title="Fridge" IconComponent={FridgeIcon} items={fridgeItems} onAdd={(name) => handleAddIngredient(setFridgeItems, name)} onDelete={(id) => handleDeleteIngredient(setFridgeItems, id)} colorClass={FRIDGE_COLOR} />
            <IngredientList title="Freezer" IconComponent={FreezerIcon} items={freezerItems} onAdd={(name) => handleAddIngredient(setFreezerItems, name)} onDelete={(id) => handleDeleteIngredient(setFreezerItems, id)} colorClass={FREEZER_COLOR} />
            <IngredientList title="Pantry" IconComponent={PantryIcon} items={pantryItems} onAdd={(name) => handleAddIngredient(setPantryItems, name)} onDelete={(id) => handleDeleteIngredient(setPantryItems, id)} colorClass={PANTRY_COLOR} />
          </div>
        )}

        {activeTab === Tab.MealIdeas && (
          <div>
            <h2 className="text-3xl font-semibold mb-6 text-emerald-400">Meal Ideas</h2>
            <div className="mb-6 p-4 bg-slate-700 rounded-md">
              <h3 className="text-xl font-medium mb-3 text-slate-200">Select Meal Types:</h3>
              <div className="flex flex-wrap gap-3">
                {ALL_MEAL_TYPES.map(mealType => (
                  <button
                    key={mealType}
                    onClick={() => handleMealTypeToggle(mealType)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-150
                      ${selectedMealTypes.includes(mealType) ? 'bg-emerald-500 text-white' : 'bg-slate-600 hover:bg-slate-500 text-slate-300'}`}
                  >
                    {mealType}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={handleGenerateRecipes}
              disabled={isLoading || selectedMealTypes.length === 0}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
              Generate Recipes
            </button>
            
            {generatedRecipes.length > 0 && (
              <div className="mt-8">
                <h3 className="text-2xl font-semibold mb-4 text-slate-200">Generated Recipes:</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  {generatedRecipes.map((recipe, index) => (
                    <RecipeCard 
                        key={index} 
                        recipe={recipe} 
                        onSave={() => handleSaveStandardRecipe(recipe)}
                        isSaved={savedRecipes.some(r => r.name === recipe.name && r.mealType === recipe.mealType && r.cuisine === recipe.cuisine)}
                    />
                  ))}
                </div>
              </div>
            )}
             {!isLoading && generatedRecipes.length === 0 && !error && selectedMealTypes.length > 0 && (
                <p className="mt-6 text-center text-slate-400">Click "Generate Recipes" to see meal ideas based on your ingredients and selected meal types.</p>
            )}
          </div>
        )}

        {activeTab === Tab.SmartShopping && (
          <div>
            <h2 className="text-3xl font-semibold mb-6 text-sky-400">Smart Shopping (Trader Joe's)</h2>
            <div className="mb-6 p-4 bg-slate-700 rounded-md">
              <label htmlFor="budget" className="block text-xl font-medium mb-2 text-slate-200">Your Grocery Budget ($):</label>
              <input
                type="number"
                id="budget"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="e.g., 50"
                className="w-full p-3 bg-slate-600 border border-slate-500 rounded-lg text-slate-100 focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              />
            </div>
             <div className="mb-6 p-4 bg-slate-700 rounded-md">
              <h3 className="text-xl font-medium mb-3 text-slate-200">Select Meal Types for TJ's Recipes:</h3>
              <div className="flex flex-wrap gap-3">
                {ALL_MEAL_TYPES.map(mealType => (
                  <button
                    key={`smart-${mealType}`}
                    onClick={() => handleMealTypeToggle(mealType, true)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-150
                      ${smartShoppingSelectedMealTypes.includes(mealType) ? 'bg-sky-500 text-white' : 'bg-slate-600 hover:bg-slate-500 text-slate-300'}`}
                  >
                    {mealType}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={handleSuggestGroceries}
              disabled={isLoading || !budget || parseFloat(budget) <= 0 || smartShoppingSelectedMealTypes.length === 0}
              className="w-full bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-600 hover:to-indigo-600 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
              </svg>
              Get Trader Joe's Suggestions
            </button>

            {grocerySuggestions && (
              <div className="mt-8">
                <h3 className="text-2xl font-semibold mb-4 text-slate-200">Trader Joe's Shopping List Suggestions:</h3>
                {grocerySuggestions.traderJoesSuggestions.length > 0 ? (
                  <ul className="list-disc list-inside mb-6 p-4 bg-slate-700 rounded-md space-y-2">
                    {grocerySuggestions.traderJoesSuggestions.map((item, index) => (
                      <li key={index} className="text-slate-300">{item}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-slate-400 mb-6">No specific Trader Joe's items suggested for this budget/combination. Try adjusting your budget or ingredients.</p>
                )}

                <h3 className="text-2xl font-semibold mb-4 text-slate-200">New Recipe Ideas with TJ's Items:</h3>
                 {grocerySuggestions.suggestedRecipes.length > 0 ? (
                    <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-6">
                    {grocerySuggestions.suggestedRecipes.map((recipe, index) => (
                        <SuggestedRecipeCard 
                            key={index} 
                            recipe={recipe} 
                            onSave={() => handleSaveSuggestedRecipe(recipe)}
                            isSaved={savedRecipes.some(r => r.name === recipe.name && r.mealType === recipe.mealType && r.cuisine === recipe.cuisine)}
                        />
                    ))}
                    </div>
                ) : (
                    <p className="text-slate-400">No new recipes could be formed with the suggestions. Consider adding more base ingredients or adjusting meal types.</p>
                )}
              </div>
            )}
             {!isLoading && !grocerySuggestions && !error && (parseFloat(budget) > 0 || smartShoppingSelectedMealTypes.length > 0) && (
                <p className="mt-6 text-center text-slate-400">Enter your budget, select meal types, and click "Get Trader Joe's Suggestions" for personalized shopping ideas.</p>
            )}
          </div>
        )}
        {activeTab === Tab.SavedRecipes && (
          <SavedRecipesView
            savedRecipes={savedRecipes}
            expandedRecipeData={expandedSavedRecipeData}
            onExpandRecipe={handleFetchSavedRecipeDetails}
            onDeleteRecipe={handleDeleteSavedRecipe}
          />
        )}
        {activeTab === Tab.ShoppingList && (
          <ShoppingListView
            items={shoppingListItems}
            onClearList={handleClearShoppingList}
          />
        )}
      </main>
      <footer className="text-center mt-12 py-4 text-sm text-slate-500">
        <p>&copy; {new Date().getFullYear()} Culinary Companion AI. Powered by Gemini.</p>
      </footer>
    </div>
  );
};

export default App;
