import React from 'react';
import { useVehicleStore } from '../stores/vehicleStore';
import { Car, Battery, AlertTriangle } from 'lucide-react';

const Dashboard: React.FC = () => {
  const vehicles = useVehicleStore((state) => state.vehicles);
  
  const activeVehicles = vehicles.filter(v => v.status === 'active').length;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-500">Total Vehicles</p>
            <h3 className="text-2xl font-bold">{vehicles.length}</h3>
          </div>
          <Car className="w-8 h-8 text-blue-500" />
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-500">Active Vehicles</p>
            <h3 className="text-2xl font-bold">{activeVehicles}</h3>
          </div>
          <Battery className="w-8 h-8 text-green-500" />
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-500">Inactive Vehicles</p>
            <h3 className="text-2xl font-bold">{vehicles.length - activeVehicles}</h3>
          </div>
          <AlertTriangle className="w-8 h-8 text-yellow-500" />
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 