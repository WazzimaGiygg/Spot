// ============================================
// SEARCH.JS - WazzimaGiygg Search
// ============================================

// ==================== FIREBASE ====================
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

// ==================== VARIÁVEIS ====================
let currentUser = null;
let isBanned = false;
let isAdmin = false;
let notifications = [];
let unreadCount = 0;
let notificationListener = null;

// ==================== ANTI-ABUSE ====================
let accessCount = 0;
let lastAccessTime = Date.now();
let isCaptchaActive = false;
let captchaSolved = false;
const MAX_ACCESS = 5;
const TIME_WINDOW = 60000;

function checkAbuse() {
    if (captchaSolved) return true;
    const now = Date.now();
    if (now - lastAccessTime > TIME_WINDOW) {
        accessCount = 0;
        lastAccessTime = now;
    }
    accessCount++;
    lastAccessTime = now;
    if (accessCount > MAX_ACCESS && !isCaptchaActive) {
        showCaptcha();
        return false;
    }
    return true;
}

function showCaptcha() {
    if (captchaSolved) return;
    isCaptchaActive = true;
    document.getElementById('captchaOverlay').classList.add('show');
    document.getElementById('warningBanner').classList.add('show');
    initMazeGame();
}

function hideCaptcha() {
    document.getElementById('captchaOverlay').classList.remove('show');
    isCaptchaActive = false;
    captchaSolved = true;
    accessCount = 0;
    lastAccessTime = Date.now();
    setTimeout(() => {
        document.getElementById('warningBanner').classList.remove('show');
    }, 3000);
}

// ==================== MAZE GAME ====================
const MAZE_SIZE = 21;
let mazeCanvas = null;
let mazeCtx = null;
let mazeWalls = [];
let mazePlayerPos = { x: 0, y: 0 };
let mazeGoalPos = { x: 0, y: 0 };
let mazeStartPos = { x: 0, y: 0 };
let mazeGameActive = true;
let mazeCellSize = 23;

function generateMaze() {
    let grid = Array(MAZE_SIZE).fill().map(() => Array(MAZE_SIZE).fill(true));
    let startX = 1 + Math.floor(Math.random() * ((MAZE_SIZE-2)/2)) * 2;
    let startY = 1 + Math.floor(Math.random() * ((MAZE_SIZE-2)/2)) * 2;
    let goalX = 1 + Math.floor(Math.random() * ((MAZE_SIZE-2)/2)) * 2;
    let goalY = 1 + Math.floor(Math.random() * ((MAZE_SIZE-2)/2)) * 2;
    
    while(startX === goalX && startY === goalY) {
        goalX = 1 + Math.floor(Math.random() * ((MAZE_SIZE-2)/2)) * 2;
        goalY = 1 + Math.floor(Math.random() * ((MAZE_SIZE-2)/2)) * 2;
    }
    
    for(let i = 0; i < MAZE_SIZE; i++) {
        for(let j = 0; j < MAZE_SIZE; j++) {
            if(i % 2 === 1 && j % 2 === 1) grid[i][j] = false;
        }
    }
    
    let walls = [];
    let visited = Array(MAZE_SIZE).fill().map(() => Array(MAZE_SIZE).fill(false));
    visited[startY][startX] = true;
    
    const addWalls = (x, y) => {
        const dirs = [[0, -2], [0, 2], [-2, 0], [2, 0]];
        for(let [dx, dy] of dirs) {
            let nx = x + dx, ny = y + dy;
            if(nx > 0 && nx < MAZE_SIZE-1 && ny > 0 && ny < MAZE_SIZE-1 && !visited[ny][nx]) {
                walls.push({x: x + dx/2, y: y + dy/2, nextX: nx, nextY: ny});
            }
        }
    };
    
    addWalls(startX, startY);
    
    while(walls.length > 0) {
        let randomIndex = Math.floor(Math.random() * walls.length);
        let wall = walls[randomIndex];
        walls.splice(randomIndex, 1);
        if(!visited[wall.nextY][wall.nextX]) {
            grid[wall.y][wall.x] = false;
            visited[wall.nextY][wall.nextX] = true;
            addWalls(wall.nextX, wall.nextY);
        }
    }
    
    grid[startY][startX] = false;
    grid[goalY][goalX] = false;
    
    for(let i = 0; i < MAZE_SIZE; i++) {
        grid[0][i] = grid[MAZE_SIZE-1][i] = grid[i][0] = grid[i][MAZE_SIZE-1] = true;
    }
    
    grid[startY][startX] = false;
    grid[goalY][goalX] = false;
    
    return { walls: grid, start: { x: startX, y: startY }, goal: { x: goalX, y: goalY } };
}

