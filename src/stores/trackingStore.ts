import { create } from 'zustand';

interface TrackingState {
  isTracking: boolean;
  currentPosition: google.maps.LatLngLiteral | null;
  lastUpdateTime: Date | null;
  routePoints: google.maps.LatLngLiteral[];
  stopPoints: any[];
  isDetectingStop: boolean;
  isPermissionGranted: boolean;
  nextUpdateIn: number;
  isUpdating: boolean;
  
  // Actions
  setTracking: (isTracking: boolean) => void;
  setCurrentPosition: (position: google.maps.LatLngLiteral | null) => void;
  setLastUpdateTime: (time: Date | null) => void;
  setRoutePoints: (points: google.maps.LatLngLiteral[]) => void;
  addRoutePoint: (point: google.maps.LatLngLiteral) => void;
  setStopPoints: (stops: Array<{
    position: google.maps.LatLngLiteral;
    startTime: Date;
    duration?: number;
  }>) => void;
  addStopPoint: (stop: {
    position: google.maps.LatLngLiteral;
    startTime: Date;
    duration?: number;
  }) => void;
  updateStopPoint: (id: string, endTime: Date) => void;
  setIsDetectingStop: (isDetecting: boolean) => void;
  setPermissionGranted: (granted: boolean) => void;
  setNextUpdateIn: (time: number) => void;
  setIsUpdating: (isUpdating: boolean) => void;
  resetAll: () => void;
}

export const useTrackingStore = create<TrackingState>((set, get) => ({
  isTracking: false,
  currentPosition: null,
  lastUpdateTime: null,
  routePoints: [],
  stopPoints: [],
  isDetectingStop: false,
  isPermissionGranted: false,
  nextUpdateIn: 0,
  isUpdating: false,

  setTracking: (isTracking) => {
    if (!isTracking) {
      // Reset all tracking data when stopping
      set({
        isTracking,
        currentPosition: null,
        lastUpdateTime: null,
        routePoints: [],
        stopPoints: [],
        isDetectingStop: false
      });
    } else {
      set({ isTracking });
    }
  },

  setCurrentPosition: (position) => {
    if (!position) return;
    set((state) => ({
      currentPosition: position,
      // Add to route points only if tracking is active
      routePoints: state.isTracking ? [...state.routePoints, position] : state.routePoints
    }));
  },

  setLastUpdateTime: (time) => set({ lastUpdateTime: time }),

  setRoutePoints: (points) => {
    console.log('Setting route points:', points);
    if (!Array.isArray(points)) return;
    set({ routePoints: points });
  },

  addRoutePoint: (point) => {
    if (!point) return;
    set((state) => ({
      routePoints: [...state.routePoints, point]
    }));
  },

  setStopPoints: (stops) => {
    console.log('Setting stop points:', stops);
    if (!Array.isArray(stops)) return;
    set({ stopPoints: stops });
  },

  addStopPoint: (stop) => {
    if (!stop) return;
    set((state) => ({
      stopPoints: [...state.stopPoints, stop]
    }));
  },

  setIsDetectingStop: (isDetecting) => set({ isDetectingStop: isDetecting }),
  setPermissionGranted: (granted) => set({ isPermissionGranted: granted }),

  resetAll: () => {
    set({
      isTracking: false,
      currentPosition: null,
      lastUpdateTime: null,
      routePoints: [],
      stopPoints: [],
      isDetectingStop: false,
      isPermissionGranted: false
    });
  },

  updateStopPoint: (id: string, endTime: Date) => {
    // implementation
  },

  setNextUpdateIn: (time: number) => {
    // implementation
  },

  setIsUpdating: (isUpdating: boolean) => {
    // implementation
  }
})); 