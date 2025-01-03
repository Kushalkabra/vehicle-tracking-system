import React from 'react';
import { useVehicleStore } from '../stores/vehicleStore';
import { Car } from 'lucide-react';

interface VehicleListProps {
  isTestEnvironment?: boolean;
}

const VehicleList: React.FC<VehicleListProps> = ({ isTestEnvironment = false }) => {
  const vehicles = useVehicleStore((state) => state.vehicles);
  
  // Filter out test vehicles in production
  const visibleVehicles = isTestEnvironment 
    ? vehicles 
    : vehicles.filter(v => !v.id.includes('test'));

  const formatLastUpdate = (lastUpdate: Date | string | null) => {
    if (!lastUpdate) return 'Never';
    const date = lastUpdate instanceof Date ? lastUpdate : new Date(lastUpdate);
    return date.toLocaleTimeString();
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4">
      <h2 className="text-xl font-semibold mb-4">Vehicles</h2>
      <div className="space-y-4">
        {visibleVehicles.map((vehicle) => (
          <div
            key={vehicle.id}
            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
          >
            <div className="flex items-center space-x-4">
              <Car className="w-6 h-6 text-gray-600" />
              <div>
                <p className="font-medium">{vehicle.name}</p>
                <p className="text-sm text-gray-500">
                  Last update: {formatLastUpdate(vehicle.lastUpdate)}
                </p>
              </div>
            </div>
            <span
              className={`px-2 py-1 text-sm rounded-full ${
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