// content.js - WhatsApp Group Extractor v6.0.1 (CORREÇÃO COMPLETA)
console.log('[WA Extractor] Content script v6.0.1 carregado');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// ========================================
// INJETA SCRIPT EXTERNO
// ========================================
function injectPageScript() {
    if (window.__waExtractorInjected) return Promise.resolve();
    
    return new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = chrome.runtime.getURL('content/inject.js');
        script.onload = () => {
            console.log('[WA Extractor] inject.js carregado');
            window.__waExtractorInjected = true;
            resolve();
        };
        script.onerror = () => {
            console.log('[WA Extractor] Falha ao carregar inject.js');
            resolve();
        };
        (document.head || document.documentElement).appendChild(script);
    });
}

injectPageScript();

// ========================================
// COMUNICAÇÃO COM API INJETADA
// ========================================
function callPageAPI(type, data = {}) {
    return new Promise((resolve) => {
        const timeout = setTimeout(() => {
            window.removeEventListener('message', handler);
            console.log('[WA Extractor] ⏱️ Timeout:', type);
            resolve({ success: false, error: 'Timeout' });
        }, 30000); // Aumentado para 30s

        function handler(event) {
            if (event.source !== window) return;
            if (!event.data || !event.data.type) return;

            const expectedType = type + '_RESULT';
            if (event.data.type !== expectedType) return;

            console.log('[WA Extractor] ✅ Resposta recebida:', event.data.type);
            clearTimeout(timeout);
            window.removeEventListener('message', handler);
            resolve(event.data);
        }

        window.addEventListener('message', handler);
        console.log('[WA Extractor] 📤 Enviando:', type, data);
        window.postMessage({ type, ...data }, window.location.origin);
    });
}

// ========================================
// LISTENER DE MENSAGENS DO POPUP
// ========================================
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('[WA Extractor] Mensagem recebida:', message);
    
    handleMessage(message).then(sendResponse).catch(error => {
        console.error('[WA Extractor] Erro:', error);
        sendResponse({ success: false, error: error.message });
    });
    
    return true;
});

async function handleMessage(message) {
    switch (message.action) {
        case 'checkPage':
            return { 
                success: true, 
                isWhatsApp: window.location.href.includes('web.whatsapp.com') 
            };
            
        case 'getGroups':
            return await getGroups(message.includeArchived);
            
        case 'navigateToGroup':
            return await navigateToGroupWithRetry(
                message.groupId, 
                message.groupName, 
                message.isArchived
            );
            
        case 'extractMembers':
            return await extractMembers();
            
        case 'getGroupName':
            return { 
                success: true, 
                name: WhatsAppExtractor?.getGroupName() || 'Grupo' 
            };
            
        default:
            return { success: false, error: 'Ação desconhecida' };
    }
}

// ========================================
// OBTER LISTA DE GRUPOS
// ========================================
async function getGroups(includeArchived = true) {
    try {
        console.log('[WA Extractor] Buscando grupos...', { includeArchived });

        await injectPageScript();
        await sleep(500);

        const apiResult = await callPageAPI('WA_GET_GROUPS', { 
            includeArchived: includeArchived 
        });

        if (apiResult && apiResult.success === true && 
            Array.isArray(apiResult.groups) && apiResult.groups.length > 0) {
            
            console.log(`[WA Extractor] ✅ API retornou ${apiResult.groups.length} grupos`);

            const archived = apiResult.groups.filter(g => g.isArchived);
            const active = apiResult.groups.filter(g => !g.isArchived);

            console.log(`[WA Extractor] 📊 ${active.length} ativos, ${archived.length} arquivados`);

            return {
                success: true,
                groups: apiResult.groups,
                stats: apiResult.stats || {
                    total: apiResult.groups.length,
                    archived: archived.length,
                    active: active.length
                }
            };
        }

        console.log('[WA Extractor] ⚠️ API não retornou grupos, usando DOM...');
        return await getGroupsFromDOM(includeArchived);

    } catch (error) {
        console.error('[WA Extractor] Erro:', error);
        return { success: false, error: error.message };
    }
}

