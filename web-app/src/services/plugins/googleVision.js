const axios = require('axios');
const crypto = require('crypto');
const BaseIdentificationPlugin = require('./base');

class GoogleVisionPlugin extends BaseIdentificationPlugin {
  /**
   * @param {Object} config - Google Vision API configuration
   * @param {Object} circuitBreaker - Circuit breaker instance
   * @param {Object} logger - Logger instance
   * @param {Object} cache - Cache service instance
   */
  constructor(config, circuitBreaker, logger, cache) {
    super(config, circuitBreaker, logger, cache);

    this.apiKey = config.apiKey;
    this.baseURL = 'https://vision.googleapis.com/v1';
    this.maxResults = config.maxResults || 10;
  }

  /**
   * Identify objects using Google Vision API
   * @param {string} imageData - Base64 encoded image data
   * @param {Object} options - Identification options
   * @returns {Promise<Object>} - Identification results
   */
  async identify(imageData, options = {}) {
    this.validateImageData(imageData);

    const imageHash = this.generateImageHash(imageData);
    const cacheKey = this.generateCacheKey(imageHash, options);

    // Check cache first
    try {
      const cachedResult = await this.cache.get(cacheKey);
      if (cachedResult) {
        this.logger.debug('Returning cached Google Vision result', { cacheKey });
        return {
          ...cachedResult,
          fromCache: true,
          cacheKey
        };
      }
    } catch (error) {
      this.logger.warn('Cache read failed for Google Vision', { error: error.message });
    }

    const result = await this.executeRequest(async () => {
      const response = await axios.post(
        `${this.baseURL}/images:annotate?key=${this.apiKey}`,
        {
          requests: [{
            image: {
              content: imageData.split(',')[1] // Remove data:image/jpeg;base64, prefix
            },
            features: [
              {
                type: 'LABEL_DETECTION',
                maxResults: options.maxResults || this.maxResults
              },
              {
                type: 'OBJECT_LOCALIZATION',
                maxResults: options.maxResults || 5
              },
              {
                type: 'WEB_DETECTION',
                maxResults: options.maxResults || 5
              }
            ]
          }]
        },
        {
          timeout: this.requestTimeout,
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Drahms-Vision/2.0'
          }
        }
      );

      return this.processResponse(response.data, imageData);
    }, { imageHash, operation: 'identify' });

    // Cache the result
    try {
      await this.cache.set(cacheKey, result, 3600); // Cache for 1 hour
    } catch (error) {
      this.logger.warn('Failed to cache Google Vision result', { error: error.message });
    }

