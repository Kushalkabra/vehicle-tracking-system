import { db } from './db';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';

interface QueueItem {
  id: string;
  type: string;
  payload: any;
  timestamp: number;
  retries: number;
  priority: number;
}

class QueueManager {
  private maxRetries = 5;
  private retryDelays = [1000, 5000, 15000, 30000, 60000]; // Exponential backoff
  private processingQueue = false;

  async addToQueue(type: string, payload: any, priority: number = 1) {
    try {
      const queueItem: QueueItem = {
        id: uuidv4(),
        type,
        payload,
        timestamp: Date.now(),
        retries: 0,
        priority
      };

      await db.addToQueue(queueItem);
      console.log('Added to queue:', queueItem);

      // Try to process queue immediately if we're online
      if (navigator.onLine) {
        this.processQueue();
      }
    } catch (error) {
      console.error('Error adding to queue:', error);
      toast.error('Failed to queue update');
    }
  }

  async processQueue() {
    if (this.processingQueue || !navigator.onLine) return;

    this.processingQueue = true;
    let successCount = 0;
    let failureCount = 0;

    try {
      const items = await db.getQueueItems();
      const sortedItems = items.sort((a, b) => b.priority - a.priority);

      for (const item of sortedItems) {
        try {
          await this.processItem(item);
          successCount++;
        } catch (error) {
          failureCount++;
          if (item.retries < this.maxRetries) {
            item.retries++;
            await db.updateQueueItem(item);
            this.scheduleRetry(item);
          } else {
            await this.moveToDeadLetterQueue(item);
            toast.error(`Failed to process update after ${this.maxRetries} attempts`);
          }
        }
      }

      if (successCount > 0) {
        toast.success(`Successfully synced ${successCount} updates`);
      }
    } catch (error) {
      console.error('Error processing queue:', error);
    } finally {
      this.processingQueue = false;
    }
  }

  private async processItem(item: QueueItem) {
    switch (item.type) {
      case 'locationUpdate':
        await this.processLocationUpdate(item);
        break;
      default:
        console.warn('Unknown queue item type:', item.type);
    }

    await db.removeFromQueue(item.id);
  }

  private async processLocationUpdate(item: QueueItem) {
    const response = await fetch('/api/location', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(item.payload)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  }

  private scheduleRetry(item: QueueItem) {
    const delay = this.retryDelays[item.retries - 1] || this.retryDelays[this.retryDelays.length - 1];
    setTimeout(() => this.processQueue(), delay);
  }

  private async moveToDeadLetterQueue(item: QueueItem) {
    await db.addToDeadLetterQueue(item);
    await db.removeFromQueue(item.id);
  }

  async retryDeadLetters() {
    try {
      const deadLetters = await db.getDeadLetterItems();
      for (const item of deadLetters) {
        item.retries = 0;
        await db.addToQueue(item);
        await db.removeFromDeadLetterQueue(item.id);
      }
      
      if (deadLetters.length > 0) {
        toast.success(`Retrying ${deadLetters.length} failed updates`);
        this.processQueue();
      }
    } catch (error) {
      console.error('Error retrying dead letters:', error);
      toast.error('Failed to retry updates');
    }
  }
}

export const queueManager = new QueueManager(); 