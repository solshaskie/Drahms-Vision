// 🔍 Multi-API Object Identification System with Redundancy
// Drahms Vision Astronomy Camera System

class ObjectIdentificationSystem {
    constructor() {
        this.apis = {
            birds: [
                { name: 'eBird', priority: 1, endpoint: '/api/identify/ebird' },
                { name: 'BirdNET', priority: 2, endpoint: '/api/identify/birdnet' },
                { name: 'XenoCanto', priority: 3, endpoint: '/api/identify/xenocanto' }
            ],
            insects: [
                { name: 'iNaturalist', priority: 1, endpoint: '/api/identify/inaturalist' },
                { name: 'BugGuide', priority: 2, endpoint: '/api/identify/bugguide' },
                { name: 'BAMONA', priority: 3, endpoint: '/api/identify/bamona' }
            ],
            plants: [
                { name: 'PlantNet', priority: 1, endpoint: '/api/identify/plantnet' },
                { name: 'FloraIncognita', priority: 2, endpoint: '/api/identify/flora' },
                { name: 'Trefle', priority: 3, endpoint: '/api/identify/trefle' }
            ],
            astronomy: [
                { name: 'NASA_APOD', priority: 1, endpoint: '/api/identify/nasa' },
                { name: 'OpenWeather', priority: 2, endpoint: '/api/identify/weather' },
                { name: 'HeavensAbove', priority: 3, endpoint: '/api/identify/heavens' }
            ],
            animals: [
                { name: 'WildlifeInsights', priority: 1, endpoint: '/api/identify/wildlife' },
                { name: 'MammalNet', priority: 2, endpoint: '/api/identify/mammal' },
                { name: 'AmphibiaWeb', priority: 3, endpoint: '/api/identify/amphibian' }
            ],
            general: [
                { name: 'GoogleLens', priority: 1, endpoint: '/api/identify/googlelens' },
                { name: 'Imagga', priority: 2, endpoint: '/api/identify/imagga' },
                { name: 'Cloudinary', priority: 3, endpoint: '/api/identify/cloudinary' },
                { name: 'Roboflow', priority: 4, endpoint: '/api/identify/roboflow' }
            ]
        };
        
        this.cache = new Map();
        this.confidenceThreshold = 0.7;
        this.maxRetries = 3;
        this.timeout = 10000; // 10 seconds
    }
    
    // Main identification method
    async identifyObject(imageData, category = 'auto', location = null) {
        console.log(`🔍 Starting identification for category: ${category}`);
        
        // Check cache first
        const cacheKey = this.generateCacheKey(imageData, category);
        if (this.cache.has(cacheKey)) {
            console.log('📦 Returning cached result');
            return this.cache.get(cacheKey);
        }
        
        const results = [];
        const errors = [];
        
        // Determine which APIs to use
        const apiList = this.getAPIList(category);
        
        // Try APIs in parallel with priority
        const promises = apiList.map(api => 
            this.callAPI(api, imageData, location).catch(error => {
                errors.push({ api: api.name, error: error.message });
                return null;
            })
        );
        
        // Wait for all API calls to complete
        const apiResults = await Promise.allSettled(promises);
        
        // Process results
        apiResults.forEach((result, index) => {
            if (result.status === 'fulfilled' && result.value) {
                results.push(result.value);
            }
        });
        
        // Aggregate results
        const finalResult = this.aggregateResults(results, category);
        
        // Cache the result
        this.cache.set(cacheKey, finalResult);
        
        // Log errors for debugging
        if (errors.length > 0) {
            console.warn('⚠️ API errors:', errors);
        }
        
        return finalResult;
    }
    
    // Get API list based on category
    getAPIList(category) {
        if (category === 'auto') {
            // Return all APIs for auto-detection
            return Object.values(this.apis).flat();
        }
        
        return this.apis[category] || this.apis.general;
    }
    
