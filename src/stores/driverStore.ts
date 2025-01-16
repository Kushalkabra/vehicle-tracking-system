import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface DriverState {
  driverName: string;
  isTracking: boolean;
  setDriverName: (name: string) => void;
  setTracking: (isTracking: boolean) => void;
  clearDriver: () => void;
}

export const useDriverStore = create<DriverState>()(
  persist(
    (set) => ({
      driverName: '',
      isTracking: false,
      setDriverName: (name) => set({ driverName: name }),
      setTracking: (isTracking) => set({ isTracking }),
      clearDriver: () => set({ driverName: '', isTracking: false }),
    }),
    {
      name: 'driver-storage',
    }
  )
); 