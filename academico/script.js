// ============================================
// COOKIE CONSENT MANAGER
// ============================================
const CookieManager = {
    STORAGE_KEY: 'academico_cookie_consent',
    
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
        const toast = document.getElementById('toast');
        if (toast) {
            toast.textContent = message;
            toast.style.background = type === 'error' ? '#c0392b' : 
                                    type === 'success' ? '#27ae60' : '#2980b9';
            toast.style.display = 'block';
            setTimeout(() => toast.style.display = 'none', 3000);
        } else {
            alert(message);
        }
    },
    
    isAllowed(cookieType) {
        const consent = this.getConsent();
        if (!consent) return true;
        return consent[cookieType] !== false;
    }
};

// ============================================
// CONFIGURAÇÃO FIREBASE
// ============================================
const firebaseConfig = {
    apiKey: "AIzaSyB9GkSqTIZ0kbVsba_WOdQeVAETrF9qna0",
    authDomain: "wzzm-ce3fc.firebaseapp.com",
    projectId: "wzzm-ce3fc",
    storageBucket: "wzzm-ce3fc.appspot.com",
    messagingSenderId: "249427877153",
    appId: "1:249427877153:web:0e4297294794a5aadeb260"
};

let app, auth, db;
try {
    app = firebase.app();
    auth = firebase.auth();
    db = firebase.firestore();
} catch (e) {
    app = firebase.initializeApp(firebaseConfig);
    auth = firebase.auth();
    db = firebase.firestore();
}

// ============================================
// VARIÁVEIS GLOBAIS
// ============================================
let currentUser = null;
let isAdmin = false;
let isBanned = false;
let allArticles = [];
let filteredArticles = [];
let currentPage = 1;
const itemsPerPage = 10;
let notifications = [];
let unreadCount = 0;
let notificationListener = null;

// UIDs de administradores
const ADMIN_UIDS = ['sZxfMuOBPbXdR8nttVPXIN8QOOl1', '6aPqWVh8JVYL5NqEb78iDGPD7dH3'];

// ============================================
// FUNÇÕES DE UTILIDADE
// ============================================
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function stripHtml(html) {
    const temp = document.createElement('div');
    temp.innerHTML = html;
    return temp.textContent || temp.innerText || '';
}

function getInitials(name) {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length-1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
}

function safeToDate(dateValue) {
    if (!dateValue) return null;
    if (dateValue instanceof Date && !isNaN(dateValue)) return dateValue;
    if (dateValue.toDate && typeof dateValue.toDate === 'function') return dateValue.toDate();
    if (dateValue.seconds && typeof dateValue.seconds === 'number') return new Date(dateValue.seconds * 1000);
    if (typeof dateValue === 'string') {
        const date = new Date(dateValue);
        if (!isNaN(date)) return date;
    }
    if (typeof dateValue === 'number') {
        const date = new Date(dateValue);
        if (!isNaN(date)) return date;
    }
    return null;
}

function formatDate(date) {
    if (!date) return 'Data desconhecida';
    const validDate = safeToDate(date);
    if (!validDate) return 'Data inválida';
    return validDate.toLocaleDateString('pt-BR');
}

function getSafeYear(date) {
    const validDate = safeToDate(date);
    if (!validDate) return new Date().getFullYear();
    return validDate.getFullYear();
}

function getTimeAgo(date) {
    if (!date) return '';
    const validDate = safeToDate(date);
    if (!validDate) return '';
    const seconds = Math.floor((new Date() - validDate) / 1000);
    if (seconds < 60) return 'agora';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
}

function getTypeLabel(type) {
    const types = {
        'cientifico': 'Artigo Científico',
        'revisao': 'Revisão Bibliográfica',
        'noticia': 'Notícia',
        'editorial': 'Editorial',
        'opiniao': 'Opinião',
        'entrevista': 'Entrevista',
        'tutorial': 'Tutorial',
        'monografia': 'Monografia',
        'dissertacao': 'Dissertação',
        'tese': 'Tese'
    };
    return types[type] || type;
}

