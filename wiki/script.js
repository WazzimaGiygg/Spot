// ============================================
// COOKIE CONSENT MANAGER
// ============================================
const CookieManager = {
    STORAGE_KEY: 'wikizero_cookie_consent',
    
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
let isGuestUser = false;
let isBanned = false;
let allSubcollections = [];
let currentEditingPageUid = null;
let currentEditingArticleId = null;
let notifications = [];
let unreadCount = 0;
let notificationListener = null;

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
    return timestamp.toLocaleString('pt-BR');
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

// ============================================
// FUNÇÃO DE FORMATAÇÃO WIKI PARA HTML
// ============================================
function wikitextToHtml(wikitext) {
    if (!wikitext || typeof wikitext !== 'string') return '';
    
    let html = wikitext;
    
    html = html.replace(/^======(.+?)======/gm, '<h6>$1</h6>');
    html = html.replace(/^=====(.+?)=====/gm, '<h5>$1</h5>');
    html = html.replace(/^====(.+?)====/gm, '<h4>$1</h4>');
    html = html.replace(/^===(.+?)===/gm, '<h3>$1</h3>');
    html = html.replace(/^==(.+?)==/gm, '<h2>$1</h2>');
    html = html.replace(/^=(.+?)=/gm, '<h1>$1</h1>');
    
    html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
    html = html.replace(/~~(.+?)~~/g, '<del>$1</del>');
    
    html = html.replace(/\[\[([^|\]]+)(?:\|([^\]]+))?\]\]/g, (match, target, text) => {
        const displayText = text || target;
        return `<a href="#" class="wiki-link">${escapeHtml(displayText)}</a>`;
    });
    
    html = html.replace(/\[(https?:\/\/[^\s\]]+)\s+([^\]]+)\]/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$2</a>');
    html = html.replace(/\[(https?:\/\/[^\s\]]+)\]/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
    
    let inList = false;
    let listType = '';
    const lines = html.split('\n');
    const processed = [];
    
    for (let line of lines) {
        if (line.match(/^\* /)) {
            if (!inList) { processed.push('<ul>'); inList = true; listType = 'ul'; }
            processed.push(`<li>${line.replace(/^\* /, '')}</li>`);
        } else if (line.match(/^# /)) {
            if (!inList) { processed.push('<ol>'); inList = true; listType = 'ol'; }
            processed.push(`<li>${line.replace(/^# /, '')}</li>`);
        } else {
            if (inList) {
                processed.push(listType === 'ul' ? '</ul>' : '</ol>');
                inList = false;
                listType = '';
            }
            processed.push(line);
        }
    }
    if (inList) processed.push(listType === 'ul' ? '</ul>' : '</ol>');
    html = processed.join('\n');
    
    html = html.replace(/^&gt;(.+)$/gm, '<blockquote>$1</blockquote>');
    html = html.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>');
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    const paragraphs = html.split('\n\n');
    html = paragraphs.map(para => {
        para = para.trim();
        if (!para) return '';
        if (para.startsWith('<h') || para.startsWith('<ul') || para.startsWith('<ol') || 
            para.startsWith('<table') || para.startsWith('<blockquote') || para.startsWith('<pre')) {
            return para;
        }
        return `<p>${para}</p>`;
    }).join('\n');
    
    html = html.replace(/\n/g, '<br>');
    html = html.replace(/<p><br><\/p>/g, '');
    
    return html;
}

