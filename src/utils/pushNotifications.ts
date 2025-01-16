import toast from 'react-hot-toast';

class PushNotificationManager {
  private registration: ServiceWorkerRegistration | null = null;

  async init() {
    try {
      if (!('Notification' in window)) {
        console.log('Push notifications not supported');
        return;
      }

      this.registration = await navigator.serviceWorker.ready;
      const permission = await this.requestPermission();
      
      if (permission === 'granted') {
        await this.subscribeToPush();
      }
    } catch (error) {
      console.error('Error initializing push notifications:', error);
    }
  }

  private async requestPermission(): Promise<NotificationPermission> {
    try {
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        toast.success('Push notifications enabled');
      } else {
        toast.error('Push notifications denied');
      }
      
      return permission;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return 'denied';
    }
  }

  private async subscribeToPush() {
    try {
      if (!this.registration) return;

      const subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(process.env.VITE_VAPID_PUBLIC_KEY || '')
      });

      console.log('Push subscription:', subscription);
      
      // Send subscription to server
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscription)
      });
    } catch (error) {
      console.error('Error subscribing to push:', error);
    }
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  async sendNotification(title: string, options: NotificationOptions = {}) {
    try {
      if (!this.registration) return;

      await this.registration.showNotification(title, {
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        ...options
      });
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }
}

export const pushNotifications = new PushNotificationManager(); 