// ============================================
// NOTIFICAÇÕES
// ============================================
async function loadNotifications() {
    if (!currentUser) return;
    try {
        const snapshot = await db.collection('notifications')
            .where('userId', '==', currentUser.uid)
            .orderBy('timestamp', 'desc')
            .limit(50)
            .get();
        notifications = [];
        snapshot.forEach(doc => {
            notifications.push({ 
                id: doc.id, 
                ...doc.data(),
                timestamp: doc.data().timestamp || new Date()
            });
        });
        unreadCount = notifications.filter(n => !n.lida).length;
        updateNotificationBadge();
        renderNotifications();
    } catch (error) {
        console.error('Erro ao carregar notificações:', error);
    }
}

function updateNotificationBadge() {
    const badge = document.getElementById('notifBadge');
    if (unreadCount > 0) {
        badge.style.display = 'flex';
        badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
    } else {
        badge.style.display = 'none';
    }
}

function renderNotifications() {
    const list = document.getElementById('notificationList');
    if (!list) return;
    if (notifications.length === 0) {
        list.innerHTML = `<div class="notification-empty"><span class="material-icons">notifications_off</span><p>Nenhuma notificação</p></div>`;
        return;
    }
    list.innerHTML = notifications.slice(0, 10).map(notif => `
        <div class="notification-item ${notif.lida ? '' : 'unread'}" onclick="markAsRead('${notif.id}')">
            <div class="notif-title">${escapeHtml(notif.titulo || 'Notificação')}</div>
            <div class="notif-message">${escapeHtml(notif.mensagem || '')}</div>
            <div class="notif-time">${getTimeAgo(notif.timestamp)}</div>
        </div>
    `).join('');
}

async function markAsRead(id) {
    if (!id) return;
    try {
        await db.collection('notifications').doc(id).update({ lida: true });
        const notif = notifications.find(n => n.id === id);
        if (notif && !notif.lida) { notif.lida = true; unreadCount--; updateNotificationBadge(); renderNotifications(); }
    } catch (error) { console.error('Erro:', error); }
}

async function markAllAsRead(event) {
    if (event) event.stopPropagation();
    if (unreadCount === 0) return;
    try {
        const batch = db.batch();
        notifications.filter(n => !n.lida).forEach(n => batch.update(db.collection('notifications').doc(n.id), { lida: true }));
        await batch.commit();
        notifications.forEach(n => n.lida = true);
        unreadCount = 0;
        updateNotificationBadge();
        renderNotifications();
    } catch (error) { console.error('Erro:', error); }
}

function toggleNotifications(event) {
    if (event) event.stopPropagation();
    const dropdown = document.getElementById('notifDropdown');
    if (dropdown) {
        dropdown.classList.toggle('show');
        if (dropdown.classList.contains('show')) loadNotifications();
    }
}

document.addEventListener('click', function(e) {
    if (!e.target.closest('.notification-bell')) {
        const dropdown = document.getElementById('notifDropdown');
        if (dropdown) dropdown.classList.remove('show');
    }
});

function listenNotifications() {
    if (notificationListener) { notificationListener(); notificationListener = null; }
    if (!currentUser) return;
    notificationListener = db.collection('notifications')
        .where('userId', '==', currentUser.uid)
        .orderBy('timestamp', 'desc')
        .limit(50)
        .onSnapshot((snapshot) => {
            notifications = [];
            snapshot.forEach(doc => notifications.push({ id: doc.id, ...doc.data(), timestamp: doc.data().timestamp || new Date() }));
            unreadCount = notifications.filter(n => !n.lida).length;
            updateNotificationBadge();
            renderNotifications();
        }, (error) => console.error('Erro no listener:', error));
}

// ============================================
// AUTENTICAÇÃO
// ============================================
async function checkIfUserIsBanned(user) {
    if (!user) return false;
    try {
        const doc = await db.collection('users').doc(user.uid).get();
        if (doc.exists) return doc.data().isBanned === true || doc.data().isBan === true;
    } catch (e) {}
    return false;
}

async function checkIsAdmin(user) {
    if (!user) return false;
    if (ADMIN_UIDS.includes(user.uid)) return true;
    try {
        const userDoc = await db.collection('users').doc(user.uid).get();
        return userDoc.exists && userDoc.data().isAdmin === true;
    } catch { return false; }
}

