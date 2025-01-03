import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import MapView from '../components/MapView';
import { useVehicleStore } from '../stores/vehicleStore';
import { TestSimulation, checkStopDetection } from '../utils/testSimulation';
import { AlertCircle, PlayCircle, StopCircle, Play, ClipboardList, Settings, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import VehicleList from '../components/VehicleList';

const TestingEnvironment: React.FC = () => {
  const [simulation, setSimulation] = useState<TestSimulation | null>(null);
  const [activeTest, setActiveTest] = useState('route-simulation');
  const vehicles = useVehicleStore((state) => state.vehicles);
  const testVehicle = vehicles.find(v => v.id === 'test-vehicle');
  const routeHistory = useVehicleStore((state) => state.routeHistory);

  const startSimulation = () => {
    if (simulation) {
      simulation.cleanup();
    }
    const newSimulation = new TestSimulation();
    setSimulation(newSimulation);
    newSimulation.start();
    
    toast.success('Test simulation started', {
      icon: '🚗',
      duration: 2000
    });
  };

  const stopSimulation = () => {
    if (simulation) {
      simulation.stop();
      toast.success('Vehicle stopped - monitoring for stop duration', {
        icon: '🛑',
        duration: 3000
      });
    }
  };

  const resumeSimulation = () => {
    if (simulation) {
      simulation.resume();
      toast.success('Vehicle movement resumed', {
        icon: '▶️',
        duration: 2000
      });
    }
  };

  const handleCheckStops = () => {
    const stops = checkStopDetection();
    
    if (stops.length === 0) {
      toast.error('No valid stops detected (minimum 30 seconds)', {
        icon: '❌',
        duration: 3000
      });
      return;
    }

    const lastStop = stops[stops.length - 1];
    const isOngoing = lastStop.endTime === 'ongoing';
    const duration = lastStop.duration;

    if (isOngoing) {
      toast.loading(`Current stop duration: ${duration}`, {
        icon: '⏳',
        duration: 3000
      });
    } else {
      toast.success(`Last stop duration: ${duration}`, {
        icon: '⏱️',
        duration: 4000
      });
    }
  };

  const clearTestData = () => {
    if (simulation) {
      simulation.cleanup();
      setSimulation(null);
    }
    // Clear only test route history
    useVehicleStore.getState().clearRouteHistory('test');
    const testVehicle = vehicles.find(v => v.id === 'test-vehicle');
    if (testVehicle) {
      useVehicleStore.getState().removeVehicle('test-vehicle');
    }
    toast.success('Test data cleared', {
      icon: '🧹',
      duration: 2000
    });
  };

  // Cleanup simulation when component unmounts
  useEffect(() => {
    return () => {
      if (simulation) {
        simulation.cleanup();
      }
    };
  }, [simulation]);

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Testing Environment</h1>
          <p className="text-sm text-gray-500">Test and debug application features</p>
        </div>
        <div className="flex items-center space-x-2 px-4 py-2 bg-yellow-50 text-yellow-700 rounded-lg">
          <AlertCircle className="w-5 h-5" />
          <span className="text-sm font-medium">Testing Mode</span>
        </div>
      </div>

      <Tabs defaultValue={activeTest} onValueChange={setActiveTest}>
        <TabsList className="grid grid-cols-3 gap-4 bg-transparent">
          <TabsTrigger 
            value="route-simulation"
            className="data-[state=active]:bg-primary-100 data-[state=active]:text-primary-700"
          >
            Route Simulation
          </TabsTrigger>
          <TabsTrigger 
            value="stop-detection"
            className="data-[state=active]:bg-primary-100 data-[state=active]:text-primary-700"
          >
            Stop Detection
          </TabsTrigger>
          <TabsTrigger 
            value="geofencing"
            className="data-[state=active]:bg-primary-100 data-[state=active]:text-primary-700"
          >
            Geofencing
          </TabsTrigger>
        </TabsList>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map Section */}
          <div className="lg:col-span-2">
            <MapView 
              center={testVehicle?.position || { lat: 40.7128, lng: -74.0060 }}
              zoom={13}
              showRouteHistory={true}
              isTestEnvironment={true}
            />
          </div>

          {/* Controls Section */}
          <div className="space-y-6">
            <VehicleList isTestEnvironment={true} />

            <TabsContent value="route-simulation" className="mt-0">
              <div className="bg-white rounded-xl shadow-card p-6">
                <button
                  onClick={clearTestData}
                  className="w-full px-4 py-2 mb-4 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 flex items-center justify-center space-x-2"
                >
                  <Trash2 className="w-5 h-5" />
                  <span>Clear Test Data</span>
                </button>

                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                    <PlayCircle className="w-6 h-6 text-purple-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">Route Testing</h3>
                    <p className="text-sm text-gray-500">Simulate vehicle movement</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={startSimulation}
                    className="w-full px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 flex items-center justify-center space-x-2"
                  >
                    <PlayCircle className="w-5 h-5" />
                    <span>Start Test Route</span>
                  </button>
                  
                  <button
                    onClick={stopSimulation}
                    className="w-full px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 flex items-center justify-center space-x-2"
                  >
                    <StopCircle className="w-5 h-5" />
                    <span>Stop Vehicle</span>
                  </button>
                  
                  <button
                    onClick={resumeSimulation}
                    className="w-full px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 flex items-center justify-center space-x-2"
                  >
                    <Play className="w-5 h-5" />
                    <span>Resume Movement</span>
                  </button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="stop-detection" className="mt-0">
              <div className="bg-white rounded-xl shadow-card p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center">
                    <ClipboardList className="w-6 h-6 text-orange-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">Stop Detection</h3>
                    <p className="text-sm text-gray-500">Test stop detection logic</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-700 mb-2">Current Settings</h4>
                    <div className="space-y-2 text-sm text-gray-600">
                      <p>Stop Threshold: 30 seconds</p>
                      <p>Movement Threshold: 20 meters</p>
                    </div>
                  </div>

                  <button
                    onClick={handleCheckStops}
                    className="w-full px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 flex items-center justify-center space-x-2"
                  >
                    <ClipboardList className="w-5 h-5" />
                    <span>Check Detected Stops</span>
                  </button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="geofencing" className="mt-0">
              <div className="bg-white rounded-xl shadow-card p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center">
                    <Settings className="w-6 h-6 text-indigo-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">Geofencing</h3>
                    <p className="text-sm text-gray-500">Test geofence triggers</p>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg text-center text-gray-500">
                  Geofencing tests coming soon
                </div>
              </div>
            </TabsContent>
          </div>
        </div>
      </Tabs>
    </div>
  );
};

export default TestingEnvironment; 