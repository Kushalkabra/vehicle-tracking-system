import React, { useEffect, useRef, useCallback } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { useVehicleStore } from '../stores/vehicleStore';
import { Circle, Polyline } from '@react-google-maps/api';

interface MapViewProps {
  center: google.maps.LatLngLiteral;
  zoom: number;
  showRouteHistory?: boolean;
  routePoints?: google.maps.LatLngLiteral[];
  stopPoints?: Array<{
    position: google.maps.LatLngLiteral;
    startTime: Date;
    duration?: number;
  }>;
  currentPosition?: google.maps.LatLngLiteral | null;
  isTracking?: boolean;
  onMapClick?: (position: google.maps.LatLngLiteral) => void;
}

const MapView: React.FC<MapViewProps> = ({
  center,
  zoom,
  showRouteHistory = false,
  routePoints = [],
  stopPoints = [],
  currentPosition,
  isTracking,
  onMapClick
}) => {
  console.log('MapView props:', {
    center,
    zoom,
    showRouteHistory,
    routePoints: routePoints?.length,
    stopPoints: stopPoints?.length,
    currentPosition,
    isTracking
  });

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const currentMarkerRef = useRef<google.maps.Marker | null>(null);
  const routeLineRef = useRef<google.maps.Polyline | null>(null);
  const stopMarkersRef = useRef<Map<number, google.maps.Circle>>(new Map());

  // Initialize map
  useEffect(() => {
    const mapElement = mapRef.current;
    if (!mapElement) return;

    const initMap = async () => {
      const loader = new Loader({
        apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
        version: 'weekly',
      });

      try {
        await loader.load();
        const map = new google.maps.Map(mapElement, {
          center,
          zoom,
          styles: [
            {
              featureType: 'poi',
              elementType: 'labels',
              stylers: [{ visibility: 'off' }],
            },
          ],
          gestureHandling: 'greedy',
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true
        });

        mapInstanceRef.current = map;

        if (onMapClick) {
          map.addListener('click', (e: google.maps.MapMouseEvent) => {
            if (e.latLng) {
              onMapClick({
                lat: e.latLng.lat(),
                lng: e.latLng.lng()
              });
            }
          });
        }
      } catch (error) {
        console.error('Error loading map:', error);
      }
    };

    initMap();
  }, []);

  // Handle route line updates
  useEffect(() => {
    if (!mapInstanceRef.current || !showRouteHistory) return;

    console.log('Route line effect triggered');
    console.log('Current route points:', routePoints);

    // Clear existing route line
    if (routeLineRef.current) {
      routeLineRef.current.setMap(null);
      routeLineRef.current = null;
    }

    // Ensure we have valid points
    const validPoints = routePoints.filter(point => 
      point && typeof point.lat === 'number' && typeof point.lng === 'number'
    );

    if (validPoints.length < 2) {
      console.log('Not enough valid points for route line');
      return;
    }

    try {
      console.log('Creating route line with points:', validPoints);
      
      // Create the polyline
      const line = new google.maps.Polyline({
        path: validPoints,
        geodesic: true,
        strokeColor: '#2563EB',
        strokeOpacity: 1.0,
        strokeWeight: 3,
      });

      // Set the map
      line.setMap(mapInstanceRef.current);
      routeLineRef.current = line;

      // Fit bounds only when route first appears
      if (validPoints.length === 2) {
        const bounds = new google.maps.LatLngBounds();
        validPoints.forEach(point => bounds.extend(point));
        mapInstanceRef.current.fitBounds(bounds);
      }

      console.log('Route line created successfully');
    } catch (error) {
      console.error('Error creating route line:', error);
    }
  }, [routePoints, showRouteHistory]);

  // Handle stop points updates
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    console.log('Stop points effect triggered');
    console.log('Current stop points:', stopPoints);

    // Clear existing stop markers
    stopMarkersRef.current.forEach(circle => circle.setMap(null));
    stopMarkersRef.current.clear();

    if (!Array.isArray(stopPoints) || stopPoints.length === 0) {
      console.log('No stop points to display');
      return;
    }

    stopPoints.forEach((stop, index) => {
      try {
        console.log('Creating stop circle for point:', stop);
        const circle = new google.maps.Circle({
          center: stop.position,
          radius: 20,
          fillColor: '#FF0000',
          fillOpacity: 0.35,
          strokeColor: '#FF0000',
          strokeOpacity: 0.8,
          strokeWeight: 2,
          map: mapInstanceRef.current,
          zIndex: 2
        });
        stopMarkersRef.current.set(index, circle);
        console.log('Stop circle created successfully');
      } catch (error) {
        console.error('Error creating stop circle:', error);
      }
    });
  }, [stopPoints]);

  // Handle current position updates
  useEffect(() => {
    if (!mapInstanceRef.current || !currentPosition) return;

    if (!currentMarkerRef.current) {
      currentMarkerRef.current = new google.maps.Marker({
        position: currentPosition,
        map: mapInstanceRef.current,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: '#4CAF50',
          fillOpacity: 1,
          strokeColor: '#fff',
          strokeWeight: 2,
          scale: 8,
        }
      });
    } else {
      currentMarkerRef.current.setPosition(currentPosition);
    }

    if (isTracking) {
      mapInstanceRef.current.panTo(currentPosition);
    }
  }, [currentPosition, isTracking]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (routeLineRef.current) {
        routeLineRef.current.setMap(null);
      }
      if (currentMarkerRef.current) {
        currentMarkerRef.current.setMap(null);
      }
      stopMarkersRef.current.forEach(circle => circle.setMap(null));
    };
  }, []);

  useEffect(() => {
    console.log('MapView received new data:', {
      routePoints: routePoints?.length,
      routePointsData: routePoints,
      stopPoints: stopPoints?.length,
      stopPointsData: stopPoints,
      currentPosition,
      isTracking
    });
  }, [routePoints, stopPoints, currentPosition, isTracking]);

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden border border-neutral-200 shadow-lg">
      <div ref={mapRef} className="w-full h-full" />
    </div>
  );
};

export default MapView;