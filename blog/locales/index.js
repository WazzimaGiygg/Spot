// ============================================
// GERENCIADOR DE TRADUÇÕES (i18n)
// ============================================
import { ptBR } from './pt-BR.js';
import { enUS } from './en-US.js';
import { esES } from './es-ES.js';
import { frFR } from './fr-FR.js';
import { deDE } from './de-DE.js';

// Dicionário de idiomas disponíveis
export const LOCALES = {
    'pt-BR': ptBR,
    'en-US': enUS,
    'es-ES': esES,
    'fr-FR': frFR,
    'de-DE': deDE
};

// Lista de idiomas para o seletor
export const LANGUAGE_LIST = [
    { code: 'pt-BR', name: 'Português (Brasil)', flag: '🇧🇷' },
    { code: 'en-US', name: 'English (US)', flag: '🇺🇸' },
    { code: 'es-ES', name: 'Español', flag: '🇪🇸' },
    { code: 'fr-FR', name: 'Français', flag: '🇫🇷' },
    { code: 'de-DE', name: 'Deutsch', flag: '🇩🇪' }
];

// Idioma padrão
const DEFAULT_LOCALE = 'pt-BR';

// Chave para localStorage
const STORAGE_KEY = 'blog_user_locale';

// Idioma atual
let currentLocale = DEFAULT_LOCALE;
let currentTranslations = ptBR;

/**
 * Inicializa o sistema de traduções
 */
export function initI18n() {
    // Tenta carregar o idioma salvo
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && LOCALES[saved]) {
        currentLocale = saved;
        currentTranslations = LOCALES[saved];
    } else {
        // Tenta detectar o idioma do navegador
        const browserLang = navigator.language || navigator.languages?.[0] || DEFAULT_LOCALE;
        // Pega apenas o código base (ex: 'pt-BR' -> 'pt-BR')
        const langCode = Object.keys(LOCALES).find(key => key === browserLang) || 
                         Object.keys(LOCALES).find(key => key.startsWith(browserLang.split('-')[0])) || 
                         DEFAULT_LOCALE;
        currentLocale = langCode;
        currentTranslations = LOCALES[langCode];
        localStorage.setItem(STORAGE_KEY, langCode);
    }
    
    // Atualiza o HTML
    document.documentElement.lang = currentLocale;
    
    // Adiciona o seletor de idioma
    injectLanguageSelector();
    
    // Aplica as traduções iniciais
    applyTranslations();
    
    console.log(`🌍 Idioma carregado: ${currentLocale} (${currentTranslations.name})`);
}

/**
 * Obtém uma tradução pelo caminho (ex: 'nav.inicio')
 */
export function t(path) {
    const keys = path.split('.');
    let value = currentTranslations;
    
    for (const key of keys) {
        if (value && typeof value === 'object' && key in value) {
            value = value[key];
        } else {
            // Fallback: tenta no inglês ou retorna o path
            const fallback = getFallbackTranslation(path);
            return fallback || path;
        }
    }
    
    return typeof value === 'string' ? value : path;
}

/**
 * Fallback para tradução em inglês
 */
function getFallbackTranslation(path) {
    const keys = path.split('.');
    let value = enUS;
    
    for (const key of keys) {
        if (value && typeof value === 'object' && key in value) {
            value = value[key];
        } else {
            return null;
        }
    }
    
    return typeof value === 'string' ? value : null;
}

/**
 * Altera o idioma atual
 */
export function setLocale(localeCode) {
    if (!LOCALES[localeCode]) return false;
    
    currentLocale = localeCode;
    currentTranslations = LOCALES[localeCode];
    localStorage.setItem(STORAGE_KEY, localeCode);
    document.documentElement.lang = localeCode;
    
    // Atualiza o seletor
    updateLanguageSelector();
    
    // Aplica as traduções
    applyTranslations();
    
    // Recarrega a página ou atualiza o conteúdo
    if (window.renderBlog) {
        window.renderBlog();
    }
    
    console.log(`🌍 Idioma alterado: ${localeCode}`);
    return true;
}

/**
 * Aplica as traduções aos elementos com data-i18n
 */
function applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        const translation = t(key);
        if (translation && translation !== key) {
            el.textContent = translation;
        }
    });
    
    document.querySelectorAll('[data-i18n-html]').forEach(el => {
        const key = el.getAttribute('data-i18n-html');
        const translation = t(key);
        if (translation && translation !== key) {
            el.innerHTML = translation;
        }
    });
    
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        const translation = t(key);
        if (translation && translation !== key) {
            el.placeholder = translation;
        }
    });
    
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
        const key = el.getAttribute('data-i18n-title');
        const translation = t(key);
        if (translation && translation !== key) {
            el.title = translation;
        }
    });
}

/**
 * Injeta o seletor de idioma no header
 */
