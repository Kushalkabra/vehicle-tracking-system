import React, { useState, useEffect } from 'react';
import { queueAnalytics } from '../utils/queueAnalytics';

const QueueAnalytics: React.FC = () => {
  const [metrics, setMetrics] = useState(queueAnalytics.getMetrics());
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(queueAnalytics.getMetrics());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const successRate = queueAnalytics.getSuccessRate();
  const mostCommonError = queueAnalytics.getMostCommonError();

  return (
    <div className="fixed bottom-24 left-4 z-50 bg-white rounded-lg shadow-lg p-4 max-w-md">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Queue Analytics</h3>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-gray-500 hover:text-gray-700"
        >
          {isExpanded ? 'Show Less' : 'Show More'}
        </button>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-sm text-gray-500">Success Rate</div>
            <div className="text-2xl font-semibold text-green-600">
              {successRate.toFixed(1)}%
            </div>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-sm text-gray-500">Avg. Processing Time</div>
            <div className="text-2xl font-semibold text-blue-600">
              {metrics.averageProcessingTime.toFixed(0)}ms
            </div>
          </div>
        </div>

        {isExpanded && (
          <>
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-700">Error Distribution</div>
              {mostCommonError && (
                <div className="text-sm text-gray-600">
                  Most common error: {mostCommonError.type} ({mostCommonError.count} times)
                </div>
              )}
              <div className="mt-2">
                {Object.entries(metrics.retryRates).map(([retry, count]) => (
                  <div key={retry} className="flex items-center space-x-2 mb-1">
                    <div className="text-sm text-gray-600">Retry {retry}:</div>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-primary-600 rounded-full h-2"
                        style={{
                          width: `${(count / Math.max(...Object.values(metrics.retryRates))) * 100}%`
                        }}
                      />
                    </div>
                    <div className="text-sm text-gray-600">{count}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4">
              <button
                onClick={() => queueAnalytics.reset()}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Reset Analytics
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default QueueAnalytics; 