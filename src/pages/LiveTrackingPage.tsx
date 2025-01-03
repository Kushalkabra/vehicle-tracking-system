import React, { useState, useEffect } from 'react';
import MapView from '../components/MapView';
import { useVehicleStore } from '../stores/vehicleStore';
import { MapPin, Navigation } from 'lucide-react';

const LiveTrackingPage: React.FC = () => {
  const [directionsRenderer, setDirectionsRenderer] = useState<google.maps.DirectionsRenderer | null>(null);
  const [directionsService, setDirectionsService] = useState<google.maps.DirectionsService | null>(null);

  const vehicles = useVehicleStore((state) => state.vehicles);
  const destination = useVehicleStore((state) => state.destination);
  const driverVehicle = vehicles.find(v => v.id === 'driver-1');
  const center = driverVehicle?.position || { lat: 40.7128, lng: -74.0060 };

  const handleMapLoad = (loadedMap: google.maps.Map) => {
    // Initialize directions services
    const renderer = new google.maps.DirectionsRenderer({
      suppressMarkers: false,
      polylineOptions: {
        strokeColor: '#4285F4',
        strokeWeight: 5,
        strokeOpacity: 0.8
      },
      map: loadedMap
    });
    
    setDirectionsRenderer(renderer);
    setDirectionsService(new google.maps.DirectionsService());
  };

  // Update route when destination or vehicle position changes
  useEffect(() => {
    if (!directionsService || !directionsRenderer || !destination || !driverVehicle) return;

    directionsService.route({
      origin: driverVehicle.position,
      destination: destination.location,
      travelMode: google.maps.TravelMode.DRIVING,
    }, (result, status) => {
      if (status === google.maps.DirectionsStatus.OK && result) {
        directionsRenderer.setDirections(result);
      } else {
        console.error('Error fetching directions:', status);
      }
    });
  }, [destination, driverVehicle?.position, directionsService, directionsRenderer]);

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Live Tracking</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <MapView 
            center={center} 
            zoom={13}
            showRouteHistory={true}
            directionsRenderer={directionsRenderer}
            onMapLoad={handleMapLoad}
          />
        </div>
        
        <div className="space-y-6">
          {/* Vehicle Status Card */}
          <div className="bg-white rounded-xl shadow-card p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center">
                <Navigation className="w-6 h-6 text-primary-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Vehicle Status</h3>
                <p className="text-sm text-gray-500">Current location and destination</p>
              </div>
            </div>

            <div className="space-y-4">
              {driverVehicle && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-700 mb-2">Current Location</h4>
                  <p className="text-sm text-gray-600">
                    Lat: {driverVehicle.position.lat.toFixed(6)}<br />
                    Lng: {driverVehicle.position.lng.toFixed(6)}
                  </p>
                </div>
              )}

              {destination && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <MapPin className="w-4 h-4 text-primary-500" />
                    <h4 className="font-medium text-gray-700">Destination</h4>
                  </div>
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

export default LiveTrackingPage; 