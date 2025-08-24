// Drahms Vision - UI Controller Module
// Handles user interface interactions, animations, and responsive design

class UIController {
    constructor() {
        this.isDarkMode = false;
        this.isFullscreen = false;
        this.currentTheme = 'default';
        
        this.init();
    }
    
    init() {
        console.log('🎨 Initializing UI Controller...');
        this.setupUI();
        this.setupEventListeners();
        this.loadUserPreferences();
    }
    
    setupUI() {
        this.setupNotifications();
        this.setupThemeToggle();
        this.setupResponsiveDesign();
    }
    
    setupNotifications() {
        // Create notification container
        const notificationContainer = document.createElement('div');
        notificationContainer.id = 'notification-container';
        notificationContainer.className = 'notification-container';
        document.body.appendChild(notificationContainer);
    }
    
    setupThemeToggle() {
        // Add theme toggle button to header
        const headerRight = document.querySelector('.header-right');
        if (headerRight) {
            const themeBtn = document.createElement('button');
            themeBtn.className = 'btn-secondary theme-toggle';
            themeBtn.innerHTML = '<i class="fas fa-moon"></i>';
            themeBtn.title = 'Toggle Dark Mode';
            themeBtn.addEventListener('click', () => {
                this.toggleDarkMode();
            });
            headerRight.appendChild(themeBtn);
        }
    }
    
    setupResponsiveDesign() {
        // Handle responsive design changes
        window.addEventListener('resize', () => {
            this.handleResize();
        });
        
        // Initial resize handling
        this.handleResize();
    }
    
    setupEventListeners() {
        // Fullscreen toggle
        document.addEventListener('keydown', (e) => {
            if (e.key === 'F11') {
                e.preventDefault();
                this.toggleFullscreen();
            }
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });
        
        // Touch gestures for mobile
        this.setupTouchGestures();
    }
    
