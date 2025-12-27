// background.js - WhatsApp Group Extractor v6.0.1
console.log('[WA Extractor] Background script carregado v6.0.1');

// Estado persistente em background
let extractionState = {
    isRunning: false,
    isPaused: false,
    currentGroup: null,
    progress: 0,
    membersCount: 0
};

// Listener para instalação
chrome.runtime.onInstalled.addListener((details) => {
    console.log('[WA Extractor] Extensão instalada/atualizada:', details.reason);
    
    // Limpar dados antigos se necessário
    if (details.reason === 'update') {
        console.log('[WA Extractor] Atualização detectada, versão anterior:', details.previousVersion);
    }
});

// Listener para mensagens entre componentes
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('[WA Extractor] Background recebeu mensagem:', message.type || message.action);
    
    // Repassa mensagens de progresso do content script para o popup
    if (message.type === 'extractionProgress') {
        // Atualizar estado local
        extractionState.progress = message.progress || 0;
        extractionState.membersCount = message.count || 0;
        
        // Broadcast para todas as views do popup
        chrome.runtime.sendMessage(message).catch(() => {
            // Popup pode estar fechado, ignorar erro
        });
        
        // Salvar estado em storage
        chrome.storage.local.set({ 
            backgroundExtractionState: extractionState 
        }).catch(console.error);
    }
    
    // Comandos de controle de extração
    if (message.action === 'updateExtractionState') {
        extractionState = { ...extractionState, ...message.state };
        console.log('[WA Extractor] Estado atualizado:', extractionState);
    }
    
    if (message.action === 'getExtractionState') {
        sendResponse({ success: true, state: extractionState });
        return true;
    }
    
    return false;
});

// Listener para erros não capturados
self.addEventListener('error', (event) => {
    console.error('[WA Extractor] Erro no background:', event.error);
});

// Listener para rejeições de promise não tratadas
self.addEventListener('unhandledrejection', (event) => {
    console.error('[WA Extractor] Promise rejeitada:', event.reason);
});

// Restaurar estado ao iniciar
chrome.storage.local.get('backgroundExtractionState').then(result => {
    if (result.backgroundExtractionState) {
        extractionState = result.backgroundExtractionState;
        console.log('[WA Extractor] Estado restaurado do storage:', extractionState);
    }
}).catch(console.error);

console.log('[WA Extractor] Background script inicializado');