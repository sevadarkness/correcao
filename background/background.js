// background.js - WhatsApp Group Extractor v7.1.0 - HEADLESS EXTRACTION
console.log('[WA Extractor] Background script carregado v7.1.0 - Headless Mode');

// ========================================
// HEADLESS EXTRACTION CONSTANTS
// ========================================
const WORKER_BOOT_TIMEOUT_MS = 30000;
const WORKER_READY_TIMEOUT_MS = 20000;
const SESSION_CHECK_TIMEOUT_MS = 25000;
const EXTRACTION_TOTAL_TIMEOUT_MS = 480000; // 8 min
const PROGRESS_STALL_TIMEOUT_MS = 20000;
const CONNECTING_BACKOFF_MS = [1000, 2000, 3500, 5000, 8000];
const CONTENT_SCRIPT_READY_DELAY_MS = 1000; // Delay for content script to be ready on existing tabs

// Job states
const JobState = {
    IDLE: 'IDLE',
    BOOTING_WORKER: 'BOOTING_WORKER',
    WAITING_READY: 'WAITING_READY',
    CHECKING_SESSION: 'CHECKING_SESSION',
    RUNNING: 'RUNNING',
    FINALIZING: 'FINALIZING',
    DONE: 'DONE',
    ERROR: 'ERROR',
    CANCELLED: 'CANCELLED'
};

// Flag global de lock para prevenir race conditions
let extractionLock = false;
let extractionLockTimeout = null;
const LOCK_TIMEOUT_MS = 300000; // 5 minutes timeout for safety

// ========================================
// JOB MANAGEMENT
// ========================================
let currentJob = null;

// Function to clear lock with timeout
function setExtractionLock(value) {
    extractionLock = value;
    
    // Clear existing timeout
    if (extractionLockTimeout) {
        clearTimeout(extractionLockTimeout);
        extractionLockTimeout = null;
    }
    
    // If setting lock to true, set a safety timeout
    if (value === true) {
        extractionLockTimeout = setTimeout(() => {
            console.warn('[WA Extractor] ⚠️ Lock timeout expired, releasing lock automatically');
            extractionLock = false;
            if (currentJob) {
                currentJob.state = JobState.ERROR;
                currentJob.error = 'EXTRACTION_TIMEOUT';
            }
            extractionState.isRunning = false;
            extractionState.status = 'error';
        }, LOCK_TIMEOUT_MS);
    }
}

// Estado persistente em background (backward compatibility)
let extractionState = {
    isRunning: false,
    isPaused: false,
    currentGroup: null,
    progress: 0,
    membersCount: 0,
    status: 'idle' // 'idle', 'running', 'paused', 'completed', 'error'
};

// Configurar Side Panel
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(console.error);

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

// ========================================
// GET OR CREATE WORKER TAB
// ========================================
async function getOrCreateWorkerTab() {
    console.log('[WA Extractor] 🔍 Looking for existing WhatsApp tab...');
    
    // 1. Try to find existing WhatsApp tab
    const waTabs = await chrome.tabs.query({ 
        url: '*://web.whatsapp.com/*' 
    });
    
    if (waTabs.length > 0) {
        // ✅ Use existing tab as worker
        // Prefer active tab if available, otherwise use first tab
        const targetTab = waTabs.find(tab => tab.active) || waTabs[0];
        console.log(`[WA Extractor] ✅ Using existing tab: ${targetTab.id}`);
        return {
            tabId: targetTab.id,
            created: false,  // Not created, already existed
            shouldClose: false  // DO NOT close at the end
        };
    }
    
    // 2. Create hidden tab (only if none exists)
    console.log('[WA Extractor] 📂 Creating hidden tab...');
    const tab = await chrome.tabs.create({
        url: 'https://web.whatsapp.com',
        active: false
    });
    
    console.log(`[WA Extractor] ✅ Hidden tab created: ${tab.id}`);
    return {
        tabId: tab.id,
        created: true,  // Was created now
        shouldClose: true  // Close at the end
    };
}