// ============================================
// REGISTRO DE USUÁRIO
// ============================================
async function registerUser(user) {
    try {
        const uid = user.uid;
        const userDoc = await db.collection('users').doc(uid).get();
        const existingData = userDoc.exists ? userDoc.data() : {};
        
        const userData = {
            uid: uid,
            email: user.email || '',
            name: user.displayName || 'Usuário',
            profilePictureUrl: user.photoURL || '',
            isAdmin: false,
            isBan: existingData.isBan || false,
            isBanned: existingData.isBanned || false,
            isTeacher: false,
            isTeatcher: false,
            createdAt: existingData.createdAt || firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            lastLoginAt: firebase.firestore.FieldValue.serverTimestamp(),
            cookiePreferences: CookieManager.getConsent() || null
        };

        await db.collection('users').doc(uid).set(userData, { merge: true });
        await db.collection('usuários').doc(uid).set(userData, { merge: true });

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
        if (isGuestUser) displayName = '👤 Convidado';
        
        if (currentUser.photoURL) {
            avatar.innerHTML = `<img src="${currentUser.photoURL}" alt="Avatar">`;
        } else {
            avatar.textContent = getInitials(displayName);
        }
        name.textContent = displayName.length > 20 ? displayName.substring(0,17)+'...' : displayName;
        email.textContent = currentUser.email || '';
        let badges = '';
        if (isBanned) badges += '<span class="badge-banned">🚫 Banido</span> ';
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
        updateUI();
        closeLoginModal();
        await loadNotifications();
        listenNotifications();
        location.reload();
    } catch (error) {
        console.error('Erro no login:', error);
        alert('Erro ao fazer login: ' + error.message);
    }
}

// ============================================
// FUNÇÃO DE LOGOUT
// ============================================
async function logout() {
    try {
        if (isGuestUser) {
            clearGuestUser();
            currentUser = null;
            isGuestUser = false;
            isBanned = false;
            if (notificationListener) { notificationListener(); notificationListener = null; }
            notifications = [];
            unreadCount = 0;
            updateNotificationBadge();
            updateUI();
            location.reload();
            return;
        }
        
        if (auth.currentUser) {
            await auth.signOut();
        }
        
        currentUser = null;
        isBanned = false;
        isGuestUser = false;
        if (notificationListener) { notificationListener(); notificationListener = null; }
        notifications = [];
        unreadCount = 0;
        updateNotificationBadge();
        updateUI();
        location.reload();
    } catch (error) {
        console.error('Erro no logout:', error);
        alert('Erro ao sair: ' + error.message);
    }
}

// ============================================
// FUNÇÕES DE CONVIDADO
// ============================================
function generateGuestUID() {
    let hex = '';
    for (let i = 0; i < 32; i++) hex += Math.floor(Math.random() * 16).toString(16);
    return 'convid_' + hex;
}

function createGuestUser() {
    const guestUID = generateGuestUID();
    const expiry = Date.now() + (24 * 60 * 60 * 1000);
    const guestUser = { uid: guestUID, displayName: 'Convidado', email: `${guestUID}@guest.wikizero.local`, isGuest: true };
    localStorage.setItem('wikizero_guest_user', JSON.stringify(guestUser));
    localStorage.setItem('wikizero_guest_expiry', expiry.toString());
    return guestUser;
}

function getStoredGuestUser() {
    const expiry = localStorage.getItem('wikizero_guest_expiry');
    if (expiry && Date.now() < parseInt(expiry)) {
        const stored = localStorage.getItem('wikizero_guest_user');
        if (stored) return JSON.parse(stored);
    }
    return null;
}

function clearGuestUser() {
    localStorage.removeItem('wikizero_guest_user');
    localStorage.removeItem('wikizero_guest_expiry');
}

function guestLogin() {
    const guestUser = createGuestUser();
    currentUser = guestUser;
    isGuestUser = true;
    updateUI();
    document.getElementById('login-modal').classList.remove('show');
    loadSubcollections();
}

// ============================================
// VIEWS
// ============================================
function showListView() {
    document.querySelectorAll('.article-view').forEach(v => v.classList.remove('active'));
    document.getElementById('list-view').classList.add('active');
}

function showCreateView() {
    if (isGuestUser) { alert('Modo convidado: faça login para criar.'); return; }
    document.querySelectorAll('.article-view').forEach(v => v.classList.remove('active'));
    document.getElementById('create-view').classList.add('active');
}

function showSecurityView() {
    document.querySelectorAll('.article-view').forEach(v => v.classList.remove('active'));
    document.getElementById('security-view').classList.add('active');
    const uidDisplay = document.getElementById('user-uid-display');
    if (uidDisplay && currentUser) {
        uidDisplay.innerHTML = isGuestUser ? `<strong>Modo Convidado</strong><br>UID: ${currentUser.uid}` : `<strong>Usuário</strong><br>${currentUser.email}`;
    }
}

