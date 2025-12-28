# 📱 WhatsApp Group Member Extractor + WhatsHybrid Lite

Extensão Chrome profissional para extrair membros de grupos do WhatsApp Web com interface moderna e funcionalidades avançadas, agora integrada com recursos do WhatsHybrid Lite.

## ✨ Funcionalidades

### 📥 Extração de Grupos
- 📥 **Extração de Membros**: Extrai membros de grupos ativos e arquivados
- 📊 **Exportação Múltipla**: Exporta para CSV e Google Sheets
- 💾 **Histórico Persistente**: Armazena extrações no IndexedDB
- ⏸️ **Controle Total**: Pause, continue ou pare extrações em andamento
- 🔄 **Retry Automático**: Tenta novamente em caso de falha
- 🔍 **Filtros Inteligentes**: Filtra grupos inválidos ou excluídos automaticamente
- ⚡ **Virtual Scroll**: Performance otimizada para grandes listas

### 📢 Envio em Massa (NOVO!)
- 📱 **Importar Números**: Cole números ou importe via CSV
- 💬 **Templates Personalizados**: Use variáveis {{nome}}, {{first_name}}, {{phone}}
- 🖼️ **Anexar Imagens**: Envie mensagens com imagens anexadas
- 😊 **Emoji Picker**: Adicione emojis facilmente às mensagens
- 👁️ **Preview WhatsApp**: Visualize como ficará a mensagem
- 📋 **Gerenciamento de Fila**: Controle completo da fila de envio
- ⏸️ **Controles Avançados**: Iniciar, pausar, retomar e parar campanhas
- 📊 **Estatísticas em Tempo Real**: Acompanhe enviados, falhas e pendentes

### 🔄 Anti-Revoke (NOVO!)
- 🗑️ **Recuperar Mensagens Apagadas**: Visualize mensagens que foram apagadas
- ✏️ **Histórico de Edições**: Veja o conteúdo original de mensagens editadas
- 💾 **Timeline Visual**: Interface moderna para navegação
- 📤 **Exportar JSON**: Salve o histórico de mensagens recuperadas

### 📱 Extração de Contatos (NOVO!)
- ⚡ **Extração Instantânea**: Via API do WhatsApp (muito mais rápido)
- 📁 **Categorização Automática**: Normal, Arquivados e Bloqueados
- 📋 **Copiar e Exportar**: Copie para clipboard ou exporte em CSV
- ✅ **Validação de Números**: Validação automática de números brasileiros

### 🎯 Interface Dupla
- 🎯 **Side Panel Moderno**: Interface lateral persistente no Chrome
- 📊 **Top Panel Expandido**: 4 abas (Extrator, Grupos, Recover, Config)
- 🎨 **Interface Premium**: Design moderno com gradientes e animações
- 🚀 **Modo Pro**: Todas as operações continuam em segundo plano

## 🚀 Instalação

### Para Usuários

1. Baixe o repositório como ZIP
2. Extraia o conteúdo em uma pasta
3. Abra o Chrome e acesse `chrome://extensions/`
4. Ative o **Modo desenvolvedor** (canto superior direito)
5. Clique em **Carregar sem compactação**
6. Selecione a pasta extraída
7. Pronto! O ícone da extensão aparecerá na barra de ferramentas

### Para Desenvolvedores

```bash
# Clone o repositório
git clone https://github.com/sevadarkness/correcao.git
cd correcao

# Carregue no Chrome
# 1. Abra chrome://extensions/
# 2. Ative "Modo desenvolvedor"
# 3. Clique em "Carregar sem compactação"
# 4. Selecione esta pasta
```

## 📖 Como Usar

### Passo 1: Acesse o WhatsApp Web
1. Abra o WhatsApp Web (web.whatsapp.com)
2. Faça login se necessário

### Passo 2: Abra a Extensão
1. Clique no ícone da extensão na barra de ferramentas
2. A interface lateral (Side Panel) será aberta

### Passo 3: Carregue os Grupos
1. Clique no botão **"Carregar Grupos"**
2. Aguarde enquanto a extensão lista seus grupos
3. Use os filtros para ver grupos ativos ou arquivados

### Passo 4: Selecione um Grupo
1. Escolha um grupo da lista
2. Use a busca para encontrar grupos específicos
3. Clique no grupo desejado para selecioná-lo

