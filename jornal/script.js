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

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();
const googleProvider = new firebase.auth.GoogleAuthProvider();

// ============================================
// VARIÁVEIS GLOBAIS
// ============================================
let currentUser = null;
let currentUserIsAdmin = false;
let currentUserIsBanned = false;
let currentCategory = 'todos';
let currentEditArticleId = null;
let currentViewArticleId = null;
let currentViewArticleData = null;
let weatherLoaded = false;
let notifications = [];
let unreadCount = 0;
let notificationListener = null;

const SPECIFIC_ADMIN_UID = "sZxfMuOBPbXdR8nttVPXIN8QOOl1";

// ============================================
// COOKIE CONSENT MANAGER
// ============================================
const CookieManager = {
    STORAGE_KEY: 'wzzm_cookie_consent',
    
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
        document.getElementById('cookieAcceptAll')?.addEventListener('click', () => {
            this.acceptAll();
        });
        document.getElementById('cookieRejectAll')?.addEventListener('click', () => {
            this.rejectAll();
        });
        document.getElementById('cookieCustomize')?.addEventListener('click', () => {
            this.customize();
        });
    },
    
    getConsent() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            return data ? JSON.parse(data) : null;
        } catch {
            return null;
        }
    },
    
    saveConsent(preferences) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify({
            ...preferences,
            timestamp: new Date().toISOString()
        }));
    },
    
    showBanner() {
        const banner = document.getElementById('cookieConsent');
        if (banner) {
            setTimeout(() => banner.classList.add('show'), 100);
        }
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
        this.showToast('ℹ️ Cookies não essenciais foram recusados.', 'info');
    },
    
    customize() {
        const analytics = document.getElementById('cookieAnalytics')?.checked !== false;
        const advertising = document.getElementById('cookieAdvertising')?.checked !== false;
        const consent = { essential: true, analytics, advertising };
        this.saveConsent(consent);
        this.applyConsent(consent);
        this.hideBanner();
        this.showToast('✅ Suas preferências foram salvas!', 'success');
    },
    
    showToast(message, type = 'info') {
        if (typeof showToast === 'function') {
            showToast(message, type === 'error');
        } else {
            const toast = document.getElementById('toast');
            if (toast) {
                toast.textContent = message;
                toast.style.background = type === 'error' ? '#c0392b' : 
                                        type === 'success' ? '#27ae60' : '#2980b9';
                toast.style.display = 'block';
                setTimeout(() => toast.style.display = 'none', 3000);
            }
        }
    },
    
    isAllowed(cookieType) {
        const consent = this.getConsent();
        if (!consent) return true;
        return consent[cookieType] !== false;
    }
};

// ============================================
// FUNÇÕES AUXILIARES
// ============================================
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
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

function getInitials(name) {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length-1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
}

function getCategoryIcon(cat) {
    const icons = {
        'política': '🏛️', 'internacional': '🌍', 'economia': '📊',
        'justiça': '⚖️', 'cultura': '🎭', 'investigação': '🔍', 
        'opinião': '✍️', 'esporte': '⚽', 'tecnologia': '💻',
        'redes-sociais': '📱', 'saúde': '🏥', 'educação': '📚'
    };
    return icons[cat] || '📰';
}

function formatDate(timestamp) {
    if (!timestamp) return 'Data desconhecida';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('pt-BR');
}

function showToast(message, isError = false) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.style.background = isError ? '#c0392b' : '#27ae60';
    toast.style.display = 'block';
    setTimeout(() => toast.style.display = 'none', 3000);
}

// ============================================
// REGISTRO DE USUÁRIO
// ============================================
async function registerUser(user) {
    try {
        const uid = user.uid;
        const userDoc = await db.collection('users').doc(uid).get();
        const existingData = userDoc.exists ? userDoc.data() : {};
        
        let isAdminValue = false;
        if (uid === SPECIFIC_ADMIN_UID) {
            isAdminValue = true;
        } else if (existingData.isAdmin === true) {
            isAdminValue = true;
        }
        
        let isBannedValue = existingData.isBanned || false;
        
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

        await db.collection('users').doc(uid).set(userData, { merge: true });
        await db.collection('usuários').doc(uid).set(userData, { merge: true });

        console.log(`Usuário ${uid} registrado/atualizado. isAdmin: ${isAdminValue}, isBanned: ${isBannedValue}`);
        return userData;
    } catch (error) {
        console.error('Erro ao registrar usuário:', error);
        return null;
    }
}

// ============================================
// VERIFICAÇÕES
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