function showDonationView() {
    document.querySelectorAll('.article-view').forEach(v => v.classList.remove('active'));
    document.getElementById('donation-view').classList.add('active');
}

function showPrivacyView() {
    document.querySelectorAll('.article-view').forEach(v => v.classList.remove('active'));
    document.getElementById('privacy-view').classList.add('active');
}

function showTermsView() {
    document.querySelectorAll('.article-view').forEach(v => v.classList.remove('active'));
    document.getElementById('terms-view').classList.add('active');
}

function showRandomPage() {
    if (allSubcollections.length > 0) {
        openSubcollection(allSubcollections[Math.floor(Math.random() * allSubcollections.length)].uid);
    } else { alert('Nenhuma página disponível.'); }
}

function showMyDataModal() {
    if (!currentUser || isGuestUser) { alert('Faça login.'); return; }
    document.getElementById('modal-title').innerHTML = '📋 Meus Dados';
    document.getElementById('modal-body').innerHTML = `
        <p><strong>Nome:</strong> ${escapeHtml(currentUser.displayName || '-')}</p>
        <p><strong>Email:</strong> ${escapeHtml(currentUser.email)}</p>
        <p><strong>UID:</strong> <code>${currentUser.uid}</code></p>
        <p><strong>Tipo:</strong> ${isGuestUser ? 'Convidado' : 'Usuário registrado'}</p>
    `;
    document.getElementById('modal').classList.add('show');
}

function closeModal() { document.getElementById('modal').classList.remove('show'); }

// ============================================
// CARREGAR PÁGINAS
// ============================================
async function loadSubcollections() {
    const container = document.getElementById('subcollections-container');
    if (!currentUser) { container.innerHTML = '<div class="loading">Faça login</div>'; return; }
    container.innerHTML = '<div class="loading">Carregando...</div>';
    
    try {
        const snapshot = await db.collection('documentos').get();
        const subcollections = [];
        let totalArticles = 0;
        for (const doc of snapshot.docs) {
            const data = doc.data();
            const articlesSnapshot = await db.collection('documentos').doc(doc.id).collection('inevitavel').get();
            totalArticles += articlesSnapshot.size;
            subcollections.push({ uid: doc.id, titulo: data.titulo || doc.id, description: data.descricao || '', articleCount: articlesSnapshot.size });
        }
        allSubcollections = subcollections;
        document.getElementById('total-count').textContent = subcollections.length;
        document.getElementById('total-articles').textContent = totalArticles;
        displaySubcollections(subcollections);
    } catch (error) {
        container.innerHTML = `<div class="loading">Erro: ${error.message}</div>`;
    }
}

function displaySubcollections(subcollections) {
    const container = document.getElementById('subcollections-container');
    if (subcollections.length === 0) { container.innerHTML = '<div class="loading">Nenhuma página</div>'; return; }
    container.innerHTML = `<div class="subcollections-grid">${subcollections.map(sub => `
        <div class="subcollection-card" onclick="openSubcollection('${sub.uid}')">
            <div class="subcollection-icon">📚</div>
            <div class="subcollection-name">${escapeHtml(sub.titulo)}</div>
            <div class="subcollection-meta"><span class="article-count">📄 ${sub.articleCount} ${sub.articleCount === 1 ? 'artigo' : 'artigos'}</span></div>
            ${sub.description ? `<div style="font-size:0.8em; margin-top:10px; color:#666;">${escapeHtml(sub.description.substring(0,80))}${sub.description.length>80?'...':''}</div>` : ''}
            <div style="margin-top: 10px;"><button class="btn-abrir-painel" style="font-size:0.7em; padding:5px 10px;" onclick="event.stopPropagation(); openEditor('${sub.uid}', null)">✏️ Editar Página</button></div>
        </div>
    `).join('')}</div>`;
}

