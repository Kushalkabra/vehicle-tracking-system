import React, { useState, useEffect } from 'react';
import { Activity, AlertTriangle, CheckCircle } from 'lucide-react';
import { queueAnalytics } from '../utils/queueAnalytics';
import { adaptiveRetry } from '../utils/adaptiveRetry';

interface QueueStats {
  activeCount: number;
  successRate: number;
  recentErrors: Array<{ type: string; timestamp: number }>;
  processingRate: number;
}

const QueueMonitorRealtime: React.FC = () => {
  const [stats, setStats] = useState<QueueStats>({
    activeCount: 0,
    successRate: 0,
    recentErrors: [],
    processingRate: 0
  });

  const [lastProcessed, setLastProcessed] = useState<number[]>([]);

  useEffect(() => {
    const updateStats = () => {
      const metrics = queueAnalytics.getMetrics();
      const now = Date.now();
      
      // Update processing rate
      setLastProcessed(prev => {
        const recent = [...prev, metrics.totalProcessed].slice(-10);
        const rate = recent.length > 1 ? 
          (recent[recent.length - 1] - recent[0]) / (recent.length - 1) : 0;
        return recent;
      });

      setStats({
        activeCount: metrics.totalProcessed - (metrics.successCount + metrics.failureCount),
        successRate: queueAnalytics.getSuccessRate(),
        recentErrors: Object.entries(metrics.errorTypes)
          .map(([type, count]) => ({ type, timestamp: now }))
          .slice(-5),
        processingRate: metrics.averageProcessingTime > 0 ? 
          1000 / metrics.averageProcessingTime : 0
      });
    };

    updateStats();
    const interval = setInterval(updateStats, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed top-20 right-4 z-50 bg-white rounded-lg shadow-lg p-4 w-64">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-900">Queue Status</h3>
          <Activity className={`w-4 h-4 ${stats.activeCount > 0 ? 'text-green-500' : 'text-gray-400'}`} />
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <div className="text-gray-500">Active</div>
            <div className="font-medium">{stats.activeCount}</div>
          </div>
          <div>
            <div className="text-gray-500">Success Rate</div>
            <div className="font-medium">{stats.successRate.toFixed(1)}%</div>
          </div>
          <div>
            <div className="text-gray-500">Processing Rate</div>
            <div className="font-medium">{stats.processingRate.toFixed(1)}/s</div>
          </div>
        </div>

        {stats.recentErrors.length > 0 && (
          <div className="border-t pt-2">
            <div className="text-sm font-medium text-gray-900 mb-2">Recent Errors</div>
            <div className="space-y-1">
              {stats.recentErrors.map((error, i) => (
                <div key={i} className="flex items-center text-sm">
                  <AlertTriangle className="w-3 h-3 text-red-500 mr-1" />
                  <span className="text-gray-600">{error.type}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QueueMonitorRealtime; 