import React, { useState } from 'react';
import { useVehicleStore } from '../stores/vehicleStore';
import { MapIcon, LocateFixed } from 'lucide-react';
import MapView from '../components/MapView';
import GeofenceControl from '../components/GeofenceControl';
import { generateRandomColor } from '../utils/colors';

interface RouteInfo {
  distance: string;
  duration: string;
  path: google.maps.LatLngLiteral[];
}

const RoutePlanningPage: React.FC = () => {
  const [destination, setDestination] = useState('');
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [error, setError] = useState<string>('');
  const [isGeofenceMode, setIsGeofenceMode] = useState(false);
  const [geofenceName, setGeofenceName] = useState('');
  const [geofenceRadius, setGeofenceRadius] = useState('100');
  
  const setStoreDestination = useVehicleStore((state) => state.setDestination);
  const addGeofence = useVehicleStore((state) => state.addGeofence);
  
  const vehicles = useVehicleStore((state) => state.vehicles);
  const driverVehicle = vehicles.find(v => v.id === 'driver-1');
  const driverLocation = driverVehicle?.position;

  const calculateRoute = async () => {
    if (!driverLocation) {
      setError('Driver location not available. Please enable tracking first.');
      return;
    }

    if (!destination) {
      setError('Please enter a destination.');
      return;
    }

    try {
      const geocoder = new google.maps.Geocoder();
      const directionsService = new google.maps.DirectionsService();

      // First, geocode the destination address
      const geocodeResult = await geocoder.geocode({ address: destination });
      
      if (!geocodeResult.results[0]) {
        throw new Error('Destination not found');
      }

      const destinationLocation = geocodeResult.results[0].geometry.location;

      // Save destination to store
      setStoreDestination({
        address: destination,
        location: {
          lat: destinationLocation.lat(),
          lng: destinationLocation.lng()
        }
      });

      // Calculate route
      const route = await directionsService.route({
        origin: driverLocation,
        destination: destinationLocation.toJSON(),
        travelMode: google.maps.TravelMode.DRIVING,
      });

      if (route.routes[0]) {
        const path = route.routes[0].overview_path.map(point => ({
          lat: point.lat(),
          lng: point.lng(),
        }));

        setRouteInfo({
          distance: route.routes[0].legs[0].distance?.text || '',
          duration: route.routes[0].legs[0].duration?.text || '',
          path,
        });
        setError('');
      }
    } catch (err: any) {
      setError(err.message || 'Error calculating route');
    }
  };

  const handleMapClick = (e: google.maps.MapMouseEvent) => {
    if (!isGeofenceMode || !e.latLng) return;

    if (!geofenceName) {
      setError('Please enter a name for the geofence');
      return;
    }

    const radius = parseInt(geofenceRadius) || 100;
    
    addGeofence({
      id: `geofence-${Date.now()}`,
      name: geofenceName,
      center: {
        lat: e.latLng.lat(),
        lng: e.latLng.lng()
      },
      radius,
      color: generateRandomColor()
    });

    // Reset form
    setGeofenceName('');
    setGeofenceRadius('100');
    setIsGeofenceMode(false);
    setError('');
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Route Planning</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-3xl mx-auto">
            <div className="flex items-center mb-4">
              <MapIcon className="w-6 h-6 text-blue-500 mr-2" />
              <h3 className="text-lg font-semibold">Route Map</h3>
            </div>
            <div className="h-[400px] rounded-lg overflow-hidden border border-gray-200">
              <MapView
                center={driverLocation || { lat: 40.7128, lng: -74.0060 }}
                zoom={12}
                routePath={routeInfo?.path}
                onMapClick={handleMapClick}
              />
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Route Details</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Current Location
                  </label>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <LocateFixed size={16} />
                    <span>
                      {driverLocation 
                        ? `${driverLocation.lat.toFixed(4)}, ${driverLocation.lng.toFixed(4)}`
                        : 'No location available'}
                    </span>
                  </div>
                </div>

                <div>
                  <label htmlFor="destination" className="block text-sm font-medium text-gray-700 mb-1">
                    Destination
                  </label>
                  <input
                    type="text"
                    id="destination"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder="Enter destination address"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {error && (
                  <p className="text-sm text-red-500">{error}</p>
                )}

                <button
                  onClick={calculateRoute}
                  className="w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Calculate Route
                </button>

                {routeInfo && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium mb-2">Route Information</h4>
                    <div className="space-y-1 text-sm">
                      <p>Distance: {routeInfo.distance}</p>
                      <p>Duration: {routeInfo.duration}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
              <GeofenceControl
                onAddMode={() => setIsGeofenceMode(!isGeofenceMode)}
                isAddMode={isGeofenceMode}
                geofenceName={geofenceName}
                geofenceRadius={geofenceRadius}
                onNameChange={setGeofenceName}
                onRadiusChange={setGeofenceRadius}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoutePlanningPage; 