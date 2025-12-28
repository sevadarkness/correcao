// top-panel-injector.js - Injects a top panel into WhatsApp Web
// This panel creates an "L" shaped layout with the Side Panel

(function() {
    'use strict';

    console.log('[TopPanel] 🚀 Initializing top panel injector...');

    // Wait for WhatsApp to load
    function waitForWhatsApp() {
        return new Promise((resolve) => {
            const checkInterval = setInterval(() => {
                const whatsappRoot = document.getElementById('app');
                if (whatsappRoot) {
                    clearInterval(checkInterval);
                    console.log('[TopPanel] ✅ WhatsApp loaded, injecting panel...');
                    resolve();
                }
            }, 500);
        });
    }

    // Create the top panel HTML
    function createTopPanel() {
        const panel = document.createElement('div');
        panel.id = 'wa-extractor-top-panel';
        panel.className = 'wa-extractor-top-panel hidden';
        
        panel.innerHTML = `
            <div class="top-panel-container">
                <div class="top-panel-left">
                    <div class="top-panel-logo">
                        <span class="logo-icon">👥</span>
                        <span class="logo-text">WA Extractor</span>
                    </div>
                </div>
                <div class="top-panel-center">
                    <div class="top-panel-tabs">
                        <button class="top-panel-tab active" data-tab="extractor">
                            <span class="tab-icon">📥</span>
                            <span class="tab-label">Extrator</span>
                        </button>
                        <button class="top-panel-tab" data-tab="grupos">
                            <span class="tab-icon">👥</span>
                            <span class="tab-label">Grupos</span>
                        </button>
                        <button class="top-panel-tab" data-tab="recover">
                            <span class="tab-icon">🔄</span>
                            <span class="tab-label">Recover</span>
                        </button>
                        <button class="top-panel-tab" data-tab="config">
                            <span class="tab-icon">⚙️</span>
                            <span class="tab-label">Config</span>
                        </button>
                    </div>
                </div>
                <div class="top-panel-right">
                </div>
            </div>
            
            <!-- Tab Contents -->
            <div class="top-panel-content">
                
                <!-- Extractor Tab -->
                <div class="tab-content active" data-tab-content="extractor">
                    <div class="tab-content-inner">
                        <button id="btnExtractContactsAPI" class="btn-extract-api">
                            <span class="btn-icon">📱</span>
                            Extrair Contatos (API Instantânea)
                        </button>
                        
                        <div class="contacts-display">
                            <div class="contact-section">
                                <div class="section-header">
                                    <span class="section-icon">📱</span>
                                    <span class="section-title">Contatos Normais</span>
                                    <span class="contact-count" id="normalCount">0</span>
                                </div>
                                <textarea id="normalContacts" class="contact-textarea" placeholder="Os contatos aparecerão aqui..." readonly></textarea>
                                <button class="btn-copy-contacts" data-target="normalContacts">📋 Copiar</button>
                            </div>
                            
                            <div class="contact-section archived-section">
                                <div class="section-header">
                                    <span class="section-icon">📁</span>
                                    <span class="section-title">Arquivados</span>
                                    <span class="contact-count archived-count" id="archivedCount">0</span>
                                </div>
                                <textarea id="archivedContacts" class="contact-textarea archived-textarea" placeholder="Contatos arquivados aparecerão aqui..." readonly></textarea>
                                <button class="btn-copy-contacts" data-target="archivedContacts">📋 Copiar</button>
                            </div>
                            
                            <div class="contact-section blocked-section">
                                <div class="section-header">
                                    <span class="section-icon">🚫</span>
                                    <span class="section-title">Bloqueados</span>
                                    <span class="contact-count blocked-count" id="blockedCount">0</span>
                                </div>
                                <textarea id="blockedContacts" class="contact-textarea blocked-textarea" placeholder="Contatos bloqueados aparecerão aqui..." readonly></textarea>
                                <button class="btn-copy-contacts" data-target="blockedContacts">📋 Copiar</button>
                            </div>
                        </div>
                        
                        <div class="action-buttons">
                            <button id="btnCopyAllContacts" class="btn-action">📋 Copiar Todos</button>
                            <button id="btnExportContactsCSV" class="btn-action">📄 Exportar CSV</button>
                        </div>
                        
                        <div id="extractionStatus" class="extraction-status hidden"></div>
                    </div>
                </div>
                
                <!-- Grupos Tab -->
                <div class="tab-content" data-tab-content="grupos">
                    <div class="tab-content-inner">
                        <div class="info-message">
                            <span class="info-icon">ℹ️</span>
                            <p>Use o <strong>Side Panel</strong> para extrair membros de grupos.</p>
                            <p>Clique no ícone da extensão para abrir o painel lateral.</p>
                        </div>
                    </div>
                </div>
                
                <!-- Recover Tab -->
                <div class="tab-content" data-tab-content="recover">
                    <div class="tab-content-inner">
                        <div class="recover-header">
                            <div class="recover-status">
                                <span class="status-dot active"></span>
                                <span class="status-text">Ativo</span>
                            </div>
                            <div class="recover-counter">
                                <span id="recoveredCount">0</span> mensagens recuperadas
                            </div>
                        </div>
                        
                        <div class="recover-timeline" id="recoverTimeline">
                            <div class="no-messages">
                                <span class="no-messages-icon">💬</span>
                                <p>Nenhuma mensagem apagada ou editada ainda.</p>
                                <p class="no-messages-hint">As mensagens apagadas/editadas aparecerão aqui automaticamente.</p>
                            </div>
                        </div>
                        
                        <div class="recover-actions">
                            <button id="btnExportRecoverJSON" class="btn-action">💾 Exportar JSON</button>
                            <button id="btnClearRecoverHistory" class="btn-action btn-danger">🗑️ Limpar Histórico</button>
                        </div>
                    </div>
                </div>
                
                <!-- Config Tab -->
                <div class="tab-content" data-tab-content="config">
                    <div class="tab-content-inner">
                        <div class="config-section">
                            <h3 class="config-section-title">⏱️ Parâmetros de Envio</h3>
                            <div class="config-row">
                                <label for="delayMin">Delay Mínimo (segundos):</label>
                                <input type="number" id="delayMin" min="1" max="60" value="5" />
                            </div>
                            <div class="config-row">
                                <label for="delayMax">Delay Máximo (segundos):</label>
                                <input type="number" id="delayMax" min="1" max="120" value="10" />
                            </div>
                            <div class="config-row">
                                <label for="scheduleTime">Agendamento:</label>
                                <input type="datetime-local" id="scheduleTime" />
                            </div>
                        </div>
                        
                        <div class="config-section">
                            <h3 class="config-section-title">📝 Rascunhos</h3>
                            <div class="draft-input-row">
                                <input type="text" id="draftName" placeholder="Nome do rascunho" />
                                <button id="btnSaveDraft" class="btn-action">💾 Salvar</button>
                            </div>
                            <div class="drafts-table" id="draftsTable">
                                <div class="no-drafts">Nenhum rascunho salvo</div>
                            </div>
                        </div>
                        
                        <div class="config-section">
                            <h3 class="config-section-title">📊 Relatórios</h3>
                            <button id="btnExportReport" class="btn-action">📥 Exportar Relatório (CSV)</button>
                            <button id="btnCopyFailures" class="btn-action">📋 Copiar Falhas</button>
                        </div>
                    </div>
                </div>
                
            </div>
        `;
        
        return panel;
    }

    // Inject the panel into WhatsApp
    function injectPanel() {
        // Check if already injected
        if (document.getElementById('wa-extractor-top-panel')) {
            console.log('[TopPanel] ⚠️ Panel already injected');
            return;
        }

        const panel = createTopPanel();
        document.body.insertBefore(panel, document.body.firstChild);
        
        // WhatsApp content compression is deferred until the panel becomes visible to ensure proper synchronization with the side panel state
        
        // Setup event listeners
        setupEventListeners(panel);
        
        // Register custom event listeners for show/hide commands
        registerEventListeners();
        
        console.log('[TopPanel] ✅ Panel injected successfully (hidden by default)');
    }

    // Compress WhatsApp to make room for the panel
    function compressWhatsAppContent() {
        const whatsappRoot = document.getElementById('app');
        if (whatsappRoot) {
            // Use setProperty with 'important' to override WhatsApp's styles
            whatsappRoot.style.setProperty('margin-top', '64px', 'important');
            whatsappRoot.style.setProperty('height', 'calc(100vh - 64px)', 'important');
            // Add body class for CSS-based control
            document.body.classList.add('wa-extractor-top-panel-visible');
            console.log('[TopPanel] ✅ WhatsApp content compressed');
        }
    }

    // Show top panel
    function showTopPanel() {
        const panel = document.getElementById('wa-extractor-top-panel');
        if (panel) {
            panel.classList.remove('hidden');
            compressWhatsAppContent();
            console.log('[TopPanel] ✅ Top panel shown');
        }
    }

    // Hide top panel
    function hideTopPanel() {
        const panel = document.getElementById('wa-extractor-top-panel');
        if (panel) {
            panel.classList.add('hidden');
            // Restore WhatsApp to normal size
            const whatsappRoot = document.getElementById('app');
            if (whatsappRoot) {
                whatsappRoot.style.removeProperty('margin-top');
                whatsappRoot.style.removeProperty('height');
            }
            // Remove body class
            document.body.classList.remove('wa-extractor-top-panel-visible');
            console.log('[TopPanel] ✅ Top panel hidden');
        }
    }

    // Setup event listeners for the panel
    function setupEventListeners(panel) {
        // Tab switching
        const tabs = panel.querySelectorAll('.top-panel-tab');
        const tabContents = panel.querySelectorAll('.tab-content');
        
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // Remove active from all tabs
                tabs.forEach(t => t.classList.remove('active'));
                // Add active to clicked tab
                tab.classList.add('active');
                
                const tabName = tab.dataset.tab;
                console.log(`[TopPanel] Tab switched to: ${tabName}`);
                
                // Show corresponding content
                tabContents.forEach(content => {
                    if (content.dataset.tabContent === tabName) {
                        content.classList.add('active');
                    } else {
                        content.classList.remove('active');
                    }
                });
                
                // Send message to Side Panel to update if needed
                chrome.runtime.sendMessage({
                    action: 'topPanelTabChanged',
                    tab: tabName
                }).catch(() => {
                    // Ignore errors if side panel is not open
                });
            });
        });
        
        // ========================================
        // EXTRACTOR TAB HANDLERS
        // ========================================
        
        const btnExtractContactsAPI = panel.querySelector('#btnExtractContactsAPI');
        if (btnExtractContactsAPI) {
            btnExtractContactsAPI.addEventListener('click', async () => {
                console.log('[TopPanel] Extracting contacts via API...');
                btnExtractContactsAPI.disabled = true;
                btnExtractContactsAPI.textContent = '⏳ Extraindo...';
                
                try {
                    const response = await chrome.runtime.sendMessage({ action: 'extractContacts' });
                    
                    if (response && response.success && response.data) {
                        const contacts = response.data;
                        
                        // Normal contacts
                        const normalTextarea = panel.querySelector('#normalContacts');
                        const normalCount = panel.querySelector('#normalCount');
                        if (normalTextarea && contacts.normal) {
                            normalTextarea.value = contacts.normal.map(c => c.phone).join('\n');
                            normalCount.textContent = contacts.normal.length;
                        }
                        
                        // Archived contacts
                        const archivedTextarea = panel.querySelector('#archivedContacts');
                        const archivedCount = panel.querySelector('#archivedCount');
                        if (archivedTextarea && contacts.archived) {
                            archivedTextarea.value = contacts.archived.map(c => c.phone).join('\n');
                            archivedCount.textContent = contacts.archived.length;
                        }
                        
                        // Blocked contacts
                        const blockedTextarea = panel.querySelector('#blockedContacts');
                        const blockedCount = panel.querySelector('#blockedCount');
                        if (blockedTextarea && contacts.blocked) {
                            blockedTextarea.value = contacts.blocked.map(c => c.phone).join('\n');
                            blockedCount.textContent = contacts.blocked.length;
                        }
                        
                        showStatus(panel, '✅ Contatos extraídos com sucesso!', 'success');
                    } else {
                        showStatus(panel, '❌ Erro ao extrair contatos', 'error');
                    }
                } catch (error) {
                    console.error('[TopPanel] Error extracting contacts:', error);
                    showStatus(panel, '❌ Erro: ' + error.message, 'error');
                }
                
                btnExtractContactsAPI.disabled = false;
                btnExtractContactsAPI.innerHTML = '<span class="btn-icon">📱</span>Extrair Contatos (API Instantânea)';
            });
        }
        
        // Copy buttons for individual sections
        const copyButtons = panel.querySelectorAll('.btn-copy-contacts');
        copyButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetId = btn.dataset.target;
                const textarea = panel.querySelector('#' + targetId);
                if (textarea && textarea.value) {
                    navigator.clipboard.writeText(textarea.value);
                    showStatus(panel, '✅ Copiado para área de transferência!', 'success');
                }
            });
        });
        
        // Copy all contacts
        const btnCopyAllContacts = panel.querySelector('#btnCopyAllContacts');
        if (btnCopyAllContacts) {
            btnCopyAllContacts.addEventListener('click', () => {
                const normal = panel.querySelector('#normalContacts').value;
                const archived = panel.querySelector('#archivedContacts').value;
                const blocked = panel.querySelector('#blockedContacts').value;
                
                const all = [normal, archived, blocked].filter(s => s).join('\n');
                
                if (all) {
                    navigator.clipboard.writeText(all);
                    showStatus(panel, '✅ Todos os contatos copiados!', 'success');
                }
            });
        }
        
        // Export CSV
        const btnExportContactsCSV = panel.querySelector('#btnExportContactsCSV');
        if (btnExportContactsCSV) {
            btnExportContactsCSV.addEventListener('click', () => {
                const normal = panel.querySelector('#normalContacts').value.split('\n').filter(s => s);
                const archived = panel.querySelector('#archivedContacts').value.split('\n').filter(s => s);
                const blocked = panel.querySelector('#blockedContacts').value.split('\n').filter(s => s);
                
                let csv = 'phone,category\n';
                normal.forEach(phone => csv += `${phone},normal\n`);
                archived.forEach(phone => csv += `${phone},archived\n`);
                blocked.forEach(phone => csv += `${phone},blocked\n`);
                
                downloadFile(csv, 'contacts_' + Date.now() + '.csv', 'text/csv');
                showStatus(panel, '✅ CSV exportado!', 'success');
            });
        }
        
        // ========================================
        // RECOVER TAB HANDLERS
        // ========================================
        
        // Load recovered messages on tab switch
        tabs.forEach(tab => {
            if (tab.dataset.tab === 'recover') {
                tab.addEventListener('click', loadRecoveredMessages);
            }
        });
        
        async function loadRecoveredMessages() {
            try {
                const response = await chrome.runtime.sendMessage({ action: 'getRecoveredMessages' });
                
                if (response && response.success && response.data) {
                    updateRecoverTimeline(panel, response.data);
                }
            } catch (error) {
                console.error('[TopPanel] Error loading recovered messages:', error);
            }
        }
        
        const btnExportRecoverJSON = panel.querySelector('#btnExportRecoverJSON');
        if (btnExportRecoverJSON) {
            btnExportRecoverJSON.addEventListener('click', async () => {
                try {
                    const response = await chrome.runtime.sendMessage({ action: 'getRecoveredMessages' });
                    
                    if (response && response.success && response.data) {
                        const json = JSON.stringify(response.data, null, 2);
                        downloadFile(json, 'recovered_messages_' + Date.now() + '.json', 'application/json');
                        showStatus(panel, '✅ JSON exportado!', 'success');
                    }
                } catch (error) {
                    console.error('[TopPanel] Error exporting JSON:', error);
                }
            });
        }
        
        const btnClearRecoverHistory = panel.querySelector('#btnClearRecoverHistory');
        if (btnClearRecoverHistory) {
            btnClearRecoverHistory.addEventListener('click', async () => {
                if (confirm('Tem certeza que deseja limpar todo o histórico de mensagens recuperadas?')) {
                    try {
                        await chrome.runtime.sendMessage({ action: 'clearRecoveredMessages' });
                        updateRecoverTimeline(panel, []);
                        showStatus(panel, '✅ Histórico limpo!', 'success');
                    } catch (error) {
                        console.error('[TopPanel] Error clearing history:', error);
                    }
                }
            });
        }
        
        // ========================================
        // CONFIG TAB HANDLERS
        // ========================================
        
        // Load config on tab switch
        tabs.forEach(tab => {
            if (tab.dataset.tab === 'config') {
                tab.addEventListener('click', loadConfig);
            }
        });
        
        function loadConfig() {
            chrome.storage.local.get(['campaignConfig', 'campaignDrafts']).then(result => {
                if (result.campaignConfig) {
                    const config = result.campaignConfig;
                    panel.querySelector('#delayMin').value = config.delayMin || 5;
                    panel.querySelector('#delayMax').value = config.delayMax || 10;
                    panel.querySelector('#scheduleTime').value = config.scheduleTime || '';
                }
                
                if (result.campaignDrafts) {
                    updateDraftsTable(panel, result.campaignDrafts);
                }
            }).catch(console.error);
        }
        
        // Save config on change
        panel.querySelector('#delayMin')?.addEventListener('change', saveConfig);
        panel.querySelector('#delayMax')?.addEventListener('change', saveConfig);
        panel.querySelector('#scheduleTime')?.addEventListener('change', saveConfig);
        
        function saveConfig() {
            const config = {
                delayMin: parseInt(panel.querySelector('#delayMin').value) || 5,
                delayMax: parseInt(panel.querySelector('#delayMax').value) || 10,
                scheduleTime: panel.querySelector('#scheduleTime').value || ''
            };
            
            chrome.storage.local.set({ campaignConfig: config }).catch(console.error);
        }
    }

    // Listen for custom events from content.js (which receives messages from background)
    function registerEventListeners() {
        window.addEventListener('wa-extractor-show-top-panel', () => {
            console.log('[TopPanel] Received show event');
            showTopPanel();
        });
        
        window.addEventListener('wa-extractor-hide-top-panel', () => {
            console.log('[TopPanel] Received hide event');
            hideTopPanel();
        });
        
        console.log('[TopPanel] ✅ Event listeners registered');
    }
    
    // ========================================
    // HELPER FUNCTIONS
    // ========================================
    
    function showStatus(panel, message, type = 'info') {
        const statusEl = panel.querySelector('#extractionStatus');
        if (statusEl) {
            statusEl.textContent = message;
            statusEl.className = 'extraction-status ' + type;
            statusEl.classList.remove('hidden');
            
            setTimeout(() => {
                statusEl.classList.add('hidden');
            }, 3000);
        }
    }
    
    function downloadFile(content, filename, type) {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }
    
    function updateRecoverTimeline(panel, messages) {
        const timeline = panel.querySelector('#recoverTimeline');
        const counter = panel.querySelector('#recoveredCount');
        
        if (!timeline || !counter) return;
        
        counter.textContent = messages.length;
        
        if (messages.length === 0) {
            timeline.innerHTML = `
                <div class="no-messages">
                    <span class="no-messages-icon">💬</span>
                    <p>Nenhuma mensagem apagada ou editada ainda.</p>
                    <p class="no-messages-hint">As mensagens apagadas/editadas aparecerão aqui automaticamente.</p>
                </div>
            `;
            return;
        }
        
        timeline.innerHTML = '';
        
        messages.forEach((msg, index) => {
            const card = document.createElement('div');
            card.className = 'recover-card';
            
            const badge = msg.type === 'deleted' ? 
                '<span class="recover-badge deleted">🗑️ Apagada</span>' :
                '<span class="recover-badge edited">✏️ Editada</span>';
            
            const dot = msg.type === 'deleted' ? 'deleted-dot' : 'edited-dot';
            
            card.innerHTML = `
                <div class="recover-dot ${dot}"></div>
                <div class="recover-card-header">
                    <span class="recover-sender">${msg.sender || 'Unknown'}</span>
                    ${badge}
                </div>
                <div class="recover-timestamp">${new Date(msg.timestamp).toLocaleString()}</div>
                <div class="recover-content">${msg.body || '(sem texto)'}</div>
                ${msg.originalBody ? `<div class="recover-original">Original: ${msg.originalBody}</div>` : ''}
                <button class="btn-copy-message" data-index="${index}">📋 Copiar</button>
            `;
            
            timeline.appendChild(card);
        });
        
        // Add copy handlers
        timeline.querySelectorAll('.btn-copy-message').forEach(btn => {
            btn.addEventListener('click', () => {
                const index = parseInt(btn.dataset.index);
                const msg = messages[index];
                if (msg) {
                    navigator.clipboard.writeText(msg.body || '');
                    showStatus(panel, '✅ Mensagem copiada!', 'success');
                }
            });
        });
    }
    
    function updateDraftsTable(panel, drafts) {
        const table = panel.querySelector('#draftsTable');
        if (!table) return;
        
        if (drafts.length === 0) {
            table.innerHTML = '<div class="no-drafts">Nenhum rascunho salvo</div>';
            return;
        }
        
        table.innerHTML = `
            <table class="drafts-table-content">
                <thead>
                    <tr>
                        <th>Nome</th>
                        <th>Data</th>
                        <th>Contatos</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    ${drafts.map(draft => `
                        <tr>
                            <td>${draft.name}</td>
                            <td>${new Date(draft.createdAt).toLocaleDateString()}</td>
                            <td>${draft.contacts?.length || 0}</td>
                            <td>
                                <button class="btn-draft-action" data-action="load" data-id="${draft.id}">📥</button>
                                <button class="btn-draft-action" data-action="delete" data-id="${draft.id}">🗑️</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        
        // Add draft action handlers
        table.querySelectorAll('.btn-draft-action').forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.dataset.action;
                const id = parseInt(btn.dataset.id);
                
                if (action === 'load') {
                    // Send message to Side Panel to load draft
                    chrome.runtime.sendMessage({
                        action: 'loadDraft',
                        draftId: id
                    }).catch(console.error);
                    showStatus(panel, '✅ Rascunho carregado no Side Panel!', 'success');
                } else if (action === 'delete') {
                    if (confirm('Deseja excluir este rascunho?')) {
                        const updatedDrafts = drafts.filter(d => d.id !== id);
                        chrome.storage.local.set({ campaignDrafts: updatedDrafts }).then(() => {
                            updateDraftsTable(panel, updatedDrafts);
                            showStatus(panel, '✅ Rascunho excluído!', 'success');
                        }).catch(console.error);
                    }
                }
            });
        });
    }

    // Initialize
    async function init() {
        await waitForWhatsApp();
        // Add a small delay to ensure WhatsApp is fully rendered
        setTimeout(() => {
            injectPanel();
        }, 1000);
    }

    // Start the injection process
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
