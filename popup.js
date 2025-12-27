// popup.js - WhatsApp Group Extractor v6.0.1 COMPLETO E CORRIGIDO
class PopupController {
    constructor() {
        // Estado
        this.groups = [];
        this.filteredGroups = [];
        this.selectedGroup = null;
        this.extractedData = null;
        this.currentFilter = 'all';
        this.stats = { total: 0, archived: 0, active: 0 };

        // Caches e otimizações
        this.groupsCache = null;
        this.performanceMonitor = null;
        this.virtualList = null;
        this.membersVirtualList = null; // ← CORREÇÃO: Declarar esta variável

        // Storage e exporters
        this.storage = null;
        this.sheetsExporter = null;

        // Inicializa
        this.init();
    }

    // ========================================
    // INICIALIZAÇÃO
    // ========================================
    async init() {
        // Verificar se as classes estão disponíveis
        this.waitForDependencies().then(() => {
            this.initializeComponents();
            this.cacheElements();
            this.bindEventsOptimized();
            this.initStorage();
            this.checkWhatsAppTab();
        });
    }

    waitForDependencies() {
        return new Promise((resolve) => {
            const checkDeps = () => {
                if (typeof SmartCache !== 'undefined' &&
                    typeof PerformanceMonitor !== 'undefined' &&
                    typeof ExtractionStorage !== 'undefined' &&
                    typeof GoogleSheetsExporter !== 'undefined') {
                    resolve();
                } else {
                    setTimeout(checkDeps, 50);
                }
            };
            checkDeps();
        });
    }

    initializeComponents() {
        this.groupsCache = new SmartCache({ maxAge: 2 * 60 * 1000 });
        this.performanceMonitor = new PerformanceMonitor();
        this.storage = new ExtractionStorage();
        this.sheetsExporter = new GoogleSheetsExporter();
        console.log('[Popup] ✅ Componentes inicializados');
    }

    async initStorage() {
        try {
            await this.storage.init();
            console.log('[Popup] ✅ Storage inicializado');
            
            const deleted = await this.storage.cleanOldExtractions(30);
            if (deleted > 0) {
                console.log(`[Popup] 🗑️ ${deleted} extrações antigas removidas`);
            }
        } catch (error) {
            console.error('[Popup] Erro ao inicializar storage:', error);
        }
    }

    cacheElements() {
        // Steps
        this.step1 = document.getElementById('step1');
        this.step2 = document.getElementById('step2');
        this.step3 = document.getElementById('step3');
        this.step4 = document.getElementById('step4');

        // Buttons
        this.btnLoadGroups = document.getElementById('btnLoadGroups');
        this.btnBack = document.getElementById('btnBack');
        this.btnExtract = document.getElementById('btnExtract');
        this.btnNewExtraction = document.getElementById('btnNewExtraction');
        this.btnDismissError = document.getElementById('btnDismissError');
        this.btnViewHistory = document.getElementById('btnViewHistory');

        // Export buttons
        this.btnExportCSV = document.getElementById('btnExportCSV');
        this.btnExportJSON = document.getElementById('btnExportJSON');
        this.btnCopyList = document.getElementById('btnCopyList');
        this.btnCopySheets = document.getElementById('btnCopySheets');
        this.btnOpenSheets = document.getElementById('btnOpenSheets');

        // History buttons
        this.btnBackFromHistory = document.getElementById('btnBackFromHistory');
        this.btnClearHistory = document.getElementById('btnClearHistory');

        // Checkboxes
        this.chkIncludeArchived = document.getElementById('chkIncludeArchived');

        // Filter tabs
        this.filterTabs = document.querySelectorAll('.filter-tab');

        // Other elements
        this.statusBar = document.getElementById('statusBar');
        this.statusText = document.getElementById('statusText');
        this.progressFill = document.getElementById('progressFill');
        this.groupsList = document.getElementById('groupsList');
        this.groupCount = document.getElementById('groupCount');
        this.searchGroups = document.getElementById('searchGroups');
        this.errorBox = document.getElementById('errorBox');
        this.errorText = document.getElementById('errorText');

        // Result elements
        this.resultGroupName = document.getElementById('resultGroupName');
        this.resultGroupStatus = document.getElementById('resultGroupStatus');
        this.resultMemberCount = document.getElementById('resultMemberCount');
        this.membersList = document.getElementById('membersList');

        // History elements
        this.historyList = document.getElementById('historyList');
        this.historyStats = document.getElementById('historyStats');
    }

