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
let languageManagerInitialized = false;

const SPECIFIC_ADMIN_UID = "sZxfMuOBPbXdR8nttVPXIN8QOOl1";

// ============================================
// INICIALIZAÇÃO DO LANGUAGE MANAGER
// ============================================
async function initLanguageManager() {
    if (typeof LanguageManager !== 'undefined' && !languageManagerInitialized) {
        await LanguageManager.init('pt');
        languageManagerInitialized = true;
        console.log('🌍 Language Manager inicializado');
        return true;
    }
    return false;
}

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
        this.showToast(getTranslation('cookie_aceitos'));
    },
    
    rejectAll() {
        const consent = { essential: true, analytics: false, advertising: false };
        this.saveConsent(consent);
        this.applyConsent(consent);
        this.hideBanner();
        this.showToast(getTranslation('cookie_recusados'), false);
    },
    
    customize() {
        const analytics = document.getElementById('cookieAnalytics')?.checked !== false;
        const advertising = document.getElementById('cookieAdvertising')?.checked !== false;
        const consent = { essential: true, analytics, advertising };
        this.saveConsent(consent);
        this.applyConsent(consent);
        this.hideBanner();
        this.showToast(getTranslation('cookie_preferencias'));
    },
    
    showToast(message, isError = false) {
        if (typeof showToast === 'function') {
            showToast(message, isError);
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
function getTranslation(key, params = {}) {
    if (typeof LanguageManager !== 'undefined' && LanguageManager.translate) {
        return LanguageManager.translate(key, params);
    }
    return key;
}

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
    if (!timestamp) return getTranslation('data_desconhecida');
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    if (typeof LanguageManager !== 'undefined' && LanguageManager.formatDate) {
        return LanguageManager.formatDate(date);
    }
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
            cookiePreferences: CookieManager.getConsent() || null,
            language: existingData.language || (typeof LanguageManager !== 'undefined' ? LanguageManager.currentLang : 'pt')
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
                <p>${getTranslation('nenhuma_notificacao')}</p>
            </div>
        `;
        return;
    }
    
    const recentNotifs = notifications.slice(0, 10);
    list.innerHTML = recentNotifs.map(notif => `
        <div class="notification-item ${notif.lida ? '' : 'unread'}" onclick="markAsRead('${notif.id}')">
            <div class="notif-title">${escapeHtml(notif.titulo || getTranslation('notificacao'))}</div>
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
        userName.textContent = getTranslation('visitante');
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
        showToast(getTranslation('logout_sucesso'));
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
    details.textContent = `${getTranslation('motivo')} ${reason}`;
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
            <h3><i class="fas fa-cloud-sun"></i> ${getTranslation('previsao_tempo')}</h3>
            <i class="fas fa-map-pin"></i>
        </div>
        <div class="weather-loading">
            <div class="spinner-small"></div>
            <p style="font-size:12px; opacity:0.7;">${getTranslation('carregando_previsao')}</p>
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
                <h3><i class="fas fa-cloud-sun"></i> ${getTranslation('previsao_tempo')}</h3>
                <i class="fas fa-map-pin"></i>
            </div>
            <div class="weather-error">
                <i class="fas fa-exclamation-triangle"></i>
                ${getTranslation('erro_previsao')}
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
            <h3><i class="fas fa-cloud-sun"></i> ${getTranslation('previsao_tempo')}</h3>
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
                <div class="label">${getTranslation('umidade')}</div>
            </div>
            <div class="detail-item">
                <i class="fas fa-wind"></i>
                <div class="value">${Math.round(windSpeed)} km/h</div>
                <div class="label">${getTranslation('vento')}</div>
            </div>
            <div class="detail-item">
                <i class="fas ${iconClass}"></i>
                <div class="value">${desc}</div>
                <div class="label">${getTranslation('condicao')}</div>
            </div>
        </div>
        <div class="weather-update">
            <i class="far fa-clock"></i> ${getTranslation('atualizado_agora')} • Santa Fé do Sul - SP
        </div>
    `;
    weatherLoaded = true;
}

// ============================================
// LOAD ARTICLES - COM BUSCA POR IDIOMA
// ============================================
async function loadArticles() {
    const grid = document.getElementById('newspaperGrid');
    grid.innerHTML = `<div class="loading"><div class="spinner"></div><p>${getTranslation('carregando_noticias')}</p></div>`;
    
    try {
        // Obtém o idioma atual do usuário
        const userLang = typeof LanguageManager !== 'undefined' 
            ? LanguageManager.currentLang 
            : 'pt';
        
        console.log(`🔍 Buscando artigos no idioma: "${userLang}"`);
        console.log(`📂 Categoria: "${currentCategory}"`);
        
        let articles = [];
        
        // Usa o sistema multi-idioma para buscar artigos no idioma do usuário
        if (typeof multiLangArticles !== 'undefined' && multiLangArticles) {
            console.log('✅ Usando MultiLanguageArticles para buscar');
            
            // Busca artigos no idioma do usuário
            articles = await multiLangArticles.searchArticles(userLang, currentCategory);
            console.log(`📊 Encontrados ${articles.length} artigos em "${userLang}"`);
            
            // Se não encontrou artigos no idioma do usuário, busca em português como fallback
            if (articles.length === 0 && userLang !== 'pt') {
                console.log(`📭 Nenhum artigo encontrado em "${userLang}", buscando em português...`);
                articles = await multiLangArticles.searchArticles('pt', currentCategory);
                console.log(`📊 Encontrados ${articles.length} artigos em português (fallback)`);
            }
        } else {
            console.warn('⚠️ MultiLanguageArticles não disponível, usando fallback');
            // Fallback: busca normal
            let query = db.collection('articlesdoc').orderBy('dataPublicacao', 'desc');
            if (currentCategory !== 'todos') {
                query = query.where('categoria', '==', currentCategory);
            }
            const snapshot = await query.get();
            snapshot.forEach(doc => {
                const data = doc.data();
                articles.push({ id: doc.id, ...data });
            });
            console.log(`📊 Encontrados ${articles.length} artigos (fallback)`);
        }
        
        if (articles.length === 0) {
            grid.innerHTML = `<div class="loading"><p>${getTranslation('sem_materias')}</p></div>`;
            return;
        }
        
        // Organiza e renderiza os artigos
        renderArticlesByLanguage(articles);
        
    } catch (error) {
        console.error('❌ Erro ao carregar artigos:', error);
        grid.innerHTML = `<div class="loading"><p>${getTranslation('erro_carregar')} ${error.message}</p></div>`;
    }
}

// ============================================
// RENDER ARTICLES BY LANGUAGE
// ============================================
function renderArticlesByLanguage(articles) {
    // Separa artigos por idioma
    const userLang = typeof LanguageManager !== 'undefined' 
        ? LanguageManager.currentLang 
        : 'pt';
    
    // Organiza: artigos no idioma do usuário primeiro, depois fallback
    const primaryLangArticles = articles.filter(a => a._currentLanguage === userLang);
    const fallbackArticles = articles.filter(a => a._isFallback === true);
    const otherArticles = articles.filter(a => a._currentLanguage !== userLang && !a._isFallback);
    
    // Ordena: primeiro os do idioma do usuário, depois os fallback, depois outros
    const sortedArticles = [...primaryLangArticles, ...fallbackArticles, ...otherArticles];
    
    renderArticles(sortedArticles);
}

// ============================================
// RENDER ARTICLES (função existente atualizada)
// ============================================
function renderArticles(articles) {
    // Mostra indicador de idioma nos artigos
    const userLang = typeof LanguageManager !== 'undefined' 
        ? LanguageManager.currentLang 
        : 'pt';
    
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
        const autor = article.autorNome || getTranslation('redacao');
        const views = article.visualizacoes || 0;
        
        // Mostra indicador de idioma se for fallback ou tradução
        let langIndicator = '';
        if (article._isFallback) {
            langIndicator = `<span style="font-size:10px; color:#999; background:#f0f0f0; padding:2px 8px; border-radius:10px; margin-left:5px;">🌐 Traduzido</span>`;
        } else if (article._currentLanguage && article._currentLanguage !== 'pt') {
            const langInfo = typeof LanguageManager !== 'undefined' && LanguageManager.availableLanguages 
                ? LanguageManager.availableLanguages[article._currentLanguage] 
                : null;
            langIndicator = `<span style="font-size:10px; color:#999; background:#f0f0f0; padding:2px 8px; border-radius:10px; margin-left:5px;">${langInfo?.flag || '🌐'} ${langInfo?.name || article._currentLanguage.toUpperCase()}</span>`;
        }
        
        if (isMain) {
            return `
                <div class="main-article" style="position: relative;">
                    ${renderAdminActions(article.id)}
                    <div class="article-tag">${tag} · ${getTranslation('destaque')} ${langIndicator}</div>
                    <div class="article-title"><a onclick="openArticleById('${article.id}')">${escapeHtml(article.titulo)}</a></div>
                    <div class="article-meta">
                        <span><i class="far fa-user"></i> ${getTranslation('por')} ${escapeHtml(autor)}</span>
                        <span><i class="far fa-calendar"></i> ${date}</span>
                        <span><i class="fas fa-eye"></i> ${views} ${getTranslation('visualizacoes')}</span>
                    </div>
                    ${article.imagemUrl ? `<div class="article-image"><img src="${article.imagemUrl}" alt="${escapeHtml(article.titulo)}"><div class="image-caption">${getTranslation('foto_divulgacao')}</div></div>` : ''}
                    <div class="article-excerpt">${escapeHtml((article.resumo || article.conteudo || '').substring(0, 300))}${(article.resumo || article.conteudo || '').length > 300 ? '...' : ''}</div>
                    <a class="read-more" onclick="openArticleById('${article.id}')">${getTranslation('continue_lendo')}</a>
                </div>
            `;
        }
        
        return `
            <div class="article-card" style="position: relative;">
                ${renderAdminActions(article.id)}
                <div class="article-tag">${tag} ${langIndicator}</div>
                <div class="article-title"><a onclick="openArticleById('${article.id}')">${escapeHtml(article.titulo)}</a></div>
                <div class="article-meta">
                    <span><i class="far fa-user"></i> ${escapeHtml(autor)}</span>
                    <span><i class="far fa-calendar"></i> ${date}</span>
                </div>
                <div class="article-excerpt">${escapeHtml((article.resumo || article.conteudo || '').substring(0, 150))}${(article.resumo || article.conteudo || '').length > 150 ? '...' : ''}</div>
                <a class="read-more" onclick="openArticleById('${article.id}')">${getTranslation('continue_lendo')}</a>
            </div>
        `;
    };

    const leftHtml = leftArticles.map(a => renderArticleCard(a, false)).join('');
    const rightHtml = rightArticles.map(a => renderArticleCard(a, false)).join('');

    document.getElementById('newspaperGrid').innerHTML = `
        <div class="sidebar-left">${leftHtml || `<div class="article-card"><p>${getTranslation('materias_breve')}</p></div>`}</div>
        <div>${renderArticleCard(mainArticle, true)}</div>
        <div class="sidebar-right">${rightHtml || `<div class="article-card"><p>${getTranslation('aguardem_publicacoes')}</p></div>`}</div>
    `;
    
    // Adiciona aviso se estiver vendo traduções
    const hasFallback = articles.some(a => a._isFallback === true);
    if (hasFallback) {
        const langName = typeof LanguageManager !== 'undefined' && LanguageManager.availableLanguages 
            ? LanguageManager.availableLanguages[LanguageManager.currentLang]?.nativeName 
            : 'Português';
        const notice = document.createElement('div');
        notice.style.cssText = 'text-align:center; padding:10px; font-size:12px; color:#999; border-top:1px solid #eee; margin-top:20px;';
        notice.innerHTML = `ℹ️ Algumas matérias estão sendo exibidas em Português (tradução automática) pois não estão disponíveis em ${langName}.`;
        document.querySelector('.newspaper-grid').appendChild(notice);
    }
    
    setTimeout(() => renderWeather(), 300);
}

window.openArticleById = async function(articleId) {
    updateUrl(currentCategory, articleId);
    await loadArticleById(articleId);
};

// ============================================
// CARREGAR MATÉRIA POR ID - CORRIGIDA
// ============================================
async function loadArticleById(articleId) {
    const grid = document.getElementById('newspaperGrid');
    grid.innerHTML = `<div class="loading"><div class="spinner"></div><p>${getTranslation('carregando_materia')}</p></div>`;
    
    try {
        let article = null;
        const userLang = typeof LanguageManager !== 'undefined' 
            ? LanguageManager.currentLang 
            : 'pt';
        
        // Tenta usar o sistema multi-idioma
        if (typeof multiLangArticles !== 'undefined' && multiLangArticles) {
            console.log(`🔍 Buscando artigo ${articleId} no idioma: ${userLang}`);
            article = await multiLangArticles.getArticleById(articleId, userLang);
        }
        
        // Fallback: busca direto se o multi-idioma falhou
        if (!article) {
            console.log(`📄 Fallback: buscando artigo ${articleId} diretamente`);
            const doc = await db.collection('articlesdoc').doc(articleId).get();
            if (doc.exists) {
                article = { id: doc.id, ...doc.data() };
                // Marca como fallback
                article._isFallback = true;
                article._currentLanguage = article.language || 'pt';
            }
        }
        
        if (!article) {
            grid.innerHTML = `<div class="loading"><p>${getTranslation('materia_nao_encontrada')} <a onclick="navigateToHome()" style="color:#c0392b; cursor:pointer;">${getTranslation('voltar_inicio')}</a></p></div>`;
            return;
        }
        
        // GARANTE que o conteúdo existe
        if (!article.conteudo && !article.resumo) {
            console.warn(`⚠️ Artigo ${articleId} não tem conteúdo nem resumo`);
            article.conteudo = '<p>Conteúdo não disponível para este artigo.</p>';
            article.resumo = 'Conteúdo não disponível.';
        }
        
        // GARANTE que o título existe
        if (!article.titulo) {
            article.titulo = 'Artigo sem título';
        }
        
        currentViewArticleId = articleId;
        currentViewArticleData = article;
        
        // Incrementa visualizações (apenas se não for admin)
        if (!currentUserIsAdmin) {
            try {
                const novasViews = (article.visualizacoes || 0) + 1;
                await db.collection('articlesdoc').doc(articleId).update({ visualizacoes: novasViews });
            } catch (e) {
                console.log("⚠️ Não foi possível incrementar visualizações:", e);
            }
        }
        
        renderSingleArticle(article);
    } catch (error) {
        console.error('❌ Erro ao carregar artigo:', error);
        grid.innerHTML = `<div class="loading"><p>${getTranslation('erro_carregar')} ${error.message}</p></div>`;
    }
}

// ============================================
// RENDER SINGLE ARTICLE - CORRIGIDA
// ============================================
function renderSingleArticle(article) {
    // GARANTE que temos conteúdo
    const content = article.conteudo || article.resumo || '<p>Conteúdo não disponível.</p>';
    const title = article.titulo || 'Artigo sem título';
    const date = article.dataPublicacao?.toDate?.() ? article.dataPublicacao.toDate().toLocaleDateString('pt-BR') : 'Data desconhecida';
    const categoryIcon = getCategoryIcon(article.categoria);
    const autor = article.autorNome || getTranslation('redacao');
    const views = article.visualizacoes || 0;
    
    // Mostra informações de idioma
    let languageInfo = '';
    if (article._isFallback) {
        languageInfo = `
            <div style="background:#fff3cd; border:1px solid #ffc107; border-radius:8px; padding:10px; margin-bottom:15px; font-size:13px; color:#856404;">
                <i class="fas fa-language"></i> 
                ⚠️ Esta matéria não está disponível no idioma selecionado. Exibindo em Português (tradução automática).
            </div>
        `;
    } else if (article._currentLanguage && article._currentLanguage !== 'pt') {
        const langInfo = typeof LanguageManager !== 'undefined' && LanguageManager.availableLanguages 
            ? LanguageManager.availableLanguages[article._currentLanguage] 
            : null;
        languageInfo = `
            <div style="background:#d4edda; border:1px solid #28a745; border-radius:8px; padding:10px; margin-bottom:15px; font-size:13px; color:#155724;">
                <i class="fas fa-language"></i> 
                📖 Lendo em ${langInfo?.nativeName || article._currentLanguage.toUpperCase()}
                ${article._availableLanguages ? `| Disponível em: ${article._availableLanguages.map(l => {
                    const info = LanguageManager?.availableLanguages?.[l];
                    return info ? `${info.flag} ${info.name}` : l.toUpperCase();
                }).join(', ')}` : ''}
            </div>
        `;
    }
    
    const adminButtonsHtml = currentUserIsAdmin ? `
        <div style="display: flex; gap: 10px; justify-content: flex-end; margin-bottom: 20px; flex-wrap: wrap;">
            <button class="btn-warning" onclick="editArticle('${article.id}')">${getTranslation('editar')}</button>
            <button class="btn-danger" onclick="deleteArticle('${article.id}')">${getTranslation('excluir')}</button>
            ${article.isMultiLanguage ? `<button class="btn-primary" onclick="showTranslationManager('${article.id}')" style="font-size:12px;">${getTranslation('gerenciar_traducoes')}</button>` : ''}
        </div>
    ` : '';
    
    document.getElementById('newspaperGrid').innerHTML = `
        <div style="grid-column: 1 / -1; max-width: 900px; margin: 0 auto;">
            ${adminButtonsHtml}
            ${languageInfo}
            <div class="main-article">
                <div class="article-tag">${categoryIcon} ${article.categoria?.toUpperCase() || 'GERAL'}</div>
                <div class="article-title">${escapeHtml(article.titulo)}</div>
                <div class="article-meta">
                    <span><i class="far fa-user"></i> ${getTranslation('por')} ${escapeHtml(autor)}</span>
                    <span><i class="far fa-calendar"></i> ${date}</span>
                    <span><i class="fas fa-eye"></i> ${views} ${getTranslation('visualizacoes')}</span>
                </div>
                ${article.imagemUrl ? `<div class="article-image"><img src="${article.imagemUrl}" alt="${escapeHtml(article.titulo)}"><div class="image-caption">${getTranslation('foto_divulgacao')}</div></div>` : ''}
                <div class="article-content" style="font-size: 16px; line-height: 1.8;">
                    ${article.conteudo || article.resumo || getTranslation('conteudo_indisponivel')}
                </div>
                <hr style="margin: 30px 0 20px 0;">
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px;">
                    <button class="btn-share" onclick="showShareModal()">
                        <i class="fas fa-share-alt"></i> ${getTranslation('compartilhar_materia')}
                    </button>
                    <button class="btn-outline" onclick="navigateToHome()">
                        <i class="fas fa-home"></i> ${getTranslation('voltar_inicio')}
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
        
        document.getElementById('modalTitle').textContent = getTranslation('editar_materia_titulo');
        document.getElementById('articleTitle').value = article.titulo || '';
        document.getElementById('articleCategory').value = article.categoria || 'política';
        document.getElementById('articleExcerpt').value = article.resumo || '';
        document.getElementById('articleContent').value = article.conteudo || '';
        document.getElementById('articleImage').value = article.imagemUrl || '';
        
        const translationsContainer = document.getElementById('translationsContainer');
        if (translationsContainer) {
            translationsContainer.style.display = 'none';
        }
        
        const saveBtn = document.querySelector('#articleModal .btn-primary');
        if (saveBtn) {
            saveBtn.textContent = getTranslation('publicar_materia');
            saveBtn.onclick = saveArticle;
        }
        
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
        showToast(getTranslation('materia_excluida'));
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

// ============================================
// SAVE ARTICLE
// ============================================
async function saveArticle() {
    if (!currentUserIsAdmin) {
        showToast('Apenas administradores podem publicar matérias!', true);
        return;
    }
    
    const langSelect = document.getElementById('articleLanguages');
    const selectedLanguages = langSelect ? Array.from(langSelect.selectedOptions).map(opt => opt.value) : ['pt'];
    
    const articleData = {
        titulo: document.getElementById('articleTitle').value.trim(),
        categoria: document.getElementById('articleCategory').value,
        resumo: document.getElementById('articleExcerpt').value.trim(),
        conteudo: document.getElementById('articleContent').value,
        imagemUrl: document.getElementById('articleImage').value || null,
        autorId: currentUser.uid,
        autorNome: currentUser.displayName || currentUser.email?.split('@')[0] || 'Administrador',
        autorEmail: currentUser.email,
    };
    
    if (!articleData.titulo || !articleData.resumo) {
        showToast('Preencha pelo menos o título e o resumo da matéria!', true);
        return;
    }
    
    try {
        if (currentEditArticleId) {
            await db.collection('articlesdoc').doc(currentEditArticleId).update({
                ...articleData,
                ultimaEdicao: firebase.firestore.FieldValue.serverTimestamp()
            });
            showToast(getTranslation('materia_atualizada'));
        } else {
            // Coleta traduções para outros idiomas
            for (const lang of selectedLanguages) {
                if (lang === 'pt') continue;
                const titleField = document.getElementById(`trans_title_${lang}`);
                const excerptField = document.getElementById(`trans_excerpt_${lang}`);
                const contentField = document.getElementById(`trans_content_${lang}`);
                if (titleField) {
                    articleData[`translation_${lang}`] = {
                        titulo: titleField.value || `[${lang.toUpperCase()}] ${articleData.titulo}`,
                        resumo: excerptField?.value || `[${lang.toUpperCase()}] ${articleData.resumo}`,
                        conteudo: contentField?.value || `[${lang.toUpperCase()}] ${articleData.conteudo}`
                    };
                }
            }
            
            const hasMultipleLanguages = selectedLanguages.length > 1 || (selectedLanguages.length === 1 && selectedLanguages[0] !== 'pt');
            
            if (hasMultipleLanguages && typeof multiLangArticles !== 'undefined' && multiLangArticles) {
                await multiLangArticles.saveArticleWithLanguages(articleData, selectedLanguages);
            } else {
                await db.collection('articlesdoc').add({
                    ...articleData,
                    isMultiLanguage: false,
                    language: 'pt',
                    dataPublicacao: firebase.firestore.FieldValue.serverTimestamp(),
                    ultimaEdicao: firebase.firestore.FieldValue.serverTimestamp(),
                    visualizacoes: 0
                });
            }
            showToast(getTranslation('materia_publicada'));
        }
        closeModals();
        resetArticleForm();
        loadArticles();
    } catch (error) {
        showToast('Erro ao salvar: ' + error.message, true);
    }
}

// ============================================
// RESET ARTICLE FORM
// ============================================
function resetArticleForm() {
    currentEditArticleId = null;
    document.getElementById('modalTitle').textContent = getTranslation('nova_materia_titulo');
    document.getElementById('articleTitle').value = '';
    document.getElementById('articleCategory').value = 'política';
    document.getElementById('articleExcerpt').value = '';
    document.getElementById('articleContent').value = '';
    document.getElementById('articleImage').value = '';
    
    const translationsContainer = document.getElementById('translationsContainer');
    if (translationsContainer) {
        translationsContainer.style.display = 'none';
    }
    
    const translationFields = document.getElementById('translationFields');
    if (translationFields) {
        translationFields.innerHTML = '';
    }
    
    const saveBtn = document.querySelector('#articleModal .btn-primary');
    if (saveBtn) {
        saveBtn.textContent = getTranslation('publicar_materia');
        saveBtn.onclick = saveArticle;
    }
}

// ============================================
// GERENCIADOR DE TRADUÇÕES
// ============================================
function showTranslationManager(articleId) {
    if (!currentUserIsAdmin) {
        showToast(getTranslation('apenas_admin'), true);
        return;
    }
    
    db.collection('articlesdoc').doc(articleId).get().then(doc => {
        if (!doc.exists) {
            showToast('Artigo não encontrado!', true);
            return;
        }
        
        const data = doc.data();
        currentEditArticleId = articleId;
        
        document.getElementById('modalTitle').textContent = getTranslation('gerenciar_traducoes');
        document.getElementById('articleTitle').value = data.titulo || '';
        document.getElementById('articleCategory').value = data.categoria || 'política';
        document.getElementById('articleExcerpt').value = data.resumo || '';
        document.getElementById('articleContent').value = data.conteudo || '';
        document.getElementById('articleImage').value = data.imagemUrl || '';
        
        const translationsContainer = document.getElementById('translationsContainer');
        translationsContainer.style.display = 'block';
        
        const translationFields = document.getElementById('translationFields');
        const languages = data.languages || ['pt'];
        const translations = data.translations || {};
        
        let fieldsHtml = '';
        languages.forEach(lang => {
            if (lang === 'pt') return;
            const t = translations[lang] || {};
            const langInfo = typeof LanguageManager !== 'undefined' && LanguageManager.availableLanguages 
                ? LanguageManager.availableLanguages[lang] 
                : null;
            const langName = langInfo?.nativeName || lang.toUpperCase();
            const flag = langInfo?.flag || '🌐';
            
            fieldsHtml += `
                <div style="border:1px solid #e0e0e0; padding:15px; border-radius:8px; margin-bottom:12px; background:#f9f9f9;">
                    <h5 style="color:#1a3c5e; margin-bottom:10px; font-size:14px;">${flag} ${langName}</h5>
                    <div class="form-group" style="margin-bottom:8px;">
                        <label style="font-size:12px; color:#666;">Título em ${langName}</label>
                        <input type="text" id="trans_title_${lang}" value="${escapeHtml(t.titulo || '')}" placeholder="Título traduzido" style="width:100%; padding:8px 12px; border:1px solid #ddd; border-radius:6px; font-size:13px;">
                    </div>
                    <div class="form-group" style="margin-bottom:8px;">
                        <label style="font-size:12px; color:#666;">Resumo em ${langName}</label>
                        <textarea id="trans_excerpt_${lang}" rows="2" placeholder="Resumo traduzido" style="width:100%; padding:8px 12px; border:1px solid #ddd; border-radius:6px; font-size:13px; resize:vertical;">${escapeHtml(t.resumo || '')}</textarea>
                    </div>
                    <div class="form-group" style="margin-bottom:0;">
                        <label style="font-size:12px; color:#666;">Conteúdo em ${langName}</label>
                        <textarea id="trans_content_${lang}" rows="4" placeholder="Conteúdo traduzido" style="width:100%; padding:8px 12px; border:1px solid #ddd; border-radius:6px; font-size:13px; resize:vertical;">${escapeHtml(t.conteudo || '')}</textarea>
                    </div>
                </div>
            `;
        });
        translationFields.innerHTML = fieldsHtml;
        
        // Botão para adicionar novo idioma
        const availableLangs = typeof LanguageManager !== 'undefined' && LanguageManager.availableLanguages 
            ? Object.keys(LanguageManager.availableLanguages) 
            : [];
        const usedLangs = languages;
        const availableToAdd = availableLangs.filter(l => !usedLangs.includes(l) && l !== 'pt');
        
        if (availableToAdd.length > 0) {
            const addHtml = `
                <div style="margin-top:10px; padding:12px; border:1px dashed #ccc; border-radius:8px;">
                    <label style="font-size:13px; color:#666; display:block; margin-bottom:5px;">${getTranslation('adicionar_idioma')}</label>
                    <select id="addLanguageSelect" style="width:100%; padding:8px; border-radius:6px; border:1px solid #ddd;">
                        ${availableToAdd.map(l => `<option value="${l}">${LanguageManager.availableLanguages[l].flag} ${LanguageManager.availableLanguages[l].nativeName}</option>`).join('')}
                    </select>
                    <button onclick="addLanguageField()" class="btn-primary" style="margin-top:8px; font-size:12px; padding:8px 16px;">${getTranslation('adicionar_idioma')}</button>
                </div>
            `;
            translationFields.innerHTML += addHtml;
        }
        
        const saveBtn = document.querySelector('#articleModal .btn-primary');
        saveBtn.textContent = getTranslation('salvar_traducoes');
        saveBtn.onclick = saveTranslations;
        
        document.getElementById('articleModal').classList.add('show');
    }).catch(error => {
        showToast('Erro ao carregar traduções: ' + error.message, true);
    });
}

function addLanguageField() {
    const select = document.getElementById('addLanguageSelect');
    if (!select) return;
    
    const lang = select.value;
    if (!lang) return;
    
    const langInfo = typeof LanguageManager !== 'undefined' && LanguageManager.availableLanguages 
        ? LanguageManager.availableLanguages[lang] 
        : null;
    const langName = langInfo?.nativeName || lang.toUpperCase();
    const flag = langInfo?.flag || '🌐';
    
    const container = document.getElementById('translationFields');
    
    const div = document.createElement('div');
    div.style.cssText = 'border:2px solid #4a9eff; padding:15px; border-radius:8px; margin-bottom:12px; background:#f0f7ff;';
    div.innerHTML = `
        <h5 style="color:#1a3c5e; margin-bottom:10px; font-size:14px;">${flag} ${langName} <span style="font-size:11px; color:#999;">${getTranslation('novo_idioma')}</span></h5>
        <div class="form-group" style="margin-bottom:8px;">
            <label style="font-size:12px; color:#666;">Título em ${langName}</label>
            <input type="text" id="trans_title_${lang}" placeholder="Título traduzido" style="width:100%; padding:8px 12px; border:1px solid #ddd; border-radius:6px; font-size:13px;">
        </div>
        <div class="form-group" style="margin-bottom:8px;">
            <label style="font-size:12px; color:#666;">Resumo em ${langName}</label>
            <textarea id="trans_excerpt_${lang}" rows="2" placeholder="Resumo traduzido" style="width:100%; padding:8px 12px; border:1px solid #ddd; border-radius:6px; font-size:13px; resize:vertical;"></textarea>
        </div>
        <div class="form-group" style="margin-bottom:0;">
            <label style="font-size:12px; color:#666;">Conteúdo em ${langName}</label>
            <textarea id="trans_content_${lang}" rows="4" placeholder="Conteúdo traduzido" style="width:100%; padding:8px 12px; border:1px solid #ddd; border-radius:6px; font-size:13px; resize:vertical;"></textarea>
        </div>
    `;
    container.appendChild(div);
    
    select.remove(select.selectedIndex);
    if (select.options.length === 0) {
        select.parentElement.style.display = 'none';
    }
}

async function saveTranslations() {
    if (!currentEditArticleId) {
        showToast('Erro: Nenhum artigo selecionado!', true);
        return;
    }
    
    try {
        const docRef = db.collection('articlesdoc').doc(currentEditArticleId);
        const doc = await docRef.get();
        if (!doc.exists) {
            showToast('Artigo não encontrado!', true);
            return;
        }
        
        const data = doc.data();
        const translations = data.translations || {};
        const languages = data.languages || ['pt'];
        
        // Coleta todas as traduções dos campos
        const translationFields = document.querySelectorAll('#translationFields [id^="trans_title_"]');
        translationFields.forEach(field => {
            const lang = field.id.replace('trans_title_', '');
            const title = document.getElementById(`trans_title_${lang}`)?.value || '';
            const excerpt = document.getElementById(`trans_excerpt_${lang}`)?.value || '';
            const content = document.getElementById(`trans_content_${lang}`)?.value || '';
            
            if (title || excerpt || content) {
                translations[lang] = { titulo: title, resumo: excerpt, conteudo: content };
                if (!languages.includes(lang)) {
                    languages.push(lang);
                }
            }
        });
        
        await docRef.update({
            translations: translations,
            languages: languages,
            isMultiLanguage: true,
            ultimaEdicao: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        showToast(getTranslation('traducoes_salvas'));
        closeModals();
        resetArticleForm();
        loadArticles();
    } catch (error) {
        showToast(getTranslation('erro_salvar_traducoes') + ' ' + error.message, true);
    }
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
    
    const translationsContainer = document.getElementById('translationsContainer');
    if (translationsContainer) {
        translationsContainer.style.display = 'block';
    }
    
    const langSelect = document.getElementById('articleLanguages');
    const translationFields = document.getElementById('translationFields');
    
    if (langSelect && translationFields) {
        const newLangSelect = langSelect.cloneNode(true);
        langSelect.parentNode.replaceChild(newLangSelect, langSelect);
        
        newLangSelect.addEventListener('change', function() {
            const selected = Array.from(this.selectedOptions).map(opt => opt.value);
            let fieldsHtml = '';
            
            selected.forEach(lang => {
                if (lang === 'pt') return;
                const langInfo = typeof LanguageManager !== 'undefined' && LanguageManager.availableLanguages 
                    ? LanguageManager.availableLanguages[lang] 
                    : null;
                const langName = langInfo?.nativeName || lang.toUpperCase();
                const flag = langInfo?.flag || '🌐';
                
                fieldsHtml += `
                    <div style="border:1px solid #e0e0e0; padding:15px; border-radius:8px; margin-bottom:12px; background:#f9f9f9;">
                        <h5 style="color:#1a3c5e; margin-bottom:10px; font-size:14px;">${flag} ${langName}</h5>
                        <div class="form-group" style="margin-bottom:8px;">
                            <label style="font-size:12px; color:#666;">Título em ${langName}</label>
                            <input type="text" id="trans_title_${lang}" placeholder="Digite o título traduzido..." style="width:100%; padding:8px 12px; border:1px solid #ddd; border-radius:6px; font-size:13px;">
                        </div>
                        <div class="form-group" style="margin-bottom:8px;">
                            <label style="font-size:12px; color:#666;">Resumo em ${langName}</label>
                            <textarea id="trans_excerpt_${lang}" rows="2" placeholder="Digite o resumo traduzido..." style="width:100%; padding:8px 12px; border:1px solid #ddd; border-radius:6px; font-size:13px; resize:vertical;"></textarea>
                        </div>
                        <div class="form-group" style="margin-bottom:0;">
                            <label style="font-size:12px; color:#666;">Conteúdo em ${langName}</label>
                            <textarea id="trans_content_${lang}" rows="4" placeholder="Digite o conteúdo traduzido..." style="width:100%; padding:8px 12px; border:1px solid #ddd; border-radius:6px; font-size:13px; resize:vertical;"></textarea>
                        </div>
                    </div>
                `;
            });
            
            translationFields.innerHTML = fieldsHtml;
            
            if (translationsContainer) {
                translationsContainer.style.display = selected.length > 1 || (selected.length === 1 && selected[0] !== 'pt') ? 'block' : 'none';
            }
        });
        
        const event = new Event('change');
        newLangSelect.dispatchEvent(event);
    }
    
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
        showToast(getTranslation('link_copiado'));
        closeModals();
    }).catch(() => {
        showToast(getTranslation('erro_copiar_link'), true);
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
document.addEventListener('DOMContentLoaded', async function() {
    // Inicializa Cookie Manager
    CookieManager.init();
    
    // Inicializa Language Manager
    await initLanguageManager();
    
    // Atualiza data
    const dateElement = document.getElementById('currentDate');
    if (dateElement) {
        if (typeof LanguageManager !== 'undefined' && LanguageManager.updateDateLocale) {
            LanguageManager.updateDateLocale();
        } else {
            dateElement.textContent = new Date().toLocaleDateString('pt-BR', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
            });
        }
    }
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

// ============================================
// LINK INTERCEPTOR
// ============================================
function loadLinkInterceptor() {
    if (typeof LinkInterceptor !== 'undefined') {
        LinkInterceptor.init();
        return;
    }
    
    const script = document.createElement('script');
    script.src = 'https://gspotfverwazzimagiygg.wazzimagiygg.com/jornal/link-interceptor.js';
    script.onload = function() {
        console.log('✅ LinkInterceptor carregado com sucesso');
        if (typeof LinkInterceptor !== 'undefined') {
            LinkInterceptor.init();
            LinkInterceptor.REDIRECT_PAGE = 'https://wazzimagiygg.com/rv/';
        }
    };
    script.onerror = function() {
        console.warn('⚠️ Não foi possível carregar o LinkInterceptor');
        setupFallbackInterceptor();
    };
    document.head.appendChild(script);
}

function setupFallbackInterceptor() {
    console.log('🔄 Usando fallback para interceptação de links');
    document.addEventListener('click', function(e) {
        const link = e.target.closest('a[href]');
        if (!link) return;
        const href = link.getAttribute('href');
        if (!href || href.startsWith('#') || href.startsWith('javascript:')) return;
        try {
            const url = new URL(href, window.location.origin);
            const isExternal = !['wazzimagiygg.com', 'localhost'].some(d => 
                url.hostname === d || url.hostname.endsWith('.' + d)
            );
            if (isExternal) {
                e.preventDefault();
                const uid = currentUser ? currentUser.uid : 'visitante';
                const redirectUrl = `https://wazzimagiygg.com/rv/?uid=${encodeURIComponent(href)}&url=${encodeURIComponent(href)}&ref=${encodeURIComponent(window.location.href)}`;
                if (link.target === '_blank') {
                    window.open(redirectUrl, '_blank');
                } else {
                    window.location.href = redirectUrl;
                }
            }
        } catch {
            // URL inválida, ignora
        }
    });
}

function createSecureLink(url, text, options = {}) {
    if (typeof LinkInterceptor !== 'undefined') {
        const uid = LinkInterceptor.getUserUID();
        const secureUrl = LinkInterceptor.buildRedirectUrl(url, uid);
        const link = document.createElement('a');
        link.href = secureUrl;
        link.textContent = text || url;
        link.target = options.target || '_blank';
        link.rel = 'noopener noreferrer';
        if (options.className) link.className = options.className;
        if (options.icon) {
            const icon = document.createElement('span');
            icon.textContent = options.icon + ' ';
            link.prepend(icon);
        }
        return link;
    }
    const link = document.createElement('a');
    link.href = url;
    link.textContent = text || url;
    link.target = options.target || '_blank';
    return link;
}

window.createSecureLink = createSecureLink;
window.secureExternalLinks = function(container) {
    if (typeof LinkInterceptor !== 'undefined') {
        LinkInterceptor.processExistingLinks();
    }
};

// Carrega o LinkInterceptor
if (document.readyState === 'complete') {
    setTimeout(loadLinkInterceptor, 1000);
} else {
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(loadLinkInterceptor, 1000);
    });
}

if (typeof firebase !== 'undefined' && firebase.auth) {
    firebase.auth().onAuthStateChanged(function(user) {
        if (user && user.uid) {
            document.cookie = `wzzm_uid=${user.uid}; path=/; max-age=86400; samesite=lax`;
            localStorage.setItem('wzzm_user_uid', user.uid);
        }
    });
}

console.log('🔗 Sistema de links seguros integrado ao script.js');

// ============================================
// EXPORTA FUNÇÕES GLOBALMENTE
// ============================================
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
window.showTranslationManager = showTranslationManager;
window.addLanguageField = addLanguageField;
window.saveTranslations = saveTranslations;
window.initLanguageManager = initLanguageManager;
window.getTranslation = getTranslation;




//end of script
