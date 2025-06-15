
import React from 'react';

interface ShoppingListViewProps {
  items: string[];
  onClearList: () => void;
}

const ShoppingListView: React.FC<ShoppingListViewProps> = ({ items, onClearList }) => {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-semibold text-indigo-400">Your Shopping List</h2>
        {items.length > 0 && (
          <button
            onClick={onClearList}
            className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-150 ease-in-out text-sm flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12.56 0c1.153 0 2.243.096 3.242.26m3.242.26L9.754 16.332h4.492L14.74 5.79M4.772 5.79L4.772 4.125a2.25 2.25 0 012.25-2.25h8.956a2.25 2.25 0 012.25 2.25v1.666" />
            </svg>
            Clear List
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <p className="text-slate-400 text-center py-8">
          Your shopping list is empty. Save some recipes from the "Smart Shopping (TJ's)" tab to populate it!
        </p>
      ) : (
        <div className="bg-slate-700 p-6 rounded-lg shadow-lg">
          <ul className="space-y-3">
            {items.map((item, index) => (
              <li 
                key={index} 
                className="flex items-center p-3 bg-slate-600 rounded-md hover:bg-slate-550 transition-colors duration-150"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 mr-3 text-indigo-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                <span className="text-slate-200">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ShoppingListView;
