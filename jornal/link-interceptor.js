// ============================================
// LINK INTERCEPTOR - WAZZIMAGIYGG
// ============================================
// Este script intercepta links externos e os redireciona
// através do sistema de verificação de segurança.
// ============================================

const LinkInterceptor = {
    // URL de redirecionamento
    REDIRECT_PAGE: 'https://wazzimagiygg.com/rv/',
    
    // Cookie para armazenar o UID do usuário
    UID_COOKIE_NAME: 'wzzm_uid',
    
    // Chave para localStorage
    UID_STORAGE_KEY: 'wzzm_user_uid',
    
    // Domínios permitidos (não são interceptados)
    ALLOWED_DOMAINS: [
        'wazzimagiygg.com',
        'gspotfverwazzimagiygg.wazzimagiygg.com',
        'support.wazzimagiygg.com',
        'painel.wazzimagiygg.com',
        'localhost'
    ],
    
    // URLs que não devem ser interceptadas (exceções)
    EXCLUDED_PATHS: [
        '/rv/',
        '/LGPD',
        '/MarcoCivil',
        '/donate/',
        '/produtos/',
        '/desktop.html'
    ],
    
    // Inicializa o interceptor
    init() {
        console.log('🔗 LinkInterceptor inicializado');
        this.processExistingLinks();
        this.setupClickListeners();
        this.setupMutationObserver();
    },
    
    // Obtém o UID do usuário atual
    getUserUID() {
        // Tenta obter do cookie
        const cookieValue = this.getCookie(this.UID_COOKIE_NAME);
        if (cookieValue) return cookieValue;
        
        // Tenta obter do localStorage
        const storageValue = localStorage.getItem(this.UID_STORAGE_KEY);
        if (storageValue) return storageValue;
        
        // Tenta obter do Firebase Auth
        if (typeof firebase !== 'undefined' && firebase.auth) {
            const user = firebase.auth().currentUser;
            if (user && user.uid) {
                this.setUserUID(user.uid);
                return user.uid;
            }
        }
        
        // Gera um ID temporário
        const tempId = 'temp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
        this.setUserUID(tempId);
        return tempId;
    },
    
    // Define o UID do usuário
    setUserUID(uid) {
        // Salva no cookie
        this.setCookie(this.UID_COOKIE_NAME, uid, 7);
        // Salva no localStorage
        localStorage.setItem(this.UID_STORAGE_KEY, uid);
    },
    
    // Constrói URL de redirecionamento
    buildRedirectUrl(originalUrl, uid) {
        const redirectUrl = new URL(this.REDIRECT_PAGE);
        redirectUrl.searchParams.set('url', originalUrl);
        redirectUrl.searchParams.set('uid', uid || this.getUserUID());
        redirectUrl.searchParams.set('ref', window.location.href);
        return redirectUrl.toString();
    },
    
    // Verifica se um link deve ser interceptado
    shouldInterceptLink(href) {
        if (!href) return false;
        if (href.startsWith('#') || href.startsWith('javascript:')) return false;
        if (href.startsWith('mailto:') || href.startsWith('tel:')) return false;
        
        try {
            const url = new URL(href, window.location.origin);
            
            // Verifica se é um domínio permitido
            const isAllowed = this.ALLOWED_DOMAINS.some(domain => 
                url.hostname === domain || url.hostname.endsWith('.' + domain)
            );
            
            if (isAllowed) return false;
            
            // Verifica se é uma exceção
            const isExcluded = this.EXCLUDED_PATHS.some(path => 
                url.pathname.startsWith(path)
            );
            
            if (isExcluded) return false;
            
            // Verifica se é HTTP/HTTPS
            if (!['http:', 'https:'].includes(url.protocol)) return false;
            
            return true;
        } catch {
            // URL inválida, não intercepta
            return false;
        }
    },
    
    // Processa links existentes na página
    processExistingLinks(container = document) {
        const links = container.querySelectorAll('a[href]');
        let processed = 0;
        
        links.forEach(link => {
            const href = link.getAttribute('href');
            if (!href) return;
            
            // Ignora links que já foram processados
            if (link.dataset.intercepted === 'true') return;
            
            // Verifica se deve interceptar
            if (this.shouldInterceptLink(href)) {
                // Substitui o href pelo link seguro
                const uid = this.getUserUID();
                const secureUrl = this.buildRedirectUrl(href, uid);
                link.setAttribute('href', secureUrl);
                link.dataset.intercepted = 'true';
                link.dataset.originalUrl = href;
                processed++;
            } else {
                link.dataset.intercepted = 'false';
            }
        });
        
        if (processed > 0) {
            console.log(`🔗 ${processed} links foram interceptados com segurança`);
        }
        
        return processed;
    },
    
    // Configura listeners de clique para interceptar links dinâmicos
    setupClickListeners() {
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a[href]');
            if (!link) return;
            
            const href = link.getAttribute('href');
            if (!href) return;
            
            // Se já foi processado, não faz nada
            if (link.dataset.intercepted === 'true') return;
            
            // Verifica se deve interceptar
            if (this.shouldInterceptLink(href)) {
                e.preventDefault();
                const uid = this.getUserUID();
                const secureUrl = this.buildRedirectUrl(href, uid);
                
                // Verifica se deve abrir em nova aba
                if (link.target === '_blank' || e.ctrlKey || e.metaKey) {
                    window.open(secureUrl, '_blank');
                } else {
                    window.location.href = secureUrl;
                }
            }
        }, true); // Usa captura para interceptar antes de outros listeners
    },
    
    // Observa mudanças no DOM para processar novos links
    setupMutationObserver() {
        if (typeof MutationObserver === 'undefined') return;
        
        const observer = new MutationObserver((mutations) => {
            let hasNewLinks = false;
            
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        // Verifica se o nó ou seus descendentes contêm links
                        if (node.tagName === 'A' && node.hasAttribute('href')) {
                            hasNewLinks = true;
                        } else if (node.querySelectorAll) {
                            const links = node.querySelectorAll('a[href]');
                            if (links.length > 0) hasNewLinks = true;
                        }
                    }
                });
            });
            
            if (hasNewLinks) {
                setTimeout(() => {
                    this.processExistingLinks(document);
                }, 100);
            }
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    },
    
    // Funções auxiliares para cookies
    getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) {
            return parts.pop().split(';').shift();
        }
        return null;
    },
    
    setCookie(name, value, days = 7) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        document.cookie = `${name}=${value}; expires=${date.toUTCString()}; path=/; samesite=lax`;
    },
    
    // Remove um cookie
    deleteCookie(name) {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    },
    
    // Força a atualização de todos os links na página
    refreshLinks() {
        // Limpa os dados de interceptação
        document.querySelectorAll('a[data-intercepted="true"]').forEach(link => {
            const originalUrl = link.dataset.originalUrl;
            if (originalUrl) {
                link.setAttribute('href', originalUrl);
            }
            delete link.dataset.intercepted;
            delete link.dataset.originalUrl;
        });
        
        // Reprocessa
        return this.processExistingLinks();
    },
    
    // Adiciona um domínio à lista de permitidos
    addAllowedDomain(domain) {
        if (domain && !this.ALLOWED_DOMAINS.includes(domain)) {
            this.ALLOWED_DOMAINS.push(domain);
            console.log(`✅ Domínio "${domain}" adicionado à lista de permitidos`);
        }
    },
    
    // Adiciona um caminho à lista de exclusões
    addExcludedPath(path) {
        if (path && !this.EXCLUDED_PATHS.includes(path)) {
            this.EXCLUDED_PATHS.push(path);
            console.log(`✅ Caminho "${path}" adicionado à lista de exclusões`);
        }
    },
    
    // Verifica se um link é externo (apenas para debug)
    isExternalLink(href) {
        try {
            const url = new URL(href, window.location.origin);
            return !this.ALLOWED_DOMAINS.some(domain => 
                url.hostname === domain || url.hostname.endsWith('.' + domain)
            );
        } catch {
            return false;
        }
    },
    
    // Gera relatório de links na página (debug)
    generateLinkReport() {
        const links = document.querySelectorAll('a[href]');
        const report = {
            total: links.length,
            intercepted: 0,
            external: 0,
            internal: 0,
            details: []
        };
        
        links.forEach(link => {
            const href = link.getAttribute('href');
            if (!href) return;
            
            const isIntercepted = link.dataset.intercepted === 'true';
            const isExternal = this.isExternalLink(href);
            
            if (isIntercepted) report.intercepted++;
            if (isExternal) report.external++;
            else report.internal++;
            
            report.details.push({
                href: href,
                isIntercepted: isIntercepted,
                isExternal: isExternal,
                text: link.textContent.trim() || '[link]'
            });
        });
        
        console.log('📊 Relatório de Links:', report);
        return report;
    }
};

// Inicializa automaticamente quando o DOM estiver pronto
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(() => {
        LinkInterceptor.init();
    }, 500);
} else {
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(() => {
            LinkInterceptor.init();
        }, 500);
    });
}

// Escuta mudanças de idioma para reprocessar links
document.addEventListener('languageChanged', function() {
    setTimeout(() => {
        LinkInterceptor.refreshLinks();
    }, 300);
});

// Exporta para uso global
window.LinkInterceptor = LinkInterceptor;

console.log('🔗 LinkInterceptor carregado e pronto para uso');
