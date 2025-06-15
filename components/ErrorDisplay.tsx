
import React from 'react';

interface ErrorDisplayProps {
  message: string;
  onClose?: () => void;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ message, onClose }) => {
  return (
    <div className="fixed bottom-5 right-5 bg-red-600 text-white p-4 rounded-lg shadow-xl max-w-md z-50">
      <div className="flex justify-between items-center">
        <div>
            <h4 className="font-bold mb-1">Error</h4>
            <p className="text-sm">{message}</p>
        </div>
        {onClose && (
            <button onClick={onClose} className="ml-4 text-red-100 hover:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        )}
      </div>
    </div>
  );
};

export default ErrorDisplay;
    