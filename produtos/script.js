// ============================================
// COOKIE CONSENT MANAGER
// ============================================
const CookieManager = {
    STORAGE_KEY: 'produtos_cookie_consent',
    
    defaults: {
        essential: true,
        analytics: true,
        advertising: true
    },
    
    init() {
        const consent = this.getConsent();
        if (!consent) {
            this.showBanner();
        } else {
            this.applyConsent(consent);
            this.hideBanner();
        }
        this.setupEventListeners();
    },
    
    setupEventListeners() {
        document.getElementById('cookieAcceptAll')?.addEventListener('click', () => this.acceptAll());
        document.getElementById('cookieRejectAll')?.addEventListener('click', () => this.rejectAll());
        document.getElementById('cookieCustomize')?.addEventListener('click', () => this.customize());
    },
    
    getConsent() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            return data ? JSON.parse(data) : null;
        } catch { return null; }
    },
    
    saveConsent(preferences) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify({
            ...preferences,
            timestamp: new Date().toISOString()
        }));
    },
    
    showBanner() {
        const banner = document.getElementById('cookieConsent');
        if (banner) setTimeout(() => banner.classList.add('show'), 100);
    },
    
    hideBanner() {
        const banner = document.getElementById('cookieConsent');
        if (banner) banner.classList.remove('show');
    },
    
    applyConsent(consent) {
        if (consent.analytics !== false) {
            this.enableAnalytics();
        } else {
            this.disableAnalytics();
        }
        if (consent.advertising !== false) {
            this.enablePersonalizedAds();
        } else {
            this.disablePersonalizedAds();
        }
        console.log('🍪 Preferências de cookies aplicadas:', consent);
    },
    
    enableAnalytics() {
        if (window.ga) window.ga('set', 'allowAdFeatures', true);
        console.log('📊 Analytics habilitado');
    },
    
    disableAnalytics() {
        if (window.ga) window.ga('set', 'allowAdFeatures', false);
        window['ga-disable-UA-XXXXXXXX-X'] = true;
        console.log('📊 Analytics desabilitado');
    },
    
    enablePersonalizedAds() {
        document.cookie = "ad_personalization=enabled; path=/; max-age=31536000; samesite=lax";
        console.log('📢 Anúncios personalizados habilitados');
    },
    
    disablePersonalizedAds() {
        document.cookie = "ad_personalization=disabled; path=/; max-age=31536000; samesite=lax";
        console.log('📢 Anúncios personalizados desabilitados');
    },
    
    acceptAll() {
        const consent = { essential: true, analytics: true, advertising: true };
        this.saveConsent(consent);
        this.applyConsent(consent);
        this.hideBanner();
        this.showToast('✅ Todos os cookies foram aceitos!');
    },
    
    rejectAll() {
        const consent = { essential: true, analytics: false, advertising: false };
        this.saveConsent(consent);
        this.applyConsent(consent);
        this.hideBanner();
        this.showToast('ℹ️ Cookies não essenciais foram recusados.');
    },
    
    customize() {
        const analytics = document.getElementById('cookieAnalytics')?.checked !== false;
        const advertising = document.getElementById('cookieAdvertising')?.checked !== false;
        const consent = { essential: true, analytics, advertising };
        this.saveConsent(consent);
        this.applyConsent(consent);
        this.hideBanner();
        this.showToast('✅ Suas preferências foram salvas!');
    },
    
    showToast(message, type = 'info') {
        // Criar toast se não existir
        let toast = document.getElementById('toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'toast';
            toast.style.cssText = `
                position: fixed;
                bottom: 30px;
                left: 50%;
                transform: translateX(-50%);
                background: #1a1a2e;
                color: white;
                padding: 12px 24px;
                border-radius: 12px;
                z-index: 9999;
                opacity: 0;
                transition: opacity 0.3s, transform 0.3s;
                pointer-events: none;
                box-shadow: 0 4px 16px rgba(0,0,0,0.3);
                font-family: 'Inter', sans-serif;
                font-size: 0.9rem;
                max-width: 90%;
                text-align: center;
            `;
            document.body.appendChild(toast);
        }
        
        toast.textContent = message;
        toast.style.background = type === 'error' ? '#c0392b' : 
                                type === 'success' ? '#27ae60' : '#1a1a2e';
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(-50%) translateY(0)';
        
        clearTimeout(toast._timeout);
        toast._timeout = setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(-50%) translateY(20px)';
        }, 3000);
    },
    
    isAllowed(cookieType) {
        const consent = this.getConsent();
        if (!consent) return true;
        return consent[cookieType] !== false;
    }
};

// ============================================
// FUNÇÕES DO PRODUTO
// ============================================
function openProduct(url) {
    window.open(url, '_blank');
}

// ============================================
// CARREGAMENTO DO RODAPÉ
// ============================================
(function carregarRodape() {
    const rodapeContainer = document.getElementById('rodape-container');
    if (!rodapeContainer) return;
    
    rodapeContainer.innerHTML = '<div style="text-align:center; padding:40px; color:#666;">Carregando rodapé...</div>';
    
    fetch('https://gspotfverwazzimagiygg.wazzimagiygg.com/footer.html')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            return response.text();
        })
        .then(html => {
            rodapeContainer.innerHTML = html;
        })
        .catch(error => {
            console.error('Erro ao carregar rodapé:', error);
            rodapeContainer.innerHTML = `
                <div class="footer">
                    <div class="footer-links">
                        <a href="https://wazzimagiygg.com/donate/">💝 Faça sua doação!</a>
                        <span class="footer-divider">|</span>
                        <a href="https://wazzimagiygg.com/desktop.html" target="_blank">🖥️ Acessar Desktop</a>
                        <span class="footer-divider">|</span>
                        <a href="https://wazzimagiygg.com/LGPD">🔒 LGPD</a>
                        <span class="footer-divider">|</span>
                        <a href="https://wazzimagiygg.com/MarcoCivil">📜 Marco Civil</a>
                        <span class="footer-divider">|</span>
                        <a href="https://wazzimagiygg.com/relatorio-wikipedia.html" target="_blank" style="color:#ffb347;">📄 Relatório Wikipédia</a>
                        <span class="footer-divider">|</span>
                        <a href="https://support.wazzimagiygg.com/" target="_blank" class="footer-ticket">🎫 Contato por Ticket</a>
                        <span class="footer-divider">|</span>
                        <a href="https://wazzimagiygg.com/produtos" target="_blank" style="color:#ffb347;">🛍️ Produtos WazzimaGiygg</a>
                    </div>
                    <div class="copyright">
                        <p>© 2026 WazzimaGiygg - Conhecimento Livre para Todos</p>
                        <p style="margin-top: 10px;">📄 Conteúdo sob licença Creative Commons | 🔒 Protegido pela LGPD</p>
                    </div>
                </div>
            `;
        });
})();

// ============================================
// INICIALIZAÇÃO
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    CookieManager.init();
});

console.log('📦 Produtos WazzimaGiygg inicializado com sucesso!');
console.log('🍪 Sistema de consentimento de cookies ativo');
