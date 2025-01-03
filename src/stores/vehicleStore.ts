import { create } from 'zustand';
import { Vehicle } from '../types/vehicle';
import { persist } from 'zustand/middleware';

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

interface StopPoint {
  id: string;
  position: google.maps.LatLngLiteral;
  startTime: Date;
  endTime?: Date;
  duration?: number; // in milliseconds
}

interface RouteHistory {
  points: google.maps.LatLngLiteral[];
  stops: StopPoint[];
}

interface VehicleStore {
  vehicles: Vehicle[];
  isDriverTracking: boolean;
  watchId: number | null;
  destination: Destination | null;
  geofences: Geofence[];
  routeHistory: RouteHistory;
  driverRouteHistory: RouteHistory;
  testRouteHistory: RouteHistory;
  updateVehiclePosition: (id: string, lat: number, lng: number) => void;
  addVehicle: (vehicle: Vehicle) => void;
  removeVehicle: (id: string) => void;
  setDriverTracking: (isTracking: boolean, watchId: number | null) => void;
  setDestination: (destination: Destination | null) => void;
  addGeofence: (geofence: Geofence) => void;
  removeGeofence: (id: string) => void;
  updateGeofence: (id: string, updates: Partial<Geofence>) => void;
  addRoutePoint: (position: google.maps.LatLngLiteral) => void;
  addStopPoint: (position: google.maps.LatLngLiteral) => void;
  updateStopPoint: (id: string, endTime: Date) => void;
  clearRouteHistory: (type?: 'all' | 'test' | 'driver') => void;
  updateStopDuration: (id: string, duration: number) => void;
}

export const useVehicleStore = create(
  persist(
    (set) => ({
      vehicles: [],
      isDriverTracking: false,
      watchId: null,
      destination: null,
      geofences: [],
      routeHistory: {
        points: [],
        stops: []
      },
      driverRouteHistory: {
        points: [],
        stops: []
      },
      testRouteHistory: {
        points: [],
        stops: []
      },
      updateVehiclePosition: (id, lat, lng) => {
        console.log(`Location updated at ${new Date().toLocaleTimeString()}:`, { id, lat, lng });
        set((state) => {
          const updatedVehicles = state.vehicles.map((vehicle) =>
            vehicle.id === id
              ? {
                  ...vehicle,
                  position: { lat, lng },
                  lastUpdate: new Date(),
                  status: 'active'
                }
              : vehicle
          );

          const position = { lat, lng };
          const isDriver = id === 'driver-1';
          const isTest = id === 'test-vehicle';

          // Update appropriate route history
          if (isDriver) {
            return {
              vehicles: updatedVehicles,
              driverRouteHistory: {
                ...state.driverRouteHistory,
                points: [...state.driverRouteHistory.points, position]
              }
            };
          } else if (isTest) {
            return {
              vehicles: updatedVehicles,
              testRouteHistory: {
                ...state.testRouteHistory,
                points: [...state.testRouteHistory.points, position]
              }
            };
          }
          return { vehicles: updatedVehicles };
        });
      },
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
            return {
              ...state,
              isDriverTracking: false,
              watchId: null,
              vehicles: state.vehicles.map(v => 
                v.id === 'driver-1' 
                  ? { ...v, status: 'inactive', lastUpdate: new Date() }
                  : v
              )
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
      addRoutePoint: (position) =>
        set((state) => ({
          routeHistory: {
            ...state.routeHistory,
            points: [...state.routeHistory.points, position]
          }
        })),
      addStopPoint: (position) =>
        set((state) => {
          const newStop = {
            id: `stop-${Date.now()}`,
            position,
            startTime: new Date()
          };

          // Determine which route history to update based on active vehicle
          const testVehicle = state.vehicles.find(v => v.id === 'test-vehicle');
          const driverVehicle = state.vehicles.find(v => v.id === 'driver-1');

          if (testVehicle?.status === 'active') {
            return {
              testRouteHistory: {
                ...state.testRouteHistory,
                stops: [...state.testRouteHistory.stops, newStop]
              }
            };
          } else if (driverVehicle?.status === 'active') {
            return {
              driverRouteHistory: {
                ...state.driverRouteHistory,
                stops: [...state.driverRouteHistory.stops, newStop]
              }
            };
          }
          return state;
        }),
      updateStopPoint: (id, endTime) =>
        set((state) => {
          console.log('Updating stop point:', id, 'with end time:', endTime);
          return {
            routeHistory: {
              ...state.routeHistory,
              stops: state.routeHistory.stops.map(stop =>
                stop.id === id
                  ? {
                      ...stop,
                      endTime,
                      duration: endTime.getTime() - stop.startTime.getTime()
                    }
                  : stop
              )
            }
          };
        }),
      clearRouteHistory: (type = 'all') =>
        set((state) => ({
          ...(type === 'all' || type === 'test' ? { testRouteHistory: { points: [], stops: [] } } : {}),
          ...(type === 'all' || type === 'driver' ? { driverRouteHistory: { points: [], stops: [] } } : {})
        })),
      updateStopDuration: (id, duration) =>
        set((state) => ({
          routeHistory: {
            ...state.routeHistory,
            stops: state.routeHistory.stops.map(stop =>
              stop.id === id
                ? {
                    ...stop,
                    duration
                  }
                : stop
            )
          }
        })),
    }),
    {
      name: 'vehicle-store',
      getStorage: () => localStorage,
    }
  )
);