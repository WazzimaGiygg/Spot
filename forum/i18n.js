// ============================================
// SISTEMA DE INTERNACIONALIZAÇÃO (i18n)
// ============================================

class I18n {
    constructor() {
        this.currentLocale = 'pt-BR';
        this.supportedLocales = ['pt-BR', 'en-US', 'es-ES', 'fr-FR'];
        this.translations = {};
        this.observers = [];
        this.initialized = false;
    }

    async init() {
        try {
            // Carregar idioma salvo ou detectar do navegador
            const savedLocale = localStorage.getItem('maspia_locale');
            const browserLocale = this.detectBrowserLocale();
            this.currentLocale = savedLocale || browserLocale || 'pt-BR';
            
            if (!this.supportedLocales.includes(this.currentLocale)) {
                this.currentLocale = 'pt-BR';
            }

            await this.loadLocale(this.currentLocale);
            this.initialized = true;
            this.updateUI();
            this.setupLanguageSelector();
            
            console.log(`🌐 Idioma carregado: ${this.currentLocale}`);
            return true;
        } catch (error) {
            console.error('Erro ao inicializar i18n:', error);
            return false;
        }
    }

    detectBrowserLocale() {
        try {
            const lang = navigator.language || navigator.languages?.[0] || 'pt-BR';
            // Mapear idiomas do navegador para os suportados
            const map = {
                'pt': 'pt-BR',
                'pt-BR': 'pt-BR',
                'pt-PT': 'pt-BR',
                'en': 'en-US',
                'en-US': 'en-US',
                'en-GB': 'en-US',
                'es': 'es-ES',
                'es-ES': 'es-ES',
                'es-MX': 'es-ES',
                'fr': 'fr-FR',
                'fr-FR': 'fr-FR',
                'fr-CA': 'fr-FR'
            };
            return map[lang] || 'pt-BR';
        } catch {
            return 'pt-BR';
        }
    }

