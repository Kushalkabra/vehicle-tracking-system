import React from 'react';
import MapView from '../components/MapView';
import VehicleList from '../components/VehicleList';
import { useVehicleStore } from '../stores/vehicleStore';

const DashboardPage: React.FC = () => {
  const vehicles = useVehicleStore((state) => state.vehicles);
  const driverVehicle = vehicles.find(v => v.id === 'driver-1');
  const center = driverVehicle?.position || { lat: 40.7128, lng: -74.0060 }; // NYC default

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <MapView 
            center={center} 
            zoom={13}
            isTestEnvironment={false}
            showRouteHistory={true}
          />
        </div>
        
        <div className="space-y-6">
          <VehicleList isTestEnvironment={false} />
        </div>
      </div>
    </div>
  );
};

export default DashboardPage; 