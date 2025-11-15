// Accessibility Manager
class AccessibilityManager {
    constructor() {
        this.settings = {
            screenReader: true,
            highContrast: false,
            textSize: 'normal',
            buttonSize: 'normal',
            focusIndicator: true,
            speechRate: 1.0,
            speechPitch: 1.0,
            speechVolume: 1.0
        };
        this.liveRegionId = 'sr-announcements';
        this.screenReaderStorageKey = 'accessibilityScreenReaderEnabled';
        
        this.loadSettings();
        this.setScreenReaderEnabled(this.settings.screenReader, false);
        this.initializeControls();
        this.applySettings();
    }

    loadSettings() {
        const saved = localStorage.getItem('accessibilitySettings');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (Object.prototype.hasOwnProperty.call(parsed, 'screenReader')) {
                    delete parsed.screenReader;
                    localStorage.setItem('accessibilitySettings', JSON.stringify(parsed));
                }
                this.settings = { ...this.settings, ...parsed };
            } catch (error) {
                console.warn('Unable to parse accessibility settings', error);
            }
        }

        // Screen reader toggle is session-based so it's always on by default each visit
        try {
            const storedValue = sessionStorage.getItem(this.screenReaderStorageKey);
            if (storedValue === null) {
                sessionStorage.setItem(this.screenReaderStorageKey, 'true');
                this.settings.screenReader = true;
            } else {
                this.settings.screenReader = storedValue === 'true';
            }
        } catch (error) {
            console.warn('Session storage unavailable. Defaulting screen reader announcements to on.');
            this.settings.screenReader = true;
        }
    }

    saveSettings() {
        const { screenReader, ...persistable } = this.settings;
        localStorage.setItem('accessibilitySettings', JSON.stringify(persistable));
        this.saveScreenReaderPreference(screenReader);
    }

    saveScreenReaderPreference(enabled) {
        try {
            sessionStorage.setItem(this.screenReaderStorageKey, String(enabled));
        } catch (error) {
            console.warn('Unable to persist screen reader preference for this session.');
        }
    }

    initializeControls() {
        // Toggle accessibility panel
        const toggle = document.getElementById('accessibility-toggle');
        const panel = document.getElementById('accessibility-panel');
        
        if (toggle && panel) {
            toggle.addEventListener('click', () => {
                const isHidden = panel.hasAttribute('hidden');
                if (isHidden) {
                    panel.removeAttribute('hidden');
                    toggle.setAttribute('aria-expanded', 'true');
                    this.announce('Accessibility panel opened');
                } else {
                    panel.setAttribute('hidden', '');
                    toggle.setAttribute('aria-expanded', 'false');
                    this.announce('Accessibility panel closed');
                }
            });

            // Close panel when clicking outside
            document.addEventListener('click', (e) => {
                if (!panel.contains(e.target) && !toggle.contains(e.target)) {
                    if (!panel.hasAttribute('hidden')) {
                        panel.setAttribute('hidden', '');
                        toggle.setAttribute('aria-expanded', 'false');
                    }
                }
            });
        }

        // Screen reader toggle
        const srToggle = document.getElementById('screen-reader-toggle');
        if (srToggle) {
            srToggle.checked = this.settings.screenReader;
            srToggle.addEventListener('change', () => {
                this.setScreenReaderEnabled(srToggle.checked, true);
                if (!srToggle.checked) {
                    this.clearLiveRegion();
                } else {
                    this.announceFocusedElement(document.activeElement || document.body);
                }
            });
        }

        // High contrast toggle
        const hcToggle = document.getElementById('high-contrast-toggle');
        if (hcToggle) {
            hcToggle.checked = this.settings.highContrast;
            hcToggle.addEventListener('change', () => {
                this.settings.highContrast = hcToggle.checked;
                this.applyHighContrast();
                this.saveSettings();
                this.announce(hcToggle.checked ? 'High contrast mode enabled' : 'High contrast mode disabled');
            });
        }

        // Text size
        const textSize = document.getElementById('text-size');
        if (textSize) {
            textSize.value = this.settings.textSize;
            textSize.addEventListener('change', () => {
                this.settings.textSize = textSize.value;
                this.applyTextSize();
                this.saveSettings();
                this.announce(`Text size changed to ${textSize.options[textSize.selectedIndex].text}`);
            });
        }

        // Button size
        const buttonSize = document.getElementById('button-size');
        if (buttonSize) {
            buttonSize.value = this.settings.buttonSize;
            buttonSize.addEventListener('change', () => {
                this.settings.buttonSize = buttonSize.value;
                this.applyButtonSize();
                this.saveSettings();
                this.announce(`Button size changed to ${buttonSize.options[buttonSize.selectedIndex].text}`);
            });
        }

        // Focus indicator
        const focusToggle = document.getElementById('focus-indicator');
        if (focusToggle) {
            focusToggle.checked = this.settings.focusIndicator;
            focusToggle.addEventListener('change', () => {
                this.settings.focusIndicator = focusToggle.checked;
                this.applyFocusIndicator();
                this.saveSettings();
                this.announce(focusToggle.checked ? 'Enhanced focus indicators enabled' : 'Enhanced focus indicators disabled');
            });
        }

        // Speech controls
        this.setupSpeechControls();

        // Detect keyboard navigation
        this.setupKeyboardDetection();
    }

    setupSpeechControls() {
        // Speech rate
        const rateSlider = document.getElementById('speech-rate');
        const rateValue = document.getElementById('speech-rate-value');
        if (rateSlider && rateValue) {
            rateSlider.value = this.settings.speechRate;
            rateValue.textContent = this.settings.speechRate.toFixed(1) + 'x';
            rateSlider.addEventListener('input', () => {
                this.settings.speechRate = parseFloat(rateSlider.value);
                rateValue.textContent = this.settings.speechRate.toFixed(1) + 'x';
                this.saveSettings();
            });
        }

        // Speech pitch
        const pitchSlider = document.getElementById('speech-pitch');
        const pitchValue = document.getElementById('speech-pitch-value');
        if (pitchSlider && pitchValue) {
            pitchSlider.value = this.settings.speechPitch;
            pitchValue.textContent = this.settings.speechPitch.toFixed(1) + 'x';
            pitchSlider.addEventListener('input', () => {
                this.settings.speechPitch = parseFloat(pitchSlider.value);
                pitchValue.textContent = this.settings.speechPitch.toFixed(1) + 'x';
                this.saveSettings();
            });
        }

        // Speech volume
        const volumeSlider = document.getElementById('speech-volume');
        const volumeValue = document.getElementById('speech-volume-value');
        if (volumeSlider && volumeValue) {
            volumeSlider.value = this.settings.speechVolume;
            volumeValue.textContent = Math.round(this.settings.speechVolume * 100) + '%';
            volumeSlider.addEventListener('input', () => {
                this.settings.speechVolume = parseFloat(volumeSlider.value);
                volumeValue.textContent = Math.round(this.settings.speechVolume * 100) + '%';
                this.saveSettings();
            });
        }

        // Test speech button
        const testButton = document.getElementById('test-speech');
        if (testButton) {
            testButton.addEventListener('click', () => {
                this.announce('This is a test of the speech settings. Rate: ' + this.settings.speechRate.toFixed(1) + ', Pitch: ' + this.settings.speechPitch.toFixed(1) + ', Volume: ' + Math.round(this.settings.speechVolume * 100) + ' percent', 'assertive');
            });
        }
    }

    applySettings() {
        this.applyHighContrast();
        this.applyTextSize();
        this.applyButtonSize();
        this.applyFocusIndicator();
    }

    applyHighContrast() {
        if (this.settings.highContrast) {
            document.body.classList.add('high-contrast');
        } else {
            document.body.classList.remove('high-contrast');
        }
    }

    applyTextSize() {
        document.body.classList.remove('text-normal', 'text-large', 'text-xlarge', 'text-xxlarge');
        document.body.classList.add(`text-${this.settings.textSize}`);
    }

    applyButtonSize() {
        document.body.classList.remove('button-normal', 'button-large', 'button-xlarge');
        document.body.classList.add(`button-${this.settings.buttonSize}`);
    }

    applyFocusIndicator() {
        if (this.settings.focusIndicator) {
            document.body.classList.add('enhanced-focus');
        } else {
            document.body.classList.remove('enhanced-focus');
        }
    }

    setupKeyboardDetection() {
        let isTabKeyPressed = false;

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                isTabKeyPressed = true;
                document.body.classList.add('keyboard-user');
            }
        });

        document.addEventListener('mousedown', () => {
            if (isTabKeyPressed) {
                document.body.classList.remove('keyboard-user');
                isTabKeyPressed = false;
            }
        });

        // Announce focused elements
        document.addEventListener('focusin', (e) => {
            this.announceFocusedElement(e.target);
        });
    }

    announceFocusedElement(element) {
        if (!this.settings.screenReader) {
            console.log('[Screen Reader] Focus announcement blocked - screen reader disabled');
            return;
        }
        if (!element || !element.tagName) {
            console.log('[Screen Reader] Focus announcement blocked - invalid element');
            return;
        }

        let announcement = '';
        const tagName = element.tagName.toLowerCase();
        const role = element.getAttribute('role') || '';
        const ariaLabel = element.getAttribute('aria-label');
        const ariaLabelledBy = element.getAttribute('aria-labelledby');
        const label = this.getElementLabel(element);
        const type = element.getAttribute('type');
        const value = element.value;
        const placeholder = element.getAttribute('placeholder');

        // Build announcement based on element type
        if (ariaLabel) {
            announcement = ariaLabel;
        } else if (ariaLabelledBy) {
            const labelElement = document.getElementById(ariaLabelledBy);
            if (labelElement) {
                announcement = labelElement.textContent.trim();
            }
        } else if (label) {
            announcement = label;
        } else if (element.textContent && element.textContent.trim()) {
            announcement = element.textContent.trim();
        } else if (element.title) {
            announcement = element.title;
        }

        // Add element type
        if (tagName === 'button' || role === 'button') {
            announcement += ', button';
        } else if (tagName === 'a' || role === 'link') {
            announcement += ', link';
        } else if (tagName === 'input') {
            if (type === 'checkbox') {
                const checked = element.checked ? 'checked' : 'not checked';
                announcement += `, checkbox, ${checked}`;
            } else if (type === 'radio') {
                const checked = element.checked ? 'selected' : 'not selected';
                announcement += `, radio button, ${checked}`;
            } else if (type === 'text' || type === 'email' || type === 'password') {
                announcement += `, ${type} input`;
                if (value) {
                    announcement += `, current value: ${type === 'password' ? 'hidden' : value}`;
                } else if (placeholder) {
                    announcement += `, ${placeholder}`;
                }
            } else if (type === 'submit') {
                announcement += ', submit button';
            } else {
                announcement += `, ${type} input`;
            }
        } else if (tagName === 'select') {
            announcement += ', dropdown';
            const selectedOption = element.options[element.selectedIndex];
            if (selectedOption) {
                announcement += `, selected: ${selectedOption.textContent}`;
            }
        } else if (tagName === 'textarea') {
            announcement += ', text area';
            if (value) {
                announcement += `, ${value.split('\n').length} lines`;
            }
        } else if (tagName === 'h1' || tagName === 'h2' || tagName === 'h3' || tagName === 'h4' || tagName === 'h5' || tagName === 'h6') {
            announcement += `, heading level ${tagName.charAt(1)}`;
        } else if (role === 'tab') {
            const selected = element.getAttribute('aria-selected') === 'true';
            announcement += `, tab${selected ? ', selected' : ''}`;
        } else if (role === 'menuitem') {
            announcement += ', menu item';
        }

        // Add required indicator
        if (element.hasAttribute('required') || element.getAttribute('aria-required') === 'true') {
            announcement += ', required';
        }

        // Add disabled state
        if (element.disabled || element.getAttribute('aria-disabled') === 'true') {
            announcement += ', disabled';
        }

        // Add expanded state
        const ariaExpanded = element.getAttribute('aria-expanded');
        if (ariaExpanded === 'true') {
            announcement += ', expanded';
        } else if (ariaExpanded === 'false') {
            announcement += ', collapsed';
        }

        // Announce if not empty
        if (announcement.trim()) {
            this.announce(announcement.trim(), 'polite');
        }
    }

    getElementLabel(element) {
        // Check for associated label
        const id = element.id;
        if (id) {
            const label = document.querySelector(`label[for="${id}"]`);
            if (label) {
                return label.textContent.trim();
            }
        }

        // Check if element is inside a label
        const parentLabel = element.closest('label');
        if (parentLabel) {
            return parentLabel.textContent.trim();
        }

        return '';
    }

    announce(message, priority = 'polite') {
        console.log('[Screen Reader]', this.settings.screenReader ? 'ANNOUNCE:' : 'BLOCKED:', message);
        
        if (!this.settings.screenReader) return;

        // Use Web Speech API to speak the message
        this.speak(message, priority);

        // Also update ARIA live region for screen reader compatibility
        const announcer = this.ensureLiveRegion();
        if (announcer) {
            announcer.setAttribute('aria-live', priority);
            announcer.textContent = '';
            
            // Force reflow to ensure announcement
            setTimeout(() => {
                announcer.textContent = message;
                console.log('[Screen Reader] Live region updated:', message);
            }, 100);

            // Clear after announcement
            setTimeout(() => {
                announcer.textContent = '';
            }, 3000);
        } else {
            console.error('[Screen Reader] Live region not found!');
        }
    }

    speak(text, priority = 'polite') {
        // Check if Web Speech API is supported
        if (!('speechSynthesis' in window)) {
            console.warn('[Speech] Web Speech API not supported in this browser');
            return;
        }

        // Cancel any ongoing speech if this is assertive (high priority)
        if (priority === 'assertive') {
            window.speechSynthesis.cancel();
        }

        // Create utterance
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Configure speech parameters from user settings
        utterance.rate = this.settings.speechRate || 1.0;
        utterance.pitch = this.settings.speechPitch || 1.0;
        utterance.volume = this.settings.speechVolume || 1.0;
        utterance.lang = 'en-US';

        // Log speech events
        utterance.onstart = () => {
            console.log('[Speech] Speaking:', text);
        };

        utterance.onerror = (event) => {
            console.error('[Speech] Error:', event.error);
        };

        utterance.onend = () => {
            console.log('[Speech] Finished speaking');
        };

        // Speak the text
        window.speechSynthesis.speak(utterance);
    }

    ensureLiveRegion() {
        let announcer = document.getElementById(this.liveRegionId);
        if (!announcer) {
            announcer = document.createElement('div');
            announcer.id = this.liveRegionId;
            announcer.className = 'sr-only';
            announcer.setAttribute('role', 'status');
            announcer.setAttribute('aria-live', 'polite');
            announcer.setAttribute('aria-atomic', 'true');
            document.body.prepend(announcer);
        }
        return announcer;
    }

    clearLiveRegion() {
        const announcer = document.getElementById(this.liveRegionId);
        if (announcer) {
            announcer.textContent = '';
        }
    }

    setScreenReaderEnabled(enabled, announceChange = true) {
        const wasEnabled = this.settings.screenReader;

        if (!enabled && wasEnabled && announceChange) {
            this.announce('Screen reader announcements disabled');
        }

        this.settings.screenReader = enabled;
        document.body.dataset.screenReader = enabled ? 'on' : 'off';
        this.saveScreenReaderPreference(enabled);
        
        // Visual indicator
        this.updateScreenReaderIndicator(enabled);

        if (enabled && announceChange) {
            this.announce('Screen reader announcements enabled');
        }
        
        console.log('[Screen Reader] Status:', enabled ? 'ENABLED' : 'DISABLED');
    }
    
    updateScreenReaderIndicator(enabled) {
        // Add visual indicator to accessibility toggle button
        const toggle = document.getElementById('accessibility-toggle');
        if (toggle) {
            if (enabled) {
                toggle.style.borderColor = '#10b981';
                toggle.style.boxShadow = '0 0 0 2px rgba(16, 185, 129, 0.3)';
                toggle.setAttribute('title', 'Accessibility Settings (Screen Reader: ON)');
            } else {
                toggle.style.borderColor = '';
                toggle.style.boxShadow = '';
                toggle.setAttribute('title', 'Accessibility Settings (Screen Reader: OFF)');
            }
        }
    }

    // Utility function to manage focus
    trapFocus(element) {
        const focusableElements = element.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        element.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                if (e.shiftKey) {
                    if (document.activeElement === firstElement) {
                        lastElement.focus();
                        e.preventDefault();
                    }
                } else {
                    if (document.activeElement === lastElement) {
                        firstElement.focus();
                        e.preventDefault();
                    }
                }
            }

            if (e.key === 'Escape') {
                element.dispatchEvent(new CustomEvent('escape-pressed'));
            }
        });
    }

    // Set page title for screen readers
    setPageTitle(title) {
        document.title = title;
        this.announce(`Navigated to ${title}`);
    }

    // Announce loading states
    announceLoading(element, isLoading) {
        if (isLoading) {
            element.setAttribute('aria-busy', 'true');
            this.announce('Loading content');
        } else {
            element.removeAttribute('aria-busy');
            this.announce('Content loaded');
        }
    }

    // Form validation announcements
    announceFormError(fieldId, errorMessage) {
        const errorElement = document.getElementById(`${fieldId}-error`);
        const field = document.getElementById(fieldId);
        
        if (errorElement && field) {
            errorElement.textContent = errorMessage;
            field.setAttribute('aria-invalid', 'true');
            this.announce(`Error: ${errorMessage}`, 'assertive');
        }
    }

    clearFormError(fieldId) {
        const errorElement = document.getElementById(`${fieldId}-error`);
        const field = document.getElementById(fieldId);
        
        if (errorElement && field) {
            errorElement.textContent = '';
            field.setAttribute('aria-invalid', 'false');
        }
    }
}

// Initialize accessibility manager
let accessibility;

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        accessibility = new AccessibilityManager();
        window.accessibility = accessibility;
        console.log('Accessibility manager initialized');
    });
} else {
    // DOM already loaded
    accessibility = new AccessibilityManager();
    window.accessibility = accessibility;
    console.log('Accessibility manager initialized');
}

// Make it globally available immediately (will be populated when ready)
window.accessibility = accessibility;

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AccessibilityManager;
}
