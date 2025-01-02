import React, { useEffect } from 'react';
import { useVehicleStore } from '../stores/vehicleStore';
import { useState } from 'react';

const DriverControls: React.FC = () => {
  const [error, setError] = useState<string>('');
  const { 
    updateVehiclePosition, 
    setDriverTracking, 
    isDriverTracking,
    watchId 
  } = useVehicleStore();

  useEffect(() => {
    // Restore tracking if it was active
    if (isDriverTracking && !watchId) {
      startTracking();
    }
    
    // Cleanup on unmount
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

      // Watch position
      const newWatchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          
          // Send location to WebSocket server
          if (window.socket) {
            window.socket.send(JSON.stringify({
              type: 'driver-location',
              vehicleId: 'driver-1',
              position: { lat: latitude, lng: longitude }
            }));
          }

          // Update local state
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
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Driver Controls</h2>
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Location Tracking</h3>
          <p className="text-gray-600 mb-4">
            Enable location tracking to share your position with the dispatch team.
          </p>
          {error && <p className="text-red-500 mb-4">{error}</p>}
          <button
            onClick={() => isDriverTracking ? stopTracking() : startTracking()}
            className={`px-6 py-2 rounded-lg ${
              isDriverTracking 
                ? 'bg-red-500 hover:bg-red-600' 
                : 'bg-blue-500 hover:bg-blue-600'
            } text-white transition-colors`}
          >
            {isDriverTracking ? 'Stop Tracking' : 'Start Tracking'}
          </button>
        </div>

        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-2">Current Status</h3>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${isDriverTracking ? 'bg-green-500' : 'bg-gray-400'}`} />
            <span>{isDriverTracking ? 'Active' : 'Inactive'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriverControls; 