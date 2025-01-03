import React from 'react';
import { PlayCircle, StopCircle, Play, ClipboardList } from 'lucide-react';
import { TestSimulation, checkStopDetection } from '../utils/testSimulation';
import toast from 'react-hot-toast';

const TestSimulationControls: React.FC = () => {
  const [simulation, setSimulation] = React.useState<TestSimulation | null>(null);

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
      toast.error('No stops detected yet', {
        icon: '❌',
        duration: 3000
      });
      return;
    }

    const lastStop = stops[stops.length - 1];
    if (lastStop.endTime === 'ongoing') {
      toast.loading('Vehicle currently stopped', {
        icon: '⏳',
        duration: 3000
      });
    } else {
      toast.success(`Last stop duration: ${lastStop.duration}`, {
        icon: '⏱️',
        duration: 4000
      });
    }
  };

  React.useEffect(() => {
    return () => {
      if (simulation) {
        simulation.cleanup();
      }
    };
  }, [simulation]);

  return (
    <div className="bg-white rounded-xl shadow-card p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
          <PlayCircle className="w-6 h-6 text-purple-500" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-800">Test Simulation</h3>
          <p className="text-sm text-gray-500">Control test route and stops</p>
        </div>
      </div>

      <div className="space-y-3">
        <button
          onClick={startSimulation}
          className="w-full px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 flex items-center justify-center space-x-2"
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

        <button
          onClick={handleCheckStops}
          className="w-full px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 flex items-center justify-center space-x-2"
        >
          <ClipboardList className="w-5 h-5" />
          <span>Check Stops</span>
        </button>
      </div>
    </div>
  );
};

export default TestSimulationControls; 