// ============================================
// COOKIE CONSENT MANAGER
// ============================================
const CookieManager = {
    STORAGE_KEY: 'maspia_cookie_consent',
    
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
// FIREBASE CONFIG
// ============================================
const firebaseConfig = {
    apiKey: "AIzaSyB9GkSqTIZ0kbVsba_WOdQeVAETrF9qna0",
    authDomain: "wzzm-ce3fc.firebaseapp.com",
    projectId: "wzzm-ce3fc",
    storageBucket: "wzzm-ce3fc.appspot.com",
    messagingSenderId: "249427877153",
    appId: "1:249427877153:web:0e4297294794a5aadeb260"
};

if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// ============================================
// VARIÁVEIS GLOBAIS
// ============================================
let currentUser = null;
let isAdmin = false;
let isBanned = false;
let currentCategoryId = null;
let currentSubcategoryId = null;
let currentThreadId = null;
let threadQuill = null;
let replyQuill = null;
let notifications = [];
let unreadCount = 0;
let notificationListener = null;

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

function getInitials(name) {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length-1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
}

function formatDate(timestamp) {
    if (!timestamp) return 'Data desconhecida';
    if (timestamp.toDate) timestamp = timestamp.toDate();
    return timestamp.toLocaleDateString('pt-BR') + ' ' + timestamp.toLocaleTimeString('pt-BR');
}

function getTimeAgo(date) {
    if (!date) return '';
    if (date.toDate) date = date.toDate();
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return 'agora';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
}

function renderHtmlContent(html) {
    if (!html) return '';
    if (typeof DOMPurify !== 'undefined') {
        return DOMPurify.sanitize(html, {
            ALLOWED_TAGS: ['h1','h2','h3','h4','h5','h6','p','br','hr','b','i','strong','em',
                           'ul','ol','li','a','img','table','thead','tbody','tr','th','td',
                           'pre','code','blockquote','div','span','figure','figcaption','iframe']
        });
    }
    return html;
}

// ============================================
// REGISTRO DE USUÁRIO
// ============================================
async function registerUser(user) {
    try {
        const uid = user.uid;
        const userRef = db.collection('users').doc(uid);
        const userDoc = await userRef.get();
        const existingData = userDoc.exists ? userDoc.data() : {};
        
        let isAdminValue = ADMIN_UIDS.includes(uid) || existingData.isAdmin === true;
        let isBannedValue = existingData.isBanned || existingData.isBan || false;
        
        const userData = {
            uid: uid,
            email: user.email || '',
            name: user.displayName || 'Usuário',
            profilePictureUrl: user.photoURL || '',
            isAdmin: isAdminValue,
            isBan: existingData.isBan || false,
            isBanned: isBannedValue,
            isTeacher: existingData.isTeacher || false,
            isTeatcher: existingData.isTeatcher || false,
            createdAt: existingData.createdAt || firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            lastLoginAt: firebase.firestore.FieldValue.serverTimestamp(),
            cookiePreferences: CookieManager.getConsent() || null
        };

        await userRef.set(userData, { merge: true });
        console.log(`Usuário ${uid} registrado com sucesso!`);
        return userData;
    } catch (error) {
        console.error('Erro ao registrar usuário:', error);
        return null;
    }
}

// ============================================
// VERIFICAÇÃO DE BANIMENTO
// ============================================
async function checkIfUserIsBanned(user) {
    if (!user) return false;
    try {
        const userDoc = await db.collection('users').doc(user.uid).get();
        if (userDoc.exists) {
            const data = userDoc.data();
            return data.isBanned === true || data.isBan === true;
        }
    } catch (error) {
        console.log("Erro ao verificar banimento:", error);
    }
    return false;
}

function showBannedScreen(reason = 'Violação das políticas de uso') {
    const overlay = document.getElementById('bannedOverlay');
    const details = document.getElementById('banDetails');
    details.textContent = `Motivo: ${reason}`;
    overlay.classList.add('show');
    document.querySelector('.main-container').style.opacity = '0.3';
    document.querySelector('.main-container').style.pointerEvents = 'none';
    document.querySelector('.header').style.opacity = '0.3';
    document.querySelector('.header').style.pointerEvents = 'none';
    document.querySelector('.site-footer').style.opacity = '0.3';
    document.querySelector('.site-footer').style.pointerEvents = 'none';
}

async function logoutBanned() {
    try { await auth.signOut(); location.reload(); } catch (e) { location.reload(); }
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
// AUTENTICAÇÃO - UI
// ============================================
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
        await registerUser(currentUser);
        isBanned = await checkIfUserIsBanned(currentUser);
        if (isBanned) { showBannedScreen('Sua conta foi banida.'); await auth.signOut(); updateUI(); return; }
        isAdmin = ADMIN_UIDS.includes(currentUser.uid) || (await db.collection('users').doc(currentUser.uid).get()).data()?.isAdmin === true;
        updateUI();
        closeLoginModal();
        await loadNotifications();
        listenNotifications();
        navigateToHome();
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
        navigateToHome();
    } catch (error) {
        console.error('Erro no logout:', error);
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
        await registerUser(currentUser);
        updateUI();
        closeLoginModal();
        alert('Conta criada com sucesso!');
    } catch (error) {
        console.error('Erro ao criar conta:', error);
        alert('Erro ao criar conta: ' + error.message);
    }
}

// ============================================
// CONFIGURAÇÕES DE PAGINAÇÃO E ROTAS
// ============================================
const POSTS_PER_PAGE = 10;
let currentPage = 1;
let totalPosts = 0;
let totalPages = 0;