async function getGroupsFromDOM(includeArchived = true) {
    const groups = [];
    const seenIds = new Set();

    const chatList = document.querySelector('#pane-side');
    if (!chatList) {
        return { success: false, error: 'Lista de chats não encontrada.' };
    }

    const chatElements = chatList.querySelectorAll('[data-id]');

    for (const element of chatElements) {
        const dataId = element.getAttribute('data-id') || '';
        if (!dataId.includes('@g.us')) continue;
        if (seenIds.has(dataId)) continue;
        seenIds.add(dataId);

        const titleSpan = element.querySelector('span[title]');
        const name = titleSpan?.getAttribute('title') || titleSpan?.textContent || 'Grupo';

        if (!name || name.length < 2 || name.length > 100) continue;
        if (/^^(ontem|hoje|yesterday|today|\d{1,2}:\d{2})/i.test(name)) continue;

        groups.push({
            id: dataId,
            name: name,
            memberCount: '',
            isGroup: true,
            isArchived: false
        });
    }

    groups.sort((a, b) => a.name.localeCompare(b.name));

    return {
        success: true,
        groups: groups,
        stats: { total: groups.length, archived: 0, active: groups.length }
    };
}

// ========================================
// NAVEGAR COM RETRY
// ========================================
async function navigateToGroupWithRetry(groupId, groupName, isArchived, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`[WA Extractor] Tentativa ${attempt}/${maxRetries}`);
            
            const result = await navigateToGroup(groupId, groupName, isArchived);
            
            if (result.success) {
                return result;
            }
            
            console.log(`[WA Extractor] Tentativa ${attempt} falhou:`, result.error);
            
            if (attempt < maxRetries) {
                await sleep(1000 * attempt); // Backoff exponencial
            }
        } catch (error) {
            console.error(`[WA Extractor] Erro na tentativa ${attempt}:`, error);
            
            if (attempt === maxRetries) {
                return { success: false, error: error.message };
            }
            
            await sleep(1000 * attempt);
        }
    }
    
    return { success: false, error: 'Máximo de tentativas excedido' };
}

// ========================================
// NAVEGAR ATÉ UM GRUPO
// ========================================
async function navigateToGroup(groupId, groupName, isArchived = false) {
    try {
        console.log(`[WA Extractor] ========================================`);
        console.log(`[WA Extractor] Navegando até: "${groupName}"`);
        console.log(`[WA Extractor] ID: ${groupId}`);
        console.log(`[WA Extractor] Arquivado: ${isArchived}`);
        console.log(`[WA Extractor] ========================================`);

        await injectPageScript();
        await sleep(300);

        // Para grupos arquivados, tentar desarquivar primeiro
        if (isArchived && groupId && groupId.includes('@g.us')) {
            console.log('[WA Extractor] 📤 Tentando desarquivar via API...');
            const unarchiveResult = await callPageAPI('WA_UNARCHIVE_CHAT', { groupId });
            
            if (unarchiveResult.success) {
                console.log('[WA Extractor] ✅ Grupo desarquivado com sucesso!');
                await sleep(1000);
                isArchived = false;
            } else {
                console.log('[WA Extractor] ⚠️ Não foi possível desarquivar:', unarchiveResult.error);
            }
        }

        // MÉTODO 1: Via API interna
        if (groupId && groupId.includes('@g.us')) {
            console.log('[WA Extractor] 📡 Método 1: Tentando API interna...');
            
            const apiResult = await callPageAPI('WA_OPEN_CHAT', { groupId, isArchived });

            if (apiResult.success) {
                console.log(`[WA Extractor] API retornou: ${apiResult.method}`);
                await sleep(3000);

                if (await verifyChatOpened(groupName)) {
                    console.log('[WA Extractor] ✅ Chat aberto via API!');
                    return { success: true };
                }
                console.log('[WA Extractor] ⚠️ API retornou sucesso mas chat não abriu');
            }
        }

        // MÉTODO 2: Navegação via arquivados
        if (isArchived) {
            console.log('[WA Extractor] 📦 Método 2: Navegando via seção de arquivados...');
            
            const archivedResult = await openArchivedAndFindGroupImproved(groupName);
            
            if (archivedResult) {
                await sleep(2500);
                if (await verifyChatOpened(groupName)) {
                    console.log('[WA Extractor] ✅ Chat arquivado aberto!');
                    return { success: true };
                }
            }
        }

        // MÉTODO 3: Busca na lista principal
        console.log('[WA Extractor] 📋 Método 3: Buscando na lista principal...');
        
        if (await clickGroupInMainList(groupName)) {
            await sleep(2000);
            if (await verifyChatOpened(groupName)) {
                console.log('[WA Extractor] ✅ Chat aberto via lista principal!');
                return { success: true };
            }
        }

        // MÉTODO 4: Pesquisa global
        console.log('[WA Extractor] 🔍 Método 4: Usando pesquisa global...');
        
        if (await searchAndOpenGroup(groupName)) {
            await sleep(2500);
            if (await verifyChatOpened(groupName)) {
                await clearSearch();
                console.log('[WA Extractor] ✅ Chat aberto via pesquisa!');
                return { success: true };
            }
        }

        throw new Error(`Não foi possível abrir o grupo "${groupName}". Tente clicar manualmente no grupo e depois extrair.`);

    } catch (error) {
        console.error('[WA Extractor] ❌ Erro:', error);
        return { success: false, error: error.message };
    }
}

