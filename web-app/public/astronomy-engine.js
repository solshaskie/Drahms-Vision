// 🌌 Astronomy Engine for Drahms Vision
// Calculates astronomical positions and celestial object data

class AstronomyEngine {
    constructor() {
        this.observerLocation = { lat: 40.7128, lng: -74.0060, alt: 0 }; // Default: NYC
        this.currentTime = new Date();

        // Celestial object data (simplified)
        this.celestialObjects = [
            {
                id: 'sun',
                name: 'Sun',
                type: 'star',
                ra: 0, dec: 0, // Will be calculated
                magnitude: -26.74,
                visible: false,
                constellation: 'N/A'
            },
            {
                id: 'moon',
                name: 'Moon',
                type: 'satellite',
                ra: 0, dec: 0,
                magnitude: -12.6,
                visible: false,
                constellation: 'N/A'
            },
            {
                id: 'mercury',
                name: 'Mercury',
                type: 'planet',
                ra: 0, dec: 0,
                magnitude: -1.9,
                visible: false
            },
            {
                id: 'venus',
                name: 'Venus',
                type: 'planet',
                ra: 0, dec: 0,
                magnitude: -4.6,
                visible: false
            },
            {
                id: 'mars',
                name: 'Mars',
                type: 'planet',
                ra: 0, dec: 0,
                magnitude: -1.8,
                visible: false
            },
            {
                id: 'jupiter',
                name: 'Jupiter',
                type: 'planet',
                ra: 0, dec: 0,
                magnitude: -2.0,
                visible: false
            },
            {
                id: 'saturn',
                name: 'Saturn',
                type: 'planet',
                ra: 0, dec: 0,
                magnitude: 0.4,
                visible: false
            },
            {
                id: 'polaris',
                name: 'Polaris',
                type: 'star',
                ra: 2.530195, dec: 89.2641,
                magnitude: 1.97,
                visible: true
            },
            {
                id: 'sirius',
                name: 'Sirius',
                type: 'star',
                ra: 6.752477, dec: -16.7161,
                magnitude: -1.46,
                visible: false
            },
            {
                id: 'vega',
                name: 'Vega',
                type: 'star',
                ra: 18.61565, dec: 38.7837,
                magnitude: 0.03,
                visible: false
            }
        ];

        this.constellations = [
            { id: 'ursa_major', name: 'Ursa Major', visible: false },
            { id: 'ursa_minor', name: 'Ursa Minor', visible: false },
            { id: 'orion', name: 'Orion', visible: false },
            { id: 'ursa_minor', name: 'Cassiopeia', visible: false }
        ];

        this.initialize();
        console.log('🌌 Astronomy Engine initialized');
    }

    initialize() {
        this.updateTime();
        this.calculateObjectPositions();
        this.updateVisibility();
    }

