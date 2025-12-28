# 📱 WhatsApp Group Member Extractor

Extensão Chrome profissional para extrair membros de grupos do WhatsApp Web com interface moderna e funcionalidades avançadas.

## ✨ Funcionalidades

- 📥 **Extração de Membros**: Extrai membros de grupos ativos e arquivados
- 📊 **Exportação Múltipla**: Exporta para CSV e Google Sheets
- 💾 **Histórico Persistente**: Armazena extrações no IndexedDB
- 🎯 **Side Panel Moderno**: Interface lateral persistente no Chrome
- ⏸️ **Controle Total**: Pause, continue ou pare extrações em andamento
- 🔄 **Retry Automático**: Tenta novamente em caso de falha
- 🎨 **Interface Premium**: Design moderno com gradientes e animações
- 🚀 **Modo Pro**: Extração continua em segundo plano
- 🔍 **Filtros Inteligentes**: Filtra grupos inválidos ou excluídos automaticamente
- ⚡ **Virtual Scroll**: Performance otimizada para grandes listas

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
│   └── background.js        # Service worker e gerenciamento de estado
├── content/
│   ├── content.js           # Script de conteúdo principal
│   ├── inject.js            # API injetada no WhatsApp
│   └── extractor-v6-optimized.js  # Motor de extração
├── utils/
│   ├── utils-optimized.js   # Utilitários otimizados
│   ├── storage.js           # Gerenciamento do IndexedDB
│   ├── google-sheets-export.js  # Exportação para Sheets
│   ├── selectors.js         # Seletores DOM centralizados
│   └── data-normalizer.js   # Normalização de dados
├── icons/                   # Ícones da extensão
├── sidepanel.html          # Interface do Side Panel
├── sidepanel.css           # Estilos da interface
├── sidepanel.js            # Lógica da interface
├── manifest.json           # Configuração da extensão
└── README.md              # Este arquivo
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

### v6.0.3 (Atual)
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
