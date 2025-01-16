import React from 'react';
import { useVehicleStore } from '../stores/vehicleStore';

const VehicleList: React.FC = () => {
  const vehicles = useVehicleStore((state) => state.vehicles);

  if (vehicles.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        No vehicles currently active
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {vehicles.map((vehicle) => (
        <div
          key={vehicle.id}
          className="bg-white p-4 rounded-lg shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">{vehicle.name}</h3>
              <p className="text-sm text-gray-500">
                Last update: {new Date(vehicle.lastUpdate).toLocaleTimeString()}
              </p>
            </div>
            <div className={`w-2 h-2 rounded-full ${
              vehicle.status === 'active' ? 'bg-green-500' : 'bg-gray-400'
            }`} />
          </div>
        </div>
      ))}
    </div>
  );
};

export default VehicleList;