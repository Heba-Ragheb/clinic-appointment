import React from 'react';

export const Input = React.forwardRef(({ 
  label, 
  error, 
  type = 'text',
  required = false,
  className = '',
  ...props 
}, ref) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        ref={ref}
        type={type}
        required={required}
        className={`
          w-full px-4 py-3 border border-gray-300 rounded-xl 
          focus:ring-2 focus:ring-blue-500 focus:border-transparent 
          transition-all
          ${error ? 'border-red-500 focus:ring-red-500' : ''}
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';