// 🔍 Google Lens Integration for Drahms Vision
// Advanced plant, animal, and insect identification using Google's AI

class GoogleLensIntegration {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseUrl = 'https://vision.googleapis.com/v1';
        this.cache = new Map();
        this.cacheTimeout = 30 * 60 * 1000; // 30 minutes
        this.rateLimits = {
            requests: 0,
            lastReset: Date.now(),
            maxRequests: 1000 // per month for free tier
        };
        
        // Google Lens specific features
        this.features = {
            LABEL_DETECTION: 'LABEL_DETECTION',
            OBJECT_LOCALIZATION: 'OBJECT_LOCALIZATION',
            WEB_DETECTION: 'WEB_DETECTION',
            TEXT_DETECTION: 'TEXT_DETECTION',
            DOCUMENT_TEXT_DETECTION: 'DOCUMENT_TEXT_DETECTION',
            FACE_DETECTION: 'FACE_DETECTION',
            LANDMARK_DETECTION: 'LANDMARK_DETECTION',
            LOGO_DETECTION: 'LOGO_DETECTION',
            SAFE_SEARCH_DETECTION: 'SAFE_SEARCH_DETECTION',
            IMAGE_PROPERTIES: 'IMAGE_PROPERTIES',
            CROP_HINTS: 'CROP_HINTS'
        };
        
