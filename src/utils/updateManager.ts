import toast from 'react-hot-toast';

class UpdateManager {
  private registration: ServiceWorkerRegistration | null = null;
  private updateFound = false;

  async init() {
    try {
      if (!('serviceWorker' in navigator)) return;

      this.registration = await navigator.serviceWorker.ready;
      this.setupUpdateChecking();
    } catch (error) {
      console.error('Error initializing update manager:', error);
    }
  }

  private setupUpdateChecking() {
    if (!this.registration) return;

    // Check for updates on page load
    this.checkForUpdates();

    // Check for updates periodically
    setInterval(() => this.checkForUpdates(), 60 * 60 * 1000); // Every hour

    // Listen for controller change
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (this.updateFound) {
        window.location.reload();
      }
    });
  }

  private async checkForUpdates() {
    try {
      if (!this.registration) return;

      await this.registration.update();
      
      if (this.registration.waiting) {
        this.notifyUpdate();
      }
    } catch (error) {
      console.error('Error checking for updates:', error);
    }
  }

  private notifyUpdate() {
    toast((t) => 'New version available! Click to update.', {
      duration: Infinity,
      position: 'bottom-center',
      onClick: () => {
        this.applyUpdate();
      }
    } as any); // Type assertion as workaround
  }

  private async applyUpdate() {
    if (!this.registration?.waiting) return;

    this.updateFound = true;
    this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
  }
}

export const updateManager = new UpdateManager(); 