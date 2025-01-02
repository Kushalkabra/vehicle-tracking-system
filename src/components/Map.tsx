import React, { useEffect, useRef } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { useVehicleStore } from '../stores/vehicleStore';

const GOOGLE_MAPS_API_KEY = 'YOUR_API_KEY'; // Replace with your actual API key

interface MapProps {
  center: google.maps.LatLngLiteral;
  zoom: number;
}

const Map: React.FC<MapProps> = ({ center, zoom }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<Map<string, google.maps.Marker>>(new Map());
  const vehicles = useVehicleStore((state) => state.vehicles);

  useEffect(() => {
    const loader = new Loader({
      apiKey: GOOGLE_MAPS_API_KEY,
      version: 'weekly',
    });

    loader.load().then(() => {
      if (mapRef.current && !mapInstanceRef.current) {
        mapInstanceRef.current = new google.maps.Map(mapRef.current, {
          center,
          zoom,
          styles: [
            {
              featureType: 'poi',
              elementType: 'labels',
              stylers: [{ visibility: 'off' }],
            },
          ],
        });
      }
    });
  }, [center, zoom]);

  useEffect(() => {
    if (!mapInstanceRef.current) return;

    vehicles.forEach((vehicle) => {
      let marker = markersRef.current.get(vehicle.id);

      if (!marker) {
        marker = new google.maps.Marker({
          position: vehicle.position,
          map: mapInstanceRef.current,
          title: vehicle.name,
          icon: {
            path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
            scale: 6,
            fillColor: vehicle.status === 'active' ? '#4CAF50' : '#9E9E9E',
            fillOpacity: 1,
            strokeWeight: 1,
            rotation: 0,
          },
        });
        markersRef.current.set(vehicle.id, marker);
      } else {
        marker.setPosition(vehicle.position);
      }
    });
  }, [vehicles]);

  return <div ref={mapRef} className="w-full h-full rounded-lg" />;
};

export default Map;