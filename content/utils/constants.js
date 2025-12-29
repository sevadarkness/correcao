// content/utils/constants.js - Centralized constants and configuration

// Main configuration flags
const WHL_CONFIG = {
    ENABLE_DEBUG: true,
    ENABLE_NETWORK_SNIFFER: true,
    ENABLE_MESSAGE_RECOVERY: true,
    ENABLE_AUTO_EXTRACT: false,
    ENABLE_CAMPAIGN_MODE: true,
    MAX_RETRY_ATTEMPTS: 3,
    USE_DIRECT_API: true
};

// Performance limits for throttling
const PERFORMANCE_LIMITS = {
    MAX_CONCURRENT_EXTRACTIONS: 5,
    MAX_PHONES_PER_BATCH: 100,
    EXTRACTION_DELAY_MS: 100,
    NETWORK_CLEANUP_INTERVAL_MS: 300000, // 5 minutes
    MAX_NETSNIFFER_PHONES: 5000
};

// Timeout configurations
const TIMEOUTS = {
    MESSAGE_SEND: 45000, // 45 seconds
    ELEMENT_WAIT: 10000, // 10 seconds
    NETWORK_REQUEST: 30000, // 30 seconds
    WHATSAPP_STORE_WAIT: 30000 // 30 seconds
};

// Campaign defaults
const CAMPAIGN_DEFAULTS = {
    MIN_DELAY: 5,
    MAX_DELAY: 10,
    BATCH_SIZE: 50,
    MAX_RETRIES: 2,
    TIMEOUT_MS: 45000
};

// Phone number patterns
const PHONE_PATTERNS = {
    BRAZILIAN_DDD: /^(?:55)?([1-9][1-9])\d{8,9}$/,
    INTERNATIONAL: /^\+?[1-9]\d{1,14}$/,
    CLEAN_PHONE: /[^\d]/g,
    WHATSAPP_ID: /^(\d+)@(c\.us|s\.whatsapp\.net|g\.us)$/
};

// Valid Brazilian DDDs
const BRAZILIAN_DDDS = [
    11, 12, 13, 14, 15, 16, 17, 18, 19, // São Paulo
    21, 22, 24, // Rio de Janeiro
    27, 28, // Espírito Santo
    31, 32, 33, 34, 35, 37, 38, // Minas Gerais
    41, 42, 43, 44, 45, 46, // Paraná
    47, 48, 49, // Santa Catarina
    51, 53, 54, 55, // Rio Grande do Sul
    61, // Distrito Federal
    62, 64, // Goiás
    63, // Tocantins
    65, 66, // Mato Grosso
    67, // Mato Grosso do Sul
    68, // Acre
    69, // Rondônia
    71, 73, 74, 75, 77, // Bahia
    79, // Sergipe
    81, 87, // Pernambuco
    82, // Alagoas
    83, // Paraíba
    84, // Rio Grande do Norte
    85, 88, // Ceará
    86, 89, // Piauí
    91, 93, 94, // Pará
    92, 97, // Amazonas
    95, // Roraima
    96, // Amapá
    98, 99  // Maranhão
];

// Extraction origins for tracking
const EXTRACTION_ORIGINS = {
    DOM: 'dom',
    STORAGE: 'storage',
    INDEXEDDB: 'indexeddb',
    NETWORK: 'network',
    WEBSOCKET: 'websocket'
};

// Confidence scores for phone validation
const CONFIDENCE_SCORES = {
    VALID_FORMAT: 5,
    VALID_DDD: 3,
    REALISTIC_LENGTH: 2,
    FROM_RELIABLE_SOURCE: 3,
    MULTIPLE_OCCURRENCES: 2,
    MINIMUM_THRESHOLD: 10
};

// WhatsApp selectors (centralized)
const WHL_SELECTORS = {
    // Message input and send
    MESSAGE_INPUT: 'div[contenteditable="true"][data-tab="10"]',
    MESSAGE_INPUT_ALT: 'div[role="textbox"][contenteditable="true"]',
    SEND_BUTTON: 'button[aria-label*="Enviar"]',
    SEND_BUTTON_ALT: 'span[data-icon="send"]',
    
    // Attachment
    ATTACH_BUTTON: 'div[title*="nexar"]',
    ATTACH_BUTTON_ALT: 'span[data-icon="clip"]',
    IMAGE_INPUT: 'input[accept="image/*,video/mp4,video/3gpp,video/quicktime"]',
    
    // Chat and contacts
    CHAT_LIST: 'div[aria-label*="Lista de conversas"]',
    CHAT_ITEM: 'div[role="listitem"]',
    CONTACT_NAME: 'span[dir="auto"][title]',
    
    // Groups
    GROUP_CHAT: 'div[data-id$="@g.us"]',
    GROUP_INFO: 'header[data-testid="conversation-header"]',
    GROUP_PARTICIPANTS: 'div[role="button"][data-testid="cell-frame-container"]',
    
    // Messages
    MESSAGE_CONTAINER: 'div[data-testid="msg-container"]',
    MESSAGE_TEXT: 'span.selectable-text',
    MESSAGE_TIME: 'span[data-testid="msg-time"]',
    
    // Search
    SEARCH_INPUT: 'div[contenteditable="true"][data-tab="3"]',
    SEARCH_RESULTS: 'div[data-testid="search-results"]',
    
    // Status indicators
    CHECKMARK_SENT: 'span[data-icon="msg-check"]',
    CHECKMARK_DELIVERED: 'span[data-icon="msg-dblcheck"]',
    CHECKMARK_READ: 'span[data-icon="msg-dblcheck-ack"]',
    
    // App root
    WHATSAPP_ROOT: '#app',
    MAIN_PANEL: 'div[data-testid="conversation-panel-wrapper"]'
};

// Storage keys
const STORAGE_KEYS = {
    CONFIG: 'whl_config',
    CAMPAIGN_STATE: 'whl_campaign_state',
    CAMPAIGN_DRAFTS: 'whl_campaign_drafts',
    EXTRACTED_PHONES: 'whl_extracted_phones',
    RECOVERED_MESSAGES: 'whl_recovered_messages',
    STATISTICS: 'whl_statistics',
    EXTRACTION_HISTORY: 'whl_extraction_history'
};

// Export all constants
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        WHL_CONFIG,
        PERFORMANCE_LIMITS,
        TIMEOUTS,
        CAMPAIGN_DEFAULTS,
        PHONE_PATTERNS,
        BRAZILIAN_DDDS,
        EXTRACTION_ORIGINS,
        CONFIDENCE_SCORES,
        WHL_SELECTORS,
        STORAGE_KEYS
    };
}
