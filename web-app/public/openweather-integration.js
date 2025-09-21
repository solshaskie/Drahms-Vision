// 🌤️ OpenWeather API Integration
// Enhanced weather data with more detailed forecasts and alerts

class OpenWeatherIntegration {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseUrl = 'https://api.openweathermap.org/data/2.5';
        this.geocodingUrl = 'https://api.openweathermap.org/geo/1.0';
        this.cache = new Map();
        this.cacheTimeout = 10 * 60 * 1000; // 10 minutes
    }
    
    // Get current weather with detailed information
    async getCurrentWeather(latitude, longitude) {
        const cacheKey = `current_${latitude}_${longitude}`;
        
        // Check cache first
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheTimeout) {
                return cached.data;
            }
        }
        
        try {
            const params = new URLSearchParams({
                lat: latitude.toString(),
                lon: longitude.toString(),
                appid: this.apiKey,
                units: 'metric'
            });
            
            const url = `${this.baseUrl}/weather?${params}`;
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`OpenWeather API error: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Cache the result
            this.cache.set(cacheKey, {
                data: data,
                timestamp: Date.now()
            });
            
            return data;
        } catch (error) {
            console.error('OpenWeather API error:', error);
            throw error;
        }
    }
    
    // Get 5-day forecast with 3-hour intervals
    async getForecast(latitude, longitude) {
        const cacheKey = `forecast_${latitude}_${longitude}`;
        
        // Check cache first
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheTimeout) {
                return cached.data;
            }
        }
        
        try {
            const params = new URLSearchParams({
                lat: latitude.toString(),
                lon: longitude.toString(),
                appid: this.apiKey,
                units: 'metric'
            });
            
            const url = `${this.baseUrl}/forecast?${params}`;
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`OpenWeather API error: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Cache the result
            this.cache.set(cacheKey, {
                data: data,
                timestamp: Date.now()
            });
            
            return data;
        } catch (error) {
            console.error('OpenWeather API error:', error);
            throw error;
        }
    }
    
    // Get weather alerts for the area
    async getAlerts(latitude, longitude) {
        try {
            const params = new URLSearchParams({
                lat: latitude.toString(),
                lon: longitude.toString(),
                appid: this.apiKey
            });
            
            const url = `${this.baseUrl}/onecall?${params}&exclude=minutely,hourly,daily`;
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`OpenWeather API error: ${response.status}`);
            }
            
            const data = await response.json();
            return data.alerts || [];
        } catch (error) {
            console.error('OpenWeather alerts error:', error);
            return [];
        }
    }
    
    // Get air quality data
    async getAirQuality(latitude, longitude) {
        try {
            const params = new URLSearchParams({
                lat: latitude.toString(),
                lon: longitude.toString(),
                appid: this.apiKey
            });
            
            const url = `${this.baseUrl}/air_pollution?${params}`;
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`OpenWeather API error: ${response.status}`);
            }
            
            const data = await response.json();
            return data.list[0];
        } catch (error) {
            console.error('OpenWeather air quality error:', error);
            return null;
        }
    }
    
    // Search for locations by name
    async searchLocation(query, limit = 5) {
        try {
            const params = new URLSearchParams({
                q: query,
                limit: limit.toString(),
                appid: this.apiKey
            });
            
            const url = `${this.geocodingUrl}/direct?${params}`;
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`OpenWeather geocoding error: ${response.status}`);
            }
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('OpenWeather geocoding error:', error);
            return [];
        }
    }
    
    // Get UV index data
    async getUVIndex(latitude, longitude) {
        try {
            const params = new URLSearchParams({
                lat: latitude.toString(),
                lon: longitude.toString(),
                appid: this.apiKey
            });
            
            const url = `${this.baseUrl}/uvi?${params}`;
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`OpenWeather UV API error: ${response.status}`);
            }
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('OpenWeather UV error:', error);
            return null;
        }
    }
    
    // Format weather data for display
    formatWeatherData(weatherData) {
        return {
            temperature: Math.round(weatherData.main.temp),
            feelsLike: Math.round(weatherData.main.feels_like),
            humidity: weatherData.main.humidity,
            pressure: weatherData.main.pressure,
            visibility: weatherData.visibility / 1000, // Convert to km
            windSpeed: weatherData.wind.speed,
            windDirection: weatherData.wind.deg,
            description: weatherData.weather[0].description,
            icon: weatherData.weather[0].icon,
            country: weatherData.sys.country,
            city: weatherData.name,
            sunrise: new Date(weatherData.sys.sunrise * 1000),
            sunset: new Date(weatherData.sys.sunset * 1000)
        };
    }
    
    // Get weather icon URL
    getWeatherIconUrl(iconCode, size = '2x') {
        return `https://openweathermap.org/img/wn/${iconCode}@${size}.png`;
    }
    
    // Get wind direction as text
    getWindDirection(degrees) {
        const directions = [
            'N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
            'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'
        ];
        const index = Math.round(degrees / 22.5) % 16;
        return directions[index];
    }
    
    // Get air quality description
    getAirQualityDescription(aqi) {
        const qualityLevels = {
            1: { level: 'Good', description: 'Air quality is satisfactory' },
            2: { level: 'Fair', description: 'Air quality is acceptable' },
            3: { level: 'Moderate', description: 'Sensitive people may experience minor breathing discomfort' },
            4: { level: 'Poor', description: 'Everyone may begin to experience breathing discomfort' },
            5: { level: 'Very Poor', description: 'Health warnings of emergency conditions' }
        };
        return qualityLevels[aqi] || { level: 'Unknown', description: 'Air quality data unavailable' };
    }
    
    // Get UV index description
    getUVIndexDescription(uvIndex) {
        if (uvIndex <= 2) return { level: 'Low', description: 'Minimal sun protection required' };
        if (uvIndex <= 5) return { level: 'Moderate', description: 'Some sun protection required' };
        if (uvIndex <= 7) return { level: 'High', description: 'Sun protection required' };
        if (uvIndex <= 10) return { level: 'Very High', description: 'Extra sun protection required' };
        return { level: 'Extreme', description: 'Avoid sun exposure' };
    }
    
    // Clear cache
    clearCache() {
        this.cache.clear();
        console.log('🌤️ OpenWeather cache cleared');
    }
    
    // Get cache statistics
    getCacheStats() {
        return {
            size: this.cache.size,
            entries: Array.from(this.cache.keys())
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = OpenWeatherIntegration;
} else {
    window.OpenWeatherIntegration = OpenWeatherIntegration;
}
