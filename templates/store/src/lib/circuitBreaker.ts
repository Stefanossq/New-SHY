/**
 * @file Distributed Circuit Breaker & Resilient Dispatcher
 */

export class DistributedCircuitBreaker {
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private failureCount = 0;
  private nextAttempt = Date.now();

  constructor(private name: string, private failureThreshold = 3, private recoveryTimeMs = 5000) {}

  async execute<T>(action: () => Promise<T>, fallback: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() > this.nextAttempt) {
        this.state = 'HALF_OPEN';
      } else {
        return fallback();
      }
    }

    try {
      const result = await action();
      if (this.state === 'HALF_OPEN') {
        this.state = 'CLOSED';
        this.failureCount = 0;
      }
      return result;
    } catch (err) {
      this.failureCount++;
      if (this.failureCount >= this.failureThreshold) {
        this.state = 'OPEN';
        this.nextAttempt = Date.now() + this.recoveryTimeMs;
      }
      return fallback();
    }
  }
}
