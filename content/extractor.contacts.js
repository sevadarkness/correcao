// extractor.contacts.js - Instant Contact Extraction with Validation
// Integrated from WhatsHybrid Lite

console.log('[Contact Extractor] 📱 Initializing...');

// ========================================
// PHONE VALIDATION
// ========================================

// Constants for phone validation
const MIN_PHONE_LENGTH = 10;
const MAX_PHONE_LENGTH = 13;
const MIN_INTERNATIONAL_LENGTH = 12;
const BRAZIL_COUNTRY_CODE = '55';

/**
 * Validate phone number (Brazilian standards)
 */
function validatePhone(phone) {
    if (!phone || typeof phone !== 'string') return false;
    
    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '');
    
    // Brazilian phone: 55 (country) + 2 digits (DDD) + 8 or 9 digits (number)
    // Min: 10 digits (without country code, old format)
    // Max: 13 digits (with country code, new format)
    if (digits.length < MIN_PHONE_LENGTH || digits.length > MAX_PHONE_LENGTH) return false;
    
    // Check if starts with valid country code (if present)
    if (digits.length >= MIN_INTERNATIONAL_LENGTH && !digits.startsWith(BRAZIL_COUNTRY_CODE)) {
        // If has 12+ digits, should be international format starting with country code
        return true; // Allow other country codes
    }
    
    return true;
}

/**
 * Format phone number to standard format
 */
function formatPhone(phone) {
    if (!phone) return '';
    
    // Remove all non-digit characters
    let digits = phone.replace(/\D/g, '');
    
    // If doesn't have country code, add it (Brazil = 55)
    if (digits.length === MIN_PHONE_LENGTH || digits.length === MIN_PHONE_LENGTH + 1) {
        digits = BRAZIL_COUNTRY_CODE + digits;
    }
    
    return digits;
}

// ========================================
// PHONE STORAGE WITH DEDUPLICATION
// ========================================

class PhoneStore {
    constructor() {
        this.phones = new Set();
        this.phoneData = new Map(); // Store additional data
    }
    
    /**
     * Add phone to store
     */
    add(phone, data = {}) {
        if (!validatePhone(phone)) {
            console.warn('[Phone Store] Invalid phone:', phone);
            return false;
        }
        
        const formatted = formatPhone(phone);
        
        if (!this.phones.has(formatted)) {
            this.phones.add(formatted);
            this.phoneData.set(formatted, {
                original: phone,
                formatted: formatted,
                name: data.name || '',
                addedAt: Date.now(),
                ...data
            });
            return true;
        }
        
        return false; // Already exists
    }
    
    /**
     * Get all phones
     */
    getAll() {
        return Array.from(this.phones);
    }
    
    /**
     * Get phone data
     */
    getData(phone) {
        const formatted = formatPhone(phone);
        return this.phoneData.get(formatted);
    }
    
    /**
     * Get all phone data
     */
    getAllData() {
        return Array.from(this.phoneData.values());
    }
    
    /**
     * Count
     */
    count() {
        return this.phones.size;
    }
    
    /**
     * Clear
     */
    clear() {
        this.phones.clear();
        this.phoneData.clear();
    }
    