function updateURL(categoryId, subcategoryId, threadId, page = null) {
    const params = new URLSearchParams();
    if (categoryId) params.set('cat', categoryId);
    if (subcategoryId) params.set('sub', subcategoryId);
    if (threadId) params.set('thread', threadId);
    if (page && page > 1) params.set('page', page);
    const newURL = `${window.location.origin}${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
    window.history.pushState({ categoryId, subcategoryId, threadId, page }, '', newURL);
}

function getURLParams() {
    const params = new URLSearchParams(window.location.search);
    return {
        categoryId: params.get('cat'),
        subcategoryId: params.get('sub'),
        threadId: params.get('thread'),
        page: parseInt(params.get('page')) || 1
    };
}

function getCurrentLink() {
    const params = getURLParams();
    let link = window.location.origin + window.location.pathname;
    const queryParams = [];
    if (params.categoryId) queryParams.push(`cat=${params.categoryId}`);
    if (params.subcategoryId) queryParams.push(`sub=${params.subcategoryId}`);
    if (params.threadId) queryParams.push(`thread=${params.threadId}`);
    if (params.page > 1) queryParams.push(`page=${params.page}`);
    if (queryParams.length > 0) link += '?' + queryParams.join('&');
    return link;
}

function copyCurrentLink() {
    const link = getCurrentLink();
    navigator.clipboard.writeText(link).then(() => {
        const btn = event.target;
        const originalText = btn.textContent;
        btn.textContent = '✅ Link copiado!';
        setTimeout(() => { btn.textContent = originalText; }, 2000);
    }).catch(() => alert('Link: ' + link));
}

function addCopyLinkButton() {
    const breadcrumb = document.querySelector('.breadcrumb');
    if (breadcrumb && !breadcrumb.querySelector('.copy-link-btn')) {
        const copyBtn = document.createElement('button');
        copyBtn.className = 'copy-link-btn';
        copyBtn.innerHTML = '🔗 Copiar link';
        copyBtn.onclick = copyCurrentLink;
        breadcrumb.appendChild(copyBtn);
    }
}

function handlePostAnchor() {
    const hash = window.location.hash;
    if (hash && hash.startsWith('#post-')) {
        const postId = hash.substring(1);
        setTimeout(() => {
            const postElement = document.getElementById(postId);
            if (postElement) {
                postElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                postElement.classList.add('post-highlight');
                setTimeout(() => postElement.classList.remove('post-highlight'), 2000);
            }
        }, 500);
    }
}

// ============================================
// REFERÊNCIAS FIRESTORE - ESTRUTURA ORIGINAL
// ============================================
const maspiaRef = db.collection('maspia');
const forumDocRef = maspiaRef.doc('forum');

async function ensureForumDoc() {
    try {
        const doc = await forumDocRef.get();
        if (!doc.exists) {
            await forumDocRef.set({
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                name: 'Maspia Forum'
            });
            console.log('📁 Documento forum criado com sucesso!');
        }
        return true;
    } catch (error) {
        console.error('Erro ao criar documento forum:', error);
        return false;
    }
}

const categoriesRef = () => forumDocRef.collection('categories');
const subcategoriesRef = (catId) => categoriesRef().doc(catId).collection('subcategories');
const threadsRef = (catId, subId) => subcategoriesRef(catId).doc(subId).collection('threads');
const postsRef = (catId, subId, threadId) => threadsRef(catId, subId).doc(threadId).collection('posts');
const commentsRef = (catId, subId, threadId, postId) => postsRef(catId, subId, threadId).doc(postId).collection('comments');

// ============================================
// CONTROLE ANTI-SPAM
// ============================================
const submitLocks = new Map();
function isLocked(key, timeout = 2000) {
    if (submitLocks.has(key)) {
        if (Date.now() - submitLocks.get(key) < timeout) return true;
        submitLocks.delete(key);
    }
    return false;
}
function lock(key, timeout = 2000) {
    submitLocks.set(key, Date.now());
    setTimeout(() => submitLocks.delete(key), timeout);
}

// ============================================
// NAVEGAÇÃO
// ============================================
async function navigateToHome() {
    if (isBanned) return;
    updateURL(null, null, null);
    await showHome();
}

async function navigateToSubcategories(categoryId) {
    if (isBanned) return;
    updateURL(categoryId, null, null);
    await showSubcategories(categoryId);
}

async function navigateToThreads(categoryId, subcategoryId) {
    if (isBanned) return;
    updateURL(categoryId, subcategoryId, null);
    await showThreads(categoryId, subcategoryId);
}

async function navigateToPosts(categoryId, subcategoryId, threadId, page = 1) {
    if (isBanned) return;
    currentCategoryId = categoryId;
    currentSubcategoryId = subcategoryId;
    currentThreadId = threadId;
    updateURL(categoryId, subcategoryId, threadId, page);
    await showPostsWithPagination(categoryId, subcategoryId, threadId, page);
}

function copyPostLink(postId, postNumber) {
    const baseUrl = window.location.origin + window.location.pathname;
    const params = getURLParams();
    let link = `${baseUrl}?cat=${params.categoryId}&sub=${params.subcategoryId}&thread=${params.threadId}&page=${currentPage}#post-${postId}`;
    navigator.clipboard.writeText(link).then(() => {
        const btn = event.target;
        const originalHTML = btn.innerHTML;
        btn.innerHTML = '<span class="material-icons">check</span> Link copiado!';
        setTimeout(() => { btn.innerHTML = originalHTML; }, 2000);
    }).catch(() => alert('Link do post: ' + link));
}

