// background.js - WhatsApp Group Extractor v6.0.1
console.log('[WA Extractor] Background script carregado v6.0.1');

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
        // Broadcast para todas as views do popup
        chrome.runtime.sendMessage(message).catch(() => {
            // Popup pode estar fechado, ignorar erro
        });
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

console.log('[WA Extractor] Background script inicializado');