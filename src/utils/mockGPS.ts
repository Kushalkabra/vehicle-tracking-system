import { useVehicleStore } from '../stores/vehicleStore';

// Simulates GPS updates for vehicles
export const startMockGPSUpdates = () => {
  const updateVehiclePosition = useVehicleStore.getState().updateVehiclePosition;

  setInterval(() => {
    // Simulate movement for Vehicle 1
    const randomLat1 = (Math.random() - 0.5) * 0.01;
    const randomLng1 = (Math.random() - 0.5) * 0.01;
    updateVehiclePosition(
      '1',
      40.7128 + randomLat1,
      -74.0060 + randomLng1
    );

    // Simulate movement for Vehicle 2
    const randomLat2 = (Math.random() - 0.5) * 0.01;
    const randomLng2 = (Math.random() - 0.5) * 0.01;
    updateVehiclePosition(
      '2',
      40.7580 + randomLat2,
      -73.9855 + randomLng2
    );
  }, 3000); // Update every 3 seconds
};