import React from 'react';
import { useVehicleStore } from '../stores/vehicleStore';
import { Car } from 'lucide-react';

const VehicleList: React.FC = () => {
  const vehicles = useVehicleStore((state) => state.vehicles);

  return (
    <div className="bg-white rounded-lg shadow-lg p-4">
      <h2 className="text-xl font-semibold mb-4">Vehicles</h2>
      <div className="space-y-4">
        {vehicles.map((vehicle) => (
          <div
            key={vehicle.id}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
          >
            <div className="flex items-center space-x-3">
              <Car className="w-6 h-6 text-blue-500" />
              <div>
                <h3 className="font-medium">{vehicle.name}</h3>
                <p className="text-sm text-gray-500">
                  Last updated: {vehicle.lastUpdate.toLocaleTimeString()}
                </p>
              </div>
            </div>
            <span
              className={`px-2 py-1 rounded-full text-xs ${
                vehicle.status === 'active'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {vehicle.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VehicleList;