import { create } from 'zustand';

export interface Vehicle {
  id: string;
  name: string;
  position: {
    lat: number;
    lng: number;
  };
  status: string;
  lastUpdate: string;
  isDriver?: boolean;
  driverName?: string;
}

interface VehicleStore {
  vehicles: Vehicle[];
  addVehicle: (vehicle: Vehicle) => void;
  updateVehicle: (vehicle: Vehicle) => void;
  removeVehicle: (id: string) => void;
  clearVehicles: () => void;
}

export const useVehicleStore = create<VehicleStore>((set) => ({
  vehicles: [],
  addVehicle: (vehicle) => {
    set((state) => {
      // Check if vehicle with same driver name already exists
      const existingVehicleIndex = state.vehicles.findIndex(
        (v) => v.driverName === vehicle.driverName
      );

      if (existingVehicleIndex !== -1) {
        // Update existing vehicle instead of adding new one
        const updatedVehicles = [...state.vehicles];
        updatedVehicles[existingVehicleIndex] = {
          ...updatedVehicles[existingVehicleIndex],
          ...vehicle,
          lastUpdate: new Date().toISOString()
        };
        return { vehicles: updatedVehicles };
      }

      // Add new vehicle if it doesn't exist
      return { vehicles: [...state.vehicles, vehicle] };
    });
  },
  updateVehicle: (vehicle) => {
    set((state) => ({
      vehicles: state.vehicles.map((v) =>
        v.driverName === vehicle.driverName ? { ...v, ...vehicle } : v
      ),
    }));
  },
  removeVehicle: (id) => {
    set((state) => ({
      vehicles: state.vehicles.filter((v) => v.id !== id),
    }));
  },
  clearVehicles: () => set({ vehicles: [] }),
}));