function showBannedScreen(reason = 'Violação das políticas de uso') {
    document.getElementById('bannedOverlay').classList.add('show');
    document.getElementById('banDetails').textContent = `Motivo: ${reason}`;
}

async function logoutBanned() {
    try { await auth.signOut(); location.reload(); } catch (e) { location.reload(); }
}

function updateUI() {
    const avatar = document.getElementById('userAvatar');
    const name = document.getElementById('userName');
    const email = document.getElementById('userEmail');
    const badge = document.getElementById('userBadge');
    const btnLogin = document.getElementById('btnLogin');
    const btnLogout = document.getElementById('btnLogout');
    
    if (currentUser && !isBanned) {
        let displayName = currentUser.displayName || (currentUser.email ? currentUser.email.split('@')[0] : 'Usuário');
        if (currentUser.photoURL) {
            avatar.innerHTML = `<img src="${currentUser.photoURL}" alt="Avatar">`;
        } else {
            avatar.textContent = getInitials(displayName);
        }
        name.textContent = displayName.length > 20 ? displayName.substring(0,17)+'...' : displayName;
        email.textContent = currentUser.email || '';
        let badges = '';
        if (isBanned) badges += '<span class="badge-banned">🚫 Banido</span> ';
        if (isAdmin) badges += '<span class="badge-admin">Admin</span> ';
        badge.innerHTML = badges;
        btnLogin.style.display = 'none';
        btnLogout.style.display = 'inline-block';
    } else {
        avatar.innerHTML = '👤';
        name.textContent = 'Visitante';
        email.textContent = '';
        badge.innerHTML = '';
        btnLogin.style.display = 'inline-block';
        btnLogout.style.display = 'none';
    }
}

function showLoginModal() { document.getElementById('login-modal').classList.add('show'); }
function closeLoginModal() { document.getElementById('login-modal').classList.remove('show'); }

async function loginWithGoogle() {
    try {
        const provider = new firebase.auth.GoogleAuthProvider();
        const result = await auth.signInWithPopup(provider);
        currentUser = result.user;
        isBanned = await checkIfUserIsBanned(currentUser);
        if (isBanned) { showBannedScreen('Sua conta foi banida.'); await auth.signOut(); updateUI(); return; }
        isAdmin = await checkIsAdmin(currentUser);
        await db.collection('users').doc(currentUser.uid).set({
            email: currentUser.email,
            displayName: currentUser.displayName || currentUser.email.split('@')[0],
            photoURL: currentUser.photoURL || null,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            isAdmin: isAdmin,
            isBanned: false,
            cookiePreferences: CookieManager.getConsent() || null
        }, { merge: true });
        updateUI();
        closeLoginModal();
        await loadNotifications();
        listenNotifications();
        if (isAdmin) document.getElementById('admin-toolbar').style.display = 'block';
    } catch (error) {
        console.error('Erro no login:', error);
        alert('Erro ao fazer login: ' + error.message);
    }
}

async function logout() {
    try {
        await auth.signOut();
        currentUser = null;
        isBanned = false;
        isAdmin = false;
        if (notificationListener) { notificationListener(); notificationListener = null; }
        notifications = [];
        unreadCount = 0;
        updateNotificationBadge();
        updateUI();
        document.getElementById('admin-toolbar').style.display = 'none';
        console.log('✅ Logout realizado com sucesso!');
    } catch (error) {
        console.error('❌ Erro no logout:', error);
        alert('Erro ao sair: ' + error.message);
    }
}

function showRegister() {
    const email = prompt('Digite seu e-mail:');
    if (!email) return;
    const password = prompt('Digite sua senha (mínimo 6 caracteres):');
    if (!password || password.length < 6) { alert('A senha deve ter pelo menos 6 caracteres'); return; }
    registerUserEmail(email, password);
}

