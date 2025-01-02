import React, { useEffect, useState } from 'react';
import { useVehicleStore } from '../stores/vehicleStore';
import { MapIcon, Navigation, Clock, Route } from 'lucide-react';
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
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Live Tracking</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-3xl mx-auto">
            <div className="flex items-center mb-4">
              <MapIcon className="w-6 h-6 text-blue-500 mr-2" />
              <h3 className="text-lg font-semibold">Live Location</h3>
            </div>
            <div className="h-[400px] rounded-lg overflow-hidden border border-gray-200">
              <MapView
                center={driverLocation || { lat: 40.7128, lng: -74.0060 }}
                zoom={12}
                routePath={trackingInfo?.routePath}
              />
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Tracking Details</h3>
            
            <div className="space-y-4">
              {!destination ? (
                <div className="text-center p-4">
                  <p className="text-gray-500 mb-2">No destination set</p>
                  <button
                    onClick={() => onNavigate('route-planning')}
                    className="text-blue-500 hover:text-blue-600"
                  >
                    Set destination in Route Planning
                  </button>
                </div>
              ) : !trackingInfo ? (
                <div>
                  <p className="text-gray-700 mb-2">
                    Destination: {destination.address}
                  </p>
                  <button
                    onClick={startTracking}
                    className="w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Start Tracking
                  </button>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Destination</p>
                      <p className="font-medium">{destination.address}</p>
                    </div>
                    <div>
                      <div className="flex items-center mb-2">
                        <Navigation className="w-4 h-4 text-blue-500 mr-2" />
                        <span className="text-sm font-medium">Remaining Distance</span>
                      </div>
                      <p className="text-lg font-semibold">{trackingInfo.remainingDistance}</p>
                    </div>

                    <div>
                      <div className="flex items-center mb-2">
                        <Clock className="w-4 h-4 text-blue-500 mr-2" />
                        <span className="text-sm font-medium">ETA</span>
                      </div>
                      <p className="text-lg font-semibold">{trackingInfo.remainingTime}</p>
                    </div>

                    <div>
                      <div className="flex items-center mb-2">
                        <Route className="w-4 h-4 text-blue-500 mr-2" />
                        <span className="text-sm font-medium">Progress</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className="bg-blue-500 h-2.5 rounded-full transition-all duration-500"
                          style={{ width: `${trackingInfo.progress}%` }}
                        />
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {trackingInfo.progress.toFixed(1)}% Complete
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setTrackingInfo(null)}
                    className="w-full mt-4 bg-gray-100 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Stop Tracking
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveTrackingPage; 