// ============================================
// ABRIR PÁGINA E ARTIGOS
// ============================================
window.openSubcollection = async function(uid) {
    const articleView = document.getElementById('article-view');
    const listView = document.getElementById('list-view');
    const articleContent = document.getElementById('article-content');
    articleContent.innerHTML = '<div class="loading">Carregando...</div>';
    listView.classList.remove('active');
    articleView.classList.add('active');
    
    try {
        const docRef = db.collection('documentos').doc(uid);
        const doc = await docRef.get();
        if (!doc.exists) { articleContent.innerHTML = '<div class="loading">Página não encontrada</div>'; return; }
        const data = doc.data();
        const articlesSnapshot = await docRef.collection('inevitavel').get();
        const articles = [];
        articlesSnapshot.forEach(articleDoc => {
            articles.push({ id: articleDoc.id, titulo: articleDoc.data().titulo, descricao: articleDoc.data().descricao ? articleDoc.data().descricao.substring(0,100)+'...' : 'Sem descrição' });
        });
        
        articleContent.innerHTML = `
            <h1>${escapeHtml(data.titulo || uid)}</h1>
            <div class="article-meta"><p><strong>UID:</strong> ${escapeHtml(uid)}</p><p><strong>Categoria:</strong> ${escapeHtml(data.categoria || 'Geral')}</p><p><strong>Artigos:</strong> ${articles.length}</p></div>
            <div style="margin:20px 0;"><h2>Sobre</h2><p>${escapeHtml(data.descricao || 'Sem descrição.')}</p></div>
            <h2>Artigos</h2>
            ${articles.length === 0 ? '<p style="text-align:center;padding:30px;">Nenhum artigo.</p>' : `<div class="subcollections-grid">${articles.map(article => `
                <div class="subcollection-card" onclick="openArticle('${uid}', '${article.id}')">
                    <div class="subcollection-icon">📄</div>
                    <div class="subcollection-name">${escapeHtml(article.titulo)}</div>
                    <div class="subcollection-meta">${escapeHtml(article.descricao)}</div>
                    <div style="margin-top:10px;"><button class="btn-abrir-painel" style="font-size:0.7em; padding:5px 10px;" onclick="event.stopPropagation(); openEditor('${uid}', '${article.id}')">✏️ Editar</button></div>
                </div>
            `).join('')}</div>`}
            ${!isGuestUser ? `<div style="margin-top:30px; padding:20px; background:#eaf3ff; border-radius:8px; text-align:center;">
                <button onclick="openEditor('${uid}', null)" class="btn-abrir-painel">📝 Editar Página</button>
                <button onclick="openEditor('${uid}', 'novo')" class="btn-abrir-painel" style="margin-left:10px; background-color:#28a745;">➕ Novo Artigo</button>
            </div>` : '<p style="margin-top:30px; text-align:center; color:#666;">Modo convidado: faça login para editar.</p>'}
        `;
    } catch (error) { articleContent.innerHTML = `<div class="loading">Erro: ${error.message}</div>`; }
};

window.openArticle = async function(collectionUid, articleId) {
    try {
        const articleRef = db.collection('documentos').doc(collectionUid).collection('inevitavel').doc(articleId);
        const article = await articleRef.get();
        if (!article.exists) { alert('Artigo não encontrado'); return; }
        const data = article.data();
        const formattedContent = wikitextToHtml(data.descricao || 'Sem conteúdo.');
        
        document.getElementById('modal-title').innerHTML = `📄 ${escapeHtml(data.titulo)}`;
        document.getElementById('modal-body').innerHTML = `
            <div class="wiki-content-rendered">
                <div style="margin-bottom:15px; padding-bottom:10px; border-bottom:1px solid #ccc; font-size:0.85em; color:#666;">
                    📅 Criado: ${data.dataCriacao ? formatDate(data.dataCriacao) : 'Data desconhecida'}
                    ${data.criadorNome ? `<br>👤 Criado por: ${escapeHtml(data.criadorNome)}` : ''}
                </div>
                ${formattedContent}
            </div>
            ${!isGuestUser ? `<div style="margin-top:20px; text-align:center;"><button onclick="document.getElementById('modal').classList.remove('show'); openEditor('${collectionUid}', '${articleId}')" class="btn-abrir-painel">✏️ Editar</button></div>` : ''}
        `;
        document.getElementById('modal').classList.add('show');
    } catch (error) { alert('Erro: ' + error.message); }
};

