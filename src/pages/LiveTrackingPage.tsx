import React, { useEffect, useState } from 'react';
import { useVehicleStore } from '../stores/vehicleStore';
import { MapIcon, Navigation, Clock, Route, MapPin } from 'lucide-react';
import MapView from '../components/MapView';
import { toast } from 'react-hot-toast';

interface TrackingInfo {
  remainingDistance: string;
  remainingTime: string;
  progress: number;
  destination?: google.maps.LatLngLiteral;
  routePath?: google.maps.LatLngLiteral[];
}

const LiveTrackingPage: React.FC = () => {
  const [trackingInfo, setTrackingInfo] = useState<TrackingInfo | null>(null);
  const [error, setError] = useState<string>('');
  
  const vehicles = useVehicleStore((state) => state.vehicles);
  const destination = useVehicleStore((state) => state.destination);
  const driverVehicle = vehicles.find(v => v.id === 'driver-1');
  const driverLocation = driverVehicle?.position;
  const geofences = useVehicleStore((state) => state.geofences);

  // Start tracking automatically when component mounts if destination exists
  useEffect(() => {
    if (destination && driverLocation && !trackingInfo) {
      startTracking();
    }
  }, [destination, driverLocation]);

  const startTracking = async () => {
    if (!driverLocation) {
      setError('Driver location not available. Please enable tracking first.');
      return;
    }

    if (!destination) {
      setError('No destination set. Please set a destination in Route Planning.');
      return;
    }

    try {
      setTrackingInfo({
        remainingDistance: 'Calculating...',
        remainingTime: 'Calculating...',
        progress: 0,
        destination: destination.location
      });
      setError('');
    } catch (err: any) {
      setError(err.message || 'Error starting tracking');
    }
  };

  // Update tracking info every 30 seconds
  useEffect(() => {
    if (!driverLocation || !trackingInfo?.destination) return;

    const updateTrackingInfo = async () => {
      try {
        const directionsService = new google.maps.DirectionsService();
        
        const route = await directionsService.route({
          origin: driverLocation,
          destination: trackingInfo.destination,
          travelMode: google.maps.TravelMode.DRIVING,
        });

        if (route.routes[0] && route.routes[0].legs[0]) {
          const leg = route.routes[0].legs[0];
          const path = route.routes[0].overview_path.map(point => ({
            lat: point.lat(),
            lng: point.lng(),
          }));

          setTrackingInfo(prev => ({
            ...prev!,
            remainingDistance: leg.distance?.text || '',
            remainingTime: leg.duration?.text || '',
            routePath: path,
            progress: calculateProgress(leg.distance?.value || 0, prev?.progress || 0)
          }));
        }
      } catch (err: any) {
        setError('Error updating tracking information');
      }
    };

    const interval = setInterval(updateTrackingInfo, 30000);
    updateTrackingInfo(); // Initial update

    return () => clearInterval(interval);
  }, [driverLocation, trackingInfo?.destination]);

  const calculateProgress = (remainingMeters: number, previousProgress: number) => {
    // Simple progress calculation - can be made more sophisticated
    const maxDistance = 100000; // 100km as max distance
    const progress = 100 - (remainingMeters / maxDistance * 100);
    return Math.max(previousProgress, Math.min(100, progress));
  };

  // Add geofence checking
  useEffect(() => {
    if (!driverLocation) return;

    geofences.forEach(geofence => {
      const distance = google.maps.geometry.spherical.computeDistanceBetween(
        new google.maps.LatLng(driverLocation),
        new google.maps.LatLng(geofence.center)
      );

      if (distance <= geofence.radius) {
        toast.success(`Entered geofence: ${geofence.name}`);
      }
    });
  }, [driverLocation, geofences]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Live Tracking</h2>
        {destination && (
          <div className="flex items-center space-x-2 px-4 py-2 bg-white rounded-xl shadow-sm">
            <MapPin size={18} className="text-primary-500" />
            <span className="text-gray-600">{destination.address}</span>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl shadow-card overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center">
                    <Navigation className="w-5 h-5 text-primary-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800">Live Location</h3>
                </div>
                {trackingInfo && (
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-full">
                      <Clock size={14} />
                      <span>{trackingInfo.remainingTime}</span>
                    </div>
                    <div className="flex items-center space-x-2 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-full">
                      <Route size={14} />
                      <span>{trackingInfo.remainingDistance}</span>
                    </div>
                  </div>
                )}
              </div>
              <div className="h-[600px] rounded-xl overflow-hidden border border-gray-100">
                <MapView
                  center={driverLocation || { lat: 40.7128, lng: -74.0060 }}
                  zoom={12}
                  routePath={trackingInfo?.routePath}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-card p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Tracking Details</h3>
            
            <div className="space-y-4">
              {!destination ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-primary-50 flex items-center justify-center mx-auto mb-4">
                    <MapPin className="w-8 h-8 text-primary-500" />
                  </div>
                  <p className="text-gray-500 mb-4">No destination set</p>
                  <button
                    onClick={() => onNavigate('route-planning')}
                    className="text-primary-500 hover:text-primary-600 font-medium"
                  >
                    Set destination in Route Planning
                  </button>
                </div>
              ) : !trackingInfo ? (
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-gray-700 font-medium mb-1">Destination</p>
                    <p className="text-gray-600">{destination.address}</p>
                  </div>
                  <button
                    onClick={startTracking}
                    className="w-full bg-primary-500 text-white px-4 py-3 rounded-lg hover:bg-primary-600 transition-colors duration-200 flex items-center justify-center space-x-2"
                  >
                    <Navigation className="w-5 h-5" />
                    <span>Start Tracking</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Progress section */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Progress</span>
                      <span className="font-medium">{trackingInfo.progress.toFixed(1)}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary-500 rounded-full transition-all duration-500"
                        style={{ width: `${trackingInfo.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-500 mb-1">Time Left</p>
                      <p className="text-lg font-semibold text-gray-800">{trackingInfo.remainingTime}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-500 mb-1">Distance</p>
                      <p className="text-lg font-semibold text-gray-800">{trackingInfo.remainingDistance}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => setTrackingInfo(null)}
                    className="w-full bg-gray-100 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                  >
                    Stop Tracking
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveTrackingPage; 