import React from 'react';
import MapView from '../components/MapView';
import { useTrackingStore } from '../stores/trackingStore';
import { Clock, MapPin } from 'lucide-react';

const formatDateTime = (date: Date | null) => {
  if (!date) return 'Never';
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

const LiveTrackingPage: React.FC = () => {
  const {
    isTracking,
    currentPosition,
    routePoints,
    stopPoints,
    lastUpdateTime
  } = useTrackingStore();

  const center = currentPosition || { lat: 40.7128, lng: -74.0060 };

  const formatDuration = (duration: number) => {
    const minutes = Math.floor(duration / (1000 * 60));
    return `${minutes} minutes`;
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Live Tracking</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <MapView 
            center={currentPosition || center}
            zoom={currentPosition ? 15 : 13}
            showRouteHistory={true}
            routePoints={routePoints}
            stopPoints={stopPoints}
            currentPosition={currentPosition}
            isTracking={isTracking}
          />
        </div>

        <div className="space-y-6">
          {/* Live Tracking Stats */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Tracking Statistics</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Total Distance</p>
                <p className="text-lg font-medium">
                  {(routePoints.length * 0.1).toFixed(1)} km
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Stops</p>
                <p className="text-lg font-medium">{stopPoints.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <p className={`text-lg font-medium ${isTracking ? 'text-green-600' : 'text-gray-600'}`}>
                  {isTracking ? 'Active' : 'Inactive'}
                </p>
              </div>
            </div>
          </div>

          {/* Stop Points Panel */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Stop Points</h2>
            <div className="space-y-3">
              {stopPoints.length > 0 ? (
                stopPoints.map((stop, index) => (
                  <div 
                    key={index}
                    className="p-3 bg-gray-50 rounded-lg space-y-2"
                  >
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span>
                        Started: {new Date(stop.startTime).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <span>
                        Location: {stop.position.lat.toFixed(4)}, {stop.position.lng.toFixed(4)}
                      </span>
                    </div>
                    {stop.duration && (
                      <div className="text-sm font-medium text-red-600">
                        Duration: {formatDuration(stop.duration)}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500">
                  No stops detected yet
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Live Location Indicator */}
      {isTracking && currentPosition && (
        <div className="fixed bottom-4 left-4 bg-white p-3 rounded-lg shadow-lg max-w-sm">
          <div className="flex items-center space-x-3">
            <div className="animate-pulse w-2 h-2 bg-green-500 rounded-full" />
            <div>
              <span className="text-sm font-medium text-gray-900">Live Location</span>
              <p className="text-xs text-gray-500">
                Last update: {formatDateTime(lastUpdateTime)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveTrackingPage; 