import React from 'react';
import { useVehicleStore } from '../stores/vehicleStore';
import VehicleList from './VehicleList';
import MapView from './MapView';
import { Vehicle } from '../types';

const Dashboard: React.FC = () => {
  const vehicles = useVehicleStore((state) => state.vehicles);
  const activeVehicles = vehicles.filter((v) => v.status === 'active');

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-sm text-gray-500">Vehicle tracking overview</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <MapView center={{ lat: 40.7128, lng: -74.0060 }} zoom={13} />
        </div>
        <div>
          <VehicleList />
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 