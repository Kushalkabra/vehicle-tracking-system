interface RetryStrategy {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  factor: number;
}

class AdaptiveRetryManager {
  private strategies: { [key: string]: RetryStrategy } = {
    default: {
      maxRetries: 5,
      baseDelay: 1000,
      maxDelay: 60000,
      factor: 2
    }
  };

  private errorPatterns: Map<string, { count: number; successRate: number }> = new Map();

  updateErrorPattern(errorType: string, isSuccess: boolean) {
    const pattern = this.errorPatterns.get(errorType) || { count: 0, successRate: 0 };
    pattern.count++;
    
    if (isSuccess) {
      pattern.successRate = ((pattern.successRate * (pattern.count - 1)) + 100) / pattern.count;
    } else {
      pattern.successRate = (pattern.successRate * (pattern.count - 1)) / pattern.count;
    }
    
    this.errorPatterns.set(errorType, pattern);
    this.adjustStrategy(errorType, pattern);
  }

  private adjustStrategy(errorType: string, pattern: { count: number; successRate: number }) {
    if (pattern.count < 10) return; // Need minimum sample size

    const strategy = this.strategies[errorType] || { ...this.strategies.default };

    // Adjust based on success rate
    if (pattern.successRate < 20) {
      // Very low success rate - be more conservative
      strategy.maxRetries = Math.min(strategy.maxRetries + 2, 10);
      strategy.factor = Math.min(strategy.factor + 0.5, 4);
    } else if (pattern.successRate > 80) {
      // High success rate - be more aggressive
      strategy.maxRetries = Math.max(strategy.maxRetries - 1, 3);
      strategy.factor = Math.max(strategy.factor - 0.25, 1.5);
    }

    this.strategies[errorType] = strategy;
  }

  getRetryDelay(errorType: string, retryCount: number): number {
    const strategy = this.strategies[errorType] || this.strategies.default;
    const delay = strategy.baseDelay * Math.pow(strategy.factor, retryCount);
    return Math.min(delay, strategy.maxDelay);
  }

  shouldRetry(errorType: string, retryCount: number): boolean {
    const strategy = this.strategies[errorType] || this.strategies.default;
    return retryCount < strategy.maxRetries;
  }

  getStrategy(errorType: string): RetryStrategy {
    return this.strategies[errorType] || this.strategies.default;
  }
}

export const adaptiveRetry = new AdaptiveRetryManager(); 