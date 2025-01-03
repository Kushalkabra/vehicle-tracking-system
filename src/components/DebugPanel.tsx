import React, { useState, useEffect } from 'react';
import { useVehicleStore } from '../stores/vehicleStore';

const DebugPanel: React.FC = () => {
  const [updates, setUpdates] = useState<Date[]>([]);
  const vehicles = useVehicleStore((state) => state.vehicles);

  useEffect(() => {
    const driverVehicle = vehicles.find(v => v.id === 'driver-1');
    if (driverVehicle) {
      setUpdates(prev => [...prev, new Date()].slice(-10)); // Keep last 10 updates
    }
  }, [vehicles]);

  const calculateUpdateFrequency = () => {
    if (updates.length < 2) return 'N/A';
    const lastTwo = updates.slice(-2);
    const diff = lastTwo[1].getTime() - lastTwo[0].getTime();
    return `${(diff / 1000).toFixed(1)} seconds`;
  };

  return (
    <div className="fixed bottom-4 left-4 p-4 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg max-w-xs">
      <h4 className="font-semibold mb-2">Debug Info</h4>
      <div className="text-sm space-y-1">
        <p>Updates: {updates.length}</p>
        <p>Frequency: {calculateUpdateFrequency()}</p>
        <p>Last Update: {updates[updates.length - 1]?.toLocaleTimeString() || 'N/A'}</p>
      </div>
    </div>
  );
};

export default DebugPanel; 