    // ========================================
    // BIND EVENTS
    // ========================================
    bindEventsOptimized() {
        this.btnLoadGroups?.addEventListener('click', () => this.loadGroups());
        this.btnBack?.addEventListener('click', () => this.goToStep(1));
        this.btnExtract?.addEventListener('click', () => this.startExtraction());
        this.btnNewExtraction?.addEventListener('click', () => this.reset());
        this.btnDismissError?.addEventListener('click', () => this.hideError());
        this.btnViewHistory?.addEventListener('click', () => this.showHistory());

        this.btnExportCSV?.addEventListener('click', () => this.exportCSV());
        this.btnExportJSON?.addEventListener('click', () => this.exportJSON());
        this.btnCopyList?.addEventListener('click', () => this.copyList());
        this.btnCopySheets?.addEventListener('click', () => this.copyToSheets());
        this.btnOpenSheets?.addEventListener('click', () => this.openInSheets());

        this.btnBackFromHistory?.addEventListener('click', () => this.goToStep(1));
        this.btnClearHistory?.addEventListener('click', () => this.clearHistory());

        // Debounced search
        this.searchGroups?.addEventListener('input', 
            PerformanceUtils.debounce(() => {
                if (this.performanceMonitor) {
                    this.performanceMonitor.mark('search-start');
                }
                this.applyFilters();
                if (this.performanceMonitor) {
                    const duration = this.performanceMonitor.measure('search', 'search-start');
                    console.log(`Search completed in ${duration?.toFixed(2)}ms`);
                }
            }, 300)
        );

        this.filterTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                this.setFilter(tab.dataset.filter);
            });
        });

        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });
    }

    // ========================================
    // KEYBOARD SHORTCUTS
    // ========================================
    handleKeyboardShortcuts(e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
            e.preventDefault();
            if (!this.btnLoadGroups?.disabled) this.loadGroups();
        }

        if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
            e.preventDefault();
            if (!this.btnExtract?.disabled) this.startExtraction();
        }

        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            if (this.extractedData) this.exportCSV();
        }

        if ((e.ctrlKey || e.metaKey) && e.key === 'g') {
            e.preventDefault();
            if (this.extractedData) this.copyToSheets();
        }

        if ((e.ctrlKey || e.metaKey) && e.key === 'h') {
            e.preventDefault();
            this.showHistory();
        }

        if (e.key === 'Escape') {
            if (this.step2 && !this.step2.classList.contains('hidden')) {
                this.goToStep(1);
            }
        }

        if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
            e.preventDefault();
            this.searchGroups?.focus();
        }
    }

    // ========================================
    // VERIFICAÇÃO INICIAL
    // ========================================
    async checkWhatsAppTab() {
        try {
            const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
            const tab = tabs[0];

            if (!tab?.url?.includes('web.whatsapp.com')) {
                this.showError('❌ Abra o WhatsApp Web para usar esta extensão');
                if (this.btnLoadGroups) this.btnLoadGroups.disabled = true;
            }
        } catch (error) {
            console.error('[Popup] Erro ao verificar tab:', error);
        }
    }

    // ========================================
    // NAVEGAÇÃO ENTRE ETAPAS
    // ========================================
    goToStep(step) {
        PerformanceUtils.batchUpdate(() => {
            this.step1?.classList.toggle('hidden', step !== 1);
            this.step2?.classList.toggle('hidden', step !== 2);
            this.step3?.classList.toggle('hidden', step !== 3);
            this.step4?.classList.toggle('hidden', step !== 4);
        });

        if (step === 1) {
            this.hideStatus();
            this.selectedGroup = null;
            if (this.btnExtract) this.btnExtract.disabled = true;

            if (this.virtualList) {
                this.virtualList.destroy();
                this.virtualList = null;
            }
        }
    }

    // ========================================
    // STATUS E LOADING
    // ========================================
    showStatus(text, progress = null) {
        if (!this.statusBar) return;
        this.statusBar.classList.remove('hidden');
        if (this.statusText) this.statusText.textContent = text;
        if (progress !== null && this.progressFill) {
            this.progressFill.style.width = `${progress}%`;
        }
    }

    hideStatus() {
        if (!this.statusBar) return;
        this.statusBar.classList.add('hidden');
        if (this.progressFill) this.progressFill.style.width = '0%';
    }

    setLoading(button, loading) {
        if (!button) return;
        if (loading) {
            button.dataset.originalText = button.innerHTML;
            button.innerHTML = '<div class="spinner" style="width: 16px; height: 16px; border-width: 2px; margin: 0 auto;"></div>';
            button.disabled = true;
        } else {
            button.innerHTML = button.dataset.originalText || button.innerHTML;
            button.disabled = false;
        }
    }

    // ========================================
    // MENSAGENS DE ERRO
    // ========================================
    showError(message) {
        if (!this.errorBox) return;
        if (this.errorText) this.errorText.textContent = message;
        this.errorBox.classList.remove('hidden');
        setTimeout(() => this.hideError(), 5000);
    }

    hideError() {
        if (!this.errorBox) return;
        this.errorBox.classList.add('hidden');
    }

    // ========================================
    // COMUNICAÇÃO COM CONTENT SCRIPT
    // ========================================
    async sendMessage(action, data = {}) {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        const tab = tabs[0];

        return new Promise((resolve, reject) => {
            chrome.tabs.sendMessage(
                tab.id,
                { action, ...data },
                (response) => {
                    if (chrome.runtime.lastError) {
                        reject(new Error(chrome.runtime.lastError.message));
                    } else {
                        resolve(response);
                    }
                }
            );
        });
    }

    // ========================================
    // CARREGAR GRUPOS
    // ========================================
    async loadGroups(forceRefresh = false) {
        try {
            if (this.performanceMonitor) {
                this.performanceMonitor.mark('load-groups-start');
            }

            this.setLoading(this.btnLoadGroups, true);
            this.showStatus('🔍 Carregando lista de grupos...', 20);

            const includeArchived = this.chkIncludeArchived?.checked !== false;
            const cacheKey = `groups_${includeArchived}`;

            if (!forceRefresh && this.groupsCache && this.groupsCache.has(cacheKey)) {
                const cached = this.groupsCache.get(cacheKey);
                this.groups = cached.groups;
                this.stats = cached.stats;
                console.log('[Popup] ✅ Grupos do cache:', this.stats);

                this.updateStats();
                this.setFilter('all');
                this.goToStep(2);
                this.setLoading(this.btnLoadGroups, false);
                this.hideStatus();
                return;
            }

            const response = await this.sendMessage('getGroups', { 
                includeArchived: includeArchived 
            });

            if (response?.success && response.groups) {
                this.groups = response.groups;
                this.stats = response.stats || {
                    total: this.groups.length,
                    archived: this.groups.filter(g => g.isArchived).length,
                    active: this.groups.filter(g => !g.isArchived).length
                };

                if (this.groupsCache) {
                    this.groupsCache.set(cacheKey, { 
                        groups: this.groups, 
                        stats: this.stats 
                    });
                }

                if (this.performanceMonitor) {
                    const duration = this.performanceMonitor.measure('load-groups', 'load-groups-start');
                    console.log(`[Popup] ✅ Grupos carregados em ${duration?.toFixed(2)}ms:`, this.stats);
                }

                this.updateStats();
                this.setFilter('all');
                this.goToStep(2);
            } else {
                throw new Error(response?.error || 'Não foi possível carregar os grupos');
            }
        } catch (error) {
            console.error('[Popup] Erro ao carregar grupos:', error);
            this.showError(error.message);
        } finally {
            this.setLoading(this.btnLoadGroups, false);
            this.hideStatus();
        }
    }

    // ========================================
    // ESTATÍSTICAS
    // ========================================
    updateStats() {
        const statActive = document.querySelector('#statActive .stat-value');
        const statArchived = document.querySelector('#statArchived .stat-value');

        if (statActive) statActive.textContent = this.stats.active;
        if (statArchived) statArchived.textContent = this.stats.archived;
    }

    // ========================================
    // FILTROS
    // ========================================
    setFilter(filter) {
        if (this.performanceMonitor) {
            this.performanceMonitor.mark('filter-start');
        }

        this.currentFilter = filter;

        PerformanceUtils.batchUpdate(() => {
            this.filterTabs.forEach(tab => {
                tab.classList.toggle('active', tab.dataset.filter === filter);
            });
        });

        this.applyFilters();

        if (this.performanceMonitor) {
            const duration = this.performanceMonitor.measure('filter', 'filter-start');
            console.log(`Filter applied in ${duration?.toFixed(2)}ms`);
        }
    }

    applyFilters() {
        const searchQuery = this.searchGroups?.value?.toLowerCase() || '';

        this.filteredGroups = this.groups.filter(group => {
            if (this.currentFilter === 'active' && group.isArchived) return false;
            if (this.currentFilter === 'archived' && !group.isArchived) return false;
            if (searchQuery && !group.name.toLowerCase().includes(searchQuery)) return false;
            return true;
        });

        this.renderGroupsWithVirtualScroll(this.filteredGroups);

        if (this.groupCount) {
            this.groupCount.textContent = `${this.filteredGroups.length} grupo${this.filteredGroups.length !== 1 ? 's' : ''}`;
        }
    }

    // ========================================
    // RENDERIZAR COM VIRTUAL SCROLL
    // ========================================
    renderGroupsWithVirtualScroll(groups) {
        if (!this.groupsList) return;

        if (this.performanceMonitor) {
            this.performanceMonitor.mark('render-start');
        }

        if (groups.length === 0) {
            this.groupsList.innerHTML = `
                <div class="empty-state">
                    <span class="empty-state-icon">🔭</span>
                    <p>Nenhum grupo encontrado</p>
                </div>
            `;
            return;
        }

        if (this.virtualList) {
            this.virtualList.destroy();
        }

        this.groupsList.innerHTML = '';

        this.virtualList = new VirtualScroll(this.groupsList, {
            itemHeight: 72,
            buffer: 3,
            renderItem: (group, index) => this.createGroupElement(group, index)
        });

        this.virtualList.setItems(groups);

        if (this.performanceMonitor) {
            const duration = this.performanceMonitor.measure('render', 'render-start');
            console.log(`Groups rendered with VirtualScroll in ${duration?.toFixed(2)}ms`);
        }
    }

    createGroupElement(group, index) {
        const div = document.createElement('div');
        div.className = `group-item ${group.isArchived ? 'archived' : ''}`;
        div.dataset.index = index;
        div.dataset.id = group.id;
        div.dataset.archived = group.isArchived;

        div.innerHTML = `
            <div class="group-avatar">
                ${group.isArchived ? '📦' : '👥'}
            </div>
            <div class="group-info">
                <div class="group-name">
                    ${this.escapeHtml(group.name)}
                    ${group.isArchived ? '<span class="archived-badge">Arquivado</span>' : ''}
                </div>
                <div class="group-members">${group.memberCount || 'Grupo'}</div>
            </div>
            <div class="group-check">✓</div>
        `;

        div.addEventListener('click', () => this.selectGroup(div));
        return div;
    }

    selectGroup(element) {
        PerformanceUtils.batchUpdate(() => {
            this.groupsList?.querySelectorAll('.group-item').forEach(item => {
                item.classList.remove('selected');
            });
            element.classList.add('selected');
        });

        const groupId = element.dataset.id;
        const isArchived = element.dataset.archived === 'true';

        this.selectedGroup = this.groups.find(g => g.id === groupId);

        if (this.selectedGroup) {
            this.selectedGroup.isArchived = isArchived;
            if (this.btnExtract) this.btnExtract.disabled = false;
            console.log('[Popup] Grupo selecionado:', this.selectedGroup);
        }
    }

    // ========================================
    // EXTRAÇÃO
    // ========================================
    async startExtraction() {
        if (!this.selectedGroup) {
            this.showError('⚠️ Selecione um grupo primeiro');
            return;
        }

        try {
            if (this.performanceMonitor) {
                this.performanceMonitor.mark('extraction-start');
            }

            this.setLoading(this.btnExtract, true);

            const groupStatus = this.selectedGroup.isArchived ? 'arquivado' : 'ativo';
            this.showStatus(`🔍 Navegando até o grupo ${groupStatus}...`, 10);

            const navResponse = await this.sendMessage('navigateToGroup', {
                groupId: this.selectedGroup.id,
                groupName: this.selectedGroup.name,
                isArchived: this.selectedGroup.isArchived
            });

            if (!navResponse?.success) {
                throw new Error(navResponse?.error || 'Não foi possível abrir o grupo');
            }

            this.showStatus('📂 Abrindo informações...', 30);
            await this.delay(this.selectedGroup.isArchived ? 1200 : 800);

            this.showStatus('🔍 Iniciando extração...', 40);
            const extractResponse = await this.sendMessage('extractMembers');

            if (extractResponse?.success && extractResponse.data) {
                this.extractedData = {
                    ...extractResponse.data,
                    groupId: this.selectedGroup.id,
                    isArchived: this.selectedGroup.isArchived
                };

                await this.saveExtractionToStorage();

                if (this.performanceMonitor) {
                    const duration = this.performanceMonitor.measure('extraction', 'extraction-start');
                    console.log(`[Popup] ✅ Extração concluída em ${duration?.toFixed(2)}ms`);
                }

                this.showResults();
            } else {
                throw new Error(extractResponse?.error || 'Erro durante a extração');
            }
        } catch (error) {
            console.error('[Popup] ❌ Erro na extração:', error);
            this.showError(error.message);
            this.setLoading(this.btnExtract, false);
        } finally {
            this.hideStatus();
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // ========================================
    // SALVAR NO STORAGE
    // ========================================
    async saveExtractionToStorage() {
        try {
            const id = await this.storage.saveExtraction(this.extractedData);
            console.log('[Popup] ✅ Extração salva no IndexedDB com ID:', id);
            this.extractedData.storageId = id;
        } catch (error) {
            console.error('[Popup] Erro ao salvar no storage:', error);
        }
    }

    // ========================================
    // MOSTRAR RESULTADOS
    // ========================================
    showResults() {
        if (this.resultGroupName) {
            this.resultGroupName.textContent = this.extractedData.groupName;
        }

        if (this.resultGroupStatus) {
            this.resultGroupStatus.textContent = this.extractedData.isArchived 
                ? '📦 Arquivado' 
                : '💬 Ativo';
            this.resultGroupStatus.className = `value ${
                this.extractedData.isArchived ? 'status-archived' : 'status-active'
            }`;
        }

        if (this.resultMemberCount) {
            this.resultMemberCount.textContent = `${this.extractedData.totalMembers} membros`;
        }

        this.updateMembersListVirtual(this.extractedData.members);

        this.setLoading(this.btnExtract, false);
        this.goToStep(3);
    }

    // ========================================
    // ATUALIZAR MEMBROS COM VIRTUAL SCROLL
    // ========================================
    updateMembersListVirtual(members) {
        if (!this.membersList || !members || members.length === 0) return;

        const uniqueMembers = Array.from(
            new Map(members.map(m => [(m.phone || m.name), m])).values()
        );

        // ← CORREÇÃO: Destruir a instância anterior corretamente
        if (this.membersVirtualList) {
            this.membersVirtualList.destroy();
            this.membersVirtualList = null;
        }

        this.membersList.innerHTML = '';

        this.membersVirtualList = new VirtualScroll(this.membersList, {
            itemHeight: 60,
            buffer: 5,
            renderItem: (member) => {
                const div = document.createElement('div');
                div.className = 'member-item';
                div.innerHTML = `
                    <div class="member-avatar">
                        ${member.isAdmin ? '👑' : '👤'}
                    </div>
                    <div class="member-info">
                        <div class="member-name">${this.escapeHtml(member.name)}</div>
                        ${member.phone ? `<div class="member-phone">${this.escapeHtml(member.phone)}</div>` : ''}
                    </div>
                `;
                return div;
            }
        });

        this.membersVirtualList.setItems(uniqueMembers);
    }

    // ========================================
    // EXPORTAÇÕES
    // ========================================
    exportCSV() {
        if (!this.extractedData) return;

        try {
            const headers = ['Nome', 'Telefone', 'Admin', 'Grupo Arquivado', 'Data Extração'];
            const rows = this.extractedData.members.map(m => [
                m.name,
                m.phone || '',
                m.isAdmin ? 'Sim' : 'Não',
                this.extractedData.isArchived ? 'Sim' : 'Não',
                m.extractedAt
            ]);

            const csv = [headers, ...rows]
                .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
                .join('\n');

            const filename = `${this.sanitizeFilename(this.extractedData.groupName)}_membros.csv`;
            this.downloadFile(csv, filename, 'text/csv;charset=utf-8');
            console.log('[Popup] ✅ CSV exportado:', filename);
        } catch (error) {
            console.error('[Popup] Erro ao exportar CSV:', error);
            this.showError('Erro ao exportar CSV');
        }
    }

    exportJSON() {
        if (!this.extractedData) return;

        try {
            const json = JSON.stringify(this.extractedData, null, 2);
            const filename = `${this.sanitizeFilename(this.extractedData.groupName)}_membros.json`;
            this.downloadFile(json, filename, 'application/json');
            console.log('[Popup] ✅ JSON exportado:', filename);
        } catch (error) {
            console.error('[Popup] Erro ao exportar JSON:', error);
            this.showError('Erro ao exportar JSON');
        }
    }

    async copyList() {
        if (!this.extractedData) return;

        try {
            const list = this.extractedData.members
                .map(m => `${m.name}${m.phone ? ' - ' + m.phone : ''}${m.isAdmin ? ' [Admin]' : ''}`)
                .join('\n');

            await navigator.clipboard.writeText(list);

            if (this.btnCopyList) {
                const originalText = this.btnCopyList.innerHTML;
                this.btnCopyList.innerHTML = '✓ Copiado!';
                this.btnCopyList.style.background = 'rgba(37, 211, 102, 0.3)';

                setTimeout(() => {
                    this.btnCopyList.innerHTML = originalText;
                    this.btnCopyList.style.background = '';
                }, 2000);
            }

            console.log('[Popup] ✅ Lista copiada');
        } catch (error) {
            console.error('[Popup] Erro ao copiar:', error);
            this.showError('Não foi possível copiar');
        }
    }

    // ========================================
    // GOOGLE SHEETS EXPORT
    // ========================================
    async copyToSheets() {
        if (!this.extractedData) return;

        try {
            await this.sheetsExporter.copyForSheetsWithFormatting(this.extractedData);

            if (this.btnCopySheets) {
                const originalText = this.btnCopySheets.innerHTML;
                this.btnCopySheets.innerHTML = '✓ Copiado!';
                this.btnCopySheets.style.background = 'rgba(37, 211, 102, 0.3)';

                setTimeout(() => {
                    this.btnCopySheets.innerHTML = originalText;
                    this.btnCopySheets.style.background = '';
                }, 2000);
            }

            console.log('[Popup] ✅ Dados copiados para Sheets');
            alert('✅ Dados copiados!\n\n1. Abra o Google Sheets\n2. Cole com Ctrl+V\n3. Pronto!');
        } catch (error) {
            console.error('[Popup] Erro ao copiar para Sheets:', error);
            this.showError('Erro ao copiar para Sheets');
        }
    }

    async openInSheets() {
        if (!this.extractedData) return;

        try {
            await this.sheetsExporter.openInSheets(this.extractedData);
            console.log('[Popup] ✅ Google Sheets aberto');
        } catch (error) {
            console.error('[Popup] Erro ao abrir Sheets:', error);
            this.showError('Erro ao abrir Google Sheets');
        }
    }

    // ========================================
    // HISTÓRICO
    // ========================================
    async showHistory() {
        try {
            this.showStatus('📜 Carregando histórico...', 50);

            const history = await this.storage.getExtractionHistory({ limit: 100 });
            const stats = await this.storage.getStats();

            this.renderHistory(history, stats);
            this.goToStep(4);
        } catch (error) {
            console.error('[Popup] Erro ao carregar histórico:', error);
            this.showError('Erro ao carregar histórico');
        } finally {
            this.hideStatus();
        }
    }

    renderHistory(history, stats) {
        if (!this.historyList || !this.historyStats) return;

        // Renderizar estatísticas
        this.historyStats.innerHTML = `
            <div class="stat-card">
                <span class="stat-icon">📊</span>
                <span class="stat-value">${stats.totalExtractions}</span>
                <span class="stat-label">Extrações</span>
            </div>
            <div class="stat-card">
                <span class="stat-icon">👥</span>
                <span class="stat-value">${stats.totalGroups}</span>
                <span class="stat-label">Grupos</span>
            </div>
            <div class="stat-card">
                <span class="stat-icon">📈</span>
                <span class="stat-value">${stats.averageMembersPerGroup}</span>
                <span class="stat-label">Média/Grupo</span>
            </div>
        `;

        // Renderizar histórico
        if (history.length === 0) {
            this.historyList.innerHTML = `
                <div class="empty-state">
                    <span class="empty-state-icon">🔭</span>
                    <p>Nenhuma extração no histórico</p>
                </div>
            `;
            return;
        }

        const html = history.map((extraction) => {
            const date = new Date(extraction.extractedAt);
            const dateStr = date.toLocaleString('pt-BR');

            return `
                <div class="history-item" data-id="${extraction.id}">
                    <div class="history-avatar">
                        ${extraction.isArchived ? '📦' : '👥'}
                    </div>
                    <div class="history-info">
                        <div class="history-name">${this.escapeHtml(extraction.groupName)}</div>
                        <div class="history-meta">
                            ${extraction.totalMembers} membros • ${dateStr}
                        </div>
                    </div>
                    <div class="history-actions">
                        <button class="btn-icon" onclick="window.popupController.viewExtraction(${extraction.id})" title="Ver">👁️</button>
                        <button class="btn-icon" onclick="window.popupController.deleteExtraction(${extraction.id})" title="Deletar">🗑️</button>
                    </div>
                </div>
            `;
        }).join('');

        this.historyList.innerHTML = html;
    }

    async viewExtraction(id) {
        try {
            const extraction = await this.storage.getExtraction(id);
            if (extraction) {
                this.extractedData = extraction;
                this.showResults();
            }
        } catch (error) {
            console.error('[Popup] Erro ao visualizar extração:', error);
            this.showError('Erro ao carregar extração');
        }
    }

    async deleteExtraction(id) {
        if (!confirm('Tem certeza que deseja deletar esta extração?')) return;

        try {
            await this.storage.deleteExtraction(id);
            this.showHistory();
        } catch (error) {
            console.error('[Popup] Erro ao deletar:', error);
            this.showError('Erro ao deletar extração');
        }
    }

    // ========================================
    // LIMPAR TODO HISTÓRICO
    // ========================================
    async clearHistory() {
        if (!confirm('⚠️ Tem certeza que deseja limpar TODO o histórico?\n\nEsta ação não pode ser desfeita!')) {
            return;
        }

        try {
            this.showStatus('🗑️ Limpando histórico...', 50);
            await this.storage.clearAllExtractions();
            console.log('[Popup] ✅ Histórico limpo');
            await this.showHistory();
        } catch (error) {
            console.error('[Popup] Erro ao limpar histórico:', error);
            this.showError('Erro ao limpar histórico');
        } finally {
            this.hideStatus();
        }
    }

    // ========================================
    // UTILITÁRIOS
    // ========================================
    sanitizeFilename(filename) {
        return filename
            .replace(/[<>:"/\\|?*]/g, '')
            .replace(/[\u200B-\u200D\uFEFF\u202A-\u202E]/g, '')
            .replace(/[®™©]/g, '')
            .trim()
            .substring(0, 100);
    }

    downloadFile(content, filename, type) {
        try {
            const BOM = '\uFEFF';
            const blob = new Blob([BOM + content], { type });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('[Popup] Erro ao baixar:', error);
            throw error;
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // ========================================
    // RESET
    // ========================================
    reset() {
        this.selectedGroup = null;
        this.extractedData = null;
        if (this.searchGroups) this.searchGroups.value = '';
        this.currentFilter = 'all';

        // Destruir virtual lists
        if (this.virtualList) {
            this.virtualList.destroy();
            this.virtualList = null;
        }
        if (this.membersVirtualList) {
            this.membersVirtualList.destroy();
            this.membersVirtualList = null;
        }

        this.goToStep(1);

        if (this.performanceMonitor && this.performanceMonitor.measures.length > 0) {
            this.performanceMonitor.report();
        }
    }
}

// ========================================
// LISTENER PARA PROGRESSO
// ========================================
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'extractionProgress') {
        const statusText = document.getElementById('statusText');
        const progressFill = document.getElementById('progressFill');

        if (statusText) {
            statusText.textContent = `${message.status} (${message.count} membros)`;
        }
        if (progressFill && message.progress) {
            progressFill.style.width = `${message.progress}%`;
        }
    }
});

// ========================================
// INICIALIZAÇÃO
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('[Popup] 🚀 Inicializando v6.0.1 COMPLETO...');
    console.log('[Popup] 📦 Features: Virtual Scroll + IndexedDB + Google Sheets');
    window.popupController = new PopupController();
});