async function registerUserEmail(email, password) {
    try {
        const result = await auth.createUserWithEmailAndPassword(email, password);
        currentUser = result.user;
        await db.collection('users').doc(currentUser.uid).set({
            email: currentUser.email,
            displayName: currentUser.email.split('@')[0],
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            isAdmin: false,
            isBanned: false,
            cookiePreferences: CookieManager.getConsent() || null
        });
        updateUI();
        closeLoginModal();
        alert('Conta criada com sucesso!');
    } catch (error) {
        console.error('Erro ao criar conta:', error);
        alert('Erro ao criar conta: ' + error.message);
    }
}

// ============================================
// CARREGAR ARTIGOS
// ============================================
function showLoading() {
    document.getElementById('articles-list').innerHTML = `
        <div class="loading-container">
            <div class="spinner"></div>
            <p>Carregando artigos...</p>
        </div>
    `;
}

async function loadArticles() {
    showLoading();
    try {
        const snapshot = await db.collection('articlesdoc')
            .orderBy('lastModified', 'desc')
            .get();
        
        allArticles = [];
        const authorsSet = new Set();
        let totalViews = 0;
        
        for (const doc of snapshot.docs) {
            const data = doc.data();
            if (data.authors && Array.isArray(data.authors)) {
                data.authors.forEach(author => authorsSet.add(author));
            }
            totalViews += (data.views || 0);
            
            allArticles.push({
                id: doc.id,
                title: data.title || 'Sem título',
                description: data.description || '',
                content: data.formattedContent || '',
                authors: data.authors || [],
                students: data.students || [],
                type: data.articleType || 'cientifico',
                language: data.language || 'pt-BR',
                status: data.status || 'published',
                uid: data.uid || doc.id,
                views: data.views || 0,
                shares: data.shares || 0,
                citation: data.citation || '',
                createdAt: safeToDate(data.createdAt),
                lastModified: safeToDate(data.lastModified),
                sources: data.sources || []
            });
        }
        
        document.getElementById('total-articles').textContent = allArticles.length;
        document.getElementById('total-authors').textContent = authorsSet.size;
        document.getElementById('total-views').textContent = totalViews.toLocaleString();
        
        const lastModified = allArticles[0]?.lastModified;
        if (lastModified) {
            document.getElementById('last-update').textContent = formatDate(lastModified);
        }
        
        extractKeywords();
        applyFilters();
        
    } catch (error) {
        console.error('Erro ao carregar artigos:', error);
        document.getElementById('articles-list').innerHTML = `
            <div class="empty-state">
                <i class="material-icons">error</i>
                <h3>Erro ao carregar artigos</h3>
                <p>${escapeHtml(error.message)}</p>
            </div>
        `;
    }
}