// ========================================
// VERIFICAR SE CHAT ABRIU
// ========================================
async function verifyChatOpened(expectedGroupName) {
    await sleep(800);

    const mainHeader = document.querySelector('#main header');
    if (!mainHeader) {
        console.log('[WA Extractor] ❌ Header #main não encontrado');
        return false;
    }

    const headerTitle = mainHeader.querySelector('span[title]');
    const currentName = headerTitle?.getAttribute('title') || headerTitle?.textContent || '';

    const normalizedExpected = normalizeText(expectedGroupName);
    const normalizedCurrent = normalizeText(currentName);

    // Validação flexível
    if (normalizedCurrent.includes(normalizedExpected) ||
        normalizedExpected.includes(normalizedCurrent) ||
        levenshteinDistance(normalizedCurrent, normalizedExpected) <= 3) {
        console.log(`[WA Extractor] ✅ Chat verificado: "${currentName}"`);
        return true;
    }

    if (currentName.length > 0) {
        console.log(`[WA Extractor] ⚠️ Chat aberto mas nome diferente: "${currentName}" vs "${expectedGroupName}"`);
        return currentName.length > 2;
    }

    return false;
}

// ========================================
// ABRIR ARQUIVADOS MELHORADO
// ========================================
async function openArchivedAndFindGroupImproved(groupName) {
    try {
        console.log('[WA Extractor] 📦 Abrindo seção de arquivados (método melhorado)...');

        await goToMainChatList();
        await sleep(800);

        // Scroll para o topo
        const paneLeft = document.querySelector('#pane-side');
        if (paneLeft) {
            paneLeft.scrollTop = 0;
            await sleep(500);
        }

        let archivedButton = await findArchivedButtonImproved();

        if (!archivedButton && paneLeft) {
            paneLeft.scrollTop = 100;
            await sleep(500);
            archivedButton = await findArchivedButtonImproved();
        }

        if (!archivedButton) {
            console.log('[WA Extractor] ❌ Botão de arquivados não encontrado');
            return false;
        }

        console.log('[WA Extractor] 🖱️ Clicando em Arquivados...');
        simulateClick(archivedButton);
        await sleep(2500);

        const isInArchivedView = await verifyArchivedViewOpened();
        if (!isInArchivedView) {
            console.log('[WA Extractor] ⚠️ View de arquivados não abriu');
            return false;
        }

        console.log('[WA Extractor] 🔍 Procurando grupo nos arquivados...');
        
        const found = await findAndClickGroupInCurrentView(groupName);
        if (found) return true;

        console.log('[WA Extractor] 📜 Fazendo scroll na lista de arquivados...');
        
        const foundAfterScroll = await scrollAndFindGroup(groupName);
        if (foundAfterScroll) return true;

        console.log('[WA Extractor] ↩️ Voltando para lista principal...');
        await goBackFromArchived();
        return false;

    } catch (error) {
        console.error('[WA Extractor] Erro ao abrir arquivados:', error);
        return false;
    }
}

