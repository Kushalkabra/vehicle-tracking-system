import React, { useState, useRef, useEffect, useCallback } from 'react';
import MapView from '../components/MapView';
import VehicleList from '../components/VehicleList';
import { useVehicleStore } from '../stores/vehicleStore';
import { Clock, MapPin, AlertCircle, Navigation, Shield } from 'lucide-react';
import { useVehicles } from '../context/VehicleContext';
import { calculateDistance, MOVEMENT_THRESHOLD, calculateTotalDistance } from '../utils/maps';
import toast from 'react-hot-toast';
import { useTrackingStore } from '../stores/trackingStore';
import { useDriverStore } from '../stores/driverStore';
import { useWakeLock } from '../hooks/useWakeLock';
import { db } from '../utils/db';
import { usePWA } from '../hooks/usePWA';
import BackgroundTrackingStatus from '../components/BackgroundTrackingStatus';

const DEBUG_MODE = true;

const UPDATE_INTERVAL = 5000; // 5 seconds
const STOP_DETECTION_TIME = 30000; // 30 seconds
const ACCURACY_THRESHOLD = 100; // Increased to 100 meters for initial tracking
const POSITION_FILTER_THRESHOLD = 20; // Increased to 20 meters

const ACCURACY_LEVELS = {
  EXCELLENT: 20,
  GOOD: 50,
  FAIR: 100,
  POOR: 500,
  VERY_POOR: 1000
};

const GEOLOCATION_OPTIONS = {
  enableHighAccuracy: true,
  timeout: 20000,    // Increased to 20 seconds
  maximumAge: 5000,  // Increased to 5 seconds
};

const WAKE_LOCK_OPTIONS = {
  type: 'screen' as WakeLockType
};

