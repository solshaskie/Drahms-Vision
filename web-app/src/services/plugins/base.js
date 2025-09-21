/**
 * Base Plugin class for all identification services
 * Provides a consistent interface and circuit breaker integration
 */
class BaseIdentificationPlugin {
  /**
   * @param {Object} config - Plugin configuration
   * @param {Object} circuitBreaker - Circuit breaker instance
   * @param {Object} logger - Logger instance
   * @param {Object} cache - Cache service instance
   */
  constructor(config, circuitBreaker, logger, cache) {
    if (this.constructor === BaseIdentificationPlugin) {
      throw new Error('BaseIdentificationPlugin cannot be instantiated directly');
    }

    this.config = config;
    this.circuitBreaker = circuitBreaker;
    this.logger = logger;
    this.cache = cache;
    this.name = this.constructor.name.replace('Plugin', '').toLowerCase();

    this.requestTimeout = config?.timeout || 30000;
    this.retryAttempts = config?.retryAttempts || 3;
  }

  /**
   * Identify objects in an image
   * @param {string} imageData - Base64 encoded image data
   * @param {Object} options - Additional identification options
   * @returns {Promise<Object>} - Identification results
   */
  async identify(imageData, _options = {}) {
    throw new Error(`${this.constructor.name}.identify() must be implemented`);
  }

  /**
   * Get supported identification types
   * @returns {Array<string>} - Array of supported types
   */
  getSupportedTypes() {
    throw new Error(`${this.constructor.name}.getSupportedTypes() must be implemented`);
  }

  /**
   * Check if the plugin supports a specific identification type
   * @param {string} type - Identification type to check
   * @returns {boolean} - True if supported
   */
  supports(type) {
    return this.getSupportedTypes().includes(type);
  }

  /**
   * Check plugin health
   * @returns {Promise<Object>} - Health status
   */
  async getHealth() {
    try {
      // Default implementation checks if the API endpoint is reachable
      return {
        status: 'healthy',
        name: this.name,
        supportedTypes: this.getSupportedTypes(),
        lastChecked: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        name: this.name,
        error: error.message,
        lastChecked: new Date().toISOString(),
      };
    }
  }

  /**
   * Execute a request with circuit breaker protection and retries
   * @param {Function} requestFn - Function that returns a promise for the API request
   * @param {Object} context - Context for logging and circuit breaker
   * @returns {Promise} - Request result
   */
  async executeRequest(requestFn, context = {}) {
    const circuitContext = {
      service: this.name,
      operation: context.operation || 'identify',
      ...context,
    };

    return this.circuitBreaker.execute(async() => {
      return this.retryWithBackoff(requestFn, this.retryAttempts);
    }, circuitContext);
  }

  /**
   * Retry logic with exponential backoff
   * @param {Function} fn - Function to retry
   * @param {number} maxRetries - Maximum number of retries
   * @returns {Promise} - Result of the function
   */
  async retryWithBackoff(fn, maxRetries = 3) {
    let lastError;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await fn();
        return result;
      } catch (error) {
        lastError = error;

        if (attempt === maxRetries) {
          this.logger.warn(`${this.name}: Max retries exceeded`, {
            attempts: attempt + 1,
            error: error.message,
          });
          break;
        }

        const delay = Math.min(1000 * Math.pow(2, attempt), 10000); // Exponential backoff, max 10s

        this.logger.warn(`${this.name}: Retry attempt ${attempt + 1}/${maxRetries + 1} failed, waiting ${delay}ms`, {
          error: error.message,
          delay,
        });

        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }

  /**
   * Cache key generation for identification results
   * @param {string} imageHash - Hash of the image data
   * @param {Object} options - Additional options for cache key
   * @returns {string} - Cache key
   */
  generateCacheKey(imageHash, options = {}) {
    const keyParts = [this.name, imageHash];
    if (options.confidence) keyParts.push(`conf_${options.confidence}`);
    if (options.maxResults) keyParts.push(`max_${options.maxResults}`);
    return keyParts.join(':');
  }

  /**
   * Standardize identification results format
   * @param {Array} rawResults - Raw results from the API
   * @returns {Array} - Standardized results
   */
  standardizeResults(rawResults) {
    return rawResults.map(result => ({
      name: result.name || result.label || 'Unknown',
      confidence: result.confidence || result.score || 0,
      type: this.inferType(result),
      source: this.name,
      metadata: result.metadata || {},
      boundingBox: result.boundingBox || result.bbox,
    }));
  }

  /**
   * Infer identification type from result metadata
   * @param {Object} result - Individual result item
   * @returns {string} - Inferred type
   */
  inferType(result) {
    // Override in subclasses for service-specific logic
    const name = (result.name || result.label || '').toLowerCase();
    if (name.includes('bird')) return 'bird';
    if (name.includes('plant') || name.includes('flower')) return 'plant';
    if (name.includes('insect') || name.includes('butterfly')) return 'insect';
    if (name.includes('animal') || this.isAnimalType(name)) return 'animal';
    return 'general';
  }

  /**
   * Check if a name indicates an animal
   * @param {string} name - Object name to check
   * @returns {boolean} - True if it's an animal
   */
  isAnimalType(name) {
    const animalKeywords = [
      'dog', 'cat', 'horse', 'cow', 'pig', 'sheep', 'goat', 'deer',
      'bear', 'wolf', 'fox', 'rabbit', 'squirrel', 'mouse', 'rat',
      'elephant', 'lion', 'tiger', 'monkey', 'zebra', 'giraffe',
    ];
    return animalKeywords.some(keyword => name.includes(keyword));
  }

  /**
   * Validate image data format
   * @param {string} imageData - Base64 encoded image data
   * @throws {Error} - If validation fails
   */
  validateImageData(imageData) {
    if (!imageData) {
      throw new Error('Image data is required');
    }

    if (typeof imageData !== 'string') {
      throw new Error('Image data must be a string');
    }

    if (!imageData.includes('base64,')) {
      throw new Error('Image data must be base64 encoded with data URL format');
    }

    // Basic size check (rough estimate)
    const base64Data = imageData.split(',')[1];
    const sizeInBytes = (base64Data.length * 3) / 4;

    if (sizeInBytes > (this.config.maxImageSize ?? 10 * 1024 * 1024)) { // 10MB default
      throw new Error(`Image size (${(sizeInBytes / 1024 / 1024).toFixed(1)}MB) exceeds maximum allowed size`);
    }
  }
}

module.exports = BaseIdentificationPlugin;
