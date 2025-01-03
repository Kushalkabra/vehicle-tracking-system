import React, { useState, useEffect, useCallback } from 'react';
import MapView from '../components/MapView';
import { useVehicleStore } from '../stores/vehicleStore';
import { MapPin, Search } from 'lucide-react';
import toast from 'react-hot-toast';

const RoutePlanningPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [directionsRenderer, setDirectionsRenderer] = useState<google.maps.DirectionsRenderer | null>(null);
  const [directionsService, setDirectionsService] = useState<google.maps.DirectionsService | null>(null);
  const [geocoder, setGeocoder] = useState<google.maps.Geocoder | null>(null);

  const vehicles = useVehicleStore((state) => state.vehicles);
  const destination = useVehicleStore((state) => state.destination);
  const setDestination = useVehicleStore((state) => state.setDestination);
  const driverVehicle = vehicles.find(v => v.id === 'driver-1');
  const center = driverVehicle?.position || { lat: 40.7128, lng: -74.0060 };

  const handleMapLoad = useCallback((loadedMap: google.maps.Map) => {
    setMap(loadedMap);
    
    // Initialize services after map is loaded
    const renderer = new google.maps.DirectionsRenderer({
      suppressMarkers: true,
      polylineOptions: {
        strokeColor: '#4285F4',
        strokeWeight: 5,
        strokeOpacity: 0.8
      },
      map: loadedMap
    });
    
    setDirectionsRenderer(renderer);
    setDirectionsService(new google.maps.DirectionsService());
    setGeocoder(new google.maps.Geocoder());
  }, []);

  // Update route when destination changes
  useEffect(() => {
    if (!directionsService || !directionsRenderer || !destination || !driverVehicle || !map) return;

    directionsService.route({
      origin: driverVehicle.position,
      destination: destination.location,
      travelMode: google.maps.TravelMode.DRIVING,
    }, (result, status) => {
      if (status === google.maps.DirectionsStatus.OK && result) {
        directionsRenderer.setMap(map); // Ensure renderer is attached to map
        directionsRenderer.setDirections(result);
        toast.success('Route updated');
      } else {
        console.error('Error fetching directions:', status);
        toast.error('Could not calculate route');
      }
    });
  }, [destination, driverVehicle?.position, directionsService, directionsRenderer, map]);

  const handleSearch = async () => {
    if (!searchQuery.trim() || !geocoder) return;

    setIsSearching(true);
    try {
      const result = await geocoder.geocode({ address: searchQuery });
      if (result.results[0]) {
        const location = result.results[0].geometry.location.toJSON();
        setDestination({
          address: result.results[0].formatted_address,
          location: location
        });
        toast.success('Destination set');
      } else {
        toast.error('Address not found');
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      toast.error('Error finding address');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Route Planning</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <MapView 
            center={center} 
            zoom={13}
            directionsRenderer={directionsRenderer}
            onMapLoad={handleMapLoad}
          />
        </div>
        
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-card p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center">
                <MapPin className="w-6 h-6 text-primary-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Set Destination</h3>
                <p className="text-sm text-gray-500">Enter destination address</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Enter destination address"
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <button
                  onClick={handleSearch}
                  disabled={isSearching}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg hover:bg-gray-100"
                >
                  <Search className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {destination && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-700 mb-2">Current Destination</h4>
                  <p className="text-sm text-gray-600">{destination.address}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoutePlanningPage; 