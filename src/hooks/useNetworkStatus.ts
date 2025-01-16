import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [networkType, setNetworkType] = useState<string | null>(null);
  const [effectiveType, setEffectiveType] = useState<string | null>(null);

  useEffect(() => {
    const updateNetworkInfo = () => {
      if ('connection' in navigator) {
        const conn = (navigator as any).connection;
        setNetworkType(conn.type);
        setEffectiveType(conn.effectiveType);

        if (conn.effectiveType === 'slow-2g' || conn.effectiveType === '2g') {
          toast('Slow network connection detected', {
            icon: '⚠️',
            style: {
              backgroundColor: '#FEF3C7',
              color: '#92400E',
              borderLeft: '4px solid #F59E0B'
            },
            duration: 5000,
          });
        }
      }
    };

    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Back online');
      updateNetworkInfo();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.error('You are offline');
    };

    const handleConnectionChange = () => {
      updateNetworkInfo();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if ('connection' in navigator) {
      (navigator as any).connection.addEventListener('change', handleConnectionChange);
      updateNetworkInfo();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if ('connection' in navigator) {
        (navigator as any).connection.removeEventListener('change', handleConnectionChange);
      }
    };
  }, []);

  return {
    isOnline,
    networkType,
    effectiveType
  };
}; 