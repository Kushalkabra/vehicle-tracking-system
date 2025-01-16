import { useNetworkStatus } from '../hooks/useNetworkStatus';

interface TrackingConfig {
  interval: number;
  accuracy: PositionOptions['enableHighAccuracy'];
  timeout: number;
  maximumAge: number;
}

class AdaptiveTrackingManager {
  public readonly baseConfig: TrackingConfig = {
    interval: 5000,
    accuracy: true,
    timeout: 20000,
    maximumAge: 5000
  };

  getConfigForNetwork(networkType: string | null, effectiveType: string | null): TrackingConfig {
    // Adjust tracking parameters based on network conditions
    switch (effectiveType) {
      case '4g':
        return {
          ...this.baseConfig,
          interval: 5000,
          accuracy: true
        };
      case '3g':
        return {
          ...this.baseConfig,
          interval: 10000,
          accuracy: true
        };
      case '2g':
        return {
          ...this.baseConfig,
          interval: 30000,
          accuracy: false,
          maximumAge: 60000
        };
      case 'slow-2g':
        return {
          ...this.baseConfig,
          interval: 60000,
          accuracy: false,
          maximumAge: 120000
        };
      default:
        return this.baseConfig;
    }
  }

  getConfigForBattery(batteryLevel: number, isCharging: boolean): Partial<TrackingConfig> {
    if (isCharging) {
      return this.baseConfig;
    }

    if (batteryLevel <= 0.15) {
      return {
        interval: 60000,
        accuracy: false,
        maximumAge: 120000
      };
    }

    if (batteryLevel <= 0.3) {
      return {
        interval: 30000,
        accuracy: false,
        maximumAge: 60000
      };
    }

    return this.baseConfig;
  }

  getBestConfig(
    networkType: string | null,
    effectiveType: string | null,
    batteryLevel: number,
    isCharging: boolean
  ): TrackingConfig {
    const networkConfig = this.getConfigForNetwork(networkType, effectiveType);
    const batteryConfig = this.getConfigForBattery(batteryLevel, isCharging);

    // Use the more conservative settings between network and battery
    return {
      interval: Math.max(networkConfig.interval, batteryConfig.interval || 0),
      accuracy: networkConfig.accuracy && (batteryConfig.accuracy !== false),
      timeout: Math.max(networkConfig.timeout, batteryConfig.timeout || 0),
      maximumAge: Math.max(networkConfig.maximumAge, batteryConfig.maximumAge || 0)
    };
  }
}

export const adaptiveTracking = new AdaptiveTrackingManager(); 