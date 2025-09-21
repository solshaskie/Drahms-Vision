const config = require('../config');
const logger = require('../utils/logger');
const { getCircuitBreaker } = require('./circuitBreaker');

// Import built-in plugins
const GoogleVisionPlugin = require('./plugins/googleVision');
const BaseIdentificationPlugin = require('./plugins/base');

/**
 * Plugin Manager - Orchestrates all identification plugins
 * Handles plugin loading, health monitoring, and request distribution
 */
class PluginManager {
  /**
   * @param {Object} services - Shared service dependencies
   * @param {Object} services.logger - Logger instance
   * @param {Object} services.cache - Cache service
   * @param {Object} services.database - Database service
   */
  constructor(services = {}) {
    this.plugins = new Map();
    this.logger = services.logger || logger;
    this.cache = services.cache;
    this.database = services.database;
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
    };
    this.requestTimes = [];

    this.initializeBuiltInPlugins();
  }

  /**
   * Initialize built-in plugins from configuration
   */
  async initializeBuiltInPlugins() {
    const pluginConfigs = [
      {
        name: 'googleVision',
        class: GoogleVisionPlugin,
        config: {
          apiKey: config.apiKeys.googleVision,
          maxResults: 10,
          timeout: 30000,
          retryAttempts: 3,
        },
        enabled: !!config.apiKeys.googleVision,
      },
      // Future plugins will be added here
      // {
      //   name: 'ebird',
      //   class: EBirdPlugin,
      //   config: { apiKey: config.apiKeys.ebird },
      //   enabled: !!config.apiKeys.ebird
      // },
      // {
      //   name: 'plantnet',
      //   class: PlantNetPlugin,
      //   config: { apiKey: config.apiKeys.plantnet },
      //   enabled: !!config.apiKeys.plantnet
      // }
    ];

    for (const pluginConfig of pluginConfigs) {
      if (pluginConfig.enabled) {
        try {
          await this.loadPlugin(pluginConfig);
        } catch (error) {
          this.logger.error(`Failed to load plugin ${pluginConfig.name}`, {
            error: error.message,
            plugin: pluginConfig.name,
          });
        }
      } else {
        this.logger.info(`Plugin ${pluginConfig.name} disabled (missing API key)`);
      }
    }

    this.logger.info(`Plugin manager initialized with ${this.plugins.size} plugins`);
  }

  /**
   * Load a plugin instance
   * @param {Object} pluginConfig - Plugin configuration
   */
  async loadPlugin(pluginConfig) {
    const { name, class: PluginClass, config: pluginSpecificConfig } = pluginConfig;

    if (!PluginClass || !(PluginClass.prototype instanceof BaseIdentificationPlugin)) {
      throw new Error(`Invalid plugin class for ${name}: must extend BaseIdentificationPlugin`);
    }

    const circuitBreaker = getCircuitBreaker(name);
    const plugin = new PluginClass(
      pluginSpecificConfig,
      circuitBreaker,
      this.logger,
      this.cache,
    );

    // Validate plugin
    if (!plugin.name || typeof plugin.identify !== 'function') {
      throw new Error(`Plugin ${name} failed validation`);
    }

    // Check plugin health
    try {
      const health = await plugin.getHealth();
      if (health.status !== 'healthy') {
        this.logger.warn(`Plugin ${name} health check failed`, health);
      }
    } catch (error) {
      this.logger.warn(`Plugin ${name} health check error`, { error: error.message });
    }

    this.plugins.set(name, {
      instance: plugin,
      config: pluginSpecificConfig,
      loadedAt: new Date(),
      metrics: {
        requests: 0,
        successes: 0,
        failures: 0,
        averageResponseTime: 0,
      },
    });

    this.logger.info(`Plugin ${name} loaded successfully`, {
      version: PluginClass.version || '1.0.0',
      supportedTypes: plugin.getSupportedTypes(),
    });
  }

  /**
   * Identify objects in an image using available plugins
   * @param {string} imageData - Base64 encoded image data
   * @param {Object} options - Identification options
   * @returns {Promise<Object>} - Combined identification results
   */
  async identify(imageData, options = {}) {
    const startTime = Date.now();
    this.metrics.totalRequests++;

    const results = {
      requestId: options.requestId || require('crypto').randomUUID(),
      timestamp: new Date().toISOString(),
      imageHash: this.generateImageHash(imageData),
      plugins: [],
      combined: [],
      metadata: {
        totalPlugins: this.plugins.size,
        pluginsUsed: 0,
        processingTime: 0,
      },
    };

    // Distribute identification request to all enabled plugins
    const pluginPromises = Array.from(this.plugins.values()).map(async(pluginInfo) => {
      const pluginStartTime = Date.now();
      const pluginName = pluginInfo.instance.name;

      try {
        pluginInfo.metrics.requests++;

        const pluginResult = await pluginInfo.instance.identify(imageData, options);

        const pluginEndTime = Date.now();
        const responseTime = pluginEndTime - pluginStartTime;

        pluginInfo.metrics.successes++;
        this.updateAverageResponseTime(responseTime);

        return {
          plugin: pluginName,
          status: 'success',
          result: pluginResult,
          responseTime,
          supportedTypes: pluginInfo.instance.getSupportedTypes(),
          metadata: {
            fromCache: pluginResult.fromCache || false,
          },
        };
      } catch (error) {
        pluginInfo.metrics.failures++;

        this.logger.warn(`Plugin ${pluginName} identification failed`, {
          error: error.message,
          responseTime: Date.now() - pluginStartTime,
        });

        return {
          plugin: pluginName,
          status: 'error',
          error: error.message,
          supportedTypes: pluginInfo.instance.getSupportedTypes(),
        };
      }
    });

    // Wait for all plugins to complete
    const pluginResults = await Promise.allSettled(pluginPromises);

    // Process results
    for (const promiseResult of pluginResults) {
      if (promiseResult.status === 'fulfilled') {
        const result = promiseResult.value;
        results.plugins.push(result);

        if (result.status === 'success' && result.result.identifications) {
          results.combined.push(...result.result.identifications);
          results.metadata.pluginsUsed++;
        }
      } else {
        // Plugin promise rejected - this is unexpected
        this.logger.error('Plugin promise rejected', {
          error: promiseResult.reason.message,
        });
      }
    }

    // Process and sort combined results
    results.combined = this.processCombinedResults(results.combined, options);
    results.metadata.processingTime = Date.now() - startTime;

    // Cache the final result if caching is enabled
    if (this.cache && options.cache !== false) {
      try {
        const cacheKey = `combined:${results.imageHash}`;
        await this.cache.set(cacheKey, results, 1800); // Cache for 30 minutes
      } catch (error) {
        this.logger.debug('Failed to cache combined results', { error: error.message });
      }
    }

    this.metrics.successfulRequests++;
    return results;
  }

  /**
   * Process and deduplicate combined results from multiple plugins
   * @param {Array} rawResults - Raw results from all plugins
   * @param {Object} options - Processing options
   * @returns {Array} - Processed and sorted results
   */
  processCombinedResults(rawResults, options = {}) {
    const processed = [];
    const seen = new Map(); // Map of name -> best confidence

    for (const result of rawResults) {
      const key = result.name.toLowerCase().trim();

      if (seen.has(key)) {
        // Update if this result has higher confidence
        const existingIndex = seen.get(key);
        if (result.confidence > processed[existingIndex].confidence) {
          processed[existingIndex] = {
            ...result,
            sources: [...processed[existingIndex].sources, result.source],
          };
        } else {
          // Add source to existing result
          processed[existingIndex].sources.push(result.source);
        }
      } else {
        // First time seeing this result
        processed.push({
          ...result,
          sources: [result.source],
        });
        seen.set(key, processed.length - 1);
      }
    }

    // Sort by confidence descending
    processed.sort((a, b) => b.confidence - a.confidence);

    // Apply confidence threshold
    const minConfidence = options.minConfidence || 0.3;
    const filtered = processed.filter(result => result.confidence >= minConfidence);

    // Apply result limit
    const maxResults = options.maxResults || 20;
    return filtered.slice(0, maxResults);
  }

  /**
   * Get identification results for a specific type
   * @param {string} imageData - Base64 encoded image data
   * @param {string} type - Identification type (bird, plant, insect, etc.)
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} - Type-specific identification results
   */
  async identifyByType(imageData, type, options = {}) {
    // Find plugins that support this type
    const supportedPlugins = Array.from(this.plugins.values())
      .filter(pluginInfo => pluginInfo.instance.supports(type))
      .map(pluginInfo => pluginInfo.instance);

    if (supportedPlugins.length === 0) {
      throw new Error(`No plugins available for identification type: ${type}`);
    }

    this.logger.debug(`Identifying ${type} with ${supportedPlugins.length} plugins`);

    // Distribute to type-specific plugins
    const typeOptions = { ...options, type };
    const results = await this.identify(imageData, typeOptions);

    // Filter results to only include the requested type
    results.combined = results.combined.filter(result => result.type === type);
    results.metadata.requestedType = type;

    return results;
  }

  /**
   * Get plugin health status
   * @returns {Promise<Object>} - Health status of all plugins
   */
  async getHealthStatus() {
    const status = {
      overall: 'healthy',
      plugins: {},
      metrics: { ...this.metrics },
      timestamp: new Date().toISOString(),
    };

    for (const [pluginName, pluginInfo] of this.plugins) {
      try {
        const health = await pluginInfo.instance.getHealth();
        status.plugins[pluginName] = {
          ...health,
          loadedAt: pluginInfo.loadedAt,
          metrics: pluginInfo.metrics,
        };

        if (health.status !== 'healthy') {
          status.overall = 'degraded';
        }
      } catch (error) {
        status.plugins[pluginName] = {
          name: pluginName,
          status: 'error',
          error: error.message,
          loadedAt: pluginInfo.loadedAt,
          metrics: pluginInfo.metrics,
        };
        status.overall = 'unhealthy';
      }
    }

    return status;
  }

  /**
   * Get capabilities of available plugins
   * @returns {Object} - Plugin capabilities
   */
  getCapabilities() {
    const capabilities = {
      plugins: {},
      supportedTypes: new Set(),
      totalPlugins: this.plugins.size,
    };

    for (const [pluginName, pluginInfo] of this.plugins) {
      const plugin = pluginInfo.instance;
      capabilities.plugins[pluginName] = {
        supportedTypes: plugin.getSupportedTypes(),
        enabled: true,
      };

      plugin.getSupportedTypes().forEach(type => {
        capabilities.supportedTypes.add(type);
      });
    }

    capabilities.supportedTypes = Array.from(capabilities.supportedTypes);
    return capabilities;
  }

  /**
   * Unload a plugin
   * @param {string} pluginName - Name of the plugin to unload
   */
  async unloadPlugin(pluginName) {
    if (this.plugins.has(pluginName)) {
      const pluginInfo = this.plugins.get(pluginName);

      // Perform any cleanup if needed
      if (typeof pluginInfo.instance.cleanup === 'function') {
        try {
          await pluginInfo.instance.cleanup();
        } catch (error) {
          this.logger.warn(`Error during plugin cleanup: ${pluginName}`, error);
        }
      }

      this.plugins.delete(pluginName);
      this.logger.info(`Plugin ${pluginName} unloaded`);
    }
  }

  /**
   * Generate SHA-256 hash of image data for caching
   * @param {string} imageData - Base64 image data
   * @returns {string} - Hash for the image
   */
  generateImageHash(imageData) {
    const crypto = require('crypto');
    const imageBuffer = imageData.includes('base64,')
      ? imageData.split(',')[1]
      : imageData;

    return crypto.createHash('sha256').update(imageBuffer).digest('hex').substring(0, 16);
  }

  /**
   * Update average response time calculation
   * @param {number} responseTime - Response time in milliseconds
   */
  updateAverageResponseTime(responseTime) {
    this.requestTimes.push(responseTime);

    // Keep only last 100 measurements for rolling average
    if (this.requestTimes.length > 100) {
      this.requestTimes.shift();
    }

    this.metrics.averageResponseTime =
      this.requestTimes.reduce((sum, time) => sum + time, 0) / this.requestTimes.length;
  }

  /**
   * Get plugin metrics
   * @returns {Object} - Current metrics
   */
  getMetrics() {
    const pluginMetrics = {};
    for (const [name, info] of this.plugins) {
      pluginMetrics[name] = info.metrics;
    }

    return {
      overall: this.metrics,
      plugins: pluginMetrics,
      timestamp: new Date().toISOString(),
    };
  }
}

module.exports = PluginManager;
