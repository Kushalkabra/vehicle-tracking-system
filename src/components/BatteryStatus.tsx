import React from 'react';
import { Battery, BatteryCharging, BatteryWarning } from 'lucide-react';
import { useBatteryStatus } from '../hooks/useBatteryStatus';

const BatteryStatus: React.FC = () => {
  const { batteryLevel, isCharging, isBatteryLow } = useBatteryStatus();

  if (batteryLevel === null) return null;

  return (
    <div className={`fixed top-4 right-4 z-50 px-3 py-2 rounded-lg shadow-lg flex items-center space-x-2
      ${isBatteryLow ? 'bg-red-100' : isCharging ? 'bg-green-100' : 'bg-white'}`}
    >
      <div className="flex items-center space-x-2">
        {isCharging ? (
          <BatteryCharging className="w-4 h-4 text-green-600" />
        ) : isBatteryLow ? (
          <BatteryWarning className="w-4 h-4 text-red-600" />
        ) : (
          <Battery className="w-4 h-4 text-gray-600" />
        )}
        <span className={`text-sm font-medium ${
          isBatteryLow ? 'text-red-800' : 
          isCharging ? 'text-green-800' : 
          'text-gray-800'
        }`}>
          {Math.round(batteryLevel)}%
        </span>
      </div>
      {isBatteryLow && !isCharging && (
        <span className="text-xs text-red-600">Low battery!</span>
      )}
    </div>
  );
};

export default BatteryStatus; 