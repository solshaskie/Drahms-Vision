// Drahms Vision - Main Application JavaScript
// Handles core application logic, WebSocket connections, and UI state management

class DrahmsVisionApp {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.currentMode = 'idle';
        this.cameraStream = null;
        this.sensorData = {};
        
        this.init();
    }
    
    init() {
        console.log('🔭 Initializing Drahms Vision Application...');
        this.setupSocketConnection();
        this.setupEventListeners();
        this.updateConnectionStatus(false);
        this.hideLoadingScreen();
    }
    
    setupSocketConnection() {
        // Connect to WebSocket server
        this.socket = io('http://localhost:3003');
        
        this.socket.on('connect', () => {
            console.log('✅ Connected to Drahms Vision server');
            this.isConnected = true;
            this.updateConnectionStatus(true);
            this.requestInitialData();
        });
        
        this.socket.on('disconnect', () => {
            console.log('❌ Disconnected from server');
            this.isConnected = false;
            this.updateConnectionStatus(false);
        });
        
        this.socket.on('camera_feed', (data) => {
            this.handleCameraFeed(data);
        });
        
        this.socket.on('sensor_update', (data) => {
            this.handleSensorUpdate(data);
        });
        
        this.socket.on('capture_complete', (data) => {
            this.handleCaptureComplete(data);
        });
    }
    
    setupEventListeners() {
        // Settings button
        const settingsBtn = document.getElementById('settings-btn');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => {
                this.showSettings();
            });
        }
        
        // Capture button
        const captureBtn = document.getElementById('capture-btn');
        if (captureBtn) {
            captureBtn.addEventListener('click', () => {
                this.captureImage();
            });
        }
        
        // Record button
        const recordBtn = document.getElementById('record-btn');
        if (recordBtn) {
            recordBtn.addEventListener('click', () => {
                this.toggleRecording();
            });
        }
    }
    
    updateConnectionStatus(connected) {
        const statusElement = document.getElementById('connection-status');
        if (statusElement) {
            const icon = statusElement.querySelector('i');
            const text = statusElement.querySelector('span');
            
            if (connected) {
                icon.className = 'fas fa-circle connected';
                text.textContent = 'Connected';
            } else {
                icon.className = 'fas fa-circle disconnected';
                text.textContent = 'Disconnected';
            }
        }
    }
    
    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        const appContainer = document.getElementById('app');
        
        if (loadingScreen && appContainer) {
            setTimeout(() => {
                loadingScreen.style.display = 'none';
                appContainer.style.display = 'block';
            }, 2000);
        }
    }
    
    requestInitialData() {
        // Request initial camera and sensor data
        if (this.socket && this.isConnected) {
            this.socket.emit('request_camera_status');
            this.socket.emit('request_sensor_data');
        }
    }
    
    handleCameraFeed(data) {
        if (data.type === 'image') {
            this.displayCameraImage(data.data);
        }
    }
    
    handleSensorUpdate(data) {
        this.sensorData = { ...this.sensorData, ...data };
        this.updateSensorDisplay();
    }
    
    handleCaptureComplete(data) {
        if (data.success) {
            this.showNotification('Photo captured successfully!', 'success');
            this.displayCapturedImage(data.imageUrl);
        } else {
            this.showNotification('Failed to capture photo', 'error');
        }
    }
    
    displayCameraImage(imageData) {
        const cameraFeed = document.getElementById('camera-feed');
        if (cameraFeed) {
            cameraFeed.innerHTML = `<img src="${imageData}" alt="Camera Feed" style="width: 100%; height: 100%; object-fit: cover;">`;
        }
    }
    
    displayCapturedImage(imageUrl) {
        // Display captured image in gallery or preview area
        console.log('Captured image:', imageUrl);
    }
    
    updateSensorDisplay() {
        // Update sensor data display
        console.log('Sensor data updated:', this.sensorData);
    }
    
    captureImage() {
        if (this.socket && this.isConnected) {
            this.socket.emit('capture_image');
            this.showNotification('Capturing image...', 'info');
        } else {
            this.showNotification('Not connected to camera', 'error');
        }
    }
    
    toggleRecording() {
        if (this.socket && this.isConnected) {
            this.socket.emit('toggle_recording');
            this.showNotification('Recording toggled', 'info');
        } else {
            this.showNotification('Not connected to camera', 'error');
        }
    }
    
    showSettings() {
        this.showNotification('Settings panel coming soon', 'info');
    }
    
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Add to page
        document.body.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.drahmsVisionApp = new DrahmsVisionApp();
});