// ============================================
// TELAS PRINCIPAIS
// ============================================
async function showHome() {
    if (isBanned) return;
    const container = document.getElementById('main-container');
    container.innerHTML = '<div class="loading">Carregando categorias...</div>';
    
    try {
        await ensureForumDoc();
        const snapshot = await categoriesRef().orderBy('order', 'asc').get();
        const categories = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            categories.push({ id: doc.id, ...data });
        });
        
        if (categories.length === 0 && isAdmin) {
            container.innerHTML = `
                <div class="admin-panel" style="text-align:center;">
                    <h3>Nenhuma categoria criada ainda</h3>
                    <p>Clique no botão abaixo para criar sua primeira categoria</p>
                    <button class="btn-primary" onclick="showCreateCategory()">Criar Categoria</button>
                </div>
            `;
            return;
        }
        
        container.innerHTML = `
            <div class="breadcrumb"><a onclick="navigateToHome()">Fórum</a></div>
            <div class="categories-grid">
                ${categories.map(cat => `
                    <div class="category-card" onclick="navigateToSubcategories('${cat.id}')">
                        <div class="category-header">
                            <h3>${escapeHtml(cat.icon || '📁')} ${escapeHtml(cat.name)}</h3>
                            <p>${escapeHtml(cat.description || '')}</p>
                        </div>
                        <div class="category-body">
                            <div class="category-stats">
                                <span>Subcategorias: ${cat.subcategoriesCount || 0}</span>
                                <span>Tópicos: ${cat.threadsCount || 0}</span>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
            ${isAdmin ? `<div style="text-align:center; margin-top:20px;"><button class="btn-primary" onclick="showCreateCategory()">Criar Nova Categoria</button></div>` : ''}
        `;
        addCopyLinkButton();
    } catch (error) {
        console.error('Erro ao carregar categorias:', error);
        container.innerHTML = `<div class="loading">Erro: ${error.message}</div>`;
    }
}

async function showSubcategories(categoryId) {
    if (isBanned) return;
    const container = document.getElementById('main-container');
    container.innerHTML = '<div class="loading">Carregando...</div>';
    
    try {
        const catDoc = await categoriesRef().doc(categoryId).get();
        const category = catDoc.data();
        const snapshot = await subcategoriesRef(categoryId).orderBy('order', 'asc').get();
        const subcategories = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            subcategories.push({ id: doc.id, ...data });
        });
        
        container.innerHTML = `
            <div class="breadcrumb">
                <a onclick="navigateToHome()">Fórum</a> &gt;
                <a onclick="navigateToSubcategories('${categoryId}')">${escapeHtml(category?.name || 'Categoria')}</a>
            </div>
            <div style="margin-bottom: 20px;">
                <h2>${escapeHtml(category?.icon || '📁')} ${escapeHtml(category?.name || 'Categoria')}</h2>
                <p>${escapeHtml(category?.description || '')}</p>
            </div>
            <div class="categories-grid">
                ${subcategories.map(sub => `
                    <div class="category-card" onclick="navigateToThreads('${categoryId}', '${sub.id}')">
                        <div class="category-header" style="background: linear-gradient(135deg, #e94560, #ff6b6b);">
                            <h3>${escapeHtml(sub.icon || '📌')} ${escapeHtml(sub.name)}</h3>
                            <p>${escapeHtml(sub.description || '')}</p>
                        </div>
                        <div class="category-body">
                            <div class="category-stats">
                                <span>Tópicos: ${sub.threadsCount || 0}</span>
                                <span>Posts: ${sub.postsCount || 0}</span>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
            ${isAdmin ? `<div style="text-align:center; margin-top:20px;"><button class="btn-primary" onclick="showCreateSubcategory('${categoryId}')">Criar Subcategoria</button></div>` : ''}
        `;
        addCopyLinkButton();
    } catch (error) {
        container.innerHTML = `<div class="loading">Erro: ${error.message}</div>`;
    }
}

async function showThreads(categoryId, subcategoryId) {
    if (isBanned) return;
    const container = document.getElementById('main-container');
    container.innerHTML = '<div class="loading">Carregando tópicos...</div>';
    
    try {
        const catDoc = await categoriesRef().doc(categoryId).get();
        const subDoc = await subcategoriesRef(categoryId).doc(subcategoryId).get();
        const category = catDoc.data();
        const subcategory = subDoc.data();
        const snapshot = await threadsRef(categoryId, subcategoryId).orderBy('lastActivity', 'desc').get();
        const threads = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            threads.push({ id: doc.id, ...data });
        });
        
        container.innerHTML = `
            <div class="breadcrumb">
                <a onclick="navigateToHome()">Fórum</a> &gt;
                <a onclick="navigateToSubcategories('${categoryId}')">${escapeHtml(category?.name)}</a> &gt;
                <a onclick="navigateToThreads('${categoryId}', '${subcategoryId}')">${escapeHtml(subcategory?.name)}</a>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 10px;">
                <h2>${escapeHtml(subcategory?.icon || '📌')} ${escapeHtml(subcategory?.name)}</h2>
                ${currentUser && !isBanned ? `<button class="btn-primary" onclick="showCreateThread()">Criar Novo Tópico</button>` : ''}
            </div>
            <div class="threads-list">
                ${threads.length === 0 ? '<div style="padding: 40px; text-align: center;">Nenhum tópico ainda. Seja o primeiro a criar um!</div>' : 
                    threads.map(thread => `
                        <div class="thread-item" onclick="navigateToPosts('${categoryId}', '${subcategoryId}', '${thread.id}')">
                            <div class="thread-title">${escapeHtml(thread.title)}</div>
                            <div class="thread-meta">
                                <span>Por: ${escapeHtml(thread.authorName || 'Anônimo')}</span>
                                <span>Data: ${formatDate(thread.createdAt)}</span>
                                <span>Respostas: ${thread.postsCount || 0}</span>
                            </div>
                        </div>
                    `).join('')
                }
            </div>
        `;
        addCopyLinkButton();
    } catch (error) {
        container.innerHTML = `<div class="loading">Erro: ${error.message}</div>`;
    }
}

async function loadPostsWithPagination(categoryId, subcategoryId, threadId, page = 1) {
    currentPage = page;
    try {
        const postsQuery = await postsRef(categoryId, subcategoryId, threadId).get();
        totalPosts = postsQuery.size;
        totalPages = Math.ceil(totalPosts / POSTS_PER_PAGE);
        if (currentPage > totalPages && totalPages > 0) currentPage = totalPages;
        if (currentPage < 1) currentPage = 1;
        const startIndex = (currentPage - 1) * POSTS_PER_PAGE;
        const postsSnapshot = await postsRef(categoryId, subcategoryId, threadId).orderBy('createdAt', 'asc').get();
        const allPosts = [];
        postsSnapshot.forEach(doc => allPosts.push({ id: doc.id, ...doc.data() }));
        const posts = allPosts.slice(startIndex, startIndex + POSTS_PER_PAGE);
        return { posts, totalPosts, totalPages, currentPage };
    } catch (error) {
        console.error('Erro ao carregar posts:', error);
        throw error;
    }
}