    // Call individual API with retry logic
    async callAPI(api, imageData, location) {
        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            try {
                console.log(`🔄 Calling ${api.name} (attempt ${attempt})`);
                
                const response = await fetch(api.endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        image: imageData,
                        location: location,
                        timestamp: new Date().toISOString()
                    }),
                    signal: AbortSignal.timeout(this.timeout)
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                const result = await response.json();
                
                // Validate result
                if (this.validateResult(result)) {
                    console.log(`✅ ${api.name} successful: ${result.identifications?.[0]?.name || 'Unknown'}`);
                    return {
                        api: api.name,
                        priority: api.priority,
                        ...result
                    };
                } else {
                    throw new Error('Invalid result format');
                }
                
            } catch (error) {
                console.warn(`❌ ${api.name} attempt ${attempt} failed:`, error.message);
                
                if (attempt === this.maxRetries) {
                    throw error;
                }
                
                // Wait before retry (exponential backoff)
                await this.delay(Math.pow(2, attempt) * 1000);
            }
        }
    }
    
    // Aggregate results from multiple APIs
    aggregateResults(results, category) {
        if (results.length === 0) {
            return {
                success: false,
                message: 'No APIs returned valid results',
                confidence: 0,
                identifications: []
            };
        }
        
        // Group identifications by name
        const identificationMap = new Map();
        
        results.forEach(result => {
            if (result.identifications) {
                result.identifications.forEach(identification => {
                    const key = identification.name.toLowerCase();
                    
                    if (!identificationMap.has(key)) {
                        identificationMap.set(key, {
                            name: identification.name,
                            confidence: 0,
                            count: 0,
                            apis: [],
                            metadata: identification.metadata || {}
                        });
                    }
                    
                    const entry = identificationMap.get(key);
                    entry.confidence += identification.confidence;
                    entry.count += 1;
                    entry.apis.push(result.api);
                    
                    // Merge metadata
                    Object.assign(entry.metadata, identification.metadata || {});
                });
            }
        });
        
        // Calculate weighted confidence
        const aggregatedIdentifications = Array.from(identificationMap.values())
            .map(entry => ({
                ...entry,
                confidence: entry.confidence / entry.count, // Average confidence
                weightedConfidence: this.calculateWeightedConfidence(entry, results)
            }))
            .filter(entry => entry.weightedConfidence >= this.confidenceThreshold)
            .sort((a, b) => b.weightedConfidence - a.weightedConfidence);
        
        // Determine overall success
        const success = aggregatedIdentifications.length > 0;
        const overallConfidence = success ? aggregatedIdentifications[0].weightedConfidence : 0;
        
        return {
            success,
            confidence: overallConfidence,
            identifications: aggregatedIdentifications,
            category: category,
            apisUsed: results.map(r => r.api),
            timestamp: new Date().toISOString(),
            metadata: {
                totalAPIs: results.length,
                successfulAPIs: results.length,
                category: category
            }
        };
    }
    
    // Calculate weighted confidence based on API priority and agreement
    calculateWeightedConfidence(identification, results) {
        let weightedConfidence = identification.confidence;
        
        // Bonus for multiple API agreement
        if (identification.count > 1) {
            weightedConfidence += 0.1 * (identification.count - 1);
        }
        
        // Bonus for high-priority API agreement
        const highPriorityAPIs = identification.apis.filter(apiName => {
            const api = results.find(r => r.api === apiName);
            return api && api.priority === 1;
        });
        
        if (highPriorityAPIs.length > 0) {
            weightedConfidence += 0.15;
        }
        
        return Math.min(weightedConfidence, 1.0);
    }
    
    // Validate API result
    validateResult(result) {
        return result && 
               typeof result === 'object' && 
               Array.isArray(result.identifications) &&
               result.identifications.length > 0;
    }
    
    // Generate cache key
    generateCacheKey(imageData, category) {
        // Simple hash of image data and category
        const data = JSON.stringify({ imageData: imageData.substring(0, 100), category });
        let hash = 0;
        for (let i = 0; i < data.length; i++) {
            const char = data.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return `${category}_${Math.abs(hash)}`;
    }
    
    // Utility function for delays
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    // Clear cache
    clearCache() {
        this.cache.clear();
        console.log('🗑️ Cache cleared');
    }
    
    // Get cache statistics
    getCacheStats() {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys())
        };
    }
    
    // Set confidence threshold
    setConfidenceThreshold(threshold) {
        this.confidenceThreshold = Math.max(0, Math.min(1, threshold));
        console.log(`🎯 Confidence threshold set to: ${this.confidenceThreshold}`);
    }
    
    // Get system status
    getSystemStatus() {
        return {
            apis: Object.keys(this.apis),
            totalAPIs: Object.values(this.apis).flat().length,
            cacheSize: this.cache.size,
            confidenceThreshold: this.confidenceThreshold,
            maxRetries: this.maxRetries,
            timeout: this.timeout
        };
    }
}