// ========================================
// ENCONTRAR BOTÃO DE ARQUIVADOS
// ========================================
async function findArchivedButtonImproved() {
    const selectors = [
        '[data-testid="archived"]',
        '[data-testid="chat-list-archived"]',
        '[aria-label*="rquivad"]',
        '[aria-label*="rchived"]',
        '[aria-label*="Archived"]',
        '[aria-label*="Arquivadas"]',
        '[title*="rquivad"]',
        '[title*="rchived"]'
    ];

    for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element) {
            console.log(`[WA Extractor] ✅ Botão encontrado: ${selector}`);
            return element.closest('[role="listitem"]') || 
                   element.closest('[role="row"]') || 
                   element.closest('[tabindex]') || 
                   element;
        }
    }

    // Procurar por texto
    const allElements = document.querySelectorAll('#pane-side *');
    for (const el of allElements) {
        const text = el.textContent?.trim().toLowerCase() || '';
        const ariaLabel = el.getAttribute('aria-label')?.toLowerCase() || '';
        const title = el.getAttribute('title')?.toLowerCase() || '';

        if (text === 'arquivadas' || text === 'archived' ||
            ariaLabel.includes('arquivad') || ariaLabel.includes('archived') ||
            title.includes('arquivad') || title.includes('archived')) {

            console.log('[WA Extractor] ✅ Elemento com texto "Arquivadas" encontrado');
            
            let parent = el;
            for (let i = 0; i < 10 && parent; i++) {
                if (parent.getAttribute('role') === 'listitem' ||
                    parent.getAttribute('role') === 'row' ||
                    parent.hasAttribute('tabindex')) {
                    return parent;
                }
                parent = parent.parentElement;
            }
            return el;
        }
    }

    return null;
}

// ========================================
// VERIFICAR VIEW DE ARQUIVADOS
// ========================================
async function verifyArchivedViewOpened() {
    await sleep(500);

    // Verificar header com "Arquivadas"
    const headers = document.querySelectorAll('header');
    for (const header of headers) {
        const text = header.textContent?.toLowerCase() || '';
        if (text.includes('arquivad') || text.includes('archived')) {
            console.log('[WA Extractor] ✅ View de arquivados confirmada');
            return true;
        }
    }

    // Verificar botão de voltar
    const backBtn = document.querySelector('[data-testid="back"]') || 
                   document.querySelector('[data-icon="back"]');
    if (backBtn) {
        return true;
    }

    return false;
}

// ========================================
// ENCONTRAR E CLICAR NO GRUPO
// ========================================
async function findAndClickGroupInCurrentView(groupName) {
    const normalizedTarget = normalizeText(groupName);
    const allSpans = document.querySelectorAll('span[title]');

    for (const span of allSpans) {
        const title = span.getAttribute('title') || '';
        const normalizedTitle = normalizeText(title);

        if (normalizedTitle === normalizedTarget ||
            title === groupName ||
            normalizedTitle.includes(normalizedTarget) ||
            normalizedTarget.includes(normalizedTitle) ||
            levenshteinDistance(normalizedTitle, normalizedTarget) <= 2) {

            console.log(`[WA Extractor] ✅ Grupo encontrado: "${title}"`);
            const clickTarget = findClickableParent(span);
            simulateClick(clickTarget);
            return true;
        }
    }

    return false;
}

