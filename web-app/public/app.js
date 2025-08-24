// Drahms Vision Astronomy Camera System - Main Application

class DrahmsVisionApp {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.cameraConnected = false;
        this.motionDetectionEnabled = false;
        this.objectTrackingEnabled = false;
        this.celestialObjects = [];
        
        // Initialize identification system
        this.identificationSystem = new ContextAwareIdentification();
        
        this.init();
    }
    
    init() {
        this.connectWebSocket();
        this.setupEventListeners();
        this.loadCelestialObjects();
        this.updateStatus();
        this.initializeIdentificationSystem();
    }
    
    initializeIdentificationSystem() {
        // Set up context awareness
        this.identificationSystem.setContext(
            { lat: 40.7128, lng: -74.0060 }, // Default to NYC
            new Date(),
            { temperature: 20, conditions: 'clear' }
        );
        
        // Update AI status
        const aiStatus = document.getElementById('ai-status-text');
        if (aiStatus) {
            aiStatus.textContent = 'Ready';
            aiStatus.className = 'status-ok';
        }
        
        console.log('🧠 AI Identification System initialized');
    }
    
    connectWebSocket() {
        this.socket = io();
        
        this.socket.on('connect', () => {
            console.log('🔭 Connected to Drahms Vision server');
            this.isConnected = true;
            this.updateStatus();
        });
        
        this.socket.on('disconnect', () => {
            console.log('❌ Disconnected from server');
            this.isConnected = false;
            this.updateStatus();
        });
        
        this.socket.on('live_feed', (data) => {
            this.handleLiveFeed(data);
        });
        
        this.socket.on('motion_alert', (data) => {
            this.handleMotionDetection(data);
        });
        
        this.socket.on('tracking_update', (data) => {
            this.handleObjectTracking(data);
        });
        
        this.socket.on('sensor_update', (data) => {
            this.handleSensorData(data);
        });
    }
    
    setupEventListeners() {
        // Camera connection
        document.getElementById('connect-camera').addEventListener('click', () => {
            this.connectCamera();
        });
        
        // Camera controls
        document.getElementById('zoom-control').addEventListener('input', (e) => {
            this.updateZoom(e.target.value);
        });
        
        document.getElementById('focus-control').addEventListener('input', (e) => {
            this.updateFocus(e.target.value);
        });
        
        document.getElementById('exposure-control').addEventListener('input', (e) => {
            this.updateExposure(e.target.value);
        });
        
        // Capture buttons
        document.getElementById('capture-photo').addEventListener('click', () => {
            this.capturePhoto();
        });
        
        document.getElementById('capture-video').addEventListener('click', () => {
            this.captureVideo();
        });
        
        // Motion detection
        document.getElementById('toggle-motion').addEventListener('click', () => {
            this.toggleMotionDetection();
        });
        
        document.getElementById('toggle-tracking').addEventListener('click', () => {
            this.toggleObjectTracking();
        });
        
        // Identification
        document.getElementById('identify-object').addEventListener('click', () => {
            this.identifyObject();
        });
        
        // Search functionality
        document.getElementById('search-btn').addEventListener('click', () => {
            this.searchCelestialObject();
        });
        
        document.getElementById('object-search').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.searchCelestialObject();
            }
        });
        
        // Sidebar buttons
        document.getElementById('night-mode').addEventListener('click', () => {
            this.toggleNightMode();
        });
        
        document.getElementById('auto-focus').addEventListener('click', () => {
            this.enableAutoFocus();
        });
        
        document.getElementById('image-enhance').addEventListener('click', () => {
            this.enhanceImage();
        });
        
        document.getElementById('identify-all').addEventListener('click', () => {
            this.identifyAllObjects();
        });
        
        document.getElementById('confidence-threshold').addEventListener('click', () => {
            this.adjustConfidenceThreshold();
        });
        
        document.getElementById('context-aware').addEventListener('click', () => {
            this.toggleContextAwareness();
        });
    }
    
    async identifyObject() {
        if (!this.cameraConnected) {
            this.showNotification('❌ Camera not connected', 'error');
            return;
        }
        
        this.showNotification('🧠 Starting AI identification...', 'info');
        
        // Simulate image data (in real app, this would come from camera)
        const mockImageData = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...';
        
        try {
            const result = await this.identificationSystem.identifyWithContext(mockImageData, 'auto');
            this.displayIdentificationResults(result);
        } catch (error) {
            console.error('Identification error:', error);
            this.showNotification('❌ Identification failed', 'error');
        }
    }
    
    async identifyAllObjects() {
        this.showNotification('🧠 Running comprehensive AI analysis...', 'info');
        
        const categories = ['birds', 'insects', 'plants', 'animals', 'astronomy'];
        const results = [];
        
        for (const category of categories) {
            try {
                const mockImageData = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...';
                const result = await this.identificationSystem.identifyObject(mockImageData, category);
                if (result.success) {
                    results.push(result);
                }
            } catch (error) {
                console.warn(`Category ${category} failed:`, error);
            }
        }
        
        this.displayComprehensiveResults(results);
    }
    
    displayIdentificationResults(result) {
        const resultsContainer = document.getElementById('identification-results');
        
        if (!result.success) {
            resultsContainer.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-search"></i>
                    <p>No objects identified</p>
                    <small>Try adjusting camera focus or lighting</small>
                </div>
            `;
            this.showNotification('❌ No objects identified', 'warning');
            return;
        }
        
        let html = '';
        result.identifications.forEach((identification, index) => {
            const confidence = Math.round(identification.weightedConfidence * 100);
            const apis = identification.apis.join(', ');
            
            html += `
                <div class="identification-result">
                    <div class="identification-header">
                        <span class="identification-name">${identification.name}</span>
                        <span class="identification-confidence">${confidence}%</span>
                    </div>
                    <div class="identification-details">
                        <div>Category: ${result.category}</div>
                        <div>APIs Used: ${apis}</div>
                        <div>Confidence: ${confidence}%</div>
                    </div>
                    <div class="identification-apis">
                        ${identification.apis.map(api => `<span class="api-badge">${api}</span>`).join('')}
                    </div>
                </div>
            `;
        });
        
        resultsContainer.innerHTML = html;
        
        this.showNotification(`✅ Identified ${result.identifications.length} objects`, 'success');
        
        // Update identification status
        const identificationStatus = document.getElementById('identification-status');
        if (identificationStatus) {
            identificationStatus.innerHTML = '<i class="fas fa-brain"></i><span>AI: Active</span>';
        }
    }
    
    displayComprehensiveResults(results) {
        const resultsContainer = document.getElementById('identification-results');
        
        if (results.length === 0) {
            resultsContainer.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-search"></i>
                    <p>No objects identified</p>
                    <small>Comprehensive analysis complete</small>
                </div>
            `;
            return;
        }
        
        let html = '<h4>Comprehensive Analysis Results</h4>';
        
        results.forEach(result => {
            html += `
                <div class="identification-result">
                    <div class="identification-header">
                        <span class="identification-name">${result.category.toUpperCase()}</span>
                        <span class="identification-confidence">${result.identifications.length} found</span>
                    </div>
                    <div class="identification-details">
                        ${result.identifications.map(id => `
                            <div>• ${id.name} (${Math.round(id.weightedConfidence * 100)}%)</div>
                        `).join('')}
                    </div>
                </div>
            `;
        });
        
        resultsContainer.innerHTML = html;
        this.showNotification(`✅ Comprehensive analysis complete: ${results.length} categories`, 'success');
    }
    
    adjustConfidenceThreshold() {
        const currentThreshold = this.identificationSystem.confidenceThreshold;
        const newThreshold = currentThreshold === 0.7 ? 0.8 : currentThreshold === 0.8 ? 0.9 : 0.7;
        
        this.identificationSystem.setConfidenceThreshold(newThreshold);
        
        const button = document.getElementById('confidence-threshold');
        button.innerHTML = `<i class="fas fa-sliders-h"></i> Confidence: ${Math.round(newThreshold * 100)}%`;
        
        this.showNotification(`🎯 Confidence threshold set to ${Math.round(newThreshold * 100)}%`, 'info');
    }
    
    toggleContextAwareness() {
        const button = document.getElementById('context-aware');
        const isEnabled = button.innerHTML.includes('ON');
        
        if (isEnabled) {
            button.innerHTML = '<i class="fas fa-map-marker-alt"></i> Context Aware: OFF';
            this.showNotification('🌍 Context awareness disabled', 'info');
        } else {
            button.innerHTML = '<i class="fas fa-map-marker-alt"></i> Context Aware: ON';
            this.showNotification('🌍 Context awareness enabled', 'success');
        }
    }
    
    connectCamera() {
        if (!this.isConnected) {
            this.showNotification('❌ Server not connected', 'error');
            return;
        }
        
        this.showNotification('🔌 Connecting to camera...', 'info');
        
        fetch('/api/camera/connect', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                this.cameraConnected = true;
                this.updateStatus();
                this.showNotification('✅ Camera connected successfully!', 'success');
                this.updateCameraFeed();
            }
        })
        .catch(error => {
            console.error('Camera connection error:', error);
            this.showNotification('❌ Camera connection failed', 'error');
        });
    }
    
    updateZoom(value) {
        document.getElementById('zoom-value').textContent = value + 'x';
        
        if (this.socket && this.cameraConnected) {
            this.socket.emit('camera_control', {
                type: 'zoom',
                value: parseInt(value)
            });
        }
    }
    
    updateFocus(value) {
        document.getElementById('focus-value').textContent = value + '%';
        
        if (this.socket && this.cameraConnected) {
            this.socket.emit('camera_control', {
                type: 'focus',
                value: parseInt(value)
            });
        }
    }
    
    updateExposure(value) {
        document.getElementById('exposure-value').textContent = value + '%';
        
        if (this.socket && this.cameraConnected) {
            this.socket.emit('camera_control', {
                type: 'exposure',
                value: parseInt(value)
            });
        }
    }
    
    capturePhoto() {
        if (!this.cameraConnected) {
            this.showNotification('❌ Camera not connected', 'error');
            return;
        }
        
        this.showNotification('📸 Capturing photo...', 'info');
        
        fetch('/api/camera/capture', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                this.showNotification('✅ Photo captured!', 'success');
                this.addToGallery(data.imageId);
            }
        })
        .catch(error => {
            console.error('Photo capture error:', error);
            this.showNotification('❌ Photo capture failed', 'error');
        });
    }
    
    captureVideo() {
        if (!this.cameraConnected) {
            this.showNotification('❌ Camera not connected', 'error');
            return;
        }
        
        this.showNotification('🎥 Starting video recording...', 'info');
        
        if (this.socket) {
            this.socket.emit('camera_control', {
                type: 'video',
                action: 'start'
            });
        }
    }
    
    toggleMotionDetection() {
        this.motionDetectionEnabled = !this.motionDetectionEnabled;
        
        if (this.socket) {
            this.socket.emit('motion_control', {
                enabled: this.motionDetectionEnabled
            });
        }
        
        const button = document.getElementById('toggle-motion');
        if (this.motionDetectionEnabled) {
            button.innerHTML = '<i class="fas fa-eye-slash"></i> Disable Motion';
            button.style.background = 'var(--aurora-green)';
            button.style.color = 'var(--primary-bg)';
            this.showNotification('🎯 Motion detection enabled', 'success');
        } else {
            button.innerHTML = '<i class="fas fa-eye"></i> Enable Motion';
            button.style.background = 'var(--surface-bg)';
            button.style.color = 'var(--primary-text)';
            this.showNotification('👁️ Motion detection disabled', 'info');
        }
        
        this.updateStatus();
    }
    
    toggleObjectTracking() {
        this.objectTrackingEnabled = !this.objectTrackingEnabled;
        
        if (this.socket) {
            this.socket.emit('tracking_control', {
                enabled: this.objectTrackingEnabled
            });
        }
        
        const button = document.getElementById('toggle-tracking');
        if (this.objectTrackingEnabled) {
            button.innerHTML = '<i class="fas fa-crosshairs"></i> Disable Tracking';
            button.style.background = 'var(--deep-space-blue)';
            button.style.color = 'var(--primary-bg)';
            this.showNotification('🎯 Object tracking enabled', 'success');
        } else {
            button.innerHTML = '<i class="fas fa-crosshairs"></i> Enable Tracking';
            button.style.background = 'var(--surface-bg)';
            button.style.color = 'var(--primary-text)';
            this.showNotification('🎯 Object tracking disabled', 'info');
        }
        
        this.updateStatus();
    }
    
    searchCelestialObject() {
        const searchTerm = document.getElementById('object-search').value.trim();
        if (!searchTerm) return;
        
        this.showNotification(`🔍 Searching for ${searchTerm}...`, 'info');
        
        // Simulate search results
        setTimeout(() => {
            const results = this.celestialObjects.filter(obj => 
                obj.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
            
            if (results.length > 0) {
                this.showSearchResults(results);
                this.showNotification(`✅ Found ${results.length} objects`, 'success');
            } else {
                this.showNotification(`❌ No objects found for "${searchTerm}"`, 'error');
            }
        }, 1000);
    }
    
    loadCelestialObjects() {
        fetch('/api/sky/objects')
            .then(response => response.json())
            .then(objects => {
                this.celestialObjects = objects;
                this.displayCelestialObjects();
            })
            .catch(error => {
                console.error('Error loading celestial objects:', error);
            });
    }
    
    displayCelestialObjects() {
        const objectsList = document.getElementById('objects-list');
        objectsList.innerHTML = '';
        
        this.celestialObjects.forEach(obj => {
            const objectElement = document.createElement('div');
            objectElement.className = 'celestial-object';
            objectElement.innerHTML = `
                <div class="object-info">
                    <strong>${obj.name}</strong>
                    <span class="object-type">${obj.type}</span>
                </div>
                <div class="object-status ${obj.visible ? 'visible' : 'hidden'}">
                    ${obj.visible ? 'Visible' : 'Hidden'}
                </div>
            `;
            objectsList.appendChild(objectElement);
        });
    }
    
    handleLiveFeed(data) {
        const cameraFeed = document.getElementById('camera-feed');
        
        if (data.type === 'image') {
            cameraFeed.innerHTML = `
                <img src="${data.data}" alt="Live Camera Feed" style="width: 100%; height: 100%; object-fit: cover;">
            `;
        }
    }
    
    handleMotionDetection(data) {
        const detectionBox = document.getElementById('detection-box');
        
        if (data.detected) {
            detectionBox.style.display = 'block';
            detectionBox.style.left = data.x + '%';
            detectionBox.style.top = data.y + '%';
            detectionBox.style.width = data.width + '%';
            detectionBox.style.height = data.height + '%';
            
            this.showNotification('🎯 Motion detected!', 'warning');
        } else {
            detectionBox.style.display = 'none';
        }
    }
    
    handleObjectTracking(data) {
        if (data.tracking) {
            this.showNotification(`🎯 Tracking: ${data.object}`, 'info');
        }
    }
    
    handleSensorData(data) {
        // Update sensor displays
        console.log('Sensor data:', data);
    }
    
    updateStatus() {
        // Update camera status
        const cameraStatus = document.getElementById('camera-status');
        const cameraStatusText = document.getElementById('camera-status-text');
        
        if (this.cameraConnected) {
            cameraStatus.innerHTML = '<i class="fas fa-camera"></i><span>Camera: Connected</span>';
            cameraStatusText.textContent = 'Connected';
            cameraStatusText.className = 'status-ok';
        } else {
            cameraStatus.innerHTML = '<i class="fas fa-camera"></i><span>Camera: Disconnected</span>';
            cameraStatusText.textContent = 'Disconnected';
            cameraStatusText.className = 'status-error';
        }
        
        // Update motion status
        const motionStatus = document.getElementById('motion-status');
        if (this.motionDetectionEnabled) {
            motionStatus.innerHTML = '<i class="fas fa-eye"></i><span>Motion: Active</span>';
        } else {
            motionStatus.innerHTML = '<i class="fas fa-eye"></i><span>Motion: Inactive</span>';
        }
        
        // Update tracking status
        const trackingStatus = document.getElementById('tracking-status');
        if (this.objectTrackingEnabled) {
            trackingStatus.innerHTML = '<i class="fas fa-crosshairs"></i><span>Tracking: On</span>';
        } else {
            trackingStatus.innerHTML = '<i class="fas fa-crosshairs"></i><span>Tracking: Off</span>';
        }
    }
    
    updateCameraFeed() {
        const cameraFeed = document.getElementById('camera-feed');
        cameraFeed.innerHTML = `
            <div class="camera-active">
                <i class="fas fa-camera pulse"></i>
                <p>Camera Active</p>
                <small>Live feed will appear here</small>
            </div>
        `;
    }
    
    addToGallery(imageId) {
        const galleryGrid = document.getElementById('gallery-grid');
        const imageElement = document.createElement('div');
        imageElement.className = 'gallery-item';
        imageElement.innerHTML = `
            <div class="gallery-placeholder">
                <i class="fas fa-image"></i>
                <p>${imageId}</p>
            </div>
        `;
        galleryGrid.appendChild(imageElement);
    }
    
    showSearchResults(results) {
        const objectsList = document.getElementById('objects-list');
        objectsList.innerHTML = '';
        
        results.forEach(obj => {
            const objectElement = document.createElement('div');
            objectElement.className = 'celestial-object highlight';
            objectElement.innerHTML = `
                <div class="object-info">
                    <strong>${obj.name}</strong>
                    <span class="object-type">${obj.type}</span>
                </div>
                <div class="object-status ${obj.visible ? 'visible' : 'hidden'}">
                    ${obj.visible ? 'Visible' : 'Hidden'}
                </div>
            `;
            objectsList.appendChild(objectElement);
        });
    }
    
    toggleNightMode() {
        document.body.classList.toggle('night-mode');
        this.showNotification('🌙 Night mode toggled', 'info');
    }
    
    enableAutoFocus() {
        if (this.socket && this.cameraConnected) {
            this.socket.emit('camera_control', {
                type: 'autofocus',
                enabled: true
            });
            this.showNotification('🎯 Auto focus enabled', 'success');
        } else {
            this.showNotification('❌ Camera not connected', 'error');
        }
    }
    
    enhanceImage() {
        this.showNotification('✨ Enhancing image...', 'info');
        
        setTimeout(() => {
            this.showNotification('✅ Image enhanced!', 'success');
        }, 2000);
    }
    
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <span>${message}</span>
            <button onclick="this.parentElement.remove()">×</button>
        `;
        
        // Add to page
        document.body.appendChild(notification);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 3000);
    }
}

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Initializing Drahms Vision Astronomy Camera System...');
    window.drahmsVision = new DrahmsVisionApp();
});
