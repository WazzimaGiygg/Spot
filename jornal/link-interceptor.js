// ============================================
// SISTEMA DE INTERCEPTAÇÃO DE LINKS EXTERNOS
// ============================================

/**
 * LinkInterceptor - Sistema completo para interceptar links externos
 * e redirecionar para a página de verificação de segurança
 */
const LinkInterceptor = {
    // URL da sua página de redirecionamento
    REDIRECT_PAGE: 'https://wazzimagiygg.com/rv/',
    
    // Domínios internos (não são interceptados)
    INTERNAL_DOMAINS: [
        'wazzimagiygg.com',
        'gspotfverwazzimagiygg.wazzimagiygg.com',
        'support.wazzimagiygg.com',
        'painel.wazzimagiygg.com',
        'wzzm-ce3fc.firebaseapp.com',
        'localhost'
    ],
    
    // Domínios confiáveis (redirecionamento direto, sem verificação)
    TRUSTED_DOMAINS: [
        'google.com',
        'youtube.com',
        'github.com',
        'wikipedia.org',
        'medium.com'
    ],
    
    // Configurações
    CONFIG: {
        // Tempo de expiração do token (segundos)
        TOKEN_EXPIRY: 300,
        // Se deve mostrar aviso antes de redirecionar
        SHOW_WARNING: true,
        // Se deve redirecionar automaticamente
        AUTO_REDIRECT: true,
        // Tempo de espera antes do redirecionamento automático (ms)
        REDIRECT_DELAY: 3000
    },
    
    /**
     * Inicializa o sistema
     */
    init() {
        console.log('🛡️ Inicializando LinkInterceptor...');
        
        // Verifica se a página atual é a de redirecionamento
        if (this.isRedirectPage()) {
            console.log('📋 Página de redirecionamento detectada. Aguardando processamento...');
            return;
        }
        
        // Intercepta cliques em links
        this.interceptClicks();
        
        // Processa links existentes
        this.processExistingLinks();
        
        // Configura observer para conteúdo dinâmico
        this.setupObserver();
        
        // Adiciona estilos para indicar links externos
        this.addStyles();
        
        console.log('✅ LinkInterceptor ativo!');
    },
    
    /**
     * Verifica se está na página de redirecionamento
     */
    isRedirectPage() {
        const path = window.location.pathname;
        return path.includes('/rv/') || path.includes('/redirect');
    },
    
    /**
     * Intercepta cliques em links
     */
    interceptClicks() {
        document.addEventListener('click', (event) => {
            const link = event.target.closest('a[href]');
            if (!link) return;
            
            const href = link.getAttribute('href');
            if (!href || this.shouldIgnoreLink(href)) return;
            
            // Verifica se é um link externo
            if (this.isExternalLink(href)) {
                event.preventDefault();
                event.stopPropagation();
                
                // Obtém o UID do usuário
                const uid = this.getUserUID();
                
                // Constrói a URL de redirecionamento
                const redirectUrl = this.buildRedirectUrl(href, uid);
                
                // Verifica se deve abrir em nova aba
                const shouldOpenNewTab = link.target === '_blank' || 
                                        link.getAttribute('rel') === 'noopener noreferrer';
                
                // Verifica se o destino é confiável
                if (this.isTrustedDomain(href)) {
                    // Para domínios confiáveis, redireciona diretamente
                    if (shouldOpenNewTab) {
                        window.open(href, '_blank');
                    } else {
                        window.location.href = href;
                    }
                    return;
                }
                
                // Mostra aviso (opcional)
                if (this.CONFIG.SHOW_WARNING) {
                    this.showRedirectWarning(href, () => {
                        this.executeRedirect(redirectUrl, shouldOpenNewTab);
                    });
                } else {
                    this.executeRedirect(redirectUrl, shouldOpenNewTab);
                }
            }
        }, true);
    },
    
    /**
     * Executa o redirecionamento
     */
    executeRedirect(url, openNewTab) {
        if (openNewTab) {
            window.open(url, '_blank');
        } else {
            window.location.href = url;
        }
    },
    
    /**
     * Verifica se o link deve ser ignorado
     */
    shouldIgnoreLink(href) {
        // Ignora links javascript
        if (href.startsWith('javascript:')) return true;
        
        // Ignora links de âncora
        if (href.startsWith('#')) return true;
        
        // Ignora links vazios
        if (!href || href.trim() === '') return true;
        
        // Ignora links que já são da página de redirecionamento
        if (href.includes('/rv/') || href.includes('/redirect')) return true;
        
        // Ignora links com atributo data-no-intercept
        const link = document.querySelector(`a[href="${href}"]`);
        if (link && link.dataset.noIntercept === 'true') return true;
        
        return false;
    },
    
    /**
     * Verifica se é um link externo
     */
    isExternalLink(href) {
        try {
            const url = new URL(href, window.location.origin);
            const hostname = url.hostname.toLowerCase();
            
            // Verifica se é domínio interno
            const isInternal = this.INTERNAL_DOMAINS.some(domain => {
                return hostname === domain || hostname.endsWith('.' + domain);
            });
            
            return !isInternal;
        } catch {
            // URL inválida, considera interno
            return false;
        }
    },
    
    /**
     * Verifica se o domínio é confiável
     */
    isTrustedDomain(href) {
        try {
            const url = new URL(href, window.location.origin);
            const hostname = url.hostname.toLowerCase();
            
            return this.TRUSTED_DOMAINS.some(domain => {
                return hostname === domain || hostname.endsWith('.' + domain);
            });
        } catch {
            return false;
        }
    },
    
    /**
     * Obtém o UID do usuário atual
     */
    getUserUID() {
        // Tenta obter do Firebase
        if (typeof firebase !== 'undefined' && firebase.auth) {
            const user = firebase.auth().currentUser;
            if (user && user.uid) {
                return user.uid;
            }
        }
        
        // Tenta obter do cookie
        const cookieUid = this.getCookie('wzzm_uid');
        if (cookieUid) return cookieUid;
        
        // Tenta obter do localStorage
        const localUid = localStorage.getItem('wzzm_user_uid');
        if (localUid) return localUid;
        
        // Gera um ID de visitante
        return this.getVisitorId();
    },
    
    /**
     * Obtém ou gera um ID de visitante
     */
    getVisitorId() {
        let visitorId = localStorage.getItem('wzzm_visitor_id');
        if (!visitorId) {
            visitorId = 'visitor_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('wzzm_visitor_id', visitorId);
            this.setCookie('wzzm_visitor_id', visitorId, 365);
        }
        return visitorId;
    },
    
    /**
     * Constrói a URL de redirecionamento para sua página
     */
    buildRedirectUrl(destination, uid) {
        // Codifica o destino
        const encodedDest = encodeURIComponent(destination);
        
        // Cria um token de segurança
        const timestamp = Date.now();
        const signature = this.generateSignature(destination, uid, timestamp);
        
        // Constrói a URL usando o formato da sua página
        // Sua página espera: ?uid=URL ou ?url=URL
        let url = this.REDIRECT_PAGE;
        url += `?uid=${encodedDest}`;
        url += `&url=${encodedDest}`;
        url += `&ts=${timestamp}`;
        url += `&sig=${encodeURIComponent(signature)}`;
        url += `&ref=${encodeURIComponent(window.location.href)}`;
        
        return url;
    },
    
    /**
     * Gera assinatura de segurança
     */
    generateSignature(destination, uid, timestamp) {
        const secret = 'wazzima_secret_key_2024_secure';
        const data = `${destination}|${uid}|${timestamp}|${secret}`;
        
        // Hash simples para compatibilidade
        let hash = 0;
        for (let i = 0; i < data.length; i++) {
            const char = data.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(16);
    },
    
    /**
     * Mostra aviso de redirecionamento
     */
    showRedirectWarning(destination, callback) {
        // Verifica se o usuário já confirmou redirecionamentos recentemente
        const lastRedirect = localStorage.getItem('wzzm_last_redirect_warning');
        if (lastRedirect && (Date.now() - parseInt(lastRedirect)) < 3600000) {
            callback();
            return;
        }
        
        // Cria o aviso
        const overlay = document.createElement('div');
        overlay.id = 'redirectWarningOverlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.85);
            z-index: 99999;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
            animation: fadeIn 0.3s ease;
        `;
        
        const box = document.createElement('div');
        box.style.cssText = `
            background: white;
            border-radius: 16px;
            padding: 30px 40px;
            max-width: 500px;
            width: 100%;
            text-align: center;
            animation: slideUp 0.3s ease;
            box-shadow: 0 20px 60px rgba(0,0,0,0.5);
        `;
        
        // Obtém o nome do domínio para exibição
        let domain = destination;
        try {
            const url = new URL(destination);
            domain = url.hostname;
        } catch {}
        
        box.innerHTML = `
            <div style="font-size: 48px; margin-bottom: 15px;">🔗</div>
            <h2 style="color: #1f2937; margin-bottom: 10px;">Você está saindo do WazzimaGiygg</h2>
            <p style="color: #6b7280; font-size: 14px; margin-bottom: 15px;">
                Você está sendo redirecionado para um site externo:
            </p>
            <div style="background: #f3f4f6; padding: 12px; border-radius: 8px; margin-bottom: 20px; word-break: break-all; font-size: 13px; color: #1f2937; font-family: monospace;">
                ${domain}
            </div>
            <p style="color: #9ca3af; font-size: 12px; margin-bottom: 20px;">
                ⚠️ O WazzimaGiygg não se responsabiliza pelo conteúdo de sites externos.
            </p>
            <div style="display: flex; gap: 10px; justify-content: center;">
                <button id="confirmRedirectBtn" style="
                    background: linear-gradient(135deg, #4f46e5, #7c3aed);
                    color: white;
                    border: none;
                    padding: 12px 30px;
                    border-radius: 10px;
                    font-weight: 600;
                    cursor: pointer;
                    font-size: 14px;
                    transition: all 0.3s;
                ">Continuar</button>
                <button id="cancelRedirectBtn" style="
                    background: #e5e7eb;
                    color: #374151;
                    border: none;
                    padding: 12px 30px;
                    border-radius: 10px;
                    font-weight: 600;
                    cursor: pointer;
                    font-size: 14px;
                    transition: all 0.3s;
                ">Cancelar</button>
            </div>
        `;
        
        overlay.appendChild(box);
        document.body.appendChild(overlay);
        
        // Adiciona estilos de animação se não existirem
        if (!document.getElementById('redirectWarningStyles')) {
            const styles = document.createElement('style');
            styles.id = 'redirectWarningStyles';
            styles.textContent = `
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideUp {
                    from { transform: translateY(30px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            `;
            document.head.appendChild(styles);
        }
        
        // Event listeners
        const confirmBtn = document.getElementById('confirmRedirectBtn');
        const cancelBtn = document.getElementById('cancelRedirectBtn');
        
        const cleanup = () => {
            if (overlay.parentNode) overlay.remove();
        };
        
        confirmBtn.addEventListener('click', () => {
            localStorage.setItem('wzzm_last_redirect_warning', Date.now().toString());
            cleanup();
            callback();
        });
        
        cancelBtn.addEventListener('click', cleanup);
        
        // Fecha ao clicar fora
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) cleanup();
        });
    },
    
    /**
     * Processa links existentes na página
     */
    processExistingLinks() {
        const links = document.querySelectorAll('a[href]');
        links.forEach(link => {
            const href = link.getAttribute('href');
            if (href && this.isExternalLink(href)) {
                // Marca links externos
                link.setAttribute('data-external', 'true');
                link.setAttribute('rel', 'noopener noreferrer');
                
                // Adiciona indicador visual
                if (!link.querySelector('.external-icon')) {
                    const icon = document.createElement('span');
                    icon.className = 'external-icon';
                    icon.textContent = ' ↗';
                    icon.style.cssText = 'font-size: 0.8em; color: #888;';
                    link.appendChild(icon);
                }
            }
        });
    },
    
    /**
     * Configura observer para conteúdo dinâmico
     */
    setupObserver() {
        const observer = new MutationObserver((mutations) => {
            let needsProcessing = false;
            
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) {
                        if (node.tagName === 'A' || node.querySelectorAll) {
                            needsProcessing = true;
                        }
                    }
                });
            });
            
            if (needsProcessing) {
                setTimeout(() => this.processExistingLinks(), 100);
            }
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    },
    
    /**
     * Adiciona estilos CSS
     */
    addStyles() {
        if (document.getElementById('linkInterceptorStyles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'linkInterceptorStyles';
        styles.textContent = `
            /* Indicador visual para links externos */
            a[data-external="true"] .external-icon {
                opacity: 0.5;
                transition: opacity 0.2s;
            }
            a[data-external="true"]:hover .external-icon {
                opacity: 1;
            }
            
            /* Tooltip para links externos */
            a[data-external="true"] {
                position: relative;
            }
            a[data-external="true"]:hover::after {
                content: "🔗 Site externo";
                position: absolute;
                bottom: calc(100% + 8px);
                left: 50%;
                transform: translateX(-50%);
                background: #1f2937;
                color: white;
                padding: 4px 12px;
                border-radius: 6px;
                font-size: 11px;
                white-space: nowrap;
                font-weight: 400;
                opacity: 0.9;
                pointer-events: none;
                z-index: 100;
            }
            
            /* Responsivo */
            @media (max-width: 600px) {
                #redirectWarningOverlay div {
                    padding: 20px !important;
                }
                #redirectWarningOverlay h2 {
                    font-size: 18px !important;
                }
                #redirectWarningOverlay button {
                    padding: 10px 20px !important;
                    font-size: 13px !important;
                    flex: 1;
                }
            }
        `;
        document.head.appendChild(styles);
    },
    
    /**
     * Utilitários de cookie
     */
    getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
        return null;
    },
    
    setCookie(name, value, days) {
        let expires = '';
        if (days) {
            const date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            expires = `; expires=${date.toUTCString()}`;
        }
        document.cookie = `${name}=${value}${expires}; path=/; samesite=lax`;
    }
};

// ============================================
// FUNÇÃO PARA CRIAR LINKS SEGUROS MANUALMENTE
// ============================================

/**
 * Cria um link de redirecionamento seguro
 * @param {string} url - URL de destino
 * @param {string} text - Texto do link
 * @param {object} options - Opções adicionais
 * @returns {HTMLAnchorElement} Elemento link
 */
function createSecureLink(url, text, options = {}) {
    const link = document.createElement('a');
    link.href = LinkInterceptor.buildRedirectUrl(url, LinkInterceptor.getUserUID());
    link.textContent = text || url;
    link.target = options.target || '_blank';
    link.rel = 'noopener noreferrer';
    
    if (options.className) {
        link.className = options.className;
    }
    
    if (options.icon) {
        const icon = document.createElement('span');
        icon.textContent = options.icon + ' ';
        link.prepend(icon);
    }
    
    return link;
}

/**
 * Converte um link normal para link seguro
 * @param {HTMLAnchorElement} link - Elemento link
 */
function secureLink(link) {
    const href = link.getAttribute('href');
    if (href && LinkInterceptor.isExternalLink(href)) {
        const uid = LinkInterceptor.getUserUID();
        const secureUrl = LinkInterceptor.buildRedirectUrl(href, uid);
        link.setAttribute('data-original-href', href);
        link.href = secureUrl;
        link.setAttribute('data-secure', 'true');
    }
}

// ============================================
// INICIALIZAÇÃO AUTOMÁTICA
// ============================================

// Inicializa quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    // Aguarda o Firebase carregar
    setTimeout(() => {
        LinkInterceptor.init();
    }, 500);
});

// Também inicializa quando o Firebase estiver pronto
if (typeof firebase !== 'undefined' && firebase.auth) {
    firebase.auth().onAuthStateChanged((user) => {
        if (user && user.uid) {
            document.cookie = `wzzm_uid=${user.uid}; path=/; max-age=86400; samesite=lax`;
            localStorage.setItem('wzzm_user_uid', user.uid);
        }
    });
}

// ============================================
// EXPORTA FUNÇÕES GLOBAIS
// ============================================

window.LinkInterceptor = LinkInterceptor;
window.createSecureLink = createSecureLink;
window.secureLink = secureLink;

console.log('🔗 LinkInterceptor carregado!');
console.log('📋 Página de redirecionamento:', LinkInterceptor.REDIRECT_PAGE);
