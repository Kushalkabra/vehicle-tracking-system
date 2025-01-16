import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import toast from 'react-hot-toast';

const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [hasOfflineData, setHasOfflineData] = useState(false);

  useEffect(() => {
    const checkOfflineData = async () => {
      try {
        const dbRequest = indexedDB.open('FleetTracker');
        const db = await new Promise<IDBDatabase>((resolve, reject) => {
          dbRequest.onerror = () => reject(dbRequest.error);
          dbRequest.onsuccess = () => resolve(dbRequest.result);
        });
        
        const transaction = db.transaction(['locationUpdates'], 'readonly');
        const store = transaction.objectStore('locationUpdates');
        const count = await new Promise<number>((resolve, reject) => {
          const request = store.count();
          request.onerror = () => reject(request.error);
          request.onsuccess = () => resolve(request.result);
        });
        
        setHasOfflineData(count > 0);
        db.close();
      } catch (error) {
        console.error('Error checking offline data:', error);
      }
    };

    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Back online');
      checkOfflineData();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.error('You are offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    checkOfflineData();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline && !hasOfflineData) return null;

  return (
    <div className={`fixed bottom-4 left-4 z-50 ${isOnline ? 'bg-yellow-100' : 'bg-red-100'} rounded-lg shadow-lg p-3`}>
      <div className="flex items-center space-x-2">
        {isOnline ? (
          <>
            <Wifi className="w-4 h-4 text-yellow-600" />
            <span className="text-sm text-yellow-800">
              Syncing offline data...
            </span>
          </>
        ) : (
          <>
            <WifiOff className="w-4 h-4 text-red-600" />
            <span className="text-sm text-red-800">
              You're offline. Updates will sync when connection is restored.
            </span>
          </>
        )}
      </div>
    </div>
  );
};

export default OfflineIndicator; 