// ============================================
// EDITOR INTEGRADO
// ============================================
async function openEditor(pageUid, articleId) {
    if (isGuestUser) { alert('Faça login para editar.'); return; }
    currentEditingPageUid = pageUid;
    
    await loadArticleList(pageUid);
    
    if (articleId === 'novo') {
        currentEditingArticleId = null;
        document.getElementById('editor-article-title').value = '';
        document.getElementById('editor-article-content').value = '';
        document.getElementById('editor-article-description').value = '';
        document.getElementById('editor-title').innerHTML = `📝 Criando novo artigo em ${escapeHtml(pageUid)}`;
        document.getElementById('editor-preview').innerHTML = '<em>Pré-visualização aparecerá aqui</em>';
    } else if (articleId) {
        currentEditingArticleId = articleId;
        await loadArticleData(pageUid, articleId);
        document.getElementById('editor-title').innerHTML = `📝 Editando artigo em ${escapeHtml(pageUid)}`;
    } else {
        currentEditingArticleId = null;
        document.getElementById('editor-article-title').value = '';
        document.getElementById('editor-article-content').value = '';
        document.getElementById('editor-article-description').value = '';
        document.getElementById('editor-title').innerHTML = `📝 Editando página: ${escapeHtml(pageUid)}`;
        document.getElementById('editor-preview').innerHTML = '<em>Pré-visualização aparecerá aqui</em>';
    }
    
    document.getElementById('editor-modal').classList.add('show');
    
    const contentTextarea = document.getElementById('editor-article-content');
    const updatePreview = () => {
        const content = contentTextarea.value;
        const previewHtml = wikitextToHtml(content);
        document.getElementById('editor-preview').innerHTML = previewHtml || '<em>Sem conteúdo para pré-visualizar</em>';
    };
    contentTextarea.oninput = updatePreview;
    updatePreview();
}

async function loadArticleList(pageUid) {
    const container = document.getElementById('editor-article-list');
    try {
        const snapshot = await db.collection('documentos').doc(pageUid).collection('inevitavel').get();
        const articles = [];
        snapshot.forEach(doc => articles.push({ id: doc.id, titulo: doc.data().titulo }));
        
        if (articles.length === 0) {
            container.innerHTML = '<p style="text-align:center; color:#999; padding:20px;">Nenhum artigo ainda</p>';
        } else {
            container.innerHTML = articles.map(art => `
                <div class="article-list-item" onclick="openEditor('${pageUid}', '${art.id}')">
                    <span>📄 ${escapeHtml(art.titulo)}</span>
                    <span class="delete-article-btn" onclick="event.stopPropagation(); deleteArticle('${pageUid}', '${art.id}')">🗑️</span>
                </div>
            `).join('');
        }
    } catch (error) {
        container.innerHTML = `<p>Erro: ${error.message}</p>`;
    }
}

async function loadArticleData(pageUid, articleId) {
    try {
        const doc = await db.collection('documentos').doc(pageUid).collection('inevitavel').doc(articleId).get();
        if (doc.exists) {
            const data = doc.data();
            document.getElementById('editor-article-title').value = data.titulo || '';
            document.getElementById('editor-article-content').value = data.descricao || '';
            document.getElementById('editor-article-description').value = data.resumo || '';
            const previewHtml = wikitextToHtml(data.descricao || '');
            document.getElementById('editor-preview').innerHTML = previewHtml || '<em>Sem conteúdo</em>';
        }
    } catch (error) {
        alert('Erro ao carregar: ' + error.message);
    }
}