async function showPostsWithPagination(categoryId, subcategoryId, threadId, page = 1) {
    if (isBanned) return;
    const container = document.getElementById('main-container');
    container.innerHTML = '<div class="loading">Carregando posts...</div>';
    
    try {
        const catDoc = await categoriesRef().doc(categoryId).get();
        const subDoc = await subcategoriesRef(categoryId).doc(subcategoryId).get();
        const threadDoc = await threadsRef(categoryId, subcategoryId).doc(threadId).get();
        const category = catDoc.data();
        const subcategory = subDoc.data();
        const thread = threadDoc.data();
        
        if (!thread) { container.innerHTML = '<div class="loading">Tópico não encontrado!</div>'; return; }
        
        const { posts, totalPosts: total, totalPages: pages, currentPage: currPage } = 
            await loadPostsWithPagination(categoryId, subcategoryId, threadId, page);
        totalPosts = total; totalPages = pages; currentPage = currPage;
        
        updateURL(categoryId, subcategoryId, threadId, currentPage);
        
        container.innerHTML = `
            <div class="breadcrumb">
                <a onclick="navigateToHome()">Fórum</a> &gt;
                <a onclick="navigateToSubcategories('${categoryId}')">${escapeHtml(category?.name)}</a> &gt;
                <a onclick="navigateToThreads('${categoryId}', '${subcategoryId}')">${escapeHtml(subcategory?.name)}</a> &gt;
                <span>${escapeHtml(thread?.title)}</span>
            </div>
            <div style="margin-bottom: 20px;">
                <h1>${escapeHtml(thread?.title)}</h1>
                <p style="color:#666;">Criado por ${escapeHtml(thread?.authorName || 'Anônimo')} em ${formatDate(thread?.createdAt)}</p>
                <p style="color:#666; font-size:0.9em;">Total de respostas: ${totalPosts - 1} | Página ${currentPage} de ${totalPages}</p>
            </div>
            <div id="posts-list">
                ${posts.map((post, index) => `
                    <div class="post-card" id="post-${post.id}">
                        <div class="post-header">
                            <div class="post-author">
                                <strong>#${index + 1 + (currentPage - 1) * POSTS_PER_PAGE} - ${escapeHtml(post.authorName || 'Anônimo')}</strong>
                                ${post.isAdmin ? '<span class="badge badge-admin">Admin</span>' : ''}
                            </div>
                            <div class="post-date">${formatDate(post.createdAt)}</div>
                        </div>
                        <div class="post-content">${renderHtmlContent(post.content)}</div>
                        <div class="post-actions">
                            <button class="action-btn" onclick="showCommentForm('${post.id}')">
                                <span class="material-icons">comment</span> Responder
                            </button>
                            ${(currentUser && !isBanned && (post.authorId === currentUser.uid || isAdmin)) ? `
                                <button class="action-btn" onclick="editPost('${post.id}')">
                                    <span class="material-icons">edit</span> Editar
                                </button>
                                <button class="action-btn" onclick="deletePost('${post.id}')">
                                    <span class="material-icons">delete</span> Excluir
                                </button>
                            ` : ''}
                            <button class="action-btn" onclick="copyPostLink('${post.id}', ${index + 1 + (currentPage - 1) * POSTS_PER_PAGE})">
                                <span class="material-icons">link</span> Copiar link
                            </button>
                        </div>
                        <div id="comments-${post.id}" class="comment-list"></div>
                        <div id="comment-form-${post.id}" style="display:none; padding:20px;">
                            <textarea id="comment-content-${post.id}" rows="3" placeholder="Escreva seu comentário..." style="width:100%; padding:10px; border-radius:8px; border:1px solid #ddd;"></textarea>
                            <button class="btn-primary" style="margin-top:10px;" onclick="submitComment('${post.id}')">Enviar Comentário</button>
                        </div>
                    </div>
                `).join('')}
            </div>
            ${renderPagination(categoryId, subcategoryId, threadId, currentPage, totalPages)}
            ${currentUser && !isBanned ? `
                <div class="form-container" style="margin-top: 20px;">
                    <h3>Responder ao Tópico</h3>
                    <div id="reply-editor" style="height: 200px; margin-bottom: 10px;"></div>
                    <button class="btn-primary" onclick="createReply()">Enviar Resposta</button>
                </div>
            ` : ''}
        `;
        
        if (typeof Quill !== 'undefined') {
            replyQuill = new Quill('#reply-editor', {
                theme: 'snow',
                placeholder: 'Digite sua resposta aqui... Use as ferramentas de formatação!',
                modules: {
                    toolbar: [
                        ['bold', 'italic', 'underline', 'strike'],
                        ['blockquote', 'code-block'],
                        [{ 'header': [1, 2, 3, false] }],
                        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                        ['link', 'image'],
                        ['clean']
                    ]
                }
            });
        }
        
        for (const post of posts) loadComments(categoryId, subcategoryId, threadId, post.id);
        addCopyLinkButton();
        handlePostAnchor();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
        container.innerHTML = `<div class="loading">Erro: ${error.message}</div>`;
    }
}

