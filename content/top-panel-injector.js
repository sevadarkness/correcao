// top-panel-injector.js - Injects a top panel into WhatsApp Web
// This panel creates an "L" shaped layout with the Side Panel

(function() {
    'use strict';

    console.log('[TopPanel] 🚀 Initializing top panel injector...');

    // Wait for WhatsApp to load
    function waitForWhatsApp() {
        return new Promise((resolve) => {
            const checkInterval = setInterval(() => {
                const whatsappRoot = document.getElementById('app');
                if (whatsappRoot) {
                    clearInterval(checkInterval);
                    console.log('[TopPanel] ✅ WhatsApp loaded, injecting panel...');
                    resolve();
                }
            }, 500);
        });
    }

    // Create the top panel HTML
    function createTopPanel() {
        const panel = document.createElement('div');
        panel.id = 'wa-extractor-top-panel';
        panel.className = 'wa-extractor-top-panel hidden'; // Start hidden
        
        panel.innerHTML = `
            <div class="top-panel-container">
                <div class="top-panel-left">
                    <div class="top-panel-logo">
                        <span class="logo-icon">👥</span>
                        <span class="logo-text">WA Extractor</span>
                    </div>
                </div>
                <div class="top-panel-center">
                    <div class="top-panel-tabs">
                        <button class="top-panel-tab active" data-tab="extractor">
                            <span class="tab-icon">📥</span>
                            <span class="tab-label">Extrator</span>
                        </button>
                        <button class="top-panel-tab" data-tab="tools">
                            <span class="tab-icon">🛠️</span>
                            <span class="tab-label">Ferramentas</span>
                        </button>
                    </div>
                </div>
                <div class="top-panel-right">
                    <!-- Minimize button removed -->
                </div>
            </div>
        `;
        
        return panel;
    }

    // Inject the panel into WhatsApp
    function injectPanel() {
        // Check if already injected
        if (document.getElementById('wa-extractor-top-panel')) {
            console.log('[TopPanel] ⚠️ Panel already injected');
            return;
        }

        const panel = createTopPanel();
        document.body.insertBefore(panel, document.body.firstChild);
        
        // DO NOT compress WhatsApp content yet - wait for side panel to open
        
        // Setup event listeners
        setupEventListeners(panel);
        
        console.log('[TopPanel] ✅ Panel injected successfully (hidden by default)');
    }

    // Compress WhatsApp to make room for the panel
    function compressWhatsAppContent() {
        const whatsappRoot = document.getElementById('app');
        if (whatsappRoot) {
            whatsappRoot.style.marginTop = '64px'; // Height of top panel (updated to 64px)
            console.log('[TopPanel] ✅ WhatsApp content compressed');
        }
    }

    // Show top panel
    function showTopPanel() {
        const panel = document.getElementById('wa-extractor-top-panel');
        if (panel) {
            panel.classList.remove('hidden');
            compressWhatsAppContent();
            console.log('[TopPanel] ✅ Top panel shown');
        }
    }

    // Hide top panel
    function hideTopPanel() {
        const panel = document.getElementById('wa-extractor-top-panel');
        if (panel) {
            panel.classList.add('hidden');
            // Restore WhatsApp to normal size
            const whatsappRoot = document.getElementById('app');
            if (whatsappRoot) {
                whatsappRoot.style.marginTop = '0';
            }
            console.log('[TopPanel] ✅ Top panel hidden');
        }
    }

    // Setup event listeners for the panel
    function setupEventListeners(panel) {
        // Tab switching
        const tabs = panel.querySelectorAll('.top-panel-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // Remove active from all tabs
                tabs.forEach(t => t.classList.remove('active'));
                // Add active to clicked tab
                tab.classList.add('active');
                
                const tabName = tab.dataset.tab;
                console.log(`[TopPanel] Tab switched to: ${tabName}`);
                
                // Send message to Side Panel to update if needed
                chrome.runtime.sendMessage({
                    action: 'topPanelTabChanged',
                    tab: tabName
                }).catch(() => {
                    // Ignore errors if side panel is not open
                });
            });
        });

        // Listen for messages from background script to show/hide panel
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            if (message.action === 'showTopPanel') {
                showTopPanel();
                sendResponse({ success: true });
            } else if (message.action === 'hideTopPanel') {
                hideTopPanel();
                sendResponse({ success: true });
            }
            return true; // Keep message channel open for async response
        });
    }

    // Initialize
    async function init() {
        await waitForWhatsApp();
        // Add a small delay to ensure WhatsApp is fully rendered
        setTimeout(() => {
            injectPanel();
        }, 1000);
    }

    // Start the injection process
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
