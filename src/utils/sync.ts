import { db } from './db';
import toast from 'react-hot-toast';

export const syncOfflineData = async (socket: WebSocket) => {
  try {
    const updates = await db.getPendingUpdates();
    if (updates.length === 0) return;

    console.log(`Syncing ${updates.length} offline updates`);
    toast.loading(`Syncing ${updates.length} location updates...`);

    for (const update of updates) {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
          type: 'driverLocationUpdate',
          payload: update
        }));
        await db.clearPendingUpdates();
      } else {
        throw new Error('WebSocket not connected');
      }
    }

    toast.success(`Successfully synced ${updates.length} updates`);
  } catch (error) {
    console.error('Error syncing offline data:', error);
    toast.error('Failed to sync offline updates');
  }
}; 