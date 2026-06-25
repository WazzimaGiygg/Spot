// ============================================
// COOKIE CONSENT MANAGER
// ============================================
const CookieManager = {
    STORAGE_KEY: 'blog_cookie_consent',
    
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
            toast.classList.add('show');
            clearTimeout(toast._timeout);
            toast._timeout = setTimeout(() => {
                toast.classList.remove('show');
            }, 3000);
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
    appId: "1:249427877153:web:0e4297294794a5aadeb260",
    measurementId: "G-PLKNZNFCQ8"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// ============================================
// VARIÁVEIS GLOBAIS
// ============================================
let currentUser = null;
let isAdmin = false;
let isBanned = false;
let currentUid = null;
let urlUid = null;
let isHtmlMode = true;
let previewTimeout = null;
let notifications = [];
let unreadCount = 0;
let notificationListener = null;

const ADMIN_UIDS = ['sZxfMuOBPbXdR8nttVPXIN8QOOl1', '6aPqWVh8JVYL5NqEb78iDGPD7dH3'];

// ============================================
// ELEMENTOS DOM
// ============================================
const mainContainer = document.getElementById('main-container');
const userAvatar = document.getElementById('userAvatar');
const userName = document.getElementById('userName');
const userEmail = document.getElementById('userEmail');
const userBadge = document.getElementById('userBadge');
const btnLogin = document.getElementById('btnLogin');
const btnLogout = document.getElementById('btnLogout');
const bannedOverlay = document.getElementById('bannedOverlay');
const toast = document.getElementById('toast');

// ============================================
// UTILIDADES
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

function getUrlParams() {
    const params = new URLSearchParams(window.location.search);
    return { uid: params.get('uid'), info: params.has('info') };
}

function getBlogUrl(uid) {
    const baseUrl = window.location.origin + window.location.pathname;
    return `${baseUrl}?uid=${uid}`;
}

function showToast(message, duration = 3000) {
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => {
        toast.classList.remove('show');
    }, duration);
}

// ============================================
// COMPARTILHAMENTO
// ============================================
function shareBlog(uid, platform) {
    const url = getBlogUrl(uid);
    const title = `Blog de ${uid.substring(0, 12)}... - WazzimaGiygg Blog`;
    
    let shareUrl = '';
    switch(platform) {
        case 'whatsapp':
            shareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(title + '\n' + url)}`;
            break;
        case 'twitter':
            shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`;
            break;
        case 'facebook':
            shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(title)}`;
            break;
        case 'linkedin':
            shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
            break;
        case 'telegram':
            shareUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;
            break;
        case 'email':
            shareUrl = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent('Confira este blog:\n\n' + url)}`;
            break;
        case 'copy':
        default:
            navigator.clipboard.writeText(url).then(() => {
                showToast('✅ Link copiado para a área de transferência!');
            }).catch(() => {
                const textArea = document.createElement('textarea');
                textArea.value = url;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                showToast('✅ Link copiado para a área de transferência!');
            });
            return;
    }
    
    if (shareUrl) {
        window.open(shareUrl, '_blank', 'width=600,height=500');
    }
}

function toggleShareDropdown(event, uid) {
    event.stopPropagation();
    const dropdown = event.currentTarget.querySelector('.share-dropdown-content');
    if (dropdown) {
        dropdown.classList.toggle('show');
        dropdown.dataset.uid = uid;
    }
}

document.addEventListener('click', function(e) {
    document.querySelectorAll('.share-dropdown-content.show').forEach(dropdown => {
        if (!dropdown.closest('.share-dropdown').contains(e.target)) {
            dropdown.classList.remove('show');
        }
    });
});

// ============================================
// AUTENTICAÇÃO
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
        return userData;
    } catch (error) {
        console.error('Erro ao registrar usuário:', error);
        return null;
    }
}

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
    const details = document.getElementById('banDetails');
    details.textContent = `Motivo: ${reason}`;
    bannedOverlay.classList.add('show');
    mainContainer.style.opacity = '0.3';
    mainContainer.style.pointerEvents = 'none';
}