function renderPagination(categoryId, subcategoryId, threadId, currentPage, totalPages) {
    if (totalPages <= 1) return '';
    let html = '<div class="pagination">';
    if (currentPage > 1) {
        html += `<button class="pagination-btn" onclick="goToPage('${categoryId}', '${subcategoryId}', '${threadId}', 1)">« Primeira</button>`;
        html += `<button class="pagination-btn" onclick="goToPage('${categoryId}', '${subcategoryId}', '${threadId}', ${currentPage - 1})">‹ Anterior</button>`;
    }
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, currentPage + 2);
    if (endPage - startPage < 4) {
        if (startPage === 1) endPage = Math.min(totalPages, startPage + 4);
        else if (endPage === totalPages) startPage = Math.max(1, endPage - 4);
    }
    if (startPage > 1) html += `<span class="pagination-dots">...</span>`;
    for (let i = startPage; i <= endPage; i++) {
        if (i === currentPage) html += `<button class="pagination-btn active" disabled>${i}</button>`;
        else html += `<button class="pagination-btn" onclick="goToPage('${categoryId}', '${subcategoryId}', '${threadId}', ${i})">${i}</button>`;
    }
    if (endPage < totalPages) html += `<span class="pagination-dots">...</span>`;
    if (currentPage < totalPages) {
        html += `<button class="pagination-btn" onclick="goToPage('${categoryId}', '${subcategoryId}', '${threadId}', ${currentPage + 1})">Próxima ›</button>`;
        html += `<button class="pagination-btn" onclick="goToPage('${categoryId}', '${subcategoryId}', '${threadId}', ${totalPages})">Última »</button>`;
    }
    html += `</div>`;
    html += `<div style="text-align:center; margin-top:10px; margin-bottom:20px; color:#666; font-size:0.9em;">
        Mostrando ${((currentPage - 1) * POSTS_PER_PAGE) + 1} - ${Math.min(currentPage * POSTS_PER_PAGE, totalPosts)} de ${totalPosts} posts
    </div>`;
    return html;
}

async function loadComments(categoryId, subcategoryId, threadId, postId) {
    if (!categoryId || !subcategoryId || !threadId || !postId) {
        console.warn('Parâmetros faltando para carregar comentários:', { categoryId, subcategoryId, threadId, postId });
        const commentsDiv = document.getElementById(`comments-${postId}`);
        if (commentsDiv) {
            commentsDiv.innerHTML = '<div style="padding: 10px; text-align:center; color:#999;">Comentários indisponíveis.</div>';
        }
        return;
    }
    
    try {
        const snapshot = await commentsRef(categoryId, subcategoryId, threadId, postId)
            .orderBy('createdAt', 'asc')
            .get();
            
        const comments = [];
        snapshot.forEach(doc => comments.push({ id: doc.id, ...doc.data() }));
        
        const commentsDiv = document.getElementById(`comments-${postId}`);
        if (commentsDiv) {
            if (comments.length === 0) {
                commentsDiv.innerHTML = '<div style="padding: 10px; text-align:center; color:#999;">Nenhum comentário ainda.</div>';
            } else {
                commentsDiv.innerHTML = comments.map(comment => `
                    <div class="comment-item">
                        <div class="comment-header">
                            <span class="comment-author">${escapeHtml(comment.authorName || 'Anônimo')}</span>
                            <span class="comment-date">${formatDate(comment.createdAt)}</span>
                        </div>
                        <div class="comment-text">${escapeHtml(comment.content)}</div>
                    </div>
                `).join('');
            }
        }
    } catch (error) { 
        console.error('Erro ao carregar comentários:', error);
        const commentsDiv = document.getElementById(`comments-${postId}`);
        if (commentsDiv) {
            commentsDiv.innerHTML = '<div style="padding: 10px; text-align:center; color:#999;">Erro ao carregar comentários.</div>';
        }
    }
}

// ============================================
// CRIAÇÃO DE POSTS E TÓPICOS
// ============================================
function showCreateThread() {
    if (!currentUser || isBanned) { if (isBanned) alert('Sua conta está banida.'); else showLoginModal(); return; }
    document.getElementById('post-modal-title').innerHTML = 'Criar Novo Tópico';
    document.getElementById('post-modal-body').innerHTML = `
        <div class="form-group"><label>Título</label><input type="text" id="thread-title" placeholder="Título do tópico"></div>
        <div class="form-group"><label>Conteúdo</label><div id="thread-editor" style="height: 300px; margin-bottom: 10px;"></div></div>
        <button class="btn-primary" onclick="createThread()">Criar Tópico</button>
    `;
    if (typeof Quill !== 'undefined') {
        threadQuill = new Quill('#thread-editor', {
            theme: 'snow',
            placeholder: 'Digite o conteúdo do seu tópico aqui...',
            modules: { toolbar: [['bold','italic','underline','strike'],['blockquote','code-block'],[{'header':[1,2,3,false]}],[{'list':'ordered'},{'list':'bullet'}],['link','image'],['clean']] }
        });
    }
    document.getElementById('post-modal').classList.add('show');
}