    /**
     * Export as CSV
     */
    toCSV() {
        const data = this.getAllData();
        let csv = 'phone,name\n';
        
        for (const item of data) {
            const name = (item.name || '').replace(/"/g, '""'); // Escape quotes
            csv += `${item.formatted},"${name}"\n`;
        }
        
        return csv;
    }
}

// ========================================
// EXTRACTION FROM DOM
// ========================================

/**
 * Extract contacts from WhatsApp DOM
 */
function extractFromDOM() {
    const store = new PhoneStore();
    
    try {
        // Try to find contact elements in the DOM
        const contactElements = document.querySelectorAll('[data-id]');
        
        for (const element of contactElements) {
            const dataId = element.getAttribute('data-id');
            if (!dataId || dataId.includes('@g.us') || dataId === 'status@broadcast') {
                continue; // Skip groups and status
            }
            
            // Extract phone from data-id
            const phone = dataId.split('@')[0];
            
            // Extract name from element
            let name = '';
            const nameElement = element.querySelector('[title]');
            if (nameElement) {
                name = nameElement.getAttribute('title');
            }
            
            store.add(phone, { name, source: 'dom' });
        }
        
        console.log('[Contact Extractor] 📦 Extracted from DOM:', store.count());
    } catch (error) {
        console.error('[Contact Extractor] Error extracting from DOM:', error);
    }
    
    return store;
}

// ========================================
// EXTRACTION FROM LOCAL STORAGE
// ========================================

/**
 * Extract contacts from localStorage (WhatsApp's IndexedDB)
 */
function extractFromStorage() {
    const store = new PhoneStore();
    
    try {
        // Try to access WhatsApp's localStorage data
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (!key) continue;
            
            try {
                const value = localStorage.getItem(key);
                if (!value) continue;
                
                // Look for phone patterns in the data
                const phoneRegex = /\d{10,13}/g;
                const matches = value.match(phoneRegex);
                
                if (matches) {
                    for (const match of matches) {
                        if (validatePhone(match)) {
                            store.add(match, { source: 'storage' });
                        }
                    }
                }
            } catch (err) {
                // Skip invalid entries
                continue;
            }
        }
        
        console.log('[Contact Extractor] 💾 Extracted from storage:', store.count());
    } catch (error) {
        console.error('[Contact Extractor] Error extracting from storage:', error);
    }
    
    return store;
}

// ========================================
// MAIN EXTRACTION FUNCTION
// ========================================

/**
 * Extract all contacts using all available methods
 */
async function extractAllContacts() {
    console.log('[Contact Extractor] 🚀 Starting full extraction...');
    
    const finalStore = new PhoneStore();
    
    // Method 1: DOM extraction
    const domStore = extractFromDOM();
    for (const data of domStore.getAllData()) {
        finalStore.add(data.formatted, data);
    }
    
    // Method 2: Storage extraction (commented out to avoid duplicates)
    // const storageStore = extractFromStorage();
    // for (const data of storageStore.getAllData()) {
    //     finalStore.add(data.formatted, data);
    // }
    
    console.log('[Contact Extractor] ✅ Total contacts extracted:', finalStore.count());
    
    return finalStore;
}

// ========================================
// CSV IMPORT FUNCTIONALITY
// ========================================

/**
 * Parse CSV file content
 */
function parseCSV(csvContent) {
    const lines = csvContent.split('\n');
    const contacts = [];
    
    // Skip header if exists
    const startIndex = lines[0].toLowerCase().includes('phone') ? 1 : 0;
    
    for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        // Simple CSV parsing (handles quoted fields)
        const parts = line.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g) || [line];
        const phone = parts[0].replace(/"/g, '').trim();
        const message = parts[1] ? parts[1].replace(/"/g, '').trim() : '';
        
        if (validatePhone(phone)) {
            contacts.push({
                phone: formatPhone(phone),
                message: message
            });
        }
    }
    
    return contacts;
}

/**
 * Import contacts from CSV file
 */
function importFromCSV(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                const content = e.target.result;
                const contacts = parseCSV(content);
                resolve(contacts);
            } catch (error) {
                reject(error);
            }
        };
        
        reader.onerror = () => {
            reject(new Error('Failed to read file'));
        };
        
        reader.readAsText(file);
    });
}

// ========================================
// EXPORTS
// ========================================

// Export functions to global scope for use in other scripts
if (typeof window !== 'undefined') {
    window.ContactExtractor = {
        PhoneStore,
        validatePhone,
        formatPhone,
        extractFromDOM,
        extractFromStorage,
        extractAllContacts,
        parseCSV,
        importFromCSV
    };
}

console.log('[Contact Extractor] ✅ Module loaded');