    setupTouchGestures() {
        let startX = 0;
        let startY = 0;
        let startTime = 0;
        
        document.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            startTime = Date.now();
        });
        
        document.addEventListener('touchend', (e) => {
            const endX = e.changedTouches[0].clientX;
            const endY = e.changedTouches[0].clientY;
            const endTime = Date.now();
            
            const deltaX = endX - startX;
            const deltaY = endY - startY;
            const deltaTime = endTime - startTime;
            
            // Swipe detection
            if (deltaTime < 300 && Math.abs(deltaX) > 50) {
                if (deltaX > 0) {
                    this.handleSwipeRight();
                } else {
                    this.handleSwipeLeft();
                }
            }
            
            // Tap detection
            if (deltaTime < 200 && Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10) {
                this.handleTap(endX, endY);
            }
        });
    }
    
    handleSwipeRight() {
        console.log('Swipe right detected');
        // Navigate to previous panel or action
    }
    
    handleSwipeLeft() {
        console.log('Swipe left detected');
        // Navigate to next panel or action
    }
    
    handleTap(x, y) {
        console.log('Tap detected at:', x, y);
        // Handle tap events
    }
    
    handleKeyboardShortcuts(e) {
        // Camera controls
        if (e.key === ' ') {
            e.preventDefault();
            if (window.cameraController) {
                window.cameraController.captureImage();
            }
        }
        
        // Recording toggle
        if (e.key === 'r' || e.key === 'R') {
            e.preventDefault();
            if (window.cameraController) {
                window.cameraController.toggleRecording();
            }
        }
        
        // Settings
        if (e.key === 's' || e.key === 'S') {
            e.preventDefault();
            if (window.drahmsVisionApp) {
                window.drahmsVisionApp.showSettings();
            }
        }
        
        // Help
        if (e.key === 'h' || e.key === 'H') {
            e.preventDefault();
            this.showHelp();
        }
    }
    
    handleResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        // Adjust layout for different screen sizes
        if (width < 768) {
            this.enableMobileLayout();
        } else {
            this.enableDesktopLayout();
        }
        
        // Update camera feed aspect ratio
        this.updateCameraFeedAspectRatio();
    }
    
    enableMobileLayout() {
        document.body.classList.add('mobile-layout');
        document.body.classList.remove('desktop-layout');
    }
    
    enableDesktopLayout() {
        document.body.classList.add('desktop-layout');
        document.body.classList.remove('mobile-layout');
    }
    
    updateCameraFeedAspectRatio() {
        const cameraFeed = document.getElementById('camera-feed');
        if (cameraFeed) {
            const aspectRatio = window.innerWidth < 768 ? '4/3' : '16/9';
            cameraFeed.style.aspectRatio = aspectRatio;
        }
    }
    
    toggleDarkMode() {
        this.isDarkMode = !this.isDarkMode;
        document.body.classList.toggle('dark-mode', this.isDarkMode);
        
        // Update theme button
        const themeBtn = document.querySelector('.theme-toggle');
        if (themeBtn) {
            themeBtn.innerHTML = this.isDarkMode ? 
                '<i class="fas fa-sun"></i>' : 
                '<i class="fas fa-moon"></i>';
        }
        
        // Save preference
        localStorage.setItem('drahmsVisionDarkMode', this.isDarkMode);
        
        // Show notification
        this.showNotification(
            this.isDarkMode ? 'Dark mode enabled' : 'Light mode enabled',
            'info'
        );
    }
    
    toggleFullscreen() {
        if (!this.isFullscreen) {
            this.enterFullscreen();
        } else {
            this.exitFullscreen();
        }
    }
    
    enterFullscreen() {
        const elem = document.documentElement;
        if (elem.requestFullscreen) {
            elem.requestFullscreen();
        } else if (elem.webkitRequestFullscreen) {
            elem.webkitRequestFullscreen();
        } else if (elem.msRequestFullscreen) {
            elem.msRequestFullscreen();
        }
        
        this.isFullscreen = true;
        document.body.classList.add('fullscreen');
    }
    
    exitFullscreen() {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
        
        this.isFullscreen = false;
        document.body.classList.remove('fullscreen');
    }
    
    showHelp() {
        const helpContent = `
            <div class="help-modal">
                <h2>Drahms Vision - Help</h2>
                <div class="help-content">
                    <h3>Keyboard Shortcuts:</h3>
                    <ul>
                        <li><strong>Spacebar:</strong> Capture image</li>
                        <li><strong>R:</strong> Toggle recording</li>
                        <li><strong>S:</strong> Settings</li>
                        <li><strong>H:</strong> Help</li>
                        <li><strong>F11:</strong> Toggle fullscreen</li>
                    </ul>
                    
                    <h3>Touch Gestures:</h3>
                    <ul>
                        <li><strong>Swipe Left/Right:</strong> Navigate panels</li>
                        <li><strong>Tap:</strong> Select objects</li>
                    </ul>
                    
                    <h3>Camera Controls:</h3>
                    <ul>
                        <li>Use sliders to adjust camera settings</li>
                        <li>Click buttons to capture or record</li>
                        <li>Use identification for object recognition</li>
                    </ul>
                </div>
                <button class="btn-primary" onclick="this.parentElement.remove()">Close</button>
            </div>
        `;
        
        const helpElement = document.createElement('div');
        helpElement.className = 'help-overlay';
        helpElement.innerHTML = helpContent;
        document.body.appendChild(helpElement);
    }
    
    showNotification(message, type = 'info', duration = 3000) {
        const notificationContainer = document.getElementById('notification-container');
        if (!notificationContainer) return;
        
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-message">${message}</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        notificationContainer.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        // Auto remove
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, duration);
    }
    
    loadUserPreferences() {
        // Load dark mode preference
        const darkMode = localStorage.getItem('drahmsVisionDarkMode');
        if (darkMode === 'true') {
            this.isDarkMode = true;
            document.body.classList.add('dark-mode');
        }
        
        // Load theme preference
        const theme = localStorage.getItem('drahmsVisionTheme');
        if (theme) {
            this.currentTheme = theme;
            this.applyTheme(theme);
        }
    }
    
    applyTheme(theme) {
        document.body.setAttribute('data-theme', theme);
        this.currentTheme = theme;
        localStorage.setItem('drahmsVisionTheme', theme);
    }
    
    showLoadingSpinner(message = 'Loading...') {
        const spinner = document.createElement('div');
        spinner.className = 'loading-spinner-overlay';
        spinner.innerHTML = `
            <div class="loading-spinner">
                <div class="spinner"></div>
                <p>${message}</p>
            </div>
        `;
        document.body.appendChild(spinner);
        
        return spinner;
    }
    
    hideLoadingSpinner(spinner) {
        if (spinner) {
            spinner.remove();
        }
    }
    
    animateElement(element, animation, duration = 300) {
        element.style.animation = `${animation} ${duration}ms ease-in-out`;
        
        setTimeout(() => {
            element.style.animation = '';
        }, duration);
    }
}

// Initialize UI controller when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.uiController = new UIController();
});
