// campaign.js - Mass Sending Campaign Management
// Integrated from WhatsHybrid Lite

console.log('[Campaign] 📢 Initializing campaign manager...');

// ========================================
// CAMPAIGN STATE
// ========================================

class CampaignManager {
    constructor() {
        this.queue = [];
        this.currentIndex = 0;
        this.isRunning = false;
        this.isPaused = false;
        this.stats = {
            sent: 0,
            failed: 0,
            pending: 0
        };
        this.config = {
            delayMin: 5, // seconds
            delayMax: 10, // seconds
            useRandomDelay: true
        };
    }
    
    /**
     * Set campaign configuration
     */
    setConfig(config) {
        this.config = { ...this.config, ...config };
    }
    
    /**
     * Generate queue from contacts and message template
     */
    generateQueue(contacts, messageTemplate, imageData = null) {
        this.queue = contacts.map((contact, index) => ({
            id: index + 1,
            phone: contact.phone,
            name: contact.name || '',
            message: this.replaceVariables(messageTemplate, contact),
            image: imageData,
            status: 'pending', // pending, sending, sent, failed
            error: null,
            timestamp: null
        }));
        
        this.currentIndex = 0;
        this.updateStats();
        
        console.log('[Campaign] 📋 Queue generated:', this.queue.length, 'items');
    }
    
    /**
     * Replace variables in message template
     */
    replaceVariables(template, contact) {
        let message = template;
        
        // Replace {{nome}} with full name
        message = message.replace(/\{\{nome\}\}/gi, contact.name || contact.phone);
        
        // Replace {{first_name}} with first name
        const firstName = contact.name ? contact.name.split(' ')[0] : contact.phone;
        message = message.replace(/\{\{first_name\}\}/gi, firstName);
        
        // Replace {{phone}} with phone number
        message = message.replace(/\{\{phone\}\}/gi, contact.phone);
        
        return message;
    }
    
    /**
     * Update statistics
     */
    updateStats() {
        this.stats = {
            sent: this.queue.filter(item => item.status === 'sent').length,
            failed: this.queue.filter(item => item.status === 'failed').length,
            pending: this.queue.filter(item => item.status === 'pending').length
        };
    }
    
    /**
     * Get queue item by index
     */
    getItem(index) {
        return this.queue[index];
    }
    
    /**
     * Get current item
     */
    getCurrentItem() {
        return this.queue[this.currentIndex];
    }
    
    /**
     * Mark item as sent
     */
    markAsSent(index) {
        if (this.queue[index]) {
            this.queue[index].status = 'sent';
            this.queue[index].timestamp = Date.now();
            this.updateStats();
        }
    }
    
    /**
     * Mark item as failed
     */
    markAsFailed(index, error) {
        if (this.queue[index]) {
            this.queue[index].status = 'failed';
            this.queue[index].error = error;
            this.queue[index].timestamp = Date.now();
            this.updateStats();
        }
    }
    
    /**
     * Skip current item
     */
    skipCurrent() {
        if (this.currentIndex < this.queue.length) {
            this.queue[this.currentIndex].status = 'failed';
            this.queue[this.currentIndex].error = 'Skipped by user';
            this.currentIndex++;
            this.updateStats();
        }
    }
    
    /**
     * Move to next item
     */
    moveNext() {
        this.currentIndex++;
    }
    
    /**
     * Check if campaign is complete
     */
    isComplete() {
        return this.currentIndex >= this.queue.length;
    }
    
    /**
     * Get progress percentage
     */
    getProgress() {
        if (this.queue.length === 0) return 0;
        return Math.round((this.currentIndex / this.queue.length) * 100);
    }
    
