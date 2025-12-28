// wpp-hooks.js - WhatsApp Hooks for Message Recovery and Contact Extraction
// Integrated from WhatsHybrid Lite

console.log('[WA Hooks] 🎣 Initializing WhatsApp hooks...');

// Storage for recovered messages
let recoveredMessages = [];
const MAX_RECOVERED_MESSAGES = 100; // Limit storage

// ========================================
// MESSAGE RECOVERY HOOKS
// ========================================

/**
 * Hook into WhatsApp's message rendering to detect deleted/edited messages
 */
function initializeMessageRecoveryHooks() {
    try {
        // Hook into message rendering
        const originalRender = window.Store?.Msg?.prototype?.render;
        if (originalRender) {
            window.Store.Msg.prototype.render = function(...args) {
                try {
                    // Check if message was deleted or edited
                    if (this.isRevoked || this.isDeleted) {
                        saveRecoveredMessage({
                            type: 'deleted',
                            id: this.id._serialized || this.id,
                            from: this.from?._serialized || this.from,
                            to: this.to?._serialized || this.to,
                            body: this.body || '',
                            timestamp: this.t || Date.now(),
                            sender: this.senderName || this.notifyName || 'Unknown',
                            mediaType: this.type || 'text'
                        });
                    }
                    
                    if (this.isEdited) {
                        saveRecoveredMessage({
                            type: 'edited',
                            id: this.id._serialized || this.id,
                            from: this.from?._serialized || this.from,
                            to: this.to?._serialized || this.to,
                            body: this.body || '',
                            originalBody: this.originalBody || '',
                            timestamp: this.t || Date.now(),
                            sender: this.senderName || this.notifyName || 'Unknown',
                            mediaType: this.type || 'text'
                        });
                    }
                } catch (err) {
                    console.error('[WA Hooks] Error in render hook:', err);
                }
                
                return originalRender.apply(this, args);
            };
            console.log('[WA Hooks] ✅ Message recovery hook installed');
        }
    } catch (error) {
        console.error('[WA Hooks] Failed to install message recovery hook:', error);
    }
}

/**
 * Save recovered message to storage
 */
function saveRecoveredMessage(messageData) {
    try {
        // Add to beginning of array (most recent first)
        recoveredMessages.unshift({
            ...messageData,
            recoveredAt: Date.now()
        });
        
        // Limit storage
        if (recoveredMessages.length > MAX_RECOVERED_MESSAGES) {
            recoveredMessages = recoveredMessages.slice(0, MAX_RECOVERED_MESSAGES);
        }
        
        // Save to chrome storage
        chrome.storage.local.set({ recoveredMessages }).catch(console.error);
        
        // Notify content script
        window.postMessage({
            type: 'MESSAGE_RECOVERED',
            data: messageData
        }, '*');
        
        console.log('[WA Hooks] 💾 Message recovered:', messageData.type);
    } catch (error) {
        console.error('[WA Hooks] Error saving recovered message:', error);
    }
}

/**
 * Get all recovered messages
 */
function getRecoveredMessages() {
    return recoveredMessages;
}

/**
 * Clear recovered messages
 */
function clearRecoveredMessages() {
    recoveredMessages = [];
    chrome.storage.local.set({ recoveredMessages: [] }).catch(console.error);
    console.log('[WA Hooks] 🗑️ Recovered messages cleared');
}

// ========================================
// CONTACT EXTRACTION VIA API
// ========================================

/**
 * Extract all contacts using WhatsApp's internal API
 */
async function extractContacts() {
    try {
        console.log('[WA Hooks] 📱 Extracting contacts...');
        
        if (!window.Store?.Contact) {
            throw new Error('WhatsApp Store not available');
        }
        
        const contacts = {
            normal: [],
            archived: [],
            blocked: []
        };
        
        // Get all contacts
        const allContacts = window.Store.Contact.getModelsArray();
        
        for (const contact of allContacts) {
            try {
                const phone = contact.id?._serialized || contact.id?.user || '';
                if (!phone || phone === 'status@broadcast') continue;
                
                const contactData = {
                    phone: cleanPhoneNumber(phone),
                    name: contact.name || contact.pushname || contact.verifiedName || '',
                    isGroup: contact.isGroup || false,
                    isBlocked: contact.isBlocked || false,
                    isArchived: contact.archive || false
                };
                
                // Skip groups
                if (contactData.isGroup) continue;
                
                // Categorize
                if (contactData.isBlocked) {
                    contacts.blocked.push(contactData);
                } else if (contactData.isArchived) {
                    contacts.archived.push(contactData);
                } else {
                    contacts.normal.push(contactData);
                }
            } catch (err) {
                console.error('[WA Hooks] Error processing contact:', err);
            }
        }
        
        console.log('[WA Hooks] ✅ Contacts extracted:', {
            normal: contacts.normal.length,
            archived: contacts.archived.length,
            blocked: contacts.blocked.length
        });
        
        return contacts;
    } catch (error) {
        console.error('[WA Hooks] Error extracting contacts:', error);
        throw error;
    }
}

/**
 * Extract archived contacts
 */
async function extractArchivedContacts() {
    try {
        const contacts = await extractContacts();
        return contacts.archived;
    } catch (error) {
        console.error('[WA Hooks] Error extracting archived contacts:', error);
        throw error;
    }
}

/**
 * Extract blocked contacts
 */