function extractKeywords() {
    const keywordMap = new Map();
    allArticles.forEach(article => {
        const titleWords = article.title.toLowerCase().split(/\s+/);
        titleWords.forEach(word => {
            if (word.length > 4 && !['artigo', 'estudo', 'pesquisa', 'análise'].includes(word)) {
                keywordMap.set(word, (keywordMap.get(word) || 0) + 1);
            }
        });
        if (article.description) {
            const descWords = article.description.toLowerCase().split(/\s+/);
            descWords.forEach(word => {
                if (word.length > 4) {
                    keywordMap.set(word, (keywordMap.get(word) || 0) + 1);
                }
            });
        }
    });
    
    const topKeywords = Array.from(keywordMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
    
    const keywordsList = document.getElementById('keywords-list');
    if (keywordsList) {
        keywordsList.innerHTML = topKeywords.map(([keyword, count]) => `
            <label>
                <input type="checkbox" class="keyword-checkbox" value="${escapeHtml(keyword)}" onchange="applyFilters()">
                ${escapeHtml(keyword)} <span style="color:#999;">(${count})</span>
            </label>
        `).join('');
    }
}

function applyFilters() {
    const searchTerm = document.getElementById('search-input')?.value.toLowerCase() || '';
    const typeFilter = document.getElementById('type-filter')?.value || 'all';
    const languageFilter = document.getElementById('language-filter')?.value || 'all';
    const sortBy = document.getElementById('sort-by')?.value || 'recent';
    const yearStart = document.getElementById('year-start')?.value;
    const yearEnd = document.getElementById('year-end')?.value;
    const showPublished = document.getElementById('status-published')?.checked || false;
    const showDraft = document.getElementById('status-draft')?.checked || false;
    const selectedKeywords = Array.from(document.querySelectorAll('.keyword-checkbox:checked'))
        .map(cb => cb.value.toLowerCase());
    
    filteredArticles = allArticles.filter(article => {
        if (!showPublished && article.status === 'published') return false;
        if (!showDraft && article.status === 'draft') return false;
        if (typeFilter !== 'all' && article.type !== typeFilter) return false;
        if (languageFilter !== 'all' && article.language !== languageFilter) return false;
        
        if (yearStart && article.createdAt) {
            const year = getSafeYear(article.createdAt);
            if (year < parseInt(yearStart)) return false;
        }
        if (yearEnd && article.createdAt) {
            const year = getSafeYear(article.createdAt);
            if (year > parseInt(yearEnd)) return false;
        }
        
        if (searchTerm) {
            const inTitle = article.title.toLowerCase().includes(searchTerm);
            const inAuthors = article.authors.some(a => a.toLowerCase().includes(searchTerm));
            const inDescription = article.description.toLowerCase().includes(searchTerm);
            const inContent = stripHtml(article.content).toLowerCase().includes(searchTerm);
            if (!inTitle && !inAuthors && !inDescription && !inContent) return false;
        }
        
        if (selectedKeywords.length > 0) {
            const articleText = (article.title + ' ' + article.description).toLowerCase();
            const hasKeyword = selectedKeywords.some(kw => articleText.includes(kw));
            if (!hasKeyword) return false;
        }
        
        return true;
    });
    
    if (sortBy === 'recent') {
        filteredArticles.sort((a, b) => (b.lastModified?.getTime() || 0) - (a.lastModified?.getTime() || 0));
    } else if (sortBy === 'oldest') {
        filteredArticles.sort((a, b) => (a.lastModified?.getTime() || 0) - (b.lastModified?.getTime() || 0));
    } else if (sortBy === 'title') {
        filteredArticles.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === 'views') {
        filteredArticles.sort((a, b) => (b.views || 0) - (a.views || 0));
    }
    
    currentPage = 1;
    document.getElementById('results-count').textContent = `${filteredArticles.length} artigo(s) encontrado(s)`;
    renderArticles();
    renderPagination();
}

function renderArticles() {
    const container = document.getElementById('articles-list');
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageArticles = filteredArticles.slice(start, end);
    
    if (pageArticles.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="material-icons">search_off</i>
                <h3>Nenhum artigo encontrado</h3>
                <p>Tente ajustar seus filtros ou buscar por outros termos.</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = pageArticles.map(article => `
        <div class="article-card">
            <div class="article-title">
                <a href="#" onclick="viewArticle('${article.id}'); return false;">
                    ${escapeHtml(article.title)}
                </a>
                ${article.status === 'draft' ? '<span class="status-badge status-draft">Rascunho</span>' : ''}
            </div>
            
            <div class="article-authors">
                <i class="material-icons" style="font-size: 14px;">people</i>
                ${article.authors.length > 0 ? article.authors.join('; ') : 'Autor não informado'}
                ${article.students && article.students.length > 0 ? ` (Orientandos: ${article.students.join(', ')})` : ''}
            </div>
            
            <div class="article-meta">
                <span><i class="material-icons">schedule</i> ${formatDate(article.lastModified)}</span>
                <span><i class="material-icons">category</i> ${getTypeLabel(article.type)}</span>
                <span><i class="material-icons">language</i> ${article.language === 'pt-BR' ? 'Português' : article.language === 'en-US' ? 'English' : 'Español'}</span>
                <span><i class="material-icons">visibility</i> ${(article.views || 0).toLocaleString()} visualizações</span>
            </div>
            
            <div class="article-abstract">
                ${escapeHtml(article.description.substring(0, 200))}${article.description.length > 200 ? '...' : ''}
            </div>
            
            <div class="article-actions">
                <button class="action-btn" onclick="quickView('${article.id}')">
                    <i class="material-icons">visibility</i> Visualizar
                </button>
                <button class="action-btn" onclick="showCitation('${article.id}')">
                    <i class="material-icons">format_quote</i> Como Citar
                </button>
                ${isAdmin ? `
                    <a href="add-article.html?id=${article.id}" class="action-btn">
                        <i class="material-icons">edit</i> Editar
                    </a>
                ` : ''}
            </div>
        </div>
    `).join('');
}

function renderPagination() {
    const totalPages = Math.ceil(filteredArticles.length / itemsPerPage);
    const pagination = document.getElementById('pagination');
    
    if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }
    
    let html = '';
    html += `<button class="page-btn" onclick="goToPage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>«</button>`;
    
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);
    
    if (startPage > 1) {
        html += `<button class="page-btn" onclick="goToPage(1)">1</button>`;
        if (startPage > 2) html += `<span class="page-btn" style="background:none;">...</span>`;
    }
    
    for (let i = startPage; i <= endPage; i++) {
        html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>`;
    }
    
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) html += `<span class="page-btn" style="background:none;">...</span>`;
        html += `<button class="page-btn" onclick="goToPage(${totalPages})">${totalPages}</button>`;
    }
    
    html += `<button class="page-btn" onclick="goToPage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>»</button>`;
    pagination.innerHTML = html;
}

function goToPage(page) {
    const totalPages = Math.ceil(filteredArticles.length / itemsPerPage);
    if (page < 1 || page > totalPages) return;
    currentPage = page;
    renderArticles();
    renderPagination();
    window.scrollTo({ top: 400, behavior: 'smooth' });
}

// ============================================
// FUNÇÕES DE VISUALIZAÇÃO
// ============================================
async function viewArticle(articleId) {
    const article = allArticles.find(a => a.id === articleId);
    if (!article) return;
    try {
        await db.collection('articlesdoc').doc(articleId).update({
            views: firebase.firestore.FieldValue.increment(1)
        });
        article.views = (article.views || 0) + 1;
        const totalViews = allArticles.reduce((sum, a) => sum + (a.views || 0), 0);
        document.getElementById('total-views').textContent = totalViews.toLocaleString();
    } catch (e) { console.warn('Erro ao incrementar visualizações:', e); }
    window.open(`view-article.html?uid=${article.uid}`, '_blank');
}

function quickView(articleId) {
    const article = allArticles.find(a => a.id === articleId);
    if (!article) return;
    const modal = document.getElementById('quickview-modal');
    document.getElementById('quickview-title').textContent = article.title;
    document.getElementById('quickview-body').innerHTML = `
        <div class="article-authors"><strong>Autores:</strong> ${article.authors.join('; ') || 'Não informado'}</div>
        <div class="article-meta" style="margin: 15px 0;">
            <span><strong>Tipo:</strong> ${getTypeLabel(article.type)}</span>
            <span><strong>Idioma:</strong> ${article.language === 'pt-BR' ? 'Português' : article.language === 'en-US' ? 'English' : 'Español'}</span>
            <span><strong>Publicado:</strong> ${formatDate(article.lastModified)}</span>
        </div>
        <div class="article-abstract" style="margin: 15px 0;">
            <strong>Resumo:</strong><br>
            ${escapeHtml(article.description || 'Sem resumo disponível')}
        </div>
        <div style="margin: 15px 0;">
            <strong>Conteúdo:</strong>
            <div style="margin-top: 10px; padding: 15px; background: #f8f9fa; border-radius: 8px; max-height: 300px; overflow-y: auto;">
                ${article.content || '<em>Conteúdo não disponível para visualização rápida</em>'}
            </div>
        </div>
        <div style="text-align: right; margin-top: 20px;">
            <button class="search-btn" onclick="window.open('view-article.html?uid=${article.uid}', '_blank')">
                <i class="material-icons">open_in_new</i> Ler Artigo Completo
            </button>
        </div>
    `;
    modal.classList.add('show');
}

function showCitation(articleId) {
    const article = allArticles.find(a => a.id === articleId);
    if (!article) return;
    const modal = document.getElementById('citation-modal');
    const content = document.getElementById('citation-content');
    
    let citation = article.citation;
    const year = getSafeYear(article.createdAt);
    const authors = article.authors.length > 0 ? article.authors.join(', ') : 'Autor desconhecido';
    
    if (!citation || citation === '') {
        citation = `${authors}. ${article.title}. WZZM Academic. ${year}. Disponível em: ${window.location.origin}/view-article.html?uid=${article.uid}. Acesso em: ${new Date().toLocaleDateString('pt-BR')}.`;
    }
    
    content.innerHTML = `
        <div class="citation-box"><strong>ABNT:</strong><br>${escapeHtml(citation)}</div>
        <div class="citation-box" style="margin-top: 15px;">
            <strong>APA (7ª edição):</strong><br>
            ${escapeHtml(article.authors.join(', '))}. (${year}). ${article.title}. <em>WZZM Academic</em>. Disponível em: ${window.location.origin}/view-article.html?uid=${article.uid}
        </div>
        <div class="citation-box" style="margin-top: 15px;">
            <strong>Vancouver:</strong><br>
            ${escapeHtml(article.authors.join(', '))}. ${article.title}. WZZM Academic. ${year}; Disponível em: ${window.location.origin}/view-article.html?uid=${article.uid}.
        </div>
    `;
    modal.classList.add('show');
}

function copyCitation() {
    const citationText = document.querySelector('#citation-content .citation-box:first-child')?.innerText || '';
    if (citationText) {
        navigator.clipboard.writeText(citationText).then(() => {
            alert('Citação copiada para a área de transferência!');
        }).catch(() => {
            alert('Erro ao copiar. Selecione manualmente.');
        });
    }
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('show');
}

// ============================================
// EVENT LISTENERS
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar Cookie Manager
    CookieManager.init();
    
    document.getElementById('search-btn')?.addEventListener('click', applyFilters);
    document.getElementById('search-input')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') applyFilters();
    });
    document.getElementById('apply-filters-btn')?.addEventListener('click', applyFilters);
    
    // Login form
    document.getElementById('login-form-modal')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('modal-email').value;
        const password = document.getElementById('modal-password').value;
        try {
            const result = await auth.signInWithEmailAndPassword(email, password);
            currentUser = result.user;
            updateUI();
            closeLoginModal();
        } catch (error) {
            alert('Erro ao fazer login: ' + error.message);
        }
    });
    
    // Fechar modais ao clicar fora
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.classList.remove('show');
        });
    });
});

