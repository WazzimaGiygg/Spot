// ============================================
// COOKIE CONSENT MANAGER
// ============================================
const CookieManager = {
    STORAGE_KEY: 'bemtevi_cookie_consent',
    
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
// CONFIGURAÇÃO DO FIREBASE
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
let currentFeed = 'for-you';
let lastDoc = null;
let loading = false;
let hasMore = true;
let currentCategoryFilter = null;
let currentViewingProfile = null;
let currentViewingPost = null;
let isBanned = false;
let notifications = [];
let unreadCount = 0;
let notificationListener = null;
let userKarma = 0;
let savedPosts = [];
let chatListener = null;

// Categorias
const categories = ['Geral', 'Tecnologia', 'Ciência', 'Arte', 'Música', 'Esportes', 'Games', 'Educação', 'Política', 'Entretenimento'];

// Cores das categorias
const categoryColors = {
    'Geral': '#666', 'Tecnologia': '#2196f3', 'Ciência': '#4caf50',
    'Arte': '#9c27b0', 'Música': '#f44336', 'Esportes': '#ff9800',
    'Games': '#795548', 'Educação': '#00bcd4', 'Política': '#607d8b',
    'Entretenimento': '#e91e63'
};

// Níveis de Karma
const KARMA_LEVELS = [
    { min: 0, name: 'Novato', emoji: '🌱', class: 'bronze' },
    { min: 100, name: 'Iniciante', emoji: '📚', class: 'bronze' },
    { min: 500, name: 'Entusiasta', emoji: '⭐', class: 'silver' },
    { min: 1000, name: 'Membro Ativo', emoji: '🌟', class: 'gold' },
    { min: 5000, name: 'Veterano', emoji: '🏆', class: 'platinum' },
    { min: 10000, name: 'Lendário', emoji: '👑', class: 'diamond' }
];

// ============================================
// FUNÇÕES DE UTILIDADE
// ============================================
function getInitials(name) {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length-1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function getTimeAgo(date) {
    if (!date) return 'agora';
    if (date.toDate) date = date.toDate();
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return 'agora';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d`;
    const weeks = Math.floor(days / 7);
    if (weeks < 4) return `${weeks}sem`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months}mes`;
    return `${Math.floor(months / 12)}ano`;
}

function extractLinks(text) {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const matches = text.match(urlRegex);
    return matches ? matches[0] : null;
}

function removeLinks(text) {
    return text.replace(/(https?:\/\/[^\s]+)/g, '').trim();
}

function getKarmaLevel(karma) {
    let level = KARMA_LEVELS[0];
    for (const lvl of KARMA_LEVELS) {
        if (karma >= lvl.min) level = lvl;
    }
    return level;
}

function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    if (toast) {
        toast.textContent = message;
        toast.style.background = type === 'error' ? '#c0392b' : 
                                type === 'success' ? '#27ae60' : '#2980b9';
        toast.style.display = 'block';
        clearTimeout(toast._timeout);
        toast._timeout = setTimeout(() => toast.style.display = 'none', 3000);
    } else {
        alert(message);
    }
}

// ============================================
// SISTEMA DE KARMA
// ============================================
async function updateUserKarma(userId, amount) {
    try {
        const userRef = db.collection('usuarios').doc(userId);
        await userRef.update({
            karma: firebase.firestore.FieldValue.increment(amount)
        });
        
        if (userId === currentUser?.uid) {
            userKarma += amount;
            updateUI();
        }
        
        const userDoc = await userRef.get();
        if (userDoc.exists) {
            const data = userDoc.data();
            const karma = data.karma || 0;
            const level = getKarmaLevel(karma);
            
            if (karma >= 100 && karma - amount < 100) {
                await createNotification(
                    userId,
                    '🌟 Novo Nível!',
                    `Parabéns! Você alcançou o nível "${level.name}"! Continue assim!`
                );
            }
        }
        
        return true;
    } catch (error) {
        console.error('Erro ao atualizar karma:', error);
        return false;
    }
}

async function getUserKarma(userId) {
    try {
        const userDoc = await db.collection('usuarios').doc(userId).get();
        if (userDoc.exists) {
            return userDoc.data().karma || 0;
        }
        return 0;
    } catch (error) {
        console.error('Erro ao buscar karma:', error);
        return 0;
    }
}

// ============================================
// SISTEMA DE SALVOS
// ============================================
async function loadSavedPosts() {
    if (!currentUser) return;
    
    try {
        const snapshot = await db.collection('usuarios').doc(currentUser.uid)
            .collection('savedPosts').get();
        savedPosts = snapshot.docs.map(doc => doc.id);
    } catch (error) {
        console.error('Erro ao carregar salvos:', error);
    }
}

async function toggleSavePost(postId) {
    if (!currentUser || isBanned) {
        showToast('Faça login para salvar posts!');
        return;
    }
    
    try {
        const saveRef = db.collection('usuarios').doc(currentUser.uid)
            .collection('savedPosts').doc(postId);
        const saveDoc = await saveRef.get();
        
        if (saveDoc.exists) {
            await saveRef.delete();
            savedPosts = savedPosts.filter(id => id !== postId);
            showToast('Post removido dos salvos');
        } else {
            await saveRef.set({
                postId: postId,
                savedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            savedPosts.push(postId);
            showToast('Post salvo com sucesso!');
        }
        
        refreshFeed();
    } catch (error) {
        console.error('Erro ao salvar post:', error);
        showToast('Erro ao salvar post', 'error');
    }
}

// ============================================
// SISTEMA DE COMUNIDADES
// ============================================
async function createCommunity(name, description, category) {
    if (!currentUser || isBanned) {
        showToast('Faça login para criar uma comunidade!');
        return null;
    }
    
    if (!name || name.length < 3) {
        showToast('O nome da comunidade deve ter pelo menos 3 caracteres.', 'error');
        return null;
    }
    
    try {
        const communityData = {
            name: name.trim(),
            description: description?.trim() || '',
            category: category || 'Geral',
            creatorId: currentUser.uid,
            creatorName: currentUser.displayName || 'Usuário',
            members: [currentUser.uid],
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            memberCount: 1,
            postCount: 0,
            isPrivate: false,
            rules: []
        };
        
        const docRef = await db.collection('comunidades').add(communityData);
        showToast(`Comunidade "${name}" criada com sucesso!`);
        return docRef.id;
    } catch (error) {
        console.error('Erro ao criar comunidade:', error);
        showToast('Erro ao criar comunidade', 'error');
        return null;
    }
}

async function joinCommunity(communityId) {
    if (!currentUser || isBanned) return;
    
    try {
        const communityRef = db.collection('comunidades').doc(communityId);
        const communityDoc = await communityRef.get();
        
        if (!communityDoc.exists) {
            showToast('Comunidade não encontrada.', 'error');
            return;
        }
        
        const data = communityDoc.data();
        const members = data.members || [];
        
        if (members.includes(currentUser.uid)) {
            await communityRef.update({
                members: firebase.firestore.FieldValue.arrayRemove(currentUser.uid),
                memberCount: firebase.firestore.FieldValue.increment(-1)
            });
            showToast('Você saiu da comunidade.');
        } else {
            await communityRef.update({
                members: firebase.firestore.FieldValue.arrayUnion(currentUser.uid),
                memberCount: firebase.firestore.FieldValue.increment(1)
            });
            showToast(`Bem-vindo à comunidade "${data.name}"!`);
        }
    } catch (error) {
        console.error('Erro ao entrar/sair da comunidade:', error);
        showToast('Erro ao processar ação.', 'error');
    }
}

async function getCommunityPosts(communityId, limit = 20) {
    try {
        const snapshot = await db.collection('Bemtevi')
            .where('communityId', '==', communityId)
            .orderBy('createdAt', 'desc')
            .limit(limit)
            .get();
        
        const posts = [];
        snapshot.forEach(doc => {
            posts.push({ id: doc.id, ...doc.data() });
        });
        return posts;
    } catch (error) {
        console.error('Erro ao buscar posts da comunidade:', error);
        return [];
    }
}

// ============================================
// SISTEMA DE TRENDING TOPICS
// ============================================
async function getTrendingTopics(limit = 10) {
    try {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        const snapshot = await db.collection('Bemtevi')
            .where('createdAt', '>=', yesterday)
            .orderBy('createdAt', 'desc')
            .limit(100)
            .get();
        
        const topics = {};
        snapshot.forEach(doc => {
            const post = doc.data();
            const text = post.conteudo || '';
            
            const hashtags = text.match(/#[a-zA-Z0-9_]+/g) || [];
            hashtags.forEach(tag => {
                const key = tag.toLowerCase();
                topics[key] = (topics[key] || 0) + 1;
            });
            
            const words = text.split(' ').filter(w => w.length > 3);
            for (let i = 0; i < Math.min(words.length - 1, 5); i++) {
                const phrase = words.slice(i, i + 2).join(' ').toLowerCase();
                if (phrase.length > 5) {
                    topics[phrase] = (topics[phrase] || 0) + 1;
                }
            }
        });
        
        const sorted = Object.entries(topics)
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit);
        
        return sorted.map(([name, count]) => ({ name, count }));
    } catch (error) {
        console.error('Erro ao buscar trending topics:', error);
        return [];
    }
}
// ============================================
// NOTIFICAÇÕES
// ============================================
async function createNotification(userId, title, message, link = null) {
    try {
        await db.collection('notifications').add({
            userId: userId,
            titulo: title,
            mensagem: message,
            link: link,
            lida: false,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
    } catch (error) {
        console.error('Erro ao criar notificação:', error);
    }
}

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
    if (badge) {
        if (unreadCount > 0) {
            badge.style.display = 'flex';
            badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
        } else {
            badge.style.display = 'none';
        }
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
// REGISTRO DE USUÁRIO
// ============================================
async function registerUser(user) {
    try {
        const uid = user.uid;
        
        try {
            const userRef = db.collection('users').doc(uid);
            const userDoc = await userRef.get();
            const existingData = userDoc.exists ? userDoc.data() : {};
            
            const userData = {
                uid: uid,
                email: user.email || '',
                name: user.displayName || 'Usuário',
                profilePictureUrl: user.photoURL || '',
                isAdmin: existingData.isAdmin || false,
                isBan: existingData.isBan || false,
                isBanned: existingData.isBanned || false,
                karma: existingData.karma || 0,
                createdAt: existingData.createdAt || firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastLoginAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            await userRef.set(userData, { merge: true });
        } catch (error) {
            console.warn('Erro ao escrever na coleção users:', error.message);
        }
        
        try {
            const userRef = db.collection('usuarios').doc(uid);
            const userDoc = await userRef.get();
            const existingData = userDoc.exists ? userDoc.data() : {};
            
            const userData = {
                uid: uid,
                email: user.email || '',
                name: user.displayName || 'Usuário',
                profilePictureUrl: user.photoURL || '',
                isAdmin: existingData.isAdmin || false,
                isBan: existingData.isBan || false,
                isBanned: existingData.isBanned || false,
                karma: existingData.karma || 0,
                createdAt: existingData.createdAt || firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastLoginAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            await userRef.set(userData, { merge: true });
        } catch (error) {
            console.warn('Erro ao escrever na coleção usuários:', error.message);
        }
        
        userKarma = await getUserKarma(uid);
        return true;
    } catch (error) {
        console.error('Erro ao registrar usuário:', error);
        return false;
    }
}

// ============================================
// VERIFICAÇÃO DE BANIMENTO
// ============================================
async function checkIfUserIsBanned(user) {
    if (!user) return false;
    
    try {
        try {
            const userDoc = await db.collection('users').doc(user.uid).get();
            if (userDoc.exists) {
                const data = userDoc.data();
                if (data.isBanned === true || data.isBan === true) {
                    return true;
                }
            }
        } catch (error) {
            console.warn('Erro ao ler coleção users:', error.message);
        }
        
        try {
            const userDoc = await db.collection('usuarios').doc(user.uid).get();
            if (userDoc.exists) {
                const data = userDoc.data();
                if (data.isBanned === true || data.isBan === true) {
                    return true;
                }
            }
        } catch (error) {
            console.warn('Erro ao ler coleção usuários:', error.message);
        }
    } catch (error) {
        console.log("Erro ao verificar banimento:", error);
    }
    
    return false;
}

// ============================================
// BANNED OVERLAY
// ============================================
function showBannedScreen(reason = 'Violação das políticas de uso') {
    const overlay = document.getElementById('bannedOverlay');
    if (!overlay) {
        alert('⚠️ Sua conta foi banida. Motivo: ' + reason);
        return;
    }
    
    const details = document.getElementById('banDetails');
    if (details) {
        details.textContent = `Motivo: ${reason}`;
    }
    overlay.classList.add('show');
    
    const appContainer = document.querySelector('.app-container');
    if (appContainer) {
        appContainer.style.opacity = '0.3';
        appContainer.style.pointerEvents = 'none';
    }
    
    const header = document.querySelector('.header');
    if (header) {
        header.style.opacity = '0.3';
        header.style.pointerEvents = 'none';
    }
    
    const footer = document.querySelector('.site-footer');
    if (footer) {
        footer.style.opacity = '0.3';
        footer.style.pointerEvents = 'none';
    }
}

function removeBannedOverlay() {
    const overlay = document.getElementById('bannedOverlay');
    if (overlay) {
        overlay.classList.remove('show');
    }
    
    const appContainer = document.querySelector('.app-container');
    if (appContainer) {
        appContainer.style.opacity = '1';
        appContainer.style.pointerEvents = 'auto';
    }
    
    const header = document.querySelector('.header');
    if (header) {
        header.style.opacity = '1';
        header.style.pointerEvents = 'auto';
    }
    
    const footer = document.querySelector('.site-footer');
    if (footer) {
        footer.style.opacity = '1';
        footer.style.pointerEvents = 'auto';
    }
}

async function logoutBanned() {
    try { 
        await auth.signOut(); 
        location.reload(); 
    } catch (e) { 
        location.reload(); 
    }
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
        if (avatar) {
            if (currentUser.photoURL) {
                avatar.innerHTML = `<img src="${currentUser.photoURL}" alt="Avatar">`;
            } else {
                avatar.textContent = getInitials(displayName);
            }
        }
        if (name) name.textContent = displayName.length > 20 ? displayName.substring(0,17)+'...' : displayName;
        if (email) email.textContent = currentUser.email || '';
        if (badge) {
            let badges = '';
            if (isBanned) badges += '<span class="badge-banned">🚫 Banido</span> ';
            const level = getKarmaLevel(userKarma);
            badges += `<span class="badge-karma">${level.emoji} ${userKarma}</span>`;
            badge.innerHTML = badges;
        }
        if (btnLogin) btnLogin.style.display = 'none';
        if (btnLogout) btnLogout.style.display = 'inline-block';
    } else {
        if (avatar) avatar.innerHTML = '👤';
        if (name) name.textContent = 'Visitante';
        if (email) email.textContent = '';
        if (badge) badge.innerHTML = '';
        if (btnLogin) btnLogin.style.display = 'inline-block';
        if (btnLogout) btnLogout.style.display = 'none';
    }
}

function showLoginModal() { 
    const modal = document.getElementById('login-modal');
    if (modal) {
        modal.style.display = 'flex';
        modal.classList.add('show');
    }
}

function closeLoginModal() { 
    const modal = document.getElementById('login-modal');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('show');
    }
}

async function loginWithGoogle() {
    try {
        const provider = new firebase.auth.GoogleAuthProvider();
        const result = await auth.signInWithPopup(provider);
        currentUser = result.user;
        
        await registerUser(currentUser);
        
        isBanned = await checkIfUserIsBanned(currentUser);
        if (isBanned) { 
            showBannedScreen('Sua conta foi banida por violação das políticas de uso.');
            await auth.signOut(); 
            updateUI(); 
            return; 
        }
        
        userKarma = await getUserKarma(currentUser.uid);
        await loadSavedPosts();
        updateUI();
        closeLoginModal();
        await loadNotifications();
        listenNotifications();
        renderMainApp();
    } catch (error) {
        console.error('Erro no login:', error);
        showToast('Erro ao fazer login: ' + error.message, 'error');
    }
}

async function logout() {
    try {
        await auth.signOut();
        currentUser = null;
        isBanned = false;
        userKarma = 0;
        if (notificationListener) { notificationListener(); notificationListener = null; }
        if (chatListener) { chatListener(); chatListener = null; }
        notifications = [];
        unreadCount = 0;
        savedPosts = [];
        updateNotificationBadge();
        updateUI();
        renderWelcomeScreen();
    } catch (error) {
        console.error('Erro no logout:', error);
        showToast('Erro ao sair: ' + error.message, 'error');
    }
}

// ============================================
// CRIAÇÃO DE POST
// ============================================
async function createPost(conteudo, link = null, categoria = 'Geral', communityId = null) {
    if (!currentUser || isBanned) {
        if (isBanned) {
            showToast('Sua conta está banida. Não é possível postar.', 'error');
        } else {
            showToast('Faça login para postar!');
        }
        return false;
    }

    let postText = conteudo.trim();
    let extractedLink = link || extractLinks(postText);
    if (!extractedLink) postText = removeLinks(postText);

    if (postText.length > 127) {
        showToast('O texto deve ter no máximo 127 caracteres!', 'error');
        return false;
    }

    if (postText.length === 0 && !extractedLink) {
        showToast('Digite algo para postar!', 'error');
        return false;
    }

    try {
        const postData = {
            userId: currentUser.uid,
            userNome: currentUser.displayName || currentUser.email.split('@')[0],
            userEmail: currentUser.email,
            userAvatar: currentUser.photoURL || null,
            conteudo: postText.substring(0, 127),
            categoria: categoria,
            link: extractedLink,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            likes: 0,
            comentarios: 0,
            usuariosQueCurtiram: [],
            communityId: communityId || null
        };
        
        await db.collection('Bemtevi').add(postData);
        
        if (communityId) {
            await db.collection('comunidades').doc(communityId).update({
                postCount: firebase.firestore.FieldValue.increment(1)
            });
        }
        
        await updateUserKarma(currentUser.uid, 5);
        return true;
    } catch (error) {
        console.error('Erro ao postar:', error);
        showToast('Erro ao postar. Tente novamente.', 'error');
        return false;
    }
}

// ============================================
// LIKE
// ============================================
async function likePost(postId) {
    if (!currentUser || isBanned) {
        if (isBanned) {
            showToast('Sua conta está banida.', 'error');
        } else {
            showToast('Faça login para curtir!');
        }
        return;
    }

    const postRef = db.collection('Bemtevi').doc(postId);
    const postDoc = await postRef.get();
    const usuariosQueCurtiram = postDoc.data()?.usuariosQueCurtiram || [];

    if (usuariosQueCurtiram.includes(currentUser.uid)) {
        await postRef.update({
            likes: firebase.firestore.FieldValue.increment(-1),
            usuariosQueCurtiram: firebase.firestore.FieldValue.arrayRemove(currentUser.uid)
        });
        await updateUserKarma(currentUser.uid, -1);
    } else {
        await postRef.update({
            likes: firebase.firestore.FieldValue.increment(1),
            usuariosQueCurtiram: firebase.firestore.FieldValue.arrayUnion(currentUser.uid)
        });
        await updateUserKarma(currentUser.uid, 1);
        
        const postData = postDoc.data();
        if (postData.userId !== currentUser.uid) {
            await createNotification(
                postData.userId,
                '❤️ Nova curtida',
                `${currentUser.displayName || 'Alguém'} curtiu seu post: "${postData.conteudo?.substring(0, 30)}..."`
            );
        }
    }
    refreshFeed();
}
// ============================================
// COMENTÁRIOS
// ============================================
async function openComments(postId, postUserId, postUserNome) {
    if (isBanned) {
        showToast('Sua conta está banida.', 'error');
        return;
    }
    currentViewingPost = { id: postId, userId: postUserId, userNome: postUserNome };
    
    const modal = document.getElementById('comments-modal');
    const container = document.getElementById('comments-container');
    if (!modal || !container) return;
    
    container.innerHTML = '<div class="loading">Carregando comentários...</div>';
    modal.style.display = 'flex';

    try {
        const snapshot = await db.collection('Bemtevi').doc(postId)
            .collection('comentarios')
            .orderBy('createdAt', 'desc')
            .get();

        if (snapshot.empty) {
            container.innerHTML = '<div class="loading">Nenhum comentário ainda. Seja o primeiro!</div>';
        } else {
            container.innerHTML = '';
            snapshot.forEach(doc => {
                const comment = doc.data();
                const commentDate = comment.createdAt?.toDate() || new Date();
                container.innerHTML += `
                    <div class="comment-item">
                        <div class="comment-avatar">${comment.userNome?.charAt(0).toUpperCase() || '?'}</div>
                        <div class="comment-content">
                            <div class="comment-name">${escapeHtml(comment.userNome)}</div>
                            <div class="comment-text">${escapeHtml(comment.conteudo)}</div>
                            <div class="comment-time">${getTimeAgo(commentDate)}</div>
                        </div>
                    </div>
                `;
            });
        }
    } catch (error) {
        console.error('Erro:', error);
        container.innerHTML = '<div class="loading">Erro ao carregar comentários</div>';
    }
}

async function sendComment() {
    if (isBanned) {
        showToast('Sua conta está banida. Não é possível comentar.', 'error');
        return;
    }
    const commentInput = document.getElementById('comment-input');
    if (!commentInput) return;
    
    const commentText = commentInput.value.trim();
    if (!commentText) {
        showToast('Digite um comentário!', 'error');
        return;
    }

    if (commentText.length > 280) {
        showToast('Comentário muito longo! Máximo 280 caracteres.', 'error');
        return;
    }

    try {
        await db.collection('Bemtevi').doc(currentViewingPost.id).collection('comentarios').add({
            userId: currentUser.uid,
            userNome: currentUser.displayName || currentUser.email.split('@')[0],
            conteudo: commentText,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        await db.collection('Bemtevi').doc(currentViewingPost.id).update({
            comentarios: firebase.firestore.FieldValue.increment(1)
        });

        await updateUserKarma(currentUser.uid, 2);
        
        await createNotification(
            currentViewingPost.userId,
            '💬 Novo comentário',
            `${currentUser.displayName || 'Alguém'} comentou no seu post: "${commentText.substring(0, 30)}..."`
        );

        commentInput.value = '';
        await openComments(currentViewingPost.id, currentViewingPost.userId, currentViewingPost.userNome);
        refreshFeed();
    } catch (error) {
        console.error('Erro ao comentar:', error);
        showToast('Erro ao enviar comentário.', 'error');
    }
}

// ============================================
// PERFIL E SEGUIR
// ============================================
function openProfile(userId, userName) {
    if (isBanned) {
        showToast('Sua conta está banida.', 'error');
        return;
    }
    const encodedName = encodeURIComponent(userName || 'Usuário');
    window.location.href = `profile.html?id=${userId}&name=${encodedName}`;
}

async function toggleFollow(userIdToFollow) {
    if (!currentUser || userIdToFollow === currentUser.uid || isBanned) {
        if (isBanned) {
            showToast('Sua conta está banida.', 'error');
        }
        return;
    }

    try {
        const followingRef = db.collection('usuarios').doc(currentUser.uid).collection('seguindo').doc(userIdToFollow);
        const followersRef = db.collection('usuarios').doc(userIdToFollow).collection('seguidores').doc(currentUser.uid);
        
        const followingDoc = await followingRef.get();

        if (followingDoc.exists) {
            await followingRef.delete();
            await followersRef.delete();
        } else {
            await followingRef.set({
                userId: userIdToFollow,
                seguidoDesde: firebase.firestore.FieldValue.serverTimestamp()
            });
            await followersRef.set({
                seguidorId: currentUser.uid,
                seguidoDesde: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            await createNotification(
                userIdToFollow,
                '👤 Novo seguidor',
                `${currentUser.displayName || 'Alguém'} começou a seguir você!`
            );
        }

        await loadSuggestions();
        refreshFeed();
        
    } catch (error) {
        console.error('Erro ao seguir:', error);
        showToast('Erro ao seguir usuário: ' + error.message, 'error');
    }
}

// ============================================
// SUGESTÕES
// ============================================
async function loadSuggestions() {
    if (!currentUser || isBanned) return;

    const container = document.getElementById('suggestions-container');
    if (!container) return;

    try {
        const followingSnapshot = await db.collection('usuarios').doc(currentUser.uid).collection('seguindo').get();
        const followingIds = followingSnapshot.docs.map(doc => doc.id);
        followingIds.push(currentUser.uid);

        const usersSnapshot = await db.collection('usuarios')
            .orderBy('karma', 'desc')
            .limit(20)
            .get();
        const suggestions = usersSnapshot.docs.filter(doc => !followingIds.includes(doc.id)).slice(0, 5);

        if (suggestions.length === 0) {
            container.innerHTML = '<div style="text-align:center; color:#888888;">Nenhuma sugestão no momento</div>';
            return;
        }

        container.innerHTML = suggestions.map(doc => {
            const userData = doc.data();
            const karma = userData.karma || 0;
            const level = getKarmaLevel(karma);
            return `
                <div class="suggestion-user">
                    <div class="suggestion-info" onclick="openProfile('${doc.id}', '${userData.name}')">
                        <div class="suggestion-avatar">${userData.name?.charAt(0).toUpperCase() || '?'}</div>
                        <div>
                            <div style="font-weight:600; font-size:14px; color:#ffffff;">${escapeHtml(userData.name || 'Usuário')}</div>
                            <div style="font-size:11px; color:#888888;">${level.emoji} ${karma} karma</div>
                        </div>
                    </div>
                    <button class="follow-small-btn" onclick="toggleFollow('${doc.id}')">Seguir</button>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Erro ao carregar sugestões:', error);
        container.innerHTML = '<div style="text-align:center; color:#888888;">Erro ao carregar sugestões</div>';
    }
}

// ============================================
// CARREGAR POSTS
// ============================================
async function loadTrendingTopics() {
    const container = document.getElementById('trending-container');
    if (!container) return;
    
    try {
        const topics = await getTrendingTopics(8);
        if (topics.length === 0) {
            container.innerHTML = '<div style="text-align:center; color:#888; font-size:13px;">Nenhum trending no momento</div>';
            return;
        }
        
        container.innerHTML = topics.map((topic, index) => `
            <div class="trending-topic" onclick="searchTrending('${topic.name}')">
                <span class="trending-rank">#${index + 1}</span>
                <span class="trending-name">${escapeHtml(topic.name)}</span>
                <span class="trending-count">${topic.count} posts</span>
            </div>
        `).join('');
    } catch (error) {
        console.error('Erro ao carregar trending:', error);
        container.innerHTML = '<div style="text-align:center; color:#888; font-size:13px;">Erro ao carregar</div>';
    }
}

function searchTrending(topic) {
    const searchTerm = topic.replace('#', '').trim();
    if (searchTerm.length > 0) {
        window.location.href = `explore.html?q=${encodeURIComponent(searchTerm)}`;
    }
}

async function loadPosts(reset = false) {
    if (loading || isBanned) return;
    if (reset) {
        lastDoc = null;
        hasMore = true;
        const postsContainer = document.getElementById('posts-container');
        if (postsContainer) postsContainer.innerHTML = '';
    }
    if (!hasMore) return;

    loading = true;
    const loadingIndicator = document.getElementById('loading-indicator');
    if (loadingIndicator) loadingIndicator.style.display = 'block';

    try {
        let query = db.collection('Bemtevi').orderBy('createdAt', 'desc');

        if (currentFeed === 'my-posts' && currentUser) {
            query = db.collection('Bemtevi').where('userId', '==', currentUser.uid).orderBy('createdAt', 'desc');
        } else if (currentCategoryFilter) {
            query = db.collection('Bemtevi').where('categoria', '==', currentCategoryFilter).orderBy('createdAt', 'desc');
        }

        if (lastDoc) query = query.startAfter(lastDoc);
        const snapshot = await query.limit(20).get();

        const postsContainer = document.getElementById('posts-container');
        if (!postsContainer) {
            loading = false;
            return;
        }

        if (snapshot.empty) {
            hasMore = false;
            if (reset && postsContainer.children.length === 0) {
                postsContainer.innerHTML = '<div class="loading">Nenhuma postagem encontrada!</div>';
            }
            loading = false;
            if (loadingIndicator) loadingIndicator.style.display = 'none';
            return;
        }

        lastDoc = snapshot.docs[snapshot.docs.length - 1];
        hasMore = snapshot.docs.length === 20;

        await loadSavedPosts();

        snapshot.forEach(doc => {
            const post = { id: doc.id, ...doc.data() };
            const postDate = post.createdAt?.toDate() || new Date();
            const isLiked = currentUser && post.usuariosQueCurtiram?.includes(currentUser.uid) && !isBanned;
            const isSaved = savedPosts.includes(post.id);
            
            const postHtml = `
                <div class="post-card" id="post-${post.id}">
                    <div class="post-header">
                        <div class="post-avatar-img" onclick="openProfile('${post.userId}', '${post.userNome}')">
                            ${post.userNome?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <div style="flex:1;">
                            <span class="post-user-name" onclick="openProfile('${post.userId}', '${post.userNome}')">${escapeHtml(post.userNome)}</span>
                            <span class="post-user-id">@${post.userId?.substring(0, 8)}</span>
                            <span class="post-time">• ${getTimeAgo(postDate)}</span>
                            ${post.communityId ? `<span class="post-community-tag" onclick="viewCommunity('${post.communityId}')">🏛️ Comunidade</span>` : ''}
                        </div>
                        <div class="post-options">
                            <button class="post-options-btn" onclick="togglePostOptions('${post.id}')">
                                <span class="material-icons" style="font-size:18px;">more_horiz</span>
                            </button>
                            <div class="post-options-dropdown" id="options-${post.id}">
                                ${post.userId === currentUser?.uid ? `
                                    <button onclick="deletePost('${post.id}')">🗑️ Excluir</button>
                                ` : `
                                    <button onclick="reportPost('${post.id}')">🚨 Denunciar</button>
                                `}
                                <button onclick="toggleSavePost('${post.id}')">${isSaved ? '📁 Remover dos salvos' : '📁 Salvar'}</button>
                            </div>
                        </div>
                    </div>
                    <div class="post-category" style="background:${categoryColors[post.categoria] || '#666'}20; color:${categoryColors[post.categoria] || '#666'}">
                        ${post.categoria || 'Geral'}
                    </div>
                    <div class="post-content">
                        ${escapeHtml(post.conteudo)}
                        ${post.link ? `<a href="${post.link}" target="_blank" class="post-link" onclick="event.stopPropagation()">🔗 ${post.link.substring(0, 50)}${post.link.length > 50 ? '...' : ''}</a>` : ''}
                    </div>
                    <div class="post-stats">
                        <span class="stat-action ${isLiked ? 'liked' : ''}" onclick="likePost('${post.id}')">
                            <span class="material-icons" style="font-size:18px;">${isLiked ? 'favorite' : 'favorite_border'}</span> ${post.likes || 0}
                        </span>
                        <span class="stat-action" onclick="openComments('${post.id}', '${post.userId}', '${post.userNome}')">
                            <span class="material-icons" style="font-size:18px;">chat_bubble_outline</span> ${post.comentarios || 0}
                        </span>
                        <span class="stat-action" onclick="sharePost('${post.id}')">
                            <span class="material-icons" style="font-size:18px;">share</span>
                        </span>
                        <span class="stat-action ${isSaved ? 'saved' : ''}" onclick="toggleSavePost('${post.id}')">
                            <span class="material-icons" style="font-size:18px;">${isSaved ? 'bookmark' : 'bookmark_border'}</span>
                        </span>
                    </div>
                </div>
            `;
            postsContainer.insertAdjacentHTML('beforeend', postHtml);
        });
    } catch (error) {
        console.error('Erro ao carregar posts:', error);
        const postsContainer = document.getElementById('posts-container');
        if (postsContainer) {
            postsContainer.innerHTML = '<div class="loading">Erro ao carregar posts. Recarregue a página.</div>';
        }
    } finally {
        loading = false;
        const loadingIndicator = document.getElementById('loading-indicator');
        if (loadingIndicator) loadingIndicator.style.display = 'none';
    }
}

async function sharePost(postId) {
    try {
        const postRef = db.collection('Bemtevi').doc(postId);
        const postDoc = await postRef.get();
        if (postDoc.exists) {
            const data = postDoc.data();
            const shareText = `${data.conteudo || ''} - Bemtevi`;
            await navigator.clipboard.writeText(shareText);
            showToast('Link copiado para a área de transferência!');
        }
    } catch (error) {
        showToast('Erro ao copiar link.', 'error');
    }
}

function togglePostOptions(postId) {
    const dropdown = document.getElementById(`options-${postId}`);
    if (dropdown) {
        dropdown.classList.toggle('show');
    }
}

async function deletePost(postId) {
    if (!confirm('Tem certeza que deseja excluir este post?')) return;
    
    try {
        await db.collection('Bemtevi').doc(postId).delete();
        showToast('Post excluído com sucesso!');
        refreshFeed();
    } catch (error) {
        console.error('Erro ao excluir post:', error);
        showToast('Erro ao excluir post.', 'error');
    }
}

async function reportPost(postId) {
    const reason = prompt('Descreva o motivo da denúncia:');
    if (!reason) return;
    
    try {
        await db.collection('reports').add({
            postId: postId,
            reporterId: currentUser?.uid || 'anonymous',
            reason: reason,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            status: 'pending'
        });
        showToast('Denúncia enviada! Iremos analisar.');
    } catch (error) {
        console.error('Erro ao denunciar:', error);
        showToast('Erro ao enviar denúncia.', 'error');
    }
}

function refreshFeed() {
    lastDoc = null;
    hasMore = true;
    loadPosts(true);
}
// ============================================
// NAVEGAÇÃO
// ============================================
function changeFeed(feed) {
    if (isBanned) return;
    currentFeed = feed;
    currentCategoryFilter = null;
    lastDoc = null;
    hasMore = true;
    renderMainApp();
}

function filterByCategory(category) {
    if (isBanned) return;
    currentCategoryFilter = category;
    currentFeed = 'for-you';
    lastDoc = null;
    hasMore = true;
    renderMainApp();
}

function clearCategoryFilter() {
    if (isBanned) return;
    currentCategoryFilter = null;
    lastDoc = null;
    hasMore = true;
    renderMainApp();
}

function openExplore() {
    window.location.href = 'explore.html';
}

function openCommunities() {
    window.location.href = 'communities.html';
}

function openMessages() {
    window.location.href = 'messages.html';
}

function openSavedPosts() {
    window.location.href = 'saved.html';
}

function viewCommunity(communityId) {
    window.location.href = `community.html?id=${communityId}`;
}

// ============================================
// CRIAR COMUNIDADE - MODAL
// ============================================
function showCreateCommunityModal() {
    if (!currentUser || isBanned) {
        showToast('Faça login para criar uma comunidade!');
        return;
    }
    
    const modal = document.getElementById('createCommunityModal');
    if (modal) {
        modal.style.display = 'flex';
        modal.classList.add('show');
    }
}

async function createCommunityFromModal() {
    const nameInput = document.getElementById('communityName');
    const descInput = document.getElementById('communityDescription');
    const catSelect = document.getElementById('communityCategory');
    
    const name = nameInput?.value?.trim();
    const description = descInput?.value?.trim();
    const category = catSelect?.value || 'Geral';
    
    if (!name || name.length < 3) {
        showToast('O nome da comunidade deve ter pelo menos 3 caracteres.', 'error');
        nameInput?.focus();
        return;
    }
    
    const communityId = await createCommunity(name, description, category);
    if (communityId) {
        closeModal('createCommunityModal');
        if (nameInput) nameInput.value = '';
        if (descInput) descInput.value = '';
        showToast(`Comunidade "${name}" criada com sucesso!`);
        // Atualizar feed se estiver na página de comunidades
        if (typeof loadCommunities === 'function') {
            loadCommunities('all');
        }
    }
}

// ============================================
// RENDERIZAÇÃO
// ============================================
function renderMainApp() {
    const container = document.getElementById('app');
    if (!container) return;
    
    const userInitial = currentUser?.displayName?.charAt(0).toUpperCase() || 
                        currentUser?.email?.charAt(0).toUpperCase() || '?';
    const userName = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Usuário';
    
    container.innerHTML = `
        <div class="app-container">
            <div class="sidebar-left">
                <div class="card">
                    <div class="logo">
                        <span class="logo-icon">🐦</span>
                        <span class="logo-text">Bemtevi</span>
                    </div>
                    <ul class="nav-menu">
                        <li class="nav-item ${currentFeed === 'for-you' ? 'active' : ''}" onclick="changeFeed('for-you')">
                            <span class="material-icons">home</span> Para Você
                        </li>
                        <li class="nav-item ${currentFeed === 'my-posts' ? 'active' : ''}" onclick="changeFeed('my-posts')">
                            <span class="material-icons">person</span> Minhas Postagens
                        </li>
                        <li class="nav-item" onclick="openExplore()">
                            <span class="material-icons">explore</span> Explorar
                        </li>
                        <li class="nav-item" onclick="openCommunities()">
                            <span class="material-icons">groups</span> Comunidades
                        </li>
                        <li class="nav-item" onclick="openMessages()">
                            <span class="material-icons">chat</span> Mensagens
                        </li>
                        <hr class="nav-divider">
                        <li class="nav-item" onclick="showCreateCommunityModal()" style="color: #ffb347;">
                            <span class="material-icons" style="color:#ffb347;">add_circle</span> Criar Comunidade
                        </li>
                        <li class="nav-item" onclick="openSavedPosts()">
                            <span class="material-icons">bookmark</span> Salvos
                        </li>
                        <li class="nav-item" onclick="openProfile('${currentUser.uid}', '${userName}')">
                            <span class="material-icons">account_circle</span> Meu Perfil
                        </li>
                    </ul>
                    <div style="margin-top:20px; padding-top:20px; border-top:1px solid #2a2a2a; cursor:pointer;" onclick="openProfile('${currentUser.uid}', '${userName}')">
                        <div style="display:flex; align-items:center; gap:12px;">
                            <div class="post-avatar" style="width:40px; height:40px;">${userInitial}</div>
                            <div>
                                <div style="font-weight:600; color:#ffffff;">${escapeHtml(userName)}</div>
                                <div style="font-size:12px; color:#888888;">${getKarmaLevel(userKarma).emoji} ${userKarma} karma</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div>
                <div class="feed-header">
                    <div class="feed-header-top">
                        <div class="feed-title">📱 ${currentFeed === 'my-posts' ? 'Minhas Postagens' : 'Feed'}</div>
                    </div>
                    <div class="feed-tabs">
                        <span class="feed-tab ${currentFeed === 'for-you' ? 'active' : ''}" onclick="changeFeed('for-you')">Para Você</span>
                        <span class="feed-tab ${currentFeed === 'latest' ? 'active' : ''}" onclick="changeFeed('latest')">Últimas</span>
                        <span class="feed-tab ${currentFeed === 'my-posts' ? 'active' : ''}" onclick="changeFeed('my-posts')">Minhas</span>
                    </div>
                </div>
                <div class="post-box">
                    <div class="post-input-area">
                        <div class="post-avatar">${userInitial}</div>
                        <div class="post-input-container">
                            <textarea id="postText" class="post-input" rows="3" placeholder="O que está acontecendo? (Máx. 127 caracteres)" maxlength="127"></textarea>
                            <div id="charCounter" class="char-counter">0/127</div>
                            <div class="post-actions">
                                <select id="postCategory" class="btn-secondary">${categories.map(cat => `<option value="${cat}">📁 ${cat}</option>`).join('')}</select>
                                <input type="text" id="postLink" class="btn-secondary" placeholder="🔗 Link (opcional)" style="width:200px;">
                                <button class="btn-primary" onclick="submitPost()">Postar 🚀</button>
                            </div>
                        </div>
                    </div>
                </div>
                <div id="posts-container" class="posts-container"></div>
                <div id="loading-indicator" class="loading" style="display:none;">Carregando mais posts...</div>
            </div>

            <div class="sidebar-right">
                <div class="card">
                    <div class="box-title" style="font-weight:700; margin-bottom:15px;">📂 Categorias</div>
                    ${categories.map(cat => `<span class="category-chip ${currentCategoryFilter === cat ? 'selected' : ''}" onclick="filterByCategory('${cat}')">${cat}</span>`).join('')}
                    <span class="category-chip ${!currentCategoryFilter ? 'selected' : ''}" onclick="clearCategoryFilter()">Todos</span>
                </div>
                <div class="card">
                    <div class="box-title" style="font-weight:700; margin-bottom:15px;">🔥 Trending</div>
                    <div id="trending-container">Carregando...</div>
                </div>
                <div class="card">
                    <div class="box-title" style="font-weight:700; margin-bottom:15px;">👥 Sugestões</div>
                    <div id="suggestions-container"></div>
                </div>
            </div>
        </div>
    `;

    const postText = document.getElementById('postText');
    if (postText) {
        postText.addEventListener('input', function() {
            const len = this.value.length;
            const counter = document.getElementById('charCounter');
            if (counter) {
                counter.innerHTML = `${len}/127`;
                counter.className = len > 110 ? 'char-counter warning' : len > 120 ? 'char-counter danger' : 'char-counter';
            }
        });
    }

    loadPosts(true);
    loadSuggestions();
    loadTrendingTopics();
    
    window.removeEventListener('scroll', handleScroll);
    window.addEventListener('scroll', handleScroll);
}

function handleScroll() {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 500) {
        loadPosts();
    }
}

function renderWelcomeScreen() {
    const container = document.getElementById('app');
    if (!container) return;
    
    container.innerHTML = `
        <div class="login-container">
            <div class="login-box">
                <div class="logo" style="justify-content:center; margin-bottom:30px;">
                    <span class="logo-icon">🐦</span>
                    <span class="logo-text">Bemtevi</span>
                </div>
                <h2 style="margin-bottom:20px;">Bem-vindo!</h2>
                <p style="color:#aaaaaa; margin-bottom:30px;">Uma rede social livre e colaborativa</p>
                <button id="google-login-welcome" class="btn-primary" style="width:100%;">🔑 Entrar com Google</button>
                <div style="margin-top:20px; font-size:12px; color:#666666;">Postagens de até 127 caracteres • Comentários • Curtidas</div>
                <div style="margin-top:10px; font-size:11px; color:#444;">Comunidades • Karma • Mensagens Diretas</div>
            </div>
        </div>
    `;
    
    const loginBtn = document.getElementById('google-login-welcome');
    if (loginBtn) loginBtn.addEventListener('click', loginWithGoogle);
}

// ============================================
// SUBMISSÃO DE POST
// ============================================
window.submitPost = async function() {
    if (isBanned) {
        showToast('Sua conta está banida. Não é possível postar.', 'error');
        return;
    }
    const text = document.getElementById('postText')?.value;
    const link = document.getElementById('postLink')?.value;
    const category = document.getElementById('postCategory')?.value || 'Geral';
    if (await createPost(text, link, category)) {
        const postText = document.getElementById('postText');
        const postLink = document.getElementById('postLink');
        if (postText) postText.value = '';
        if (postLink) postLink.value = '';
        refreshFeed();
    }
};

// ============================================
// FUNÇÕES GLOBAIS
// ============================================
window.closeModal = function(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('show');
    }
};

window.toggleFollow = toggleFollow;
window.openProfile = openProfile;
window.openComments = openComments;
window.sendComment = sendComment;
window.likePost = likePost;
window.sharePost = sharePost;
window.logout = logout;
window.logoutBanned = logoutBanned;
window.showLoginModal = showLoginModal;
window.loginWithGoogle = loginWithGoogle;
window.markAllAsRead = markAllAsRead;
window.toggleNotifications = toggleNotifications;
window.toggleSavePost = toggleSavePost;
window.deletePost = deletePost;
window.reportPost = reportPost;
window.searchTrending = searchTrending;
window.changeFeed = changeFeed;
window.filterByCategory = filterByCategory;
window.clearCategoryFilter = clearCategoryFilter;
window.openExplore = openExplore;
window.openCommunities = openCommunities;
window.openMessages = openMessages;
window.openSavedPosts = openSavedPosts;
window.viewCommunity = viewCommunity;
window.showCreateCommunityModal = showCreateCommunityModal;
window.createCommunityFromModal = createCommunityFromModal;

// ============================================
// INICIALIZAÇÃO
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    CookieManager.init();
    
    const googleBtn = document.getElementById('google-login-btn');
    if (googleBtn) googleBtn.addEventListener('click', loginWithGoogle);
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
        userKarma = await getUserKarma(user.uid);
        await loadSavedPosts();
        updateUI();
        await loadNotifications();
        listenNotifications();
        renderMainApp();
    } else {
        currentUser = null;
        isBanned = false;
        userKarma = 0;
        updateUI();
        if (notificationListener) { notificationListener(); notificationListener = null; }
        if (chatListener) { chatListener(); chatListener = null; }
        notifications = [];
        unreadCount = 0;
        savedPosts = [];
        updateNotificationBadge();
        removeBannedOverlay();
        renderWelcomeScreen();
    }
});

console.log('🐦 Bemtevi - Rede Social Beta inicializada com sucesso!');
console.log('🔔 Notificações integradas');
console.log('🏛️ Comunidades disponíveis');
console.log('⭐ Sistema de Karma ativo');
console.log('📁 Sistema de salvos ativo');
console.log('💬 Mensagens diretas disponíveis');
console.log('🍪 Sistema de consentimento de cookies ativo');
