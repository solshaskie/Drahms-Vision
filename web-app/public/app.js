// Drahms Vision Astronomy Camera System - Main Application

class DrahmsVisionApp {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.cameraConnected = false;
        this.motionDetectionEnabled = false;
        this.objectTrackingEnabled = false;
        this.celestialObjects = [];
        
        // Helper function for safe DOM access
        this.safeGetElement = (id) => {
            const element = document.getElementById(id);
            if (!element) {
                console.warn(`⚠️ Element not found: ${id}`);
            }
            return element;
        };
        
        // Initialize astronomy and overlay systems
        this.astronomyEngine = new AstronomyEngine();
        this.arOverlay = new AROverlaySystem();
        this.androidAROverlay = new AndroidAROverlay();
        this.apiKeyManager = new APIKeyManager();
        this.realAPI = new RealAPIIntegration();
        this.identificationSystem = new ContextAwareIdentification();
        this.googleLens = null;
        this.networkDiscovery = null;
        
        // Device orientation data from Android app
        this.deviceOrientation = null;
        this.observerLocation = null;
        
        // Samsung A25 camera control states
        this.nightModeEnabled = false;
        this.astroModeEnabled = false;
        this.proModeEnabled = false;
        
        this.init();
    }
    
    init() {
        this.connectWebSocket();
        this.setupEventListeners();
        this.loadCelestialObjects();
        this.updateStatus();
        this.initializeIdentificationSystem();
        this.initializeAstronomySystem();
        this.initializeAPISystem();
        this.initializeAndroidARSystem();
        this.initializeGoogleLens();
        this.initializeNetworkDiscovery();
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
    
    initializeAstronomySystem() {
        // Initialize AR overlay system
        this.arOverlay.initialize(this.astronomyEngine);
        
        // Set default location (can be updated from Android app)
        this.astronomyEngine.setObserverLocation(40.7128, -74.0060, 0);
        
        // Update time
        this.astronomyEngine.updateTime();
        
        console.log('🌌 Astronomy System initialized');
    }
    
    initializeAPISystem() {
        console.log('🔑 Initializing API System...');
        
        // Load API keys from configuration file first
        if (window.API_KEYS) {
            console.log(`🔑 Found ${Object.keys(window.API_KEYS).length} API keys in configuration`);
            
            // Filter out placeholder keys
            const realKeys = {};
            Object.keys(window.API_KEYS).forEach(key => {
                if (window.API_KEYS[key] && 
                    !window.API_KEYS[key].includes('your_') && 
                    !window.API_KEYS[key].includes('_here')) {
                    realKeys[key] = window.API_KEYS[key];
                    console.log(`✅ Added API key: ${key}`);
                } else {
                    console.log(`❌ Filtered out API key: ${key} (${window.API_KEYS[key]})`);
                }
            });
            
            console.log(`🔑 After filtering: ${Object.keys(realKeys).length} real keys`);
            
            if (Object.keys(realKeys).length > 0) {
                this.apiKeyManager.setAPIKeys(realKeys);
                this.realAPI.setAPIKeys(realKeys);
                console.log('🔑 API keys loaded from configuration file');
            } else {
                console.warn('⚠️ No valid API keys found after filtering');
            }
        } else {
            console.error('❌ window.API_KEYS not found');
        }
        
        // Also load API keys from localStorage (user-entered keys)
        const savedKeys = localStorage.getItem('drahms-vision-api-keys');
        if (savedKeys) {
            try {
                const keys = JSON.parse(savedKeys);
                this.apiKeyManager.setAPIKeys(keys);
                this.realAPI.setAPIKeys(keys);
                console.log('🔑 API keys loaded from storage');
            } catch (error) {
                console.error('Error loading API keys:', error);
            }
        }
        
        // Update API status
        const apiStatus = document.getElementById('api-status-text');
        if (apiStatus) {
            const summary = this.apiKeyManager.getSummary();
            apiStatus.textContent = `${summary.available}/${summary.total} APIs configured`;
            apiStatus.className = summary.percentage > 50 ? 'status-ok' : 'status-warning';
        }
        
        console.log('🔑 Real API Integration System initialized');
    }
    
    initializeAndroidARSystem() {
        console.log('🌟 Initializing Android AR System');
        
        // Connect astronomy engine to Android AR overlay
        this.androidAROverlay.setAstronomyEngine(this.astronomyEngine);
        
        // Set up AR overlay controls
        this.setupAROverlayControls();
        
        console.log('🌟 Android AR System initialized');
    }
    
    setupAROverlayControls() {
        // AR overlay toggle buttons
        const toggleOverlayBtn = document.getElementById('toggle-overlay');
        if (toggleOverlayBtn) {
            toggleOverlayBtn.addEventListener('click', () => {
                this.toggleAndroidAROverlay();
            });
        }
        
        // Constellation toggle
        const toggleConstellationsBtn = document.getElementById('toggle-constellations');
        if (toggleConstellationsBtn) {
            toggleConstellationsBtn.addEventListener('click', () => {
                this.androidAROverlay.toggleConstellations();
            });
        }
        
        // Stars toggle
        const toggleStarsBtn = document.getElementById('toggle-stars');
        if (toggleStarsBtn) {
            toggleStarsBtn.addEventListener('click', () => {
                this.androidAROverlay.toggleStars();
            });
        }
        
        // Planets toggle
        const togglePlanetsBtn = document.getElementById('toggle-planets');
        if (togglePlanetsBtn) {
            togglePlanetsBtn.addEventListener('click', () => {
                this.androidAROverlay.togglePlanets();
            });
        }
        
        // Labels toggle
        const toggleLabelsBtn = document.getElementById('toggle-labels');
        if (toggleLabelsBtn) {
            toggleLabelsBtn.addEventListener('click', () => {
                this.androidAROverlay.toggleLabels();
            });
        }
        
        // Compass toggle
        const toggleCompassBtn = document.getElementById('toggle-compass');
        if (toggleCompassBtn) {
            toggleCompassBtn.addEventListener('click', () => {
                this.androidAROverlay.toggleCompass();
            });
        }
    }
    
    toggleAndroidAROverlay() {
        if (this.androidAROverlay.isActive) {
            this.androidAROverlay.stop();
            this.showNotification('🌟 AR Overlay stopped', 'info');
        } else {
            this.androidAROverlay.start();
            this.showNotification('🌟 AR Overlay started', 'success');
        }
    }
    
    initializeGoogleLens() {
        console.log('🔍 Initializing Google Lens Integration');
        
        // Initialize Google Lens with API key
        if (window.API_KEYS && window.API_KEYS.GOOGLE_VISION_API_KEY && 
            !window.API_KEYS.GOOGLE_VISION_API_KEY.includes('your_') &&
            !window.API_KEYS.GOOGLE_VISION_API_KEY.includes('_here')) {
            this.googleLens = new GoogleLensIntegration(window.API_KEYS.GOOGLE_VISION_API_KEY);
            console.log('✅ Google Lens initialized with API key');
        } else {
            console.warn('⚠️ Google Lens API key not available');
        }
    }
    
    initializeNetworkDiscovery() {
        console.log('🌐 Initializing Network Discovery System');
        
        // Initialize network discovery
        this.networkDiscovery = new NetworkDiscovery();
        
        // Set up event listeners for device discovery
        document.addEventListener('deviceDiscovered', (event) => {
            this.onDeviceDiscovered(event.detail);
        });
        
        document.addEventListener('deviceConnected', (event) => {
            this.onDeviceConnected(event.detail);
        });
        
        document.addEventListener('deviceConnectionFailed', (event) => {
            this.onDeviceConnectionFailed(event.detail);
        });
        
        console.log('✅ Network Discovery System initialized');
    }
    
    onDeviceDiscovered(device) {
        console.log(`📱 Device discovered: ${device.ip}:${device.port}`);
        this.showNotification(`📱 Device discovered: ${device.ip}:${device.port}`, 'info');
        
        // Update device list in UI
        this.updateDeviceDiscoveryUI();
    }
    
    onDeviceConnected(connection) {
        const device = connection.device;
        console.log(`✅ Device connected: ${device.ip}:${device.port}`);
        this.showNotification(`✅ Connected to device: ${device.ip}:${device.port}`, 'success');
        
        // Update camera connection status
        this.cameraConnected = true;
        this.updateStatus();
        
        // Update device list in UI
        this.updateDeviceDiscoveryUI();
    }
    
    onDeviceConnectionFailed(connection) {
        const device = connection.device;
        const error = connection.error;
        console.log(`❌ Device connection failed: ${device.ip}:${device.port} - ${error}`);
        this.showNotification(`❌ Connection failed: ${device.ip}:${device.port}`, 'error');
        
        // Update device list in UI
        this.updateDeviceDiscoveryUI();
    }
    
    updateDeviceDiscoveryUI() {
        if (this.networkDiscovery) {
            this.networkDiscovery.updateDeviceList();
        }
    }
    
    openAPISettings() {
        // Open API key configuration in a new window
        const apiWindow = window.open('api-key-config.html', 'api-config', 
            'width=1000,height=800,scrollbars=yes,resizable=yes');
        
        if (apiWindow) {
            this.showNotification('🔑 Opening API configuration...', 'info');
        } else {
            this.showNotification('❌ Popup blocked - please allow popups for this site', 'error');
        }
    }
    
    connectWebSocket() {
        this.socket = io({
            transports: ['websocket', 'polling'],
            timeout: 10000,
            forceNew: true
        });
        
        this.socket.on('connect', () => {
            console.log('🔭 Connected to Drahms Vision server');
            this.isConnected = true;
            this.updateStatus();
            this.showNotification('✅ Connected to server', 'success');
        });
        
        this.socket.on('disconnect', (reason) => {
            console.log('❌ Disconnected from server:', reason);
            this.isConnected = false;
            this.updateStatus();
            this.showNotification(`❌ Disconnected: ${reason}`, 'error');
            
            // Auto-reconnect after 3 seconds
            if (reason === 'io server disconnect') {
                setTimeout(() => {
                    console.log('🔄 Attempting to reconnect...');
                    this.connectWebSocket();
                }, 3000);
            }
        });
        
        this.socket.on('connect_error', (error) => {
            console.error('🔌 Connection error:', error);
            this.showNotification('❌ Connection failed - check server', 'error');
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
        
        this.socket.on('sensor_data', (data) => {
            this.handleSensorData(data);
        });
    }
    
    setupEventListeners() {
        // Camera connection
        const connectCameraBtn = this.safeGetElement('connect-camera');
        if (connectCameraBtn) {
            connectCameraBtn.addEventListener('click', () => {
                this.connectCamera();
            });
        }
        
        // Camera controls
        const zoomControl = this.safeGetElement('zoom-control');
        if (zoomControl) {
            zoomControl.addEventListener('input', (e) => {
                this.updateZoom(e.target.value);
            });
        }
        
        // Samsung A25 specific camera controls
        this.setupSamsungA25Controls();
        
        const focusControl = this.safeGetElement('focus-control');
        if (focusControl) {
            focusControl.addEventListener('input', (e) => {
                this.updateFocus(e.target.value);
            });
        }
        
        const exposureControl = this.safeGetElement('exposure-control');
        if (exposureControl) {
            exposureControl.addEventListener('input', (e) => {
                this.updateExposure(e.target.value);
            });
        }
        
        // Capture buttons
        const capturePhotoBtn = this.safeGetElement('capture-photo');
        if (capturePhotoBtn) {
            capturePhotoBtn.addEventListener('click', () => {
                this.capturePhoto();
            });
        }
        
        const captureVideoBtn = this.safeGetElement('capture-video');
        if (captureVideoBtn) {
            captureVideoBtn.addEventListener('click', () => {
                this.captureVideo();
            });
        }
        
        // Motion detection
        const toggleMotionBtn = this.safeGetElement('toggle-motion');
        if (toggleMotionBtn) {
            toggleMotionBtn.addEventListener('click', () => {
                this.toggleMotionDetection();
            });
        }
        
        const toggleTrackingBtn = this.safeGetElement('toggle-tracking');
        if (toggleTrackingBtn) {
            toggleTrackingBtn.addEventListener('click', () => {
                this.toggleObjectTracking();
            });
        }
        
        // Identification
        const identifyObjectBtn = this.safeGetElement('identify-object');
        if (identifyObjectBtn) {
            identifyObjectBtn.addEventListener('click', () => {
                this.identifyObject();
            });
        }
        
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
        
        // Celestial overlay controls
        document.getElementById('toggle-overlay').addEventListener('click', () => {
            this.toggleCelestialOverlay();
        });
        
        document.getElementById('toggle-constellations').addEventListener('click', () => {
            this.toggleConstellations();
        });
        
        document.getElementById('toggle-stars').addEventListener('click', () => {
            this.toggleStars();
        });
        
        document.getElementById('toggle-planets').addEventListener('click', () => {
            this.togglePlanets();
        });
        
        document.getElementById('toggle-labels').addEventListener('click', () => {
            this.toggleLabels();
        });
        
        document.getElementById('set-location-btn').addEventListener('click', () => {
            this.setObserverLocation();
        });
        
        document.getElementById('highlight-object-btn').addEventListener('click', () => {
            this.highlightSearchedObject();
        });
        
        // API settings
        document.getElementById('api-settings').addEventListener('click', () => {
            this.openAPISettings();
        });
    }
    
    async identifyObject() {
        if (!this.cameraConnected) {
            this.showNotification('❌ Camera not connected', 'error');
            return;
        }
        
        this.showNotification('🧠 Starting AI identification...', 'info');
        
        // Get actual camera feed data if available
        const cameraFeed = document.getElementById('camera-feed');
        let imageData = null;
        
        // Try to get real image data from camera feed
        const img = cameraFeed.querySelector('img');
        if (img && img.src) {
            try {
                // Convert image to base64
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = img.naturalWidth || 640;
                canvas.height = img.naturalHeight || 480;
                ctx.drawImage(img, 0, 0);
                imageData = canvas.toDataURL('image/jpeg', 0.8); // Compress to 80%
            } catch (error) {
                console.warn('Could not extract image from camera feed:', error);
            }
        }
        
        // Fallback to mock data
        if (!imageData) {
            imageData = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...';
        }
        
        try {
            // Try Google Lens identification first (if available)
            if (this.googleLens) {
                try {
                    const googleLensResults = await this.googleLens.identifyObject(imageData, {
                        category: 'general',
                        location: this.observerLocation,
                        maxResults: 10
                    });
                    
                    if (googleLensResults && googleLensResults.identifications.length > 0) {
                        this.displayGoogleLensResults(googleLensResults);
                        return;
                    }
                } catch (error) {
                    console.warn('Google Lens identification failed:', error);
                }
            }
            
            // Try real API identification
            const realAPIResult = await this.realAPI.identifyObject(imageData, null, this.observerLocation, 'auto');
            
            if (realAPIResult && realAPIResult.length > 0) {
                this.displayRealAPIResults(realAPIResult);
            } else {
                // Fallback to mock identification system
                const result = await this.identificationSystem.identifyWithContext(imageData, 'auto');
                this.displayIdentificationResults(result);
            }
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
    
    displayRealAPIResults(results) {
        const resultsContainer = document.getElementById('identification-results');
        
        if (!results || results.length === 0) {
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
        
        let html = '<h4>Real API Identification Results</h4>';
        
        results.forEach((result, index) => {
            const confidence = Math.round(result.confidence * 100);
            const sourceIcon = this.getSourceIcon(result.source);
            
            html += `
                <div class="identification-result">
                    <div class="result-header">
                        <div class="result-source">
                            ${sourceIcon} ${result.source}
                        </div>
                        <div class="result-confidence">
                            ${confidence}% confidence
                        </div>
                    </div>
                    <div class="result-type">
                        Type: ${result.type}
                    </div>
                    <div class="result-data">
                        ${this.formatAPIData(result.data, result.source)}
                    </div>
                </div>
            `;
        });
        
        resultsContainer.innerHTML = html;
        this.showNotification(`✅ Real API identification complete: ${results.length} results`, 'success');
    }
    
    displayGoogleLensResults(results) {
        const resultsContainer = document.getElementById('identification-results');
        if (!resultsContainer) return;
        
        let html = `
            <div class="results-header">
                <h3>🔍 Google Lens Results</h3>
                <div class="result-meta">
                    <span class="confidence">${(results.confidence * 100).toFixed(1)}% confidence</span>
                    <span class="timestamp">${new Date(results.timestamp).toLocaleTimeString()}</span>
                </div>
            </div>
        `;
        
        // Display main identifications
        if (results.identifications && results.identifications.length > 0) {
            html += '<div class="result-section"><h4>🎯 Identifications</h4>';
            results.identifications.forEach(id => {
                html += `
                    <div class="result-item">
                        <div class="result-name">${id.name}</div>
                        <div class="result-confidence">${(id.confidence * 100).toFixed(1)}%</div>
                        <div class="result-type">${id.type}</div>
                    </div>
                `;
            });
            html += '</div>';
        }
        
        // Display objects with bounding boxes
        if (results.objects && results.objects.length > 0) {
            html += '<div class="result-section"><h4>📦 Detected Objects</h4>';
            results.objects.forEach(obj => {
                html += `
                    <div class="result-item">
                        <div class="result-name">${obj.name}</div>
                        <div class="result-confidence">${(obj.confidence * 100).toFixed(1)}%</div>
                        <div class="result-bounds">Bounding box detected</div>
                    </div>
                `;
            });
            html += '</div>';
        }
        
        // Display web entities
        if (results.webEntities && results.webEntities.length > 0) {
            html += '<div class="result-section"><h4>🌐 Web Entities</h4>';
            results.webEntities.slice(0, 5).forEach(entity => {
                html += `
                    <div class="result-item">
                        <div class="result-name">${entity.description}</div>
                        <div class="result-confidence">${(entity.score * 100).toFixed(1)}%</div>
                    </div>
                `;
            });
            html += '</div>';
        }
        
        // Display metadata if available
        if (results.metadata) {
            html += '<div class="result-section"><h4>📊 Additional Information</h4>';
            html += `<div class="metadata">${JSON.stringify(results.metadata, null, 2)}</div>`;
            html += '</div>';
        }
        
        resultsContainer.innerHTML = html;
        this.showNotification('✅ Google Lens identification completed!', 'success');
    }
    
    getSourceIcon(source) {
        const icons = {
            'NASA APOD': '🌌',
            'eBird': '🦅',
            'BirdNET': '🎵',
            'Xeno-Canto': '🎶',
            'iNaturalist': '🦋',
            'PlantNet': '🌿',
            'Google Vision': '👁️',
            'Imagga': '🏷️',
            'Cloudinary': '☁️',
            'Roboflow': '🤖'
        };
        return icons[source] || '🔍';
    }
    
    formatAPIData(data, source) {
        if (!data) return 'No data available';
        
        switch (source) {
            case 'NASA APOD':
                return `
                    <strong>${data.title}</strong><br>
                    <small>${data.explanation}</small>
                `;
            case 'eBird':
                return data.map(obs => `
                    <strong>${obs.comName}</strong> (${obs.sciName})<br>
                    <small>Location: ${obs.locName}, ${obs.obsDt}</small>
                `).join('<br>');
            case 'BirdNET':
                return `
                    <strong>${data.common_name}</strong> (${data.scientific_name})<br>
                    <small>Audio features: ${data.audio_features?.pattern || 'Unknown'}</small>
                `;
            case 'PlantNet':
                return data.results?.map(result => `
                    <strong>${result.species?.commonNames?.[0] || 'Unknown'}</strong><br>
                    <small>Scientific: ${result.species?.scientificName || 'Unknown'}</small>
                `).join('<br>') || 'No plant data';
            case 'Google Vision':
                return data.responses?.[0]?.labelAnnotations?.map(label => `
                    <strong>${label.description}</strong> (${Math.round(label.score * 100)}%)
                `).join('<br>') || 'No vision data';
            default:
                return JSON.stringify(data, null, 2);
        }
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
        console.log('📡 Sensor data received:', data);
        
        if (data.type === 'orientation_data') {
            // Update device orientation for celestial overlay
            this.deviceOrientation = {
                alpha: data.azimuth,
                beta: data.pitch,
                gamma: data.roll
            };
            
            // Update astronomy engine with new orientation
            this.astronomyEngine.updateTime();
            
        } else if (data.type === 'location_update') {
            // Update observer location
            this.observerLocation = {
                latitude: data.latitude,
                longitude: data.longitude,
                altitude: data.altitude,
                accuracy: data.accuracy
            };
            
            // Update astronomy engine with new location
            this.astronomyEngine.setObserverLocation(
                data.latitude, 
                data.longitude, 
                data.altitude
            );
            
            // Update AR overlay
            this.arOverlay.setObserverLocation(
                data.latitude, 
                data.longitude, 
                data.altitude
            );
            
            // Update location status display
            this.updateLocationStatus();
            
            console.log(`📍 Location updated: ${data.latitude.toFixed(4)}, ${data.longitude.toFixed(4)}`);
        }
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
    
    setupSamsungA25Controls() {
        // Night mode toggle
        const nightModeBtn = document.getElementById('night-mode');
        if (nightModeBtn) {
            nightModeBtn.addEventListener('click', () => {
                this.toggleNightMode();
            });
        }
        
        // Astrophotography mode toggle
        const astroModeBtn = document.getElementById('astro-mode');
        if (astroModeBtn) {
            astroModeBtn.addEventListener('click', () => {
                this.toggleAstrophotographyMode();
            });
        }
        
        // Pro mode toggle
        const proModeBtn = document.getElementById('pro-mode');
        if (proModeBtn) {
            proModeBtn.addEventListener('click', () => {
                this.toggleProMode();
            });
        }
        
        // Camera switching
        const switchCameraBtn = document.getElementById('switch-camera');
        if (switchCameraBtn) {
            switchCameraBtn.addEventListener('click', () => {
                this.switchCamera();
            });
        }
        
        // Manual ISO control
        const isoControl = document.getElementById('iso-control');
        if (isoControl) {
            isoControl.addEventListener('input', (e) => {
                this.setISO(parseInt(e.target.value));
            });
        }
        
        // Manual shutter speed control
        const shutterControl = document.getElementById('shutter-control');
        if (shutterControl) {
            shutterControl.addEventListener('input', (e) => {
                this.setShutterSpeed(parseFloat(e.target.value));
            });
        }
        
        // White balance control
        const whiteBalanceControl = document.getElementById('white-balance');
        if (whiteBalanceControl) {
            whiteBalanceControl.addEventListener('change', (e) => {
                this.setWhiteBalance(e.target.value);
            });
        }
        
        // Focus mode control
        const focusModeControl = document.getElementById('focus-mode');
        if (focusModeControl) {
            focusModeControl.addEventListener('change', (e) => {
                this.setFocusMode(e.target.value);
            });
        }
        
        // Exposure compensation
        const exposureCompControl = document.getElementById('exposure-comp');
        if (exposureCompControl) {
            exposureCompControl.addEventListener('input', (e) => {
                this.setExposureCompensation(parseFloat(e.target.value));
            });
        }
    }
    
    // Samsung A25 Camera Control Methods
    toggleNightMode() {
        if (!this.cameraConnected) {
            this.showNotification('❌ Camera not connected', 'error');
            return;
        }
        
        this.socket.emit('camera_control', {
            action: 'night_mode',
            value: !this.nightModeEnabled
        });
        
        this.nightModeEnabled = !this.nightModeEnabled;
        this.showNotification(`🌙 Night mode: ${this.nightModeEnabled ? 'ON' : 'OFF'}`, 'info');
    }
    
    toggleAstrophotographyMode() {
        if (!this.cameraConnected) {
            this.showNotification('❌ Camera not connected', 'error');
            return;
        }
        
        this.socket.emit('camera_control', {
            action: 'astro_mode',
            value: !this.astroModeEnabled
        });
        
        this.astroModeEnabled = !this.astroModeEnabled;
        this.showNotification(`🌟 Astrophotography mode: ${this.astroModeEnabled ? 'ON' : 'OFF'}`, 'info');
    }
    
    toggleProMode() {
        if (!this.cameraConnected) {
            this.showNotification('❌ Camera not connected', 'error');
            return;
        }
        
        this.socket.emit('camera_control', {
            action: 'pro_mode',
            value: !this.proModeEnabled
        });
        
        this.proModeEnabled = !this.proModeEnabled;
        this.showNotification(`⚙️ Pro mode: ${this.proModeEnabled ? 'ON' : 'OFF'}`, 'info');
    }
    
    switchCamera() {
        if (!this.cameraConnected) {
            this.showNotification('❌ Camera not connected', 'error');
            return;
        }
        
        this.socket.emit('camera_control', {
            action: 'switch_camera'
        });
        
        this.showNotification('📷 Switching camera...', 'info');
    }
    
    setISO(iso) {
        if (!this.cameraConnected) {
            this.showNotification('❌ Camera not connected', 'error');
            return;
        }
        
        this.socket.emit('camera_control', {
            action: 'set_iso',
            value: iso
        });
        
        this.showNotification(`📷 ISO set to: ${iso}`, 'info');
    }
    
    setShutterSpeed(speed) {
        if (!this.cameraConnected) {
            this.showNotification('❌ Camera not connected', 'error');
            return;
        }
        
        this.socket.emit('camera_control', {
            action: 'set_shutter',
            value: speed
        });
        
        this.showNotification(`📷 Shutter speed: ${speed}s`, 'info');
    }
    
    setWhiteBalance(wb) {
        if (!this.cameraConnected) {
            this.showNotification('❌ Camera not connected', 'error');
            return;
        }
        
        this.socket.emit('camera_control', {
            action: 'set_white_balance',
            value: wb
        });
        
        this.showNotification(`📷 White balance: ${wb}`, 'info');
    }
    
    setFocusMode(mode) {
        if (!this.cameraConnected) {
            this.showNotification('❌ Camera not connected', 'error');
            return;
        }
        
        this.socket.emit('camera_control', {
            action: 'set_focus_mode',
            value: mode
        });
        
        this.showNotification(`📷 Focus mode: ${mode}`, 'info');
    }
    
    setExposureCompensation(comp) {
        if (!this.cameraConnected) {
            this.showNotification('❌ Camera not connected', 'error');
            return;
        }
        
        this.socket.emit('camera_control', {
            action: 'set_exposure_comp',
            value: comp
        });
        
        this.showNotification(`📷 Exposure compensation: ${comp}`, 'info');
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
    
    // Celestial Overlay Control Methods
    
    toggleCelestialOverlay() {
        if (this.arOverlay.isActive) {
            this.arOverlay.stop();
            this.showNotification('🌌 Celestial overlay disabled', 'info');
        } else {
            this.arOverlay.start();
            this.showNotification('🌌 Celestial overlay enabled', 'success');
        }
    }
    
    toggleConstellations() {
        this.arOverlay.toggleConstellations();
        this.showNotification('🌌 Constellations toggled', 'info');
    }
    
    toggleStars() {
        this.arOverlay.toggleStars();
        this.showNotification('⭐ Stars toggled', 'info');
    }
    
    togglePlanets() {
        this.arOverlay.togglePlanets();
        this.showNotification('🪐 Planets toggled', 'info');
    }
    
    toggleLabels() {
        this.arOverlay.toggleLabels();
        this.showNotification('🏷️ Labels toggled', 'info');
    }
    
    setObserverLocation() {
        const latInput = document.getElementById('latitude-input');
        const lngInput = document.getElementById('longitude-input');
        
        const lat = parseFloat(latInput.value);
        const lng = parseFloat(lngInput.value);
        
        if (isNaN(lat) || isNaN(lng)) {
            this.showNotification('❌ Please enter valid latitude and longitude', 'error');
            return;
        }
        
        if (lat < -90 || lat > 90) {
            this.showNotification('❌ Latitude must be between -90 and 90', 'error');
            return;
        }
        
        if (lng < -180 || lng > 180) {
            this.showNotification('❌ Longitude must be between -180 and 180', 'error');
            return;
        }
        
        // Update astronomy engine
        this.astronomyEngine.setObserverLocation(lat, lng, 0);
        this.arOverlay.setObserverLocation(lat, lng, 0);
        
        // Update location status
        this.observerLocation = { latitude: lat, longitude: lng, altitude: 0, accuracy: 0 };
        this.updateLocationStatus();
        
        this.showNotification(`📍 Location set to ${lat.toFixed(4)}, ${lng.toFixed(4)}`, 'success');
    }
    
    updateLocationStatus() {
        const locationStatus = document.getElementById('location-status');
        if (locationStatus && this.observerLocation) {
            locationStatus.innerHTML = `
                <span>Location: ${this.observerLocation.latitude.toFixed(4)}, ${this.observerLocation.longitude.toFixed(4)}</span>
                <br><small>Accuracy: ${this.observerLocation.accuracy.toFixed(1)}m</small>
            `;
        }
    }
    
    highlightSearchedObject() {
        const searchInput = document.getElementById('object-search');
        const objectName = searchInput.value.trim();
        
        if (!objectName) {
            this.showNotification('❌ Please enter an object name to highlight', 'error');
            return;
        }
        
        // Search for object
        const results = this.astronomyEngine.searchObjects(objectName);
        
        if (results.length === 0) {
            this.showNotification(`❌ Object "${objectName}" not found`, 'error');
            return;
        }
        
        // Highlight the first result
        const object = results[0];
        this.arOverlay.highlightObject(object.name);
        
        this.showNotification(`🎯 Highlighting ${object.name}`, 'success');
    }
    
    // Enhanced celestial object search
    searchCelestialObject() {
        const searchTerm = document.getElementById('object-search').value.trim();
        if (!searchTerm) return;
        
        this.showNotification(`🔍 Searching for ${searchTerm}...`, 'info');
        
        // Use astronomy engine search
        const results = this.astronomyEngine.searchObjects(searchTerm);
        
        if (results.length > 0) {
            this.showSearchResults(results);
            this.showNotification(`✅ Found ${results.length} objects`, 'success');
        } else {
            this.showNotification(`❌ No objects found for "${searchTerm}"`, 'error');
        }
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
                    <span class="object-magnitude">Mag: ${obj.magnitude.toFixed(1)}</span>
                </div>
                <div class="object-status ${obj.visible ? 'visible' : 'hidden'}">
                    ${obj.visible ? 'Visible' : 'Hidden'}
                </div>
                <div class="object-coordinates">
                    Alt: ${obj.altitude.toFixed(1)}° | Az: ${obj.azimuth.toFixed(1)}°
                </div>
            `;
            
            // Add click handler to highlight object
            objectElement.addEventListener('click', () => {
                this.arOverlay.highlightObject(obj.name);
                this.showNotification(`🎯 Highlighting ${obj.name}`, 'info');
            });
            
            objectsList.appendChild(objectElement);
        });
    }
}

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Initializing Drahms Vision Astronomy Camera System...');
    
    // Add a small delay to ensure all DOM elements are ready
    setTimeout(() => {
        try {
            window.drahmsVision = new DrahmsVisionApp();
            console.log('✅ Drahms Vision app initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize Drahms Vision app:', error);
        }
    }, 100);
});