const DashboardPage: React.FC = () => {
  const { socket, sendMessage } = useVehicles();
  const { driverName, setDriverName } = useDriverStore();
  const [error, setError] = useState<string | null>(null);
  const [lastKnownAccuracy, setLastKnownAccuracy] = useState<number>(0);
  const { wakeLock, requestWakeLock, releaseWakeLock } = useWakeLock();
  const { isInstallable, installApp } = usePWA();

  // Use tracking store
  const {
    isTracking,
    currentPosition,
    lastUpdateTime,
    routePoints,
    stopPoints,
    isDetectingStop,
    isPermissionGranted,
    setTracking,
    setCurrentPosition,
    setLastUpdateTime,
    addRoutePoint,
    setRoutePoints,
    addStopPoint,
    setStopPoints,
    setIsDetectingStop,
    setPermissionGranted,
    resetAll
  } = useTrackingStore();

  const watchIdRef = useRef<number | null>(null);
  const lastPositionRef = useRef<google.maps.LatLngLiteral | null>(null);
  const stopTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentStopRef = useRef<{
    position: google.maps.LatLngLiteral;
    startTime: Date;
  } | null>(null);

  const vehicles = useVehicleStore((state) => state.vehicles);
  const center = currentPosition || { lat: 40.7128, lng: -74.0060 };

  const mapRef = useRef<google.maps.Map | null>(null);
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [backgroundUpdatesCount, setBackgroundUpdatesCount] = useState(0);
  const [lastBackgroundUpdate, setLastBackgroundUpdate] = useState<Date | null>(null);

  // Format helpers
  const formatDuration = (duration: number) => {
    const minutes = Math.floor(duration / (1000 * 60));
    return `${minutes} minutes`;
  };

  const formatTime = (timestamp: Date) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const requestLocationPermission = async () => {
    try {
      console.log('Requesting location permission...');
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log('Initial position:', position.coords);
          setPermissionGranted(true);
          const newPosition = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setCurrentPosition(newPosition);
          toast.success('Location access granted');
          
          // Automatically start tracking when permission is granted
          startTracking();
        },
        (error) => {
          console.error('Error getting initial position:', error);
          setPermissionGranted(false);
          toast.error('Could not get your location. Please check your location settings.');
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    } catch (err) {
      console.error('Error requesting permission:', err);
      setError('Error requesting location permission');
      toast.error('Error requesting location permission');
    }
  };

  // Add an effect to check permission status on mount
  useEffect(() => {
    if (!isPermissionGranted) {
      navigator.permissions.query({ name: 'geolocation' })
        .then(result => {
          if (result.state === 'granted') {
            setPermissionGranted(true);
          }
        });
    }
  }, [isPermissionGranted, setPermissionGranted]);

  const stopTracking = useCallback(() => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    
    releaseWakeLock();
    currentStopRef.current = null;
    lastPositionRef.current = null;
    resetAll();
    toast.success('Tracking stopped');
  }, [releaseWakeLock, resetAll]);

  const getAccuracyLevel = (accuracy: number) => {
    if (accuracy <= ACCURACY_LEVELS.EXCELLENT) return 'Excellent';
    if (accuracy <= ACCURACY_LEVELS.GOOD) return 'Good';
    if (accuracy <= ACCURACY_LEVELS.FAIR) return 'Fair';
    if (accuracy <= ACCURACY_LEVELS.POOR) return 'Poor';
    if (accuracy <= ACCURACY_LEVELS.VERY_POOR) return 'Very Poor';
    return 'Extremely Poor';
  };

  const filterPosition = (newPosition: GeolocationPosition, lastPosition: google.maps.LatLngLiteral | null): boolean => {
    if (!lastPosition) return true;

    const accuracy = newPosition.coords.accuracy;
    console.log('GPS Accuracy:', accuracy, 'meters -', getAccuracyLevel(accuracy));

    // Dynamic threshold based on accuracy
    const dynamicThreshold = Math.max(accuracy / 2, POSITION_FILTER_THRESHOLD);
    
    // Calculate distance
    const distance = calculateDistance(
      { lat: newPosition.coords.latitude, lng: newPosition.coords.longitude },
      lastPosition
    );

    // Reject updates based on accuracy and movement
    if (accuracy > ACCURACY_LEVELS.VERY_POOR && distance < dynamicThreshold) {
      console.log('Position rejected: poor accuracy and minimal movement');
      return false;
    }

    return true;
  };

  const isSignificantMovement = (pos1: google.maps.LatLngLiteral, pos2: google.maps.LatLngLiteral): boolean => {
    const distance = calculateDistance(pos1, pos2);
    return distance > MOVEMENT_THRESHOLD;
  };

  const startTracking = useCallback(async () => {
    if (!driverName || !socket) {
      toast.error('Please enter your name and check connection');
      return;
    }

    try {
      // Request wake lock when starting tracking
      await requestWakeLock();
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const accuracy = position.coords.accuracy;
          setLastKnownAccuracy(accuracy);
          console.log('Initial GPS Accuracy:', accuracy, 'meters -', getAccuracyLevel(accuracy));
          
          // Show warning for poor accuracy but continue tracking
          if (accuracy > ACCURACY_LEVELS.VERY_POOR) {
            toast((t) => (
              <div>
                <p className="font-medium">GPS signal is weak ({Math.round(accuracy)}m)</p>
                <p className="text-sm mt-1">Location tracking will continue, but accuracy may be reduced.</p>
                <ul className="mt-2 text-sm">
                  <li>• Move to an open outdoor area</li>
                  <li>• Move away from buildings</li>
                  <li>• Check if GPS is enabled</li>
                  <li>• Wait a few moments for better signal</li>
                </ul>
              </div>
            ), { 
              duration: 10000,
              icon: '⚠️',
              style: {
                backgroundColor: '#FEF3C7', // Light yellow background
                color: '#92400E' // Brown text
              }
            });
          } else if (accuracy > ACCURACY_LEVELS.POOR) {
            toast(
              `GPS accuracy is ${Math.round(accuracy)}m (${getAccuracyLevel(accuracy)}). ` +
              'Consider moving to a more open area for better tracking.',
              { 
                duration: 5000,
                icon: '⚠️',
                style: {
                  backgroundColor: '#FEF3C7', // Light yellow background
                  color: '#92400E', // Brown text for warning
                  borderLeft: '4px solid #F59E0B' // Orange border
                }
              }
            );
          }

          const initialPosition = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };

          // Initialize tracking regardless of accuracy
          setTracking(true);
          setCurrentPosition(initialPosition);
          setLastUpdateTime(new Date());
          lastPositionRef.current = initialPosition;

          const initialVehicleData = {
            id: driverName.toLowerCase().replace(/\s+/g, '-'),
            name: driverName,
            position: initialPosition,
            status: 'active',
            lastUpdate: new Date().toISOString(),
            isDriver: true,
            driverName: driverName
          };

          console.log('Sending initial vehicle data:', initialVehicleData);
          sendMessage('driverLocationUpdate', initialVehicleData);

          // Use watchPosition instead of setInterval
          const watchId = navigator.geolocation.watchPosition(
            handleNewPosition,
            handlePositionError,
            {
              ...GEOLOCATION_OPTIONS,
              maximumAge: 0
            }
          );

          watchIdRef.current = watchId;
          toast.success('Tracking started');
        },
        handlePositionError,
        GEOLOCATION_OPTIONS
      );
    } catch (error) {
      console.error('Error starting tracking:', error);
      toast.error('Failed to start tracking');
    }
  }, [driverName, socket, requestWakeLock]);

  // Add cleanup effect
  useEffect(() => {
    return () => {
      if (stopTimeoutRef.current) {
        clearTimeout(stopTimeoutRef.current);
      }
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      currentStopRef.current = null;
      lastPositionRef.current = null;
    };
  }, []);

  const handleNewPosition = async (position: GeolocationPosition) => {
    const newPosition = {
      lat: position.coords.latitude,
      lng: position.coords.longitude
    };

    // Update local state
    setCurrentPosition(newPosition);
    setLastUpdateTime(new Date());
    setLastKnownAccuracy(position.coords.accuracy);

    // Handle stop detection
    if (lastPositionRef.current) {
      const hasMovement = isSignificantMovement(lastPositionRef.current, newPosition);

      if (!hasMovement) {
        // Vehicle might be stopped
        if (!currentStopRef.current) {
          // Start new stop detection
          currentStopRef.current = {
            position: newPosition,
            startTime: new Date()
          };
          setIsDetectingStop(true);

          // Set timeout to confirm stop
          stopTimeoutRef.current = setTimeout(() => {
            if (currentStopRef.current) {
              // Add stop point after threshold time
              addStopPoint({
                position: currentStopRef.current.position,
                startTime: currentStopRef.current.startTime,
                duration: Date.now() - currentStopRef.current.startTime.getTime()
              });
              console.log('Stop detected:', currentStopRef.current);
            }
          }, STOP_DETECTION_TIME);
        }
      } else {
        // Vehicle is moving
        if (currentStopRef.current) {
          // Clear stop detection
          if (stopTimeoutRef.current) {
            clearTimeout(stopTimeoutRef.current);
            stopTimeoutRef.current = null;
          }
          currentStopRef.current = null;
          setIsDetectingStop(false);
        }
      }
    }

    // Update route
    if (lastPositionRef.current && isSignificantMovement(lastPositionRef.current, newPosition)) {
      addRoutePoint(newPosition);
    }

    // Update last known position
    lastPositionRef.current = newPosition;

    // Send update to server
    const locationUpdate = {
      id: `${Date.now()}`,
      timestamp: new Date().toISOString(),
      position: newPosition,
      driverName
    };

    try {
      if (socket?.readyState === WebSocket.OPEN) {
        sendMessage('driverLocationUpdate', locationUpdate);
      } else {
        await db.saveLocationUpdate(locationUpdate);
        console.log('Saved location update to IndexedDB');
      }
    } catch (error) {
      console.error('Error handling position update:', error);
      toast.error('Failed to save location update');
    }

    // Track background updates
    setBackgroundUpdatesCount(prev => prev + 1);
    setLastBackgroundUpdate(new Date());
  };

  const handlePositionError = (error: GeolocationPositionError) => {
    console.error('Geolocation error:', error);
    switch(error.code) {
      case error.PERMISSION_DENIED:
        toast.error('Location permission denied');
        break;
      case error.POSITION_UNAVAILABLE:
        toast.error('Location unavailable. Check GPS settings');
        break;
      case error.TIMEOUT:
        toast.error('Location request timed out');
        break;
      default:
        toast.error('Could not get your location');
    }
  };

  const GPSAccuracyIndicator = ({ accuracy }: { accuracy: number }) => {
    const level = getAccuracyLevel(accuracy);
    const getColorClass = () => {
      if (accuracy <= ACCURACY_LEVELS.EXCELLENT) return 'bg-green-500';
      if (accuracy <= ACCURACY_LEVELS.GOOD) return 'bg-green-400';
      if (accuracy <= ACCURACY_LEVELS.FAIR) return 'bg-yellow-500';
      if (accuracy <= ACCURACY_LEVELS.POOR) return 'bg-orange-500';
      if (accuracy <= ACCURACY_LEVELS.VERY_POOR) return 'bg-red-500';
      return 'bg-red-600';
    };

    return (
      <div className="fixed bottom-4 right-4 bg-white p-3 rounded-lg shadow-lg">
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${getColorClass()}`} />
          <span className="text-sm font-medium">
            GPS Accuracy: {Math.round(accuracy)}m ({level})
          </span>
        </div>
      </div>
    );
  };

  const requestBackgroundPermission = async () => {
    try {
      // Request background location permission
      if ('permissions' in navigator) {
        const result = await navigator.permissions.query({
          name: 'geolocation'
        });
        
        if (result.state === 'granted') {
          toast.success('Location access granted');
        } else {
          toast('Background location access needed for continuous tracking', {
            icon: '⚠️',
            style: {
              backgroundColor: '#FEF3C7',
              color: '#92400E',
              borderLeft: '4px solid #F59E0B'
            }
          });
        }
      }
    } catch (error) {
      console.error('Error requesting background permission:', error);
    }
  };

  // Add visibility change handler
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && isTracking && !wakeLock) {
        await requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isTracking, wakeLock, requestWakeLock]);

  useEffect(() => {
    if (isTracking) {
      toast((t) => (
        <div>
          <p className="font-medium">Important Notice</p>
          <p className="text-sm">
            Location tracking will stop when your screen is off. 
            Keep the app open and screen on for continuous tracking.
          </p>
        </div>
      ), {
        duration: 6000,
        position: 'top-center',
      });
    }
  }, [isTracking]);

  return (
    <div className="p-2 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Live Tracking</h1>
        
        {/* Tracking Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
          <input
            type="text"
            value={driverName}
            onChange={(e) => setDriverName(e.target.value)}
            disabled={isTracking}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 w-full sm:w-auto"
            placeholder="Enter driver name"
          />
          
          {!isPermissionGranted ? (
            <button
              onClick={requestLocationPermission}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center justify-center space-x-2 w-full sm:w-auto"
            >
              <Shield className="w-5 h-5" />
              <span>Allow Location</span>
            </button>
          ) : (
            <button
              onClick={isTracking ? stopTracking : startTracking}
              disabled={!driverName}
              className={`px-4 py-2 rounded-lg flex items-center justify-center space-x-2 w-full sm:w-auto ${
                isTracking
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-primary-600 hover:bg-primary-700 text-white'
              }`}
            >
              <Navigation className="w-5 h-5" />
              <span>{isTracking ? 'Stop Tracking' : 'Start Tracking'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Status Bar */}
      {isTracking && (
        <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 w-full">
            <div className="flex items-center space-x-2">
              <div className="animate-pulse w-2 h-2 bg-green-500 rounded-full" />
              <span className="text-sm text-gray-600">Live Tracking Active</span>
            </div>
            <div className="text-sm text-gray-600">
              Updates every 5 seconds
            </div>
          </div>
          {currentPosition && (
            <div className="text-sm text-gray-600 w-full sm:w-auto text-left sm:text-right">
              Last Update: {lastUpdateTime?.toLocaleString()}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Map Section */}
        <div className="lg:col-span-2 h-[400px] sm:h-[500px]">
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
        
        {/* Sidebar */}
        <div className="space-y-4 sm:space-y-6">
          <VehicleList />
          
          {/* Tracking Statistics Panel */}
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 sm:w-10 h-8 sm:h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <Navigation className="w-5 sm:w-6 h-5 sm:h-6 text-blue-500" />
              </div>
              <h2 className="text-base sm:text-lg font-semibold">Tracking Statistics</h2>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Total Distance</p>
                <p className="text-lg font-medium">
                  {Array.isArray(routePoints) ? 
                    `${calculateTotalDistance(routePoints).toFixed(2)} km` : 
                    '0 km'
                  }
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Stops</p>
                <p className="text-lg font-medium">
                  {Array.isArray(stopPoints) ? stopPoints.length : 0}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <p className={`text-lg font-medium ${isTracking ? 'text-green-600' : 'text-gray-600'}`}>
                  {isTracking ? 'Active' : 'Inactive'}
                </p>
              </div>
            </div>
          </div>

          {/* Stop Detection Panel */}
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 sm:w-10 h-8 sm:h-10 rounded-lg bg-red-50 flex items-center justify-center">
                <AlertCircle className="w-5 sm:w-6 h-5 sm:h-6 text-red-500" />
              </div>
              <h2 className="text-base sm:text-lg font-semibold">Stop Detections</h2>
            </div>

            {Array.isArray(stopPoints) && stopPoints.length > 0 ? (
              stopPoints.map((stop, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg space-y-2">
                  <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-600">
                    <Clock className="w-4 h-4 flex-shrink-0" />
                    <span>Started: {formatTime(stop.startTime)}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-600">
                    <MapPin className="w-4 h-4 flex-shrink-0" />
                    <span className="break-all">
                      Location: {stop.position.lat.toFixed(4)}, {stop.position.lng.toFixed(4)}
                    </span>
                  </div>

                  {stop.duration && (
                    <div className="text-xs sm:text-sm font-medium text-red-600">
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

      {/* Live Location Indicator */}
      {isTracking && currentPosition && (
        <div className="fixed bottom-2 sm:bottom-4 right-2 sm:right-4 bg-white p-2 sm:p-3 rounded-lg shadow-lg max-w-[calc(100%-1rem)] sm:max-w-sm">
          <div className="flex items-center space-x-3">
            <div className="animate-pulse w-2 h-2 bg-green-500 rounded-full flex-shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-medium text-gray-900 truncate">Live Location</span>
              <span className="text-xs text-gray-500 truncate">
                Last update: {lastUpdateTime?.toLocaleString()}
              </span>
              <span className="text-xs text-gray-500">
                Updates every 5 seconds
              </span>
            </div>
          </div>
        </div>
      )}

      {isTracking && currentPosition && (
        <GPSAccuracyIndicator 
          accuracy={lastKnownAccuracy} // You'll need to track this in state
        />
      )}

      <BackgroundTrackingStatus 
        isTracking={isTracking}
        lastUpdateTime={lastBackgroundUpdate}
        updatesCount={backgroundUpdatesCount}
      />
    </div>
  );
};

export default DashboardPage; 