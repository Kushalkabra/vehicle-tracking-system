import { useEffect, useState, useCallback } from 'react';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';
import { useVehicleStore, Vehicle } from '../stores/vehicleStore';
import toast from 'react-hot-toast';

const Map: React.FC = () => {
  const vehicles = useVehicleStore((state) => state.vehicles);
  const [isLoading, setIsLoading] = useState(true);
  const [map, setMap] = useState<google.maps.Map | null>(null);

  const mapContainerStyle = {
    width: '100%',
    height: '100%'
  };
  
  // Center map on first vehicle or default to NYC
  const center = vehicles[0]?.position || {
    lat: 40.7128,
    lng: -74.0060
  };

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
    setIsLoading(false);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  // Update map center when vehicles change
  useEffect(() => {
    if (map && vehicles.length > 0) {
      map.panTo(vehicles[0].position);
    }
  }, [map, vehicles]);

  // Handle loading errors
  const onLoadError = () => {
    setIsLoading(false);
    toast.error('Error loading Google Maps');
  };

  return (
    <div className="relative w-full h-[300px] sm:h-[400px] lg:h-[600px] rounded-xl overflow-hidden border border-neutral-200 shadow-card">
      {isLoading && (
        <div className="absolute inset-0 bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent"></div>
        </div>
      )}
      
      <LoadScript 
        googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
        onLoad={() => console.log('Script loaded successfully')}
        onError={onLoadError}
      >
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={center}
          zoom={14}
          options={{
            zoomControl: true,
            streetViewControl: false,
            mapTypeControl: true,
            fullscreenControl: true,
          }}
          onLoad={onLoad}
          onUnmount={onUnmount}
        >
          {vehicles.map((vehicle: Vehicle) => (
            <Marker
              key={vehicle.id}
              position={vehicle.position}
              title={vehicle.name}
              icon={{
                path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                scale: 6,
                fillColor: vehicle.status === 'active' ? '#4CAF50' : '#9E9E9E',
                fillOpacity: 1,
                strokeWeight: 1,
                rotation: 0
              }}
            />
          ))}
        </GoogleMap>
      </LoadScript>
    </div>
  );
};

export default Map;