        this.init();
    }
    
    init() {
        console.log('🔍 Google Lens Integration initialized');
        this.validateAPIKey();
    }
    
    validateAPIKey() {
        if (!this.apiKey || this.apiKey.includes('your_')) {
            console.warn('⚠️ Google Lens API key not configured');
            return false;
        }
        console.log('✅ Google Lens API key validated');
        return true;
    }
    
    // Main identification method
    async identifyObject(imageData, options = {}) {
        try {
            console.log('🔍 Starting Google Lens identification...');
            
            // Check rate limits
            if (!this.checkRateLimit()) {
                throw new Error('Rate limit exceeded for Google Lens API');
            }
            
            // Check cache first
            const cacheKey = this.generateCacheKey(imageData, options);
            if (this.cache.has(cacheKey)) {
                const cached = this.cache.get(cacheKey);
                if (Date.now() - cached.timestamp < this.cacheTimeout) {
                    console.log('📋 Using cached Google Lens result');
                    return cached.data;
                }
            }
            
            // Prepare request
            const requestBody = this.buildRequest(imageData, options);
            
            // Make API call
            const response = await fetch(`${this.baseUrl}/images:annotate?key=${this.apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });
            
            if (!response.ok) {
                throw new Error(`Google Lens API error: ${response.status} ${response.statusText}`);
            }
            
            const result = await response.json();
            
            // Process and enhance results
            const processedResult = this.processResults(result, options);
            
            // Cache result
            this.cache.set(cacheKey, {
                data: processedResult,
                timestamp: Date.now()
            });
            
            // Update rate limit
            this.rateLimits.requests++;
            
            console.log('✅ Google Lens identification completed');
            return processedResult;
            
        } catch (error) {
            console.error('❌ Google Lens identification failed:', error);
            return this.getFallbackResult(error);
        }
    }
    
    buildRequest(imageData, options) {
        const features = options.features || this.getDefaultFeatures(options.category);
        const maxResults = options.maxResults || 10;
        
        return {
            requests: [{
                image: {
                    content: this.processImageData(imageData)
                },
                features: features.map(feature => ({
                    type: feature,
                    maxResults: maxResults
                })),
                imageContext: {
                    languageHints: options.languageHints || ['en'],
                    latLongRect: options.location ? this.buildLocationContext(options.location) : undefined
                }
            }]
        };
    }
    
    getDefaultFeatures(category) {
        const featureSets = {
            'plant': [
                this.features.LABEL_DETECTION,
                this.features.OBJECT_LOCALIZATION,
                this.features.WEB_DETECTION
            ],
            'animal': [
                this.features.LABEL_DETECTION,
                this.features.OBJECT_LOCALIZATION,
                this.features.WEB_DETECTION
            ],
            'insect': [
                this.features.LABEL_DETECTION,
                this.features.OBJECT_LOCALIZATION,
                this.features.WEB_DETECTION
            ],
            'bird': [
                this.features.LABEL_DETECTION,
                this.features.OBJECT_LOCALIZATION,
                this.features.WEB_DETECTION
            ],
            'general': [
                this.features.LABEL_DETECTION,
                this.features.OBJECT_LOCALIZATION,
                this.features.WEB_DETECTION,
                this.features.IMAGE_PROPERTIES
            ]
        };
        
        return featureSets[category] || featureSets.general;
    }
    
    processImageData(imageData) {
        // Handle different image data formats
        if (typeof imageData === 'string') {
            if (imageData.startsWith('data:image/')) {
                // Remove data URL prefix
                return imageData.split(',')[1];
            } else if (imageData.startsWith('http')) {
                // For URL-based images, we'd need to fetch and convert
                throw new Error('URL-based images not supported in this implementation');
            }
            return imageData; // Assume it's already base64
        } else if (imageData instanceof ArrayBuffer) {
            // Convert ArrayBuffer to base64
            const bytes = new Uint8Array(imageData);
            let binary = '';
            for (let i = 0; i < bytes.byteLength; i++) {
                binary += String.fromCharCode(bytes[i]);
            }
            return btoa(binary);
        }
        
        throw new Error('Unsupported image data format');
    }
    
    buildLocationContext(location) {
        return {
            minLatLng: {
                latitude: location.latitude - 0.01,
                longitude: location.longitude - 0.01
            },
            maxLatLng: {
                latitude: location.latitude + 0.01,
                longitude: location.longitude + 0.01
            }
        };
    }
    
    processResults(apiResult, options) {
        const response = apiResult.responses[0];
        if (!response) {
            throw new Error('No response from Google Lens API');
        }
        
        const result = {
            source: 'Google Lens',
            timestamp: new Date().toISOString(),
            category: options.category || 'general',
            confidence: 0,
            identifications: [],
            objects: [],
            webEntities: [],
            properties: {},
            errors: response.error ? [response.error] : []
        };
        
        // Process label detections
        if (response.labelAnnotations) {
            result.identifications = response.labelAnnotations.map(label => ({
                name: label.description,
                confidence: label.score,
                type: 'label',
                mid: label.mid
            }));
            
            // Calculate overall confidence
            result.confidence = Math.max(...response.labelAnnotations.map(l => l.score));
        }
        
        // Process object localizations
        if (response.localizedObjectAnnotations) {
            result.objects = response.localizedObjectAnnotations.map(obj => ({
                name: obj.name,
                confidence: obj.score,
                type: 'object',
                boundingBox: obj.boundingPoly,
                mid: obj.mid
            }));
        }
        
        // Process web entities
        if (response.webDetection) {
            result.webEntities = response.webDetection.webEntities?.map(entity => ({
                description: entity.description,
                score: entity.score,
                entityId: entity.entityId
            })) || [];
            
            // Add web matches
            if (response.webDetection.webEntities) {
                result.webMatches = response.webDetection.webEntities
                    .filter(entity => entity.score > 0.5)
                    .map(entity => ({
                        description: entity.description,
                        confidence: entity.score,
                        type: 'web_entity'
                    }));
            }
        }
        
        // Process image properties
        if (response.imagePropertiesAnnotation) {
            result.properties = {
                dominantColors: response.imagePropertiesAnnotation.dominantColors?.colors || [],
                cropHints: response.cropHintsAnnotation?.cropHints || []
            };
        }
        
        // Enhance with category-specific processing
        result = this.enhanceForCategory(result, options.category);
        
        return result;
    }
    
    enhanceForCategory(result, category) {
        switch (category) {
            case 'plant':
                return this.enhancePlantIdentification(result);
            case 'animal':
                return this.enhanceAnimalIdentification(result);
            case 'insect':
                return this.enhanceInsectIdentification(result);
            case 'bird':
                return this.enhanceBirdIdentification(result);
            default:
                return result;
        }
    }
    
    enhancePlantIdentification(result) {
        // Filter for plant-related identifications
        const plantKeywords = ['plant', 'tree', 'flower', 'leaf', 'herb', 'shrub', 'vegetation', 'flora'];
        
        result.identifications = result.identifications.filter(id => 
            plantKeywords.some(keyword => 
                id.name.toLowerCase().includes(keyword)
            )
        );
        
        // Add plant-specific metadata
        result.metadata = {
            type: 'plant',
            suggestions: this.getPlantSuggestions(result.identifications),
            careTips: this.getPlantCareTips(result.identifications)
        };
        
        return result;
    }
    
    enhanceAnimalIdentification(result) {
        // Filter for animal-related identifications
        const animalKeywords = ['animal', 'mammal', 'bird', 'reptile', 'amphibian', 'fish', 'wildlife'];
        
        result.identifications = result.identifications.filter(id => 
            animalKeywords.some(keyword => 
                id.name.toLowerCase().includes(keyword)
            )
        );
        
        // Add animal-specific metadata
        result.metadata = {
            type: 'animal',
            habitat: this.getAnimalHabitat(result.identifications),
            behavior: this.getAnimalBehavior(result.identifications)
        };
        
        return result;
    }
    
    enhanceInsectIdentification(result) {
        // Filter for insect-related identifications
        const insectKeywords = ['insect', 'bug', 'beetle', 'butterfly', 'moth', 'bee', 'wasp', 'ant', 'spider'];
        
        result.identifications = result.identifications.filter(id => 
            insectKeywords.some(keyword => 
                id.name.toLowerCase().includes(keyword)
            )
        );
        
        // Add insect-specific metadata
        result.metadata = {
            type: 'insect',
            classification: this.getInsectClassification(result.identifications),
            lifecycle: this.getInsectLifecycle(result.identifications)
        };
        
        return result;
    }
    
    enhanceBirdIdentification(result) {
        // Filter for bird-related identifications
        const birdKeywords = ['bird', 'avian', 'songbird', 'raptor', 'waterfowl', 'passerine'];
        
        result.identifications = result.identifications.filter(id => 
            birdKeywords.some(keyword => 
                id.name.toLowerCase().includes(keyword)
            )
        );
        
        // Add bird-specific metadata
        result.metadata = {
            type: 'bird',
            habitat: this.getBirdHabitat(result.identifications),
            migration: this.getBirdMigration(result.identifications),
            calls: this.getBirdCalls(result.identifications)
        };
        
        return result;
    }
    
    // Helper methods for enhanced metadata
    getPlantSuggestions(identifications) {
        return identifications.slice(0, 3).map(id => ({
            name: id.name,
            confidence: id.confidence,
            suggestion: `Consider ${id.name} for your garden`
        }));
    }
    
    getPlantCareTips(identifications) {
        return identifications.slice(0, 2).map(id => ({
            plant: id.name,
            tips: [
                'Ensure proper drainage',
                'Water regularly but avoid overwatering',
                'Provide adequate sunlight'
            ]
        }));
    }
    
    getAnimalHabitat(identifications) {
        return identifications.slice(0, 2).map(id => ({
            animal: id.name,
            habitat: 'Natural habitat information would be available'
        }));
    }
    
    getAnimalBehavior(identifications) {
        return identifications.slice(0, 2).map(id => ({
            animal: id.name,
            behavior: 'Behavioral patterns and characteristics'
        }));
    }
    
    getInsectClassification(identifications) {
        return identifications.slice(0, 2).map(id => ({
            insect: id.name,
            order: 'Insect order classification',
            family: 'Family classification'
        }));
    }
    
    getInsectLifecycle(identifications) {
        return identifications.slice(0, 2).map(id => ({
            insect: id.name,
            lifecycle: 'Lifecycle stages and development'
        }));
    }
    
    getBirdHabitat(identifications) {
        return identifications.slice(0, 2).map(id => ({
            bird: id.name,
            habitat: 'Preferred habitat and range'
        }));
    }
    
    getBirdMigration(identifications) {
        return identifications.slice(0, 2).map(id => ({
            bird: id.name,
            migration: 'Migration patterns and timing'
        }));
    }
    
    getBirdCalls(identifications) {
        return identifications.slice(0, 2).map(id => ({
            bird: id.name,
            calls: 'Vocalizations and calls'
        }));
    }
    
    checkRateLimit() {
        const now = Date.now();
        const timeSinceReset = now - this.rateLimits.lastReset;
        
        // Reset counter if it's been more than a month
        if (timeSinceReset > 30 * 24 * 60 * 60 * 1000) {
            this.rateLimits.requests = 0;
            this.rateLimits.lastReset = now;
        }
        
        return this.rateLimits.requests < this.rateLimits.maxRequests;
    }
    
    generateCacheKey(imageData, options) {
        // Create a hash of the image data and options for caching
        const dataString = typeof imageData === 'string' ? imageData : JSON.stringify(imageData);
        const optionsString = JSON.stringify(options);
        return btoa(dataString + optionsString).substring(0, 32);
    }
    
    getFallbackResult(error) {
        return {
            source: 'Google Lens (Fallback)',
            timestamp: new Date().toISOString(),
            error: error.message,
            identifications: [{
                name: 'Unknown Object',
                confidence: 0.1,
                type: 'fallback'
            }],
            objects: [],
            webEntities: [],
            properties: {},
            metadata: {
                type: 'fallback',
                message: 'Google Lens API unavailable, using fallback identification'
            }
        };
    }
    
    // Utility methods
    getRateLimitStatus() {
        return {
            requests: this.rateLimits.requests,
            maxRequests: this.rateLimits.maxRequests,
            remaining: this.rateLimits.maxRequests - this.rateLimits.requests,
            resetTime: new Date(this.rateLimits.lastReset + 30 * 24 * 60 * 60 * 1000)
        };
    }
    
    clearCache() {
        this.cache.clear();
        console.log('🗑️ Google Lens cache cleared');
    }
    
    getCacheStats() {
        return {
            size: this.cache.size,
            entries: Array.from(this.cache.keys())
        };
    }
    
    // Batch processing for multiple images
    async identifyBatch(images, options = {}) {
        const results = [];
        
        for (const image of images) {
            try {
                const result = await this.identifyObject(image, options);
                results.push(result);
                
                // Add delay to respect rate limits
                await new Promise(resolve => setTimeout(resolve, 100));
            } catch (error) {
                results.push(this.getFallbackResult(error));
            }
        }
        
        return results;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GoogleLensIntegration;
} else {
    window.GoogleLensIntegration = GoogleLensIntegration;
}