function drawMazeGame() {
    if(!mazeCtx) return;
    mazeCtx.clearRect(0, 0, mazeCanvas.width, mazeCanvas.height);
    
    for(let row = 0; row < MAZE_SIZE; row++) {
        for(let col = 0; col < MAZE_SIZE; col++) {
            let x = col * mazeCellSize, y = row * mazeCellSize;
            if(mazeWalls[row] && mazeWalls[row][col] === true) {
                mazeCtx.fillStyle = "#5d3a1a";
                mazeCtx.fillRect(x, y, mazeCellSize, mazeCellSize);
                mazeCtx.fillStyle = "#8b5a2b";
                mazeCtx.fillRect(x+2, y+2, mazeCellSize-4, mazeCellSize-4);
            } else {
                let grad = mazeCtx.createLinearGradient(x, y, x+mazeCellSize, y+mazeCellSize);
                grad.addColorStop(0, "#ebd5b3");
                grad.addColorStop(1, "#ddc494");
                mazeCtx.fillStyle = grad;
                mazeCtx.fillRect(x, y, mazeCellSize, mazeCellSize);
            }
        }
    }
    
    mazeCtx.font = `${Math.floor(mazeCellSize * 0.6)}px "Segoe UI"`;
    mazeCtx.shadowBlur = 2;
    mazeCtx.fillStyle = "#ffb347";
    mazeCtx.fillText("⭐", mazeStartPos.x * mazeCellSize + mazeCellSize*0.25, 
                mazeStartPos.y * mazeCellSize + mazeCellSize*0.75);
    mazeCtx.fillStyle = "#e34234";
    mazeCtx.fillText("🏁", mazeGoalPos.x * mazeCellSize + mazeCellSize*0.25, 
                mazeGoalPos.y * mazeCellSize + mazeCellSize*0.75);
    
    let px = mazePlayerPos.x * mazeCellSize, py = mazePlayerPos.y * mazeCellSize;
    mazeCtx.shadowBlur = 0;
    mazeCtx.beginPath();
    mazeCtx.arc(px + mazeCellSize/2, py + mazeCellSize/2, mazeCellSize*0.3, 0, Math.PI*2);
    mazeCtx.fillStyle = "#4d9eff";
    mazeCtx.fill();
    mazeCtx.beginPath();
    mazeCtx.arc(px + mazeCellSize/2, py + mazeCellSize/2, mazeCellSize*0.2, 0, Math.PI*2);
    mazeCtx.fillStyle = "white";
    mazeCtx.fill();
}

function mazeMove(dx, dy) {
    if(!mazeGameActive) return;
    const newX = mazePlayerPos.x + dx, newY = mazePlayerPos.y + dy;
    if(newX < 0 || newX >= MAZE_SIZE || newY < 0 || newY >= MAZE_SIZE) return;
    if(mazeWalls[newY][newX] === true) return;
    
    mazePlayerPos.x = newX;
    mazePlayerPos.y = newY;
    drawMazeGame();
    
    if(mazePlayerPos.x === mazeGoalPos.x && mazePlayerPos.y === mazeGoalPos.y) {
        mazeGameActive = false;
        document.getElementById('mazeStatus').innerHTML = "🎉 PARABÉNS! Acesso liberado! 🎉";
        setTimeout(() => { hideCaptcha(); mazeGameActive = true; }, 1500);
    }
}

function initMazeGame() {
    const canvas = document.getElementById('mazeCanvas');
    const container = canvas.parentElement;
    const size = Math.min(container.clientWidth - 40, 500);
    canvas.width = size;
    canvas.height = size;
    mazeCellSize = size / MAZE_SIZE;
    
    mazeCanvas = canvas;
    mazeCtx = canvas.getContext('2d');
    const mazeData = generateMaze();
    mazeWalls = mazeData.walls;
    mazePlayerPos = { x: mazeData.start.x, y: mazeData.start.y };
    mazeGoalPos = { x: mazeData.goal.x, y: mazeData.goal.y };
    mazeStartPos = { x: mazeData.start.x, y: mazeData.start.y };
    mazeGameActive = true;
    drawMazeGame();
}

// ==================== UTILIDADES ====================
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

// ==================== NOTIFICAÇÕES ====================
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
            notifications.push({ id: doc.id, ...doc.data(), timestamp: doc.data().timestamp || new Date() });
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

// ==================== AUTENTICAÇÃO ====================
async function checkIfUserIsBanned(user) {
    if (!user) return false;
    try {
        const doc = await db.collection('users').doc(user.uid).get();
        if (doc.exists) return doc.data().isBanned === true || doc.data().isBan === true;
    } catch (e) {}
    return false;
}