// ========================================
// SCROLL E ENCONTRAR GRUPO
// ========================================
async function scrollAndFindGroup(groupName) {
    const scrollContainers = [
        document.querySelector('#pane-side'),
        document.querySelector('[data-testid="chat-list"]'),
        document.querySelector('[role="application"] > div > div')
    ].filter(Boolean);

    const scrollContainer = scrollContainers[0];
    if (!scrollContainer) {
        console.log('[WA Extractor] ❌ Container de scroll não encontrado');
        return false;
    }

    const normalizedTarget = normalizeText(groupName);
    let attempts = 0;
    const maxAttempts = 40;

    while (attempts < maxAttempts) {
        const allSpans = document.querySelectorAll('span[title]');
        
        for (const span of allSpans) {
            const title = span.getAttribute('title') || '';
            
            if (normalizeText(title) === normalizedTarget ||
                title === groupName ||
                levenshteinDistance(normalizeText(title), normalizedTarget) <= 2) {

                console.log(`[WA Extractor] ✅ Grupo encontrado após scroll: "${title}"`);
                const clickTarget = findClickableParent(span);
                simulateClick(clickTarget);
                return true;
            }
        }

        scrollContainer.scrollTop += 300;
        await sleep(400);
        attempts++;

        if (scrollContainer.scrollTop + scrollContainer.clientHeight >= scrollContainer.scrollHeight - 50) {
            console.log('[WA Extractor] Chegou ao fim da lista');
            break;
        }
    }

    return false;
}

// ========================================
// VOLTAR DA SEÇÃO DE ARQUIVADOS
// ========================================
async function goBackFromArchived() {
    const backButtons = [
        document.querySelector('[data-testid="back"]'),
        document.querySelector('[data-icon="back"]'),
        document.querySelector('[aria-label*="Voltar"]'),
        document.querySelector('[aria-label*="Back"]'),
        document.querySelector('header button[aria-label]')
    ].filter(Boolean);

    if (backButtons.length > 0) {
        backButtons[0].click();
        await sleep(800);
        return;
    }

    document.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'Escape',
        keyCode: 27,
        bubbles: true
    }));
    await sleep(500);
}

// ========================================
// IR PARA LISTA PRINCIPAL
// ========================================
async function goToMainChatList() {
    const closeButtons = document.querySelectorAll('[data-icon="x"], [data-testid="x"]');
    for (const btn of closeButtons) {
        const parent = btn.closest('[role="dialog"]');
        if (parent) {
            btn.click();
            await sleep(300);
        }
    }

    for (let i = 0; i < 3; i++) {
        document.dispatchEvent(new KeyboardEvent('keydown', {
            key: 'Escape',
            keyCode: 27,
            bubbles: true
        }));
        await sleep(200);
    }
}

// ========================================
// CLICAR EM GRUPO NA LISTA PRINCIPAL
// ========================================
async function clickGroupInMainList(groupName) {
    const chatList = document.querySelector('#pane-side');
    if (!chatList) return false;

    const normalizedTarget = normalizeText(groupName);

    chatList.scrollTop = 0;
    await sleep(300);

    const spans = chatList.querySelectorAll('span[title]');
    
    for (const span of spans) {
        const title = span.getAttribute('title') || '';
        
        if (normalizeText(title) === normalizedTarget ||
            title === groupName ||
            levenshteinDistance(normalizeText(title), normalizedTarget) <= 2) {

            console.log(`[WA Extractor] ✅ Grupo encontrado na lista: "${title}"`);
            const clickTarget = findClickableParent(span);
            simulateClick(clickTarget);
            return true;
        }
    }

    return await scrollAndFindGroup(groupName);
}