    async loadLocale(locale) {
        try {
            // Tentar carregar do arquivo JSON
            const response = await fetch(`/forum/locales/${locale}.json`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            this.translations = await response.json();
            this.currentLocale = locale;
            localStorage.setItem('maspia_locale', locale);
            document.documentElement.lang = locale;
            return true;
        } catch (error) {
            console.warn(`Erro ao carregar idioma ${locale}, usando fallback pt-BR:`, error);
            // Fallback para pt-BR
            if (locale !== 'pt-BR') {
                return this.loadLocale('pt-BR');
            }
            // Fallback embutido
            this.translations = this.getFallbackTranslations();
            return false;
        }
    }

    getFallbackTranslations() {
        return {
            "meta": { "title": "Maspia Forum - Comunidade", "description": "Comunidade e discussão" },
            "header": {
                "forum": "Fórum",
                "login": "Entrar",
                "logout": "Sair",
                "visitante": "Visitante",
                "aguarde": "aguarde",
                "carregando": "Carregando..."
            },
            "footer": {
                "donation": "💝 Doação",
                "desktop": "🖥️ Desktop",
                "lgpd": "🔒 LGPD",
                "marcoCivil": "📜 Marco Civil",
                "ticket": "🎫 Ticket",
                "products": "🛍️ Produtos",
                "account": "👤 Sua conta",
                "copyright": "© 2026 WazzimaGiygg Forum - Comunidade e Discussão",
                "allRights": "Todos os direitos reservados"
            },
            "cookie": {
                "title": "🍪 Nós usamos cookies",
                "description": "Este site utiliza cookies para melhorar sua experiência, analisar tráfego e exibir anúncios personalizados. Ao continuar navegando, você concorda com nossa",
                "privacyPolicy": "Política de Privacidade",
                "essential": "🔒 Essenciais (obrigatórios)",
                "analytics": "📊 Análise de dados",
                "advertising": "🎯 Publicidade personalizada",
                "acceptAll": "✅ Aceitar Todos",
                "rejectAll": "❌ Recusar Todos",
                "customize": "⚙️ Personalizar"
            },
            "login": {
                "title": "Entrar no Fórum",
                "subtitle": "Faça login para participar do fórum",
                "google": "Entrar com Google",
                "email": "E-mail",
                "password": "Senha",
                "submit": "Entrar com e-mail",
                "createAccount": "Criar nova conta",
                "or": "ou"
            },
            "banned": {
                "title": "⚠️ Conta Banida",
                "description": "Sua conta foi banida permanentemente do fórum.",
                "reason": "Motivo: Violação das políticas de uso",
                "appeal": "Se você acredita que isso é um erro, entre em contato com o suporte.",
                "logout": "🚪 Sair da conta"
            },
            "categories": {
                "title": "Categorias",
                "noCategories": "Nenhuma categoria criada ainda",
                "createFirst": "Clique no botão abaixo para criar sua primeira categoria",
                "createCategory": "Criar Categoria",
                "createSubcategory": "Criar Subcategoria",
                "subcategories": "Subcategorias",
                "topics": "Tópicos",
                "posts": "Posts"
            },
            "threads": {
                "title": "Tópicos",
                "noThreads": "Nenhum tópico ainda. Seja o primeiro a criar um!",
                "createThread": "Criar Novo Tópico",
                "by": "Por",
                "replies": "Respostas",
                "totalReplies": "Total de respostas",
                "lastActivity": "Última atividade"
            },
            "posts": {
                "title": "Posts",
                "noPosts": "Nenhum post encontrado",
                "createdBy": "Criado por",
                "anonymous": "Anônimo",
                "reply": "Responder",
                "edit": "Editar",
                "delete": "Excluir",
                "copyLink": "Copiar link",
                "confirmDelete": "Tem certeza que deseja excluir este post?",
                "copied": "Link copiado!",
                "showing": "Mostrando",
                "of": "de",
                "totalPosts": "posts",
                "page": "Página"
            },
            "pagination": {
                "first": "« Primeira",
                "last": "Última »",
                "previous": "‹ Anterior",
                "next": "Próxima ›"
            },
            "comments": {
                "title": "Comentários",
                "noComments": "Nenhum comentário ainda.",
                "writeComment": "Escreva seu comentário...",
                "submit": "Enviar Comentário",
                "placeholder": "Digite seu comentário aqui..."
            },
            "editor": {
                "placeholder": "Digite sua resposta aqui... Use as ferramentas de formatação!",
                "threadPlaceholder": "Digite o conteúdo do seu tópico aqui..."
            },
            "admin": {
                "title": "Painel Administrativo",
                "createCategory": "Criar Categoria",
                "createSubcategory": "Criar Subcategoria",
                "stats": "Ver Estatísticas",
                "categories": "Categorias",
                "subcategories": "Subcategorias",
                "threads": "Tópicos",
                "posts": "Posts",
                "name": "Nome da Categoria",
                "description": "Descrição",
                "icon": "Ícone (emoji)",
                "order": "Ordem"
            },
            "notifications": {
                "title": "🔔 Notificações",
                "noNotifications": "Nenhuma notificação",
                "markAllRead": "Marcar todas como lidas"
            },
            "imageModal": {
                "title": "Inserir Imagem",
                "urlLabel": "URL da Imagem",
                "altLabel": "Texto alternativo (opcional)",
                "insert": "Inserir Imagem"
            },
            "errors": {
                "fillFields": "Preencha todos os campos obrigatórios",
                "banned": "Sua conta está banida.",
                "loginRequired": "Faça login para continuar",
                "waitMoment": "Aguarde um momento...",
                "threadNotFound": "Tópico não encontrado!",
                "commentsUnavailable": "Comentários indisponíveis.",
                "loadCommentsError": "Erro ao carregar comentários.",
                "loadPostsError": "Erro ao carregar posts",
                "createError": "Erro ao criar",
                "updateError": "Erro ao atualizar"
            }
        };
    }

    // Obter tradução
    t(key, params = {}) {
        const keys = key.split('.');
        let value = this.translations;
        
        for (const k of keys) {
            if (value && value[k] !== undefined) {
                value = value[k];
            } else {
                console.warn(`Tradução não encontrada: ${key}`);
                return key;
            }
        }

        if (typeof value === 'string') {
            // Substituir parâmetros
            for (const [paramKey, paramValue] of Object.entries(params)) {
                value = value.replace(`{${paramKey}}`, paramValue);
            }
            return value;
        }

        return key;
    }

    // Mudar idioma
    async setLocale(locale) {
        if (locale === this.currentLocale) return true;
        if (!this.supportedLocales.includes(locale)) {
            console.warn(`Idioma não suportado: ${locale}`);
            return false;
        }

        const success = await this.loadLocale(locale);
        if (success) {
            this.updateUI();
            this.notifyObservers();
            return true;
        }
        return false;
    }

    // Atualizar UI com traduções
    updateUI() {
        // Atualizar elementos com data-i18n
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            const translation = this.t(key);
            if (translation) {
                // Verificar se é placeholder ou texto
                if (element.hasAttribute('placeholder')) {
                    element.placeholder = translation;
                } else {
                    element.textContent = translation;
                }
            }
        });

        // Atualizar title da página
        const title = this.t('meta.title');
        if (title) {
            document.title = title;
        }

        // Atualizar meta description
        const description = this.t('meta.description');
        if (description) {
            const metaDesc = document.querySelector('meta[name="description"]');
            if (metaDesc) metaDesc.content = description;
        }

