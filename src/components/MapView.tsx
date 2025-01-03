import React, { useEffect, useRef } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { useVehicleStore } from '../stores/vehicleStore';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const STOP_THRESHOLD = 30 * 1000; // 30 seconds for testing

interface MapViewProps {
  center: google.maps.LatLngLiteral;
  zoom: number;
  routePath?: google.maps.LatLngLiteral[];
  onMapClick?: (e: google.maps.MapMouseEvent) => void;
  showGeofences?: boolean;
  showRouteHistory?: boolean;
  isTestEnvironment?: boolean;
  directionsRenderer?: google.maps.DirectionsRenderer | null;
  onMapLoad?: (map: google.maps.Map) => void;
}

const MapView: React.FC<MapViewProps> = ({ 
  center, 
  zoom, 
  onMapClick, 
  showGeofences = true,
  showRouteHistory = true,
  isTestEnvironment = false,
  directionsRenderer = null,
  onMapLoad
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const routeLineRef = useRef<google.maps.Polyline | null>(null);
  const stopMarkersRef = useRef<google.maps.Marker[]>([]);
  const vehicleMarkersRef = useRef<Map<string, google.maps.Marker>>(new Map());
  
  const routeHistory = useVehicleStore((state) => 
    isTestEnvironment ? state.testRouteHistory : state.driverRouteHistory
  );
  const vehicles = useVehicleStore((state) => state.vehicles);

  // Initialize map
  useEffect(() => {
    const loader = new Loader({
      apiKey: GOOGLE_MAPS_API_KEY,
      version: 'weekly',
      libraries: ['geometry', 'places', 'directions']
    });

    loader.load()
      .then(() => {
        if (mapRef.current && !mapInstanceRef.current) {
          const map = new google.maps.Map(mapRef.current, {
            center,
            zoom,
            styles: [
              {
                featureType: "poi",
                elementType: "labels",
                stylers: [{ visibility: "off" }]
              }
            ]
          });
          
          mapInstanceRef.current = map;
          
          if (onMapClick) {
            map.addListener('click', onMapClick);
          }

          // Notify parent when map is ready
          if (onMapLoad) {
            onMapLoad(map);
          }
        }
      })
      .catch((error) => {
        console.error('Error loading Google Maps:', error);
      });

    return () => {
      if (mapInstanceRef.current && onMapClick) {
        google.maps.event.clearListeners(mapInstanceRef.current, 'click');
      }
    };
  }, []);

  // Update map center and zoom when props change
  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setCenter(center);
      mapInstanceRef.current.setZoom(zoom);
    }
  }, [center, zoom]);

  // Update vehicle markers
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Only show non-test vehicles in production pages
    const visibleVehicles = isTestEnvironment 
      ? vehicles 
      : vehicles.filter(v => !v.id.includes('test'));

    // Remove markers for vehicles that no longer exist
    const currentVehicleIds = new Set(visibleVehicles.map(v => v.id));
    vehicleMarkersRef.current.forEach((marker, id) => {
      if (!currentVehicleIds.has(id)) {
        marker.setMap(null);
        vehicleMarkersRef.current.delete(id);
      }
    });

    // Update or create markers for current vehicles
    visibleVehicles.forEach(vehicle => {
      let marker = vehicleMarkersRef.current.get(vehicle.id);

      if (!marker) {
        // Create new marker with different icon for test vehicle
        const isTestVehicle = vehicle.id.includes('test');
        marker = new google.maps.Marker({
          position: vehicle.position,
          map: mapInstanceRef.current,
          title: vehicle.name,
          icon: {
            path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
            scale: isTestVehicle ? 8 : 6,
            fillColor: isTestVehicle ? '#FF9800' : (vehicle.status === 'active' ? '#4CAF50' : '#9E9E9E'),
            fillOpacity: 1,
            strokeWeight: 2,
            rotation: 0,
          },
        });
        vehicleMarkersRef.current.set(vehicle.id, marker);
      } else {
        // Update existing marker
        marker.setPosition(vehicle.position);
        const icon = marker.getIcon() as google.maps.Symbol;
        const isTestVehicle = vehicle.id.includes('test');
        marker.setIcon({
          ...icon,
          fillColor: isTestVehicle ? '#FF9800' : (vehicle.status === 'active' ? '#4CAF50' : '#9E9E9E'),
        });
      }
    });

    return () => {
      vehicleMarkersRef.current.forEach(marker => marker.setMap(null));
      vehicleMarkersRef.current.clear();
    };
  }, [vehicles, isTestEnvironment]);

  // Draw route history and stop markers
  useEffect(() => {
    if (!mapInstanceRef.current || !showRouteHistory) return;

    try {
      // Clear existing markers
      stopMarkersRef.current.forEach(marker => marker.setMap(null));
      stopMarkersRef.current = [];

      // Filter route points based on environment and vehicle type
      const routePoints = isTestEnvironment 
        ? routeHistory.points 
        : routeHistory.points.filter(() => vehicles.some(v => v.id === 'driver-1' && v.status === 'active'));

      const routeStops = isTestEnvironment
        ? routeHistory.stops
        : routeHistory.stops.filter(() => vehicles.some(v => v.id === 'driver-1' && v.status === 'active'));

      // Draw route line
      if (routeLineRef.current) {
        routeLineRef.current.setMap(null);
      }

      if (routePoints.length > 0) {
        routeLineRef.current = new google.maps.Polyline({
          path: routePoints,
          geodesic: true,
          strokeColor: '#4285F4',
          strokeOpacity: 1.0,
          strokeWeight: 3,
          map: mapInstanceRef.current
        });
      }

      // Draw stop markers
      routeStops.forEach(stop => {
        const duration = stop.duration || 
          (stop.endTime ? new Date(stop.endTime).getTime() - new Date(stop.startTime).getTime() : 
          new Date().getTime() - new Date(stop.startTime).getTime());

        if (duration >= 30000) { // 30 seconds threshold
          const marker = new google.maps.Marker({
            position: stop.position,
            map: mapInstanceRef.current!,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: '#FF0000',
              fillOpacity: 0.7,
              strokeColor: '#FF0000',
              strokeWeight: 2
            },
            title: `Stop Duration: ${Math.round(duration / 1000)} seconds`
          });
          stopMarkersRef.current.push(marker);
        }
      });

    } catch (error) {
      console.error('Error rendering route history:', error);
    }

    return () => {
      if (routeLineRef.current) {
        routeLineRef.current.setMap(null);
      }
      stopMarkersRef.current.forEach(marker => marker.setMap(null));
      stopMarkersRef.current = [];
    };
  }, [routeHistory, showRouteHistory, isTestEnvironment, vehicles]);

  // Set up directions renderer
  useEffect(() => {
    if (directionsRenderer && mapInstanceRef.current) {
      directionsRenderer.setMap(mapInstanceRef.current);
    }
    return () => {
      if (directionsRenderer) {
        directionsRenderer.setMap(null);
      }
    };
  }, [directionsRenderer]);

  return (
    <div className="relative w-full h-[300px] sm:h-[400px] lg:h-[600px] rounded-xl overflow-hidden border border-neutral-200 shadow-card group">
      <div ref={mapRef} className="w-full h-full" />
      {!mapInstanceRef.current && (
        <div className="absolute inset-0 bg-neutral-50 flex items-center justify-center">
          <div className="flex flex-col items-center space-y-3">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent" />
            <p className="text-sm text-neutral-500">Loading map...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapView;