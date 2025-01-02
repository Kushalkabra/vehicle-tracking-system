import React, { useState } from 'react';
import { MapPin, Trash2 } from 'lucide-react';
import { useVehicleStore } from '../stores/vehicleStore';

interface GeofenceControlProps {
  onAddMode: () => void;
  isAddMode: boolean;
  geofenceName: string;
  geofenceRadius: string;
  onNameChange: (name: string) => void;
  onRadiusChange: (radius: string) => void;
}

const GeofenceControl: React.FC<GeofenceControlProps> = ({ 
  onAddMode, 
  isAddMode,
  geofenceName,
  geofenceRadius,
  onNameChange,
  onRadiusChange
}) => {
  const geofences = useVehicleStore((state) => state.geofences);
  const removeGeofence = useVehicleStore((state) => state.removeGeofence);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">Geofences</h4>
        <button
          onClick={onAddMode}
          className={`px-3 py-1 rounded-lg ${
            isAddMode 
              ? 'bg-red-100 text-red-600 hover:bg-red-200' 
              : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
          }`}
        >
          {isAddMode ? 'Cancel' : 'Add Geofence'}
        </button>
      </div>

      {isAddMode && (
        <div className="space-y-2 p-3 bg-gray-50 rounded-lg">
          <input
            id="geofence-name"
            type="text"
            placeholder="Geofence name"
            value={geofenceName}
            onChange={(e) => onNameChange(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
          />
          <input
            id="geofence-radius"
            type="number"
            placeholder="Radius (meters)"
            value={geofenceRadius}
            onChange={(e) => onRadiusChange(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
          />
          <p className="text-sm text-gray-500">
            Click on the map to place the geofence
          </p>
        </div>
      )}

      <div className="space-y-2">
        {geofences.map((geofence) => (
          <div 
            key={geofence.id}
            className="flex items-center justify-between p-2 bg-white rounded-lg border"
          >
            <div className="flex items-center space-x-2">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: geofence.color }}
              />
              <span>{geofence.name}</span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <span className="text-gray-500">{geofence.radius}m</span>
              <button
                onClick={() => removeGeofence(geofence.id)}
                className="p-1 hover:bg-red-100 rounded-full text-red-500"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GeofenceControl; 