function showBannedScreen(reason = 'Violação das políticas de uso') {
    document.getElementById('bannedOverlay').classList.add('show');
    document.getElementById('banDetails').textContent = `Motivo: ${reason}`;
    document.querySelector('.header').style.opacity = '0.3';
    document.querySelector('.header').style.pointerEvents = 'none';
    document.querySelector('.container').style.opacity = '0.3';
    document.querySelector('.container').style.pointerEvents = 'none';
    document.querySelector('.site-footer').style.opacity = '0.3';
    document.querySelector('.site-footer').style.pointerEvents = 'none';
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
    const guestBadge = document.getElementById('guest-badge');
    
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
        if (guestBadge) guestBadge.innerHTML = `<i class="material-icons" style="font-size:14px;">person</i> Olá, ${escapeHtml(displayName)}`;
    } else {
        avatar.innerHTML = '👤';
        name.textContent = 'Visitante';
        email.textContent = '';
        badge.innerHTML = '';
        btnLogin.style.display = 'inline-block';
        btnLogout.style.display = 'none';
        if (guestBadge) guestBadge.innerHTML = `<i class="material-icons" style="font-size:14px;">public</i> Modo Convidado - Busca liberada`;
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
        isAdmin = false;
        try {
            const doc = await db.collection('users').doc(currentUser.uid).get();
            if (doc.exists && doc.data().isAdmin === true) isAdmin = true;
        } catch (e) {}
        await db.collection('users').doc(currentUser.uid).set({
            email: currentUser.email,
            displayName: currentUser.displayName || currentUser.email.split('@')[0],
            photoURL: currentUser.photoURL || null,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            isAdmin: false,
            isBanned: false
        }, { merge: true });
        updateUI();
        closeLoginModal();
        await loadNotifications();
        listenNotifications();
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
            isBanned: false
        });
        updateUI();
        closeLoginModal();
        alert('Conta criada com sucesso!');
    } catch (error) {
        console.error('Erro ao criar conta:', error);
        alert('Erro ao criar conta: ' + error.message);
    }
}

// ==================== BUSCA ====================
let allPages = [];
let searchTimeout = null;

async function loadAllPages() {
    try {
        const querySnapshot = await db.collection('paginasUsuario').get();
        allPages = [];
        querySnapshot.forEach(doc => {
            const data = doc.data();
            const pages = data["Lista de Páginas de Busca"] || [];
            pages.forEach(page => {
                if (page.Nome && page.Link) {
                    allPages.push({
                        id: page.id || 'page_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                        nome: page.Nome,
                        url: page.Link,
                        categoria: page.categoria || 'Geral',
                        icone: page.icone || 'link',
                        descricao: page.descricao || '',
                        usuarioId: doc.id,
                        ordem: page.ordem || 0
                    });
                }
            });
        });
        const urlMap = new Map();
        allPages = allPages.filter(p => { if (urlMap.has(p.url)) return false; urlMap.set(p.url, true); return true; });
        document.getElementById('page-count').textContent = allPages.length;
        return allPages;
    } catch (error) {
        console.error('Erro ao carregar páginas:', error);
        return [];
    }
}

function searchPages(query) {
    if (!query || query.trim() === '') return [];
    const lower = query.toLowerCase();
    return allPages.filter(p => 
        p.nome.toLowerCase().includes(lower) ||
        p.descricao.toLowerCase().includes(lower) ||
        p.categoria.toLowerCase().includes(lower) ||
        p.url.toLowerCase().includes(lower)
    );
}

function showSuggestions(query) {
    if (!query || query.trim() === '') { document.getElementById('suggestions').classList.remove('show'); return; }
    const results = searchPages(query).slice(0, 5);
    if (results.length === 0) { document.getElementById('suggestions').classList.remove('show'); return; }
    document.getElementById('suggestions').innerHTML = results.map(p => `
        <div class="suggestion-item" onclick="selectSuggestion('${p.nome.replace(/'/g, "\\'")}')">
            <i class="material-icons suggestion-icon">${p.icone}</i>
            <div class="suggestion-text"><strong>${highlightText(p.nome, query)}</strong><div style="font-size:12px;color:#5f6368;">${p.url.substring(0, 50)}</div></div>
            <span class="suggestion-category">${p.categoria}</span>
        </div>
    `).join('');
    document.getElementById('suggestions').classList.add('show');
}

function highlightText(text, query) {
    if (!query) return text;
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark style="background:#fff3cd;padding:0;">$1</mark>');
}

function selectSuggestion(query) {
    document.getElementById('search-input').value = query;
    document.getElementById('suggestions').classList.remove('show');
    performSearch();
}

async function performSearch() {
    if (isCaptchaActive) { alert("Complete o labirinto de verificação primeiro!"); return; }
    if (!checkAbuse()) return;
    const query = document.getElementById('search-input').value.trim();
    if (!query) { showAllPages(); return; }
    displayResults(searchPages(query), query);
}

