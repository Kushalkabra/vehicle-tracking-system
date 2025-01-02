import React from 'react';
import Dashboard from '../components/Dashboard';
import MapView from '../components/MapView';
import VehicleList from '../components/VehicleList';
import { useVehicleStore } from '../stores/vehicleStore';
import { MapIcon } from 'lucide-react';

const DashboardPage: React.FC = () => {
  const vehicles = useVehicleStore((state) => state.vehicles);
  const driverVehicle = vehicles.find(v => v.id === 'driver-1');

  // Default to NYC coordinates, or use driver's position if available
  const mapCenter = driverVehicle?.position || { lat: 40.7128, lng: -74.0060 };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Dashboard</h2>
      <Dashboard />
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-3xl mx-auto">
            <div className="flex items-center mb-4">
              <MapIcon className="w-6 h-6 text-blue-500 mr-2" />
              <h3 className="text-lg font-semibold">Live Location Tracking</h3>
            </div>
            <div className="h-[400px] rounded-lg overflow-hidden border border-gray-200">
              <MapView
                center={mapCenter}
                zoom={12}
              />
            </div>
          </div>
        </div>
        <div className="lg:col-span-1">
          <VehicleList />
        </div>
      </div>
    </div>
  );
};

export default DashboardPage; 