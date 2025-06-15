import React, { useState, useMemo } from 'react';
import { SavedRecipe, IngredientDetail, MealType } from '../types';
import { ALL_MEAL_TYPES } from '../constants'; // To ensure consistent meal type ordering

interface SavedRecipesViewProps {
  savedRecipes: SavedRecipe[];
  expandedRecipeData: Map<string, { details: IngredientDetail[]; isLoading: boolean; error: string | null }>;
  onExpandRecipe: (recipe: SavedRecipe) => void;
  onDeleteRecipe: (recipeId: string) => void;
}

interface GroupedRecipes {
  [cuisine: string]: {
    [mealType in MealType]?: SavedRecipe[];
  };
}

const SavedRecipesView: React.FC<SavedRecipesViewProps> = ({ savedRecipes, expandedRecipeData, onExpandRecipe, onDeleteRecipe }) => {
  const [expandedRecipes, setExpandedRecipes] = useState<Set<string>>(new Set());

  const groupedRecipes = useMemo(() => {
    return savedRecipes.reduce<GroupedRecipes>((acc, recipe) => {
      if (!acc[recipe.cuisine]) {
        acc[recipe.cuisine] = {};
      }
      if (!acc[recipe.cuisine][recipe.mealType]) {
        acc[recipe.cuisine][recipe.mealType] = [];
      }
      acc[recipe.cuisine][recipe.mealType]!.push(recipe);
      return acc;
    }, {});
  }, [savedRecipes]);

  const cuisines = useMemo(() => Object.keys(groupedRecipes).sort(), [groupedRecipes]);

  const toggleExpandRecipe = (recipeId: string, recipe: SavedRecipe) => {
    const newSet = new Set(expandedRecipes);
    if (newSet.has(recipeId)) {
      newSet.delete(recipeId);
    } else {
      newSet.add(recipeId);
      // Fetch details only if not already fetched or if errored previously
      const currentData = expandedRecipeData.get(recipeId);
      if (!currentData || currentData.error) {
         onExpandRecipe(recipe);
      }
    }
    setExpandedRecipes(newSet);
  };

  if (savedRecipes.length === 0) {
    return <p className="text-slate-400 text-center py-8">You haven't saved any recipes yet. Explore 'Meal Ideas' and save your favorites!</p>;
  }

  return (
    <div>
      <h2 className="text-3xl font-semibold mb-6 text-teal-400">Your Saved Recipes</h2>
      {cuisines.map(cuisine => (
        <div key={cuisine} className="mb-8">
          <h3 className="text-2xl font-semibold text-slate-200 border-b border-slate-700 pb-2 mb-4">{cuisine}</h3>
          {ALL_MEAL_TYPES.map(mealType => {
            const recipesInMealType = groupedRecipes[cuisine]?.[mealType];
            if (!recipesInMealType || recipesInMealType.length === 0) return null;

            return (
              <div key={mealType} className="mb-6 pl-4">
                <h4 className="text-xl font-medium text-slate-300 mb-3">{mealType}</h4>
                <div className="space-y-4">
                  {recipesInMealType.map(recipe => {
                    const isExpanded = expandedRecipes.has(recipe.id);
                    const detailsData = expandedRecipeData.get(recipe.id);
                    const isLoadingDetails = detailsData?.isLoading;
                    const detailsError = detailsData?.error;
                    const ingredientDetails = detailsData?.details;

                    return (
                      <div key={recipe.id} className="bg-slate-700 p-4 rounded-lg shadow-md">
                        <div className="flex justify-between items-center">
                          <h5 className="text-lg font-semibold text-teal-300">{recipe.name}</h5>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => toggleExpandRecipe(recipe.id, recipe)}
                              className="text-sm text-indigo-400 hover:text-indigo-300 font-medium inline-flex items-center"
                              aria-expanded={isExpanded}
                            >
                              {isExpanded ? 'Hide' : 'Show'} Details
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`w-4 h-4 ml-1 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                              </svg>
                            </button>
                             <button
                                onClick={() => onDeleteRecipe(recipe.id)}
                                className="text-red-400 hover:text-red-300 transition-colors p-1"
                                title="Delete Recipe"
                                aria-label={`Delete ${recipe.name}`}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12.56 0c1.153 0 2.243.096 3.242.26m3.242.26L9.754 16.332h4.492L14.74 5.79M4.772 5.79L4.772 4.125a2.25 2.25 0 012.25-2.25h8.956a2.25 2.25 0 012.25 2.25v1.666" />
                                </svg>
                            </button>
                          </div>
                        </div>
                        {isExpanded && (
                          <div className="mt-3 pt-3 border-t border-slate-600">
                            {isLoadingDetails && <p className="text-slate-400">Loading ingredient details...</p>}
                            {detailsError && <p className="text-red-400">Error: {detailsError}</p>}
                            {ingredientDetails && ingredientDetails.length > 0 && (
                              <div className="mb-3">
                                <h6 className="font-medium text-slate-300 mb-1">Ingredients:</h6>
                                <ul className="list-none text-sm space-y-1">
                                  {ingredientDetails.map((ing, idx) => (
                                    <li key={idx} className="flex items-center">
                                      <span className={`w-2.5 h-2.5 rounded-full mr-2 ${ing.status === 'owned' ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                                      <span className={ing.status === 'owned' ? 'text-slate-300' : 'text-yellow-300'}>{ing.name}</span>
                                      {ing.status === 'needed' && (
                                        <span className="text-xs text-sky-400 ml-2">
                                          (TJ's: {ing.estimatedCostTJ || 'N/A'} {ing.isAtTraderJoes === false && ing.estimatedCostTJ === null ? '- Not at TJ' : ''})
                                        </span>
                                      )}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                             {ingredientDetails && ingredientDetails.length === 0 && !isLoadingDetails && (
                                <p className="text-sm text-slate-500 italic">This recipe seems to use only common staples not explicitly listed or no specific ingredients were parsed.</p>
                            )}


                            <h6 className="font-medium text-slate-300 mb-1 mt-3">Instructions:</h6>
                            <div className="text-sm text-slate-300 whitespace-pre-line bg-slate-650 p-3 rounded-md max-h-60 overflow-y-auto">
                              {recipe.instructions}
                            </div>
                            <p className="text-xs text-slate-500 mt-2">Saved on: {new Date(recipe.dateSaved).toLocaleDateString()}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default SavedRecipesView;
