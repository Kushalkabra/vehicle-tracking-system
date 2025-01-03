import React, { useEffect } from 'react';
import { useVehicleStore } from '../stores/vehicleStore';
import { useState } from 'react';
import { Navigation, AlertCircle, CheckCircle2, Shield } from 'lucide-react';
import DebugPanel from '../components/DebugPanel';
import { calculateDistance, initGeometryLibrary } from '../utils/maps';

const UPDATE_INTERVAL = 30000; // 30 seconds in milliseconds
const STOP_THRESHOLD = 30 * 1000; // 30 seconds for testing
const MOVEMENT_THRESHOLD = 20; // 20 meters

const DriverControls: React.FC = () => {
  const [error, setError] = useState<string>('');
  const [intervalId, setIntervalId] = useState<number | null>(null);
  const { 
    updateVehiclePosition, 
    setDriverTracking, 
    isDriverTracking,
    addRoutePoint,
    addStopPoint,
    updateStopPoint 
  } = useVehicleStore();
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [lastPosition, setLastPosition] = useState<google.maps.LatLngLiteral | null>(null);
  const [stopStartTime, setStopStartTime] = useState<Date | null>(null);
  const [currentStopId, setCurrentStopId] = useState<string | null>(null);

  useEffect(() => {
    initGeometryLibrary();
  }, []);

  const checkForStop = (currentPosition: google.maps.LatLngLiteral) => {
    if (!lastPosition) {
      setLastPosition(currentPosition);
      return;
    }

    const distance = calculateDistance(lastPosition, currentPosition);
    console.log('Distance moved:', distance, 'meters');

    // If vehicle hasn't moved significantly
    if (distance < MOVEMENT_THRESHOLD) {
      if (!stopStartTime) {
        console.log('Vehicle stopped - starting timer');
        setStopStartTime(new Date());
        const newStopId = `stop-${Date.now()}`;
        setCurrentStopId(newStopId);
        addStopPoint(currentPosition);
      } else {
        const stopDuration = Date.now() - stopStartTime.getTime();
        console.log('Stop duration:', stopDuration / 1000, 'seconds');
        
        if (stopDuration >= STOP_THRESHOLD && currentStopId) {
          console.log('Stop threshold reached - recording stop');
          updateStopPoint(currentStopId, new Date());
        }
      }
    } else {
      // Vehicle is moving
      if (stopStartTime) {
        console.log('Vehicle started moving - resetting stop timer');
        setStopStartTime(null);
        setCurrentStopId(null);
      }
    }

    setLastPosition(currentPosition);
  };

  const updateLocation = () => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const currentPosition = { lat: latitude, lng: longitude };
        
        if (window.socket && window.socket.readyState === WebSocket.OPEN) {
          window.socket.send(JSON.stringify({
            type: 'driver-location',
            vehicleId: 'driver-1',
            position: currentPosition
          }));
        }

        updateVehiclePosition('driver-1', latitude, longitude);
        addRoutePoint(currentPosition);
        checkForStop(currentPosition);
        setLastUpdate(new Date());
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
  };

  const startTracking = async () => {
    try {
      if (!navigator.geolocation) {
        throw new Error('Geolocation is not supported by your browser');
      }

      // Get initial position
      updateLocation();

      // Set up interval for regular updates
      const newIntervalId = window.setInterval(updateLocation, UPDATE_INTERVAL);
      setIntervalId(newIntervalId);
      setDriverTracking(true, null);

    } catch (err: any) {
      setError(err.message);
      stopTracking();
    }
  };

  const stopTracking = () => {
    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }
    setDriverTracking(false, null);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, []);

  useEffect(() => {
    const handleMockUpdate = () => {
      if (isDriverTracking) {
        updateLocation();
      }
    };

    document.addEventListener('mockLocationUpdate', handleMockUpdate);
    
    return () => {
      document.removeEventListener('mockLocationUpdate', handleMockUpdate);
    };
  }, [isDriverTracking]);

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
          {lastUpdate && (
            <div className="p-4 bg-gray-50 rounded-lg mt-4">
              <p className="text-sm text-gray-600">
                Last Update: {lastUpdate.toLocaleTimeString()}
              </p>
            </div>
          )}
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
          </div>
        </div>
      </div>

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
      <DebugPanel />
    </div>
  );
};

export default DriverControls; 