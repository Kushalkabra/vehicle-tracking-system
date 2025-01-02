import React, { useState } from 'react';
import { useVehicleStore } from '../stores/vehicleStore';
import { MapIcon, LocateFixed, Clock, MapPin, Route } from 'lucide-react';
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
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Route Planning</h2>
        <div className="flex items-center space-x-4">
          {routeInfo && (
            <div className="flex items-center space-x-2 text-sm bg-primary-50 text-primary-700 px-3 py-1.5 rounded-full">
              <Clock size={14} />
              <span>{routeInfo.duration}</span>
              <span>•</span>
              <span>{routeInfo.distance}</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl shadow-card overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <MapIcon className="w-6 h-6 text-primary-500" />
                  <h3 className="text-lg font-semibold text-gray-800">Route Map</h3>
                </div>
                {isGeofenceMode && (
                  <span className="text-sm px-3 py-1 bg-primary-50 text-primary-600 rounded-full animate-pulse">
                    Click on map to place geofence
                  </span>
                )}
              </div>
              <div className="h-[600px] rounded-xl overflow-hidden border border-gray-100">
                <MapView
                  center={driverLocation || { lat: 40.7128, lng: -74.0060 }}
                  zoom={12}
                  routePath={routeInfo?.path}
                  onMapClick={handleMapClick}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-xl shadow-card p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Route Details</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Current Location
                </label>
                <div className="flex items-center space-x-2 text-sm text-gray-500 bg-gray-50 p-2 rounded-lg">
                  <LocateFixed size={16} />
                  <span>
                    {driverLocation 
                      ? `${driverLocation.lat.toFixed(4)}, ${driverLocation.lng.toFixed(4)}`
                      : 'No location available'}
                  </span>
                </div>
              </div>

              <div>
                <label htmlFor="destination" className="block text-sm font-medium text-gray-600 mb-1">
                  Destination
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="destination"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder="Enter destination address"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all duration-200"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2">
                    <MapPin size={18} className="text-gray-400" />
                  </div>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <button
                onClick={calculateRoute}
                className="w-full bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors duration-200 flex items-center justify-center space-x-2"
              >
                <Route size={18} />
                <span>Calculate Route</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-card p-6">
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
  );
};

export default RoutePlanningPage; 