async function createThread() {
    if (!threadQuill || isBanned) { if (isBanned) alert('Sua conta está banida.'); return; }
    if (isLocked(`createThread_${currentUser?.uid}`)) { alert('Aguarde um momento...'); return; }
    const title = document.getElementById('thread-title').value.trim();
    const content = threadQuill.root.innerHTML;
    if (!title || !content || content === '<p><br></p>') { alert('Preencha título e conteúdo'); return; }
    lock(`createThread_${currentUser?.uid}`, 3000);
    
    const submitBtn = document.querySelector('#post-modal .btn-primary');
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Criando...'; }
    
    try {
        const threadId = Date.now().toString();
        const postId = Date.now().toString();
        const batch = db.batch();
        
        const threadRef = threadsRef(currentCategoryId, currentSubcategoryId).doc(threadId);
        batch.set(threadRef, {
            title: title,
            authorId: currentUser.uid,
            authorName: currentUser.displayName || currentUser.email,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            lastActivity: firebase.firestore.FieldValue.serverTimestamp(),
            postsCount: 1
        });
        
        const postRef = postsRef(currentCategoryId, currentSubcategoryId, threadId).doc(postId);
        batch.set(postRef, {
            content: content,
            authorId: currentUser.uid,
            authorName: currentUser.displayName || currentUser.email,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            isAdmin: isAdmin
        });
        
        await batch.commit();
        await updateCounts(currentCategoryId, currentSubcategoryId);
        document.getElementById('post-modal').classList.remove('show');
        navigateToThreads(currentCategoryId, currentSubcategoryId);
    } catch (error) { 
        alert('Erro ao criar tópico: ' + error.message); 
        console.error(error);
    }
    finally { if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Criar Tópico'; } submitLocks.delete(`createThread_${currentUser?.uid}`); }
}

async function createReply() {
    if (!currentUser || isBanned) { if (isBanned) alert('Sua conta está banida.'); else showLoginModal(); return; }
    if (!replyQuill) return;
    if (isLocked(`createReply_${currentThreadId}_${currentUser?.uid}`)) { alert('Aguarde um momento...'); return; }
    const content = replyQuill.root.innerHTML;
    if (!content || content === '<p><br></p>') { alert('Digite o conteúdo'); return; }
    lock(`createReply_${currentThreadId}_${currentUser?.uid}`, 3000);
    
    const submitBtn = document.querySelector('#reply-editor')?.parentElement?.querySelector('.btn-primary');
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Enviando...'; }
    
    try {
        const postId = Date.now().toString();
        const batch = db.batch();
        
        const postRef = postsRef(currentCategoryId, currentSubcategoryId, currentThreadId).doc(postId);
        batch.set(postRef, {
            content: content,
            authorId: currentUser.uid,
            authorName: currentUser.displayName || currentUser.email,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            isAdmin: isAdmin
        });
        
        const threadRef = threadsRef(currentCategoryId, currentSubcategoryId).doc(currentThreadId);
        batch.update(threadRef, {
            lastActivity: firebase.firestore.FieldValue.serverTimestamp(),
            postsCount: firebase.firestore.FieldValue.increment(1)
        });
        
        await batch.commit();
        replyQuill.root.innerHTML = '';
        const totalPostsAfter = (await postsRef(currentCategoryId, currentSubcategoryId, currentThreadId).get()).size;
        const lastPage = Math.ceil(totalPostsAfter / POSTS_PER_PAGE);
        await navigateToPosts(currentCategoryId, currentSubcategoryId, currentThreadId, lastPage);
    } catch (error) { 
        alert('Erro ao responder: ' + error.message);
        console.error(error);
    }
    finally { if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Enviar Resposta'; } submitLocks.delete(`createReply_${currentThreadId}_${currentUser?.uid}`); }
}

function showCommentForm(postId) {
    if (isBanned) { alert('Sua conta está banida.'); return; }
    const formDiv = document.getElementById(`comment-form-${postId}`);
    if (formDiv) formDiv.style.display = formDiv.style.display === 'none' ? 'block' : 'none';
}

async function submitComment(postId) {
    if (!currentUser || isBanned) { 
        if (isBanned) alert('Sua conta está banida.'); 
        else showLoginModal(); 
        return; 
    }
    
    if (!currentCategoryId || !currentSubcategoryId || !currentThreadId || !postId) {
        alert('Erro: Dados do tópico não encontrados. Recarregue a página e tente novamente.');
        console.error('IDs faltando:', { currentCategoryId, currentSubcategoryId, currentThreadId, postId });
        return;
    }
    
    const content = document.getElementById(`comment-content-${postId}`).value;
    if (!content.trim()) { 
        alert('Digite o comentário'); 
        return; 
    }
    
    const lockKey = `comment_${currentThreadId}_${postId}_${currentUser?.uid}`;
    if (isLocked(lockKey)) { 
        alert('Aguarde um momento antes de enviar outro comentário...'); 
        return; 
    }
    lock(lockKey, 2000);
    
    const submitBtn = document.querySelector(`#comment-form-${postId} .btn-primary`);
    let originalText = '';
    if (submitBtn) {
        originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Enviando...';
    }
    
    try {
        const commentId = Date.now().toString();
        const commentRef = commentsRef(
            currentCategoryId, 
            currentSubcategoryId, 
            currentThreadId, 
            postId
        ).doc(commentId);
        
        await commentRef.set({
            content: content,
            authorId: currentUser.uid,
            authorName: currentUser.displayName || currentUser.email,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        document.getElementById(`comment-content-${postId}`).value = '';
        document.getElementById(`comment-form-${postId}`).style.display = 'none';
        await loadComments(currentCategoryId, currentSubcategoryId, currentThreadId, postId);
        
    } catch (error) { 
        alert('Erro ao enviar comentário: ' + error.message);
        console.error('Erro detalhado:', error);
    }
    finally { 
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText || 'Enviar Comentário';
        }
        submitLocks.delete(lockKey); 
    }
}

// ============================================
// EDIÇÃO E EXCLUSÃO
// ============================================
async function editPost(postId) {
    if (isBanned) { alert('Sua conta está banida.'); return; }
    if (isLocked(`editPost_${postId}_${currentUser?.uid}`)) { alert('Aguarde um momento...'); return; }
    lock(`editPost_${postId}_${currentUser?.uid}`, 1000);
    const newContent = prompt('Editar conteúdo (HTML):');
    if (newContent && newContent !== 'null') {
        try {
            await postsRef(currentCategoryId, currentSubcategoryId, currentThreadId).doc(postId).update({ content: newContent });
            await navigateToPosts(currentCategoryId, currentSubcategoryId, currentThreadId, currentPage);
        } catch (error) { alert('Erro: ' + error.message); }
    }
    submitLocks.delete(`editPost_${postId}_${currentUser?.uid}`);
}

async function deletePost(postId) {
    if (isBanned) { alert('Sua conta está banida.'); return; }
    if (confirm('Tem certeza que deseja excluir este post?')) {
        try {
            await postsRef(currentCategoryId, currentSubcategoryId, currentThreadId).doc(postId).delete();
            const totalPostsAfter = (await postsRef(currentCategoryId, currentSubcategoryId, currentThreadId).get()).size;
            const newTotalPages = Math.ceil(totalPostsAfter / POSTS_PER_PAGE);
            let newPage = currentPage;
            if (currentPage > newTotalPages && newTotalPages > 0) newPage = newTotalPages;
            await navigateToPosts(currentCategoryId, currentSubcategoryId, currentThreadId, newPage);
        } catch (error) { alert('Erro: ' + error.message); }
    }
}

async function updateCounts(categoryId, subcategoryId) {
    try {
        const threadsSnapshot = await threadsRef(categoryId, subcategoryId).get();
        const threadsCount = threadsSnapshot.size;
        let postsCount = 0;
        for (const doc of threadsSnapshot.docs) {
            const postsSnapshot = await postsRef(categoryId, subcategoryId, doc.id).get();
            postsCount += postsSnapshot.size;
        }
        await subcategoriesRef(categoryId).doc(subcategoryId).update({ threadsCount, postsCount });
        const subcategoriesSnapshot = await subcategoriesRef(categoryId).get();
        let totalThreads = 0;
        for (const doc of subcategoriesSnapshot.docs) totalThreads += (doc.data().threadsCount || 0);
        await categoriesRef().doc(categoryId).update({ threadsCount: totalThreads });
    } catch (error) { console.error('Erro ao atualizar contagens:', error); }
}

// ============================================
// ADMIN
// ============================================
function showAdminPanel() {
    if (!isAdmin) { alert('Acesso restrito a administradores'); return; }
    const container = document.getElementById('main-container');
    container.innerHTML = `
        <div class="admin-panel">
            <h2>Painel Administrativo</h2>
            <div style="display: flex; gap: 15px; margin: 20px 0; flex-wrap: wrap;">
                <button class="btn-primary" onclick="showCreateCategory()">Criar Categoria</button>
                <button class="btn-secondary" onclick="showAdminStats()">Ver Estatísticas</button>
            </div>
            <div id="admin-stats"></div>
        </div>
    `;
    showAdminStats();
}

async function showAdminStats() {
    try {
        const categoriesSnapshot = await categoriesRef().get();
        let categories = categoriesSnapshot.size;
        let subcategories = 0, threads = 0, posts = 0;
        for (const catDoc of categoriesSnapshot.docs) {
            const subSnapshot = await subcategoriesRef(catDoc.id).get();
            subcategories += subSnapshot.size;
            for (const subDoc of subSnapshot.docs) {
                const threadsSnapshot = await threadsRef(catDoc.id, subDoc.id).get();
                threads += threadsSnapshot.size;
                for (const threadDoc of threadsSnapshot.docs) {
                    const postsSnapshot = await postsRef(catDoc.id, subDoc.id, threadDoc.id).get();
                    posts += postsSnapshot.size;
                }
            }
        }
        document.getElementById('admin-stats').innerHTML = `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px,1fr)); gap:15px; margin-top:15px;">
                <div style="background:#f8f9fa; padding:20px; border-radius:12px; text-align:center;">
                    <div style="font-size:2em;">📁</div><div style="font-size:1.5em; font-weight:bold;">${categories}</div><div>Categorias</div>
                </div>
                <div style="background:#f8f9fa; padding:20px; border-radius:12px; text-align:center;">
                    <div style="font-size:2em;">📌</div><div style="font-size:1.5em; font-weight:bold;">${subcategories}</div><div>Subcategorias</div>
                </div>
                <div style="background:#f8f9fa; padding:20px; border-radius:12px; text-align:center;">
                    <div style="font-size:2em;">💬</div><div style="font-size:1.5em; font-weight:bold;">${threads}</div><div>Tópicos</div>
                </div>
                <div style="background:#f8f9fa; padding:20px; border-radius:12px; text-align:center;">
                    <div style="font-size:2em;">📝</div><div style="font-size:1.5em; font-weight:bold;">${posts}</div><div>Posts</div>
                </div>
            </div>
        `;
    } catch (error) { document.getElementById('admin-stats').innerHTML = `<p>Erro: ${error.message}</p>`; }
}

function showCreateCategory() {
    document.getElementById('post-modal-title').innerHTML = 'Criar Categoria';
    document.getElementById('post-modal-body').innerHTML = `
        <form id="create-category-form">
            <div class="form-group"><label>Nome da Categoria</label><input type="text" id="cat-name" required></div>
            <div class="form-group"><label>Descrição</label><textarea id="cat-description" rows="3" style="width:100%; padding:10px; border:1px solid #ddd; border-radius:8px;"></textarea></div>
            <div class="form-group"><label>Ícone (emoji)</label><input type="text" id="cat-icon" placeholder="📁"></div>
            <div class="form-group"><label>Ordem</label><input type="number" id="cat-order" value="0"></div>
            <button type="submit" class="btn-primary" style="width:100%">Criar Categoria</button>
        </form>
    `;
    let isSubmitting = false;
    document.getElementById('create-category-form').onsubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting) return; isSubmitting = true;
        const submitBtn = e.target.querySelector('.btn-primary');
        if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Criando...'; }
        try {
            await categoriesRef().add({
                name: document.getElementById('cat-name').value,
                description: document.getElementById('cat-description').value,
                icon: document.getElementById('cat-icon').value || '📁',
                order: parseInt(document.getElementById('cat-order').value) || 0,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                subcategoriesCount: 0, threadsCount: 0
            });
            alert('Categoria criada com sucesso!');
            document.getElementById('post-modal').classList.remove('show');
            navigateToHome();
        } catch (error) { alert('Erro: ' + error.message); }
        finally { isSubmitting = false; if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Criar Categoria'; } }
    };
    document.getElementById('post-modal').classList.add('show');
}

function showCreateSubcategory(categoryId) {
    document.getElementById('post-modal-title').innerHTML = 'Criar Subcategoria';
    document.getElementById('post-modal-body').innerHTML = `
        <form id="create-subcategory-form">
            <div class="form-group"><label>Nome da Subcategoria</label><input type="text" id="sub-name" required></div>
            <div class="form-group"><label>Descrição</label><textarea id="sub-description" rows="3" style="width:100%; padding:10px; border:1px solid #ddd; border-radius:8px;"></textarea></div>
            <div class="form-group"><label>Ícone (emoji)</label><input type="text" id="sub-icon" placeholder="📌"></div>
            <div class="form-group"><label>Ordem</label><input type="number" id="sub-order" value="0"></div>
            <button type="submit" class="btn-primary" style="width:100%">Criar Subcategoria</button>
        </form>
    `;
    let isSubmitting = false;
    document.getElementById('create-subcategory-form').onsubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting) return; isSubmitting = true;
        const submitBtn = e.target.querySelector('.btn-primary');
        if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Criando...'; }
        try {
            await subcategoriesRef(categoryId).add({
                name: document.getElementById('sub-name').value,
                description: document.getElementById('sub-description').value,
                icon: document.getElementById('sub-icon').value || '📌',
                order: parseInt(document.getElementById('sub-order').value) || 0,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                threadsCount: 0, postsCount: 0
            });
            const subcategoriesSnapshot = await subcategoriesRef(categoryId).get();
            await categoriesRef().doc(categoryId).update({ subcategoriesCount: subcategoriesSnapshot.size });
            alert('Subcategoria criada com sucesso!');
            document.getElementById('post-modal').classList.remove('show');
            navigateToSubcategories(categoryId);
        } catch (error) { alert('Erro: ' + error.message); }
        finally { isSubmitting = false; if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Criar Subcategoria'; } }
    };
    document.getElementById('post-modal').classList.add('show');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('show');
}

function insertImageToEditor() {
    const url = document.getElementById('image-url').value;
    const alt = document.getElementById('image-alt').value || 'imagem';
    if (!url) { alert('Digite uma URL de imagem'); return; }
    if (threadQuill) {
        const range = threadQuill.getSelection();
        if (range) threadQuill.insertEmbed(range.index, 'image', url);
        else threadQuill.insertEmbed(threadQuill.getLength() - 1, 'image', url);
    } else if (replyQuill) {
        const range = replyQuill.getSelection();
        if (range) replyQuill.insertEmbed(range.index, 'image', url);
        else replyQuill.insertEmbed(replyQuill.getLength() - 1, 'image', url);
    } else {
        alert('Editor não encontrado');
        return;
    }
    closeModal('image-modal');
    document.getElementById('image-url').value = '';
    document.getElementById('image-alt').value = '';
}

// ============================================
// INICIALIZAÇÃO
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    CookieManager.init();
    
    document.getElementById('google-login-btn')?.addEventListener('click', loginWithGoogle);
    document.getElementById('login-form-modal')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('modal-email').value;
        const password = document.getElementById('modal-password').value;
        try {
            const result = await auth.signInWithEmailAndPassword(email, password);
            currentUser = result.user;
            await registerUser(currentUser);
            updateUI();
            closeModal('login-modal');
        } catch (error) { alert('Erro ao fazer login: ' + error.message); }
    });

    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('show'); });
    });

    window.addEventListener('popstate', () => { handleRouting(); });
});

