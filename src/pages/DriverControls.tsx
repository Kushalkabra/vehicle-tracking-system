import React, { useEffect } from 'react';
import { useVehicleStore } from '../stores/vehicleStore';
import { useState } from 'react';
import { Navigation, AlertCircle, CheckCircle2, MapPin, Settings, Shield } from 'lucide-react';

const DriverControls: React.FC = () => {
  const [error, setError] = useState<string>('');
  const { 
    updateVehiclePosition, 
    setDriverTracking, 
    isDriverTracking,
    watchId 
  } = useVehicleStore();

  useEffect(() => {
    if (isDriverTracking && !watchId) {
      startTracking();
    }
    
    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, []);

  const startTracking = async () => {
    try {
      if (!navigator.geolocation) {
        throw new Error('Geolocation is not supported by your browser');
      }

      const newWatchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          
          if (window.socket) {
            window.socket.send(JSON.stringify({
              type: 'driver-location',
              vehicleId: 'driver-1',
              position: { lat: latitude, lng: longitude }
            }));
          }

          updateVehiclePosition('driver-1', latitude, longitude);
        },
        (error) => {
          setError(`Error: ${error.message}`);
          stopTracking();
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );

      setDriverTracking(true, newWatchId);
    } catch (err: any) {
      setError(err.message);
      stopTracking();
    }
  };

  const stopTracking = () => {
    if (watchId) {
      navigator.geolocation.clearWatch(watchId);
    }
    setDriverTracking(false, null);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Driver Controls</h2>
        <div className="flex items-center space-x-2 px-4 py-2 bg-white rounded-xl shadow-sm">
          <div className={`w-2 h-2 rounded-full ${isDriverTracking ? 'bg-emerald-500' : 'bg-gray-400'}`} />
          <span className="text-gray-600">{isDriverTracking ? 'Active' : 'Inactive'}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Main Control Card */}
        <div className="bg-white rounded-xl shadow-card overflow-hidden">
          <div className="p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center">
                <Navigation className="w-6 h-6 text-primary-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Location Tracking</h3>
                <p className="text-sm text-gray-500">Share your position with dispatch</p>
              </div>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 rounded-lg flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800">Location Error</p>
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              </div>
            )}

            <button
              onClick={() => isDriverTracking ? stopTracking() : startTracking()}
              className={`w-full py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 ${
                isDriverTracking 
                  ? 'bg-red-500 hover:bg-red-600 text-white' 
                  : 'bg-primary-500 hover:bg-primary-600 text-white'
              }`}
            >
              {isDriverTracking ? (
                <>
                  <Shield className="w-5 h-5" />
                  <span>Stop Tracking</span>
                </>
              ) : (
                <>
                  <Navigation className="w-5 h-5" />
                  <span>Start Tracking</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Status Card */}
        <div className="bg-white rounded-xl shadow-card overflow-hidden">
          <div className="p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-emerald-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Tracking Status</h3>
                <p className="text-sm text-gray-500">Current tracking information</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Settings className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-600">Status</span>
                  </div>
                  <span className={`text-sm font-medium ${
                    isDriverTracking ? 'text-emerald-600' : 'text-gray-500'
                  }`}>
                    {isDriverTracking ? 'Tracking Active' : 'Tracking Disabled'}
                  </span>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-600">Location Updates</span>
                  </div>
                  <span className="text-sm font-medium text-gray-500">
                    Every 30 seconds
                  </span>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Shield className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-600">Privacy</span>
                  </div>
                  <span className="text-sm font-medium text-gray-500">
                    Location Only
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Information */}
      <div className="bg-white rounded-xl shadow-card p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Location Tracking Information</h3>
        <div className="prose prose-sm text-gray-600 max-w-none">
          <p>
            When location tracking is enabled, your position will be shared with the dispatch team
            to help coordinate deliveries and provide accurate ETAs to customers. Your location
            is updated every 30 seconds to maintain battery efficiency.
          </p>
          <ul className="mt-4 space-y-2">
            <li>High accuracy GPS tracking</li>
            <li>Automatic geofence detection</li>
            <li>Battery-optimized updates</li>
            <li>Secure data transmission</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default DriverControls; 