async function showAllPages() {
    if (isCaptchaActive) { alert("Complete o labirinto de verificação primeiro!"); return; }
    if (!checkAbuse()) return;
    document.getElementById('search-input').value = '';
    displayResults(allPages, 'Todos os resultados');
}

function displayResults(results, searchTerm) {
    const container = document.getElementById('results-container');
    const count = document.getElementById('results-count');
    const grid = document.getElementById('results-grid');
    count.textContent = `📄 ${results.length} resultado${results.length !== 1 ? 's' : ''} para "${searchTerm || 'todos'}"`;
    
    if (results.length === 0) {
        grid.innerHTML = `<div class="no-results"><i class="material-icons">search_off</i><h3>Nenhum resultado encontrado</h3><p>Tente buscar por outro termo ou verifique a ortografia.</p></div>`;
    } else {
        grid.innerHTML = results.map(p => `
            <div class="result-card" onclick="window.open('${p.url}', '_blank')">
                <div class="card-icon"><i class="material-icons">${p.icone}</i></div>
                <h3 class="card-title">${escapeHtml(p.nome)}</h3>
                <div class="card-url">${escapeHtml(p.url)}</div>
                ${p.descricao ? `<div class="card-description">${escapeHtml(p.descricao.substring(0, 100))}${p.descricao.length > 100 ? '...' : ''}</div>` : ''}
                <span class="card-category">${escapeHtml(p.categoria)}</span>
            </div>
        `).join('');
    }
    container.classList.add('show');
    container.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function hideResults() {
    document.getElementById('results-container').classList.remove('show');
}

function resetSearch() {
    document.getElementById('search-input').value = '';
    hideResults();
    document.getElementById('suggestions').classList.remove('show');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ==================== EVENT LISTENERS ====================
document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('search-input');
    const clear = document.getElementById('clear-search');
    
    input.addEventListener('input', (e) => {
        const query = e.target.value;
        clear.style.display = query ? 'flex' : 'none';
        if (searchTimeout) clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => showSuggestions(query), 300);
    });
    
    clear.addEventListener('click', () => {
        input.value = '';
        clear.style.display = 'none';
        document.getElementById('suggestions').classList.remove('show');
        input.focus();
    });
    
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            document.getElementById('suggestions').classList.remove('show');
            performSearch();
        }
    });
    
    document.getElementById('search-button').addEventListener('click', () => {
        document.getElementById('suggestions').classList.remove('show');
        performSearch();
    });
    
    document.getElementById('login-form-modal').addEventListener('submit', async (e) => {
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
    
    document.getElementById('login-modal').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) closeLoginModal();
    });
    
    document.addEventListener('keydown', (e) => {
        if (!isCaptchaActive) return;
        let dx = 0, dy = 0;
        if (e.key === 'ArrowUp' || e.key === 'w') dy = -1;
        else if (e.key === 'ArrowDown' || e.key === 's') dy = 1;
        else if (e.key === 'ArrowLeft' || e.key === 'a') dx = -1;
        else if (e.key === 'ArrowRight' || e.key === 'd') dx = 1;
        else return;
        e.preventDefault();
        mazeMove(dx, dy);
    });
});

// ==================== INICIALIZAÇÃO ====================
async function init() {
    await loadAllPages();
    
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            currentUser = user;
            isBanned = await checkIfUserIsBanned(user);
            if (isBanned) { showBannedScreen('Sua conta foi banida.'); await auth.signOut(); updateUI(); return; }
            isAdmin = false;
            try {
                const doc = await db.collection('users').doc(user.uid).get();
                if (doc.exists && doc.data().isAdmin === true) isAdmin = true;
            } catch (e) {}
            updateUI();
            await loadNotifications();
            listenNotifications();
        } else {
            currentUser = null;
            isBanned = false;
            isAdmin = false;
            updateUI();
            if (notificationListener) { notificationListener(); notificationListener = null; }
            notifications = [];
            unreadCount = 0;
            updateNotificationBadge();
        }
    });
    
    console.log('🚀 WazzimaGiygg Search inicializado!');
}

init();

// ==================== EXPOSIÇÃO GLOBAL ====================
// Funções que precisam ser acessíveis no HTML
window.logout = logout;
window.logoutBanned = logoutBanned;
window.loginWithGoogle = loginWithGoogle;
window.showLoginModal = showLoginModal;
window.closeLoginModal = closeLoginModal;
window.showRegister = showRegister;
window.performSearch = performSearch;
window.showAllPages = showAllPages;
window.hideResults = hideResults;
window.resetSearch = resetSearch;
window.selectSuggestion = selectSuggestion;
window.markAllAsRead = markAllAsRead;
window.toggleNotifications = toggleNotifications;
window.mazeMove = mazeMove;
