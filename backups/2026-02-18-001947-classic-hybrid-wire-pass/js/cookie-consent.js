// ROCK.SCOT - Cookie Consent Banner
// UK GDPR & PECR Compliant

(function() {
    'use strict';
    
    const COOKIE_NAME = 'rock_cookie_consent';
    const COOKIE_DURATION = 365; // days
    
    // Check if consent already given
    function hasConsent() {
        const consent = getCookie(COOKIE_NAME);
        return consent !== null;
    }
    
    // Get cookie value
    function getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
        return null;
    }
    
    // Set cookie
    function setCookie(name, value, days) {
        const expires = new Date();
        expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
        document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Strict`;
    }
    
    // Check if DNT (Do Not Track) enabled
    function isDNTEnabled() {
        return navigator.doNotTrack === '1' || 
               window.doNotTrack === '1' || 
               navigator.msDoNotTrack === '1';
    }
    
    // Save consent preferences
    function saveConsent(preferences) {
        const consentData = {
            essential: true, // Always true
            analytics: preferences.analytics || false,
            timestamp: new Date().toISOString(),
            dnt: isDNTEnabled()
        };
        
        setCookie(COOKIE_NAME, JSON.stringify(consentData), COOKIE_DURATION);
        
        // Apply consent
        applyConsent(consentData);
        
        // Hide banner
        hideBanner();
        
        console.log('✅ Cookie consent saved:', consentData);
    }
    
    // Apply consent (enable/disable tracking)
    function applyConsent(consent) {
        if (consent.analytics) {
            // Enable analytics
            enableAnalytics();
        } else {
            // Disable analytics
            disableAnalytics();
        }
    }
    
    // Enable analytics tracking
    function enableAnalytics() {
        // Check if analytics.js exists and initialize
        if (window.initAnalytics) {
            window.initAnalytics();
        }
        
        // Set flag for analytics.js to check
        window.analyticsAllowed = true;
        
        console.log('📊 Analytics enabled');
    }
    
    // Disable analytics tracking
    function disableAnalytics() {
        // Remove analytics cookies
        document.cookie = 'rock_visitor_id=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;';
        
        // Clear local storage analytics data
        localStorage.removeItem('rock_visitor_id');
        sessionStorage.removeItem('rock_session_id');
        sessionStorage.removeItem('rock_session_start');
        sessionStorage.removeItem('rock_page_count');
        
        // Set flag
        window.analyticsAllowed = false;
        
        console.log('🚫 Analytics disabled');
    }
    
    // Create banner HTML
    function createBanner() {
        const banner = document.createElement('div');
        banner.id = 'cookie-consent-banner';
        banner.innerHTML = `
            <div class="cookie-banner-container">
                <div class="cookie-banner-content">
                    <div class="cookie-icon">🍪</div>
                    <div class="cookie-text">
                        <h3>We Value Your Privacy</h3>
                        <p>
                            We use cookies to improve your experience and analyze site traffic. 
                            <strong>Essential cookies</strong> are always active. 
                            <strong>Analytics cookies</strong> help us understand how you use our site.
                        </p>
                        <p class="cookie-links">
                            <a href="privacy.html" data-no-ajax>Privacy Policy</a> | 
                            <a href="cookies.html" data-no-ajax>Cookie Policy</a>
                        </p>
                    </div>
                </div>
                <div class="cookie-banner-buttons">
                    <button id="cookie-accept-all" class="cookie-btn cookie-btn-primary">
                        ✓ Accept All
                    </button>
                    <button id="cookie-reject-optional" class="cookie-btn cookie-btn-secondary">
                        Essential Only
                    </button>
                    <button id="cookie-customize" class="cookie-btn cookie-btn-text">
                        Customize
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(banner);
        
        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            #cookie-consent-banner {
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                background: rgba(0, 0, 0, 0.98);
                backdrop-filter: blur(20px);
                border-top: 3px solid #FF6600;
                padding: 1.5rem;
                z-index: 10000;
                box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.8);
                animation: slideUp 0.4s ease;
            }
            
            @keyframes slideUp {
                from { transform: translateY(100%); }
                to { transform: translateY(0); }
            }
            
            .cookie-banner-container {
                max-width: 1400px;
                margin: 0 auto;
                display: flex;
                gap: 2rem;
                align-items: center;
                justify-content: space-between;
            }
            
            .cookie-banner-content {
                display: flex;
                gap: 1.5rem;
                align-items: flex-start;
                flex: 1;
            }
            
            .cookie-icon {
                font-size: 3rem;
                flex-shrink: 0;
            }
            
            .cookie-text h3 {
                color: #FF6600;
                font-size: 1.2rem;
                margin-bottom: 0.5rem;
            }
            
            .cookie-text p {
                color: rgba(255, 255, 255, 0.8);
                font-size: 0.95rem;
                line-height: 1.6;
                margin-bottom: 0.5rem;
            }
            
            .cookie-links {
                font-size: 0.85rem;
            }
            
            .cookie-links a {
                color: #FFD700;
                text-decoration: underline;
            }
            
            .cookie-banner-buttons {
                display: flex;
                gap: 1rem;
                flex-shrink: 0;
            }
            
            .cookie-btn {
                padding: 0.75rem 1.5rem;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                font-size: 0.95rem;
                font-weight: 600;
                transition: all 0.3s;
                white-space: nowrap;
            }
            
            .cookie-btn-primary {
                background: linear-gradient(135deg, #FF6600, #FF8833);
                color: white;
            }
            
            .cookie-btn-primary:hover {
                transform: translateY(-2px);
                box-shadow: 0 5px 20px rgba(255, 102, 0, 0.4);
            }
            
            .cookie-btn-secondary {
                background: rgba(255, 255, 255, 0.1);
                color: white;
                border: 1px solid rgba(255, 255, 255, 0.2);
            }
            
            .cookie-btn-secondary:hover {
                background: rgba(255, 255, 255, 0.15);
            }
            
            .cookie-btn-text {
                background: transparent;
                color: #FFD700;
                text-decoration: underline;
            }
            
            .cookie-btn-text:hover {
                color: #FF6600;
            }
            
            /* Settings Modal */
            #cookie-settings-modal {
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.95);
                z-index: 10001;
                align-items: center;
                justify-content: center;
                padding: 2rem;
            }
            
            #cookie-settings-modal.show {
                display: flex;
            }
            
            .cookie-settings-content {
                background: #1a1a1a;
                padding: 2rem;
                border-radius: 15px;
                border: 2px solid #FF6600;
                max-width: 600px;
                width: 100%;
                max-height: 80vh;
                overflow-y: auto;
            }
            
            .cookie-settings-content h2 {
                color: #FF6600;
                margin-bottom: 1.5rem;
            }
            
            .cookie-category {
                background: rgba(255, 255, 255, 0.05);
                padding: 1.5rem;
                border-radius: 10px;
                margin-bottom: 1rem;
            }
            
            .cookie-category h3 {
                color: #FFD700;
                margin-bottom: 0.5rem;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .cookie-category p {
                color: rgba(255, 255, 255, 0.7);
                font-size: 0.9rem;
                line-height: 1.6;
            }
            
            .cookie-toggle {
                position: relative;
                display: inline-block;
                width: 50px;
                height: 26px;
            }
            
            .cookie-toggle input {
                opacity: 0;
                width: 0;
                height: 0;
            }
            
            .cookie-slider {
                position: absolute;
                cursor: pointer;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background-color: #555;
                transition: 0.4s;
                border-radius: 26px;
            }
            
            .cookie-slider:before {
                position: absolute;
                content: "";
                height: 18px;
                width: 18px;
                left: 4px;
                bottom: 4px;
                background-color: white;
                transition: 0.4s;
                border-radius: 50%;
            }
            
            input:checked + .cookie-slider {
                background-color: #FF6600;
            }
            
            input:checked + .cookie-slider:before {
                transform: translateX(24px);
            }
            
            input:disabled + .cookie-slider {
                opacity: 0.5;
                cursor: not-allowed;
            }
            
            .cookie-settings-buttons {
                display: flex;
                gap: 1rem;
                margin-top: 2rem;
            }
            
            /* Mobile responsive */
            @media (max-width: 768px) {
                .cookie-banner-container {
                    flex-direction: column;
                }
                
                .cookie-banner-buttons {
                    width: 100%;
                    flex-direction: column;
                }
                
                .cookie-btn {
                    width: 100%;
                }
            }
        `;
        document.head.appendChild(style);
        
        // Event listeners
        document.getElementById('cookie-accept-all').addEventListener('click', () => {
            saveConsent({ analytics: true });
        });
        
        document.getElementById('cookie-reject-optional').addEventListener('click', () => {
            saveConsent({ analytics: false });
        });
        
        document.getElementById('cookie-customize').addEventListener('click', showSettings);
    }
    
    // Hide banner
    function hideBanner() {
        const banner = document.getElementById('cookie-consent-banner');
        if (banner) {
            banner.style.animation = 'slideDown 0.4s ease';
            setTimeout(() => banner.remove(), 400);
        }
    }
    
    // Show settings modal
    function showSettings() {
        // Create modal if doesn't exist
        let modal = document.getElementById('cookie-settings-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'cookie-settings-modal';
            modal.innerHTML = `
                <div class="cookie-settings-content">
                    <h2>Cookie Preferences</h2>
                    
                    <div class="cookie-category">
                        <h3>
                            Essential Cookies
                            <label class="cookie-toggle">
                                <input type="checkbox" checked disabled>
                                <span class="cookie-slider"></span>
                            </label>
                        </h3>
                        <p>
                            Required for the website to function. These cannot be disabled.
                            Includes: session management, player persistence, security.
                        </p>
                    </div>
                    
                    <div class="cookie-category">
                        <h3>
                            Analytics Cookies
                            <label class="cookie-toggle">
                                <input type="checkbox" id="analytics-toggle">
                                <span class="cookie-slider"></span>
                            </label>
                        </h3>
                        <p>
                            Help us understand how you use our site. Data is anonymized.
                            Includes: page views, time on site, navigation patterns.
                        </p>
                    </div>
                    
                    <div class="cookie-settings-buttons">
                        <button id="save-preferences" class="cookie-btn cookie-btn-primary" style="flex: 1;">
                            Save Preferences
                        </button>
                        <button id="cancel-settings" class="cookie-btn cookie-btn-secondary" style="flex: 1;">
                            Cancel
                        </button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
            
            // Event listeners
            document.getElementById('save-preferences').addEventListener('click', () => {
                const analytics = document.getElementById('analytics-toggle').checked;
                saveConsent({ analytics });
                modal.classList.remove('show');
            });
            
            document.getElementById('cancel-settings').addEventListener('click', () => {
                modal.classList.remove('show');
            });
            
            // Close on outside click
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('show');
                }
            });
        }
        
        modal.classList.add('show');
    }
    
    // Make showSettings available globally
    window.showCookieSettings = showSettings;
    
    // Initialize on page load
    function init() {
        // Check DNT first
        if (isDNTEnabled()) {
            console.log('🔒 Do Not Track enabled - respecting user preference');
            saveConsent({ analytics: false });
            return;
        }
        
        // Check if consent already given
        if (hasConsent()) {
            const consentData = JSON.parse(getCookie(COOKIE_NAME));
            applyConsent(consentData);
            return;
        }
        
        // Show banner
        setTimeout(() => {
            createBanner();
        }, 1000); // Delay 1 second so user sees content first
    }
    
    // Run on page load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    console.log('🍪 Cookie consent system initialized');
    
})();
