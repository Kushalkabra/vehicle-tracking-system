import React, { useState, useEffect } from 'react';

interface UpdateLog {
  timestamp: string;
  coords: { lat: number; lng: number };
}

interface LocationUpdateEvent extends CustomEvent {
  detail: {
    position: { lat: number; lng: number };
    timestamp: string;
  };
}

const DebugPanel: React.FC = () => {
  const [logs, setLogs] = useState<UpdateLog[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  const addLog = (log: UpdateLog) => {
    setLogs(prev => [...prev.slice(-9), log]); // Keep last 10 updates
  };

  useEffect(() => {
    const handleLocationUpdate = (event: LocationUpdateEvent) => {
      addLog({
        timestamp: event.detail.timestamp,
        coords: event.detail.position
      });
    };

    window.addEventListener('locationUpdate', handleLocationUpdate as EventListener);
    return () => {
      window.removeEventListener('locationUpdate', handleLocationUpdate as EventListener);
    };
  }, []);

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="fixed bottom-4 right-4 bg-gray-800 text-white px-4 py-2 rounded-lg"
      >
        Show Debug Panel
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white p-4 rounded-lg shadow-lg max-w-md">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold">Location Update Logs</h3>
        <button
          onClick={() => setIsExpanded(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          Hide
        </button>
      </div>
      <div className="space-y-2 max-h-60 overflow-auto">
        {logs.map((log, index) => (
          <div key={index} className="text-sm">
            <span className="text-gray-500">{log.timestamp}</span>
            <span className="ml-2">
              ({log.coords.lat.toFixed(6)}, {log.coords.lng.toFixed(6)})
            </span>
          </div>
        ))}
        {logs.length === 0 && (
          <p className="text-gray-500 text-center">No updates yet</p>
        )}
      </div>
    </div>
  );
};

export default DebugPanel; 