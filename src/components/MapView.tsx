import React, { useEffect, useRef } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { useVehicleStore } from '../stores/vehicleStore';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

interface MapViewProps {
  center: google.maps.LatLngLiteral;
  zoom: number;
  routePath?: google.maps.LatLngLiteral[];
  onMapClick?: (e: google.maps.MapMouseEvent) => void;
  showGeofences?: boolean;
}

const MapView: React.FC<MapViewProps> = ({ center, zoom, routePath, onMapClick, showGeofences = true }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<Map<string, google.maps.Marker>>(new Map());
  const vehicles = useVehicleStore((state) => state.vehicles);
  const geofences = useVehicleStore((state) => state.geofences);
  const geofenceCirclesRef = useRef<Map<string, google.maps.Circle>>(new Map());

  // Initialize map
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
  }, []);

  // Update map center when center prop changes
  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setCenter(center);
    }
  }, [center.lat, center.lng]);

  // Update markers
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Remove markers that are no longer in the vehicles list
    const currentVehicleIds = new Set(vehicles.map(v => v.id));
    markersRef.current.forEach((marker, id) => {
      if (!currentVehicleIds.has(id)) {
        marker.setMap(null);
        markersRef.current.delete(id);
      }
    });

    // Update or create markers for current vehicles
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
        const icon = marker.getIcon() as google.maps.Symbol;
        marker.setIcon({
          ...icon,
          fillColor: vehicle.status === 'active' ? '#4CAF50' : '#9E9E9E',
        });
      }
    });
  }, [vehicles]);

  // Add route polyline
  useEffect(() => {
    if (!mapInstanceRef.current || !routePath) return;

    const polyline = new google.maps.Polyline({
      path: routePath,
      geodesic: true,
      strokeColor: '#4285F4',
      strokeOpacity: 1.0,
      strokeWeight: 3,
    });

    polyline.setMap(mapInstanceRef.current);

    return () => {
      polyline.setMap(null);
    };
  }, [routePath]);

  // Add click handler to map
  useEffect(() => {
    if (!mapInstanceRef.current || !onMapClick) return;

    const listener = mapInstanceRef.current.addListener('click', onMapClick);
    return () => {
      google.maps.event.removeListener(listener);
    };
  }, [onMapClick]);

  // Handle geofences
  useEffect(() => {
    if (!mapInstanceRef.current || !showGeofences) return;

    // Remove old circles
    geofenceCirclesRef.current.forEach(circle => circle.setMap(null));
    geofenceCirclesRef.current.clear();

    // Add new circles
    geofences.forEach(geofence => {
      const circle = new google.maps.Circle({
        map: mapInstanceRef.current,
        center: geofence.center,
        radius: geofence.radius,
        fillColor: geofence.color,
        fillOpacity: 0.2,
        strokeColor: geofence.color,
        strokeOpacity: 0.8,
        strokeWeight: 2
      });
      geofenceCirclesRef.current.set(geofence.id, circle);
    });

    return () => {
      geofenceCirclesRef.current.forEach(circle => circle.setMap(null));
    };
  }, [geofences, showGeofences]);

  return <div ref={mapRef} className="w-full h-full rounded-lg" />;
};

export default MapView;