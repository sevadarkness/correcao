// popup.js - Premium popup with quick actions and stats

document.addEventListener('DOMContentLoaded', async () => {
    console.log('[Popup] Initializing...');
    
    // Get elements
    const statusDot = document.getElementById('statusDot');
    const statusText = document.getElementById('statusText');
    const btnOpenPanel = document.getElementById('btnOpenPanel');
    const btnExtractContacts = document.getElementById('btnExtractContacts');
    const btnRecover = document.getElementById('btnRecover');
    const statSent = document.getElementById('statSent');
    const statPending = document.getElementById('statPending');
    const statSuccess = document.getElementById('statSuccess');
    const statFailed = document.getElementById('statFailed');
    
    // Load stats from storage
    async function loadStats() {
        try {
            const result = await chrome.storage.local.get(['campaignState', 'whl_statistics']);
            
            if (result.campaignState) {
                const stats = result.campaignState.stats || {};
                statSent.textContent = stats.sent || 0;
                statFailed.textContent = stats.failed || 0;
                statPending.textContent = stats.pending || 0;
                statSuccess.textContent = stats.sent || 0; // Success = sent for now
            }
            
            if (result.whl_statistics) {
                statSuccess.textContent = result.whl_statistics.totalSuccess || 0;
            }
        } catch (e) {
            console.error('[Popup] Error loading stats:', e);
        }
    }
    
    // Update connection status
    async function updateStatus() {
        try {
            const tabs = await chrome.tabs.query({ 
                url: 'https://web.whatsapp.com/*' 
            });
            
            if (tabs.length > 0) {
                statusDot.style.background = '#25d366';
                statusDot.style.boxShadow = '0 0 10px #25d366';
                statusText.textContent = 'Conectado';
            } else {
                statusDot.style.background = '#ff3b30';
                statusDot.style.boxShadow = '0 0 10px #ff3b30';
                statusText.textContent = 'WhatsApp não aberto';
            }
        } catch (e) {
            console.error('[Popup] Error checking status:', e);
            statusDot.style.background = '#ff9500';
            statusDot.style.boxShadow = '0 0 10px #ff9500';
            statusText.textContent = 'Status desconhecido';
        }
    }
    
    // Open Side Panel
    btnOpenPanel.addEventListener('click', async () => {
        try {
            const tabs = await chrome.tabs.query({ 
                active: true, 
                currentWindow: true 
            });
            
            if (tabs[0]) {
                await chrome.sidePanel.open({ tabId: tabs[0].id });
                window.close();
            }
        } catch (e) {
            console.error('[Popup] Error opening panel:', e);
        }
    });
    
    // Extract Contacts
    btnExtractContacts.addEventListener('click', async () => {
        try {
            const tabs = await chrome.tabs.query({ 
                url: 'https://web.whatsapp.com/*' 
            });
            
            if (tabs.length === 0) {
                alert('Abra o WhatsApp Web primeiro!');
                return;
            }
            
            // Send message to content script
            await chrome.tabs.sendMessage(tabs[0].id, {
                action: 'extractContacts'
            });
            
            statusText.textContent = 'Extraindo contatos...';
            
            // Open side panel to show results
            await chrome.sidePanel.open({ tabId: tabs[0].id });
            window.close();
        } catch (e) {
            console.error('[Popup] Error extracting contacts:', e);
            alert('Erro ao extrair contatos. Certifique-se de estar no WhatsApp Web.');
        }
    });
    
    // Open Recover tab
    btnRecover.addEventListener('click', async () => {
        try {
            const tabs = await chrome.tabs.query({ 
                url: 'https://web.whatsapp.com/*' 
            });
            
            if (tabs.length === 0) {
                alert('Abra o WhatsApp Web primeiro!');
                return;
            }
            
            // Send message to switch to recover tab
            await chrome.tabs.sendMessage(tabs[0].id, {
                action: 'switchTab',
                tab: 'recover'
            });
            
            // Open side panel
            await chrome.sidePanel.open({ tabId: tabs[0].id });
            window.close();
        } catch (e) {
            console.error('[Popup] Error opening recover:', e);
        }
    });
    
    // Initial load
    await updateStatus();
    await loadStats();
    
    // Update status every 5 seconds
    setInterval(updateStatus, 5000);
    
    // Update stats every 3 seconds
    setInterval(loadStats, 3000);
    
    console.log('[Popup] Initialized successfully');
});