// ========================================
// HEADLESS EXTRACTION ORCHESTRATOR
// ========================================
async function startHeadlessExtraction(jobId, groupId, groupName, isArchived) {
    console.log(`[WA Extractor] 🚀 Starting headless extraction: ${jobId}`);
    
    // Check lock
    if (extractionLock || currentJob) {
        console.log('[WA Extractor] ⚠️ Extraction already in progress');
        broadcastToUI({
            type: 'HEADLESS_ERROR',
            jobId,
            code: 'LOCKED',
            message: 'Já existe uma extração em andamento. Aguarde.',
            recoverable: false
        });
        return;
    }
    
    // Initialize job
    currentJob = {
        jobId,
        groupId,
        groupName,
        isArchived,
        state: JobState.IDLE,
        workerTabId: null,
        shouldCloseTab: false,
        progress: 0,
        membersCount: 0,
        startTime: Date.now(),
        timeouts: {}
    };
    
    setExtractionLock(true);
    startKeepalive();
    
    try {
        // State: BOOTING_WORKER
        updateJobState(JobState.BOOTING_WORKER, 'Preparando extração...');
        
        const tabInfo = await getOrCreateWorkerTab();
        currentJob.workerTabId = tabInfo.tabId;
        currentJob.shouldCloseTab = tabInfo.shouldClose;
        
        // Wait for tab to load only if we just created it
        if (tabInfo.created) {
            console.log('[WA Extractor] ⏳ Waiting for newly created tab to load...');
            await waitForTabLoad(tabInfo.tabId);
        } else {
            console.log('[WA Extractor] ✅ Using existing tab, skipping load wait');
            // Small delay to ensure content script is ready
            await new Promise(resolve => setTimeout(resolve, CONTENT_SCRIPT_READY_DELAY_MS));
        }
        
        // State: WAITING_READY
        updateJobState(JobState.WAITING_READY, 'Aguardando conexão...');
        
        // Send handshake
        const pongReceived = await sendMessageToWorker(currentJob.workerTabId, {
            type: 'HEADLESS_PING',
            jobId
        }, WORKER_READY_TIMEOUT_MS);
        
        if (!pongReceived || pongReceived.type !== 'HEADLESS_PONG') {
            throw new Error('WORKER_READY_TIMEOUT');
        }
        
        // State: CHECKING_SESSION
        updateJobState(JobState.CHECKING_SESSION, 'Verificando WhatsApp...');
        
        // Check WhatsApp state
        const stateResult = await checkWhatsAppState(currentJob.workerTabId, jobId);
        
        if (stateResult.state !== 'READY') {
            throw new Error(stateResult.state); // LOGIN_REQUIRED, CONNECTING, etc.
        }
        
        // State: RUNNING
        updateJobState(JobState.RUNNING, 'Extraindo membros...');
        
        // Start extraction
        const extractionResult = await sendMessageToWorker(currentJob.workerTabId, {
            type: 'HEADLESS_EXTRACT_GROUP',
            jobId,
            groupId,
            groupName,
            isArchived
        }, EXTRACTION_TOTAL_TIMEOUT_MS);
        
        if (extractionResult && extractionResult.type === 'HEADLESS_DONE') {
            // State: FINALIZING
            updateJobState(JobState.FINALIZING, 'Finalizando...');
            
            // Broadcast success
            broadcastToUI({
                type: 'HEADLESS_DONE',
                jobId,
                members: extractionResult.members,
                meta: extractionResult.meta
            });
            
            // State: DONE
            updateJobState(JobState.DONE, 'Concluído!');
        } else if (extractionResult && extractionResult.type === 'HEADLESS_ERROR') {
            throw new Error(extractionResult.code || 'EXTRACTION_FAILED');
        } else {
            throw new Error('EXTRACTION_FAILED');
        }
        
    } catch (error) {
        console.error('[WA Extractor] ❌ Headless extraction error:', error);
        
        updateJobState(JobState.ERROR, error.message);
        
        broadcastToUI({
            type: 'HEADLESS_ERROR',
            jobId,
            code: error.message || 'UNKNOWN_ERROR',
            message: getHumanErrorMessage(error.message),
            recoverable: false
        });
    } finally {
        // Cleanup
        await cleanupJob();
    }
}

