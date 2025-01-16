import { backgroundSync } from './backgroundSync';
import toast from 'react-hot-toast';

interface PeriodicSyncManager {
  register(tag: string, options?: { minInterval: number }): Promise<void>;
  unregister(tag: string): Promise<void>;
  getTags(): Promise<string[]>;
}

declare global {
  interface ServiceWorkerRegistration {
    periodicSync: PeriodicSyncManager;
  }
}

class PeriodicSyncManager {
  private registration: ServiceWorkerRegistration | null = null;

  async init() {
    try {
      if (!('serviceWorker' in navigator)) {
        console.warn('Service Worker not supported');
        return;
      }

      this.registration = await navigator.serviceWorker.ready;

      if (!('periodicSync' in this.registration)) {
        console.warn('Periodic Sync not supported');
        return;
      }

      await this.registerPeriodicSync();
    } catch (error) {
      console.error('Error initializing periodic sync:', error);
    }
  }

  private async registerPeriodicSync() {
    try {
      if (!this.registration?.periodicSync) return;

      // Check permission
      const status = await navigator.permissions.query({
        name: 'periodic-background-sync' as any
      });

      if (status.state === 'granted') {
        await this.registration.periodicSync.register('location-sync', {
          minInterval: 15 * 60 * 1000 // 15 minutes
        });

        console.log('Periodic sync registered');
        toast.success('Background sync enabled');
      } else {
        console.warn('Periodic Sync permission not granted');
      }
    } catch (error) {
      console.error('Error registering periodic sync:', error);
    }
  }

  async unregisterPeriodicSync() {
    try {
      if (!this.registration?.periodicSync) return;

      await this.registration.periodicSync.unregister('location-sync');
      console.log('Periodic sync unregistered');
    } catch (error) {
      console.error('Error unregistering periodic sync:', error);
    }
  }
}

export const periodicSync = new PeriodicSyncManager(); 