import React, { createContext, useContext, useEffect, useState } from 'react';
import { useVehicleStore, Vehicle } from '../stores/vehicleStore';
import toast from 'react-hot-toast';

interface VehicleContextType {
  socket: WebSocket | null;
  sendMessage: (type: string, payload: any) => void;
}

const VehicleContext = createContext<VehicleContextType>({
  socket: null,
  sendMessage: () => {},
});

export const useVehicles = () => useContext(VehicleContext);

export const VehicleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const addVehicle = useVehicleStore((state) => state.addVehicle);
  const clearVehicles = useVehicleStore((state) => state.clearVehicles);

  const connectWebSocket = () => {
    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8080';
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('WebSocket connected');
      setSocket(ws);
      setReconnectAttempts(0);
      toast.success('Connected to server');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'driverLocationUpdate') {
          const vehicle: Vehicle = {
            id: data.payload.driverName.toLowerCase().replace(/\s+/g, '-'),
            name: data.payload.driverName,
            position: data.payload.position,
            status: 'active',
            lastUpdate: new Date().toISOString(),
            isDriver: true,
            driverName: data.payload.driverName
          };

          console.log('Received vehicle update:', vehicle);
          addVehicle(vehicle);
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      toast.error('Connection error');
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setSocket(null);
      
      // Attempt to reconnect with exponential backoff
      const maxAttempts = 5;
      if (reconnectAttempts < maxAttempts) {
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
        setTimeout(() => {
          setReconnectAttempts(prev => prev + 1);
          connectWebSocket();
        }, delay);
      } else {
        clearVehicles();
        toast.error('Connection lost. Please refresh the page.');
      }
    };

    return ws;
  };

  useEffect(() => {
    const ws = connectWebSocket();
    return () => {
      ws.close();
      clearVehicles();
    };
  }, []);

  const sendMessage = (type: string, payload: any) => {
    if (socket?.readyState === WebSocket.OPEN) {
      const message = JSON.stringify({ type, payload });
      console.log('Sending message:', message);
      socket.send(message);
    } else {
      console.warn('WebSocket is not connected');
      toast.error('Not connected to server');
    }
  };

  return (
    <VehicleContext.Provider value={{ socket, sendMessage }}>
      {children}
    </VehicleContext.Provider>
  );
}; 