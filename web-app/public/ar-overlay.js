// 🌌 Drahms Vision - AR Overlay System
// Real-time celestial object overlay for camera view

class AROverlaySystem {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.astronomyEngine = null;
        this.isActive = false;
        this.overlayData = null;
        this.deviceOrientation = null;
        this.animationFrame = null;
        
        this.overlaySettings = {
            showStars: true,
            showConstellations: true,
            showPlanets: true,
            showLabels: true,
            showGrid: false,
            starSize: 2,
            lineWidth: 1,
            labelSize: 12,
            opacity: 0.8
        };
        
        this.colors = {
            star: '#FFFFFF',
            planet: '#FFD700',
            constellation: '#00BFFF',
            label: '#FFFFFF',
            grid: '#333333',
            background: 'rgba(0, 0, 0, 0.3)'
        };
    }
    
    // Initialize the overlay system
    initialize(astronomyEngine) {
        this.astronomyEngine = astronomyEngine;
        this.createOverlayCanvas();
        this.setupEventListeners();
        console.log('🌌 AR Overlay System initialized');
    }
    
    // Create overlay canvas
    createOverlayCanvas() {
        // Create canvas element
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'celestial-overlay';
        this.canvas.style.position = 'absolute';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.canvas.style.pointerEvents = 'none';
        this.canvas.style.zIndex = '1000';
        this.canvas.style.opacity = this.overlaySettings.opacity;
        
        // Get camera feed container
        const cameraFeed = document.getElementById('camera-feed');
        if (cameraFeed) {
            cameraFeed.style.position = 'relative';
            cameraFeed.appendChild(this.canvas);
        }
        
        // Get 2D context
        this.ctx = this.canvas.getContext('2d');
        
        // Set canvas size
        this.resizeCanvas();
        
        // Add resize listener
        window.addEventListener('resize', () => this.resizeCanvas());
    }
    
    // Resize canvas to match camera feed
    resizeCanvas() {
        const cameraFeed = document.getElementById('camera-feed');
        if (cameraFeed && this.canvas) {
            const rect = cameraFeed.getBoundingClientRect();
            this.canvas.width = rect.width;
            this.canvas.height = rect.height;
        }
    }
    
    // Setup event listeners
    setupEventListeners() {
        // Device orientation events
        if (window.DeviceOrientationEvent) {
            window.addEventListener('deviceorientation', (event) => {
                this.deviceOrientation = {
                    alpha: event.alpha, // Z-axis rotation
                    beta: event.beta,   // X-axis rotation
                    gamma: event.gamma  // Y-axis rotation
                };
            });
        }
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (event) => {
            switch(event.key) {
                case 'c':
                    this.toggleConstellations();
                    break;
                case 's':
                    this.toggleStars();
                    break;
                case 'p':
                    this.togglePlanets();
                    break;
                case 'l':
                    this.toggleLabels();
                    break;
                case 'g':
                    this.toggleGrid();
                    break;
            }
        });
    }
    
    // Start the overlay
    start() {
        if (!this.isActive) {
            this.isActive = true;
            this.updateOverlay();
            console.log('🌌 AR Overlay started');
        }
    }
    
    // Stop the overlay
    stop() {
        if (this.isActive) {
            this.isActive = false;
            if (this.animationFrame) {
                cancelAnimationFrame(this.animationFrame);
            }
            this.clearCanvas();
            console.log('🌌 AR Overlay stopped');
        }
    }
    
    // Update overlay data and render
    updateOverlay() {
        if (!this.isActive || !this.astronomyEngine) return;
        
        // Get current sky data
        this.overlayData = this.astronomyEngine.getSkyInfo();
        
        // Render overlay
        this.renderOverlay();
        
        // Schedule next update
        this.animationFrame = requestAnimationFrame(() => this.updateOverlay());
    }
    
    // Render the overlay
    renderOverlay() {
        if (!this.ctx || !this.overlayData) return;
        
        // Clear canvas
        this.clearCanvas();
        
        // Render grid if enabled
        if (this.overlaySettings.showGrid) {
            this.renderGrid();
        }
        
        // Render constellations if enabled
        if (this.overlaySettings.showConstellations) {
            this.renderConstellations();
        }
        
        // Render stars if enabled
        if (this.overlaySettings.showStars) {
            this.renderStars();
        }
        
        // Render planets if enabled
        if (this.overlaySettings.showPlanets) {
            this.renderPlanets();
        }
        
        // Render labels if enabled
        if (this.overlaySettings.showLabels) {
            this.renderLabels();
        }
        
        // Render info panel
        this.renderInfoPanel();
    }
    
    // Clear canvas
    clearCanvas() {
        if (this.ctx) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }
    
    // Render grid
    renderGrid() {
        this.ctx.strokeStyle = this.colors.grid;
        this.ctx.lineWidth = 0.5;
        this.ctx.globalAlpha = 0.3;
        
        // Horizontal lines
        for (let i = 0; i <= 10; i++) {
            const y = (i / 10) * this.canvas.height;
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
        
        // Vertical lines
        for (let i = 0; i <= 10; i++) {
            const x = (i / 10) * this.canvas.width;
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
        
        this.ctx.globalAlpha = 1;
    }
    
    // Render constellations
    renderConstellations() {
        if (!this.overlayData.constellations) return;
        
        this.ctx.strokeStyle = this.colors.constellation;
        this.ctx.lineWidth = this.overlaySettings.lineWidth;
        this.ctx.globalAlpha = 0.6;
        
        this.overlayData.constellations.forEach(constellation => {
            // Draw constellation lines
            constellation.lines.forEach(line => {
                const startX = line.start.x * this.canvas.width;
                const startY = line.start.y * this.canvas.height;
                const endX = line.end.x * this.canvas.width;
                const endY = line.end.y * this.canvas.height;
                
                this.ctx.beginPath();
                this.ctx.moveTo(startX, startY);
                this.ctx.lineTo(endX, endY);
                this.ctx.stroke();
            });
        });
        
        this.ctx.globalAlpha = 1;
    }
    
    // Render stars
    renderStars() {
        if (!this.overlayData.visibleObjects) return;
        
        this.overlayData.visibleObjects.forEach(object => {
            if (object.type === 'star' && object.visible) {
                this.renderStar(object);
            }
        });
    }
    
    // Render individual star
    renderStar(star) {
        const x = star.screenPosition.x * this.canvas.width;
        const y = star.screenPosition.y * this.canvas.height;
        
        // Calculate star size based on magnitude
        const size = Math.max(1, this.overlaySettings.starSize * (3 - star.magnitude) / 3);
        
        this.ctx.fillStyle = this.colors.star;
        this.ctx.globalAlpha = Math.max(0.3, 1 - (star.magnitude - 1) / 5);
        
        // Draw star as circle
        this.ctx.beginPath();
        this.ctx.arc(x, y, size, 0, 2 * Math.PI);
        this.ctx.fill();
        
        // Add twinkle effect for bright stars
        if (star.magnitude < 1) {
            this.ctx.strokeStyle = this.colors.star;
            this.ctx.lineWidth = 1;
            this.ctx.globalAlpha = 0.5;
            this.ctx.beginPath();
            this.ctx.arc(x, y, size * 2, 0, 2 * Math.PI);
            this.ctx.stroke();
        }
        
        this.ctx.globalAlpha = 1;
    }
    
    // Render planets
    renderPlanets() {
        if (!this.overlayData.visibleObjects) return;
        
        this.overlayData.visibleObjects.forEach(object => {
            if (object.type === 'planet' && object.visible) {
                this.renderPlanet(object);
            }
        });
    }
    
    // Render individual planet
    renderPlanet(planet) {
        const x = planet.screenPosition.x * this.canvas.width;
        const y = planet.screenPosition.y * this.canvas.height;
        
        // Planets are larger than stars
        const size = Math.max(3, this.overlaySettings.starSize * 2);
        
        this.ctx.fillStyle = this.colors.planet;
        this.ctx.globalAlpha = 0.9;
        
        // Draw planet as circle
        this.ctx.beginPath();
        this.ctx.arc(x, y, size, 0, 2 * Math.PI);
        this.ctx.fill();
        
        // Add glow effect
        this.ctx.strokeStyle = this.colors.planet;
        this.ctx.lineWidth = 2;
        this.ctx.globalAlpha = 0.3;
        this.ctx.beginPath();
        this.ctx.arc(x, y, size * 1.5, 0, 2 * Math.PI);
        this.ctx.stroke();
        
        this.ctx.globalAlpha = 1;
    }
    
    // Render labels
    renderLabels() {
        if (!this.overlayData.visibleObjects) return;
        
        this.ctx.fillStyle = this.colors.label;
        this.ctx.font = `${this.overlaySettings.labelSize}px Arial`;
        this.ctx.globalAlpha = 0.8;
        
        this.overlayData.visibleObjects.forEach(object => {
            if (object.visible && (object.magnitude < 2 || object.type === 'planet')) {
                const x = object.screenPosition.x * this.canvas.width;
                const y = object.screenPosition.y * this.canvas.height;
                
                // Offset label to avoid overlap with object
                const labelX = x + 10;
                const labelY = y - 5;
                
                this.ctx.fillText(object.name, labelX, labelY);
            }
        });
        
        this.ctx.globalAlpha = 1;
    }
    
    // Render info panel
    renderInfoPanel() {
        const panelWidth = 200;
        const panelHeight = 100;
        const margin = 10;
        
        // Background
        this.ctx.fillStyle = this.colors.background;
        this.ctx.fillRect(margin, margin, panelWidth, panelHeight);
        
        // Border
        this.ctx.strokeStyle = this.colors.constellation;
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(margin, margin, panelWidth, panelHeight);
        
        // Text
        this.ctx.fillStyle = this.colors.label;
        this.ctx.font = '12px Arial';
        this.ctx.globalAlpha = 0.9;
        
        const info = [
            `Objects: ${this.overlayData.objectCount}`,
            `Constellations: ${this.overlayData.constellationCount}`,
            `LST: ${this.overlayData.localSiderealTime.toFixed(1)}°`,
            `Time: ${this.overlayData.currentTime.toLocaleTimeString()}`
        ];
        
        info.forEach((line, index) => {
            this.ctx.fillText(line, margin + 5, margin + 20 + (index * 15));
        });
        
        this.ctx.globalAlpha = 1;
    }
    
    // Toggle functions
    toggleConstellations() {
        this.overlaySettings.showConstellations = !this.overlaySettings.showConstellations;
        console.log(`Constellations: ${this.overlaySettings.showConstellations ? 'ON' : 'OFF'}`);
    }
    
    toggleStars() {
        this.overlaySettings.showStars = !this.overlaySettings.showStars;
        console.log(`Stars: ${this.overlaySettings.showStars ? 'ON' : 'OFF'}`);
    }
    
    togglePlanets() {
        this.overlaySettings.showPlanets = !this.overlaySettings.showPlanets;
        console.log(`Planets: ${this.overlaySettings.showPlanets ? 'ON' : 'OFF'}`);
    }
    
    toggleLabels() {
        this.overlaySettings.showLabels = !this.overlaySettings.showLabels;
        console.log(`Labels: ${this.overlaySettings.showLabels ? 'ON' : 'OFF'}`);
    }
    
    toggleGrid() {
        this.overlaySettings.showGrid = !this.overlaySettings.showGrid;
        console.log(`Grid: ${this.overlaySettings.showGrid ? 'ON' : 'OFF'}`);
    }
    
    // Update overlay settings
    updateSettings(settings) {
        Object.assign(this.overlaySettings, settings);
    }
    
    // Get current settings
    getSettings() {
        return { ...this.overlaySettings };
    }
    
    // Set observer location
    setObserverLocation(lat, lng, alt = 0) {
        if (this.astronomyEngine) {
            this.astronomyEngine.setObserverLocation(lat, lng, alt);
        }
    }
    
    // Search for object and highlight it
    highlightObject(objectName) {
        if (!this.astronomyEngine) return;
        
        const guidance = this.astronomyEngine.getObjectGuidance(objectName, this.deviceOrientation);
        if (guidance && guidance.visible) {
            this.renderObjectHighlight(guidance);
        }
    }
    
    // Render object highlight
    renderObjectHighlight(guidance) {
        const x = guidance.screenPosition.x * this.canvas.width;
        const y = guidance.screenPosition.y * this.canvas.height;
        
        // Draw targeting circle
        this.ctx.strokeStyle = '#FF0000';
        this.ctx.lineWidth = 3;
        this.ctx.globalAlpha = 0.8;
        
        this.ctx.beginPath();
        this.ctx.arc(x, y, 20, 0, 2 * Math.PI);
        this.ctx.stroke();
        
        // Draw crosshair
        this.ctx.beginPath();
        this.ctx.moveTo(x - 15, y);
        this.ctx.lineTo(x + 15, y);
        this.ctx.moveTo(x, y - 15);
        this.ctx.lineTo(x, y + 15);
        this.ctx.stroke();
        
        // Draw object name
        this.ctx.fillStyle = '#FF0000';
        this.ctx.font = 'bold 14px Arial';
        this.ctx.fillText(guidance.object, x + 25, y - 5);
        
        this.ctx.globalAlpha = 1;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AROverlaySystem;
} else {
    window.AROverlaySystem = AROverlaySystem;
}