async function extractBlockedContacts() {
    try {
        const contacts = await extractContacts();
        return contacts.blocked;
    } catch (error) {
        console.error('[WA Hooks] Error extracting blocked contacts:', error);
        throw error;
    }
}

/**
 * Clean phone number (remove special characters, keep only digits)
 */
function cleanPhoneNumber(phone) {
    if (!phone) return '';
    
    // Remove @c.us, @g.us, etc.
    phone = phone.split('@')[0];
    
    // Remove all non-digit characters
    phone = phone.replace(/\D/g, '');
    
    return phone;
}

// ========================================
// MESSAGE SENDING VIA API
// ========================================

/**
 * Send text message using WhatsApp's internal API
 */
async function sendMessageAPI(phone, message) {
    try {
        console.log('[WA Hooks] 📤 Sending message to:', phone);
        
        if (!window.Store?.Chat || !window.Store?.Msg) {
            throw new Error('WhatsApp Store not available');
        }
        
        // Normalize phone number
        const chatId = phone.includes('@') ? phone : `${phone}@c.us`;
        
        // Get or create chat
        let chat = await window.Store.Chat.find(chatId);
        if (!chat) {
            // Create new chat
            chat = await window.Store.Chat.add({
                id: chatId,
                isGroup: false
            });
        }
        
        // Send message
        await window.Store.Msg.addAndSendMsg(chat, {
            type: 'chat',
            body: message
        });
        
        console.log('[WA Hooks] ✅ Message sent successfully');
        return { success: true };
    } catch (error) {
        console.error('[WA Hooks] Error sending message:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Type message in input field (humanized)
 */
async function typeMessageInField(message, delay = 50) {
    try {
        const inputField = document.querySelector('[contenteditable="true"][data-tab="10"]');
        if (!inputField) {
            throw new Error('Message input field not found');
        }
        
        inputField.focus();
        
        // Clear existing content
        inputField.innerHTML = '';
        
        // Type character by character
        for (let i = 0; i < message.length; i++) {
            inputField.textContent += message[i];
            
            // Trigger input event
            inputField.dispatchEvent(new InputEvent('input', { bubbles: true }));
            
            // Random delay to simulate human typing
            await new Promise(resolve => setTimeout(resolve, delay + Math.random() * delay));
        }
        
        return true;
    } catch (error) {
        console.error('[WA Hooks] Error typing message:', error);
        return false;
    }
}

// ========================================
// INITIALIZATION
// ========================================

/**
 * Wait for WhatsApp Store to be available
 */
function waitForWhatsAppStore() {
    return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
            if (window.Store?.Chat && window.Store?.Msg && window.Store?.Contact) {
                clearInterval(checkInterval);
                console.log('[WA Hooks] ✅ WhatsApp Store available');
                resolve();
            }
        }, 1000);
    });
}

/**
 * Initialize all hooks
 */
async function initializeHooks() {
    try {
        await waitForWhatsAppStore();
        
        // Initialize message recovery
        initializeMessageRecoveryHooks();
        
        // Load recovered messages from storage
        chrome.storage.local.get('recoveredMessages').then(result => {
            if (result.recoveredMessages) {
                recoveredMessages = result.recoveredMessages;
                console.log('[WA Hooks] 📥 Loaded', recoveredMessages.length, 'recovered messages');
            }
        }).catch(console.error);
        
        console.log('[WA Hooks] ✅ All hooks initialized');
    } catch (error) {
        console.error('[WA Hooks] Initialization error:', error);
    }
}

// ========================================
// EXPORTS (via window.postMessage)
// ========================================

// Expose functions to content script via message passing
window.addEventListener('message', async (event) => {
    if (event.source !== window) return;
    
    const { type, data } = event.data;
    
    try {
        switch (type) {
            case 'EXTRACT_CONTACTS':
                const contacts = await extractContacts();
                window.postMessage({ type: 'EXTRACT_CONTACTS_RESULT', data: contacts }, '*');
                break;
                
            case 'EXTRACT_ARCHIVED':
                const archived = await extractArchivedContacts();
                window.postMessage({ type: 'EXTRACT_ARCHIVED_RESULT', data: archived }, '*');
                break;
                
            case 'EXTRACT_BLOCKED':
                const blocked = await extractBlockedContacts();
                window.postMessage({ type: 'EXTRACT_BLOCKED_RESULT', data: blocked }, '*');
                break;
                
            case 'GET_RECOVERED_MESSAGES':
                window.postMessage({ type: 'GET_RECOVERED_MESSAGES_RESULT', data: getRecoveredMessages() }, '*');
                break;
                
            case 'CLEAR_RECOVERED_MESSAGES':
                clearRecoveredMessages();
                window.postMessage({ type: 'CLEAR_RECOVERED_MESSAGES_RESULT', data: { success: true } }, '*');
                break;
                
            case 'SEND_MESSAGE_API':
                const result = await sendMessageAPI(data.phone, data.message);
                window.postMessage({ type: 'SEND_MESSAGE_API_RESULT', data: result }, '*');
                break;
                
            case 'TYPE_MESSAGE':
                const typed = await typeMessageInField(data.message, data.delay);
                window.postMessage({ type: 'TYPE_MESSAGE_RESULT', data: { success: typed } }, '*');
                break;
        }
    } catch (error) {
        console.error('[WA Hooks] Message handler error:', error);
        window.postMessage({ 
            type: type + '_RESULT', 
            data: { success: false, error: error.message } 
        }, '*');
    }
});

// Start initialization
initializeHooks();

console.log('[WA Hooks] 🎣 Hooks module loaded');
