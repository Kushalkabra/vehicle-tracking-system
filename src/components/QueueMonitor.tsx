import React, { useState, useEffect } from 'react';
import { AlertCircle, RefreshCw, CheckCircle } from 'lucide-react';
import { db } from '../utils/db';
import { queueManager } from '../utils/queueManager';

const QueueMonitor: React.FC = () => {
  const [queueCount, setQueueCount] = useState(0);
  const [deadLetterCount, setDeadLetterCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    const updateCounts = async () => {
      const queueItems = await db.getQueueItems();
      const deadLetterItems = await db.getDeadLetterItems();
      setQueueCount(queueItems.length);
      setDeadLetterCount(deadLetterItems.length);
    };

    updateCounts();
    const interval = setInterval(updateCounts, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleRetryAll = async () => {
    setIsRetrying(true);
    try {
      await queueManager.retryDeadLetters();
    } finally {
      setIsRetrying(false);
    }
  };

  if (queueCount === 0 && deadLetterCount === 0) return null;

  return (
    <div className="fixed bottom-24 right-4 z-50 bg-white rounded-lg shadow-lg p-4 max-w-sm">
      <div className="space-y-3">
        {queueCount > 0 && (
          <div className="flex items-center space-x-2">
            <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
            <span className="text-sm text-gray-600">
              {queueCount} update{queueCount !== 1 ? 's' : ''} pending
            </span>
          </div>
        )}
        {deadLetterCount > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <span className="text-sm text-gray-600">
                {deadLetterCount} failed update{deadLetterCount !== 1 ? 's' : ''}
              </span>
            </div>
            <button
              onClick={handleRetryAll}
              disabled={isRetrying}
              className={`px-3 py-1 rounded-md text-sm ${
                isRetrying
                  ? 'bg-gray-100 text-gray-400'
                  : 'bg-primary-600 text-white hover:bg-primary-700'
              }`}
            >
              {isRetrying ? 'Retrying...' : 'Retry All'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default QueueMonitor; 