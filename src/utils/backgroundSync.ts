import { db } from './db';
import toast from 'react-hot-toast';

interface SyncManager {
  register(tag: string): Promise<void>;
}

declare global {
  interface ServiceWorkerRegistration {
    sync: SyncManager;
  }
}

class BackgroundSyncManager {
  private registration: ServiceWorkerRegistration | null = null;

  async init() {
    try {
      if ('serviceWorker' in navigator) {
        this.registration = await navigator.serviceWorker.ready;
        console.log('Background sync manager initialized');
      }
    } catch (error) {
      console.error('Failed to initialize background sync:', error);
    }
  }

  async registerSync(tag: string = 'locationUpdate') {
    try {
      if (!this.registration?.sync) {
        console.warn('Background Sync not supported');
        return false;
      }

      await this.registration.sync.register(tag);
      console.log('Background sync registered:', tag);
      return true;
    } catch (error) {
      console.error('Failed to register background sync:', error);
      return false;
    }
  }

  async scheduleLocationSync(locationData: any) {
    try {
      await db.saveLocationUpdate(locationData);
      
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Background Update', {
          body: `Location updated at ${new Date().toLocaleTimeString()}`,
          icon: '/icons/icon-192x192.png',
          tag: 'background-update'
        });
      }

      if (this.registration?.sync) {
        await this.registerSync();
        console.log('Background sync scheduled');
      } else {
        await this.fallbackSync(locationData);
      }
    } catch (error) {
      console.error('Error scheduling background sync:', error);
    }
  }

  private async fallbackSync(locationData: any) {
    // Implement retry logic for browsers without background sync
    const maxRetries = 3;
    let retries = 0;

    const attemptSync = async () => {
      try {
        const response = await fetch('/api/location', {
          method: 'POST',
          body: JSON.stringify(locationData),
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          await db.clearPendingUpdates();
          console.log('Fallback sync successful');
        } else {
          throw new Error('Sync failed');
        }
      } catch (error) {
        retries++;
        if (retries < maxRetries) {
          console.log(`Retry attempt ${retries}/${maxRetries}`);
          setTimeout(attemptSync, 1000 * Math.pow(2, retries));
        } else {
          console.error('Max retries reached');
          toast.error('Failed to sync location after multiple attempts');
        }
      }
    };

    await attemptSync();
  }
}

async function requestPeriodicSync() {
  if ('periodicSync' in navigator.serviceWorker) {
    try {
      const registration = await navigator.serviceWorker.ready;
      if ('periodicSync' in registration) {
        await registration.periodicSync.register('location-sync', {
          minInterval: 15 * 60 * 1000 // Minimum 15 minutes
        });
        console.log('Periodic background sync registered');
      }
    } catch (error) {
      console.error('Periodic background sync registration failed:', error);
    }
  }
}

export const backgroundSync = new BackgroundSyncManager(); 