// ========================================
// PESQUISAR E ABRIR GRUPO
// ========================================
async function searchAndOpenGroup(groupName) {
    try {
        console.log('[WA Extractor] 🔍 Iniciando pesquisa com método Lexical...');

        // 1. Limpar estado anterior - enviar múltiplos Escape para resetar
        console.log('[WA Extractor] 🧹 Limpando estado anterior...');
        for (let i = 0; i < 5; i++) {
            document.body.dispatchEvent(new KeyboardEvent('keydown', {
                key: 'Escape',
                code: 'Escape',
                keyCode: 27,
                bubbles: true
            }));
            await sleep(100);
        }
        await sleep(500);

        // 2. Clicar na aba "Grupos"
        console.log('[WA Extractor] 📑 Clicando na aba Grupos...');
        const gruposTab = document.querySelector('button#group-filter') ||
                          Array.from(document.querySelectorAll('button[role="tab"]'))
                              .find(btn => btn.textContent?.trim() === 'Grupos');
        
        if (gruposTab) {
            gruposTab.click();
            await sleep(800);
        } else {
            console.log('[WA Extractor] ⚠️ Aba Grupos não encontrada, continuando...');
        }

        // 3. Encontrar e preparar campo de pesquisa
        const searchBox = document.querySelector('div[contenteditable="true"][data-tab="3"]') ||
                         await getSearchBox();
        
        if (!searchBox) {
            console.log('[WA Extractor] ❌ Campo de pesquisa não encontrado');
            return false;
        }

        searchBox.click();
        searchBox.focus();
        await sleep(300);

        // 4. Limpar conteúdo do campo e criar estrutura Lexical
        console.log('[WA Extractor] 📝 Preparando estrutura Lexical...');
        while (searchBox.firstChild) {
            searchBox.removeChild(searchBox.firstChild);
        }

        // Criar parágrafo com classes corretas do WhatsApp
        const p = document.createElement('p');
        p.className = '_aupe copyable-text x15bjb6t x1n2onr6';
        p.setAttribute('dir', 'auto');
        searchBox.appendChild(p);

        // 5. Posicionar cursor dentro do parágrafo usando Range e Selection
        const range = document.createRange();
        const sel = window.getSelection();
        range.setStart(p, 0);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
        await sleep(200);

        // 6. Digitar caractere por caractere
        console.log(`[WA Extractor] ⌨️ Digitando: "${groupName}"`);
        for (const char of groupName) {
            document.execCommand('insertText', false, char);
            await sleep(80); // 80ms entre caracteres
        }

        // 7. Aguardar resultados
        await sleep(2000);

        // 8. Buscar e clicar no grupo encontrado
        const normalizedTarget = normalizeText(groupName);
        const results = document.querySelectorAll(
            '#pane-side span[title], [data-testid="cell-frame-container"] span[title]'
        );

        console.log(`[WA Extractor] 🔎 Procurando por "${groupName}" em ${results.length} resultados...`);

        for (const span of results) {
            const title = span.getAttribute('title') || '';
            
            if (normalizeText(title) === normalizedTarget ||
                title === groupName ||
                normalizeText(title).includes(normalizedTarget) ||
                levenshteinDistance(normalizeText(title), normalizedTarget) <= 2) {

                console.log(`[WA Extractor] ✅ Grupo encontrado na pesquisa: "${title}"`);
                const clickTarget = findClickableParent(span);
                simulateClick(clickTarget);
                
                // 9. Restaurar estado - voltar para aba "Tudo"
                await sleep(500);
                const allTab = document.querySelector('button#all-filter') ||
                              Array.from(document.querySelectorAll('button[role="tab"]'))
                                  .find(btn => btn.textContent?.trim() === 'Tudo' || 
                                               btn.textContent?.trim() === 'All');
                if (allTab) {
                    allTab.click();
                }
                
                return true;
            }
        }

        console.log('[WA Extractor] ❌ Grupo não encontrado nos resultados');
        
        // Restaurar estado mesmo se não encontrou
        const allTab = document.querySelector('button#all-filter') ||
                      Array.from(document.querySelectorAll('button[role="tab"]'))
                          .find(btn => btn.textContent?.trim() === 'Tudo' || 
                                       btn.textContent?.trim() === 'All');
        if (allTab) {
            allTab.click();
        }
        
        return false;
    } catch (error) {
        console.error('[WA Extractor] Erro na pesquisa:', error);
        return false;
    }
}

// ========================================
// OBTER CAMPO DE PESQUISA
// ========================================
async function getSearchBox() {
    const selectors = [
        '[data-testid="chat-list-search"]',
        'div[contenteditable="true"][data-tab="3"]',
        '#side div[contenteditable="true"]',
        'div[role="textbox"][title*="Pesquisar"]',
        'div[role="textbox"][title*="Search"]'
    ];

    for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element) return element;
    }

    const searchIcon = document.querySelector('[data-testid="search"]') ||
                      document.querySelector('[data-icon="search"]');
    if (searchIcon) {
        searchIcon.click();
        await sleep(800);

        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element) return element;
        }
    }

    return null;
}

