// Drahms Vision - Image Editor Module
// Handles image processing, enhancement, and editing features

class ImageEditorController {
    constructor() {
        this.currentImage = null;
        this.isProcessing = false;
        this.editHistory = [];
        this.currentFilters = {
            brightness: 0,
            contrast: 0,
            saturation: 0,
            sharpness: 0
        };
        
        this.init();
    }
    
    init() {
        console.log('🎨 Initializing Image Editor Controller...');
        this.setupImageEditorUI();
    }
    
    setupImageEditorUI() {
        // Add image editor controls to the interface
        const cameraPanel = document.querySelector('.camera-panel');
        if (cameraPanel) {
            const editorControls = document.createElement('div');
            editorControls.className = 'image-editor-controls';
            editorControls.innerHTML = `
                <h4>Image Enhancement</h4>
                <div class="filter-controls">
                    <div class="filter-control">
                        <label>Brightness</label>
                        <input type="range" id="brightness-slider" min="-100" max="100" value="0">
                        <span class="filter-value">0</span>
                    </div>
                    <div class="filter-control">
                        <label>Contrast</label>
                        <input type="range" id="contrast-slider" min="-100" max="100" value="0">
                        <span class="filter-value">0</span>
                    </div>
                    <div class="filter-control">
                        <label>Saturation</label>
                        <input type="range" id="saturation-slider" min="-100" max="100" value="0">
                        <span class="filter-value">0</span>
                    </div>
                    <div class="filter-control">
                        <label>Sharpness</label>
                        <input type="range" id="sharpness-slider" min="0" max="100" value="0">
                        <span class="filter-value">0</span>
                    </div>
                </div>
                <div class="editor-buttons">
                    <button id="enhance-btn" class="btn-secondary">Enhance</button>
                    <button id="reset-btn" class="btn-secondary">Reset</button>
                    <button id="save-btn" class="btn-primary">Save</button>
                </div>
            `;
            
            cameraPanel.appendChild(editorControls);
            
            this.setupFilterControls();
        }
    }
    
