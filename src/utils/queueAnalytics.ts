interface QueueMetrics {
  totalProcessed: number;
  successCount: number;
  failureCount: number;
  averageProcessingTime: number;
  retryRates: { [key: number]: number };
  errorTypes: { [key: string]: number };
}

class QueueAnalyticsManager {
  private metrics: QueueMetrics = {
    totalProcessed: 0,
    successCount: 0,
    failureCount: 0,
    averageProcessingTime: 0,
    retryRates: {},
    errorTypes: {}
  };

  private processingTimes: number[] = [];

  trackProcessingTime(startTime: number) {
    const duration = Date.now() - startTime;
    this.processingTimes.push(duration);
    this.updateAverageProcessingTime();
  }

  trackSuccess() {
    this.metrics.totalProcessed++;
    this.metrics.successCount++;
  }

  trackFailure(retryCount: number, errorType: string) {
    this.metrics.totalProcessed++;
    this.metrics.failureCount++;
    
    // Track retry rates
    this.metrics.retryRates[retryCount] = (this.metrics.retryRates[retryCount] || 0) + 1;
    
    // Track error types
    this.metrics.errorTypes[errorType] = (this.metrics.errorTypes[errorType] || 0) + 1;
  }

  private updateAverageProcessingTime() {
    const sum = this.processingTimes.reduce((a, b) => a + b, 0);
    this.metrics.averageProcessingTime = sum / this.processingTimes.length;
  }

  getMetrics(): QueueMetrics {
    return { ...this.metrics };
  }

  getSuccessRate(): number {
    if (this.metrics.totalProcessed === 0) return 0;
    return (this.metrics.successCount / this.metrics.totalProcessed) * 100;
  }

  getMostCommonError(): { type: string; count: number } | null {
    const errors = Object.entries(this.metrics.errorTypes);
    if (errors.length === 0) return null;

    return errors.reduce((max, [type, count]) => {
      return count > max.count ? 
        { type, count } : 
        max;
    }, { type: errors[0][0], count: errors[0][1] });
  }

  reset() {
    this.metrics = {
      totalProcessed: 0,
      successCount: 0,
      failureCount: 0,
      averageProcessingTime: 0,
      retryRates: {},
      errorTypes: {}
    };
    this.processingTimes = [];
  }
}

export const queueAnalytics = new QueueAnalyticsManager(); 