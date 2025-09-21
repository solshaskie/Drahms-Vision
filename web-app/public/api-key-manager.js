// 🔑 API Key Manager for Drahms Vision
// Handles loading, validation, and management of API keys

class APIKeyManager {
    constructor() {
        this.apiKeys = {};
        this.availableAPIs = {
            googleVision: { required: true, name: 'Google Vision API' },
            eBird: { required: false, name: 'eBird API' },
            iNaturalist: { required: false, name: 'iNaturalist' },
            plantNet: { required: false, name: 'PlantNet' },
            nasa: { required: false, name: 'NASA APIs' },
            openWeather: { required: false, name: 'OpenWeather' },
            imagga: { required: false, name: 'Imagga' },
            cloudinary: { required: false, name: 'Cloudinary' }
        };
        this.loadAPIKeys();
    }

    // Load API keys from various sources
    loadAPIKeys() {
        this.apiKeys = {};

        // Try to load from window.API_KEYS (set by server)
        if (window.API_KEYS) {
            Object.assign(this.apiKeys, window.API_KEYS);
            console.log('🔑 Loaded API keys from window.API_KEYS');
        }

        // Load from localStorage (user-configured keys)
        const storedKeys = localStorage.getItem('drahms-vision-api-keys');
        if (storedKeys) {
            try {
                const keys = JSON.parse(storedKeys);
                Object.assign(this.apiKeys, keys);
                console.log('🔑 Loaded API keys from localStorage');
            } catch (error) {
                console.error('Error loading API keys from storage:', error);
            }
        }

        // Validate loaded keys
        this.validateAPIKeys();

        console.log(`🔑 API Key Manager initialized with ${Object.keys(this.apiKeys).length} keys`);
    }

    // Set API keys
    setAPIKeys(keys) {
        if (typeof keys === 'object') {
            this.apiKeys = { ...this.apiKeys, ...keys };
            this.saveToStorage();
            this.validateAPIKeys();
            console.log('🔑 API keys updated');
        }
    }

    // Save keys to localStorage
    saveToStorage() {
        try {
            localStorage.setItem('drahms-vision-api-keys', JSON.stringify(this.apiKeys));
            console.log('💾 API keys saved to localStorage');
        } catch (error) {
            console.error('Error saving API keys to storage:', error);
        }
    }

    // Get API key
    getAPIKey(apiName) {
        return this.apiKeys[apiName];
    }

    // Check if API key exists and is valid
    hasValidKey(apiName) {
        const key = this.getAPIKey(apiName);
        if (!key || key.includes('your_') || key.includes('_here')) {
            return false;
        }
        return true;
    }

    // Get summary of API availability
    getSummary() {
        const available = Object.keys(this.availableAPIs).filter(api =>
            this.hasValidKey(api)
        );

        return {
            total: Object.keys(this.availableAPIs).length,
            available: available.length,
            percentage: Math.round((available.length / Object.keys(this.availableAPIs).length) * 100),
            availableAPIs: available
        };
    }

    // Validate all API keys
    validateAPIKeys() {
        const summary = this.getSummary();
        const requiredMissing = Object.keys(this.availableAPIs)
            .filter(api => this.availableAPIs[api].required && !this.hasValidKey(api));

        if (requiredMissing.length > 0) {
            console.warn('⚠️ Required API keys missing:', requiredMissing);
        }

        console.log(`🔑 API Key Status: ${summary.available}/${summary.total} (${summary.percentage}%)`);
    }

    // Get availability status for specific API
    getAPIStatus(apiName) {
        const key = this.getAPIKey(apiName);
        if (!key) {
            return { status: 'missing', message: 'API key not configured' };
        }

        if (key.includes('your_') || key.includes('_here')) {
            return { status: 'placeholder', message: 'API key contains placeholder text' };
        }

        return { status: 'available', message: 'API key configured' };
    }

    // Clear all API keys
    clearAPIKeys() {
        this.apiKeys = {};
        localStorage.removeItem('drahms-vision-api-keys');
        console.log('🗑️ API keys cleared');
    }

    // Get all configured API keys (for export)
    getAllKeys() {
        return { ...this.apiKeys };
    }

    // Update status display
    updateStatusDisplay() {
        // Update UI status displays if they exist
        const apiStatus = document.getElementById('ai-status-text');
        if (apiStatus) {
            const summary = this.getSummary();
            apiStatus.textContent = 'Ready';
            if (summary.available === 0) {
                apiStatus.className = 'status-error';
            } else if (summary.percentage < 50) {
                apiStatus.className = 'status-warning';
            } else {
                apiStatus.className = 'status-ok';
            }
        }
    }

    // Load keys from form data
    loadFromForm(formData) {
        const keys = {};
        Object.keys(this.availableAPIs).forEach(api => {
            const value = formData.get(`${api}_key`);
            if (value && value.trim()) {
                keys[api] = value.trim();
            }
        });

        if (Object.keys(keys).length > 0) {
            this.setAPIKeys(keys);
            return true;
        }

        return false;
    }

    // Export configuration for backup
    exportConfiguration() {
        return {
            apiKeys: this.getAllKeys(),
            timestamp: new Date().toISOString(),
            version: '1.0'
        };
    }

    // Import configuration from backup
    importConfiguration(config) {
        if (config && config.apiKeys) {
            this.setAPIKeys(config.apiKeys);
            console.log('📥 API configuration imported');
            return true;
        }
        return false;
    }
}

// Make available globally
window.APIKeyManager = APIKeyManager;
