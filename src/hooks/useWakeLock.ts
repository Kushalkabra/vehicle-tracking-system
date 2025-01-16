import { useState, useCallback, useEffect } from 'react';
import toast from 'react-hot-toast';

export const useWakeLock = () => {
  const [wakeLock, setWakeLock] = useState<WakeLockSentinel | null>(null);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // Check if Wake Lock API is supported
    setIsSupported('wakeLock' in navigator);
  }, []);

  const requestWakeLock = useCallback(async () => {
    if (!isSupported) {
      console.warn('Wake Lock API is not supported');
      toast.error('Screen wake lock is not supported on this device');
      return false;
    }

    try {
      console.log('🔒 Requesting wake lock...');
      const lock = await navigator.wakeLock.request('screen');
      setWakeLock(lock);
      console.log('✅ Wake Lock activated');
      toast.success('Screen will stay awake while tracking');
      
      lock.addEventListener('release', () => {
        console.log('⚠️ Wake Lock was released');
        setWakeLock(null);
        toast('Screen wake lock was released', {
          icon: '⚠️',
          style: {
            backgroundColor: '#FEF3C7',
            color: '#92400E',
            borderLeft: '4px solid #F59E0B'
          }
        });
      });

      return true;
    } catch (err) {
      console.error('❌ Wake Lock request failed:', err);
      toast.error('Failed to keep screen awake');
      return false;
    }
  }, [isSupported]);

  // Auto re-request wake lock when tab becomes visible
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && !wakeLock) {
        console.log('🔄 Tab visible, re-requesting wake lock');
        await requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [wakeLock, requestWakeLock]);

  const releaseWakeLock = useCallback(async () => {
    if (wakeLock) {
      try {
        await wakeLock.release();
        setWakeLock(null);
        console.log('🔓 Wake Lock released manually');
      } catch (err) {
        console.error('❌ Failed to release wake lock:', err);
      }
    }
  }, [wakeLock]);

  return {
    wakeLock,
    isSupported,
    requestWakeLock,
    releaseWakeLock
  };
}; 