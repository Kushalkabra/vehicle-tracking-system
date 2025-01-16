export interface Vehicle {
  id: string;
  name: string;
  position: {
    lat: number;
    lng: number;
  };
  status: 'active' | 'inactive';
  lastUpdate: string | null;
  isDriver?: boolean;
  driverName?: string;
}

export interface GeofenceData {
  id: string;
  name: string;
  radius: number;
  center: {
    lat: number;
    lng: number;
  };
}

export interface RoutePoint {
  lat: number;
  lng: number;
  timestamp?: string;
}

export interface StopPoint {
  id: string;
  position: RoutePoint;
  startTime: string;
  endTime?: string;
  duration?: number;
} 