### Passo 5: Extrair Membros
1. Clique em **"Extrair Membros"**
2. Acompanhe o progresso na barra
3. Use os controles para pausar, continuar ou parar

### Passo 6: Exporte os Dados
1. Após a conclusão, visualize os membros extraídos
2. Escolha uma opção de exportação:
   - **CSV**: Baixe como arquivo CSV
   - **Copiar**: Copie a lista para área de transferência
   - **Google Sheets**: Copie formatado para colar no Sheets
   - **Abrir no Sheets**: Abra diretamente no Google Sheets

## ⌨️ Atalhos de Teclado

| Atalho | Ação |
|--------|------|
| `Ctrl+L` | Carregar grupos |
| `Ctrl+H` | Ver histórico |
| `Ctrl+F` | Buscar grupo |
| `Ctrl+S` | Exportar CSV |
| `Ctrl+G` | Copiar para Google Sheets |

## 🎯 Como Usar as Novas Funcionalidades

### 📢 Envio em Massa
1. No Side Panel, clique no ícone 📢 no header
2. Cole os números (um por linha) ou importe um CSV
3. Digite sua mensagem usando variáveis: {{nome}}, {{first_name}}, {{phone}}
4. (Opcional) Anexe uma imagem
5. Clique em **"Gerar Fila"**
6. Clique em **"Iniciar Campanha"**
7. Acompanhe o progresso em tempo real

### 📱 Extração de Contatos
1. O Top Panel aparece automaticamente quando o Side Panel está aberto
2. Clique na aba **"Extrator"**
3. Clique em **"Extrair Contatos (API Instantânea)"**
4. Os contatos serão separados em: Normais, Arquivados e Bloqueados
5. Use os botões de copiar ou exporte para CSV

### 🔄 Recuperar Mensagens
1. No Top Panel, clique na aba **"Recover"**
2. Todas as mensagens apagadas/editadas aparecerão automaticamente
3. Veja o conteúdo original de cada mensagem
4. Copie mensagens específicas ou exporte tudo em JSON

### ⚙️ Configurações
1. No Top Panel, clique na aba **"Config"**
2. Configure delays para envio em massa
3. Salve rascunhos de campanhas
4. Exporte relatórios de campanhas

## 🛠️ Tecnologias

- **Chrome Extension Manifest V3**: Última versão da plataforma
- **Side Panel API**: Interface lateral moderna
- **IndexedDB**: Armazenamento local persistente
- **Virtual Scroll**: Performance otimizada
- **WhatsApp Web API**: Integração nativa com WhatsApp
- **CSS Gradients & Animations**: Design moderno

## 📁 Estrutura do Projeto

```
correcao/
├── background/
│   └── background.js               # Service worker + estado de extração e campanhas
├── content/
│   ├── content.js                  # Script principal + handlers de mensagens
│   ├── inject.js                   # API injetada no WhatsApp
│   ├── extractor-v6-optimized.js   # Motor de extração de grupos
│   ├── extractor.contacts.js      # Extração de contatos via API (NOVO)
│   ├── campaign.js                 # Gerenciamento de campanhas (NOVO)
│   ├── wpp-hooks.js                # Hooks WhatsApp: recover + extração (NOVO)
│   ├── top-panel-injector.js       # Injetor do Top Panel (4 abas)
│   └── top-panel.css               # Estilos do Top Panel
├── utils/
│   ├── utils-optimized.js          # Utilitários otimizados
│   ├── storage.js                  # Gerenciamento do IndexedDB
│   ├── google-sheets-export.js     # Exportação para Sheets
│   ├── selectors.js                # Seletores DOM centralizados
│   └── data-normalizer.js          # Normalização de dados
├── icons/                          # Ícones da extensão
├── sidepanel.html                  # Interface do Side Panel (5 steps)
├── sidepanel.css                   # Estilos da interface
├── sidepanel.js                    # Lógica da interface + campanhas
├── manifest.json                   # Configuração da extensão
└── README.md                       # Este arquivo
```

## 🔒 Segurança e Privacidade

- ✅ **Processamento Local**: Todos os dados são processados localmente
- ✅ **Sem Servidores Externos**: Nenhum dado é enviado para servidores
- ✅ **Armazenamento Local**: IndexedDB armazena apenas no seu navegador
- ✅ **Código Aberto**: Todo o código está disponível para auditoria
- ✅ **Sem Rastreamento**: Não coletamos nenhuma informação pessoal

## 🐛 Problemas Conhecidos