async function checkIfUserIsAdmin(user) {
    if (!user) return false;
    if (user.uid === SPECIFIC_ADMIN_UID) return true;
    try {
        const userDoc = await db.collection('users').doc(user.uid).get();
        if (userDoc.exists && userDoc.data().isAdmin === true) {
            return true;
        }
    } catch (error) {
        console.log("Erro ao verificar admin:", error);
    }
    return false;
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
        
        notifications.sort((a, b) => {
            const dateA = a.timestamp?.toDate ? a.timestamp.toDate() : new Date(a.timestamp);
            const dateB = b.timestamp?.toDate ? b.timestamp.toDate() : new Date(b.timestamp);
            return dateB - dateA;
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
        list.innerHTML = `
            <div class="notification-empty">
                <span class="material-icons">notifications_off</span>
                <p>Nenhuma notificação</p>
            </div>
        `;
        return;
    }
    
    const recentNotifs = notifications.slice(0, 10);
    list.innerHTML = recentNotifs.map(notif => `
        <div class="notification-item ${notif.lida ? '' : 'unread'}" onclick="markAsRead('${notif.id}')">
            <div class="notif-title">${escapeHtml(notif.titulo || 'Notificação')}</div>
            <div class="notif-message">${escapeHtml(notif.mensagem || '')}</div>
            <div class="notif-time">${getTimeAgo(notif.timestamp)}</div>
        </div>
    `).join('');
}

async function markAsRead(notificationId) {
    if (!notificationId) return;
    try {
        await db.collection('notifications').doc(notificationId).update({ lida: true });
        const notif = notifications.find(n => n.id === notificationId);
        if (notif && !notif.lida) {
            notif.lida = true;
            unreadCount--;
            updateNotificationBadge();
            renderNotifications();
        }
    } catch (error) {
        console.error('❌ Erro ao marcar como lida:', error);
    }
}

async function markAllAsRead(event) {
    if (event) event.stopPropagation();
    if (unreadCount === 0) return;
    try {
        const batch = db.batch();
        const unreadNotifs = notifications.filter(n => !n.lida);
        unreadNotifs.forEach(notif => {
            const ref = db.collection('notifications').doc(notif.id);
            batch.update(ref, { lida: true });
        });
        await batch.commit();
        notifications.forEach(n => n.lida = true);
        unreadCount = 0;
        updateNotificationBadge();
        renderNotifications();
    } catch (error) {
        console.error('❌ Erro ao marcar todas como lidas:', error);
    }
}

function toggleNotifications(event) {
    if (event) event.stopPropagation();
    const dropdown = document.getElementById('notifDropdown');
    if (dropdown) {
        dropdown.classList.toggle('show');
        if (dropdown.classList.contains('show')) {
            loadNotifications();
        }
    }
}

document.addEventListener('click', function(e) {
    if (!e.target.closest('.notification-bell')) {
        const dropdown = document.getElementById('notifDropdown');
        if (dropdown) dropdown.classList.remove('show');
    }
});

function listenNotifications() {
    if (notificationListener) {
        notificationListener();
        notificationListener = null;
    }
    if (!currentUser) return;
    
    notificationListener = db.collection('notifications')
        .where('userId', '==', currentUser.uid)
        .orderBy('timestamp', 'desc')
        .limit(50)
        .onSnapshot((snapshot) => {
            notifications = [];
            snapshot.forEach(doc => {
                notifications.push({ 
                    id: doc.id, 
                    ...doc.data(),
                    timestamp: doc.data().timestamp || new Date()
                });
            });
            notifications.sort((a, b) => {
                const dateA = a.timestamp?.toDate ? a.timestamp.toDate() : new Date(a.timestamp);
                const dateB = b.timestamp?.toDate ? b.timestamp.toDate() : new Date(b.timestamp);
                return dateB - dateA;
            });
            unreadCount = notifications.filter(n => !n.lida).length;
            updateNotificationBadge();
            renderNotifications();
        }, (error) => {
            console.error('❌ Erro no listener de notificações:', error);
        });
}

// ============================================
// AUTENTICAÇÃO - UI
// ============================================
function updateUI() {
    const userAvatar = document.getElementById('userAvatar');
    const userName = document.getElementById('userName');
    const userEmail = document.getElementById('userEmail');
    const userBadge = document.getElementById('userBadge');
    const btnLogin = document.getElementById('btnLogin');
    const btnLogout = document.getElementById('btnLogout');
    
    const adminBtn = document.getElementById('adminNewArticleBtn');
    if (adminBtn) {
        adminBtn.style.display = (currentUser && currentUserIsAdmin && !currentUserIsBanned) ? 'block' : 'none';
    }
    
    if (currentUser && !currentUserIsBanned) {
        let name = currentUser.displayName || (currentUser.email ? currentUser.email.split('@')[0] : 'Usuário');
        
        if (currentUser.photoURL) {
            userAvatar.innerHTML = `<img src="${currentUser.photoURL}" alt="Avatar">`;
        } else {
            userAvatar.textContent = getInitials(name);
        }
        
        userName.textContent = name.length > 20 ? name.substring(0,17)+'...' : name;
        userEmail.textContent = currentUser.email || '';
        
        let badges = '';
        if (currentUserIsBanned) badges += '<span class="badge-banned">🚫 Banido</span> ';
        if (currentUserIsAdmin) badges += '<span class="badge-admin">Admin</span> ';
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

function showLoginModal() { 
    document.getElementById('loginModal').classList.add('show'); 
}

function closeModals() { 
    document.querySelectorAll('.modal').forEach(m => m.classList.remove('show')); 
}

// ============================================
// LOGIN / LOGOUT
// ============================================
async function loginWithGoogle() {
    try {
        const result = await auth.signInWithPopup(googleProvider);
        const user = result.user;
        await registerUser(user);
        
        currentUserIsBanned = await checkIfUserIsBanned(user);
        if (currentUserIsBanned) {
            showBannedScreen('Sua conta foi banida por violação das políticas de uso.');
            await auth.signOut();
            updateUI();
            return;
        }
        
        currentUserIsAdmin = await checkIfUserIsAdmin(user);
        updateUI();
        closeModals();
        await loadNotifications();
        listenNotifications();
        location.reload();
    } catch (error) {
        console.error("Erro no login com Google:", error);
        showToast('Erro ao fazer login: ' + error.message, true);
    }
}

function logout() {
    try {
        auth.signOut();
        currentUser = null;
        currentUserIsAdmin = false;
        currentUserIsBanned = false;
        if (notificationListener) {
            notificationListener();
            notificationListener = null;
        }
        notifications = [];
        unreadCount = 0;
        updateNotificationBadge();
        updateUI();
        showToast('Logout realizado com sucesso!');
        setTimeout(() => navigateToHome(), 500);
    } catch (error) {
        console.error("Erro ao fazer logout:", error);
        showToast('Erro ao sair: ' + error.message, true);
    }
}

// ============================================
// BANIDO
// ============================================
function showBannedScreen(reason = 'Violação das políticas de uso') {
    const overlay = document.getElementById('bannedOverlay');
    const details = document.getElementById('banDetails');
    details.textContent = `Motivo: ${reason}`;
    overlay.classList.add('show');
    document.querySelector('.newspaper-container').style.opacity = '0.5';
    document.querySelector('.newspaper-container').style.pointerEvents = 'none';
    document.querySelector('.header').style.opacity = '0.3';
    document.querySelector('.header').style.pointerEvents = 'none';
    document.querySelector('.site-footer').style.opacity = '0.3';
    document.querySelector('.site-footer').style.pointerEvents = 'none';
}

function logoutBanned() {
    auth.signOut().then(() => location.reload());
}

// ============================================
// NAVEGAÇÃO POR URL
// ============================================
function getUrlParams() {
    const params = new URLSearchParams(window.location.search);
    return {
        categoria: params.get('categoria'),
        id: params.get('id')
    };
}

function updateUrl(categoria, id = null) {
    let url = window.location.pathname;
    const params = [];
    if (categoria && categoria !== 'todos') {
        params.push(`categoria=${encodeURIComponent(categoria)}`);
    }
    if (id) {
        params.push(`id=${encodeURIComponent(id)}`);
    }
    if (params.length > 0) {
        url += '?' + params.join('&');
    }
    window.history.pushState({ categoria, id }, '', url);
}

function navigateToHome() {
    window.location.href = window.location.pathname;
}

function highlightActiveCategory(category) {
    document.querySelectorAll('.nav-menu a').forEach(a => {
        const isActive = a.dataset.cat === category;
        a.classList.toggle('active', isActive);
    });
}

// ============================================
// PREVISÃO DO TEMPO
// ============================================
async function fetchWeather() {
    const lat = -20.2345;
    const lon = -50.9253;
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=America/Sao_Paulo`;
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Falha ao buscar dados');
        return await response.json();
    } catch (error) {
        console.error('Erro na previsão do tempo:', error);
        return null;
    }
}

function getWeatherEmoji(code) {
    if (code === 0) return '☀️';
    if (code === 1 || code === 2 || code === 3) return '⛅';
    if (code === 45 || code === 48) return '🌫️';
    if (code === 51 || code === 53 || code === 55) return '🌧️';
    if (code === 56 || code === 57) return '🌨️';
    if (code === 61 || code === 63 || code === 65) return '🌧️';
    if (code === 66 || code === 67) return '🌨️';
    if (code === 71 || code === 73 || code === 75) return '❄️';
    if (code === 77) return '🌨️';
    if (code === 80 || code === 81 || code === 82) return '🌧️';
    if (code === 85 || code === 86) return '❄️';
    if (code >= 95) return '⛈️';
    return '🌤️';
}

function getWeatherDescription(code) {
    const descriptions = {
        0: 'Céu limpo',
        1: 'Parcialmente nublado',
        2: 'Nublado',
        3: 'Encoberto',
        45: 'Nevoeiro',
        48: 'Nevoeiro gelado',
        51: 'Chuvisco leve',
        53: 'Chuvisco moderado',
        55: 'Chuvisco denso',
        61: 'Chuva leve',
        63: 'Chuva moderada',
        65: 'Chuva forte',
        71: 'Neve leve',
        73: 'Neve moderada',
        75: 'Neve forte',
        80: 'Pancada de chuva leve',
        81: 'Pancada de chuva moderada',
        82: 'Pancada de chuva forte',
        95: 'Trovoada leve',
        96: 'Trovoada com granizo',
        99: 'Trovoada forte com granizo'
    };
    return descriptions[code] || 'Condição variável';
}

function getWeatherIcon(code) {
    const icons = {
        0: 'fa-sun',
        1: 'fa-cloud-sun',
        2: 'fa-cloud',
        3: 'fa-cloud',
        45: 'fa-smog',
        48: 'fa-smog',
        51: 'fa-cloud-rain',
        53: 'fa-cloud-rain',
        55: 'fa-cloud-showers-heavy',
        61: 'fa-cloud-rain',
        63: 'fa-cloud-rain',
        65: 'fa-cloud-showers-heavy',
        71: 'fa-snowflake',
        73: 'fa-snowflake',
        75: 'fa-snowflake',
        80: 'fa-cloud-rain',
        81: 'fa-cloud-rain',
        82: 'fa-cloud-showers-heavy',
        95: 'fa-bolt',
        96: 'fa-bolt',
        99: 'fa-bolt'
    };
    return icons[code] || 'fa-cloud';
}

async function renderWeather() {
    const existingWidget = document.getElementById('weatherWidget');
    if (existingWidget) {
        await updateWeatherContent(existingWidget);
        return;
    }

    const weatherContainer = document.createElement('div');
    weatherContainer.className = 'weather-widget';
    weatherContainer.id = 'weatherWidget';
    
    weatherContainer.innerHTML = `
        <div class="weather-header">
            <h3><i class="fas fa-cloud-sun"></i> Previsão do Tempo</h3>
            <i class="fas fa-map-pin"></i>
        </div>
        <div class="weather-loading">
            <div class="spinner-small"></div>
            <p style="font-size:12px; opacity:0.7;">Carregando previsão...</p>
        </div>
    `;
    
    const rightSidebar = document.querySelector('.sidebar-right');
    if (rightSidebar) {
        rightSidebar.insertBefore(weatherContainer, rightSidebar.firstChild);
        await updateWeatherContent(weatherContainer);
    }
}

async function updateWeatherContent(widget) {
    const data = await fetchWeather();
    if (!data || !data.current) {
        widget.innerHTML = `
            <div class="weather-header">
                <h3><i class="fas fa-cloud-sun"></i> Previsão do Tempo</h3>
                <i class="fas fa-map-pin"></i>
            </div>
            <div class="weather-error">
                <i class="fas fa-exclamation-triangle"></i>
                Não foi possível carregar a previsão do tempo.
            </div>
            <div class="weather-update">Santa Fé do Sul - SP</div>
        `;
        return;
    }
    
    const current = data.current;
    const temp = current.temperature_2m;
    const humidity = current.relative_humidity_2m;
    const windSpeed = current.wind_speed_10m;
    const weatherCode = current.weather_code;
    
    const emoji = getWeatherEmoji(weatherCode);
    const desc = getWeatherDescription(weatherCode);
    const iconClass = getWeatherIcon(weatherCode);
    
    widget.innerHTML = `
        <div class="weather-header">
            <h3><i class="fas fa-cloud-sun"></i> Previsão do Tempo</h3>
            <i class="fas fa-map-pin"></i>
        </div>
        <div class="weather-main">
            <div>
                <div class="weather-icon">${emoji}</div>
                <div class="weather-desc">${desc}</div>
            </div>
            <div>
                <div class="weather-temp">${Math.round(temp)}<sup>°C</sup></div>
            </div>
        </div>
        <div class="weather-details">
            <div class="detail-item">
                <i class="fas fa-tint"></i>
                <div class="value">${humidity}%</div>
                <div class="label">Umidade</div>
            </div>
            <div class="detail-item">
                <i class="fas fa-wind"></i>
                <div class="value">${Math.round(windSpeed)} km/h</div>
                <div class="label">Vento</div>
            </div>
            <div class="detail-item">
                <i class="fas ${iconClass}"></i>
                <div class="value">${desc}</div>
                <div class="label">Condição</div>
            </div>
        </div>
        <div class="weather-update">
            <i class="far fa-clock"></i> Atualizado agora • Santa Fé do Sul - SP
        </div>
    `;
    weatherLoaded = true;
}

// ============================================
// ARTIGOS
// ============================================
async function loadArticles() {
    const grid = document.getElementById('newspaperGrid');
    grid.innerHTML = '<div class="loading"><div class="spinner"></div><p>Carregando notícias...</p></div>';
    
    try {
        let query = db.collection('articlesdoc').orderBy('dataPublicacao', 'desc');
        if (currentCategory !== 'todos') {
            query = db.collection('articlesdoc').where('categoria', '==', currentCategory).orderBy('dataPublicacao', 'desc');
        }
        
        const snapshot = await query.get();
        const articles = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            articles.push({ id: doc.id, ...data });
        });
        
        if (articles.length === 0) {
            grid.innerHTML = '<div class="loading"><p>📭 Nenhuma matéria encontrada nesta categoria.</p></div>';
            return;
        }
        
        renderArticles(articles);
    } catch (error) {
        grid.innerHTML = `<div class="loading"><p>❌ Erro ao carregar: ${error.message}</p></div>`;
    }
}

function renderArticles(articles) {
    const mainArticle = articles[0];
    const leftArticles = articles.slice(1, 4);
    const rightArticles = articles.slice(4, 8);

    const renderAdminActions = (articleId) => {
        if (!currentUserIsAdmin) return '';
        return `
            <div class="admin-actions">
                <button class="admin-btn" onclick="event.stopPropagation(); editArticle('${articleId}')">✏️</button>
                <button class="admin-btn delete" onclick="event.stopPropagation(); deleteArticle('${articleId}')">🗑️</button>
            </div>
        `;
    };

    const renderArticleCard = (article, isMain = false) => {
        const tag = getCategoryIcon(article.categoria) + ' ' + (article.categoria || 'geral').toUpperCase();
        const date = formatDate(article.dataPublicacao);
        
        if (isMain) {
            return `
                <div class="main-article" style="position: relative;">
                    ${renderAdminActions(article.id)}
                    <div class="article-tag">${tag} · DESTAQUE</div>
                    <div class="article-title"><a onclick="openArticleById('${article.id}')">${escapeHtml(article.titulo)}</a></div>
                    <div class="article-meta">
                        <span><i class="far fa-user"></i> Por ${escapeHtml(article.autorNome || 'Redação')}</span>
                        <span><i class="far fa-calendar"></i> ${date}</span>
                        <span><i class="fas fa-eye"></i> ${article.visualizacoes || 0} visualizações</span>
                    </div>
                    ${article.imagemUrl ? `<div class="article-image"><img src="${article.imagemUrl}" alt="${escapeHtml(article.titulo)}"><div class="image-caption">Foto: Divulgação</div></div>` : ''}
                    <div class="article-excerpt">${escapeHtml((article.resumo || article.conteudo || '').substring(0, 300))}${(article.resumo || article.conteudo || '').length > 300 ? '...' : ''}</div>
                    <a class="read-more" onclick="openArticleById('${article.id}')">Continue lendo →</a>
                </div>
            `;
        }
        
        return `
            <div class="article-card" style="position: relative;">
                ${renderAdminActions(article.id)}
                <div class="article-tag">${tag}</div>
                <div class="article-title"><a onclick="openArticleById('${article.id}')">${escapeHtml(article.titulo)}</a></div>
                <div class="article-meta">
                    <span><i class="far fa-user"></i> ${escapeHtml(article.autorNome || 'Redação')}</span>
                    <span><i class="far fa-calendar"></i> ${date}</span>
                </div>
                <div class="article-excerpt">${escapeHtml((article.resumo || article.conteudo || '').substring(0, 150))}${(article.resumo || article.conteudo || '').length > 150 ? '...' : ''}</div>
                <a class="read-more" onclick="openArticleById('${article.id}')">Continue lendo →</a>
            </div>
        `;
    };

    const leftHtml = leftArticles.map(a => renderArticleCard(a, false)).join('');
    const rightHtml = rightArticles.map(a => renderArticleCard(a, false)).join('');

    document.getElementById('newspaperGrid').innerHTML = `
        <div class="sidebar-left">${leftHtml || '<div class="article-card"><p>📭 Mais matérias em breve...</p></div>'}</div>
        <div>${renderArticleCard(mainArticle, true)}</div>
        <div class="sidebar-right">${rightHtml || '<div class="article-card"><p>📭 Aguardem novas publicações...</p></div>'}</div>
    `;
    
    setTimeout(() => renderWeather(), 300);
}

window.openArticleById = function(articleId) {
    updateUrl(currentCategory, articleId);
    loadArticleById(articleId);
};

// ============================================
// CARREGAR MATÉRIA POR ID
// ============================================
async function loadArticleById(articleId) {
    const grid = document.getElementById('newspaperGrid');
    grid.innerHTML = '<div class="loading"><div class="spinner"></div><p>Carregando matéria...</p></div>';
    
    try {
        const doc = await db.collection('articlesdoc').doc(articleId).get();
        if (!doc.exists) {
            grid.innerHTML = '<div class="loading"><p>📭 Matéria não encontrada. <a onclick="navigateToHome()" style="color:#c0392b; cursor:pointer;">Voltar para página inicial</a></p></div>';
            return;
        }
        
        const article = { id: doc.id, ...doc.data() };
        currentViewArticleId = articleId;
        currentViewArticleData = article;
        
        if (!currentUserIsAdmin) {
            try {
                const novasViews = (article.visualizacoes || 0) + 1;
                await db.collection('articlesdoc').doc(articleId).update({ visualizacoes: novasViews });
            } catch (e) {
                console.log("Não foi possível incrementar visualizações:", e);
            }
        }
        
        renderSingleArticle(article);
    } catch (error) {
        grid.innerHTML = `<div class="loading"><p>❌ Erro ao carregar: ${error.message}</p></div>`;
    }
}

function renderSingleArticle(article) {
    const date = article.dataPublicacao?.toDate?.() ? article.dataPublicacao.toDate().toLocaleDateString('pt-BR') : 'Data desconhecida';
    const categoryIcon = getCategoryIcon(article.categoria);
    
    const adminButtonsHtml = currentUserIsAdmin ? `
        <div style="display: flex; gap: 10px; justify-content: flex-end; margin-bottom: 20px;">
            <button class="btn-warning" onclick="editArticle('${article.id}')">✏️ Editar</button>
            <button class="btn-danger" onclick="deleteArticle('${article.id}')">🗑️ Excluir</button>
        </div>
    ` : '';
    
    document.getElementById('newspaperGrid').innerHTML = `
        <div style="grid-column: 1 / -1; max-width: 900px; margin: 0 auto;">
            ${adminButtonsHtml}
            <div class="main-article">
                <div class="article-tag">${categoryIcon} ${article.categoria?.toUpperCase() || 'GERAL'}</div>
                <div class="article-title">${escapeHtml(article.titulo)}</div>
                <div class="article-meta">
                    <span><i class="far fa-user"></i> Por ${escapeHtml(article.autorNome || 'Redação')}</span>
                    <span><i class="far fa-calendar"></i> ${date}</span>
                    <span><i class="fas fa-eye"></i> ${article.visualizacoes || 0} visualizações</span>
                </div>
                ${article.imagemUrl ? `<div class="article-image"><img src="${article.imagemUrl}" alt="${escapeHtml(article.titulo)}"><div class="image-caption">Foto: Divulgação</div></div>` : ''}
                <div class="article-content" style="font-size: 16px; line-height: 1.8;">
                    ${article.conteudo || article.resumo || 'Conteúdo não disponível.'}
                </div>
                <hr style="margin: 30px 0 20px 0;">
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px;">
                    <button class="btn-share" onclick="showShareModal()">
                        <i class="fas fa-share-alt"></i> Compartilhar esta matéria
                    </button>
                    <button class="btn-outline" onclick="navigateToHome()">
                        <i class="fas fa-home"></i> Voltar para página inicial
                    </button>
                </div>
            </div>
        </div>
    `;
    
    setTimeout(() => renderWeather(), 300);
}

// ============================================
// EDIÇÃO DE ARTIGOS
// ============================================
window.editArticle = async function(articleId) {
    if (!currentUserIsAdmin) {
        showToast('Apenas administradores podem editar matérias!', true);
        return;
    }
    
    try {
        const doc = await db.collection('articlesdoc').doc(articleId).get();
        if (!doc.exists) {
            showToast('Matéria não encontrada!', true);
            return;
        }
        
        const article = doc.data();
        currentEditArticleId = articleId;
        
        document.getElementById('modalTitle').textContent = 'Editar Matéria';
        document.getElementById('articleTitle').value = article.titulo || '';
        document.getElementById('articleCategory').value = article.categoria || 'política';
        document.getElementById('articleExcerpt').value = article.resumo || '';
        document.getElementById('articleContent').value = article.conteudo || '';
        document.getElementById('articleImage').value = article.imagemUrl || '';
        
        document.getElementById('articleModal').classList.add('show');
    } catch (error) {
        showToast('Erro ao carregar matéria para edição: ' + error.message, true);
    }
};

window.deleteArticle = async function(articleId) {
    if (!currentUserIsAdmin) {
        showToast('Apenas administradores podem excluir matérias!', true);
        return;
    }
    
    if (!confirm('Tem certeza que deseja excluir esta matéria? Esta ação não pode ser desfeita!')) {
        return;
    }
    
    try {
        await db.collection('articlesdoc').doc(articleId).delete();
        showToast('Matéria excluída com sucesso!');
        closeModals();
        
        const params = getUrlParams();
        if (params.id === articleId) {
            navigateToHome();
        } else {
            loadArticles();
        }
    } catch (error) {
        showToast('Erro ao excluir: ' + error.message, true);
    }
};

window.editCurrentArticle = function() {
    closeModals();
    setTimeout(() => editArticle(currentViewArticleId), 300);
};

window.deleteCurrentArticle = function() {
    closeModals();
    setTimeout(() => deleteArticle(currentViewArticleId), 300);
};

async function saveArticle() {
    if (!currentUserIsAdmin) {
        showToast('Apenas administradores podem publicar matérias!', true);
        return;
    }
    
    const articleData = {
        titulo: document.getElementById('articleTitle').value,
        categoria: document.getElementById('articleCategory').value,
        resumo: document.getElementById('articleExcerpt').value,
        conteudo: document.getElementById('articleContent').value,
        imagemUrl: document.getElementById('articleImage').value || null,
        autorId: currentUser.uid,
        autorNome: currentUser.displayName || currentUser.email?.split('@')[0] || 'Administrador',
        autorEmail: currentUser.email,
        dataPublicacao: firebase.firestore.FieldValue.serverTimestamp(),
        ultimaEdicao: firebase.firestore.FieldValue.serverTimestamp(),
        visualizacoes: 0
    };
    
    if (!articleData.titulo || !articleData.resumo) {
        showToast('Preencha pelo menos o título e o resumo da matéria!', true);
        return;
    }
    
    try {
        if (currentEditArticleId) {
            await db.collection('articlesdoc').doc(currentEditArticleId).update(articleData);
            showToast('Matéria atualizada com sucesso!');
        } else {
            const docRef = await db.collection('articlesdoc').add(articleData);
            showToast('Matéria publicada com sucesso!');
        }
        closeModals();
        resetArticleForm();
        loadArticles();
    } catch (error) {
        showToast('Erro ao salvar: ' + error.message, true);
    }
}

function resetArticleForm() {
    currentEditArticleId = null;
    document.getElementById('modalTitle').textContent = 'Nova Matéria';
    document.getElementById('articleTitle').value = '';
    document.getElementById('articleCategory').value = 'política';
    document.getElementById('articleExcerpt').value = '';
    document.getElementById('articleContent').value = '';
    document.getElementById('articleImage').value = '';
}

// ============================================
// FILTROS E COMPARTILHAMENTO
// ============================================
window.filterByCategory = function(category) {
    currentCategory = category;
    updateUrl(category);
    highlightActiveCategory(category);
    loadArticles();
};

window.showNewArticleModal = function() {
    if (!currentUserIsAdmin) {
        showToast('Apenas administradores podem criar matérias!', true);
        return;
    }
    resetArticleForm();
    document.getElementById('articleModal').classList.add('show');
};

function getCurrentArticleUrl() {
    if (currentViewArticleId) {
        return `${window.location.origin}${window.location.pathname}?id=${currentViewArticleId}`;
    }
    return window.location.href;
}

window.showShareModal = function() {
    const url = getCurrentArticleUrl();
    document.getElementById('shareUrlContainer').innerHTML = url;
    document.getElementById('shareModal').classList.add('show');
};

window.copyShareUrl = function() {
    const url = document.getElementById('shareUrlContainer').textContent;
    navigator.clipboard.writeText(url).then(() => {
        showToast('Link copiado para compartilhar!');
        closeModals();
    }).catch(() => {
        showToast('Erro ao copiar link', true);
    });
};

// ============================================
// EVENTOS DE NAVEGAÇÃO
// ============================================
window.onclick = (e) => {
    if (e.target.classList.contains('modal')) closeModals();
};

window.onpopstate = (event) => {
    const params = getUrlParams();
    if (params.id) {
        loadArticleById(params.id);
    } else if (params.categoria) {
        currentCategory = params.categoria;
        highlightActiveCategory(currentCategory);
        loadArticles();
    } else {
        currentCategory = 'todos';
        highlightActiveCategory('todos');
        loadArticles();
    }
};

// ============================================
// INICIALIZAÇÃO
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar Cookie Manager
    CookieManager.init();
    
    document.getElementById('currentDate').textContent = new Date().toLocaleDateString('pt-BR', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
});

// ============================================
// OUVINTE DE AUTENTICAÇÃO
// ============================================
auth.onAuthStateChanged(async (user) => {
    if (user) {
        currentUser = user;
        await registerUser(user);
        
        currentUserIsBanned = await checkIfUserIsBanned(user);
        if (currentUserIsBanned) {
            showBannedScreen('Sua conta foi banida por violação das políticas de uso.');
            await auth.signOut();
            updateUI();
            return;
        }
        
        currentUserIsAdmin = await checkIfUserIsAdmin(user);
        updateUI();
        
        await loadNotifications();
        listenNotifications();
        
        const params = getUrlParams();
        if (params.id) {
            await loadArticleById(params.id);
        } else if (params.categoria) {
            currentCategory = params.categoria;
            highlightActiveCategory(currentCategory);
            await loadArticles();
        } else {
            currentCategory = 'todos';
            highlightActiveCategory('todos');
            await loadArticles();
        }
        
        if (!weatherLoaded) {
            setTimeout(() => renderWeather(), 300);
        }
    } else {
        currentUser = null;
        currentUserIsAdmin = false;
        currentUserIsBanned = false;
        updateUI();
        
        document.getElementById('bannedOverlay').classList.remove('show');
        document.querySelector('.newspaper-container').style.opacity = '1';
        document.querySelector('.newspaper-container').style.pointerEvents = 'auto';
        document.querySelector('.header').style.opacity = '1';
        document.querySelector('.header').style.pointerEvents = 'auto';
        document.querySelector('.site-footer').style.opacity = '1';
        document.querySelector('.site-footer').style.pointerEvents = 'auto';
        
        if (notificationListener) {
            notificationListener();
            notificationListener = null;
        }
        notifications = [];
        unreadCount = 0;
        updateNotificationBadge();
        
        const params = getUrlParams();
        if (params.id) {
            await loadArticleById(params.id);
        } else if (params.categoria) {
            currentCategory = params.categoria;
            highlightActiveCategory(currentCategory);
            await loadArticles();
        } else {
            currentCategory = 'todos';
            highlightActiveCategory('todos');
            await loadArticles();
        }
        
        if (!weatherLoaded) {
            setTimeout(() => renderWeather(), 300);
        }
    }
});

// Expor funções globalmente
window.logout = logout;
window.logoutBanned = logoutBanned;
window.loginWithGoogle = loginWithGoogle;
window.navigateToHome = navigateToHome;
window.closeModals = closeModals;
window.showLoginModal = showLoginModal;
window.toggleNotifications = toggleNotifications;
window.markAllAsRead = markAllAsRead;
window.saveArticle = saveArticle;
window.getCurrentArticleUrl = getCurrentArticleUrl;
window.showShareModal = showShareModal;
window.copyShareUrl = copyShareUrl;
window.editArticle = editArticle;
window.deleteArticle = deleteArticle;
window.editCurrentArticle = editCurrentArticle;
window.deleteCurrentArticle = deleteCurrentArticle;
window.openArticleById = openArticleById;