async function waitForTabLoad(tabId) {
    console.log(`[WA Extractor] ⏳ Waiting for tab ${tabId} to load...`);
    
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            chrome.tabs.onUpdated.removeListener(listener);
            reject(new Error('WORKER_BOOT_TIMEOUT'));
        }, WORKER_BOOT_TIMEOUT_MS);
        
        const listener = (updatedTabId, changeInfo) => {
            if (updatedTabId === tabId && changeInfo.status === 'complete') {
                clearTimeout(timeout);
                chrome.tabs.onUpdated.removeListener(listener);
                console.log(`[WA Extractor] ✅ Tab ${tabId} loaded`);
                
                // Additional delay for content script injection
                setTimeout(() => resolve(), 2000);
            }
        };
        
        chrome.tabs.onUpdated.addListener(listener);
    });
}

async function sendMessageToWorker(tabId, message, timeoutMs = 10000) {
    console.log(`[WA Extractor] 📤 Sending to worker tab ${tabId}:`, message.type);
    
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            console.log(`[WA Extractor] ⏱️ Message timeout: ${message.type}`);
            resolve(null);
        }, timeoutMs);
        
        chrome.tabs.sendMessage(tabId, message, (response) => {
            clearTimeout(timeout);
            
            if (chrome.runtime.lastError) {
                console.error('[WA Extractor] Message error:', chrome.runtime.lastError);
                resolve(null);
            } else {
                console.log(`[WA Extractor] ✅ Response from worker:`, response?.type || response);
                resolve(response);
            }
        });
    });
}

async function checkWhatsAppState(tabId, jobId) {
    console.log('[WA Extractor] 🔍 Checking WhatsApp state...');
    
    // Try multiple times with backoff
    for (let i = 0; i < CONNECTING_BACKOFF_MS.length; i++) {
        const stateResult = await sendMessageToWorker(tabId, {
            type: 'HEADLESS_CHECK_STATE',
            jobId
        }, SESSION_CHECK_TIMEOUT_MS);
        
        if (!stateResult) {
            throw new Error('WORKER_CRASHED');
        }
        
        console.log(`[WA Extractor] State check ${i + 1}: ${stateResult.state}`);
        
        if (stateResult.state === 'READY') {
            return stateResult;
        }
        
        if (stateResult.state === 'LOGIN_REQUIRED') {
            throw new Error('LOGIN_REQUIRED');
        }
        
        if (stateResult.state === 'CONNECTING') {
            // Wait and retry
            if (i < CONNECTING_BACKOFF_MS.length - 1) {
                await new Promise(resolve => setTimeout(resolve, CONNECTING_BACKOFF_MS[i]));
                continue;
            } else {
                throw new Error('CONNECTING_TIMEOUT');
            }
        }
        
        // Unknown state, retry
        if (i < CONNECTING_BACKOFF_MS.length - 1) {
            await new Promise(resolve => setTimeout(resolve, CONNECTING_BACKOFF_MS[i]));
        }
    }
    
    throw new Error('SESSION_CHECK_TIMEOUT');
}

function updateJobState(state, message) {
    if (!currentJob) return;
    
    currentJob.state = state;
    console.log(`[WA Extractor] 📊 Job state: ${state} - ${message}`);
    
    broadcastToUI({
        type: 'HEADLESS_STATE',
        jobId: currentJob.jobId,
        state,
        message
    });
}

async function cleanupJob() {
    console.log('[WA Extractor] 🧹 Cleaning up job...');
    
    // Close worker tab only if it was created by us
    if (currentJob && currentJob.workerTabId) {
        if (currentJob.shouldCloseTab) {
            try {
                await chrome.tabs.remove(currentJob.workerTabId);
                console.log(`[WA Extractor] 🗑️ Hidden tab ${currentJob.workerTabId} closed`);
            } catch (error) {
                console.error('[WA Extractor] Error closing tab:', error);
            }
        } else {
            console.log(`[WA Extractor] ✅ Existing tab ${currentJob.workerTabId} kept open`);
        }
    }
    
    // Clear timeouts
    if (currentJob && currentJob.timeouts) {
        Object.values(currentJob.timeouts).forEach(clearTimeout);
    }
    
    // Release lock
    setExtractionLock(false);
    stopKeepalive();
    
    // Clear job
    currentJob = null;
    
    console.log('[WA Extractor] ✅ Cleanup complete');
}