async function logoutBanned() {
    try { await auth.signOut(); location.reload(); } catch (e) { location.reload(); }
}

function updateUI() {
    if (currentUser && !isBanned) {
        let displayName = currentUser.displayName || (currentUser.email ? currentUser.email.split('@')[0] : 'Usuário');
        if (currentUser.photoURL) {
            userAvatar.innerHTML = `<img src="${currentUser.photoURL}" alt="Avatar">`;
        } else {
            userAvatar.textContent = getInitials(displayName);
        }
        userName.textContent = displayName.length > 20 ? displayName.substring(0,17)+'...' : displayName;
        userEmail.textContent = currentUser.email || '';
        let badges = '';
        if (isBanned) badges += '<span class="badge-banned">🚫 Banido</span> ';
        if (isAdmin) badges += '<span class="badge-admin">Admin</span> ';
        userBadge.innerHTML = badges;
        btnLogin.style.display = 'none';
        btnLogout.style.display = 'inline-block';
    } else {
        userAvatar.innerHTML = '👤';
        userName.textContent = 'Visitante';
        userEmail.textContent = '';
        userBadge.innerHTML = '';
        btnLogin.style.display = 'inline-block';
        btnLogout.style.display = 'none';
    }
}

function showLoginModal() { document.getElementById('login-modal').classList.add('show'); }
function closeModal(modalId) { document.getElementById(modalId).classList.remove('show'); }

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
        closeModal('login-modal');
        await loadNotifications();
        listenNotifications();
        renderBlog();
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
        renderBlog();
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
        closeModal('login-modal');
        alert('Conta criada com sucesso!');
    } catch (error) {
        console.error('Erro ao criar conta:', error);
        alert('Erro ao criar conta: ' + error.message);
    }
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
// BLOG - RENDER
// ============================================
function renderBlog() {
    const params = getUrlParams();
    urlUid = params.uid;

    if (isBanned) {
        mainContainer.innerHTML = `<div class="card"><div class="empty-state"><i class="fas fa-ban"></i><p>Sua conta está banida.</p></div></div>`;
        return;
    }

    if (urlUid) {
        renderUserBlog(urlUid);
        return;
    }

    if (currentUser) {
        renderUserBlog(currentUser.uid);
        return;
    }

    mainContainer.innerHTML = `
        <div class="card">
            <div class="empty-state">
                <i class="fas fa-lock"></i>
                <p>Faça login para criar seu blog ou use <code>?uid=UID</code> para ver blogs públicos</p>
            </div>
        </div>
    `;
}

