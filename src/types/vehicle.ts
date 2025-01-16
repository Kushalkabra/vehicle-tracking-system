export interface Vehicle {
  id: string;
  name: string;
  position: {
    lat: number;
    lng: number;
  };
  status: 'active' | 'inactive';
  lastUpdate: Date | string | null;
}