async function handleRouting() {
    if (isBanned) return;
    const params = getURLParams();
    if (params.threadId && params.subcategoryId && params.categoryId) {
        currentCategoryId = params.categoryId; currentSubcategoryId = params.subcategoryId; currentThreadId = params.threadId; currentPage = params.page || 1;
        await showPostsWithPagination(params.categoryId, params.subcategoryId, params.threadId, params.page || 1);
    } else if (params.subcategoryId && params.categoryId) {
        currentCategoryId = params.categoryId; currentSubcategoryId = params.subcategoryId;
        await showThreads(params.categoryId, params.subcategoryId);
    } else if (params.categoryId) {
        currentCategoryId = params.categoryId;
        await showSubcategories(params.categoryId);
    } else {
        await showHome();
    }
}

auth.onAuthStateChanged(async (user) => {
    if (user) {
        currentUser = user;
        await registerUser(user);
        isBanned = await checkIfUserIsBanned(user);
        if (isBanned) { showBannedScreen('Sua conta foi banida por violação das políticas de uso.'); await auth.signOut(); updateUI(); return; }
        isAdmin = ADMIN_UIDS.includes(user.uid) || (await db.collection('users').doc(user.uid).get()).data()?.isAdmin === true;
        updateUI();
        await loadNotifications();
        listenNotifications();
        await handleRouting();
    } else {
        currentUser = null; isBanned = false; isAdmin = false;
        updateUI();
        if (notificationListener) { notificationListener(); notificationListener = null; }
        notifications = []; unreadCount = 0; updateNotificationBadge();
        document.getElementById('bannedOverlay').classList.remove('show');
        document.querySelector('.main-container').style.opacity = '1';
        document.querySelector('.main-container').style.pointerEvents = 'auto';
        document.querySelector('.header').style.opacity = '1';
        document.querySelector('.header').style.pointerEvents = 'auto';
        document.querySelector('.site-footer').style.opacity = '1';
        document.querySelector('.site-footer').style.pointerEvents = 'auto';
        await handleRouting();
    }
});

