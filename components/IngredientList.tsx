
import React from 'react';
import { Ingredient } from '../types';
import IngredientInput from './IngredientInput';

interface IngredientListProps {
  title: string;
  IconComponent: React.FC<{className?: string}>;
  items: Ingredient[];
  onAdd: (name: string) => void;
  onDelete: (id: string) => void;
  colorClass: string;
}

const IngredientList: React.FC<IngredientListProps> = ({ title, IconComponent, items, onAdd, onDelete, colorClass }) => {
  return (
    <div className="p-5 bg-slate-700 rounded-xl shadow-lg h-full flex flex-col">
      <div className="flex items-center mb-4">
        <IconComponent className={`mr-3 ${colorClass.split(' ')[0].replace('bg-', 'text-')}-400`} />
        <h3 className={`text-2xl font-semibold ${colorClass.split(' ')[0].replace('bg-', 'text-')}-400`}>{title}</h3>
      </div>
      <IngredientInput onAdd={onAdd} colorClass={colorClass}/>
      {items.length === 0 ? (
        <p className="text-slate-400 text-sm mt-2 flex-grow flex items-center justify-center">No items yet. Add some!</p>
      ) : (
        <ul className="space-y-2 overflow-y-auto flex-grow max-h-60 pr-1">
          {items.map(item => (
            <li key={item.id} className="flex justify-between items-center bg-slate-600 p-2.5 rounded-md shadow hover:shadow-md transition-shadow">
              <span className="text-slate-200">{item.name}</span>
              <button onClick={() => onDelete(item.id)} className="text-red-400 hover:text-red-300 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12.56 0c1.153 0 2.243.096 3.242.26m3.242.26L9.754 16.332h4.492L14.74 5.79M4.772 5.79L4.772 4.125a2.25 2.25 0 012.25-2.25h8.956a2.25 2.25 0 012.25 2.25v1.666" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default IngredientList;
    