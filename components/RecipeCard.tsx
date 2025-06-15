import React, { useState } from 'react';
import { Recipe } from '../types';

interface RecipeCardProps {
  recipe: Recipe;
  onSave: () => void;
  isSaved: boolean;
}

const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, onSave, isSaved }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-slate-700 p-5 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-start mb-2">
            <h4 className="text-xl font-semibold text-emerald-400">{recipe.name}</h4>
            <span className="text-xs bg-emerald-700 text-emerald-200 px-2 py-1 rounded-full">{recipe.cuisine} / {recipe.mealType}</span>
        </div>
        
        <div className="mb-3">
          <h5 className="font-medium text-slate-300 mb-1">Your Ingredients:</h5>
          {recipe.ingredientsFromMyList.length > 0 ? (
            <ul className="list-disc list-inside text-sm text-slate-400 pl-2">
              {recipe.ingredientsFromMyList.map((ing, idx) => <li key={`my-${idx}`}>{ing}</li>)}
            </ul>
          ) : (
            <p className="text-sm text-slate-500 italic">Uses common staples or general items.</p>
          )}
        </div>

        {recipe.additionalCommonIngredients && recipe.additionalCommonIngredients.length > 0 && (
          <div className="mb-3">
            <h5 className="font-medium text-slate-300 mb-1">Common Staples Needed:</h5>
            <ul className="list-disc list-inside text-sm text-slate-400 pl-2">
              {recipe.additionalCommonIngredients.map((ing, idx) => <li key={`common-${idx}`}>{ing}</li>)}
            </ul>
          </div>
        )}
      </div>
      
      <div>
        <div className="flex justify-between items-center mt-4">
            <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm text-teal-400 hover:text-teal-300 font-medium inline-flex items-center"
            aria-expanded={isExpanded}
            aria-controls={`recipe-instructions-${recipe.name.replace(/\s+/g, '-')}`}
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
                    : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                }`}
            >
                {isSaved ? 'Saved' : 'Save Recipe'}
            </button>
        </div>
        {isExpanded && (
           <div id={`recipe-instructions-${recipe.name.replace(/\s+/g, '-')}`} className="mt-2 text-sm text-slate-300 whitespace-pre-line bg-slate-650 p-3 rounded-md max-h-60 overflow-y-auto">
            {recipe.instructions}
          </div>
        )}
      </div>
    </div>
  );
};

export default RecipeCard;
