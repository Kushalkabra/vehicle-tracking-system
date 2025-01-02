import React from 'react';
import { useVehicleStore } from '../stores/vehicleStore';
import { Car, Battery, AlertTriangle } from 'lucide-react';

const Dashboard: React.FC = () => {
  const vehicles = useVehicleStore((state) => state.vehicles);
  
  const activeVehicles = vehicles.filter(v => v.status === 'active').length;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {[
        {
          title: 'Total Vehicles',
          value: vehicles.length,
          icon: Car,
          gradient: 'from-blue-500 to-blue-600'
        },
        {
          title: 'Active Vehicles',
          value: activeVehicles,
          icon: Battery,
          gradient: 'from-emerald-500 to-emerald-600'
        },
        {
          title: 'Inactive Vehicles',
          value: vehicles.length - activeVehicles,
          icon: AlertTriangle,
          gradient: 'from-amber-500 to-amber-600'
        }
      ].map(card => (
        <div key={card.title} 
          className="relative overflow-hidden bg-white rounded-xl shadow-card hover:shadow-soft transition-all duration-300"
        >
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-neutral-600 text-sm font-medium">{card.title}</p>
                <h3 className="text-3xl font-bold mt-1 text-neutral-900">{card.value}</h3>
              </div>
              <div className={`p-3 rounded-xl bg-gradient-to-br ${card.gradient} text-white`}>
                <card.icon className="w-6 h-6" />
              </div>
            </div>
          </div>
          <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${card.gradient}`} />
        </div>
      ))}
    </div>
  );
};

export default Dashboard; 