async function saveArticle() {
    if (!currentEditingPageUid) { alert('Erro: página não identificada'); return; }
    
    const title = document.getElementById('editor-article-title').value.trim();
    const content = document.getElementById('editor-article-content').value;
    const description = document.getElementById('editor-article-description').value;
    
    if (!title && currentEditingArticleId !== null) { alert('Digite um título'); return; }
    
    const saveBtn = document.getElementById('editor-save-btn');
    saveBtn.disabled = true;
    saveBtn.textContent = '💾 Salvando...';
    
    try {
        if (currentEditingArticleId) {
            await db.collection('documentos').doc(currentEditingPageUid).collection('inevitavel').doc(currentEditingArticleId).update({
                titulo: title,
                descricao: content,
                resumo: description,
                ultimaEdicao: firebase.firestore.FieldValue.serverTimestamp(),
                editorId: currentUser.uid,
                editorNome: currentUser.displayName
            });
            alert('✅ Artigo atualizado!');
        } else if (title) {
            const newId = title.toLowerCase().replace(/[^a-z0-9_]/g, '_') + '_' + Date.now();
            await db.collection('documentos').doc(currentEditingPageUid).collection('inevitavel').doc(newId).set({
                titulo: title,
                descricao: content,
                resumo: description,
                criadorEmail: currentUser.email,
                criadorNome: currentUser.displayName,
                criadorUid: currentUser.uid,
                dataCriacao: firebase.firestore.FieldValue.serverTimestamp(),
                ultimaEdicao: firebase.firestore.FieldValue.serverTimestamp()
            });
            alert('✅ Novo artigo criado!');
        } else {
            alert('Digite um título para o artigo');
            saveBtn.disabled = false;
            saveBtn.textContent = '💾 Salvar';
            return;
        }
        
        await loadArticleList(currentEditingPageUid);
        
        if (!confirm('Salvo com sucesso! Deseja continuar editando?')) {
            document.getElementById('editor-modal').classList.remove('show');
            await openSubcollection(currentEditingPageUid);
        }
    } catch (error) {
        alert('Erro: ' + error.message);
    } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = '💾 Salvar';
    }
}

async function deleteArticle(pageUid, articleId) {
    if (confirm('Tem certeza que deseja excluir este artigo permanentemente?')) {
        try {
            await db.collection('documentos').doc(pageUid).collection('inevitavel').doc(articleId).delete();
            alert('Artigo excluído!');
            await loadArticleList(pageUid);
            if (currentEditingArticleId === articleId) {
                currentEditingArticleId = null;
                document.getElementById('editor-article-title').value = '';
                document.getElementById('editor-article-content').value = '';
                document.getElementById('editor-article-description').value = '';
                document.getElementById('editor-preview').innerHTML = '<em>Sem conteúdo</em>';
            }
        } catch (error) {
            alert('Erro: ' + error.message);
        }
    }
}

function closeEditor() {
    document.getElementById('editor-modal').classList.remove('show');
    currentEditingPageUid = null;
    currentEditingArticleId = null;
}

function openHelperEditor() {
    window.open('https://wiki.wazzimagiygg.com/pages/editor/', '_blank');
}

// ============================================
// EVENT LISTENERS
// ============================================
document.getElementById('create-subcollection-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (isGuestUser) { alert('Faça login para criar.'); return; }
    const uid = document.getElementById('sub-name').value.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
    const titulo = document.getElementById('sub-title').value.trim();
    const descricao = document.getElementById('sub-description').value.trim();
    const categoria = document.getElementById('sub-category').value.trim() || 'Geral';
    if (!uid || !titulo) { alert('Preencha os campos.'); return; }
    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true; submitBtn.textContent = 'Criando...';
    try {
        const docRef = db.collection('documentos').doc(uid);
        if ((await docRef.get()).exists) { alert(`Página "${uid}" já existe!`); submitBtn.disabled = false; submitBtn.textContent = 'Criar Página'; return; }
        await docRef.set({ uid, titulo, descricao, categoria, criadoEm: firebase.firestore.FieldValue.serverTimestamp(), criadoPor: currentUser.uid, criadoPorNome: currentUser.displayName || 'Usuário', status: 'ativo' });
        alert(`✅ Página "${titulo}" criada!`);
        document.getElementById('create-subcollection-form').reset();
        loadSubcollections();
        const editNow = confirm(`Deseja adicionar conteúdo à página "${titulo}" agora?`);
        if (editNow) { openEditor(uid, 'novo'); } else { showListView(); }
    } catch (error) { alert('Erro: ' + error.message); }
    finally { submitBtn.disabled = false; submitBtn.textContent = 'Criar Página'; }
});

