import React from 'react';
import { AlertCircle, CheckCircle, XCircle, Info } from 'lucide-react';

export const Alert = ({ type = 'info', message, onClose }) => {
  const types = {
    success: {
      bg: 'bg-green-50',
      border: 'border-green-500',
      text: 'text-green-700',
      icon: CheckCircle
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-500',
      text: 'text-red-700',
      icon: XCircle
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-500',
      text: 'text-yellow-700',
      icon: AlertCircle
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-500',
      text: 'text-blue-700',
      icon: Info
    }
  };

  const config = types[type];
  const Icon = config.icon;

  return (
    <div className={`${config.bg} border-l-4 ${config.border} ${config.text} px-4 py-3 rounded mb-6 flex items-center justify-between`}>
      <div className="flex items-center">
        <Icon className="w-5 h-5 mr-2" />
        <span>{message}</span>
      </div>
      {onClose && (
        <button onClick={onClose} className="ml-4 hover:opacity-70">
          <XCircle className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
