/**
 * Enhanced Accessibility Module
 * WCAG 2.1 AA Compliance Features
 */

// Initialize accessibility features when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeAccessibility();
    initializeKeyboardNavigation();
    initializeScreenReaderSupport();
    initializeMotionPreferences();
});

/**
 * Initialize core accessibility features
 */
function initializeAccessibility() {
    // High contrast mode support
    updateContrastMode();

    // Focus management
    enhanceFocusVisibility();

    // Screen reader announcements
    initializeAriaLiveRegions();

    // Touch target size compliance
    ensureMinimumTouchTargets();

    console.log('🚀 Accessibility features initialized');
}

/**
 * Keyboard navigation system with logical tab order
 */
function initializeKeyboardNavigation() {
    // Enhanced focus indicators
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Tab') {
            document.body.classList.add('keyboard-navigation');
        }
    });

    document.addEventListener('mousedown', function() {
        document.body.classList.remove('keyboard-navigation');
    });

    // Skip links for screen readers
    createSkipLinks();
}

/**
 * Create skip navigation links for better accessibility
 */
function createSkipLinks() {
    const skipLinks = document.createElement('div');
    skipLinks.className = 'skip-links';
    skipLinks.innerHTML = `
        <a href="#main-content" class="skip-link">Skip to main content</a>
        <a href="#sidebar-nav" class="skip-link">Skip to navigation</a>
        <a href="#camera-controls" class="skip-link">Skip to camera controls</a>
    `;

    // Insert before main content
    const appContainer = document.querySelector('.app-container');
    if (appContainer) {
        appContainer.insertBefore(skipLinks, appContainer.firstChild);
    }
}

/**
 * Screen reader support with live regions
 */
function initializeAriaLiveRegions() {
    // Create live regions for dynamic updates
    const liveRegion = document.createElement('div');
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.className = 'sr-only';
    liveRegion.id = 'status-live-region';
    document.body.appendChild(liveRegion);

    // Override notification system to use live regions
    const originalNotification = window.showNotification;
    window.showNotification = function(type, message) {
        liveRegion.textContent = message;
        if (originalNotification) {
            originalNotification(type, message);
        }
    };
}

/**
 * Enhanced focus visibility for accessibility
 */
function enhanceFocusVisibility() {
    // Ensure all interactive elements have visible focus
    const focusableElements = document.querySelectorAll(
        'button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    focusableElements.forEach(element => {
        element.addEventListener('focus', function() {
            this.setAttribute('data-focused', 'true');
        });

        element.addEventListener('blur', function() {
            this.removeAttribute('data-focused');
        });
    });
}

/**
 * Update high contrast mode based on user preference
 */
function updateContrastMode() {
    const prefersHighContrast = window.matchMedia('(prefers-contrast: high)').matches;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersHighContrast) {
        document.body.classList.add('high-contrast');
    }

    if (prefersReducedMotion) {
        document.body.classList.add('reduced-motion');
    }

    // Listen for changes
    window.matchMedia('(prefers-contrast: high)').addEventListener('change', function(e) {
        document.body.classList.toggle('high-contrast', e.matches);
    });

    window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', function(e) {
        document.body.classList.toggle('reduced-motion', e.matches);
    });
}

/**
 * Ensure minimum touch target sizes (44px minimum)
 */
function ensureMinimumTouchTargets() {
    const touchTargets = document.querySelectorAll('button, a, input[type="button"], input[type="submit"]');

    touchTargets.forEach(element => {
        const styles = window.getComputedStyle(element);
        const minWidth = Math.max(
            parseInt(styles.width) || 0,
            parseInt(styles.minWidth) || 0,
            parseInt(styles.paddingLeft) + parseInt(styles.paddingRight) + 44
        );

        const minHeight = Math.max(
            parseInt(styles.height) || 0,
            parseInt(styles.minHeight) || 0,
            parseInt(styles.paddingTop) + parseInt(styles.paddingBottom) + 44
        );

        if (minWidth < 44) {
            element.style.minWidth = '44px';
        }

        if (minHeight < 44) {
            element.style.minHeight = '44px';
        }
    });
}

/**
 * Initialize motion preferences support
 */
function initializeMotionPreferences() {
    // Add reduced motion CSS when preference is detected
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    function handleMotionPreference(e) {
        if (e.matches) {
            document.documentElement.style.setProperty('--transition-fast', 'none');
            document.documentElement.style.setProperty('--transition-base', 'none');
            document.documentElement.style.setProperty('--transition-slow', 'none');
        } else {
            // Reset to default values
            document.documentElement.style.setProperty('--transition-fast', '0.15s ease');
            document.documentElement.style.setProperty('--transition-base', '0.2s ease');
            document.documentElement.style.setProperty('--transition-slow', '0.3s cubic-bezier(0.34, 1.56, 0.64, 1)');
        }
    }

    mediaQuery.addEventListener('change', handleMotionPreference);
    handleMotionPreference(mediaQuery);
}

/**
 * Keyboard accessibility enhancements
 */