// Enhanced identification with context awareness
class ContextAwareIdentification extends ObjectIdentificationSystem {
    constructor() {
        super();
        this.locationData = null;
        this.timeData = null;
        this.weatherData = null;
    }
    
    // Set context data
    setContext(location, time, weather) {
        this.locationData = location;
        this.timeData = time;
        this.weatherData = weather;
    }
    
    // Enhanced identification with context
    async identifyWithContext(imageData, category = 'auto') {
        const context = this.buildContext();
        
        // Adjust category based on context
        const adjustedCategory = this.adjustCategoryByContext(category, context);
        
        // Get base identification
        const result = await this.identifyObject(imageData, adjustedCategory, this.locationData);
        
        // Enhance result with context
        return this.enhanceResultWithContext(result, context);
    }
    
    // Build context object
    buildContext() {
        return {
            location: this.locationData,
            time: this.timeData,
            weather: this.weatherData,
            season: this.getSeason(),
            timeOfDay: this.getTimeOfDay(),
            moonPhase: this.getMoonPhase()
        };
    }
    
    // Adjust category based on context
    adjustCategoryByContext(category, context) {
        if (category !== 'auto') return category;
        
        const hour = new Date().getHours();
        const isNight = hour < 6 || hour > 20;
        
        // Night time - focus on nocturnal animals and astronomy
        if (isNight) {
            return Math.random() > 0.5 ? 'astronomy' : 'animals';
        }
        
        // Day time - focus on birds, insects, plants
        const categories = ['birds', 'insects', 'plants'];
        return categories[Math.floor(Math.random() * categories.length)];
    }
    
    // Enhance result with context
    enhanceResultWithContext(result, context) {
        if (!result.success) return result;
        
        // Add context information
        result.context = context;
        
        // Adjust confidence based on context
        result.identifications.forEach(identification => {
            identification.contextAdjustedConfidence = this.adjustConfidenceByContext(
                identification.weightedConfidence, 
                identification, 
                context
            );
        });
        
        // Re-sort by context-adjusted confidence
        result.identifications.sort((a, b) => b.contextAdjustedConfidence - a.contextAdjustedConfidence);
        
        return result;
    }
    
    // Adjust confidence based on context
    adjustConfidenceByContext(confidence, identification, context) {
        let adjusted = confidence;
        
        // Time-based adjustments
        if (context.timeOfDay === 'night' && identification.metadata?.nocturnal) {
            adjusted += 0.1;
        }
        
        if (context.timeOfDay === 'day' && identification.metadata?.diurnal) {
            adjusted += 0.1;
        }
        
        // Seasonal adjustments
        if (context.season && identification.metadata?.seasonality) {
            if (identification.metadata.seasonality.includes(context.season)) {
                adjusted += 0.05;
            }
        }
        
        return Math.min(adjusted, 1.0);
    }
    
    // Utility methods for context
    getSeason() {
        const month = new Date().getMonth();
        if (month >= 2 && month <= 4) return 'spring';
        if (month >= 5 && month <= 7) return 'summer';
        if (month >= 8 && month <= 10) return 'autumn';
        return 'winter';
    }
    
    getTimeOfDay() {
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 12) return 'morning';
        if (hour >= 12 && hour < 17) return 'afternoon';
        if (hour >= 17 && hour < 20) return 'evening';
        return 'night';
    }
    
    getMoonPhase() {
        // Simplified moon phase calculation
        const date = new Date();
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        
        // Simple approximation
        const phase = ((year * 12 + month) * 29.53 + day) % 29.53;
        
        if (phase < 3.69) return 'new';
        if (phase < 7.38) return 'waxing_crescent';
        if (phase < 11.07) return 'first_quarter';
        if (phase < 14.76) return 'waxing_gibbous';
        if (phase < 18.45) return 'full';
        if (phase < 22.14) return 'waning_gibbous';
        if (phase < 25.83) return 'last_quarter';
        return 'waning_crescent';
    }
}

// Export for use in main application
window.ObjectIdentificationSystem = ObjectIdentificationSystem;
window.ContextAwareIdentification = ContextAwareIdentification;