function injectLanguageSelector() {
    const userInfo = document.querySelector('.user-info-header');
    if (!userInfo) return;
    
    // Remove se já existir
    const existing = document.getElementById('languageSelector');
    if (existing) existing.remove();
    
    // Cria o seletor
    const selector = document.createElement('div');
    selector.id = 'languageSelector';
    selector.className = 'language-selector';
    selector.innerHTML = `
        <button class="lang-btn" onclick="toggleLanguageDropdown(event)">
            <span class="lang-flag">${currentTranslations.flag}</span>
            <span class="lang-code">${currentLocale.split('-')[0]}</span>
            <span class="lang-arrow">▾</span>
        </button>
        <div class="lang-dropdown" id="langDropdown">
            ${LANGUAGE_LIST.map(lang => `
                <button class="lang-option ${lang.code === currentLocale ? 'active' : ''}" 
                        data-lang="${lang.code}"
                        onclick="window.setLocale('${lang.code}')">
                    <span class="lang-flag">${lang.flag}</span>
                    <span class="lang-name">${lang.name}</span>
                </button>
            `).join('')}
        </div>
    `;
    
    // Insere antes do botão de login
    const loginBtn = document.getElementById('btnLogin');
    if (loginBtn) {
        userInfo.insertBefore(selector, loginBtn);
    } else {
        userInfo.appendChild(selector);
    }
    
    // Adiciona o CSS
    injectLanguageStyles();
}

/**
 * Injeta os estilos do seletor de idioma
 */
function injectLanguageStyles() {
    const styleId = 'language-selector-styles';
    if (document.getElementById(styleId)) return;
    
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
        .language-selector {
            position: relative;
            display: inline-block;
        }
        
        .lang-btn {
            background: rgba(255,255,255,0.1);
            border: 1px solid rgba(255,255,255,0.2);
            color: white;
            padding: 4px 12px;
            border-radius: 20px;
            cursor: pointer;
            font-size: 0.75em;
            display: flex;
            align-items: center;
            gap: 6px;
            transition: all 0.2s;
        }
        
        .lang-btn:hover {
            background: rgba(255,255,255,0.2);
        }
        
        .lang-btn .lang-arrow {
            font-size: 0.6em;
            transition: transform 0.3s;
        }
        
        .lang-btn.open .lang-arrow {
            transform: rotate(180deg);
        }
        
        .lang-dropdown {
            display: none;
            position: absolute;
            top: calc(100% + 8px);
            right: 0;
            min-width: 180px;
            background: #1a1a2e;
            border: 1px solid #333;
            border-radius: 12px;
            padding: 6px 0;
            z-index: 200;
            box-shadow: 0 8px 30px rgba(0,0,0,0.4);
        }
        
        .lang-dropdown.show {
            display: block;
        }
        
        .lang-option {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 8px 16px;
            width: 100%;
            border: none;
            background: transparent;
            color: #ccc;
            cursor: pointer;
            font-size: 0.85em;
            transition: all 0.2s;
            font-family: 'Lato', sans-serif;
        }
        
        .lang-option:hover {
            background: rgba(255,255,255,0.05);
            color: white;
        }
        
        .lang-option.active {
            background: rgba(74, 158, 255, 0.15);
            color: #4a9eff;
        }
        
        .lang-option .lang-flag {
            font-size: 1.1em;
        }
        
        .lang-option .lang-name {
            white-space: nowrap;
        }
        
        .lang-option .lang-code {
            font-size: 0.7em;
            opacity: 0.5;
            margin-left: auto;
        }
        
        .lang-code {
            font-weight: 500;
        }
        
        .lang-flag {
            font-size: 1em;
        }
        
        @media (max-width: 768px) {
            .lang-btn .lang-code {
                display: none;
            }
            .lang-dropdown {
                right: -10px;
                min-width: 160px;
            }
        }
        
        @media (max-width: 480px) {
            .lang-btn .lang-code,
            .lang-btn .lang-arrow {
                display: none;
            }
            .lang-dropdown {
                right: -20px;
                min-width: 140px;
            }
            .lang-option .lang-name {
                font-size: 0.8em;
            }
        }
    `;
    document.head.appendChild(style);
}

/**
 * Atualiza o seletor de idioma
 */
function updateLanguageSelector() {
    const btn = document.querySelector('.lang-btn');
    if (btn) {
        btn.innerHTML = `
            <span class="lang-flag">${currentTranslations.flag}</span>
            <span class="lang-code">${currentLocale.split('-')[0]}</span>
            <span class="lang-arrow">▾</span>
        `;
    }
    
    document.querySelectorAll('.lang-option').forEach(opt => {
        opt.classList.toggle('active', opt.dataset.lang === currentLocale);
    });
}

/**
 * Alterna o dropdown de idiomas
 */
function toggleLanguageDropdown(event) {
    if (event) event.stopPropagation();
    const dropdown = document.getElementById('langDropdown');
    const btn = document.querySelector('.lang-btn');
    if (dropdown && btn) {
        dropdown.classList.toggle('show');
        btn.classList.toggle('open');
    }
}

/**
 * Fecha o dropdown ao clicar fora
 */
document.addEventListener('click', function(e) {
    if (!e.target.closest('.language-selector')) {
        const dropdown = document.getElementById('langDropdown');
        const btn = document.querySelector('.lang-btn');
        if (dropdown) dropdown.classList.remove('show');
        if (btn) btn.classList.remove('open');
    }
});

// Exporta para uso global
window.t = t;
window.setLocale = setLocale;
window.toggleLanguageDropdown = toggleLanguageDropdown;
window.LOCALES = LOCALES;
window.LANGUAGE_LIST = LANGUAGE_LIST;
window.currentLocale = () => currentLocale;
window.currentTranslations = () => currentTranslations;

console.log('🌍 Sistema de internacionalização carregado!');
