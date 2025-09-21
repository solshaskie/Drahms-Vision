// 🌟 Android AR Constellation Overlay System
// Real-time celestial object overlay for Samsung A25 camera view

class AndroidAROverlay {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.astronomyEngine = null;
        this.isActive = false;
        this.deviceOrientation = { alpha: 0, beta: 0, gamma: 0 };
        this.observerLocation = { latitude: 0, longitude: 0, altitude: 0 };
        this.cameraFOV = 60; // degrees
        this.screenWidth = 0;
        this.screenHeight = 0;
        
        // Overlay settings
        this.showConstellations = true;
        this.showStars = true;
        this.showPlanets = true;
        this.showLabels = true;
        this.showGrid = false;
        this.showCompass = true;
        
        // Celestial objects cache
        this.visibleObjects = [];
        this.constellationLines = [];
        this.lastUpdateTime = 0;
        this.updateInterval = 100; // ms
        
        // Samsung A25 specific optimizations
        this.samsungA25Optimized = true;
        this.highResolutionMode = true;
        
        this.init();
    }
    
    init() {
        console.log('🌟 Initializing Android AR Overlay System');
        this.createOverlayCanvas();
        this.setupEventListeners();
        this.startUpdateLoop();
    }
    
    createOverlayCanvas() {
        // Create overlay canvas that will be positioned over the camera feed
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'android-ar-overlay';
        this.canvas.style.position = 'absolute';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.canvas.style.pointerEvents = 'none';
        this.canvas.style.zIndex = '1000';
        this.canvas.style.opacity = '0.9';
        
        this.ctx = this.canvas.getContext('2d');
        
        // Add to camera feed container
        const cameraFeed = document.getElementById('camera-feed');
        if (cameraFeed) {
            cameraFeed.style.position = 'relative';
            cameraFeed.appendChild(this.canvas);
        }
        
        this.resizeCanvas();
    }
    
    resizeCanvas() {
        const cameraFeed = document.getElementById('camera-feed');
        if (cameraFeed) {
            const rect = cameraFeed.getBoundingClientRect();
            this.screenWidth = rect.width;
            this.screenHeight = rect.height;
            
            this.canvas.width = this.screenWidth;
            this.canvas.height = this.screenHeight;
            
            console.log(`📱 Canvas resized: ${this.screenWidth}x${this.screenHeight}`);
        }
    }
    
    setupEventListeners() {
        // Listen for device orientation updates from Android app
        window.addEventListener('deviceorientation', (event) => {
            this.updateDeviceOrientation(event.alpha, event.beta, event.gamma);
        });
        
        // Listen for location updates
        window.addEventListener('locationupdate', (event) => {
            this.updateObserverLocation(event.detail.latitude, event.detail.longitude, event.detail.altitude);
        });
        
        // Listen for window resize
        window.addEventListener('resize', () => {
            this.resizeCanvas();
        });
        
        // Listen for WebSocket sensor data
        if (window.app && window.app.socket) {
            window.app.socket.on('sensor_data', (data) => {
                this.handleSensorData(data);
            });
        }
    }
    
    handleSensorData(data) {
        if (data.type === 'orientation_data') {
            this.updateDeviceOrientation(data.azimuth, data.pitch, data.roll);
        } else if (data.type === 'location_update') {
            this.updateObserverLocation(data.latitude, data.longitude, data.altitude);
        }
    }
    
    updateDeviceOrientation(azimuth, pitch, roll) {
        this.deviceOrientation = {
            alpha: azimuth,
            beta: pitch,
            gamma: roll
        };
        
        // Trigger redraw
        this.requestUpdate();
    }
    
    updateObserverLocation(latitude, longitude, altitude = 0) {
        this.observerLocation = {
            latitude: latitude,
            longitude: longitude,
            altitude: altitude
        };
        
        // Update astronomy engine if available
        if (this.astronomyEngine) {
            this.astronomyEngine.setObserverLocation(latitude, longitude, altitude);
        }
        
        console.log(`📍 Location updated: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
    }
    
    setAstronomyEngine(engine) {
        this.astronomyEngine = engine;
        console.log('🌟 Astronomy engine connected to AR overlay');
    }
    
    start() {
        this.isActive = true;
        this.canvas.style.display = 'block';
        console.log('🌟 AR Overlay started');
    }
    
    stop() {
        this.isActive = false;
        this.canvas.style.display = 'none';
        this.clearCanvas();
        console.log('🌟 AR Overlay stopped');
    }
    
    startUpdateLoop() {
        const update = () => {
            if (this.isActive) {
                this.update();
            }
            requestAnimationFrame(update);
        };
        requestAnimationFrame(update);
    }
    
    update() {
        const now = Date.now();
        if (now - this.lastUpdateTime < this.updateInterval) {
            return;
        }
        
        this.lastUpdateTime = now;
        
        if (this.astronomyEngine) {
            // Get visible celestial objects
            this.visibleObjects = this.astronomyEngine.getVisibleObjects(
                this.cameraFOV,
                this.screenWidth,
                this.screenHeight,
                this.deviceOrientation
            );
            
            // Get constellation lines
            if (this.showConstellations) {
                this.constellationLines = this.astronomyEngine.getVisibleConstellationLines(
                    this.cameraFOV,
                    this.screenWidth,
                    this.screenHeight,
                    this.deviceOrientation
                );
            }
        }
        
        this.drawOverlay();
    }
    
    drawOverlay() {
        this.clearCanvas();
        
        if (!this.isActive) return;
        
        // Draw constellation lines
        if (this.showConstellations && this.constellationLines.length > 0) {
            this.drawConstellationLines();
        }
        
        // Draw stars
        if (this.showStars) {
            this.drawStars();
        }
        
        // Draw planets
        if (this.showPlanets) {
            this.drawPlanets();
        }
        
        // Draw labels
        if (this.showLabels) {
            this.drawLabels();
        }
        
        // Draw compass
        if (this.showCompass) {
            this.drawCompass();
        }
        
        // Draw grid
        if (this.showGrid) {
            this.drawGrid();
        }
    }
    
    drawConstellationLines() {
        this.ctx.strokeStyle = '#00ffff';
        this.ctx.lineWidth = 1;
        this.ctx.globalAlpha = 0.7;
        
        this.constellationLines.forEach(line => {
            this.ctx.beginPath();
            this.ctx.moveTo(line.start.x, line.start.y);
            this.ctx.lineTo(line.end.x, line.end.y);
            this.ctx.stroke();
        });
        
        this.ctx.globalAlpha = 1.0;
    }
    
    drawStars() {
        this.visibleObjects.filter(obj => obj.type === 'star').forEach(star => {
            const size = this.getStarSize(star.magnitude);
            const color = this.getStarColor(star.temperature);
            
            this.ctx.fillStyle = color;
            this.ctx.globalAlpha = this.getStarOpacity(star.magnitude);
            
            this.ctx.beginPath();
            this.ctx.arc(star.screenX, star.screenY, size, 0, 2 * Math.PI);
            this.ctx.fill();
            
            // Add twinkle effect
            if (Math.random() < 0.1) {
                this.ctx.fillStyle = '#ffffff';
                this.ctx.globalAlpha = 0.8;
                this.ctx.beginPath();
                this.ctx.arc(star.screenX, star.screenY, size * 0.5, 0, 2 * Math.PI);
                this.ctx.fill();
            }
        });
        
        this.ctx.globalAlpha = 1.0;
    }
    
    drawPlanets() {
        this.visibleObjects.filter(obj => obj.type === 'planet').forEach(planet => {
            const size = this.getPlanetSize(planet.name);
            const color = this.getPlanetColor(planet.name);
            
            this.ctx.fillStyle = color;
            this.ctx.globalAlpha = 0.9;
            
            this.ctx.beginPath();
            this.ctx.arc(planet.screenX, planet.screenY, size, 0, 2 * Math.PI);
            this.ctx.fill();
            
            // Add glow effect for planets
            this.ctx.shadowColor = color;
            this.ctx.shadowBlur = 10;
            this.ctx.beginPath();
            this.ctx.arc(planet.screenX, planet.screenY, size * 0.7, 0, 2 * Math.PI);
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
        });
        
        this.ctx.globalAlpha = 1.0;
    }
    
    drawLabels() {
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.globalAlpha = 0.8;
        
        this.visibleObjects.forEach(obj => {
            if (obj.magnitude < 3.0) { // Only label bright objects
                this.ctx.fillText(obj.name, obj.screenX, obj.screenY - 15);
            }
        });
        
        this.ctx.globalAlpha = 1.0;
    }
    
    drawCompass() {
        const centerX = 50;
        const centerY = 50;
        const radius = 30;
        
        // Draw compass circle
        this.ctx.strokeStyle = '#00ffff';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        this.ctx.stroke();
        
        // Draw north indicator
        const northAngle = -this.deviceOrientation.alpha * Math.PI / 180;
        const northX = centerX + Math.sin(northAngle) * (radius - 5);
        const northY = centerY - Math.cos(northAngle) * (radius - 5);
        
        this.ctx.fillStyle = '#ff0000';
        this.ctx.beginPath();
        this.ctx.arc(northX, northY, 3, 0, 2 * Math.PI);
        this.ctx.fill();
        
        // Draw N label
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '10px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('N', centerX, centerY - radius - 5);
    }
    
    drawGrid() {
        this.ctx.strokeStyle = '#444444';
        this.ctx.lineWidth = 1;
        this.ctx.globalAlpha = 0.3;
        
        // Draw horizontal lines
        for (let i = 0; i < this.screenHeight; i += 50) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, i);
            this.ctx.lineTo(this.screenWidth, i);
            this.ctx.stroke();
        }
        
        // Draw vertical lines
        for (let i = 0; i < this.screenWidth; i += 50) {
            this.ctx.beginPath();
            this.ctx.moveTo(i, 0);
            this.ctx.lineTo(i, this.screenHeight);
            this.ctx.stroke();
        }
        
        this.ctx.globalAlpha = 1.0;
    }
    
    getStarSize(magnitude) {
        // Convert magnitude to size (brighter = larger)
        const maxSize = 4;
        const minSize = 1;
        const normalizedMagnitude = Math.max(0, Math.min(6, magnitude));
        return maxSize - (normalizedMagnitude / 6) * (maxSize - minSize);
    }
    
    getStarColor(temperature) {
        if (temperature > 10000) return '#9bb5ff'; // Blue
        if (temperature > 7500) return '#aabfff'; // Blue-white
        if (temperature > 6000) return '#cad7ff'; // White
        if (temperature > 5000) return '#ffd2a1'; // Yellow-white
        if (temperature > 3500) return '#ffa500'; // Orange
        return '#ff4500'; // Red
    }
    
    getStarOpacity(magnitude) {
        // Brighter stars are more opaque
        const maxOpacity = 1.0;
        const minOpacity = 0.3;
        const normalizedMagnitude = Math.max(0, Math.min(6, magnitude));
        return maxOpacity - (normalizedMagnitude / 6) * (maxOpacity - minOpacity);
    }
    
    getPlanetSize(planetName) {
        const sizes = {
            'Mercury': 2,
            'Venus': 4,
            'Mars': 3,
            'Jupiter': 6,
            'Saturn': 5,
            'Uranus': 3,
            'Neptune': 3
        };
        return sizes[planetName] || 3;
    }
    
    getPlanetColor(planetName) {
        const colors = {
            'Mercury': '#8c7853',
            'Venus': '#ffc649',
            'Mars': '#cd5c5c',
            'Jupiter': '#ffa500',
            'Saturn': '#fad5a5',
            'Uranus': '#4fd0e7',
            'Neptune': '#4b70dd'
        };
        return colors[planetName] || '#ffffff';
    }
    
    clearCanvas() {
        this.ctx.clearRect(0, 0, this.screenWidth, this.screenHeight);
    }
    
    // Control methods
    toggleConstellations() {
        this.showConstellations = !this.showConstellations;
        console.log(`🌟 Constellations: ${this.showConstellations ? 'ON' : 'OFF'}`);
    }
    
    toggleStars() {
        this.showStars = !this.showStars;
        console.log(`🌟 Stars: ${this.showStars ? 'ON' : 'OFF'}`);
    }
    
    togglePlanets() {
        this.showPlanets = !this.showPlanets;
        console.log(`🌟 Planets: ${this.showPlanets ? 'ON' : 'OFF'}`);
    }
    
    toggleLabels() {
        this.showLabels = !this.showLabels;
        console.log(`🌟 Labels: ${this.showLabels ? 'ON' : 'OFF'}`);
    }
    
    toggleGrid() {
        this.showGrid = !this.showGrid;
        console.log(`🌟 Grid: ${this.showGrid ? 'ON' : 'OFF'}`);
    }
    
    toggleCompass() {
        this.showCompass = !this.showCompass;
        console.log(`🌟 Compass: ${this.showCompass ? 'ON' : 'OFF'}`);
    }
    
    setCameraFOV(fov) {
        this.cameraFOV = fov;
        console.log(`🌟 Camera FOV set to: ${fov}°`);
    }
    
    highlightObject(objectName) {
        // Highlight a specific celestial object
        const object = this.visibleObjects.find(obj => obj.name === objectName);
        if (object) {
            this.ctx.strokeStyle = '#ffff00';
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.arc(object.screenX, object.screenY, 20, 0, 2 * Math.PI);
            this.ctx.stroke();
        }
    }
    
    requestUpdate() {
        // Request immediate update
        this.lastUpdateTime = 0;
    }
    
    // Samsung A25 specific optimizations
    enableHighResolutionMode() {
        this.highResolutionMode = true;
        this.updateInterval = 50; // Faster updates for high-res mode
        console.log('🌟 High resolution mode enabled');
    }
    
    disableHighResolutionMode() {
        this.highResolutionMode = false;
        this.updateInterval = 100;
        console.log('🌟 High resolution mode disabled');
    }
    
    getOverlayStats() {
        return {
            isActive: this.isActive,
            visibleObjects: this.visibleObjects.length,
            constellationLines: this.constellationLines.length,
            deviceOrientation: this.deviceOrientation,
            observerLocation: this.observerLocation,
            cameraFOV: this.cameraFOV,
            screenSize: { width: this.screenWidth, height: this.screenHeight }
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AndroidAROverlay;
} else {
    window.AndroidAROverlay = AndroidAROverlay;
}
