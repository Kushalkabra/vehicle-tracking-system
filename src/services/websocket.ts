import { useVehicleStore } from '../stores/vehicleStore';

declare global {
  interface Window {
    socket: WebSocket;
  }
}

export const initializeWebSocket = () => {
  const socket = new WebSocket(import.meta.env.VITE_WEBSOCKET_URL);
  const store = useVehicleStore.getState();

  socket.onopen = () => {
    console.log('Connected to WebSocket server');
    
    // Restart tracking if it was active
    if (store.isDriverTracking) {
      // Re-establish tracking after reconnection
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          socket.send(JSON.stringify({
            type: 'driver-location',
            vehicleId: 'driver-1',
            position: { lat: latitude, lng: longitude }
          }));
        },
        (error) => console.error('Error getting position:', error)
      );
    }
  };

  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      
      if (data.type === 'location-update') {
        store.updateVehiclePosition(
          data.vehicleId,
          data.position.lat,
          data.position.lng
        );
      }
    } catch (error) {
      console.error('Error processing WebSocket message:', error);
    }
  };

  socket.onclose = () => {
    console.log('Disconnected from WebSocket server');
    // Attempt to reconnect after 5 seconds
    setTimeout(initializeWebSocket, 5000);
  };

  window.socket = socket;
}; 