// ========================================
// LIMPAR PESQUISA
// ========================================
async function clearSearch() {
    try {
        const clearBtn = document.querySelector('[data-testid="search-clear-btn"]') ||
                        document.querySelector('[data-icon="x-alt"]') ||
                        document.querySelector('[aria-label*="Limpar"]');

        if (clearBtn) {
            clearBtn.click();
            await sleep(300);
        }

        document.dispatchEvent(new KeyboardEvent('keydown', {
            key: 'Escape',
            keyCode: 27,
            bubbles: true
        }));
        await sleep(200);
    } catch (error) {
        console.error('[WA Extractor] Erro ao limpar pesquisa:', error);
    }
}

// ========================================
// FUNÇÕES UTILITÁRIAS
// ========================================
function normalizeText(text) {
    if (!text) return '';
    return text
        .replace(/[\u200B-\u200D\uFEFF\u202A-\u202E]/g, '')
        .replace(/[®™©]/g, '')
        .trim()
        .toLowerCase();
}

function levenshteinDistance(str1, str2) {
    const matrix = [];

    for (let i = 0; i <= str2.length; i++) {
        matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
        matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
        for (let j = 1; j <= str1.length; j++) {
            if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }

    return matrix[str2.length][str1.length];
}

function findClickableParent(element) {
    let clickTarget = element;
    let parent = element.parentElement;

    for (let i = 0; i < 15 && parent; i++) {
        if (parent.getAttribute('data-id') ||
            parent.getAttribute('role') === 'listitem' ||
            parent.getAttribute('role') === 'row' ||
            parent.getAttribute('tabindex') === '-1' ||
            parent.classList.contains('_ak8l') ||
            parent.getAttribute('data-testid')?.includes('cell') ||
            parent.getAttribute('data-testid')?.includes('list-item')) {
            clickTarget = parent;
            break;
        }
        parent = parent.parentElement;
    }

    return clickTarget;
}

function simulateClick(element) {
    if (!element) return;

    console.log('[WA Extractor] 🖱️ Simulando clique em:', element.tagName);

    element.scrollIntoView({ behavior: 'instant', block: 'center' });

    const rect = element.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    const eventOptions = {
        bubbles: true,
        cancelable: true,
        view: window,
        clientX: x,
        clientY: y
    };

    element.dispatchEvent(new MouseEvent('mouseenter', eventOptions));
    element.dispatchEvent(new MouseEvent('mouseover', eventOptions));
    element.dispatchEvent(new MouseEvent('mousedown', { ...eventOptions, button: 0 }));
    element.dispatchEvent(new MouseEvent('mouseup', { ...eventOptions, button: 0 }));
    element.dispatchEvent(new MouseEvent('click', { ...eventOptions, button: 0 }));
}

// ========================================
// EXTRAIR MEMBROS
// ========================================
async function extractMembers() {
    try {
        console.log('[WA Extractor] Iniciando extração...');

        if (typeof WhatsAppExtractor === 'undefined') {
            throw new Error('Módulo de extração não carregado. Recarregue a página.');
        }

        return new Promise((resolve, reject) => {
            WhatsAppExtractor.extractMembers(
                (progress) => {
                    try {
                        chrome.runtime.sendMessage({
                            type: 'extractionProgress',
                            status: progress.status,
                            count: progress.count,
                            progress: Math.min(100, (progress.count / 200) * 100),
                            members: progress.members || []
                        });
                    } catch (e) {
                        console.error('[WA Extractor] Erro ao enviar progresso:', e);
                    }
                },
                (data) => {
                    console.log('[WA Extractor] Extração concluída:', data);
                    resolve({ success: true, data: data });
                },
                (error) => {
                    reject(new Error(error));
                }
            );
        });

    } catch (error) {
        console.error('[WA Extractor] Erro:', error);
        return { success: false, error: error.message };
    }
}