const keyboardAccessibility = {
    /**
     * Handle Enter/Space key presses for custom controls
     */
    handleKeyPress(event, action) {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            action();
        }
    },

    /**
     * Handle arrow key navigation for custom components
     */
    handleArrowNavigation(event, items, currentIndex, setCurrentIndex) {
        let newIndex = currentIndex;

        switch (event.key) {
            case 'ArrowLeft':
            case 'ArrowUp':
                event.preventDefault();
                newIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
                break;
            case 'ArrowRight':
            case 'ArrowDown':
                event.preventDefault();
                newIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
                break;
            case 'Home':
                event.preventDefault();
                newIndex = 0;
                break;
            case 'End':
                event.preventDefault();
                newIndex = items.length - 1;
                break;
        }

        if (newIndex !== currentIndex) {
            setCurrentIndex(newIndex);
            this.announceToScreenReader(`Item ${newIndex + 1} of ${items.length}`);
        }
    },

    /**
     * Announce changes to screen readers
     */
    announceToScreenReader(message) {
        const liveRegion = document.getElementById('status-live-region');
        if (liveRegion) {
            liveRegion.textContent = message;
        }
    }
};

/**
 * Focus trap for modals and dialogs
 */
class FocusTrap {
    constructor(element) {
        this.element = element;
        this.firstFocusable = null;
        this.lastFocusable = null;
        this.focusableElements = null;
    }

    activate() {
        this.updateFocusableElements();
        if (this.firstFocusable) {
            this.firstFocusable.focus();
        }

        this.element.addEventListener('keydown', this.handleKeyDown.bind(this));
        document.addEventListener('focusin', this.handleFocusIn.bind(this));
    }

    deactivate() {
        this.element.removeEventListener('keydown', this.handleKeyDown.bind(this));
        document.removeEventListener('focusin', this.handleFocusIn.bind(this));
    }

    updateFocusableElements() {
        const focusableSelector = `
            a[href], area[href], input:not([disabled]),
            select:not([disabled]), textarea:not([disabled]),
            button:not([disabled]), iframe,
            object, embed, *[tabindex],
            *[contenteditable]
        `;

        this.focusableElements = Array.from(this.element.querySelectorAll(focusableSelector))
            .filter(el => el.tabIndex !== -1 && !el.disabled && el.offsetParent !== null);

        this.firstFocusable = this.focusableElements[0];
        this.lastFocusable = this.focusableElements[this.focusableElements.length - 1];
    }

    handleKeyDown(event) {
        if (event.key === 'Tab') {
            if (event.shiftKey) {
                if (document.activeElement === this.firstFocusable) {
                    event.preventDefault();
                    this.lastFocusable.focus();
                }
            } else {
                if (document.activeElement === this.lastFocusable) {
                    event.preventDefault();
                    this.firstFocusable.focus();
                }
            }
        }

        if (event.key === 'Escape') {
            this.deactivate();
            // Trigger close event or callback
            this.element.dispatchEvent(new CustomEvent('focus-trap-escape'));
        }
    }

    handleFocusIn(event) {
        if (!this.element.contains(event.target)) {
            this.firstFocusable.focus();
        }
    }
}

/**
 * Screen reader utilities
 */
const screenReaderUtils = {
    /**
     * Hide content visually but keep it for screen readers
     */
    hideVisually(element) {
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }

        if (!element) return;

        element.style.position = 'absolute';
        element.style.left = '-10000px';
        element.style.width = '1px';
        element.style.height = '1px';
        element.style.overflow = 'hidden';
    },

    /**
     * Announce dynamic content changes
     */
    announceChange(message, priority = 'polite') {
        let liveRegion = document.getElementById('dynamic-live-region');
        if (!liveRegion) {
            liveRegion = document.createElement('div');
            liveRegion.id = 'dynamic-live-region';
            liveRegion.setAttribute('aria-live', priority);
            liveRegion.setAttribute('aria-atomic', 'true');
            liveRegion.className = 'sr-only';
            document.body.appendChild(liveRegion);
        }

        liveRegion.textContent = message;

        // Clear after announcement
        setTimeout(() => {
            liveRegion.textContent = '';
        }, 1000);
    },

    /**
     * Add descriptive labels for complex UI elements
     */
    addDescriptiveLabel(element, label) {
        element.setAttribute('aria-label', label);
    }
};

/**
 * Color contrast utilities for dynamic content
 */
const contrastUtils = {
    /**
     * Check if color combination meets WCAG standards
     */
    meetsMinimumContrast(foreground, background, size = 'normal') {
        // Simplified contrast check - implement full WCAG algorithm
        const contrastRatio = this.calculateContrastRatio(foreground, background);
        const isLargeText = size === 'large';
        return isLargeText ? contrastRatio >= 3 : contrastRatio >= 4.5;
    },

    /**
     * Calculate contrast ratio between two colors
     */
    calculateContrastRatio(color1, color2) {
        // Simplified implementation - use proper color math in production
        return 4.5; // Placeholder
    }
};

// Global accessibility API
window.accessibilityUtils = {
    keyboard: keyboardAccessibility,
    screenReader: screenReaderUtils,
    contrast: contrastUtils,
    FocusTrap,
    announceChange: screenReaderUtils.announceChange,
    addDescriptiveLabel: screenReaderUtils.addDescriptiveLabel
};

// Automatic accessibility testing (development only)
if (process.env.NODE_ENV === 'development') {
    console.log('🔍 Running accessibility audit...');

    // Basic accessibility checks
    setTimeout(() => {
        const images = document.querySelectorAll('img[alt=""]');
        if (images.length > 0) {
            console.warn('⚠️  Images found without alt text:', images.length);
        }

        const buttons = document.querySelectorAll('button:not([aria-label]):not([aria-labelledby])');
        if (buttons.length > 0) {
            console.warn('⚠️  Buttons found without accessible labels:', buttons.length);
        }

        console.log('✅ Accessibility audit completed');
    }, 1000);
}
