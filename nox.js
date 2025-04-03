/**
 * Nox.js - A Discord theme customization plugin
 * Inspired by Vencord plugins
 * 
 * This plugin allows users to customize their Discord theme using images
 * and integrates directly into Discord's settings panel
 */

// Define the Nox Plugin namespace
window.Nox = window.Nox || {};

(function() {
    // Plugin metadata
    const NoxPlugin = {
        name: "NoxPlugins",
        description: "Change Discord theme using custom images",
        author: "Nox",
        version: "1.1.0",
        
        // Store for theme data
        _themeData: {
            enabled: false,
            currentImage: null,
            brightness: 0.5,
            opacity: 0.85,
            blur: 5,
            size: 'cover',
            animate: false,
            animationSpeed: 20,
        },

        // CSS container for injected styles
        _styleElement: null,
        
        // Settings panel elements
        _settingsPanel: null,
        
        // Discord settings integration elements
        _discordSettingsTab: null,
        
        /**
         * Initialize the plugin
         */
        init() {
            console.log("[Nox] Theme By Image plugin initializing...");
            
            // Ensure the DOM is fully ready before initializing
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this._waitForDiscord());
            } else {
                this._waitForDiscord();
            }
        },
        
        /**
         * Wait for Discord to be fully loaded before initializing
         * This ensures we can properly detect Discord's UI elements
         */
        _waitForDiscord() {
            console.log("[Nox] Waiting for Discord to be fully loaded...");
            
            // Function to check if Discord UI is ready
            const checkDiscordReady = () => {
                // Check for typical Discord UI elements
                const discordAppElement = document.querySelector('[class*="app-"]');
                const discordLayers = document.querySelector('[class*="layers-"]');
                
                if (discordAppElement && discordLayers) {
                    console.log("[Nox] Discord UI detected, initializing plugin");
                    this._initializePlugin();
                } else {
                    console.log("[Nox] Discord UI not ready yet, retrying in 500ms");
                    setTimeout(checkDiscordReady, 500);
                }
            };
            
            // Start checking
            checkDiscordReady();
        },
        
        /**
         * Internal method to initialize the plugin once DOM is ready
         * This prevents localStorage errors when script runs too early
         */
        _initializePlugin() {
            // Create style element if it doesn't exist
            if (!this._styleElement) {
                this._styleElement = document.createElement('style');
                this._styleElement.id = 'nox-theme-styles';
                document.head.appendChild(this._styleElement);
            }
            
            try {
                // Load saved settings
                this._loadSettings();
                
                // Initialize the settings panel
                this._initSettingsPanel();
                
                // Apply theme if enabled
                if (this._themeData.enabled && this._themeData.currentImage) {
                    this._applyTheme();
                }
                
                // Add settings tab to Discord (with a slight delay to ensure Discord UI is ready)
                setTimeout(() => {
                    try {
                        this._addSettingsTabIfNeeded();
                    } catch (error) {
                        console.error("[Nox] Error adding settings tab:", error);
                    }
                }, 2000);
                
                // Monitor for Discord navigation changes to re-inject settings
                this._setupMutationObserver();
                
                console.log("[Nox] Theme By Image plugin initialized");
            } catch (error) {
                console.error("[Nox] Error during plugin initialization:", error);
            }
            
            // Notify the Nox.js server that the plugin is running (for stats)
            // Only do this if we're not in Discord (which has CSP restrictions)
            if (window.location.hostname !== 'discord.com') {
                this._sendStats("init");
            }
        },
        
        /**
         * Setup mutation observer to detect DOM changes
         * This helps reinsert our settings panel when Discord navigates
         */
        _setupMutationObserver() {
            const observer = new MutationObserver((mutations) => {
                for (const mutation of mutations) {
                    if (mutation.type === 'childList') {
                        // Check for Settings page
                        const settingsContainer = document.querySelector('[class*="sidebarRegion"] [class*="contentRegion"]');
                        
                        if (settingsContainer && !document.getElementById('nox-settings-container')) {
                            // We're in settings but our panel isn't there
                            // Check if we need to add our own settings item to the sidebar
                            this._addSettingsTabIfNeeded();
                            
                            // Check if we're in appearance section or our custom tab
                            const appearanceSection = document.querySelector('[class*="sidebarRegion"] [class*="item-"]');
                            if ((appearanceSection && appearanceSection.textContent.includes('Appearance')) || 
                                document.querySelector('#nox-settings-tab.selected')) {
                                this._injectSettingsPanel();
                            }
                        }
                        
                        // Always check if we need to add the settings button
                        if (!document.getElementById('nox-settings-button')) {
                            this._injectSettingsButton();
                        }
                    }
                }
            });
            
            observer.observe(document.body, { childList: true, subtree: true });
        },
        
        /**
         * Add a custom tab to Discord settings if it doesn't exist
         */
        _addSettingsTabIfNeeded() {
            if (document.getElementById('nox-settings-tab')) return;
            
            // Log that we're trying to add settings tab
            console.log("[Nox] Attempting to add settings tab to Discord");
            
            // Try multiple Discord selectors - Discord frequently updates their class names
            const sidebarSelectors = [
                '[class*="sidebarRegion"] [class*="scroller-"]',
                '[class*="sidebar"] [class*="scroller"]',
                '[class*="settingsSidebar"] [class*="scroller"]',
                '[class*="sidebar"] nav',
                '.sidebarRegion-VFTUkN .sidebarRegionScroller-3MXcoP'
            ];
            
            let sidebarItems = null;
            for (const selector of sidebarSelectors) {
                sidebarItems = document.querySelector(selector);
                if (sidebarItems) {
                    console.log("[Nox] Found Discord settings sidebar with selector:", selector);
                    break;
                }
            }
            
            if (!sidebarItems) {
                console.warn("[Nox] Could not find Discord settings sidebar");
                return;
            }
            
            // Find a divider or existing menu item to insert after
            const dividers = sidebarItems.querySelectorAll('div[class*="divider-"]');
            let insertAfterElement = null;
            
            if (dividers && dividers.length > 0) {
                // Use the first or second divider (usually after User Settings and above App Settings)
                insertAfterElement = dividers[1] || dividers[0];
            } else {
                // If no dividers found, look for the "Appearance" menu item to insert after
                const menuItems = sidebarItems.querySelectorAll('div[class*="item-"]');
                for (const item of menuItems) {
                    if (item.textContent.includes('Appearance') || 
                        item.textContent.includes('Interface') ||
                        item.textContent.includes('User Profile')) {
                        insertAfterElement = item;
                        break;
                    }
                }
                
                // If still no suitable element found, use the first menu item
                if (!insertAfterElement && menuItems.length > 0) {
                    insertAfterElement = menuItems[menuItems.length - 1]; // Last item
                }
            }
            
            if (!insertAfterElement) {
                console.warn("[Nox] Could not find a suitable element to insert settings tab after");
                return;
            }
            
            // Get the classes from an existing menu item
            const existingItems = sidebarItems.querySelectorAll('div[class*="item-"]');
            if (!existingItems || existingItems.length === 0) {
                console.warn("[Nox] Could not find existing menu items to copy style from");
                return;
            }
            
            const referenceItem = existingItems[0];
            
            // Create our tab with appropriate classes
            const noxTab = document.createElement('div');
            noxTab.id = 'nox-settings-tab';
            noxTab.className = referenceItem.className;
            
            // Try to detect inner structure
            const innerDiv = referenceItem.querySelector('div');
            const innerContent = innerDiv ? innerDiv.innerHTML : '';
            
            // Create an icon similar to other menu items but with our gear icon
            noxTab.innerHTML = `
                <div class="${innerDiv ? innerDiv.className : ''}">
                    <svg class="noxIcon" width="24" height="24" viewBox="0 0 24 24" style="margin-right: 8px;">
                        <path fill="currentColor" d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z"/>
                        <path fill="currentColor" d="M19.4 15C19.2669 15.3016 19.2272 15.6362 19.286 15.9606C19.3448 16.285 19.4995 16.5843 19.73 16.82L19.79 16.88C19.976 17.0657 20.1235 17.2863 20.2241 17.5291C20.3248 17.7719 20.3766 18.0322 20.3766 18.295C20.3766 18.5578 20.3248 18.8181 20.2241 19.0609C20.1235 19.3037 19.976 19.5243 19.79 19.71C19.6043 19.896 19.3837 20.0435 19.1409 20.1441C18.8981 20.2448 18.6378 20.2966 18.375 20.2966C18.1122 20.2966 17.8519 20.2448 17.6091 20.1441C17.3663 20.0435 17.1457 19.896 16.96 19.71L16.9 19.65C16.6643 19.4195 16.365 19.2648 16.0406 19.206C15.7162 19.1472 15.3816 19.1869 15.08 19.32C14.7842 19.4468 14.532 19.6572 14.3543 19.9255C14.1766 20.1938 14.0813 20.5082 14.08 20.83V21C14.08 21.5304 13.8693 22.0391 13.4942 22.4142C13.1191 22.7893 12.6104 23 12.08 23C11.5496 23 11.0409 22.7893 10.6658 22.4142C10.2907 22.0391 10.08 21.5304 10.08 21V20.91C10.0723 20.579 9.96512 20.258 9.77251 19.9887C9.5799 19.7194 9.31074 19.5143 9 19.4C8.69838 19.2669 8.36381 19.2272 8.03941 19.286C7.71502 19.3448 7.41568 19.4995 7.18 19.73L7.12 19.79C6.93425 19.976 6.71368 20.1235 6.47088 20.2241C6.22808 20.3248 5.96783 20.3766 5.705 20.3766C5.44217 20.3766 5.18192 20.3248 4.93912 20.2241C4.69632 20.1235 4.47575 19.976 4.29 19.79C4.10405 19.6043 3.95653 19.3837 3.85588 19.1409C3.75523 18.8981 3.70343 18.6378 3.70343 18.375C3.70343 18.1122 3.75523 17.8519 3.85588 17.6091C3.95653 17.3663 4.10405 17.1457 4.29 16.96L4.35 16.9C4.58054 16.6643 4.73519 16.365 4.794 16.0406C4.85282 15.7162 4.81312 15.3816 4.68 15.08C4.55324 14.7842 4.34276 14.532 4.07447 14.3543C3.80618 14.1766 3.49179 14.0813 3.17 14.08H3C2.46957 14.08 1.96086 13.8693 1.58579 13.4942C1.21071 13.1191 1 12.6104 1 12.08C1 11.5496 1.21071 11.0409 1.58579 10.6658C1.96086 10.2907 2.46957 10.08 3 10.08H3.09C3.42099 10.0723 3.742 9.96512 4.0113 9.77251C4.28059 9.5799 4.48572 9.31074 4.6 9C4.73312 8.69838 4.77282 8.36381 4.714 8.03941C4.65519 7.71502 4.50054 7.41568 4.27 7.18L4.21 7.12C4.02405 6.93425 3.87653 6.71368 3.77588 6.47088C3.67523 6.22808 3.62343 5.96783 3.62343 5.705C3.62343 5.44217 3.67523 5.18192 3.77588 4.93912C3.87653 4.69632 4.02405 4.47575 4.21 4.29C4.39575 4.10405 4.61632 3.95653 4.85912 3.85588C5.10192 3.75523 5.36217 3.70343 5.625 3.70343C5.88783 3.70343 6.14808 3.75523 6.39088 3.85588C6.63368 3.95653 6.85425 4.10405 7.04 4.29L7.1 4.35C7.33568 4.58054 7.63502 4.73519 7.95941 4.794C8.28381 4.85282 8.61838 4.81312 8.92 4.68H9C9.29577 4.55324 9.54802 4.34276 9.72569 4.07447C9.90337 3.80618 9.99872 3.49179 10 3.17V3C10 2.46957 10.2107 1.96086 10.5858 1.58579C10.9609 1.21071 11.4696 1 12 1C12.5304 1 13.0391 1.21071 13.4142 1.58579C13.7893 1.96086 14 2.46957 14 3V3.09C14.0013 3.41179 14.0966 3.72618 14.2743 3.99447C14.452 4.26276 14.7042 4.47324 15 4.6C15.3016 4.73312 15.6362 4.77282 15.9606 4.714C16.285 4.65519 16.5843 4.50054 16.82 4.27L16.88 4.21C17.0657 4.02405 17.2863 3.87653 17.5291 3.77588C17.7719 3.67523 18.0322 3.62343 18.295 3.62343C18.5578 3.62343 18.8181 3.67523 19.0609 3.77588C19.3037 3.87653 19.5243 4.02405 19.71 4.21C19.896 4.39575 20.0435 4.61632 20.1441 4.85912C20.2448 5.10192 20.2966 5.36217 20.2966 5.625C20.2966 5.88783 20.2448 6.14808 20.1441 6.39088C20.0435 6.63368 19.896 6.85425 19.71 7.04L19.65 7.1C19.4195 7.33568 19.2648 7.63502 19.206 7.95941C19.1472 8.28381 19.1869 8.61838 19.32 8.92V9C19.4468 9.29577 19.6572 9.54802 19.9255 9.72569C20.1938 9.90337 20.5082 9.99872 20.83 10H21C21.5304 10 22.0391 10.2107 22.4142 10.5858C22.7893 10.9609 23 11.4696 23 12C23 12.5304 22.7893 13.0391 22.4142 13.4142C22.0391 13.7893 21.5304 14 21 14H20.91C20.5882 14.0013 20.2738 14.0966 20.0055 14.2743C19.7372 14.452 19.5268 14.7042 19.4 15Z"/>
                    </svg>
                    <span>NoxPlugins</span>
                </div>
            `;
            
            // Add event listener to handle selection
            noxTab.addEventListener('click', () => {
                // Remove selected state from all items
                const allItems = sidebarItems.querySelectorAll('div[class*="item-"]');
                allItems.forEach(item => {
                    item.classList.remove('selected');
                    if (item.hasAttribute('aria-selected')) {
                        item.setAttribute('aria-selected', 'false');
                    }
                });
                
                // Add selected state to our tab
                noxTab.classList.add('selected');
                noxTab.setAttribute('aria-selected', 'true');
                
                // Update the content region
                this._injectSettingsPanel(true);
            });
            
            // Insert after the target element
            console.log("[Nox] Inserting settings tab after reference element");
            insertAfterElement.after(noxTab);
            
            // Save reference to our tab
            this._discordSettingsTab = noxTab;
            console.log("[Nox] Settings tab added successfully");
        },
        
        /**
         * Check if localStorage is available
         */
        _isLocalStorageAvailable() {
            try {
                // Test if localStorage is accessible
                const testKey = '__nox_test__';
                window.localStorage.setItem(testKey, testKey);
                window.localStorage.removeItem(testKey);
                return true;
            } catch (e) {
                return false;
            }
        },
        
        /**
         * Load settings from localStorage
         */
        _loadSettings() {
            try {
                // Check if localStorage is available first
                if (this._isLocalStorageAvailable()) {
                    const savedData = window.localStorage.getItem('nox-theme-settings');
                    if (savedData) {
                        this._themeData = {...this._themeData, ...JSON.parse(savedData)};
                    }
                } else {
                    console.warn('[Nox] localStorage not available, using default settings');
                }
            } catch (err) {
                console.error('[Nox] Error loading settings:', err);
            }
        },
        
        /**
         * Save settings to localStorage
         */
        _saveSettings() {
            try {
                // Check if localStorage is available first
                if (this._isLocalStorageAvailable()) {
                    window.localStorage.setItem('nox-theme-settings', JSON.stringify(this._themeData));
                } else {
                    console.warn('[Nox] localStorage not available, settings will not persist');
                }
            } catch (err) {
                console.error('[Nox] Error saving settings:', err);
            }
        },
        
        /**
         * Initialize the settings panel
         */
        _initSettingsPanel() {
            // Create settings button in Discord UI
            this._injectSettingsButton();
            
            // Add keyboard shortcut to toggle theme
            document.addEventListener('keydown', (e) => {
                // Alt+T to toggle theme
                if (e.altKey && e.key === 't') {
                    this._themeData.enabled = !this._themeData.enabled;
                    this._saveSettings();
                    this._applyTheme();
                }
            });
        },
        
        /**
         * Inject settings button into Discord UI
         */
        _injectSettingsButton() {
            // Check for existing button
            if (document.getElementById('nox-settings-button')) return;
            
            // Find the user area at the bottom of Discord
            const userArea = document.querySelector('[class*="panels-"] [class*="container-"]');
            if (!userArea) return;
            
            // Create button
            const button = document.createElement('button');
            button.id = 'nox-settings-button';
            button.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M19.4 15C19.2669 15.3016 19.2272 15.6362 19.286 15.9606C19.3448 16.285 19.4995 16.5843 19.73 16.82L19.79 16.88C19.976 17.0657 20.1235 17.2863 20.2241 17.5291C20.3248 17.7719 20.3766 18.0322 20.3766 18.295C20.3766 18.5578 20.3248 18.8181 20.2241 19.0609C20.1235 19.3037 19.976 19.5243 19.79 19.71C19.6043 19.896 19.3837 20.0435 19.1409 20.1441C18.8981 20.2448 18.6378 20.2966 18.375 20.2966C18.1122 20.2966 17.8519 20.2448 17.6091 20.1441C17.3663 20.0435 17.1457 19.896 16.96 19.71L16.9 19.65C16.6643 19.4195 16.365 19.2648 16.0406 19.206C15.7162 19.1472 15.3816 19.1869 15.08 19.32C14.7842 19.4468 14.532 19.6572 14.3543 19.9255C14.1766 20.1938 14.0813 20.5082 14.08 20.83V21C14.08 21.5304 13.8693 22.0391 13.4942 22.4142C13.1191 22.7893 12.6104 23 12.08 23C11.5496 23 11.0409 22.7893 10.6658 22.4142C10.2907 22.0391 10.08 21.5304 10.08 21V20.91C10.0723 20.579 9.96512 20.258 9.77251 19.9887C9.5799 19.7194 9.31074 19.5143 9 19.4C8.69838 19.2669 8.36381 19.2272 8.03941 19.286C7.71502 19.3448 7.41568 19.4995 7.18 19.73L7.12 19.79C6.93425 19.976 6.71368 20.1235 6.47088 20.2241C6.22808 20.3248 5.96783 20.3766 5.705 20.3766C5.44217 20.3766 5.18192 20.3248 4.93912 20.2241C4.69632 20.1235 4.47575 19.976 4.29 19.79C4.10405 19.6043 3.95653 19.3837 3.85588 19.1409C3.75523 18.8981 3.70343 18.6378 3.70343 18.375C3.70343 18.1122 3.75523 17.8519 3.85588 17.6091C3.95653 17.3663 4.10405 17.1457 4.29 16.96L4.35 16.9C4.58054 16.6643 4.73519 16.365 4.794 16.0406C4.85282 15.7162 4.81312 15.3816 4.68 15.08C4.55324 14.7842 4.34276 14.532 4.07447 14.3543C3.80618 14.1766 3.49179 14.0813 3.17 14.08H3C2.46957 14.08 1.96086 13.8693 1.58579 13.4942C1.21071 13.1191 1 12.6104 1 12.08C1 11.5496 1.21071 11.0409 1.58579 10.6658C1.96086 10.2907 2.46957 10.08 3 10.08H3.09C3.42099 10.0723 3.742 9.96512 4.0113 9.77251C4.28059 9.5799 4.48572 9.31074 4.6 9C4.73312 8.69838 4.77282 8.36381 4.714 8.03941C4.65519 7.71502 4.50054 7.41568 4.27 7.18L4.21 7.12C4.02405 6.93425 3.87653 6.71368 3.77588 6.47088C3.67523 6.22808 3.62343 5.96783 3.62343 5.705C3.62343 5.44217 3.67523 5.18192 3.77588 4.93912C3.87653 4.69632 4.02405 4.47575 4.21 4.29C4.39575 4.10405 4.61632 3.95653 4.85912 3.85588C5.10192 3.75523 5.36217 3.70343 5.625 3.70343C5.88783 3.70343 6.14808 3.75523 6.39088 3.85588C6.63368 3.95653 6.85425 4.10405 7.04 4.29L7.1 4.35C7.33568 4.58054 7.63502 4.73519 7.95941 4.794C8.28381 4.85282 8.61838 4.81312 8.92 4.68H9C9.29577 4.55324 9.54802 4.34276 9.72569 4.07447C9.90337 3.80618 9.99872 3.49179 10 3.17V3C10 2.46957 10.2107 1.96086 10.5858 1.58579C10.9609 1.21071 11.4696 1 12 1C12.5304 1 13.0391 1.21071 13.4142 1.58579C13.7893 1.96086 14 2.46957 14 3V3.09C14.0013 3.41179 14.0966 3.72618 14.2743 3.99447C14.452 4.26276 14.7042 4.47324 15 4.6C15.3016 4.73312 15.6362 4.77282 15.9606 4.714C16.285 4.65519 16.5843 4.50054 16.82 4.27L16.88 4.21C17.0657 4.02405 17.2863 3.87653 17.5291 3.77588C17.7719 3.67523 18.0322 3.62343 18.295 3.62343C18.5578 3.62343 18.8181 3.67523 19.0609 3.77588C19.3037 3.87653 19.5243 4.02405 19.71 4.21C19.896 4.39575 20.0435 4.61632 20.1441 4.85912C20.2448 5.10192 20.2966 5.36217 20.2966 5.625C20.2966 5.88783 20.2448 6.14808 20.1441 6.39088C20.0435 6.63368 19.896 6.85425 19.71 7.04L19.65 7.1C19.4195 7.33568 19.2648 7.63502 19.206 7.95941C19.1472 8.28381 19.1869 8.61838 19.32 8.92V9C19.4468 9.29577 19.6572 9.54802 19.9255 9.72569C20.1938 9.90337 20.5082 9.99872 20.83 10H21C21.5304 10 22.0391 10.2107 22.4142 10.5858C22.7893 10.9609 23 11.4696 23 12C23 12.5304 22.7893 13.0391 22.4142 13.4142C22.0391 13.7893 21.5304 14 21 14H20.91C20.5882 14.0013 20.2738 14.0966 20.0055 14.2743C19.7372 14.452 19.5268 14.7042 19.4 15Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
            button.style.cssText = 'background: transparent; border: none; color: var(--interactive-normal); cursor: pointer; padding: 5px; margin-left: 8px;';
            button.title = "Nox Theme Settings";
            
            button.addEventListener('mouseenter', () => {
                button.style.color = 'var(--interactive-hover)';
            });
            
            button.addEventListener('mouseleave', () => {
                button.style.color = 'var(--interactive-normal)';
            });
            
            button.addEventListener('click', () => {
                this._openSettingsModal();
            });
            
            userArea.appendChild(button);
        },
        
        /**
         * Create and open the settings modal
         */
        _openSettingsModal() {
            // Remove existing modal if present
            const existingModal = document.getElementById('nox-settings-modal');
            if (existingModal) existingModal.remove();
            
            // Create modal elements
            const modal = document.createElement('div');
            modal.id = 'nox-settings-modal';
            modal.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background-color: rgba(0, 0, 0, 0.8);
                z-index: 9999;
                display: flex;
                align-items: center;
                justify-content: center;
            `;
            
            const modalContent = document.createElement('div');
            modalContent.style.cssText = `
                background-color: var(--background-primary);
                border-radius: 8px;
                padding: 20px;
                width: 500px;
                max-width: 90%;
                max-height: 80vh;
                overflow-y: auto;
                box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
            `;
            
            const modalHeader = document.createElement('div');
            modalHeader.style.cssText = `
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
                padding-bottom: 10px;
                border-bottom: 1px solid var(--background-modifier-accent);
            `;
            
            const title = document.createElement('h2');
            title.textContent = 'Nox Theme Settings';
            title.style.cssText = `
                margin: 0;
                color: var(--header-primary);
                font-size: 16px;
                font-weight: 600;
            `;
            
            const closeButton = document.createElement('button');
            closeButton.innerHTML = '&times;';
            closeButton.style.cssText = `
                background: transparent;
                border: none;
                color: var(--interactive-normal);
                font-size: 24px;
                cursor: pointer;
                padding: 0;
                line-height: 1;
            `;
            closeButton.addEventListener('click', () => modal.remove());
            
            // Create settings content
            const settingsContent = document.createElement('div');
            
            // Enabled toggle
            const enabledContainer = document.createElement('div');
            enabledContainer.style.cssText = 'margin-bottom: 15px; display: flex; justify-content: space-between; align-items: center;';
            
            const enabledLabel = document.createElement('label');
            enabledLabel.textContent = 'Enable Theme By Image';
            enabledLabel.style.cssText = 'color: var(--text-normal); font-weight: 500;';
            
            const enabledToggle = document.createElement('input');
            enabledToggle.type = 'checkbox';
            enabledToggle.checked = this._themeData.enabled;
            enabledToggle.addEventListener('change', (e) => {
                this._themeData.enabled = e.target.checked;
                this._saveSettings();
                this._applyTheme();
            });
            
            enabledContainer.appendChild(enabledLabel);
            enabledContainer.appendChild(enabledToggle);
            
            // Image URL input
            const imageContainer = document.createElement('div');
            imageContainer.style.cssText = 'margin-bottom: 15px;';
            
            const imageLabel = document.createElement('label');
            imageLabel.textContent = 'Background Image URL';
            imageLabel.style.cssText = 'display: block; margin-bottom: 5px; color: var(--text-normal); font-weight: 500;';
            
            const imageInput = document.createElement('input');
            imageInput.type = 'text';
            imageInput.value = this._themeData.currentImage || '';
            imageInput.placeholder = 'Enter image URL';
            imageInput.style.cssText = `
                width: 100%;
                padding: 8px;
                border-radius: 4px;
                background-color: var(--background-secondary);
                border: 1px solid var(--background-tertiary);
                color: var(--text-normal);
                box-sizing: border-box;
            `;
            
            imageInput.addEventListener('input', (e) => {
                this._themeData.currentImage = e.target.value;
                this._saveSettings();
                this._applyTheme();
            });
            
            imageContainer.appendChild(imageLabel);
            imageContainer.appendChild(imageInput);
            
            // Brightness slider
            const brightnessContainer = document.createElement('div');
            brightnessContainer.style.cssText = 'margin-bottom: 15px;';
            
            const brightnessLabel = document.createElement('label');
            brightnessLabel.textContent = `Brightness: ${this._themeData.brightness}`;
            brightnessLabel.style.cssText = 'display: block; margin-bottom: 5px; color: var(--text-normal); font-weight: 500;';
            
            const brightnessSlider = document.createElement('input');
            brightnessSlider.type = 'range';
            brightnessSlider.min = '0.1';
            brightnessSlider.max = '1';
            brightnessSlider.step = '0.05';
            brightnessSlider.value = this._themeData.brightness;
            brightnessSlider.style.cssText = 'width: 100%;';
            
            brightnessSlider.addEventListener('input', (e) => {
                this._themeData.brightness = parseFloat(e.target.value);
                brightnessLabel.textContent = `Brightness: ${this._themeData.brightness}`;
                this._saveSettings();
                this._applyTheme();
            });
            
            brightnessContainer.appendChild(brightnessLabel);
            brightnessContainer.appendChild(brightnessSlider);
            
            // Opacity slider
            const opacityContainer = document.createElement('div');
            opacityContainer.style.cssText = 'margin-bottom: 15px;';
            
            const opacityLabel = document.createElement('label');
            opacityLabel.textContent = `Opacity: ${this._themeData.opacity}`;
            opacityLabel.style.cssText = 'display: block; margin-bottom: 5px; color: var(--text-normal); font-weight: 500;';
            
            const opacitySlider = document.createElement('input');
            opacitySlider.type = 'range';
            opacitySlider.min = '0.1';
            opacitySlider.max = '1';
            opacitySlider.step = '0.05';
            opacitySlider.value = this._themeData.opacity;
            opacitySlider.style.cssText = 'width: 100%;';
            
            opacitySlider.addEventListener('input', (e) => {
                this._themeData.opacity = parseFloat(e.target.value);
                opacityLabel.textContent = `Opacity: ${this._themeData.opacity}`;
                this._saveSettings();
                this._applyTheme();
            });
            
            opacityContainer.appendChild(opacityLabel);
            opacityContainer.appendChild(opacitySlider);
            
            // Blur slider
            const blurContainer = document.createElement('div');
            blurContainer.style.cssText = 'margin-bottom: 15px;';
            
            const blurLabel = document.createElement('label');
            blurLabel.textContent = `Blur: ${this._themeData.blur}px`;
            blurLabel.style.cssText = 'display: block; margin-bottom: 5px; color: var(--text-normal); font-weight: 500;';
            
            const blurSlider = document.createElement('input');
            blurSlider.type = 'range';
            blurSlider.min = '0';
            blurSlider.max = '20';
            blurSlider.step = '1';
            blurSlider.value = this._themeData.blur;
            blurSlider.style.cssText = 'width: 100%;';
            
            blurSlider.addEventListener('input', (e) => {
                this._themeData.blur = parseFloat(e.target.value);
                blurLabel.textContent = `Blur: ${this._themeData.blur}px`;
                this._saveSettings();
                this._applyTheme();
            });
            
            blurContainer.appendChild(blurLabel);
            blurContainer.appendChild(blurSlider);
            
            // Background size selector
            const sizeContainer = document.createElement('div');
            sizeContainer.style.cssText = 'margin-bottom: 15px;';
            
            const sizeLabel = document.createElement('label');
            sizeLabel.textContent = 'Background Size';
            sizeLabel.style.cssText = 'display: block; margin-bottom: 5px; color: var(--text-normal); font-weight: 500;';
            
            const sizeSelect = document.createElement('select');
            sizeSelect.style.cssText = `
                width: 100%;
                padding: 8px;
                border-radius: 4px;
                background-color: var(--background-secondary);
                border: 1px solid var(--background-tertiary);
                color: var(--text-normal);
            `;
            
            const sizeOptions = ['cover', 'contain', '100% 100%', 'auto'];
            
            sizeOptions.forEach(option => {
                const optionElement = document.createElement('option');
                optionElement.value = option;
                optionElement.textContent = option;
                optionElement.selected = this._themeData.size === option;
                sizeSelect.appendChild(optionElement);
            });
            
            sizeSelect.addEventListener('change', (e) => {
                this._themeData.size = e.target.value;
                this._saveSettings();
                this._applyTheme();
            });
            
            sizeContainer.appendChild(sizeLabel);
            sizeContainer.appendChild(sizeSelect);
            
            // Reset button
            const resetContainer = document.createElement('div');
            resetContainer.style.cssText = 'margin-top: 20px;';
            
            const resetButton = document.createElement('button');
            resetButton.textContent = 'Reset to Default';
            resetButton.style.cssText = `
                padding: 8px 16px;
                background-color: var(--button-danger-background);
                color: var(--button-danger-text);
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-weight: 500;
            `;
            
            resetButton.addEventListener('click', () => {
                // Reset to defaults
                this._themeData = {
                    enabled: false,
                    currentImage: null,
                    brightness: 0.5,
                    opacity: 0.85,
                    blur: 5,
                    size: 'cover',
                };
                
                this._saveSettings();
                this._applyTheme();
                
                // Update UI
                enabledToggle.checked = false;
                imageInput.value = '';
                brightnessSlider.value = 0.5;
                brightnessLabel.textContent = 'Brightness: 0.5';
                opacitySlider.value = 0.85;
                opacityLabel.textContent = 'Opacity: 0.85';
                blurSlider.value = 5;
                blurLabel.textContent = 'Blur: 5px';
                
                sizeOptions.forEach((_, index) => {
                    sizeSelect.options[index].selected = sizeSelect.options[index].value === 'cover';
                });
            });
            
            resetContainer.appendChild(resetButton);
            
            // Assemble the modal
            modalHeader.appendChild(title);
            modalHeader.appendChild(closeButton);
            
            settingsContent.appendChild(enabledContainer);
            settingsContent.appendChild(imageContainer);
            settingsContent.appendChild(brightnessContainer);
            settingsContent.appendChild(opacityContainer);
            settingsContent.appendChild(blurContainer);
            settingsContent.appendChild(sizeContainer);
            settingsContent.appendChild(resetContainer);
            
            modalContent.appendChild(modalHeader);
            modalContent.appendChild(settingsContent);
            modal.appendChild(modalContent);
            
            // Close when clicking outside
            modal.addEventListener('click', (e) => {
                if (e.target === modal) modal.remove();
            });
            
            document.body.appendChild(modal);
        },
        
        /**
         * Inject settings panel into Discord settings
         */
        _injectSettingsPanel(fromCustomTab = false) {
            console.log("[Nox] Attempting to inject settings panel");
            
            // Find the settings content region with multiple selectors for different Discord versions
            const contentRegionSelectors = [
                '[class*="contentRegion"]',
                '[class*="contentColumn"]',
                '[class*="standardSidebarView"] [class*="contentRegion"]',
                '[class*="userSettingsWindow"] [class*="contentColumn"]',
                '.contentRegion-2o8Zyn',
                '.contentColumn-1C7as6'
            ];
            
            let contentRegion = null;
            for (const selector of contentRegionSelectors) {
                contentRegion = document.querySelector(selector);
                if (contentRegion) {
                    console.log("[Nox] Found Discord settings content region with selector:", selector);
                    break;
                }
            }
            
            if (!contentRegion) {
                console.warn("[Nox] Could not find Discord settings content region");
                return;
            }
            
            // Check if our settings panel is already there
            if (document.getElementById('nox-settings-container')) {
                console.log("[Nox] Settings panel already exists");
                return;
            }
            
            // Create our settings panel
            const settingsContainer = document.createElement('div');
            settingsContainer.id = 'nox-settings-container';
            settingsContainer.style.cssText = `
                padding: 20px;
                color: var(--text-normal);
            `;
            
            // Add title
            const title = document.createElement('h2');
            title.textContent = fromCustomTab ? 'NoxPlugins Settings' : 'Nox.js Theme Settings';
            title.style.cssText = `
                font-size: 20px;
                font-weight: 600;
                margin-bottom: 20px;
                color: var(--header-primary);
            `;
            
            // Create settings content
            const settingsContent = document.createElement('div');
            
            // Enabled toggle
            const enabledContainer = document.createElement('div');
            enabledContainer.style.cssText = 'margin-bottom: 24px; display: flex; flex-direction: column;';
            
            const enabledLabel = document.createElement('h3');
            enabledLabel.textContent = 'Theme Status';
            enabledLabel.style.cssText = 'font-size: 16px; margin-bottom: 8px; color: var(--header-secondary); font-weight: 600;';
            
            const enabledRow = document.createElement('div');
            enabledRow.style.cssText = 'display: flex; justify-content: space-between; align-items: center;';
            
            const enabledText = document.createElement('div');
            enabledText.textContent = 'Enable Theme By Image';
            enabledText.style.cssText = 'color: var(--text-normal); font-size: 14px;';
            
            const enabledToggle = document.createElement('input');
            enabledToggle.type = 'checkbox';
            enabledToggle.checked = this._themeData.enabled;
            enabledToggle.style.cssText = 'height: 24px; width: 40px;';
            
            enabledToggle.addEventListener('change', (e) => {
                this._themeData.enabled = e.target.checked;
                this._saveSettings();
                this._applyTheme();
            });
            
            enabledRow.appendChild(enabledText);
            enabledRow.appendChild(enabledToggle);
            enabledContainer.appendChild(enabledLabel);
            enabledContainer.appendChild(enabledRow);
            
            // Animation toggle (new feature)
            const animateContainer = document.createElement('div');
            animateContainer.style.cssText = 'margin-bottom: 24px; display: flex; flex-direction: column;';
            
            const animateRow = document.createElement('div');
            animateRow.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-top: 12px;';
            
            const animateText = document.createElement('div');
            animateText.textContent = 'Enable Animation Effects';
            animateText.style.cssText = 'color: var(--text-normal); font-size: 14px;';
            
            const animateToggle = document.createElement('input');
            animateToggle.type = 'checkbox';
            animateToggle.checked = this._themeData.animate || false;
            animateToggle.style.cssText = 'height: 24px; width: 40px;';
            
            animateToggle.addEventListener('change', (e) => {
                this._themeData.animate = e.target.checked;
                this._saveSettings();
                this._applyTheme();
            });
            
            animateRow.appendChild(animateText);
            animateRow.appendChild(animateToggle);
            enabledContainer.appendChild(animateRow);
            
            // Image URL input
            const imageContainer = document.createElement('div');
            imageContainer.style.cssText = 'margin-bottom: 24px;';
            
            const imageLabel = document.createElement('h3');
            imageLabel.textContent = 'Background Image';
            imageLabel.style.cssText = 'font-size: 16px; margin-bottom: 8px; color: var(--header-secondary); font-weight: 600;';
            
            const imageRow = document.createElement('div');
            
            const imageInput = document.createElement('input');
            imageInput.type = 'text';
            imageInput.value = this._themeData.currentImage || '';
            imageInput.placeholder = 'Enter image URL';
            imageInput.style.cssText = `
                width: 100%;
                padding: 10px;
                border-radius: 4px;
                background-color: var(--background-secondary);
                border: 1px solid var(--background-tertiary);
                color: var(--text-normal);
                margin-bottom: 8px;
            `;
            
            const imageDescription = document.createElement('div');
            imageDescription.textContent = 'Enter the URL of the image you want to use as your Discord background.';
            imageDescription.style.cssText = 'color: var(--text-muted); font-size: 12px;';
            
            imageInput.addEventListener('input', (e) => {
                this._themeData.currentImage = e.target.value;
                this._saveSettings();
                this._applyTheme();
            });
            
            imageContainer.appendChild(imageLabel);
            imageContainer.appendChild(imageInput);
            imageContainer.appendChild(imageDescription);
            
            // Brightness slider
            const brightnessContainer = document.createElement('div');
            brightnessContainer.style.cssText = 'margin-bottom: 24px;';
            
            const brightnessLabel = document.createElement('h3');
            brightnessLabel.textContent = 'Appearance';
            brightnessLabel.style.cssText = 'font-size: 16px; margin-bottom: 16px; color: var(--header-secondary); font-weight: 600;';
            
            // Create a grid for adjustments
            const adjustmentsGrid = document.createElement('div');
            adjustmentsGrid.style.cssText = `
                display: grid;
                grid-template-columns: 1fr 1fr;
                grid-gap: 16px;
                margin-bottom: 16px;
            `;
            
            // Brightness
            const brightnessWrapper = document.createElement('div');
            brightnessWrapper.style.cssText = 'margin-bottom: 16px;';
            
            const brightnessHeading = document.createElement('div');
            brightnessHeading.style.cssText = 'display: flex; justify-content: space-between; margin-bottom: 8px;';
            
            const brightnessText = document.createElement('div');
            brightnessText.textContent = 'Brightness';
            brightnessText.style.cssText = 'font-size: 14px; color: var(--text-normal);';
            
            const brightnessValue = document.createElement('div');
            brightnessValue.textContent = this._themeData.brightness;
            brightnessValue.style.cssText = 'font-size: 14px; color: var(--text-muted);';
            
            const brightnessSlider = document.createElement('input');
            brightnessSlider.type = 'range';
            brightnessSlider.min = '0.1';
            brightnessSlider.max = '1';
            brightnessSlider.step = '0.05';
            brightnessSlider.value = this._themeData.brightness;
            brightnessSlider.style.cssText = 'width: 100%;';
            
            brightnessSlider.addEventListener('input', (e) => {
                this._themeData.brightness = parseFloat(e.target.value);
                brightnessValue.textContent = e.target.value;
                this._saveSettings();
                this._applyTheme();
            });
            
            brightnessHeading.appendChild(brightnessText);
            brightnessHeading.appendChild(brightnessValue);
            brightnessWrapper.appendChild(brightnessHeading);
            brightnessWrapper.appendChild(brightnessSlider);
            
            // Opacity
            const opacityWrapper = document.createElement('div');
            opacityWrapper.style.cssText = 'margin-bottom: 16px;';
            
            const opacityHeading = document.createElement('div');
            opacityHeading.style.cssText = 'display: flex; justify-content: space-between; margin-bottom: 8px;';
            
            const opacityText = document.createElement('div');
            opacityText.textContent = 'Opacity';
            opacityText.style.cssText = 'font-size: 14px; color: var(--text-normal);';
            
            const opacityValue = document.createElement('div');
            opacityValue.textContent = this._themeData.opacity;
            opacityValue.style.cssText = 'font-size: 14px; color: var(--text-muted);';
            
            const opacitySlider = document.createElement('input');
            opacitySlider.type = 'range';
            opacitySlider.min = '0.1';
            opacitySlider.max = '1';
            opacitySlider.step = '0.05';
            opacitySlider.value = this._themeData.opacity;
            opacitySlider.style.cssText = 'width: 100%;';
            
            opacitySlider.addEventListener('input', (e) => {
                this._themeData.opacity = parseFloat(e.target.value);
                opacityValue.textContent = e.target.value;
                this._saveSettings();
                this._applyTheme();
            });
            
            opacityHeading.appendChild(opacityText);
            opacityHeading.appendChild(opacityValue);
            opacityWrapper.appendChild(opacityHeading);
            opacityWrapper.appendChild(opacitySlider);
            
            // Blur
            const blurWrapper = document.createElement('div');
            blurWrapper.style.cssText = 'margin-bottom: 16px;';
            
            const blurHeading = document.createElement('div');
            blurHeading.style.cssText = 'display: flex; justify-content: space-between; margin-bottom: 8px;';
            
            const blurText = document.createElement('div');
            blurText.textContent = 'Blur';
            blurText.style.cssText = 'font-size: 14px; color: var(--text-normal);';
            
            const blurValue = document.createElement('div');
            blurValue.textContent = `${this._themeData.blur}px`;
            blurValue.style.cssText = 'font-size: 14px; color: var(--text-muted);';
            
            const blurSlider = document.createElement('input');
            blurSlider.type = 'range';
            blurSlider.min = '0';
            blurSlider.max = '20';
            blurSlider.step = '1';
            blurSlider.value = this._themeData.blur;
            blurSlider.style.cssText = 'width: 100%;';
            
            blurSlider.addEventListener('input', (e) => {
                this._themeData.blur = parseInt(e.target.value);
                blurValue.textContent = `${e.target.value}px`;
                this._saveSettings();
                this._applyTheme();
            });
            
            blurHeading.appendChild(blurText);
            blurHeading.appendChild(blurValue);
            blurWrapper.appendChild(blurHeading);
            blurWrapper.appendChild(blurSlider);
            
            // Background Size
            const sizeWrapper = document.createElement('div');
            sizeWrapper.style.cssText = 'margin-bottom: 16px;';
            
            const sizeHeading = document.createElement('div');
            sizeHeading.style.cssText = 'display: flex; justify-content: space-between; margin-bottom: 8px;';
            
            const sizeText = document.createElement('div');
            sizeText.textContent = 'Background Size';
            sizeText.style.cssText = 'font-size: 14px; color: var(--text-normal);';
            
            const sizeSelect = document.createElement('select');
            sizeSelect.style.cssText = `
                width: 100%;
                padding: 8px;
                border-radius: 4px;
                background-color: var(--background-secondary);
                border: 1px solid var(--background-tertiary);
                color: var(--text-normal);
            `;
            
            const options = [
                { value: 'cover', text: 'Cover (Fill Screen)' },
                { value: 'contain', text: 'Contain (Show All)' },
                { value: '100% 100%', text: 'Stretch' },
                { value: 'auto', text: 'Auto' }
            ];
            
            options.forEach(option => {
                const opt = document.createElement('option');
                opt.value = option.value;
                opt.textContent = option.text;
                if (option.value === this._themeData.size) {
                    opt.selected = true;
                }
                sizeSelect.appendChild(opt);
            });
            
            sizeSelect.addEventListener('change', (e) => {
                this._themeData.size = e.target.value;
                this._saveSettings();
                this._applyTheme();
            });
            
            sizeWrapper.appendChild(sizeText);
            sizeWrapper.appendChild(sizeSelect);
            
            // Animation Speed (only show if animation is enabled)
            const animationWrapper = document.createElement('div');
            animationWrapper.style.cssText = 'margin-bottom: 16px;' + (this._themeData.animate ? '' : 'display: none;');
            animationWrapper.id = 'animation-speed-wrapper';
            
            const animationHeading = document.createElement('div');
            animationHeading.style.cssText = 'display: flex; justify-content: space-between; margin-bottom: 8px;';
            
            const animationText = document.createElement('div');
            animationText.textContent = 'Animation Speed';
            animationText.style.cssText = 'font-size: 14px; color: var(--text-normal);';
            
            const animationValue = document.createElement('div');
            animationValue.textContent = `${this._themeData.animationSpeed || 20}s`;
            animationValue.style.cssText = 'font-size: 14px; color: var(--text-muted);';
            
            const animationSlider = document.createElement('input');
            animationSlider.type = 'range';
            animationSlider.min = '5';
            animationSlider.max = '60';
            animationSlider.step = '5';
            animationSlider.value = this._themeData.animationSpeed || 20;
            animationSlider.style.cssText = 'width: 100%;';
            
            animationSlider.addEventListener('input', (e) => {
                this._themeData.animationSpeed = parseInt(e.target.value);
                animationValue.textContent = `${e.target.value}s`;
                this._saveSettings();
                this._applyTheme();
            });
            
            // Update animation option visibility when animation toggle changes
            animateToggle.addEventListener('change', () => {
                animationWrapper.style.display = animateToggle.checked ? 'block' : 'none';
            });
            
            animationHeading.appendChild(animationText);
            animationHeading.appendChild(animationValue);
            animationWrapper.appendChild(animationHeading);
            animationWrapper.appendChild(animationSlider);
            
            // Add all items to grid
            adjustmentsGrid.appendChild(brightnessWrapper);
            adjustmentsGrid.appendChild(opacityWrapper);
            adjustmentsGrid.appendChild(blurWrapper);
            adjustmentsGrid.appendChild(sizeWrapper);
            adjustmentsGrid.appendChild(animationWrapper);
            
            brightnessContainer.appendChild(brightnessLabel);
            brightnessContainer.appendChild(adjustmentsGrid);
            
            // Reset button
            const buttonContainer = document.createElement('div');
            buttonContainer.style.cssText = 'display: flex; justify-content: flex-end; margin-top: 16px;';
            
            const resetButton = document.createElement('button');
            resetButton.textContent = 'Reset to Default';
            resetButton.style.cssText = `
                padding: 8px 16px;
                background-color: var(--background-secondary);
                border: 1px solid var(--background-tertiary);
                border-radius: 4px;
                color: var(--text-normal);
                cursor: pointer;
                margin-right: 8px;
            `;
            
            resetButton.addEventListener('mouseenter', () => {
                resetButton.style.backgroundColor = 'var(--background-tertiary)';
            });
            
            resetButton.addEventListener('mouseleave', () => {
                resetButton.style.backgroundColor = 'var(--background-secondary)';
            });
            
            resetButton.addEventListener('click', () => {
                // Reset to default values
                this._themeData = {
                    ...this._themeData,
                    brightness: 0.5,
                    opacity: 0.85,
                    blur: 5,
                    size: 'cover',
                    animate: false,
                    animationSpeed: 20
                };
                
                // Update UI
                brightnessSlider.value = this._themeData.brightness;
                brightnessValue.textContent = this._themeData.brightness;
                
                opacitySlider.value = this._themeData.opacity;
                opacityValue.textContent = this._themeData.opacity;
                
                blurSlider.value = this._themeData.blur;
                blurValue.textContent = `${this._themeData.blur}px`;
                
                animateToggle.checked = this._themeData.animate;
                animationWrapper.style.display = this._themeData.animate ? 'block' : 'none';
                
                animationSlider.value = this._themeData.animationSpeed;
                animationValue.textContent = `${this._themeData.animationSpeed}s`;
                
                for (let i = 0; i < sizeSelect.options.length; i++) {
                    if (sizeSelect.options[i].value === this._themeData.size) {
                        sizeSelect.selectedIndex = i;
                        break;
                    }
                }
                
                this._saveSettings();
                this._applyTheme();
            });
            
            buttonContainer.appendChild(resetButton);
            
            // Help text
            const helpText = document.createElement('div');
            helpText.style.cssText = 'margin-top: 24px; padding-top: 16px; border-top: 1px solid var(--background-modifier-accent); color: var(--text-muted); font-size: 12px;';
            helpText.innerHTML = 'Tip: You can quickly toggle the theme on/off with <strong>Alt+T</strong>';
            
            // Assemble the panel
            settingsContent.appendChild(enabledContainer);
            settingsContent.appendChild(imageContainer);
            settingsContent.appendChild(brightnessContainer);
            settingsContent.appendChild(buttonContainer);
            settingsContent.appendChild(helpText);
            
            settingsContainer.appendChild(title);
            settingsContainer.appendChild(settingsContent);
            
            // Check if the content region has typical Discord components we should preserve
            const existingToolbar = contentRegion.querySelector('[class*="toolsContainer"]');
            const existingHeader = contentRegion.querySelector('[class*="contentHeaderTitle"]');
            
            // Safer approach - try to just append our content instead of clearing everything
            if (fromCustomTab || !existingToolbar) {
                // For our custom tab or when we don't detect Discord header components, 
                // we can safely clear and replace content
                console.log("[Nox] Replacing Discord settings content with our panel");
                contentRegion.innerHTML = '';
                contentRegion.appendChild(settingsContainer);
            } else {
                // For standard Discord settings, try to keep the header and toolbar
                // But remove any previously added content to avoid duplication
                console.log("[Nox] Preserving Discord UI components while adding our panel");
                
                // Check if we already added our container and remove if exists
                const oldContainer = contentRegion.querySelector('#nox-settings-container');
                if (oldContainer) {
                    oldContainer.remove();
                }
                
                // Add our content after the header (if it exists)
                if (existingHeader && existingHeader.parentNode) {
                    existingHeader.parentNode.after(settingsContainer);
                } else {
                    // No header found, append to the content region
                    contentRegion.appendChild(settingsContainer);
                }
            }
            
            console.log("[Nox] Settings panel injected successfully");
        },
        
        /**
         * Apply the theme with the current settings
         */
        _applyTheme() {
            if (!this._styleElement) {
                this._styleElement = document.createElement('style');
                this._styleElement.id = 'nox-theme-styles';
                document.head.appendChild(this._styleElement);
            }
            
            if (this._themeData.enabled && this._themeData.currentImage) {
                // Determine if animation should be applied
                const animationCSS = this._themeData.animate ? `
                    @keyframes backgroundPan {
                        0% {
                            background-position: 0% 0%;
                        }
                        50% {
                            background-position: 100% 100%;
                        }
                        100% {
                            background-position: 0% 0%;
                        }
                    }
                    
                    body::before {
                        animation: backgroundPan ${this._themeData.animationSpeed || 20}s ease infinite;
                        background-size: 150% 150% !important;
                    }
                ` : '';
                
                // Create the CSS that will be injected
                const css = `
                    /* Nox Theme By Image */
                    body::before {
                        content: "";
                        position: fixed;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        background-image: url(${this._themeData.currentImage});
                        background-size: ${this._themeData.size};
                        background-position: center;
                        background-repeat: no-repeat;
                        filter: brightness(${this._themeData.brightness}) blur(${this._themeData.blur}px);
                        opacity: ${this._themeData.opacity};
                        z-index: -1;
                        pointer-events: none;
                    }
                    
                    /* Animation effect if enabled */
                    ${animationCSS}
                    
                    /* Adjustments for Discord elements */
                    .theme-dark, .theme-light {
                        --background-primary: rgba(30, 30, 30, 0.7);
                        --background-secondary: rgba(40, 40, 40, 0.7);
                        --background-secondary-alt: rgba(35, 35, 35, 0.7);
                        --background-tertiary: rgba(25, 25, 25, 0.7);
                        --channeltextarea-background: rgba(50, 50, 50, 0.7);
                        --background-floating: rgba(20, 20, 20, 0.9);
                    }
                    
                    /* Style for Nox custom settings tab */
                    #nox-settings-tab {
                        color: var(--header-primary);
                    }
                    
                    #nox-settings-tab .noxIcon {
                        color: #5865F2;
                    }
                    
                    /* Style when our settings tab is selected */
                    #nox-settings-tab.selected {
                        background-color: var(--background-modifier-selected);
                    }
                `;
                
                this._styleElement.textContent = css;
                console.log("[Nox] Theme applied with image:", this._themeData.currentImage);
            } else {
                // Clear the styles if disabled
                this._styleElement.textContent = '';
                console.log("[Nox] Theme disabled");
            }
        },
        
        /**
         * Send stats to the Nox server
         * This is more of a placeholder for the future - on Discord this will be blocked by CSP
         * We only attempt this when not on Discord domains
         */
        _sendStats(action) {
            // Skip stats for Discord domains (due to Content Security Policy)
            if (window.location.hostname.includes('discord.com')) {
                return;
            }
            
            try {
                // Create a beacon request - this is less likely to be blocked and doesn't need a response
                const data = {
                    action,
                    version: this.version,
                    timestamp: new Date().toISOString()
                };
                
                // Attempt to send beacon (won't block even if it fails)
                if (navigator.sendBeacon) {
                    const blob = new Blob([JSON.stringify(data)], {type: 'application/json'});
                    navigator.sendBeacon('https://nox-js.example.com/api/stats', blob);
                    return;
                }
                
                // Fallback to fetch for older browsers
                fetch('https://nox-js.example.com/api/stats', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(data),
                    // These options make the request more likely to succeed
                    mode: 'no-cors',
                    keepalive: true,
                    credentials: 'omit'
                }).catch(() => {
                    // Silently fail, no need to bother the user if stats fail
                });
            } catch (err) {
                // Ignore errors
            }
        }
    };
    
    // Add to global Nox namespace
    window.Nox.ThemeByImage = NoxPlugin;
    
    // Initialize when Discord is ready
    function checkForDiscord() {
        if (document.body && document.querySelector('[class*="app-"]')) {
            window.Nox.ThemeByImage.init();
        } else {
            setTimeout(checkForDiscord, 100);
        }
    }
    
    checkForDiscord();
})();

// Export for compatibility with module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.Nox;
}
