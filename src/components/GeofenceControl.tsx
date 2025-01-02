import React, { useState } from 'react';
import { MapPin, Trash2, Info } from 'lucide-react';
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
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center">
            <MapPin className="w-5 h-5 text-primary-500" />
          </div>
          <h4 className="font-semibold text-gray-800">Geofences</h4>
        </div>
        <button
          onClick={onAddMode}
          className={`px-3 py-1.5 rounded-lg transition-all duration-200 ${
            isAddMode 
              ? 'bg-red-50 text-red-600 hover:bg-red-100' 
              : 'bg-primary-50 text-primary-600 hover:bg-primary-100'
          }`}
        >
          {isAddMode ? 'Cancel' : 'Add Geofence'}
        </button>
      </div>

      {isAddMode && (
        <div className="space-y-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
          <input
            id="geofence-name"
            type="text"
            placeholder="Geofence name"
            value={geofenceName}
            onChange={(e) => onNameChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
          />
          <div className="relative">
            <input
              id="geofence-radius"
              type="number"
              placeholder="Radius (meters)"
              value={geofenceRadius}
              onChange={(e) => onRadiusChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">m</span>
          </div>
          <p className="text-sm text-gray-500 flex items-center space-x-1">
            <Info size={14} />
            <span>Click on the map to place the geofence</span>
          </p>
        </div>
      )}

      <div className="space-y-2 max-h-[300px] overflow-y-auto scrollbar-thin">
        {geofences.map((geofence) => (
          <div 
            key={geofence.id}
            className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100 hover:border-primary-200 transition-colors duration-200"
          >
            <div className="flex items-center space-x-2">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: geofence.color }}
              />
              <span className="font-medium text-gray-700">{geofence.name}</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-500">{geofence.radius}m</span>
              <button
                onClick={() => removeGeofence(geofence.id)}
                className="p-1.5 hover:bg-red-50 rounded-lg text-red-500 transition-colors duration-200"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
        {geofences.length === 0 && !isAddMode && (
          <div className="text-center py-6 text-gray-500">
            <MapPin className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p>No geofences added yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GeofenceControl; 