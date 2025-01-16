import React from 'react';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { Wifi, WifiOff, AlertTriangle } from 'lucide-react';

const NetworkStatus: React.FC = () => {
  const { isOnline, networkType, effectiveType } = useNetworkStatus();

  const getConnectionQuality = () => {
    if (!effectiveType) return null;
    switch (effectiveType) {
      case '4g':
        return { color: 'text-green-600', bg: 'bg-green-100', text: 'Excellent' };
      case '3g':
        return { color: 'text-blue-600', bg: 'bg-blue-100', text: 'Good' };
      case '2g':
        return { color: 'text-yellow-600', bg: 'bg-yellow-100', text: 'Poor' };
      case 'slow-2g':
        return { color: 'text-red-600', bg: 'bg-red-100', text: 'Very Poor' };
      default:
        return { color: 'text-gray-600', bg: 'bg-gray-100', text: 'Unknown' };
    }
  };

  const quality = getConnectionQuality();

  return (
    <div className={`fixed top-16 right-4 z-50 px-3 py-2 rounded-lg shadow-lg
      ${isOnline ? quality?.bg || 'bg-white' : 'bg-red-100'}`}
    >
      <div className="flex items-center space-x-2">
        {isOnline ? (
          effectiveType === 'slow-2g' || effectiveType === '2g' ? (
            <AlertTriangle className="w-4 h-4 text-yellow-600" />
          ) : (
            <Wifi className={`w-4 h-4 ${quality?.color || 'text-green-600'}`} />
          )
        ) : (
          <WifiOff className="w-4 h-4 text-red-600" />
        )}
        <div className="flex flex-col">
          <span className={`text-sm font-medium ${
            isOnline ? quality?.color || 'text-green-800' : 'text-red-800'
          }`}>
            {isOnline ? 'Connected' : 'Offline'}
          </span>
          {isOnline && effectiveType && (
            <span className="text-xs text-gray-600">
              {quality?.text} ({networkType || effectiveType})
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default NetworkStatus; 