        console.log(`🌐 UI atualizada para: ${this.currentLocale}`);
    }

    // Adicionar observador
    addObserver(callback) {
        this.observers.push(callback);
    }

    // Notificar observadores
    notifyObservers() {
        for (const callback of this.observers) {
            try {
                callback(this.currentLocale);
            } catch (error) {
                console.error('Erro no observador i18n:', error);
            }
        }
    }

    // Criar seletor de idioma
    setupLanguageSelector() {
        // Verificar se o seletor já existe
        if (document.getElementById('languageSelector')) return;

        const userInfo = document.querySelector('.user-info-header');
        if (!userInfo) return;

        // Criar seletor
        const selector = document.createElement('div');
        selector.className = 'language-selector';
        selector.id = 'languageSelector';
        selector.style.cssText = `
            display: inline-flex;
            align-items: center;
            gap: 4px;
            margin-right: 8px;
            position: relative;
        `;

        // Botão do seletor
        const button = document.createElement('button');
        button.className = 'lang-btn';
        button.style.cssText = `
            background: rgba(255,255,255,0.1);
            border: 1px solid rgba(255,255,255,0.2);
            color: white;
            padding: 4px 10px;
            border-radius: 20px;
            cursor: pointer;
            font-size: 0.7em;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            gap: 4px;
        `;
        button.innerHTML = `🌐 ${this.getLocaleLabel(this.currentLocale)}`;
        button.onclick = () => this.toggleLanguageDropdown();

        // Dropdown
        const dropdown = document.createElement('div');
        dropdown.className = 'lang-dropdown';
        dropdown.id = 'langDropdown';
        dropdown.style.cssText = `
            display: none;
            position: absolute;
            top: 100%;
            right: 0;
            background: #1a1a2e;
            border-radius: 8px;
            padding: 4px 0;
            box-shadow: 0 8px 30px rgba(0,0,0,0.3);
            z-index: 200;
            min-width: 150px;
            margin-top: 4px;
        `;

        // Opções de idioma
        const languages = [
            { code: 'pt-BR', label: '🇧🇷 Português' },
            { code: 'en-US', label: '🇺🇸 English' },
            { code: 'es-ES', label: '🇪🇸 Español' },
            { code: 'fr-FR', label: '🇫🇷 Français' }
        ];

        for (const lang of languages) {
            const option = document.createElement('div');
            option.className = 'lang-option';
            option.style.cssText = `
                padding: 8px 16px;
                color: white;
                cursor: pointer;
                font-size: 0.8em;
                transition: background 0.2s;
            `;
            option.textContent = lang.label;
            option.onclick = () => this.changeLanguage(lang.code);
            option.onmouseenter = () => option.style.background = 'rgba(255,255,255,0.1)';
            option.onmouseleave = () => option.style.background = 'transparent';
            if (lang.code === this.currentLocale) {
                option.style.background = 'rgba(233, 69, 96, 0.2)';
                option.style.fontWeight = '600';
            }
            dropdown.appendChild(option);
        }

        selector.appendChild(button);
        selector.appendChild(dropdown);
        userInfo.insertBefore(selector, userInfo.firstChild);

        // Fechar dropdown ao clicar fora
        document.addEventListener('click', (e) => {
            if (!selector.contains(e.target)) {
                dropdown.style.display = 'none';
            }
        });
    }

    getLocaleLabel(locale) {
        const labels = {
            'pt-BR': 'PT',
            'en-US': 'EN',
            'es-ES': 'ES',
            'fr-FR': 'FR'
        };
        return labels[locale] || locale;
    }

    toggleLanguageDropdown() {
        const dropdown = document.getElementById('langDropdown');
        if (dropdown) {
            dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
        }
    }

    async changeLanguage(locale) {
        const success = await this.setLocale(locale);
        if (success) {
            // Atualizar botão
            const btn = document.querySelector('.lang-btn');
            if (btn) {
                btn.innerHTML = `🌐 ${this.getLocaleLabel(locale)}`;
            }
            // Fechar dropdown
            const dropdown = document.getElementById('langDropdown');
            if (dropdown) {
                dropdown.style.display = 'none';
            }
            // Recarregar conteúdo
            if (window.handleRouting) {
                await window.handleRouting();
            }
        }
    }
}

// Criar instância global
const i18n = new I18n();

// ============================================
// FUNÇÕES DE TRADUÇÃO PARA USO GLOBAL
// ============================================

function __(key, params = {}) {
    return i18n.t(key, params);
}

// ============================================
// INICIALIZAÇÃO DO I18N
// ============================================

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', async () => {
    await i18n.init();
});

// Exportar para uso global
window.i18n = i18n;
window.__ = __;
window.changeLanguage = (locale) => i18n.changeLanguage(locale);
