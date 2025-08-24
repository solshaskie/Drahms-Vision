// Drahms Vision - Sky Mapping Module
// Handles astronomical object identification and sky mapping

class SkyMapController {
    constructor() {
        this.currentLocation = null;
        this.currentTime = new Date();
        this.visibleObjects = [];
        this.selectedObject = null;
        
        this.init();
    }
    
    init() {
        console.log('⭐ Initializing Sky Map Controller...');
        this.setupSkyMap();
        this.loadAstronomicalData();
    }
    
    setupSkyMap() {
        const skyMap = document.getElementById('sky-map');
        if (skyMap) {
            // Create interactive sky map canvas
            this.createSkyMapCanvas(skyMap);
        }
    }
    
    createSkyMapCanvas(container) {
        // Create canvas for sky map visualization
        const canvas = document.createElement('canvas');
        canvas.id = 'sky-map-canvas';
        canvas.width = 400;
        canvas.height = 400;
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        
        container.appendChild(canvas);
        
        // Initialize canvas context
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        // Add click event for object selection
        canvas.addEventListener('click', (e) => {
            this.handleMapClick(e);
        });
    }
    
    loadAstronomicalData() {
        // Load astronomical data from API
        this.fetchConstellations();
        this.fetchStars();
        this.fetchPlanets();
    }
    
    async fetchConstellations() {
        try {
            const response = await fetch('/api/sky/constellations');
            const constellations = await response.json();
            this.constellations = constellations;
            this.updateSkyMap();
        } catch (error) {
            console.error('Error fetching constellations:', error);
        }
    }
    
    async fetchStars() {
        try {
            const response = await fetch('/api/stars');
            const stars = await response.json();
            this.stars = stars;
            this.updateSkyMap();
        } catch (error) {
            console.error('Error fetching stars:', error);
        }
    }
    
    async fetchPlanets() {
        try {
            const response = await fetch('/api/planets');
            const planets = await response.json();
            this.planets = planets;
            this.updateSkyMap();
        } catch (error) {
            console.error('Error fetching planets:', error);
        }
    }
    
    updateSkyMap() {
        if (!this.ctx) return;
        
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw sky background
        this.drawSkyBackground();
        
        // Draw astronomical objects
        this.drawConstellations();
        this.drawStars();
        this.drawPlanets();
        
        // Draw selected object highlight
        if (this.selectedObject) {
            this.drawObjectHighlight(this.selectedObject);
        }
    }
    
    drawSkyBackground() {
        // Create gradient for night sky
        const gradient = this.ctx.createRadialGradient(200, 200, 0, 200, 200, 200);
        gradient.addColorStop(0, '#0a0a2a');
        gradient.addColorStop(0.5, '#1a1a3a');
        gradient.addColorStop(1, '#2a2a4a');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    drawConstellations() {
        if (!this.constellations) return;
        
        this.ctx.strokeStyle = '#444';
        this.ctx.lineWidth = 1;
        
        this.constellations.forEach(constellation => {
            if (constellation.visible) {
                // Draw constellation lines (simplified)
                this.ctx.beginPath();
                this.ctx.moveTo(100, 100);
                this.ctx.lineTo(150, 120);
                this.ctx.stroke();
            }
        });
    }
    
    drawStars() {
        if (!this.stars) return;
        
        this.stars.forEach(star => {
            if (star.visible) {
                this.drawStar(star);
            }
        });
    }
    
    drawStar(star) {
        const x = Math.random() * this.canvas.width;
        const y = Math.random() * this.canvas.height;
        const size = Math.max(1, (2.5 - star.magnitude) * 2);
        
        this.ctx.fillStyle = '#fff';
        this.ctx.beginPath();
        this.ctx.arc(x, y, size, 0, 2 * Math.PI);
        this.ctx.fill();
        
        // Store star position for click detection
        star.x = x;
        star.y = y;
    }
    
    drawPlanets() {
        if (!this.planets) return;
        
        this.planets.forEach(planet => {
            if (planet.visible) {
                this.drawPlanet(planet);
            }
        });
    }
    
    drawPlanet(planet) {
        const x = Math.random() * this.canvas.width;
        const y = Math.random() * this.canvas.height;
        const size = Math.max(3, (2.5 - planet.magnitude) * 3);
        
        this.ctx.fillStyle = '#ffd700';
        this.ctx.beginPath();
        this.ctx.arc(x, y, size, 0, 2 * Math.PI);
        this.ctx.fill();
        
        // Store planet position for click detection
        planet.x = x;
        planet.y = y;
    }
    
    drawObjectHighlight(object) {
        const x = object.x || 0;
        const y = object.y || 0;
        
        this.ctx.strokeStyle = '#00ff00';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(x, y, 15, 0, 2 * Math.PI);
        this.ctx.stroke();
    }
    
    handleMapClick(event) {
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        // Check if click is near any object
        const clickedObject = this.findObjectAtPosition(x, y);
        
        if (clickedObject) {
            this.selectedObject = clickedObject;
            this.showObjectInfo(clickedObject);
            this.updateSkyMap();
        }
    }
    
    findObjectAtPosition(x, y) {
        const threshold = 10;
        
        // Check stars
        if (this.stars) {
            for (const star of this.stars) {
                if (star.x && star.y) {
                    const distance = Math.sqrt((x - star.x) ** 2 + (y - star.y) ** 2);
                    if (distance < threshold) {
                        return star;
                    }
                }
            }
        }
        
        // Check planets
        if (this.planets) {
            for (const planet of this.planets) {
                if (planet.x && planet.y) {
                    const distance = Math.sqrt((x - planet.x) ** 2 + (y - planet.y) ** 2);
                    if (distance < threshold) {
                        return planet;
                    }
                }
            }
        }
        
        return null;
    }
    
    showObjectInfo(object) {
        console.log('Selected object:', object);
        
        // Create info popup
        const info = document.createElement('div');
        info.className = 'object-info';
        info.innerHTML = `
            <h3>${object.name}</h3>
            <p>Type: ${object.type || 'Unknown'}</p>
            <p>Magnitude: ${object.magnitude || 'N/A'}</p>
            <p>Visible: ${object.visible ? 'Yes' : 'No'}</p>
        `;
        
        // Remove existing info
        const existingInfo = document.querySelector('.object-info');
        if (existingInfo) {
            existingInfo.remove();
        }
        
        // Add new info
        document.body.appendChild(info);
        
        // Remove after 5 seconds
        setTimeout(() => {
            info.remove();
        }, 5000);
    }
    
    updateLocation(latitude, longitude) {
        this.currentLocation = { latitude, longitude };
        this.updateSkyMap();
    }
    
    updateTime(time) {
        this.currentTime = time;
        this.updateSkyMap();
    }
}

// Initialize sky map controller when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.skyMapController = new SkyMapController();
});
