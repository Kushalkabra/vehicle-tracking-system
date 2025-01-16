import React from 'react';
import { Activity, Clock } from 'lucide-react';

interface BackgroundTrackingStatusProps {
  isTracking: boolean;
  lastUpdateTime: Date | null;
  updatesCount: number;
}

const BackgroundTrackingStatus: React.FC<BackgroundTrackingStatusProps> = ({
  isTracking,
  lastUpdateTime,
  updatesCount
}) => {
  return (
    <div className="fixed bottom-4 left-4 z-50 bg-white rounded-lg shadow-lg p-4">
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <Activity className={`w-4 h-4 ${isTracking ? 'text-green-500' : 'text-gray-400'}`} />
          <span className="text-sm font-medium">
            Background Tracking: {isTracking ? 'Active' : 'Inactive'}
          </span>
        </div>
        
        {isTracking && (
          <>
            <div className="text-xs text-gray-500 flex items-center space-x-2">
              <Clock className="w-3 h-3" />
              <span>
                Last Update: {lastUpdateTime?.toLocaleTimeString() || 'Never'}
              </span>
            </div>
            <div className="text-xs text-gray-500">
              Updates sent: {updatesCount}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default BackgroundTrackingStatus; 