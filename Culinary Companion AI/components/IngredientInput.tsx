
import React, { useState } from 'react';

interface IngredientInputProps {
  onAdd: (name: string) => void;
  colorClass: string;
}

const IngredientInput: React.FC<IngredientInputProps> = ({ onAdd, colorClass }) => {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onAdd(name.trim());
      setName('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 mb-3">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Add item..."
        className="flex-grow p-2.5 bg-slate-600 border border-slate-500 rounded-lg text-slate-100 focus:ring-2 focus:ring-opacity-50 transition-shadow"
      />
      <button type="submit" className={`${colorClass} text-white font-semibold px-4 py-2.5 rounded-lg shadow-md hover:shadow-lg transition-all duration-150 ease-in-out`}>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      </button>
    </form>
  );
};

export default IngredientInput;
    