// Expor funções globalmente
window.navigateToHome = navigateToHome;
window.navigateToSubcategories = navigateToSubcategories;
window.navigateToThreads = navigateToThreads;
window.navigateToPosts = navigateToPosts;
window.goToPage = function(categoryId, subcategoryId, threadId, page) {
    navigateToPosts(categoryId, subcategoryId, threadId, page);
};
window.copyPostLink = copyPostLink;
window.showCreateThread = showCreateThread;
window.showCreateCategory = showCreateCategory;
window.showCreateSubcategory = showCreateSubcategory;
window.showAdminPanel = showAdminPanel;
window.showAdminStats = showAdminStats;
window.showLoginModal = showLoginModal;
window.closeModal = closeModal;
window.loginWithGoogle = loginWithGoogle;
window.logout = logout;
window.logoutBanned = logoutBanned;
window.showCommentForm = showCommentForm;
window.submitComment = submitComment;
window.editPost = editPost;
window.deletePost = deletePost;
window.createThread = createThread;
window.createReply = createReply;
window.toggleNotifications = toggleNotifications;
window.markAllAsRead = markAllAsRead;
window.copyCurrentLink = copyCurrentLink;
window.insertImageToEditor = insertImageToEditor;

console.log('📚 Maspia Forum inicializado com sucesso!');
console.log('🔔 Notificações integradas via coleção "notifications"');
console.log('🍪 Sistema de consentimento de cookies ativo');
