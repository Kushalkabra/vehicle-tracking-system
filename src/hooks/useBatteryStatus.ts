import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

interface BatteryManager extends EventTarget {
  charging: boolean;
  chargingTime: number;
  dischargingTime: number;
  level: number;
}

declare global {
  interface Navigator {
    getBattery?: () => Promise<BatteryManager>;
  }
}

export const useBatteryStatus = () => {
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [isCharging, setIsCharging] = useState<boolean | null>(null);
  const [isBatteryLow, setIsBatteryLow] = useState(false);

  useEffect(() => {
    const initBattery = async () => {
      try {
        if (!navigator.getBattery) {
          console.log('Battery API not supported');
          return;
        }

        const battery = await navigator.getBattery();

        const updateBatteryInfo = () => {
          setBatteryLevel(battery.level * 100);
          setIsCharging(battery.charging);
          setIsBatteryLow(battery.level <= 0.15);

          if (battery.level <= 0.15 && !battery.charging) {
            toast.error(
              'Battery level is low. Please connect your device to a charger to continue tracking.',
              { duration: 5000 }
            );
          }
        };

        // Initial update
        updateBatteryInfo();

        // Add event listeners
        battery.addEventListener('levelchange', updateBatteryInfo);
        battery.addEventListener('chargingchange', updateBatteryInfo);

        return () => {
          battery.removeEventListener('levelchange', updateBatteryInfo);
          battery.removeEventListener('chargingchange', updateBatteryInfo);
        };
      } catch (error) {
        console.error('Error accessing battery status:', error);
      }
    };

    initBattery();
  }, []);

  return {
    batteryLevel,
    isCharging,
    isBatteryLow
  };
}; 