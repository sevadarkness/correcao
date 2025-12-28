// content/utils/phone-validator.js - Phone number validation utilities

// Brazilian DDDs for validation
const BRAZILIAN_DDDS = [
    11, 12, 13, 14, 15, 16, 17, 18, 19, 21, 22, 24, 27, 28,
    31, 32, 33, 34, 35, 37, 38, 41, 42, 43, 44, 45, 46,
    47, 48, 49, 51, 53, 54, 55, 61, 62, 63, 64, 65, 66,
    67, 68, 69, 71, 73, 74, 75, 77, 79, 81, 82, 83, 84,
    85, 86, 87, 88, 89, 91, 92, 93, 94, 95, 96, 97, 98, 99
];

/**
 * Remove all non-digit characters from phone
 * @param {string} phone - Phone number
 * @returns {string} - Sanitized phone (digits only)
 */
function sanitizePhone(phone) {
    if (!phone) return '';
    return String(phone).replace(/\D/g, '');
}

/**
 * Normalize phone to Brazilian format (55 + DDD + number)
 * @param {string} phone - Phone number
 * @returns {string|null} - Normalized phone or null if invalid
 */
function normalizePhone(phone) {
    const cleaned = sanitizePhone(phone);
    
    if (!cleaned) return null;
    
    // Remove leading zeros
    let normalized = cleaned.replace(/^0+/, '');
    
    // If starts with 55 (Brazil code), validate DDD
    if (normalized.startsWith('55')) {
        const withoutCountry = normalized.substring(2);
        const ddd = parseInt(withoutCountry.substring(0, 2));
        
        // Validate DDD
        if (!BRAZILIAN_DDDS.includes(ddd)) {
            return null;
        }
        
        // Validate length (DDD + 8 or 9 digits)
        if (withoutCountry.length !== 10 && withoutCountry.length !== 11) {
            return null;
        }
        
        return normalized;
    }
    
    // If doesn't start with 55, try to add it
    if (normalized.length === 10 || normalized.length === 11) {
        const ddd = parseInt(normalized.substring(0, 2));
        if (BRAZILIAN_DDDS.includes(ddd)) {
            return '55' + normalized;
        }
    }
    
    return null;
}

/**
 * Validate if phone is valid
 * @param {string} phone - Phone number
 * @returns {boolean}
 */
function isValidPhone(phone) {
    return normalizePhone(phone) !== null;
}

/**
 * Extract phone numbers from text
 * @param {string} text - Text to extract from
 * @returns {string[]} - Array of normalized phones
 */
function extractPhonesFromText(text) {
    if (!text) return [];
    
    // Pattern to match Brazilian phones
    const patterns = [
        /\b(?:55)?([1-9][1-9])\s?9?\d{4}[-\s]?\d{4}\b/g,
        /\b(?:\+55)?([1-9][1-9])\s?9?\d{8,9}\b/g
    ];
    
    const phones = new Set();
    
    for (const pattern of patterns) {
        const matches = text.matchAll(pattern);
        for (const match of matches) {
            const normalized = normalizePhone(match[0]);
            if (normalized) {
                phones.add(normalized);
            }
        }
    }
    
    return Array.from(phones);
}

/**
 * Format phone for WhatsApp (removes 55 prefix if present)
 * @param {string} phone - Phone number
 * @returns {string} - Formatted for WhatsApp
 */
function formatForWhatsApp(phone) {
    const normalized = normalizePhone(phone);
    if (!normalized) return '';
    
    // WhatsApp expects format: DDD + number (without country code for some operations)
    return normalized.startsWith('55') ? normalized.substring(2) : normalized;
}

/**
 * Parse WhatsApp ID to phone number
 * @param {string} wid - WhatsApp ID (e.g., "5511999999999@c.us")
 * @returns {string|null} - Phone number or null
 */
function parseWhatsAppId(wid) {
    if (!wid) return null;
    
    const match = wid.match(/^(\d+)@/);
    if (match) {
        return normalizePhone(match[1]);
    }
    
    return null;
}

/**
 * Validate batch of phones
 * @param {string[]} phones - Array of phone numbers
 * @returns {object} - {valid: string[], invalid: string[]}
 */
function batchValidatePhones(phones) {
    const result = {
        valid: [],
        invalid: []
    };
    
    for (const phone of phones) {
        const normalized = normalizePhone(phone);
        if (normalized) {
            result.valid.push(normalized);
        } else {
            result.invalid.push(phone);
        }
    }
    
    return result;
}

/**
 * Parse phone list from text (comma or newline separated)
 * @param {string} text - Text with phone numbers
 * @returns {string[]} - Array of normalized phones
 */
function parsePhoneList(text) {
    if (!text) return [];
    
    const lines = text.split(/[\n,;]/);
    const phones = new Set();
    
    for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed) {
            // Try to extract phones from the line
            const extracted = extractPhonesFromText(trimmed);
            for (const phone of extracted) {
                phones.add(phone);
            }
        }
    }
    
    return Array.from(phones);
}

// Export functions
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        sanitizePhone,
        normalizePhone,
        isValidPhone,
        extractPhonesFromText,
        formatForWhatsApp,
        parseWhatsAppId,
        batchValidatePhones,
        parsePhoneList,
        BRAZILIAN_DDDS
    };
}