// ============================================
// RENDER USER BLOG
// ============================================
function renderUserBlog(uid) {
    const isOwner = currentUser && uid === currentUser.uid;
    const container = mainContainer;
    const blogUrl = getBlogUrl(uid);

    const postsRef = db.collection('blog').doc(uid).collection('posts');
    postsRef.orderBy('createdAt', 'desc').get()
        .then(async (snapshot) => {
            let html = `
                <div class="card">
                    <div class="flex-between">
                        <div>
                            <h2><i class="fas fa-user"></i> Blog de ${uid.substring(0, 12)}...</h2>
                            <span class="text-muted">${isOwner ? 'Seu blog' : 'Blog público'}</span>
                        </div>
                        <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                            <span class="badge">${snapshot.size} posts</span>
                            <div class="share-dropdown" onclick="toggleShareDropdown(event, '${uid}')">
                                <button class="btn btn-share btn-sm">
                                    <i class="fas fa-share-alt"></i> Compartilhar
                                </button>
                                <div class="share-dropdown-content" data-uid="${uid}">
                                    <button class="btn" onclick="shareBlog('${uid}', 'whatsapp')">
                                        <i class="fab fa-whatsapp" style="color:#25D366;"></i> WhatsApp
                                    </button>
                                    <button class="btn" onclick="shareBlog('${uid}', 'twitter')">
                                        <i class="fab fa-twitter" style="color:#1DA1F2;"></i> Twitter
                                    </button>
                                    <button class="btn" onclick="shareBlog('${uid}', 'facebook')">
                                        <i class="fab fa-facebook" style="color:#1877F2;"></i> Facebook
                                    </button>
                                    <button class="btn" onclick="shareBlog('${uid}', 'linkedin')">
                                        <i class="fab fa-linkedin" style="color:#0A66C2;"></i> LinkedIn
                                    </button>
                                    <button class="btn" onclick="shareBlog('${uid}', 'telegram')">
                                        <i class="fab fa-telegram" style="color:#26A5E4;"></i> Telegram
                                    </button>
                                    <button class="btn" onclick="shareBlog('${uid}', 'email')">
                                        <i class="fas fa-envelope" style="color:#6c757d;"></i> E-mail
                                    </button>
                                    <button class="btn" onclick="shareBlog('${uid}', 'copy')">
                                        <i class="fas fa-copy" style="color:#6c757d;"></i> Copiar link
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div style="margin-top: 8px; display: flex; gap: 8px; flex-wrap: wrap;">
                        <code style="background: #f1f5f9; padding: 0.3rem 0.8rem; border-radius: 6px; font-size: 0.8rem; word-break: break-all;">
                            🔗 ${blogUrl}
                        </code>
                        <button class="btn btn-outline btn-sm" onclick="shareBlog('${uid}', 'copy')">
                            <i class="fas fa-copy"></i> Copiar
                        </button>
                    </div>
                </div>
            `;

            if (isOwner) {
                html += `
                    <div class="card">
                        <h3><i class="fas fa-pen"></i> Novo Post</h3>
                        <div class="editor-container" id="postForm">
                            <div class="editor-input">
                                <input type="text" id="postTitleInput" placeholder="Título do post" maxlength="100" />
                            </div>
                            <div class="editor-toolbar">
                                <button class="btn btn-outline btn-sm" onclick="formatText('h1')"><i class="fas fa-heading"></i> H1</button>
                                <button class="btn btn-outline btn-sm" onclick="formatText('h2')"><i class="fas fa-heading"></i> H2</button>
                                <button class="btn btn-outline btn-sm" onclick="formatText('h3')"><i class="fas fa-heading"></i> H3</button>
                                <button class="btn btn-outline btn-sm" onclick="formatText('bold')"><i class="fas fa-bold"></i></button>
                                <button class="btn btn-outline btn-sm" onclick="formatText('italic')"><i class="fas fa-italic"></i></button>
                                <button class="btn btn-outline btn-sm" onclick="formatText('underline')"><i class="fas fa-underline"></i></button>
                                <button class="btn btn-outline btn-sm" onclick="formatText('ul')"><i class="fas fa-list-ul"></i></button>
                                <button class="btn btn-outline btn-sm" onclick="formatText('ol')"><i class="fas fa-list-ol"></i></button>
                                <button class="btn btn-outline btn-sm" onclick="formatText('link')"><i class="fas fa-link"></i></button>
                                <button class="btn btn-outline btn-sm" onclick="formatText('image')"><i class="fas fa-image"></i></button>
                                <button class="btn btn-outline btn-sm" onclick="insertCodeBlock()"><i class="fas fa-code"></i></button>
                                <button class="btn btn-outline btn-sm" onclick="toggleMode()"><i class="fas fa-exchange-alt"></i> <span id="modeLabel">HTML</span></button>
                            </div>
                            <div class="editor-split">
                                <textarea id="postContentInput" class="editor-textarea" placeholder="Escreva seu post em HTML ou texto..." style="min-height: 300px;"></textarea>
                                <div class="editor-preview">
                                    <div class="editor-preview-label">
                                        <span><i class="fas fa-eye"></i> Pré-visualização</span>
                                        <span style="font-size:0.7rem;"><i class="fas fa-sync-alt"></i> Atualiza automaticamente</span>
                                    </div>
                                    <iframe id="previewFrame" srcdoc="<html><body style='padding:1rem;font-family:Inter;'><p style='color:#94a3b8;'>Escreva HTML no editor ao lado para ver a prévia aqui...</p></body></html>"></iframe>
                                </div>
                            </div>
                            <div class="settings-row">
                                <label>
                                    <input type="checkbox" id="allowComments" checked />
                                    <i class="fas fa-comments"></i> Permitir comentários
                                </label>
                                <label>
                                    <input type="checkbox" id="allowLikes" checked />
                                    <i class="fas fa-heart"></i> Permitir curtidas
                                </label>
                            </div>
                            <button id="publishBtn" class="btn btn-success" style="align-self: flex-start;"><i class="fas fa-plus-circle"></i> Publicar Post</button>
                        </div>
                    </div>
                `;
            }

            if (snapshot.empty) {
                html += `
                    <div class="card">
                        <div class="empty-state">
                            <i class="fas fa-feather-alt"></i>
                            <p>Nenhuma postagem ainda.</p>
                        </div>
                    </div>
                `;
            } else {
                html += `<div class="card"><div class="post-list" id="postsContainer">`;
                for (const doc of snapshot.docs) {
                    const data = doc.data();
                    const title = data.title || 'Sem título';
                    const content = data.content || '';
                    const date = data.createdAt ? data.createdAt.toDate().toLocaleString('pt-BR') : 'data desconhecida';
                    const docId = doc.id;
                    const commentsEnabled = data.allowComments !== false;
                    const likesEnabled = data.allowLikes !== false;

                    let commentCount = 0;
                    let likeCount = 0;
                    try {
                        const commentsSnap = await db.collection('blog').doc(uid)
                            .collection('posts').doc(docId)
                            .collection('comments').get();
                        commentCount = commentsSnap.size;

                        const likesSnap = await db.collection('blog').doc(uid)
                            .collection('posts').doc(docId)
                            .collection('likes').get();
                        likeCount = likesSnap.size;
                    } catch (e) {}

                    const iframeContent = `
                        <html>
                            <head>
                                <style>
                                    body { padding: 1rem; font-family: 'Inter', sans-serif; line-height: 1.6; color: #1e293b; max-width: 100%; overflow-x: auto; }
                                    h1, h2, h3 { margin: 1rem 0 0.5rem; }
                                    h1 { font-size: 1.8rem; }
                                    h2 { font-size: 1.4rem; }
                                    h3 { font-size: 1.1rem; }
                                    pre { background: #f1f5f9; padding: 1rem; border-radius: 8px; overflow-x: auto; }
                                    code { font-family: 'Courier New', monospace; }
                                    img { max-width: 100%; height: auto; border-radius: 8px; }
                                    a { color: #1a73e8; }
                                    ul, ol { padding-left: 1.5rem; }
                                    blockquote { border-left: 4px solid #1a73e8; padding-left: 1rem; margin: 1rem 0; color: #475569; }
                                </style>
                            </head>
                            <body>${content || '<p style="color:#94a3b8;">Sem conteúdo.</p>'}</body>
                        </html>
                    `;

                    const iframeSrcDoc = iframeContent
                        .replace(/&/g, '&amp;')
                        .replace(/"/g, '&quot;')
                        .replace(/'/g, '&#39;')
                        .replace(/</g, '&lt;')
                        .replace(/>/g, '&gt;');

                    const actionsHtml = isOwner ? `
                        <button class="btn btn-outline btn-sm edit-post-btn" data-id="${docId}"><i class="fas fa-edit"></i> Editar</button>
                        <button class="btn btn-danger btn-sm delete-post-btn" data-id="${docId}"><i class="fas fa-trash-alt"></i> Excluir</button>
                    ` : '';

                    html += `
                        <div class="post-item" data-id="${docId}">
                            <div class="post-header">
                                <span class="post-title">${escapeHtml(title)}</span>
                                <span class="post-meta">
                                    <i class="far fa-calendar-alt"></i> ${date}
                                    ${commentsEnabled ? `<span class="tag"><i class="fas fa-comments"></i> ${commentCount}</span>` : ''}
                                    ${likesEnabled ? `<span class="tag"><i class="fas fa-heart"></i> ${likeCount}</span>` : ''}
                                </span>
                            </div>
                            <div class="post-content">
                                <iframe srcdoc="${iframeSrcDoc}"></iframe>
                            </div>
                            <div class="post-actions">${actionsHtml}</div>
                            ${commentsEnabled ? renderComments(uid, docId, isOwner) : ''}
                        </div>
                    `;
                }
                html += `</div></div>`;
            }

            container.innerHTML = html;

            if (isOwner) {
                setupEditor(uid);
            }

            if (isOwner) {
                document.querySelectorAll('.delete-post-btn').forEach(btn => {
                    btn.addEventListener('click', () => {
                        if (confirm('Excluir esta postagem?')) deletePost(uid, btn.dataset.id);
                    });
                });

                document.querySelectorAll('.edit-post-btn').forEach(btn => {
                    btn.addEventListener('click', () => {
                        const postDiv = btn.closest('.post-item');
                        const title = postDiv.querySelector('.post-title').textContent;
                        const iframe = postDiv.querySelector('.post-content iframe');
                        const srcdoc = iframe.getAttribute('srcdoc');
                        const bodyMatch = srcdoc.match(/<body>([\s\S]*?)<\/body>/);
                        const content = bodyMatch ? bodyMatch[1] : '';
                        document.getElementById('postTitleInput').value = title;
                        document.getElementById('postContentInput').value = content;
                        updatePreview();
                        if (confirm('Editar: o post atual será removido e um novo será criado.')) {
                            deletePost(uid, btn.dataset.id).then(() => publishPost(uid));
                        }
                    });
                });
            }

            document.querySelectorAll('.comment-form').forEach(form => {
                form.addEventListener('submit', (e) => {
                    e.preventDefault();
                    const input = form.querySelector('input');
                    const postId = form.dataset.postId;
                    const userId = form.dataset.userId;
                    if (input.value.trim()) {
                        addComment(userId, postId, input.value.trim());
                        input.value = '';
                    }
                });
            });

        })
        .catch(err => {
            console.error('Erro ao carregar posts:', err);
            mainContainer.innerHTML = `
                <div class="card">
                    <div class="empty-state">
                        <i class="fas fa-exclamation-triangle"></i>
                        <p>Erro ao carregar posts: ${err.message}</p>
                    </div>
                </div>
            `;
        });
}

// ============================================
// RENDER COMENTÁRIOS
// ============================================
function renderComments(uid, postId, isOwner) {
    return `
        <div class="comments-section" data-postid="${postId}">
            <div id="comments-${postId}">
                <div class="comment-form" data-postid="${postId}" data-userid="${uid}">
                    <input type="text" placeholder="Escreva um comentário..." ${!currentUser ? 'disabled' : ''} />
                    <button class="btn btn-primary btn-sm" ${!currentUser ? 'disabled' : ''}><i class="fas fa-paper-plane"></i> Comentar</button>
                </div>
            </div>
        </div>
    `;
}

// ============================================
// EDITOR
// ============================================
function setupEditor(uid) {
    const postContentInput = document.getElementById('postContentInput');
    const previewFrame = document.getElementById('previewFrame');
    const publishBtn = document.getElementById('publishBtn');
    const allowComments = document.getElementById('allowComments');
    const allowLikes = document.getElementById('allowLikes');

    function updatePreview() {
        clearTimeout(previewTimeout);
        previewTimeout = setTimeout(() => {
            let content = postContentInput.value;
            if (!isHtmlMode) {
                content = content.replace(/\n/g, '<br>');
            }
            previewFrame.srcdoc = `
                <html>
                    <head>
                        <style>
                            body { padding: 1.5rem; font-family: 'Inter', sans-serif; line-height: 1.6; color: #1e293b; max-width: 100%; overflow-x: auto; }
                            h1, h2, h3 { margin: 1rem 0 0.5rem; }
                            h1 { font-size: 2rem; }
                            h2 { font-size: 1.5rem; }
                            h3 { font-size: 1.2rem; }
                            pre { background: #f1f5f9; padding: 1rem; border-radius: 8px; overflow-x: auto; }
                            code { font-family: 'Courier New', monospace; }
                            img { max-width: 100%; height: auto; border-radius: 8px; }
                            a { color: #1a73e8; }
                            ul, ol { padding-left: 1.5rem; }
                            blockquote { border-left: 4px solid #1a73e8; padding-left: 1rem; margin: 1rem 0; color: #475569; }
                        </style>
                    </head>
                    <body>${content || '<p style="color:#94a3b8;">Nenhum conteúdo para pré-visualizar.</p>'}</body>
                </html>
            `;
        }, 300);
    }

    postContentInput.addEventListener('input', updatePreview);

    publishBtn.addEventListener('click', () => {
        if (!currentUser) { alert('Faça login primeiro.'); return; }
        publishPost(uid);
    });

    window.toggleMode = function() {
        isHtmlMode = !isHtmlMode;
        document.getElementById('modeLabel').textContent = isHtmlMode ? 'HTML' : 'Texto';
        postContentInput.placeholder = isHtmlMode ? 'Escreva seu post em HTML...' : 'Escreva seu post em texto simples...';
    };

    window.formatText = function(type) {
        const textarea = postContentInput;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selected = textarea.value.substring(start, end);
        let formatted = '';

        switch(type) {
            case 'h1': formatted = `<h1>${selected || 'Título'}</h1>`; break;
            case 'h2': formatted = `<h2>${selected || 'Subtítulo'}</h2>`; break;
            case 'h3': formatted = `<h3>${selected || 'Subsubtítulo'}</h3>`; break;
            case 'bold': formatted = `<strong>${selected || 'texto em negrito'}</strong>`; break;
            case 'italic': formatted = `<em>${selected || 'texto em itálico'}</em>`; break;
            case 'underline': formatted = `<u>${selected || 'texto sublinhado'}</u>`; break;
            case 'ul': formatted = `<ul><li>${selected || 'item'}</li></ul>`; break;
            case 'ol': formatted = `<ol><li>${selected || 'item'}</li></ol>`; break;
            case 'link': {
                const url = prompt('URL do link:', 'https://');
                if (url) formatted = `<a href="${url}" target="_blank">${selected || 'link'}</a>`;
                break;
            }
            case 'image': {
                const url = prompt('URL da imagem:', 'https://');
                if (url) formatted = `<img src="${url}" alt="imagem" style="max-width:100%;border-radius:8px;">`;
                break;
            }
        }

        if (formatted) {
            textarea.value = textarea.value.substring(0, start) + formatted + textarea.value.substring(end);
            updatePreview();
        }
    };

    window.insertCodeBlock = function() {
        const textarea = postContentInput;
        const start = textarea.selectionStart;
        const code = prompt('Digite o código:', '// seu código aqui');
        if (code !== null) {
            const block = `<pre><code>${escapeHtml(code)}</code></pre>`;
            textarea.value = textarea.value.substring(0, start) + block + textarea.value.substring(start);
            updatePreview();
        }
    };

    updatePreview();
}

// ============================================
// CRUD POSTS
// ============================================
function publishPost(uid) {
    const title = document.getElementById('postTitleInput').value.trim();
    let content = document.getElementById('postContentInput').value.trim();
    if (!title || !content) {
        alert('Preencha título e conteúdo.');
        return Promise.reject('Campos vazios');
    }

    if (!isHtmlMode) {
        content = content.replace(/\n/g, '<br>');
    }

    const allowComments = document.getElementById('allowComments').checked;
    const allowLikes = document.getElementById('allowLikes').checked;

    const postsRef = db.collection('blog').doc(uid).collection('posts');
    return postsRef.add({
        title: title,
        content: content,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        authorId: uid,
        allowComments: allowComments,
        allowLikes: allowLikes
    })
    .then(() => {
        document.getElementById('postTitleInput').value = '';
        document.getElementById('postContentInput').value = '';
        renderUserBlog(uid);
    })
    .catch(err => {
        alert('Erro ao publicar: ' + err.message);
        console.error('Erro publish:', err);
    });
}

function deletePost(uid, docId) {
    const postsRef = db.collection('blog').doc(uid).collection('posts');
    return postsRef.doc(docId).delete()
        .then(() => renderUserBlog(uid))
        .catch(err => {
            alert('Erro ao excluir: ' + err.message);
            console.error('Erro delete:', err);
        });
}

// ============================================
// COMENTÁRIOS E CURTIDAS
// ============================================
async function addComment(uid, postId, text) {
    if (!currentUser) { alert('Faça login para comentar.'); return; }
    try {
        await db.collection('blog').doc(uid)
            .collection('posts').doc(postId)
            .collection('comments').add({
                authorId: currentUser.uid,
                authorName: currentUser.displayName || 'Anônimo',
                content: text,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        renderUserBlog(uid);
    } catch (error) {
        alert('Erro ao comentar: ' + error.message);
    }
}

// ============================================
// NAVEGAÇÃO
// ============================================
function navigateToHome() {
    const params = getUrlParams();
    if (params.uid) {
        window.location.href = window.location.pathname + '?uid=' + params.uid;
    } else {
        window.location.href = window.location.pathname;
    }
}

// ============================================
// EVENTOS
// ============================================
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
        renderBlog();
    } catch (error) {
        alert('Erro ao fazer login: ' + error.message);
    }
});

document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('show');
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
        await registerUser(user);
        isBanned = await checkIfUserIsBanned(user);
        if (isBanned) {
            showBannedScreen('Sua conta foi banida por violação das políticas de uso.');
            await auth.signOut();
            updateUI();
            return;
        }
        isAdmin = ADMIN_UIDS.includes(user.uid) || (await db.collection('users').doc(user.uid).get()).data()?.isAdmin === true;
        updateUI();
        await loadNotifications();
        listenNotifications();
        renderBlog();
    } else {
        currentUser = null;
        isBanned = false;
        isAdmin = false;
        updateUI();
        if (notificationListener) { notificationListener(); notificationListener = null; }
        notifications = [];
        unreadCount = 0;
        updateNotificationBadge();
        bannedOverlay.classList.remove('show');
        renderBlog();
    }
});

// ============================================
// EXPOR FUNÇÕES GLOBAIS
// ============================================
window.navigateToHome = navigateToHome;
window.showLoginModal = showLoginModal;
window.closeModal = closeModal;
window.loginWithGoogle = loginWithGoogle;
window.logout = logout;
window.logoutBanned = logoutBanned;
window.toggleNotifications = toggleNotifications;
window.markAllAsRead = markAllAsRead;
window.renderUserBlog = renderUserBlog;
window.publishPost = publishPost;
window.deletePost = deletePost;
window.addComment = addComment;
window.formatText = formatText;
window.toggleMode = toggleMode;
window.insertCodeBlock = insertCodeBlock;
window.shareBlog = shareBlog;
window.toggleShareDropdown = toggleShareDropdown;

console.log('📝 Blog WazzimaGiygg inicializado com sucesso!');
console.log('🔗 Use o botão "Compartilhar" para compartilhar o blog!');
console.log('🍪 Sistema de consentimento de cookies ativo');
