import { Loader } from '@googlemaps/js-api-loader';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
export const MOVEMENT_THRESHOLD = 0.0001; // Decreased value for better stop detection

let geometryLibraryLoaded = false;

export const initGeometryLibrary = () => {
  if (typeof google === 'undefined') return;
  
  if (!google.maps.geometry) {
    throw new Error('Google Maps Geometry library not loaded');
  }
};

export const calculateDistance = (
  pos1: google.maps.LatLngLiteral,
  pos2: google.maps.LatLngLiteral
): number => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (pos1.lat * Math.PI) / 180;
  const φ2 = (pos2.lat * Math.PI) / 180;
  const Δφ = ((pos2.lat - pos1.lat) * Math.PI) / 180;
  const Δλ = ((pos2.lng - pos1.lng) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
};

export const calculateTotalDistance = (points: google.maps.LatLngLiteral[]): number => {
  if (!Array.isArray(points) || points.length < 2) return 0;

  let totalDistance = 0;
  for (let i = 1; i < points.length; i++) {
    totalDistance += calculateDistance(points[i-1], points[i]);
  }

  // Convert meters to kilometers
  return totalDistance / 1000;
}; 