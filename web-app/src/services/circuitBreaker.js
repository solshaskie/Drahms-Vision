const logger = require('../utils/logger');

/**
 * Circuit Breaker pattern implementation for external API fault tolerance
 * Prevents cascading failures and provides graceful degradation
 */
class CircuitBreaker {
  /**
   * @param {string} serviceName - Name of the external service
   * @param {Object} options - Circuit breaker configuration
   * @param {number} options.failureThreshold - Number of failures before opening circuit
   * @param {number} options.recoveryTimeout - Time in ms before attempting to close circuit
   * @param {number} options.monitoringPeriodMs - Window size for failure tracking
   */
  constructor(serviceName, options = {}) {
    this.serviceName = serviceName;
    this.failureThreshold = options.failureThreshold || 5;
    this.recoveryTimeout = options.recoveryTimeout || 60000; // 1 minute
    this.monitoringPeriodMs = options.monitoringPeriodMs || 60000; // 1 minute

    // Circuit states: 'CLOSED', 'OPEN', 'HALF_OPEN'
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.successCount = 0;
    this.nextAttemptTime = null;

    logger.info(`Circuit breaker initialized for ${serviceName}`, {
      failureThreshold: this.failureThreshold,
      recoveryTimeout: this.recoveryTimeout,
      state: this.state,
    });
  }

  /**
   * Execute a function with circuit breaker protection
   * @param {Function} fn - Function to execute (should return a Promise)
   * @param {Object} context - Context for logging
   * @returns {Promise} - Result of the function execution
   */
  async execute(fn, context = {}) {
    const now = Date.now();

    // Check if circuit is open
    if (this.state === 'OPEN') {
      if (now < this.nextAttemptTime) {
        throw new Error(`Circuit breaker is OPEN for service ${this.serviceName}. Next retry at ${new Date(this.nextAttemptTime).toISOString()}`);
      }
      // Time to try half-open
      this.state = 'HALF_OPEN';
      logger.info(`Circuit breaker HALF_OPEN for ${this.serviceName}`, context);
    }

    try {
      const result = await fn();

      // Success - handle state transitions
      this.onSuccess();
      return result;
    } catch (error) {
      // Failure - handle state transitions
      this.onFailure(error, context);

      // Re-throw the error to caller
      throw error;
    }
  }

  /**
   * Handle successful execution
   */
  onSuccess() {
    this.successCount++;
    this.failureCount = 0;

    if (this.state === 'HALF_OPEN') {
      // Half-open succeeded, close the circuit
      this.state = 'CLOSED';
      this.successCount = 0;
      logger.info(`Circuit breaker CLOSED for ${this.serviceName} (recovered from half-open)`);
    }

    // Reset failure tracking in closed state
    if (this.state === 'CLOSED') {
      const now = Date.now();
      if (this.lastFailureTime && (now - this.lastFailureTime) > this.monitoringPeriodMs) {
        this.failureCount = 0;
      }
    }
  }

  /**
   * Handle failed execution
   * @param {Error} error - The error that occurred
   * @param {Object} context - Additional context for logging
   */
  onFailure(error, context) {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    this.successCount = 0;

    logger.warn(`Circuit breaker failure for ${this.serviceName}`, {
      failureCount: this.failureCount,
      state: this.state,
      error: error.message,
      ...context,
    });

    if (this.state === 'HALF_OPEN') {
      // Half-open failed, go back to open
      this.state = 'OPEN';
      this.nextAttemptTime = Date.now() + this.recoveryTimeout;
      logger.warn(`Circuit breaker failed in HALF_OPEN, reverting to OPEN for ${this.serviceName}`, {
        nextAttempt: new Date(this.nextAttemptTime).toISOString(),
        ...context,
      });
    } else if (this.state === 'CLOSED' && this.failureCount >= this.failureThreshold) {
      // Closed state with too many failures, open the circuit
      this.state = 'OPEN';
      this.nextAttemptTime = Date.now() + this.recoveryTimeout;
      logger.error(`Circuit breaker OPEN for ${this.serviceName}`, {
        failureThreshold: this.failureThreshold,
        nextAttempt: new Date(this.nextAttemptTime).toISOString(),
        ...context,
      });
    }
  }

  /**
   * Get current circuit breaker status
   * @returns {Object} - Current status information
   */
  getStatus() {
    return {
      serviceName: this.serviceName,
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime,
      nextAttemptTime: this.nextAttemptTime,
      failureThreshold: this.failureThreshold,
      recoveryTimeout: this.recoveryTimeout,
    };
  }

  /**
   * Manually reset the circuit breaker to closed state
   */
  reset() {
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = null;
    this.nextAttemptTime = null;
    logger.info(`Circuit breaker manually reset for ${this.serviceName}`);
  }

  /**
   * Manually force circuit breaker to open state
   */
  forceOpen() {
    this.state = 'OPEN';
    this.nextAttemptTime = Date.now() + this.recoveryTimeout;
    logger.warn(`Circuit breaker manually forced OPEN for ${this.serviceName}`);
  }
}

/**
 * Retry helper with exponential backoff
 * @param {Function} fn - Function to retry
 * @param {number} maxRetries - Maximum number of retry attempts
 * @param {number} baseDelay - Base delay in milliseconds
 * @param {Object} context - Context for logging
 */
async function retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000, context = {}) {
  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await fn();
      return result;
    } catch (error) {
      lastError = error;

      if (attempt === maxRetries) {
        logger.error('Max retries exceeded', {
          attempts: attempt + 1,
          maxRetries,
          error: error.message,
          ...context,
        });
        break;
      }

      const delay = baseDelay * Math.pow(2, attempt);
      logger.warn(`Retry attempt ${attempt + 1}/${maxRetries + 1} failed, waiting ${delay}ms`, {
        error: error.message,
        delay,
        ...context,
      });

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

// Circuit breaker instances for different external services
const circuitBreakers = new Map([
  ['googleVision', new CircuitBreaker('googleVision', {
    failureThreshold: 5,
    recoveryTimeout: 30000, // 30 seconds
  })],
  ['ebird', new CircuitBreaker('ebird', {
    failureThreshold: 3,
    recoveryTimeout: 60000, // 1 minute
  })],
  ['openweather', new CircuitBreaker('openweather', {
    failureThreshold: 3,
    recoveryTimeout: 45000, // 45 seconds
  })],
  ['nasa', new CircuitBreaker('nasa', {
    failureThreshold: 3,
    recoveryTimeout: 120000, // 2 minutes
  })],
]);

/**
 * Get circuit breaker instance for a service
 * @param {string} serviceName - Name of the service
 * @returns {CircuitBreaker} - Circuit breaker instance
 */
function getCircuitBreaker(serviceName) {
  if (!circuitBreakers.has(serviceName)) {
    circuitBreakers.set(serviceName, new CircuitBreaker(serviceName));
  }
  return circuitBreakers.get(serviceName);
}

/**
 * Get status of all circuit breakers
 * @returns {Object} - Status of all circuit breakers
 */
function getAllCircuitBreakerStatus() {
  const status = {};
  for (const [serviceName, breaker] of circuitBreakers) {
    status[serviceName] = breaker.getStatus();
  }
  return status;
}

/**
 * Reset all circuit breakers (useful for testing or recovery)
 */
function resetAllCircuitBreakers() {
  for (const breaker of circuitBreakers.values()) {
    breaker.reset();
  }
  logger.info('All circuit breakers reset');
}

module.exports = {
  CircuitBreaker,
  retryWithBackoff,
  getCircuitBreaker,
  getAllCircuitBreakerStatus,
  resetAllCircuitBreakers,
};
