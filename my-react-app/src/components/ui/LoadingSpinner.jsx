
// components/ui/LoadingSpinner.jsx
import React from 'react';

export const LoadingSpinner = ({ size = 'md', message = 'Loading...' }) => {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-20 w-20'
  };

  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className={`animate-spin rounded-full border-b-4 border-blue-600 ${sizeClasses[size]}`}></div>
      {message && <p className="mt-6 text-gray-600 text-lg font-semibold">{message}</p>}
    </div>
  );
};
