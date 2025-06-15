
import React from 'react';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-slate-900 bg-opacity-75 flex items-center justify-center z-50">
      <div className="flex flex-col items-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-emerald-500"></div>
        <p className="text-emerald-400 text-lg mt-4 font-semibold">Generating Ideas...</p>
      </div>
    </div>
  );
};

export default LoadingSpinner;
    