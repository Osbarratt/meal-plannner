
import React, { useState } from 'react';
import { SuggestedRecipe, SuggestedRecipeIngredient } from '../types';

interface SuggestedRecipeCardProps {
  recipe: SuggestedRecipe;
  onSave: () => void;
  isSaved: boolean;
}

const getIngredientSourceColor = (source: SuggestedRecipeIngredient['source']): string => {
  switch (source) {
    case 'fromMyList':
      return 'text-green-400';
    case 'newTraderJoesItem':
      return 'text-sky-400';
    case 'commonStaple':
      return 'text-amber-400';
    default:
      return 'text-slate-400';
  }
};

const SuggestedRecipeCard: React.FC<SuggestedRecipeCardProps> = ({ recipe, onSave, isSaved }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-slate-700 p-5 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-start mb-1">
            <h4 className="text-xl font-semibold text-sky-400">{recipe.name}</h4>
            <span className="text-xs bg-sky-700 text-sky-200 px-2 py-1 rounded-full whitespace-nowrap">{recipe.cuisine} / {recipe.mealType}</span>
        </div>
        <p className="text-sm text-slate-400 mb-3">Est. New Items Cost: <span className="font-medium text-sky-300">{recipe.estimatedNewItemsCost}</span></p>
        
        <div className="mb-3">
          <h5 className="font-medium text-slate-300 mb-1">Ingredients Needed:</h5>
          {recipe.ingredientsNeeded.length > 0 ? (
            <ul className="list-none text-sm space-y-1 pl-1">
              {recipe.ingredientsNeeded.map((ing, idx) => (
                <li key={`ing-${idx}`} className="flex items-center">
                  <span className={`w-3 h-3 rounded-full mr-2 ${getIngredientSourceColor(ing.source).replace('text-','bg-')}`}></span>
                  <span className={`${getIngredientSourceColor(ing.source)}`}>{ing.item}</span>
                  <span className="text-slate-500 ml-1 text-xs">({ing.source.replace('fromMyList', 'Yours').replace('newTraderJoesItem', "TJ's").replace('commonStaple', 'Staple')})</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500 italic">No specific ingredients listed.</p>
          )}
        </div>
      </div>
      
      <div>
        <div className="flex justify-between items-center mt-4">
            <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm text-indigo-400 hover:text-indigo-300 font-medium inline-flex items-center"
            aria-expanded={isExpanded}
            aria-controls={`suggested-recipe-instructions-${recipe.name.replace(/\s+/g, '-')}`}
            >
            {isExpanded ? 'Hide' : 'Show'} Instructions
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`w-4 h-4 ml-1 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
            </button>
            <button
                onClick={onSave}
                disabled={isSaved}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                isSaved 
                    ? 'bg-slate-500 text-slate-300 cursor-not-allowed' 
                    : 'bg-sky-500 hover:bg-sky-600 text-white'
                }`}
            >
                {isSaved ? 'Saved' : 'Save Recipe'}
            </button>
        </div>
        {isExpanded && (
           <div id={`suggested-recipe-instructions-${recipe.name.replace(/\s+/g, '-')}`} className="mt-2 text-sm text-slate-300 whitespace-pre-line bg-slate-650 p-3 rounded-md max-h-60 overflow-y-auto">
            {recipe.instructions}
          </div>
        )}
      </div>
    </div>
  );
};

export default SuggestedRecipeCard;