// ============================================
// INICIALIZAÇÃO
// ============================================
auth.onAuthStateChanged(async (user) => {
    if (user) {
        currentUser = user;
        isBanned = await checkIfUserIsBanned(user);
        if (isBanned) { showBannedScreen('Sua conta foi banida.'); await auth.signOut(); updateUI(); return; }
        isAdmin = await checkIsAdmin(user);
        updateUI();
        await loadNotifications();
        listenNotifications();
        if (isAdmin) document.getElementById('admin-toolbar').style.display = 'block';
        await loadArticles();
    } else {
        currentUser = null;
        isBanned = false;
        isAdmin = false;
        updateUI();
        document.getElementById('admin-toolbar').style.display = 'none';
        if (notificationListener) { notificationListener(); notificationListener = null; }
        notifications = [];
        unreadCount = 0;
        updateNotificationBadge();
        await loadArticles();
    }
});

// Expor funções globalmente
window.applyFilters = applyFilters;
window.viewArticle = viewArticle;
window.quickView = quickView;
window.showCitation = showCitation;
window.copyCitation = copyCitation;
window.closeModal = closeModal;
window.goToPage = goToPage;
window.logout = logout;
window.loginWithGoogle = loginWithGoogle;
window.showLoginModal = showLoginModal;
window.closeLoginModal = closeLoginModal;
window.showRegister = showRegister;
window.logoutBanned = logoutBanned;
window.toggleNotifications = toggleNotifications;
window.markAllAsRead = markAllAsRead;

console.log('📚 Biblioteca Científica WazzimaGiygg inicializada com sucesso!');
console.log('🔔 Notificações integradas via coleção "notifications"');
console.log('🍪 Sistema de consentimento de cookies ativo');
