import { useVehicleStore } from '../stores/vehicleStore';

let isSimulationActive = false;

export const simulateRoute = () => {
  const startPosition = { lat: 40.7128, lng: -74.0060 }; // NYC
  let currentPosition = { ...startPosition };
  let isMoving = true;
  let moveInterval: number | null = null;
  let stoppedPosition: google.maps.LatLngLiteral | null = null;

  const updatePosition = () => {
    if (!useVehicleStore.getState().isDriverTracking) {
      cleanup();
      return;
    }

    let position: google.maps.LatLngLiteral;

    if (isMoving) {
      position = {
        lat: currentPosition.lat + (Math.random() - 0.5) * 0.005,
        lng: currentPosition.lng + (Math.random() - 0.5) * 0.005,
      };
      currentPosition = position;
    } else if (stoppedPosition) {
      position = stoppedPosition;
    } else {
      position = currentPosition;
    }

    const mockPosition = {
      coords: {
        latitude: position.lat,
        longitude: position.lng,
        accuracy: 10,
      },
      timestamp: Date.now(),
    };
    
    if (navigator.geolocation && isSimulationActive) {
      const originalGetCurrentPosition = navigator.geolocation.getCurrentPosition;
      navigator.geolocation.getCurrentPosition = (success) => {
        success(mockPosition);
        navigator.geolocation.getCurrentPosition = originalGetCurrentPosition;
      };
      
      const event = new Event('mockLocationUpdate');
      document.dispatchEvent(event);
    }
  };

  const startMoving = () => {
    if (!useVehicleStore.getState().isDriverTracking) {
      console.log('Cannot start: tracking is not active');
      return;
    }
    
    console.log('Starting simulation movement...');
    isSimulationActive = true;
    isMoving = true;
    stoppedPosition = null;
    
    if (moveInterval) {
      clearInterval(moveInterval);
    }
    moveInterval = window.setInterval(updatePosition, 2000);
    updatePosition();
  };

  const stopMoving = () => {
    console.log('Stopping simulation at:', currentPosition);
    isMoving = false;
    stoppedPosition = { ...currentPosition };
    
    if (moveInterval) {
      clearInterval(moveInterval);
    }
    moveInterval = window.setInterval(updatePosition, 2000);
    updatePosition();
  };

  const cleanup = () => {
    console.log('Cleaning up simulation...');
    if (moveInterval) {
      clearInterval(moveInterval);
      moveInterval = null;
    }
    isMoving = false;
    stoppedPosition = null;
    isSimulationActive = false;
  };

  // Start with movement
  startMoving();

  return {
    startMoving,
    stopMoving,
    cleanup,
    getCurrentPosition: () => currentPosition,
    isMoving: () => isMoving
  };
};

// Add a test function to check if stop was detected
export const checkStopDetection = () => {
  const store = useVehicleStore.getState();
  const stops = store.routeHistory.stops;
  
  console.log('Current stops:', stops);
  
  if (stops.length > 0) {
    stops.forEach((stop, index) => {
      const duration = stop.duration ? stop.duration / (1000 * 60) : 'ongoing';
      console.log(`Stop ${index + 1}:`, {
        startTime: stop.startTime,
        endTime: stop.endTime || 'not ended',
        duration: typeof duration === 'number' ? `${duration.toFixed(1)} minutes` : duration,
        position: stop.position
      });
    });
    return true;
  }
  
  console.log('No stops detected yet');
  return false;
}; 