    /**
     * Calculate random delay
     */
    getRandomDelay() {
        const min = this.config.delayMin * 1000;
        const max = this.config.delayMax * 1000;
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    
    /**
     * Reset campaign
     */
    reset() {
        this.queue = [];
        this.currentIndex = 0;
        this.isRunning = false;
        this.isPaused = false;
        this.stats = { sent: 0, failed: 0, pending: 0 };
        console.log('[Campaign] 🔄 Campaign reset');
    }
    
    /**
     * Clear queue
     */
    clearQueue() {
        this.reset();
    }
    
    /**
     * Remove item from queue
     */
    removeItem(index) {
        if (index >= 0 && index < this.queue.length) {
            this.queue.splice(index, 1);
            if (this.currentIndex > index) {
                this.currentIndex--;
            }
            this.updateStats();
        }
    }
    
    /**
     * Export queue to CSV
     */
    exportToCSV() {
        let csv = 'id,phone,name,status,error,timestamp\n';
        
        for (const item of this.queue) {
            const name = (item.name || '').replace(/"/g, '""');
            const error = (item.error || '').replace(/"/g, '""');
            csv += `${item.id},${item.phone},"${name}",${item.status},"${error}",${item.timestamp || ''}\n`;
        }
        
        return csv;
    }
    
    /**
     * Get failed items
     */
    getFailedItems() {
        return this.queue.filter(item => item.status === 'failed');
    }
    
    /**
     * Export failed items
     */
    exportFailedToText() {
        const failed = this.getFailedItems();
        return failed.map(item => `${item.phone} - ${item.error || 'Unknown error'}`).join('\n');
    }
}

// ========================================
// CAMPAIGN EXECUTION
// ========================================

/**
 * Execute campaign step by step
 */
async function executeCampaignStep(manager, sendFunction) {
    if (!manager.isRunning || manager.isPaused) {
        return { stopped: true };
    }
    
    if (manager.isComplete()) {
        return { complete: true };
    }
    
    const item = manager.getCurrentItem();
    if (!item) {
        return { complete: true };
    }
    
    try {
        console.log(`[Campaign] 📤 Sending to ${item.phone}...`);
        
        // Update status
        item.status = 'sending';
        
        // Send message
        const result = await sendFunction(item);
        
        if (result.success) {
            manager.markAsSent(manager.currentIndex);
            console.log(`[Campaign] ✅ Sent successfully to ${item.phone}`);
        } else {
            manager.markAsFailed(manager.currentIndex, result.error || 'Unknown error');
            console.log(`[Campaign] ❌ Failed to send to ${item.phone}:`, result.error);
        }
        
        // Move to next
        manager.moveNext();
        
        // Random delay before next
        if (!manager.isComplete() && manager.config.useRandomDelay) {
            const delay = manager.getRandomDelay();
            console.log(`[Campaign] ⏳ Waiting ${delay}ms before next...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
        
        return { success: true, progress: manager.getProgress() };
    } catch (error) {
        console.error('[Campaign] Error in campaign step:', error);
        manager.markAsFailed(manager.currentIndex, error.message);
        manager.moveNext();
        return { success: false, error: error.message };
    }
}

/**
 * Start campaign execution loop
 */
async function startCampaign(manager, sendFunction, progressCallback) {
    manager.isRunning = true;
    manager.isPaused = false;
    
    console.log('[Campaign] 🚀 Campaign started');
    
    while (!manager.isComplete() && manager.isRunning) {
        if (manager.isPaused) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            continue;
        }
        
        const result = await executeCampaignStep(manager, sendFunction);
        
        // Callback with progress
        if (progressCallback) {
            progressCallback({
                progress: manager.getProgress(),
                stats: manager.stats,
                current: manager.getCurrentItem(),
                complete: manager.isComplete()
            });
        }
        
        if (result.stopped || result.complete) {
            break;
        }
    }
    
    manager.isRunning = false;
    console.log('[Campaign] 🏁 Campaign finished');
    
    return {
        complete: manager.isComplete(),
        stats: manager.stats
    };
}

/**
 * Pause campaign
 */
function pauseCampaign(manager) {
    manager.isPaused = true;
    console.log('[Campaign] ⏸️ Campaign paused');
}

/**
 * Resume campaign
 */
function resumeCampaign(manager) {
    manager.isPaused = false;
    console.log('[Campaign] ▶️ Campaign resumed');
}

/**
 * Stop campaign
 */
function stopCampaign(manager) {
    manager.isRunning = false;
    manager.isPaused = false;
    console.log('[Campaign] ⏹️ Campaign stopped');
}

// ========================================
// DRAFTS MANAGEMENT
// ========================================

class DraftsManager {
    constructor() {
        this.drafts = [];
        this.loadFromStorage();
    }
    
    /**
     * Load drafts from storage
     */
    async loadFromStorage() {
        try {
            const result = await chrome.storage.local.get('campaignDrafts');
            if (result.campaignDrafts) {
                this.drafts = result.campaignDrafts;
            }
        } catch (error) {
            console.error('[Drafts] Error loading drafts:', error);
        }
    }
    
    /**
     * Save drafts to storage
     */
    async saveToStorage() {
        try {
            await chrome.storage.local.set({ campaignDrafts: this.drafts });
        } catch (error) {
            console.error('[Drafts] Error saving drafts:', error);
        }
    }
    
    /**
     * Save new draft
     */
    async save(name, data) {
        const draft = {
            id: Date.now(),
            name: name,
            contacts: data.contacts || [],
            message: data.message || '',
            image: data.image || null,
            createdAt: Date.now()
        };
        
        this.drafts.push(draft);
        await this.saveToStorage();
        
        console.log('[Drafts] 💾 Draft saved:', name);
        return draft;
    }
    
    /**
     * Get all drafts
     */
    getAll() {
        return this.drafts;
    }
    
    /**
     * Get draft by id
     */
    getById(id) {
        return this.drafts.find(d => d.id === id);
    }
    
    /**
     * Delete draft
     */
    async delete(id) {
        this.drafts = this.drafts.filter(d => d.id !== id);
        await this.saveToStorage();
        console.log('[Drafts] 🗑️ Draft deleted:', id);
    }
    
    /**
     * Load draft into campaign
     */
    load(id) {
        const draft = this.getById(id);
        if (!draft) {
            throw new Error('Draft not found');
        }
        
        return {
            contacts: draft.contacts,
            message: draft.message,
            image: draft.image
        };
    }
}

// ========================================
// EXPORTS
// ========================================

if (typeof window !== 'undefined') {
    window.CampaignModule = {
        CampaignManager,
        DraftsManager,
        executeCampaignStep,
        startCampaign,
        pauseCampaign,
        resumeCampaign,
        stopCampaign
    };
}

console.log('[Campaign] ✅ Module loaded');