    return result;
  }

  /**
   * Process the raw Google Vision API response
   * @param {Object} apiResponse - Raw API response
   * @param {string} originalImageData - Original image data for processing
   * @returns {Object} - Processed identification results
   */
  processResponse(apiResponse, originalImageData) {
    const responses = apiResponse.responses || [];
    const response = responses[0];

    if (!response) {
      throw new Error('No response from Google Vision API');
    }

    const identifications = [];

    // Process label detection results
    if (response.labelAnnotations) {
      response.labelAnnotations.forEach(label => {
        identifications.push({
          name: label.description,
          confidence: label.score,
          type: this.inferType({ name: label.description }),
          source: 'googleVision',
          metadata: {
            mid: label.mid,
            topicality: label.topicality,
            featureType: 'label_detection'
          }
        });
      });
    }

    // Process object localization results
    if (response.localizedObjectAnnotations) {
      response.localizedObjectAnnotations.forEach(obj => {
        identifications.push({
          name: obj.name,
          confidence: obj.score,
          type: this.inferType({ name: obj.name }),
          source: 'googleVision',
          boundingBox: obj.boundingPoly ? this.normalizeBoundingBox(obj.boundingPoly) : null,
          metadata: {
            mid: obj.mid,
            featureType: 'object_localization'
          }
        });
      });
    }

    // Process web detection results if they provide additional unique identifications
    if (response.webDetection && response.webDetection.webEntities) {
      response.webDetection.webEntities
        .filter(entity => entity.score > 0.7) // Only high-confidence web entities
        .forEach(entity => {
          // Avoid duplicates with existing labels
          const existingIndex = identifications.findIndex(id =>
            id.name.toLowerCase().includes(entity.description.toLowerCase()) ||
            entity.description.toLowerCase().includes(id.name.toLowerCase())
          );

          if (existingIndex === -1) {
            identifications.push({
              name: entity.description,
              confidence: entity.score,
              type: this.inferType({ name: entity.description }),
              source: 'googleVision',
              metadata: {
                mid: entity.entityId,
                featureType: 'web_detection'
              }
            });
          }
        });
    }

    // Sort by confidence descending
    identifications.sort((a, b) => b.confidence - a.confidence);

    return {
      plugin: 'googleVision',
      identifications,
      metadata: {
        processedAt: new Date().toISOString(),
        apiVersion: 'v1',
        imageHash: this.generateImageHash(originalImageData),
        totalResults: identifications.length,
        confidenceThreshold: 0.5,
        features: ['LABEL_DETECTION', 'OBJECT_LOCALIZATION', 'WEB_DETECTION']
      }
    };
  }

  /**
   * Normalize bounding box coordinates to consistent format
   * @param {Object} boundingPoly - Google Vision bounding polygon
   * @returns {Object} - Normalized bounding box
   */
  normalizeBoundingBox(boundingPoly) {
    if (!boundingPoly || !boundingPoly.vertices) return null;

    const vertices = boundingPoly.vertices;

    // Extract bounds from vertices
    const xs = vertices.map(v => v.x || 0);
    const ys = vertices.map(v => v.y || 0);

    return {
      x: Math.min(...xs),
      y: Math.min(...ys),
      width: Math.max(...xs) - Math.min(...xs),
      height: Math.max(...ys) - Math.min(...ys),
      normalizedVertices: vertices
    };
  }

  /**
   * Get supported identification types
   * @returns {Array<string>} - Supported types
   */
  getSupportedTypes() {
    return ['general', 'object', 'bird', 'plant', 'insect', 'animal'];
  }

  /**
   * Override infer type for Google Vision specific logic
   * @param {Object} result - Result item
   * @returns {string} - Inferred type
   */
  inferType(result) {
    const name = (result.name || '').toLowerCase();

    // Specific mappings for Google Vision
    if (name.includes('bird') || name.includes('sparrow') || name.includes('eagle') ||
        name.includes('hawk') || name.includes('owl') || name.includes('crow')) {
      return 'bird';
    }

    if (name.includes('plant') || name.includes('tree') || name.includes('leaf') ||
        name.includes('flower') || name.includes('bush') || name.includes('grass')) {
      return 'plant';
    }

    if (name.includes('insect') || name.includes('butterfly') || name.includes('bee') ||
        name.includes('ant') || name.includes('beetle') || name.includes('fly')) {
      return 'insect';
    }

    // Use parent logic for other cases
    return super.inferType(result);
  }

  /**
   * Generate image hash for caching
   * @param {string} imageData - Base64 image data
   * @returns {string} - SHA-256 hash
   */
  generateImageHash(imageData) {
    const imageBuffer = imageData.includes('base64,')
      ? imageData.split(',')[1]
      : imageData;

    return crypto.createHash('sha256').update(imageBuffer).digest('hex').substring(0, 16);
  }

  /**
   * Check plugin health by making a test request
   * @returns {Promise<Object>} - Health status
   */
  async getHealth() {
    try {
      // Make a lightweight request to check API availability
      await axios.get(`${this.baseURL}/images:annotate?key=${this.apiKey}&fields=`, {
        timeout: 5000, // Very short timeout for health check
        validateStatus: (status) => status === 400 // Expecting 400 for missing image
      });

      return {
        status: 'healthy',
        name: this.name,
        supportedTypes: this.getSupportedTypes(),
        apiVersion: 'v1',
        features: ['LABEL_DETECTION', 'OBJECT_LOCALIZATION', 'WEB_DETECTION'],
        lastChecked: new Date().toISOString()
      };
    } catch (error) {
      const status = error.response?.status;

      // 400 is expected (missing image), other errors mean API issues
      if (status === 400) {
        return {
          status: 'healthy',
          name: this.name,
          supportedTypes: this.getSupportedTypes(),
          lastChecked: new Date().toISOString()
        };
      }

      return {
        status: 'unhealthy',
        name: this.name,
        error: error.message,
        statusCode: status,
        supportedTypes: this.getSupportedTypes(),
        lastChecked: new Date().toISOString()
      };
    }
  }
}

module.exports = GoogleVisionPlugin;
