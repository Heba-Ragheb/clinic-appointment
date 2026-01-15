// components/dashboard/StatsCard.jsx
import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

/**
 * Statistics Card Component
 * Displays key metrics with optional change indicators
 */
export const StatsCard = ({ 
  icon: Icon, 
  title, 
  value, 
  change, 
  color = 'bg-gradient-to-br from-blue-500 to-blue-600',
  trend = 'up',
  subtitle
}) => {
  const TrendIcon = trend === 'up' ? TrendingUp : TrendingDown;
  const trendColor = trend === 'up' ? 'text-green-600' : 'text-red-600';

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-800 mb-2">{value}</p>
          
          {subtitle && (
            <p className="text-sm text-gray-500">{subtitle}</p>
          )}
          
          {change !== undefined && change !== null && (
            <div className={`text-sm mt-2 flex items-center ${trendColor}`}>
              <TrendIcon className="w-4 h-4 mr-1" />
              <span>
                {change > 0 ? '+' : ''}{change}% from last month
              </span>
            </div>
          )}
        </div>
        
        <div className={`w-16 h-16 rounded-2xl ${color} flex items-center justify-center shadow-lg`}>
          <Icon className="w-8 h-8 text-white" />
        </div>
      </div>
    </div>
  );
};

export default StatsCard;