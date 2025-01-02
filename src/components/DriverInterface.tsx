import React, { useEffect, useState } from 'react';
import { useVehicleStore } from '../stores/vehicleStore';

const DriverInterface: React.FC = () => {
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState<string>('');
  const updateVehiclePosition = useVehicleStore((state) => state.updateVehiclePosition);

  const startTracking = async () => {
    try {
      if (!navigator.geolocation) {
        throw new Error('Geolocation is not supported by your browser');
      }

      setIsTracking(true);
      
      // Watch position
      navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, lng } = position.coords;
          
          // Send location to WebSocket server
          if (window.socket) {
            window.socket.send(JSON.stringify({
              type: 'driver-location',
              vehicleId: 'driver-1', // In real app, this would be the driver's ID
              position: { lat: latitude, lng }
            }));
          }

          // Update local state
          updateVehiclePosition('driver-1', latitude, lng);
        },
        (error) => {
          setError(`Error: ${error.message}`);
          setIsTracking(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
    } catch (err) {
      setError(err.message);
      setIsTracking(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 p-4 bg-white rounded-lg shadow-lg">
      <h3 className="text-lg font-semibold mb-2">Driver Controls</h3>
      {error && <p className="text-red-500 mb-2">{error}</p>}
      <button
        onClick={() => isTracking ? setIsTracking(false) : startTracking()}
        className={`px-4 py-2 rounded-lg ${
          isTracking 
            ? 'bg-red-500 hover:bg-red-600' 
            : 'bg-blue-500 hover:bg-blue-600'
        } text-white`}
      >
        {isTracking ? 'Stop Tracking' : 'Start Tracking'}
      </button>
    </div>
  );
};

export default DriverInterface; 