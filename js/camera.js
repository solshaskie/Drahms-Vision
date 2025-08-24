// Drahms Vision - Camera Control Module
// Handles camera operations, settings, and image capture

class CameraController {
    constructor() {
        this.isStreaming = false;
        this.isRecording = false;
        this.currentSettings = {
            zoom: 1.0,
            focus: 50,
            iso: 400,
            exposure: 0,
            whiteBalance: 'auto'
        };
        
        this.init();
    }
    
    init() {
        console.log('📷 Initializing Camera Controller...');
        this.setupCameraControls();
        this.loadCameraSettings();
    }
    
    setupCameraControls() {
        // Zoom slider
        const zoomSlider = document.getElementById('zoom-slider');
        if (zoomSlider) {
            zoomSlider.addEventListener('input', (e) => {
                this.currentSettings.zoom = parseFloat(e.target.value);
                this.updateCameraSetting('zoom', this.currentSettings.zoom);
            });
        }
        
        // Focus slider
        const focusSlider = document.getElementById('focus-slider');
        if (focusSlider) {
            focusSlider.addEventListener('input', (e) => {
                this.currentSettings.focus = parseInt(e.target.value);
                this.updateCameraSetting('focus', this.currentSettings.focus);
            });
        }
        
        // ISO slider
        const isoSlider = document.getElementById('iso-slider');
        if (isoSlider) {
            isoSlider.addEventListener('input', (e) => {
                this.currentSettings.iso = parseInt(e.target.value);
                this.updateCameraSetting('iso', this.currentSettings.iso);
            });
        }
    }
    
    loadCameraSettings() {
        // Load saved camera settings from localStorage
        const savedSettings = localStorage.getItem('drahmsVisionCameraSettings');
        if (savedSettings) {
            this.currentSettings = { ...this.currentSettings, ...JSON.parse(savedSettings) };
            this.updateControlValues();
        }
    }
    
    saveCameraSettings() {
        localStorage.setItem('drahmsVisionCameraSettings', JSON.stringify(this.currentSettings));
    }
    
    updateControlValues() {
        // Update slider values to match current settings
        const zoomSlider = document.getElementById('zoom-slider');
        const focusSlider = document.getElementById('focus-slider');
        const isoSlider = document.getElementById('iso-slider');
        
        if (zoomSlider) zoomSlider.value = this.currentSettings.zoom;
        if (focusSlider) focusSlider.value = this.currentSettings.focus;
        if (isoSlider) isoSlider.value = this.currentSettings.iso;
    }
    
    updateCameraSetting(setting, value) {
        // Send camera setting update to Android app via WebSocket
        if (window.drahmsVisionApp && window.drahmsVisionApp.socket) {
            window.drahmsVisionApp.socket.emit('camera_setting', {
                setting: setting,
                value: value
            });
        }
        
        this.saveCameraSettings();
    }
    
    startCameraStream() {
        if (window.drahmsVisionApp && window.drahmsVisionApp.socket) {
            window.drahmsVisionApp.socket.emit('start_camera_stream');
            this.isStreaming = true;
            console.log('📹 Camera stream started');
        }
    }
    
    stopCameraStream() {
        if (window.drahmsVisionApp && window.drahmsVisionApp.socket) {
            window.drahmsVisionApp.socket.emit('stop_camera_stream');
            this.isStreaming = false;
            console.log('📹 Camera stream stopped');
        }
    }
    
    captureImage() {
        if (window.drahmsVisionApp && window.drahmsVisionApp.socket) {
            window.drahmsVisionApp.socket.emit('capture_image');
            console.log('📸 Capturing image...');
        }
    }
    
    startRecording() {
        if (window.drahmsVisionApp && window.drahmsVisionApp.socket) {
            window.drahmsVisionApp.socket.emit('start_recording');
            this.isRecording = true;
            this.updateRecordButton();
            console.log('🎥 Recording started');
        }
    }
    
    stopRecording() {
        if (window.drahmsVisionApp && window.drahmsVisionApp.socket) {
            window.drahmsVisionApp.socket.emit('stop_recording');
            this.isRecording = false;
            this.updateRecordButton();
            console.log('🎥 Recording stopped');
        }
    }
    
    toggleRecording() {
        if (this.isRecording) {
            this.stopRecording();
        } else {
            this.startRecording();
        }
    }
    
    updateRecordButton() {
        const recordBtn = document.getElementById('record-btn');
        if (recordBtn) {
            if (this.isRecording) {
                recordBtn.innerHTML = '<i class="fas fa-stop"></i> Stop';
                recordBtn.classList.add('recording');
            } else {
                recordBtn.innerHTML = '<i class="fas fa-video"></i> Record';
                recordBtn.classList.remove('recording');
            }
        }
    }
    
    setCameraMode(mode) {
        if (window.drahmsVisionApp && window.drahmsVisionApp.socket) {
            window.drahmsVisionApp.socket.emit('set_camera_mode', { mode: mode });
            console.log(`📷 Camera mode set to: ${mode}`);
        }
    }
    
    // Camera mode presets for astronomy
    setAstronomyMode() {
        this.currentSettings = {
            zoom: 1.0,
            focus: 50,
            iso: 1600,
            exposure: 0,
            whiteBalance: 'auto'
        };
        this.updateControlValues();
        this.setCameraMode('astronomy');
    }
    
    setNightMode() {
        this.currentSettings = {
            zoom: 1.0,
            focus: 50,
            iso: 3200,
            exposure: 0,
            whiteBalance: 'auto'
        };
        this.updateControlValues();
        this.setCameraMode('night');
    }
    
    setAutoMode() {
        this.currentSettings = {
            zoom: 1.0,
            focus: 50,
            iso: 400,
            exposure: 0,
            whiteBalance: 'auto'
        };
        this.updateControlValues();
        this.setCameraMode('auto');
    }
}

// Initialize camera controller when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.cameraController = new CameraController();
});
