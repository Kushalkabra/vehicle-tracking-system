export interface QueueItem {
  id: string;
  type: string;
  payload: any;
  timestamp: number;
  retries: number;
  priority: number;
}

interface LocationUpdate {
  id: string;
  timestamp: string;
  position: {
    lat: number;
    lng: number;
  };
  driverName: string;
}

class DatabaseManager {
  private dbName = 'FleetTracker';
  private version = 1;

  async openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains('locationUpdates')) {
          db.createObjectStore('locationUpdates', { keyPath: 'id' });
        }
        
        if (!db.objectStoreNames.contains('queue')) {
          const queueStore = db.createObjectStore('queue', { keyPath: 'id' });
          queueStore.createIndex('timestamp', 'timestamp');
          queueStore.createIndex('priority', 'priority');
        }
        
        if (!db.objectStoreNames.contains('deadLetterQueue')) {
          db.createObjectStore('deadLetterQueue', { keyPath: 'id' });
        }
      };
    });
  }

  async resetDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
      const deleteRequest = indexedDB.deleteDatabase(this.dbName);

      deleteRequest.onerror = () => reject(deleteRequest.error);
      deleteRequest.onsuccess = async () => {
        console.log('Database deleted successfully');
        try {
          await this.openDB();
          resolve();
        } catch (error) {
          reject(error);
        }
      };
    });
  }

  async saveLocationUpdate(update: LocationUpdate): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('locationUpdates', 'readwrite');
      const store = transaction.objectStore('locationUpdates');

      const request = store.add(update);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);

      transaction.oncomplete = () => db.close();
    });
  }

  async getPendingUpdates(): Promise<LocationUpdate[]> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('locationUpdates', 'readonly');
      const store = transaction.objectStore('locationUpdates');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);

      transaction.oncomplete = () => db.close();
    });
  }

  async clearPendingUpdates(): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('locationUpdates', 'readwrite');
      const store = transaction.objectStore('locationUpdates');
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);

      transaction.oncomplete = () => db.close();
    });
  }

  async addToQueue(item: QueueItem): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('queue', 'readwrite');
      const store = transaction.objectStore('queue');
      const request = store.add(item);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
      transaction.oncomplete = () => db.close();
    });
  }

  async getQueueItems(): Promise<QueueItem[]> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('queue', 'readonly');
      const store = transaction.objectStore('queue');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
      transaction.oncomplete = () => db.close();
    });
  }

  async updateQueueItem(item: QueueItem): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('queue', 'readwrite');
      const store = transaction.objectStore('queue');
      const request = store.put(item);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
      transaction.oncomplete = () => db.close();
    });
  }

  async removeFromQueue(id: string): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('queue', 'readwrite');
      const store = transaction.objectStore('queue');
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
      transaction.oncomplete = () => db.close();
    });
  }

  async addToDeadLetterQueue(item: QueueItem): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('deadLetterQueue', 'readwrite');
      const store = transaction.objectStore('deadLetterQueue');
      const request = store.add(item);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
      transaction.oncomplete = () => db.close();
    });
  }

  async getDeadLetterItems(): Promise<QueueItem[]> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('deadLetterQueue', 'readonly');
      const store = transaction.objectStore('deadLetterQueue');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
      transaction.oncomplete = () => db.close();
    });
  }

  async removeFromDeadLetterQueue(id: string): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('deadLetterQueue', 'readwrite');
      const store = transaction.objectStore('deadLetterQueue');
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
      transaction.oncomplete = () => db.close();
    });
  }
}

const db = new DatabaseManager();

db.openDB().catch(error => {
  console.error('Error initializing database:', error);
  db.resetDatabase().catch(console.error);
});

export { db }; 