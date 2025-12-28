// background.js - WhatsApp Group Extractor v6.0.1 - BACKGROUND PERSISTENCE
console.log('[WA Extractor] Background script carregado v6.0.1');

// Estado persistente em background
let extractionState = {
    isRunning: false,
    isPaused: false,
    currentGroup: null,
    progress: 0,
    membersCount: 0,
    status: 'idle' // 'idle', 'running', 'paused', 'completed', 'error'
};

// Configurar Side Panel
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false }).catch(console.error);

// Listener para abrir Side Panel ao clicar no ícone
chrome.action.onClicked.addListener(async (tab) => {
    try {
        // Verificar se está no WhatsApp Web
        let isWhatsAppWeb = false;
        try {
            const url = new URL(tab?.url || '');
            isWhatsAppWeb = url.hostname === 'web.whatsapp.com';
        } catch (e) {
            isWhatsAppWeb = false;
        }
        
        if (isWhatsAppWeb) {
            // Abrir Side Panel
            await chrome.sidePanel.open({ tabId: tab.id });
            console.log('[WA Extractor] Side Panel aberto');
        } else {
            // Abrir WhatsApp Web em nova aba
            const newTab = await chrome.tabs.create({ url: 'https://web.whatsapp.com' });
            // Aguardar um pouco e abrir o Side Panel
            setTimeout(async () => {
                try {
                    await chrome.sidePanel.open({ tabId: newTab.id });
                } catch (e) {
                    console.log('[WA Extractor] Aguardando página carregar...');
                }
            }, 3000);
        }
    } catch (error) {
        console.error('[WA Extractor] Erro ao abrir Side Panel:', error);
    }
});

// Keepalive para manter o service worker ativo
let keepaliveInterval = null;

function startKeepalive() {
    if (keepaliveInterval) return;
    
    console.log('[WA Extractor] ⏰ Iniciando keepalive...');
    keepaliveInterval = setInterval(() => {
        // Enviar ping para manter ativo
        chrome.runtime.getPlatformInfo(() => {
            // Apenas para manter o service worker ativo
        });
    }, 20000); // A cada 20 segundos
}

function stopKeepalive() {
    if (keepaliveInterval) {
        console.log('[WA Extractor] ⏹️ Parando keepalive...');
        clearInterval(keepaliveInterval);
        keepaliveInterval = null;
    }
}

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
        extractionState.status = 'running';
        
        // Garantir que keepalive está ativo durante extração
        if (extractionState.progress > 0 && extractionState.progress < 100) {
            startKeepalive();
        }
        
        // Broadcast para todas as views do popup (se estiver aberto)
        chrome.runtime.sendMessage(message).catch(() => {
            // Popup pode estar fechado, ignorar erro
            console.log('[WA Extractor] Popup fechado, mensagem não enviada');
        });
        
        // Salvar estado em storage periodicamente
        if (extractionState.membersCount % 5 === 0) {
            chrome.storage.local.set({ 
                backgroundExtractionState: extractionState 
            }).catch(console.error);
        }
    }
    
    // Comandos de controle de extração
    if (message.action === 'updateExtractionState') {
        extractionState = { ...extractionState, ...message.state };
        console.log('[WA Extractor] Estado atualizado:', extractionState);
        
        // Ativar keepalive se está rodando
        if (extractionState.isRunning) {
            startKeepalive();
        } else {
            stopKeepalive();
        }
        
        sendResponse({ success: true });
        return true;
    }
    
    if (message.action === 'getExtractionState') {
        sendResponse({ success: true, state: extractionState });
        return true;
    }
    
    if (message.action === 'startExtraction') {
        console.log('[WA Extractor] 🚀 Iniciando extração em background...');
        extractionState.isRunning = true;
        extractionState.isPaused = false;
        extractionState.status = 'running';
        startKeepalive();
        sendResponse({ success: true });
        return true;
    }
    
    if (message.action === 'stopExtraction') {
        console.log('[WA Extractor] ⏹️ Parando extração...');
        extractionState.isRunning = false;
        extractionState.isPaused = false;
        extractionState.status = 'idle';
        stopKeepalive();
        sendResponse({ success: true });
        return true;
    }
    
    if (message.action === 'pauseExtraction') {
        console.log('[WA Extractor] ⏸️ Pausando extração...');
        extractionState.isPaused = true;
        extractionState.isRunning = false;
        extractionState.status = 'paused';
        sendResponse({ success: true });
        return true;
    }
    
    if (message.action === 'resumeExtraction') {
        console.log('[WA Extractor] ▶️ Retomando extração...');
        extractionState.isPaused = false;
        extractionState.isRunning = true;
        extractionState.status = 'running';
        startKeepalive();
        sendResponse({ success: true });
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

// Listener para quando o service worker é ativado
self.addEventListener('activate', (event) => {
    console.log('[WA Extractor] Service worker ativado');
});

// Manter vivo durante extração
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    // Não fazer nada que interrompa a extração
    if (extractionState.isRunning) {
        console.log('[WA Extractor] Tab atualizada mas extração continua...');
    }
});

// Restaurar estado ao iniciar
chrome.storage.local.get('backgroundExtractionState').then(result => {
    if (result.backgroundExtractionState) {
        extractionState = result.backgroundExtractionState;
        console.log('[WA Extractor] Estado restaurado do storage:', extractionState);
        
        // Se estava rodando, reativar keepalive
        if (extractionState.isRunning) {
            console.log('[WA Extractor] ⚠️ Extração anterior ainda em execução, reativando keepalive...');
            startKeepalive();
        }
    }
}).catch(console.error);

console.log('[WA Extractor] Background script inicializado com persistência completa');