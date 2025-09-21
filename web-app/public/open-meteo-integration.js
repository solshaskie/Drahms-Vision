// 🌤️ Open-Meteo Weather & Astronomical Data Integration
// Completely free weather API - no API key required!

class OpenMeteoIntegration {
    constructor() {
        this.baseUrl = 'https://api.open-meteo.com/v1';
        this.forecastUrl = 'https://api.open-meteo.com/v1/forecast';
        this.geocodingUrl = 'https://geocoding-api.open-meteo.com/v1';
        this.cache = new Map();
        this.cacheTimeout = 10 * 60 * 1000; // 10 minutes
    }
    
    // Get weather and astronomical data for a location
    async getWeatherAndAstronomy(latitude, longitude) {
        const cacheKey = `weather_${latitude}_${longitude}`;
        
        // Check cache first
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheTimeout) {
                return cached.data;
            }
        }
        
        try {
            const params = new URLSearchParams({
                latitude: latitude.toString(),
                longitude: longitude.toString(),
                current_weather: 'true',
                daily: 'sunrise,sunset',
                timezone: 'auto'
            });
            
            const url = `${this.forecastUrl}?${params}`;
            const response = await fetch(url);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Open-Meteo API error:', response.status, errorText);
                throw new Error(`Open-Meteo API error: ${response.status} - ${errorText}`);
            }
            
            const data = await response.json();
            
            // Cache the result
            this.cache.set(cacheKey, {
                data: data,
                timestamp: Date.now()
            });
            
            return data;
        } catch (error) {
            console.error('Open-Meteo API error:', error);
            throw error;
        }
    }
    
    // Get current weather conditions
    async getCurrentWeather(latitude, longitude) {
        try {
            const data = await this.getWeatherAndAstronomy(latitude, longitude);
            return {
                temperature: data.current_weather.temperature,
                windspeed: data.current_weather.windspeed,
                winddirection: data.current_weather.winddirection,
                weathercode: data.current_weather.weathercode,
                time: data.current_weather.time,
                weatherDescription: this.getWeatherDescription(data.current_weather.weathercode)
            };
        } catch (error) {
            console.error('Error getting current weather:', error);
            return null;
        }
    }
    
    // Get astronomical data (sunrise, sunset, moon phases)
    async getAstronomicalData(latitude, longitude) {
        try {
            const data = await this.getWeatherAndAstronomy(latitude, longitude);
            const daily = data.daily;
            
            return {
                sunrise: daily.sunrise ? daily.sunrise[0] : null,
                sunset: daily.sunset ? daily.sunset[0] : null,
                moonrise: daily.moonrise ? daily.moonrise[0] : null,
                moonset: daily.moonset ? daily.moonset[0] : null,
                moonPhase: daily.moon_phases ? this.getMoonPhaseDescription(daily.moon_phases[0]) : 'Unknown',
                moonPhaseCode: daily.moon_phases ? daily.moon_phases[0] : null
            };
        } catch (error) {
            console.error('Error getting astronomical data:', error);
            return null;
        }
    }
    
    // Get 7-day forecast
    async getForecast(latitude, longitude) {
        try {
            const data = await this.getWeatherAndAstronomy(latitude, longitude);
            const daily = data.daily;
            
            const forecast = [];
            for (let i = 0; i < daily.time.length; i++) {
                forecast.push({
                    date: daily.time[i],
                    sunrise: daily.sunrise[i],
                    sunset: daily.sunset[i],
                    moonrise: daily.moonrise[i],
                    moonset: daily.moonset[i],
                    moonPhase: daily.moon_phases[i],
                    moonPhaseDescription: this.getMoonPhaseDescription(daily.moon_phases[i])
                });
            }
            
            return forecast;
        } catch (error) {
            console.error('Error getting forecast:', error);
            return null;
        }
    }
    
    // Search for locations by name
    async searchLocation(query) {
        try {
            const params = new URLSearchParams({
                name: query,
                count: 10,
                language: 'en'
            });
            
            const url = `${this.geocodingUrl}/search?${params}`;
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`Geocoding API error: ${response.status}`);
            }
            
            const data = await response.json();
            return data.results || [];
        } catch (error) {
            console.error('Error searching location:', error);
            return [];
        }
    }
    
    // Convert weather code to description
    getWeatherDescription(weatherCode) {
        const weatherCodes = {
            0: 'Clear sky',
            1: 'Mainly clear',
            2: 'Partly cloudy',
            3: 'Overcast',
            45: 'Fog',
            48: 'Depositing rime fog',
            51: 'Light drizzle',
            53: 'Moderate drizzle',
            55: 'Dense drizzle',
            56: 'Light freezing drizzle',
            57: 'Dense freezing drizzle',
            61: 'Slight rain',
            63: 'Moderate rain',
            65: 'Heavy rain',
            66: 'Light freezing rain',
            67: 'Heavy freezing rain',
            71: 'Slight snow fall',
            73: 'Moderate snow fall',
            75: 'Heavy snow fall',
            77: 'Snow grains',
            80: 'Slight rain showers',
            81: 'Moderate rain showers',
            82: 'Violent rain showers',
            85: 'Slight snow showers',
            86: 'Heavy snow showers',
            95: 'Thunderstorm',
            96: 'Thunderstorm with slight hail',
            99: 'Thunderstorm with heavy hail'
        };
        
        return weatherCodes[weatherCode] || 'Unknown';
    }
    
    // Convert moon phase code to description
    getMoonPhaseDescription(moonPhaseCode) {
        const moonPhases = {
            0: 'New Moon',
            1: 'Waxing Crescent',
            2: 'First Quarter',
            3: 'Waxing Gibbous',
            4: 'Full Moon',
            5: 'Waning Gibbous',
            6: 'Last Quarter',
            7: 'Waning Crescent'
        };
        
        return moonPhases[moonPhaseCode] || 'Unknown';
    }
    
    // Get observing conditions (good for astronomy)
    getObservingConditions(weatherData) {
        const weatherCode = weatherData.current_weather.weathercode;
        const windSpeed = weatherData.current_weather.windspeed;
        
        let conditions = {
            visibility: 'Unknown',
            seeing: 'Unknown',
            transparency: 'Unknown',
            overall: 'Unknown'
        };
        
        // Determine visibility based on weather code
        if ([0, 1].includes(weatherCode)) {
            conditions.visibility = 'Excellent';
            conditions.seeing = 'Good';
            conditions.transparency = 'Excellent';
            conditions.overall = 'Excellent';
        } else if ([2, 3].includes(weatherCode)) {
            conditions.visibility = 'Good';
            conditions.seeing = 'Fair';
            conditions.transparency = 'Good';
            conditions.overall = 'Good';
        } else if ([45, 48, 51, 53, 55, 56, 57].includes(weatherCode)) {
            conditions.visibility = 'Poor';
            conditions.seeing = 'Poor';
            conditions.transparency = 'Poor';
            conditions.overall = 'Poor';
        } else if ([61, 63, 65, 66, 67, 71, 73, 75, 77, 80, 81, 82, 85, 86, 95, 96, 99].includes(weatherCode)) {
            conditions.visibility = 'Very Poor';
            conditions.seeing = 'Very Poor';
            conditions.transparency = 'Very Poor';
            conditions.overall = 'Very Poor';
        }
        
        // Adjust for wind conditions
        if (windSpeed > 20) {
            conditions.seeing = 'Poor';
            if (conditions.overall === 'Excellent') conditions.overall = 'Good';
            if (conditions.overall === 'Good') conditions.overall = 'Fair';
        }
        
        return conditions;
    }
    
    // Format time for display
    formatTime(timeString) {
        const date = new Date(timeString);
        return date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    }
    
    // Format date for display
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
    
    // Clear cache
    clearCache() {
        this.cache.clear();
        console.log('🌤️ Open-Meteo cache cleared');
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
    module.exports = OpenMeteoIntegration;
} else {
    window.OpenMeteoIntegration = OpenMeteoIntegration;
}
