import React from 'react';

export const Card = ({ children, className = '', hover = false }) => {
  return (
    <div className={`
      bg-white rounded-2xl shadow-lg p-6 
      ${hover ? 'hover:shadow-xl transition-shadow' : ''}
      ${className}
    `}>
      {children}
    </div>
  );
};