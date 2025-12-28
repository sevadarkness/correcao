// content/utils/selectors.js - DOM selector utilities with fallbacks

/**
 * Find element with multiple fallback selectors
 * @param {string[]} selectors - Array of selectors to try
 * @param {Element} root - Root element to search from (default: document)
 * @returns {Element|null}
 */
function findElement(selectors, root = document) {
    if (!Array.isArray(selectors)) {
        selectors = [selectors];
    }
    
    for (const selector of selectors) {
        try {
            const element = root.querySelector(selector);
            if (element) return element;
        } catch (e) {
            console.warn(`Invalid selector: ${selector}`, e);
        }
    }
    
    return null;
}

/**
 * Find all elements with multiple fallback selectors
 * @param {string[]} selectors - Array of selectors to try
 * @param {Element} root - Root element to search from (default: document)
 * @returns {Element[]}
 */
function findAllElements(selectors, root = document) {
    if (!Array.isArray(selectors)) {
        selectors = [selectors];
    }
    
    for (const selector of selectors) {
        try {
            const elements = root.querySelectorAll(selector);
            if (elements.length > 0) return Array.from(elements);
        } catch (e) {
            console.warn(`Invalid selector: ${selector}`, e);
        }
    }
    
    return [];
}

/**
 * Wait for element to appear in DOM
 * @param {string[]} selectors - Array of selectors to try
 * @param {number} timeout - Timeout in milliseconds
 * @param {Element} root - Root element to search from (default: document)
 * @returns {Promise<Element>}
 */
function waitForElement(selectors, timeout = 10000, root = document) {
    return new Promise((resolve, reject) => {
        // Check if already exists
        const existing = findElement(selectors, root);
        if (existing) {
            resolve(existing);
            return;
        }
        
        // Setup observer
        const observer = new MutationObserver(() => {
            const element = findElement(selectors, root);
            if (element) {
                observer.disconnect();
                clearTimeout(timeoutId);
                resolve(element);
            }
        });
        
        observer.observe(root, {
            childList: true,
            subtree: true
        });
        
        // Setup timeout
        const timeoutId = setTimeout(() => {
            observer.disconnect();
            reject(new Error(`Element not found within ${timeout}ms: ${selectors.join(', ')}`));
        }, timeout);
    });
}

/**
 * Get message input field
 * @returns {Element|null}
 */
function getMessageInputField() {
    return findElement([
        'div[contenteditable="true"][data-tab="10"]',
        'div[role="textbox"][contenteditable="true"]',
        'div[contenteditable="true"][data-lexical-editor="true"]'
    ]);
}

/**
 * Get send button
 * @returns {Element|null}
 */
function getSendButton() {
    return findElement([
        'button[aria-label*="Enviar"]',
        'span[data-icon="send"]',
        'button[data-testid="send"]'
    ]);
}

/**
 * Get attach button
 * @returns {Element|null}
 */
function getAttachButton() {
    return findElement([
        'div[title*="nexar"]',
        'span[data-icon="clip"]',
        'button[aria-label*="Anexar"]',
        'div[aria-label*="Anexar"]'
    ]);
}

/**
 * Check if element is visible
 * @param {Element} element
 * @returns {boolean}
 */
function isElementVisible(element) {
    if (!element) return false;
    
    const style = window.getComputedStyle(element);
    return style.display !== 'none' && 
           style.visibility !== 'hidden' && 
           style.opacity !== '0' &&
           element.offsetParent !== null;
}

/**
 * Wait for element to be visible
 * @param {Element} element
 * @param {number} timeout
 * @returns {Promise<boolean>}
 */
function waitForVisible(element, timeout = 5000) {
    return new Promise((resolve) => {
        if (isElementVisible(element)) {
            resolve(true);
            return;
        }
        
        const observer = new MutationObserver(() => {
            if (isElementVisible(element)) {
                observer.disconnect();
                clearTimeout(timeoutId);
                resolve(true);
            }
        });
        
        observer.observe(element, {
            attributes: true,
            attributeFilter: ['style', 'class']
        });
        
        const timeoutId = setTimeout(() => {
            observer.disconnect();
            resolve(false);
        }, timeout);
    });
}

/**
 * Safe click on element
 * @param {Element} element
 * @returns {boolean} - Success
 */
function safeClick(element) {
    if (!element) return false;
    
    try {
        element.click();
        return true;
    } catch (e) {
        console.warn('Click failed, trying MouseEvent', e);
        try {
            const event = new MouseEvent('click', {
                bubbles: true,
                cancelable: true,
                view: window
            });
            element.dispatchEvent(event);
            return true;
        } catch (e2) {
            console.error('MouseEvent click also failed', e2);
            return false;
        }
    }
}

/**
 * Safe focus on element
 * @param {Element} element
 * @returns {boolean} - Success
 */
function safeFocus(element) {
    if (!element) return false;
    
    try {
        element.focus();
        return true;
    } catch (e) {
        console.warn('Focus failed', e);
        return false;
    }
}

/**
 * Get chat header element
 * @returns {Element|null}
 */
function getChatHeader() {
    return findElement([
        'header[data-testid="conversation-header"]',
        'header[class*="chatHeader"]'
    ]);
}

/**
 * Get chat list
 * @returns {Element|null}
 */
function getChatList() {
    return findElement([
        'div[aria-label*="Lista de conversas"]',
        'div[id="pane-side"]'
    ]);
}

/**
 * Get search input
 * @returns {Element|null}
 */
function getSearchInput() {
    return findElement([
        'div[contenteditable="true"][data-tab="3"]',
        'div[role="textbox"][title*="Pesquisar"]'
    ]);
}

// Export functions
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        findElement,
        findAllElements,
        waitForElement,
        getMessageInputField,
        getSendButton,
        getAttachButton,
        isElementVisible,
        waitForVisible,
        safeClick,
        safeFocus,
        getChatHeader,
        getChatList,
        getSearchInput
    };
}