function broadcastToUI(message) {
    // Send to all extension contexts (sidepanel, popup, etc.)
    chrome.runtime.sendMessage(message).catch((error) => {
        // UI might be closed, that's ok
        console.log('[WA Extractor] UI not listening:', error.message);
    });
}

function getHumanErrorMessage(code) {
    const messages = {
        'LOGIN_REQUIRED': '🔐 WhatsApp Web precisa ser conectado (QR Code). Abra o WhatsApp Web e conecte seu dispositivo.',
        'CONNECTING_TIMEOUT': '📶 WhatsApp está conectando. Verifique internet/celular e tente novamente.',
        'WORKER_READY_TIMEOUT': '⚠️ Não foi possível inicializar. Recarregue o WhatsApp Web e tente novamente.',
        'WORKER_BOOT_TIMEOUT': '⚠️ Tempo esgotado ao carregar WhatsApp Web. Tente novamente.',
        'EXTRACTION_TIMEOUT': '⏱️ Extração demorou além do esperado. Tente novamente.',
        'EXTRACTION_FAILED': '❌ Erro durante extração. Tente novamente.',
        'WORKER_CRASHED': '💥 Erro inesperado. Tente novamente.',
        'LOCKED': '🔒 Já existe uma extração em andamento. Aguarde.',
        'CANCELLED': '❌ Extração cancelada.',
        'NO_CHAT': '📱 Não foi possível abrir o chat. Tente novamente.',
        'SESSION_CHECK_TIMEOUT': '⏱️ Tempo esgotado ao verificar sessão. Tente novamente.'
    };
    return messages[code] || '❌ Erro desconhecido. Tente novamente.';
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
    
    // ========================================
    // HEADLESS EXTRACTION MESSAGES
    // ========================================
    if (message.type === 'START_HEADLESS_EXTRACTION') {
        startHeadlessExtraction(
            message.jobId,
            message.groupId,
            message.groupName,
            message.isArchived
        );
        sendResponse({ success: true });
        return true;
    }
    
    if (message.type === 'CANCEL_HEADLESS_EXTRACTION') {
        if (currentJob && currentJob.jobId === message.jobId) {
            updateJobState(JobState.CANCELLED, 'Cancelado pelo usuário');
            cleanupJob();
        }
        sendResponse({ success: true });
        return true;
    }
    
    if (message.type === 'GET_STATUS') {
        sendResponse({
            success: true,
            job: currentJob,
            locked: extractionLock
        });
        return true;
    }
    
    // Progress from worker tab
    if (message.type === 'HEADLESS_PROGRESS' && currentJob) {
        currentJob.progress = message.percent || 0;
        currentJob.membersCount = message.count || 0;
        
        // Broadcast to UI
        broadcastToUI(message);
        
        // Save state periodically
        if (currentJob.membersCount % 10 === 0) {
            chrome.storage.local.set({
                currentHeadlessJob: currentJob
            }).catch(console.error);
        }
        
        sendResponse({ success: true });
        return true;
    }
    
    // ========================================
    // LEGACY EXTRACTION MESSAGES (backward compatibility)
    // ========================================
    
    // Repassa mensagens de progresso do content script para o popup
    if (message.type === 'extractionProgress') {
        // Atualizar estado local
        extractionState.progress = message.progress || 0;
        extractionState.membersCount = message.count || 0;
        extractionState.status = 'running';
        
        // Se completou (100%), liberar lock
        if (extractionState.progress >= 100) {
            setExtractionLock(false);
            extractionState.isRunning = false;
            extractionState.status = 'completed';
            stopKeepalive();
            console.log('[WA Extractor] ✅ Extração concluída, lock liberado');
        }
        
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
        if (extractionLock) {
            console.log('[WA Extractor] ⚠️ Extração já em andamento, ignorando...');
            sendResponse({ 
                success: false, 
                error: 'Já existe uma extração em andamento. Aguarde a conclusão.' 
            });
            return true;
        }
        console.log('[WA Extractor] 🚀 Iniciando extração em background...');
        setExtractionLock(true);
        extractionState.isRunning = true;
        extractionState.isPaused = false;
        extractionState.status = 'running';
        startKeepalive();
        sendResponse({ success: true });
        return true;
    }
    
    if (message.action === 'stopExtraction') {
        console.log('[WA Extractor] ⏹️ Parando extração...');
        setExtractionLock(false);
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