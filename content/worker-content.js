// content/worker-content.js - Worker Core for group extraction
// Cache with TTL and LRU cleanup

(function() {
    'use strict';
    
    console.log('[WorkerContent] Initializing Worker Core...');
    
    // Cache configuration
    const CACHE_TTL = {
        GROUPS: 5 * 60 * 1000, // 5 minutes
        PARTICIPANTS: 10 * 60 * 1000 // 10 minutes
    };
    
    const MAX_CACHE_SIZE = 100; // LRU cache max size
    
    // LRU Cache implementation
    class LRUCache {
        constructor(maxSize) {
            this.maxSize = maxSize;
            this.cache = new Map();
        }
        
        get(key) {
            if (!this.cache.has(key)) return null;
            
            const item = this.cache.get(key);
            
            // Check TTL
            if (item.expiry && Date.now() > item.expiry) {
                this.cache.delete(key);
                return null;
            }
            
            // Move to end (most recently used)
            this.cache.delete(key);
            this.cache.set(key, item);
            
            return item.value;
        }
        
        set(key, value, ttl = null) {
            // Delete if exists (to move to end)
            if (this.cache.has(key)) {
                this.cache.delete(key);
            }
            
            // Evict oldest if at capacity
            if (this.cache.size >= this.maxSize) {
                const firstKey = this.cache.keys().next().value;
                this.cache.delete(firstKey);
            }
            
            const item = {
                value,
                expiry: ttl ? Date.now() + ttl : null
            };
            
            this.cache.set(key, item);
        }
        
        cleanup() {
            const now = Date.now();
            const keysToDelete = [];
            
            for (const [key, item] of this.cache.entries()) {
                if (item.expiry && now > item.expiry) {
                    keysToDelete.push(key);
                }
            }
            
            for (const key of keysToDelete) {
                this.cache.delete(key);
            }
            
            if (keysToDelete.length > 0) {
                console.log(`[WorkerContent] Cleaned up ${keysToDelete.length} expired cache entries`);
            }
        }
        
        clear() {
            this.cache.clear();
        }
        
        size() {
            return this.cache.size;
        }
    }
    
    // Initialize caches
    const groupsCache = new LRUCache(MAX_CACHE_SIZE);
    const participantsCache = new LRUCache(MAX_CACHE_SIZE);
    
    // Safe require for WhatsApp modules
    function safeRequire(moduleName) {
        try {
            if (window.require) {
                return window.require(moduleName);
            }
        } catch (e) {
            console.warn(`[WorkerContent] Could not require ${moduleName}:`, e.message);
        }
        return null;
    }
    
    // Resolve LID to real number
    async function resolveLID(lid) {
        try {
            // Try to get from WhatsApp internal store
            const Store = safeRequire('WAWebCollections');
            if (Store && Store.ContactCollection) {
                const contact = Store.ContactCollection.get(lid);
                if (contact && contact.id && contact.id.user) {
                    return contact.id.user;
                }
            }
            
            // Fallback: return the LID itself
            return lid;
        } catch (e) {
            console.error('[WorkerContent] Error resolving LID:', e);
            return lid;
        }
    }
    
    // Get group participants
    async function getGroupParticipants(groupId) {
        // Check cache first
        const cached = participantsCache.get(groupId);
        if (cached) {
            console.log(`[WorkerContent] Cache hit for group ${groupId}`);
            return cached;
        }
        
        try {
            const Store = safeRequire('WAWebCollections');
            if (!Store || !Store.GroupMetadataStore) {
                throw new Error('GroupMetadataStore not available');
            }
            
            const groupMetadata = Store.GroupMetadataStore.get(groupId);
            if (!groupMetadata || !groupMetadata.participants) {
                throw new Error('Group metadata not found');
            }
            
            const participants = [];
            for (const participant of groupMetadata.participants) {
                const userId = participant.id.user || participant.id._serialized;
                const resolvedId = await resolveLID(userId);
                
                participants.push({
                    id: resolvedId,
                    isAdmin: participant.isAdmin || false,
                    isSuperAdmin: participant.isSuperAdmin || false
                });
            }
            
            // Cache the result
            participantsCache.set(groupId, participants, CACHE_TTL.PARTICIPANTS);
            
            console.log(`[WorkerContent] Extracted ${participants.length} participants from ${groupId}`);
            return participants;
            
        } catch (e) {
            console.error('[WorkerContent] Error getting group participants:', e);
            return [];
        }
    }
    
    // Get all groups
    async function getAllGroups() {
        // Check cache first
        const cached = groupsCache.get('all_groups');
        if (cached) {
            console.log('[WorkerContent] Cache hit for all groups');
            return cached;
        }
        
        try {
            const Store = safeRequire('WAWebCollections');
            if (!Store || !Store.ChatCollection) {
                throw new Error('ChatCollection not available');
            }
            
            const groups = [];
            for (const chat of Store.ChatCollection.getModelsArray()) {
                if (chat.isGroup) {
                    groups.push({
                        id: chat.id._serialized || chat.id,
                        name: chat.name || 'Unknown',
                        participants: chat.groupMetadata ? chat.groupMetadata.participants.length : 0
                    });
                }
            }
            
            // Cache the result
            groupsCache.set('all_groups', groups, CACHE_TTL.GROUPS);
            
            console.log(`[WorkerContent] Found ${groups.length} groups`);
            return groups;
            
        } catch (e) {
            console.error('[WorkerContent] Error getting all groups:', e);
            return [];
        }
    }
    
    // Cleanup interval (every 5 minutes)
    setInterval(() => {
        groupsCache.cleanup();
        participantsCache.cleanup();
    }, 5 * 60 * 1000);
    
    // Expose API
    window.WorkerContent = {
        getGroupParticipants,
        getAllGroups,
        resolveLID,
        clearCache: () => {
            groupsCache.clear();
            participantsCache.clear();
            console.log('[WorkerContent] Cache cleared');
        }
    };
    
    console.log('[WorkerContent] ✅ Worker Core initialized');
    
})();
