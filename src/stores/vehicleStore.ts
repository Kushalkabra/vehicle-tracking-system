import { create } from 'zustand';
import { Vehicle } from '../types/vehicle';

interface Geofence {
  id: string;
  name: string;
  center: google.maps.LatLngLiteral;
  radius: number; // in meters
  color: string;
}

interface Destination {
  address: string;
  location: google.maps.LatLngLiteral;
}

interface VehicleStore {
  vehicles: Vehicle[];
  isDriverTracking: boolean;
  watchId: number | null;
  destination: Destination | null;
  geofences: Geofence[];
  updateVehiclePosition: (id: string, lat: number, lng: number) => void;
  addVehicle: (vehicle: Vehicle) => void;
  removeVehicle: (id: string) => void;
  setDriverTracking: (isTracking: boolean, watchId: number | null) => void;
  setDestination: (destination: Destination | null) => void;
  addGeofence: (geofence: Geofence) => void;
  removeGeofence: (id: string) => void;
  updateGeofence: (id: string, updates: Partial<Geofence>) => void;
}

export const useVehicleStore = create<VehicleStore>((set) => ({
  vehicles: [],
  isDriverTracking: false,
  watchId: null,
  destination: null,
  geofences: [],
  updateVehiclePosition: (id, lat, lng) =>
    set((state) => ({
      vehicles: state.vehicles.map((vehicle) =>
        vehicle.id === id
          ? {
              ...vehicle,
              position: { lat, lng },
              lastUpdate: new Date(),
            }
          : vehicle
      ),
    })),
  addVehicle: (vehicle) =>
    set((state) => ({
      vehicles: [...state.vehicles, vehicle],
    })),
  removeVehicle: (id) =>
    set((state) => ({
      vehicles: state.vehicles.filter((vehicle) => vehicle.id !== id),
    })),
  setDriverTracking: (isTracking, watchId) => 
    set((state) => {
      if (isTracking) {
        // Add driver vehicle if not exists
        const driverExists = state.vehicles.some(v => v.id === 'driver-1');
        if (!driverExists) {
          return {
            isDriverTracking: true,
            watchId,
            vehicles: [...state.vehicles, {
              id: 'driver-1',
              name: 'Current Driver',
              position: { lat: 0, lng: 0 },
              status: 'active',
              lastUpdate: new Date()
            }]
          };
        }
        return { 
          ...state,
          isDriverTracking: true, 
          watchId 
        };
      } else {
        // Remove driver vehicle when tracking stops
        return {
          ...state,
          isDriverTracking: false,
          watchId: null,
          vehicles: state.vehicles.filter(v => v.id !== 'driver-1')
        };
      }
    }),
  setDestination: (destination) =>
    set(() => ({
      destination
    })),
  addGeofence: (geofence) =>
    set((state) => ({
      geofences: [...state.geofences, geofence]
    })),
  removeGeofence: (id) =>
    set((state) => ({
      geofences: state.geofences.filter(g => g.id !== id)
    })),
  updateGeofence: (id, updates) =>
    set((state) => ({
      geofences: state.geofences.map(g =>
        g.id === id ? { ...g, ...updates } : g
      )
    })),
}));