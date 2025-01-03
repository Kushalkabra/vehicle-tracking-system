import { Loader } from '@googlemaps/js-api-loader';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

let geometryLibraryLoaded = false;

export const initGeometryLibrary = async () => {
  if (geometryLibraryLoaded) return;

  const loader = new Loader({
    apiKey: GOOGLE_MAPS_API_KEY,
    version: 'weekly',
    libraries: ['geometry']
  });

  await loader.load();
  geometryLibraryLoaded = true;
};

export const calculateDistance = (pos1: google.maps.LatLngLiteral, pos2: google.maps.LatLngLiteral) => {
  if (!geometryLibraryLoaded) {
    // Fallback to Haversine formula
    const R = 6371e3;
    const φ1 = (pos1.lat * Math.PI) / 180;
    const φ2 = (pos2.lat * Math.PI) / 180;
    const Δφ = ((pos2.lat - pos1.lat) * Math.PI) / 180;
    const Δλ = ((pos2.lng - pos1.lng) * Math.PI) / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  return google.maps.geometry.spherical.computeDistanceBetween(
    new google.maps.LatLng(pos1),
    new google.maps.LatLng(pos2)
  );
}; 