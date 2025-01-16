import { useEffect, useState } from 'react';
import { useNetworkStatus } from './useNetworkStatus';
import { useBatteryStatus } from './useBatteryStatus';
import { adaptiveTracking } from '../utils/adaptiveTracking';

export const useAdaptiveTracking = () => {
  const { networkType, effectiveType } = useNetworkStatus();
  const { batteryLevel, isCharging } = useBatteryStatus();
  const [config, setConfig] = useState(adaptiveTracking.baseConfig);

  useEffect(() => {
    if (batteryLevel === null) return;

    const newConfig = adaptiveTracking.getBestConfig(
      networkType,
      effectiveType,
      batteryLevel,
      isCharging || false
    );

    setConfig(newConfig);
  }, [networkType, effectiveType, batteryLevel, isCharging]);

  return config;
}; 