    // Set observer location
    setObserverLocation(lat, lng, alt = 0) {
        this.observerLocation = { lat, lng, alt };
        this.updateVisibility();
        console.log(`📍 Set observer location: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
    }

    // Update current time
    updateTime() {
        this.currentTime = new Date();

        // Update object positions every time update
        this.calculateObjectPositions();
        this.updateVisibility();
    }

    // Calculate celestial object positions (simplified)
    calculateObjectPositions() {
        const now = this.currentTime;
        const jd = this.julianDate(now);
        const lst = this.localSiderealTime(jd, this.observerLocation.lng);

        this.celestialObjects.forEach(obj => {
            if (obj.id === 'sun') {
                // Simplified solar position calculation
                const n = jd - 2451545.0;
                const L = (280.460 + 0.9856474 * n) % 360;
                const g = (357.528 + 0.9856003 * n) % 360;
                const lambda = L + 1.915 * Math.sin(g * Math.PI / 180) + 0.020 * Math.sin(2 * g * Math.PI / 180);

                obj.ra = lambda;
                obj.dec = Math.asin(Math.sin(lambda * Math.PI / 180) * Math.sin(23.4397 * Math.PI / 180)) * 180 / Math.PI;
            } else if (obj.id === 'moon') {
                // Simplified lunar position calculation
                const phase = (jd - 2451549.5) / 29.530588;
                obj.ra = (lst + phase * 360) % 360;
                obj.dec = 5.14 * Math.sin(phase * 2 * Math.PI);
            }
            // Other objects would have more complex calculations
        });
    }

    // Calculate Julian Date
    julianDate(date) {
        const a = Math.floor((14 - date.getMonth() - 1) / 12);
        const y = date.getFullYear() + 4800 - a;
        const m = (date.getMonth() + 1) + 12 * a - 3;

        return date.getDate() + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
    }

    // Calculate Local Sidereal Time
    localSiderealTime(jd, longitude) {
        const T = (jd - 2451545.0) / 36525.0;
        const theta0 = (280.46061837 + 360.98564736629 * (jd - 2451545.0) +
                       T * T * (0.0003875 * T - 0.0000000258) + 0.0000258 * T) % 360;

        return (theta0 + longitude) % 360;
    }

    // Calculate altitude and azimuth for object
    getAltAz(obj) {
        const lat = this.observerLocation.lat * Math.PI / 180;
        const lng = this.observerLocation.lng * Math.PI / 180;
        const ra = obj.ra * Math.PI / 180;
        const dec = obj.dec * Math.PI / 180;

        const lst = this.localSiderealTime(this.julianDate(this.currentTime), this.observerLocation.lng) * Math.PI / 180;

        const HA = lst - ra;

        const alt = Math.asin(Math.sin(dec) * Math.sin(lat) + Math.cos(dec) * Math.cos(lat) * Math.cos(HA));
        const az = Math.atan2(-Math.sin(HA), Math.cos(HA) * Math.sin(lat) - Math.tan(dec) * Math.cos(lat));

        return {
            altitude: alt * 180 / Math.PI,
            azimuth: az * 180 / Math.PI
        };
    }

    // Update object visibility based on location and time
    updateVisibility() {
        const now = new Date();
        const hour = now.getHours();

        // Check if it's dark enough for astronomical observations
        const isDaylight = hour > 6 && hour < 20;
        const isVisibleTime = !isDaylight;

        this.celestialObjects.forEach(obj => {
            const altAz = this.getAltAz(obj);

            // Object is visible if above horizon and it's dark
            obj.altitude = altAz.altitude;
            obj.azimuth = altAz.azimuth;
            obj.visible = (altAz.altitude > 0 && isVisibleTime) || ['sun', 'moon', 'venus', 'jupiter', 'mars', 'saturn'].includes(obj.id);

            // Special cases
            if (obj.id === 'sun') {
                obj.visible = isDaylight && altAz.altitude > 0;
            }
            if (obj.id === 'moon') {
                obj.visible = altAz.altitude > -0.83; // Moon is visible when not completely below horizon
            }
        });
    }

    // Get all visible objects
    getVisibleObjects() {
        return this.celestialObjects.filter(obj => obj.visible);
    }

    // Search objects by name
    searchObjects(searchTerm) {
        const term = searchTerm.toLowerCase();
        return this.celestialObjects.filter(obj =>
            obj.name.toLowerCase().includes(term) ||
            obj.type.toLowerCase().includes(term)
        );
    }

    // Get object by ID
    getObjectById(id) {
        return this.celestialObjects.find(obj => obj.id === id);
    }

    // Calculate moon phase
    getMoonPhase() {
        const now = new Date();
        const reference = new Date('2000-01-06T18:14:00'); // Known new moon

        const elapsed = now.getTime() - reference.getTime();
        const days = elapsed / (1000 * 60 * 60 * 24);

        // Lunar cycle is 29.53 days
        const phase = (days % 29.53) / 29.53;

        let phaseName = 'New Moon';
        if (phase < 0.25) phaseName = 'Waxing Crescent';
        else if (phase < 0.375) phaseName = 'First Quarter';
        else if (phase < 0.625) phaseName = 'Waxing Gibbous';
        else if (phase < 0.75) phaseName = 'Full Moon';
        else if (phase < 0.875) phaseName = 'Waning Gibbous';
        else phaseName = 'Last Quarter';

        return {
            phase: phase,
            name: phaseName,
            illumination: Math.abs(Math.sin(phase * 2 * Math.PI)) * 100
        };
    }

    // Get weather impact on visibility
    getWeatherImpact(weatherConditions) {
        // In a real implementation, this would calculate how weather affects astronomical visibility
        if (!weatherConditions) return 1.0;

        let impact = 1.0;

        if (weatherConditions.clouds > 50) impact *= 0.5; // Clouds reduce visibility
        if (weatherConditions.precipitation > 0) impact *= 0.3; // Precipitation reduces visibility significantly
        if (weatherConditions.humidity > 80) impact *= 0.8; // High humidity reduces visibility

        return impact;
    }

    // Get optimal observation time for object
    getOptimalObservationTime(objId) {
        const obj = this.getObjectById(objId);
        if (!obj) return null;

        // Calculate when object will be at optimal altitude
        const altAz = this.getAltAz(obj);
        const optimalAzimuth = 180; // Due south for northern hemisphere

        const timeToOptimal = ((optimalAzimuth - altAz.azimuth) / 15) * 60; // Minutes

        return {
            currentAltitude: altAz.altitude,
            currentAzimuth: altAz.azimuth,
            optimalAltitude: 45, // Assume 45 degrees is optimal
            minutesToOptimal: timeToOptimal,
            optimalTime: new Date(this.currentTime.getTime() + timeToOptimal * 60000)
        };
    }

    // Get all objects suitable for observation
    getObjectsForObservation() {
        return this.celestialObjects.filter(obj => {
            const altAz = this.getAltAz(obj);
            return obj.visible && altAz.altitude > 15; // At least 15 degrees above horizon
        });
    }

    // Calculate constellation boundaries (simplified)
    getConstellationBoundaries(constellationId) {
        // In a real implementation, this would contain the actual constellation boundaries
        const boundaries = {
            ursa_major: [
                [8.5, 50], [8.5, 70], [14, 70], [14, 50]
            ],
            orion: [
                [4.5, -10], [4.5, 15], [6.5, 15], [6.5, -10]
            ]
        };

        return boundaries[constellationId] || [];
    }

    // Get meteor shower information
    getMeteorShowers() {
        const now = new Date();
        const meteorShowers = [
            { name: 'Leonids', peak: 'November 17-18', active: false },
            { name: 'Geminids', peak: 'December 13-14', active: false },
            { name: 'Quadrantids', peak: 'January 3-4', active: false },
            { name: 'Perseids', peak: 'August 12-13', active: false },
            { name: 'Orionids', peak: 'October 21-22', active: false }
        ];

        // Mark active showers
        meteorShowers.forEach(shower => {
            if (shower.peak.includes(now.toLocaleString('default', { month: 'long' }))) {
                shower.active = true;
            }
        });

        return meteorShowers.filter(shower => shower.active);
    }
}

// Simplified AR Overlay System
class AROverlaySystem {
    constructor() {
        this.active = false;
        this.showConstellations = true;
        this.showStars = true;
        this.showPlanets = true;
        this.showLabels = true;
        this.astronomyEngine = null;
        this.observerLocation = null;

        console.log('🌟 AR Overlay System created');
    }

    initialize(astronomyEngine) {
        this.astronomyEngine = astronomyEngine;
    }

    start() {
        if (!this.astronomyEngine) {
            console.error('❌ Astronomy Engine not initialized');
            return false;
        }

        this.active = true;
        this.updateOverlay();
        console.log('🌟 AR Overlay activated');
        return true;
    }

    stop() {
        this.active = false;
        console.log('🌟 AR Overlay deactivated');
    }

    updateOverlay() {
        if (!this.active || !this.astronomyEngine) return;

        // In a real implementation, this would render the AR overlay
        // For now, just log the visible objects
        const visibleObjects = this.astronomyEngine.getVisibleObjects();
        console.log(`🌟 AR Overlay updating: ${visibleObjects.length} visible objects`);
    }

    setObserverLocation(lat, lng, alt) {
        this.observerLocation = { lat, lng, alt };
        if (this.astronomyEngine) {
            this.astronomyEngine.setObserverLocation(lat, lng, alt);
            this.updateOverlay();
        }
    }

    toggleConstellations() {
        this.showConstellations = !this.showConstellations;
        this.updateOverlay();
        return this.showConstellations;
    }

    toggleStars() {
        this.showStars = !this.showStars;
        this.updateOverlay();
        return this.showStars;
    }

    togglePlanets() {
        this.showPlanets = !this.showPlanets;
        this.updateOverlay();
        return this.showPlanets;
    }

    toggleLabels() {
        this.showLabels = !this.showLabels;
        this.updateOverlay();
        return this.showLabels;
    }

    highlightObject(objectName) {
        console.log(`🎯 Highlighting object: ${objectName}`);
        // In a real implementation, this would highlight the object in the AR view
    }
}

// Make available globally
window.AstronomyEngine = AstronomyEngine;
window.AROverlaySystem = AROverlaySystem;