document.getElementById('search-btn')?.addEventListener('click', () => {
    const term = document.getElementById('search-input').value.toLowerCase().trim();
    if (!term) displaySubcollections(allSubcollections);
    else displaySubcollections(allSubcollections.filter(sub => sub.titulo.toLowerCase().includes(term) || (sub.description && sub.description.toLowerCase().includes(term))));
});

document.getElementById('random-btn')?.addEventListener('click', showRandomPage);
document.getElementById('google-login-btn')?.addEventListener('click', loginWithGoogle);
document.getElementById('guest-login-btn')?.addEventListener('click', guestLogin);

// Editor eventos
document.getElementById('editor-save-btn')?.addEventListener('click', saveArticle);
document.getElementById('editor-close-btn')?.addEventListener('click', closeEditor);
document.getElementById('editor-new-article-btn')?.addEventListener('click', () => { if (currentEditingPageUid) openEditor(currentEditingPageUid, 'novo'); });
document.getElementById('open-helper-editor')?.addEventListener('click', openHelperEditor);
document.getElementById('editor-helper-btn')?.addEventListener('click', openHelperEditor);

// Menu lateral
const sideMenu = document.getElementById('sidebar-menu');
const menuToggle = document.getElementById('menu-toggle-btn');
let isCollapsed = false;
if (menuToggle) {
    menuToggle.addEventListener('click', () => {
        isCollapsed = !isCollapsed;
        if (isCollapsed) { sideMenu.classList.add('collapsed'); menuToggle.innerHTML = '▶'; }
        else { sideMenu.classList.remove('collapsed'); menuToggle.innerHTML = '◀'; }
    });
}

// Fechar modais ao clicar fora
document.querySelectorAll('.modal, .editor-modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('show');
        }
    });
});

// ============================================
// INICIALIZAÇÃO
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    CookieManager.init();
});

auth.onAuthStateChanged(async (user) => {
    if (user) {
        currentUser = user;
        isGuestUser = false;
        clearGuestUser();
        
        await registerUser(user);
        isBanned = await checkIfUserIsBanned(user);
        if (isBanned) { showBannedScreen('Sua conta foi banida.'); await auth.signOut(); updateUI(); return; }
        
        updateUI();
        await loadNotifications();
        listenNotifications();
        loadSubcollections();
    } else {
        const guestUser = getStoredGuestUser();
        if (guestUser) {
            currentUser = guestUser;
            isGuestUser = true;
            updateUI();
            loadSubcollections();
        } else {
            currentUser = null;
            isGuestUser = false;
            isBanned = false;
            updateUI();
            if (notificationListener) { notificationListener(); notificationListener = null; }
            notifications = [];
            unreadCount = 0;
            updateNotificationBadge();
            loadSubcollections();
        }
    }
});

// Expor funções globalmente
window.showListView = showListView;
window.showRandomPage = showRandomPage;
window.showCreateView = showCreateView;
window.showSecurityView = showSecurityView;
window.showDonationView = showDonationView;
window.showPrivacyView = showPrivacyView;
window.showTermsView = showTermsView;
window.showMyDataModal = showMyDataModal;
window.openSubcollection = openSubcollection;
window.openArticle = openArticle;
window.openEditor = openEditor;
window.closeEditor = closeEditor;
window.closeModal = closeModal;
window.deleteArticle = deleteArticle;
window.openHelperEditor = openHelperEditor;
window.logout = logout;
window.logoutBanned = logoutBanned;
window.toggleNotifications = toggleNotifications;
window.markAllAsRead = markAllAsRead;
window.showLoginModal = showLoginModal;
window.loginWithGoogle = loginWithGoogle;

console.log('📚 WikiZero inicializada com sucesso!');
console.log('🔔 Notificações integradas via coleção "notifications"');
console.log('🍪 Sistema de consentimento de cookies ativo');
