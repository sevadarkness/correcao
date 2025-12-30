// top-panel-injector.js - Compact Top Bar (~64px)
// Creates ONLY a compact bar with tabs at the top of WhatsApp
// Content is handled by the Side Panel, NOT the top bar

(function() {
    'use strict';

    console.log('[TopPanel] 🚀 Initializing compact top bar...');

    // Wait for WhatsApp to load
    function waitForWhatsApp() {
        return new Promise((resolve) => {
            const checkInterval = setInterval(() => {
                const whatsappRoot = document.getElementById('app');
                if (whatsappRoot) {
                    clearInterval(checkInterval);
                    console.log('[TopPanel] ✅ WhatsApp loaded, injecting compact bar...');
                    resolve();
                }
            }, 500);
        });
    }

    // Create the compact top bar HTML (only tabs, no content)
    function createTopBar() {
        const bar = document.createElement('div');
        bar.id = 'wa-extractor-top-panel';
        bar.className = 'wa-extractor-top-panel hidden';
        
        bar.innerHTML = `
            <div class="top-panel-container">
                <div class="top-panel-left">
                    <div class="top-panel-logo">
                        <span class="logo-icon">👥</span>
                        <span class="logo-text">WA Extractor</span>
                    </div>
                </div>
                <div class="top-panel-center">
                    <div class="top-panel-tabs">
                        <button class="top-panel-tab active" data-tab="principal">
                            <span class="tab-icon">🏠</span>
                            <span class="tab-label">Principal</span>
                        </button>
                        <button class="top-panel-tab" data-tab="extractor">
                            <span class="tab-icon">📥</span>
                            <span class="tab-label">Extrator</span>
                        </button>
                        <button class="top-panel-tab" data-tab="grupos">
                            <span class="tab-icon">👥</span>
                            <span class="tab-label">Grupos</span>
                        </button>
                        <button class="top-panel-tab" data-tab="recover">
                            <span class="tab-icon">🔄</span>
                            <span class="tab-label">Recover</span>
                        </button>
                        <button class="top-panel-tab" data-tab="config">
                            <span class="tab-icon">⚙️</span>
                            <span class="tab-label">Config</span>
                        </button>
                    </div>
                </div>
                <div class="top-panel-right">
                    <button class="top-panel-close" title="Fechar">✕</button>
                </div>
            </div>
        `;
        
        return bar;
    }

    // Inject the compact bar into WhatsApp
    function injectBar() {
        // Check if already injected
        if (document.getElementById('wa-extractor-top-panel')) {
            console.log('[TopPanel] ⚠️ Bar already injected');
            return;
        }
        
        const bar = createTopBar();
        document.body.insertBefore(bar, document.body.firstChild);
        
        // Add margin-top to WhatsApp root to accommodate the bar
        const whatsappRoot = document.getElementById('app');
        if (whatsappRoot) {
            whatsappRoot.style.marginTop = '64px';
        }
        
        console.log('[TopPanel] ✅ Compact bar injected successfully');
        
        // Setup event listeners
        setupEventListeners(bar);
    }

    // Setup event listeners for the bar
    function setupEventListeners(bar) {
        // Tab switching
        const tabs = bar.querySelectorAll('.top-panel-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.dataset.tab;
                
                // Remove active class from all tabs
                tabs.forEach(t => t.classList.remove('active'));
                // Add active class to clicked tab
                tab.classList.add('active');
                
                console.log('[TopPanel] Tab clicked:', tabName);
                
                // Send message to background to broadcast tab switch
                chrome.runtime.sendMessage({ 
                    action: 'switchTab', 
                    tab: tabName 
                }).then(() => {
                    console.log('[TopPanel] Tab switch message sent successfully');
                }).catch(err => {
                    console.log('[TopPanel] Could not send tab switch message:', err.message);
                });
                
                // Also dispatch local event
                window.dispatchEvent(new CustomEvent('wa-extractor-switch-tab', { 
                    detail: { tab: tabName } 
                }));
            });
        });
        
        // Close button
        const closeBtn = bar.querySelector('.top-panel-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                hideBar();
            });
        }
    }

    // Listen for tab switch events from content script
    window.addEventListener('wa-extractor-switch-tab', (event) => {
        const tabName = event.detail.tab;
        console.log('[TopPanel] Received tab switch event:', tabName);
        
        // Update tab UI
        const tabs = document.querySelectorAll('.top-panel-tab');
        tabs.forEach(tab => {
            if (tab.dataset.tab === tabName) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });
    });

    // Show the top bar
    function showBar() {
        const bar = document.getElementById('wa-extractor-top-panel');
        if (bar) {
            bar.classList.remove('hidden');
            console.log('[TopPanel] 📌 Bar shown');
        }
    }

    // Hide the top bar
    function hideBar() {
        const bar = document.getElementById('wa-extractor-top-panel');
        if (bar) {
            bar.classList.add('hidden');
            console.log('[TopPanel] 📌 Bar hidden');
            
            // Remove margin from WhatsApp root
            const whatsappRoot = document.getElementById('app');
            if (whatsappRoot) {
                whatsappRoot.style.marginTop = '0';
            }
        }
    }

    // Listen for messages from background script
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.action === 'showTopPanel') {
            showBar();
            sendResponse({ success: true });
        } else if (message.action === 'hideTopPanel') {
            hideBar();
            sendResponse({ success: true });
        }
        return true; // Keep channel open for async response
    });

    // Initialize
    async function init() {
        await waitForWhatsApp();
        // Add a small delay to ensure WhatsApp is fully rendered
        setTimeout(() => {
            injectBar();
        }, 1000);
    }

    // Start the injection process
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
