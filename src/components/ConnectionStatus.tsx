import React, { useEffect, useState } from 'react';
import { useVehicles } from '../context/VehicleContext';
import { Wifi, WifiOff } from 'lucide-react';

const ConnectionStatus: React.FC = () => {
  const { socket } = useVehicles();
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!socket) return;

    const handleConnect = () => {
      setIsConnected(true);
    };

    const handleDisconnect = () => {
      setIsConnected(false);
    };

    // Set initial connection state based on socket readyState
    setIsConnected(socket.readyState === WebSocket.OPEN);

    // Add event listeners
    socket.addEventListener('open', handleConnect);
    socket.addEventListener('close', handleDisconnect);
    socket.addEventListener('error', handleDisconnect);

    return () => {
      // Remove event listeners
      socket.removeEventListener('open', handleConnect);
      socket.removeEventListener('close', handleDisconnect);
      socket.removeEventListener('error', handleDisconnect);
    };
  }, [socket]);

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
        isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
      }`}>
        {isConnected ? (
          <Wifi className="w-4 h-4" />
        ) : (
          <WifiOff className="w-4 h-4" />
        )}
        <span className="text-sm font-medium">
          {isConnected ? 'Connected' : 'Disconnected'}
        </span>
      </div>
    </div>
  );
};

export default ConnectionStatus; 