Veja as [Issues](https://github.com/sevadarkness/correcao/issues) para lista completa.

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor:

1. Faça um Fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Changelog

### v6.1.0 (Atual) - WhatsHybrid Lite Integration 🎉
**Integração completa do WhatsHybrid Lite mantendo 100% das funcionalidades originais**

#### 🆕 Novas Funcionalidades

**Top Panel Expandido (4 Abas):**
- ✅ **Aba Extrator**: Extração instantânea de contatos via API
  - Separação automática: Normal, Arquivados, Bloqueados
  - Copiar individual ou todos os contatos
  - Exportar para CSV
- ✅ **Aba Grupos**: Link para Side Panel
- ✅ **Aba Recover**: Anti-revoke de mensagens
  - Timeline visual de mensagens apagadas e editadas
  - Visualização do conteúdo original
  - Exportar histórico em JSON
  - Contador em tempo real
- ✅ **Aba Config**: Configurações avançadas
  - Parâmetros de delay (min/max)
  - Agendamento de campanhas
  - Gerenciamento de rascunhos
  - Exportação de relatórios

**Side Panel - Envio em Massa:**
- ✅ Nova seção completa para campanhas
- ✅ Importação de números (manual ou CSV)
- ✅ Templates com variáveis: {{nome}}, {{first_name}}, {{phone}}
- ✅ Emoji picker integrado
- ✅ Anexo de imagens com preview
- ✅ Preview estilo WhatsApp (balão verde)
- ✅ Gerenciamento de fila com tabela
- ✅ Controles: Iniciar, Pausar, Continuar, Parar
- ✅ Estatísticas: Enviados, Falhas, Pendentes
- ✅ Barra de progresso com tempo estimado
- ✅ Ações: Pular atual, Remover item, Zerar fila

**Backend:**
- ✅ Hooks WhatsApp para interceptação de mensagens
- ✅ Extração de contatos via API interna
- ✅ Gerenciamento de estado de campanhas
- ✅ Persistência de dados entre reinicializações

#### 🔧 Melhorias Técnicas
- ✅ Validação rigorosa de números brasileiros
- ✅ Timeout protection em loops infinitos
- ✅ Null checks em todas as operações críticas
- ✅ Validação de entrada em geradores de fila
- ✅ Constantes nomeadas para magic numbers
- ✅ CodeQL Security Scan: 0 vulnerabilidades

#### 🎨 Design
- ✅ Tema verde WhatsApp mantido (#075e54, #128c7e, #25d366)
- ✅ +1500 linhas de CSS para novos componentes
- ✅ Animações e transições suaves
- ✅ Responsividade mantida

### v6.0.9
- ✅ Correção do comportamento do Side Panel
- ✅ Simplificação da lógica de abertura automática
- ✅ Delay otimizado para 1.5s após redirecionamento
- ✅ Remoção de retry logic complexo para maior estabilidade

### v6.0.8
- ✅ Restrição do Side Panel apenas para WhatsApp Web
- ✅ Side Panel não aparece em outras abas
- ✅ Redirecionamento automático ao clicar fora do WhatsApp
- ✅ Gerenciamento inteligente do Side Panel por aba
- ✅ Configuração automática para abas existentes

### v6.0.3
- ✅ Filtragem de grupos inválidos/excluídos
- ✅ Lock de extração para prevenir race conditions
- ✅ Mensagens de erro humanizadas
- ✅ Badge "Pro Mode" no header
- ✅ Timeout dinâmico baseado no tamanho do grupo
- ✅ Seletores DOM centralizados
- ✅ Utilitários de normalização de dados

### v6.0.2
- ✅ Side Panel como interface padrão
- ✅ Virtual Scroll para performance
- ✅ Histórico de extrações
- ✅ Exportação para Google Sheets

### v6.0.1
- ✅ Suporte a grupos arquivados
- ✅ Retry automático
- ✅ Interface moderna

## 📄 Licença

MIT License - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 👨‍💻 Autor

**sevadarkness**

- GitHub: [@sevadarkness](https://github.com/sevadarkness)

## ⭐ Agradecimentos

Se esta extensão foi útil para você, considere dar uma estrela no projeto!

---

**Nota**: Esta extensão não é afiliada, associada, autorizada, endossada por, ou de qualquer forma oficialmente conectada com WhatsApp ou qualquer de suas subsidiárias ou afiliadas.
