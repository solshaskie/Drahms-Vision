// Drahms Vision - Object Identification Module
// Handles AI-powered object recognition and identification

class ObjectIdentificationController {
    constructor() {
        this.isIdentifying = false;
        this.lastResults = [];
        this.confidenceThreshold = 0.7;
        
        this.init();
    }
    
    init() {
        console.log('🔍 Initializing Object Identification Controller...');
        this.setupIdentificationUI();
    }
    
    setupIdentificationUI() {
        // Add identification button to camera controls
        const cameraControls = document.querySelector('.camera-controls');
        if (cameraControls) {
            const identifyBtn = document.createElement('button');
            identifyBtn.className = 'btn-secondary';
            identifyBtn.id = 'identify-btn';
            identifyBtn.innerHTML = '<i class="fas fa-search"></i> Identify';
            identifyBtn.addEventListener('click', () => {
                this.identifyObject();
            });
            cameraControls.appendChild(identifyBtn);
        }
    }
    
    async identifyObject() {
        if (this.isIdentifying) {
            console.log('Identification already in progress...');
            return;
        }
        
        this.isIdentifying = true;
        this.updateIdentifyButton();
        
        try {
            // Get current camera image
            const imageData = await this.getCurrentImage();
            
            if (imageData) {
                // Send to identification API
                const results = await this.sendForIdentification(imageData);
                this.handleIdentificationResults(results);
            } else {
                console.log('No image available for identification');
            }
        } catch (error) {
            console.error('Error during object identification:', error);
            this.showNotification('Identification failed', 'error');
        } finally {
            this.isIdentifying = false;
            this.updateIdentifyButton();
        }
    }
    
    async getCurrentImage() {
        // Get current camera feed image
        const cameraFeed = document.getElementById('camera-feed');
        if (cameraFeed) {
            const img = cameraFeed.querySelector('img');
            if (img && img.src) {
                return img.src;
            }
        }
        return null;
    }
    
    async sendForIdentification(imageData) {
        try {
            const response = await fetch('/api/identify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    image: imageData,
                    confidence_threshold: this.confidenceThreshold
                })
            });
            
            if (response.ok) {
                return await response.json();
            } else {
                throw new Error('Identification request failed');
            }
        } catch (error) {
            console.error('Error sending image for identification:', error);
            throw error;
        }
    }
    
    handleIdentificationResults(results) {
        this.lastResults = results.results || [];
        
        if (this.lastResults.length > 0) {
            this.displayResults(this.lastResults);
            this.showNotification(`Identified ${this.lastResults.length} object(s)`, 'success');
        } else {
            this.showNotification('No objects identified', 'info');
        }
    }
    
    displayResults(results) {
        // Create results display
        const resultsContainer = document.createElement('div');
        resultsContainer.className = 'identification-results';
        resultsContainer.innerHTML = `
            <h3>Identified Objects</h3>
            <div class="results-list">
                ${results.map(result => `
                    <div class="result-item">
                        <div class="result-label">${result.label}</div>
                        <div class="result-confidence">${(result.confidence * 100).toFixed(1)}%</div>
                        <div class="result-type">${result.type || 'Unknown'}</div>
                    </div>
                `).join('')}
            </div>
        `;
        
        // Remove existing results
        const existingResults = document.querySelector('.identification-results');
        if (existingResults) {
            existingResults.remove();
        }
        
        // Add new results
        document.body.appendChild(resultsContainer);
        
        // Remove after 10 seconds
        setTimeout(() => {
            resultsContainer.remove();
        }, 10000);
    }
    
    updateIdentifyButton() {
        const identifyBtn = document.getElementById('identify-btn');
        if (identifyBtn) {
            if (this.isIdentifying) {
                identifyBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Identifying...';
                identifyBtn.disabled = true;
            } else {
                identifyBtn.innerHTML = '<i class="fas fa-search"></i> Identify';
                identifyBtn.disabled = false;
            }
        }
    }
    
    showNotification(message, type = 'info') {
        if (window.drahmsVisionApp) {
            window.drahmsVisionApp.showNotification(message, type);
        }
    }
    
    setConfidenceThreshold(threshold) {
        this.confidenceThreshold = Math.max(0, Math.min(1, threshold));
        console.log(`Confidence threshold set to: ${this.confidenceThreshold}`);
    }
    
    getLastResults() {
        return this.lastResults;
    }
    
    clearResults() {
        this.lastResults = [];
        const existingResults = document.querySelector('.identification-results');
        if (existingResults) {
            existingResults.remove();
        }
    }
}

// Initialize object identification controller when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.objectIdentificationController = new ObjectIdentificationController();
});