    setupFilterControls() {
        // Brightness slider
        const brightnessSlider = document.getElementById('brightness-slider');
        if (brightnessSlider) {
            brightnessSlider.addEventListener('input', (e) => {
                this.currentFilters.brightness = parseInt(e.target.value);
                this.updateFilterValue('brightness-slider', e.target.value);
                this.previewFilter();
            });
        }
        
        // Contrast slider
        const contrastSlider = document.getElementById('contrast-slider');
        if (contrastSlider) {
            contrastSlider.addEventListener('input', (e) => {
                this.currentFilters.contrast = parseInt(e.target.value);
                this.updateFilterValue('contrast-slider', e.target.value);
                this.previewFilter();
            });
        }
        
        // Saturation slider
        const saturationSlider = document.getElementById('saturation-slider');
        if (saturationSlider) {
            saturationSlider.addEventListener('input', (e) => {
                this.currentFilters.saturation = parseInt(e.target.value);
                this.updateFilterValue('saturation-slider', e.target.value);
                this.previewFilter();
            });
        }
        
        // Sharpness slider
        const sharpnessSlider = document.getElementById('sharpness-slider');
        if (sharpnessSlider) {
            sharpnessSlider.addEventListener('input', (e) => {
                this.currentFilters.sharpness = parseInt(e.target.value);
                this.updateFilterValue('sharpness-slider', e.target.value);
                this.previewFilter();
            });
        }
        
        // Enhancement buttons
        const enhanceBtn = document.getElementById('enhance-btn');
        if (enhanceBtn) {
            enhanceBtn.addEventListener('click', () => {
                this.enhanceImage();
            });
        }
        
        const resetBtn = document.getElementById('reset-btn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.resetFilters();
            });
        }
        
        const saveBtn = document.getElementById('save-btn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                this.saveImage();
            });
        }
    }
    
    updateFilterValue(sliderId, value) {
        const slider = document.getElementById(sliderId);
        if (slider) {
            const valueSpan = slider.parentElement.querySelector('.filter-value');
            if (valueSpan) {
                valueSpan.textContent = value;
            }
        }
    }
    
    previewFilter() {
        // Apply filters to current image preview
        const cameraFeed = document.getElementById('camera-feed');
        if (cameraFeed) {
            const img = cameraFeed.querySelector('img');
            if (img) {
                this.applyFiltersToImage(img);
            }
        }
    }
    
    applyFiltersToImage(img) {
        const filters = [];
        
        if (this.currentFilters.brightness !== 0) {
            filters.push(`brightness(${100 + this.currentFilters.brightness}%)`);
        }
        
        if (this.currentFilters.contrast !== 0) {
            filters.push(`contrast(${100 + this.currentFilters.contrast}%)`);
        }
        
        if (this.currentFilters.saturation !== 0) {
            filters.push(`saturate(${100 + this.currentFilters.saturation}%)`);
        }
        
        if (this.currentFilters.sharpness > 0) {
            // Apply sharpness using CSS filter (simplified)
            const blur = Math.max(0, 1 - this.currentFilters.sharpness / 100);
            filters.push(`blur(${blur}px)`);
        }
        
        img.style.filter = filters.join(' ');
    }
    
    async enhanceImage() {
        if (this.isProcessing) {
            console.log('Image processing already in progress...');
            return;
        }
        
        this.isProcessing = true;
        this.updateEnhanceButton();
        
        try {
            const imageData = await this.getCurrentImage();
            
            if (imageData) {
                const enhancedImage = await this.sendForEnhancement(imageData);
                this.handleEnhancedImage(enhancedImage);
            } else {
                console.log('No image available for enhancement');
            }
        } catch (error) {
            console.error('Error during image enhancement:', error);
            this.showNotification('Enhancement failed', 'error');
        } finally {
            this.isProcessing = false;
            this.updateEnhanceButton();
        }
    }
    
    async getCurrentImage() {
        const cameraFeed = document.getElementById('camera-feed');
        if (cameraFeed) {
            const img = cameraFeed.querySelector('img');
            if (img && img.src) {
                return img.src;
            }
        }
        return null;
    }
    
    async sendForEnhancement(imageData) {
        try {
            const response = await fetch('/api/image/enhance', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    image: imageData,
                    filters: this.currentFilters
                })
            });
            
            if (response.ok) {
                return await response.json();
            } else {
                throw new Error('Enhancement request failed');
            }
        } catch (error) {
            console.error('Error sending image for enhancement:', error);
            throw error;
        }
    }
    
    handleEnhancedImage(result) {
        if (result.success && result.enhanced) {
            this.showNotification('Image enhanced successfully!', 'success');
            // Apply enhanced image to display
            this.displayEnhancedImage(result.imageUrl);
        } else {
            this.showNotification('Enhancement failed', 'error');
        }
    }
    
    displayEnhancedImage(imageUrl) {
        const cameraFeed = document.getElementById('camera-feed');
        if (cameraFeed) {
            const img = cameraFeed.querySelector('img');
            if (img) {
                img.src = imageUrl;
            }
        }
    }
    
    resetFilters() {
        this.currentFilters = {
            brightness: 0,
            contrast: 0,
            saturation: 0,
            sharpness: 0
        };
        
        // Reset sliders
        const sliders = ['brightness-slider', 'contrast-slider', 'saturation-slider', 'sharpness-slider'];
        sliders.forEach(sliderId => {
            const slider = document.getElementById(sliderId);
            if (slider) {
                slider.value = 0;
                this.updateFilterValue(sliderId, 0);
            }
        });
        
        // Reset image
        this.previewFilter();
        this.showNotification('Filters reset', 'info');
    }
    
    saveImage() {
        const cameraFeed = document.getElementById('camera-feed');
        if (cameraFeed) {
            const img = cameraFeed.querySelector('img');
            if (img && img.src) {
                // Create download link
                const link = document.createElement('a');
                link.href = img.src;
                link.download = `drahms-vision-${Date.now()}.jpg`;
                link.click();
                
                this.showNotification('Image saved successfully!', 'success');
            } else {
                this.showNotification('No image to save', 'error');
            }
        }
    }
    
    updateEnhanceButton() {
        const enhanceBtn = document.getElementById('enhance-btn');
        if (enhanceBtn) {
            if (this.isProcessing) {
                enhanceBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
                enhanceBtn.disabled = true;
            } else {
                enhanceBtn.innerHTML = 'Enhance';
                enhanceBtn.disabled = false;
            }
        }
    }
    
    showNotification(message, type = 'info') {
        if (window.drahmsVisionApp) {
            window.drahmsVisionApp.showNotification(message, type);
        }
    }
}

// Initialize image editor controller when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.imageEditorController = new ImageEditorController();
});
