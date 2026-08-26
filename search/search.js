// ============================================
// SEARCH.JS - WazzimaGiygg Search
// Versão Autossuficiente e Corrigida
// ============================================

(function() {
    'use strict';

    console.log('🚀 Inicializando WazzimaGiygg Search (versão autossuficiente)...');

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
        console.log('✅ Firebase já inicializado');
    } catch (e) {
        app = firebase.initializeApp(firebaseConfig);
        auth = firebase.auth();
        db = firebase.firestore();
        console.log('✅ Firebase inicializado pelo search.js');
    }

    // ==================== VARIÁVEIS GLOBAIS ====================
    let currentUser = null;
    let isBanned = false;
    let isAdmin = false;
    let allPages = [];
    let searchTimeout = null;
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

    // ==================== FUNÇÕES AUXILIARES ====================
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

    // ==================== TRADUÇÕES SIMPLES ====================
    const translations = {
        pt: {
            'placeholder_busca': 'Pesquise produtos, serviços, páginas...',
            'botao_buscar': 'Buscar',
            'botao_ver_todas': 'Ver todas as páginas',
            'modo_convidado': 'Modo Convidado - Busca liberada',
            'modo_usuario': 'Olá, {nome}',
            'visitante': 'Visitante',
            'entrar': 'Entrar',
            'sair': 'Sair',
            'search_titulo': 'WazzimaGiygg Search - Busca Inteligente',
            'search_copyright': '© 2026 WazzimaGiygg Search - Busca inteligente e livre'
        },
        en: {
            'placeholder_busca': 'Search for products, services, pages...',
            'botao_buscar': 'Search',
            'botao_ver_todas': 'View all pages',
            'modo_convidado': 'Guest Mode - Search enabled',
            'modo_usuario': 'Hello, {nome}',
            'visitante': 'Guest',
            'entrar': 'Sign In',
            'sair': 'Sign Out',
            'search_titulo': 'WazzimaGiygg Search - Smart Search',
            'search_copyright': '© 2026 WazzimaGiygg Search - Smart and free search'
        }
    };

    function getTranslation(key, params = {}) {
        const lang = localStorage.getItem('wzzm_language') || 'pt';
        const trans = translations[lang] || translations['pt'];
        let text = trans[key] || key;
        if (params) {
            Object.keys(params).forEach(p => {
                text = text.replace(new RegExp(`{${p}}`, 'g'), params[p]);
            });
        }
        return text;
    }

    function applyTranslations() {
        document.querySelectorAll('[data-i18n-search]').forEach(el => {
            const key = el.getAttribute('data-i18n-search');
            const text = getTranslation(key);
            if (text && text !== key) {
                if (el.tagName === 'INPUT' && el.hasAttribute('placeholder')) {
                    el.placeholder = text;
                } else if (el.tagName === 'TEXTAREA' && el.hasAttribute('placeholder')) {
                    el.placeholder = text;
                } else if (el.tagName !== 'INPUT' && el.tagName !== 'TEXTAREA') {
                    el.textContent = text;
                }
            }
        });
        
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.placeholder = getTranslation('placeholder_busca');
        }
        
        const title = document.querySelector('title');
        if (title) {
            title.textContent = getTranslation('search_titulo');
        }
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
        const overlay = document.getElementById('bannedOverlay');
        if (overlay) overlay.style.display = 'flex';
        const details = document.getElementById('banDetails');
        if (details) details.textContent = `Motivo: ${reason}`;
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
            if (guestBadge) {
                guestBadge.innerHTML = `<i class="material-icons" style="font-size:14px;">person</i> ${getTranslation('modo_usuario', { nome: escapeHtml(displayName) })}`;
            }
        } else {
            avatar.innerHTML = '👤';
            name.textContent = getTranslation('visitante');
            email.textContent = '';
            badge.innerHTML = '';
            btnLogin.style.display = 'inline-block';
            btnLogout.style.display = 'none';
            if (guestBadge) {
                guestBadge.innerHTML = `<i class="material-icons" style="font-size:14px;">public</i> ${getTranslation('modo_convidado')}`;
            }
        }
        applyTranslations();
    }

    function showLoginModal() { 
        const modal = document.getElementById('login-modal');
        if (modal) modal.style.display = 'flex'; 
    }
    
    function closeLoginModal() { 
        const modal = document.getElementById('login-modal');
        if (modal) modal.style.display = 'none'; 
    }

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

    // ==================== CAPTCHA MAZE ====================
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
        const overlay = document.getElementById('captchaOverlay');
        if (overlay) overlay.style.display = 'flex';
        const banner = document.getElementById('warningBanner');
        if (banner) banner.style.display = 'block';
        initMazeGame();
    }

    function hideCaptcha() {
        const overlay = document.getElementById('captchaOverlay');
        if (overlay) overlay.style.display = 'none';
        isCaptchaActive = false;
        captchaSolved = true;
        accessCount = 0;
        lastAccessTime = Date.now();
        setTimeout(() => {
            const banner = document.getElementById('warningBanner');
            if (banner) banner.style.display = 'none';
        }, 3000);
    }

    // ==================== BUSCA PRINCIPAL ====================
    async function loadAllPages() {
        try {
            console.log('📂 Carregando páginas do Firestore...');
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
            
            // Remove duplicatas por URL
            const urlMap = new Map();
            allPages = allPages.filter(p => { 
                if (urlMap.has(p.url)) return false; 
                urlMap.set(p.url, true); 
                return true; 
            });
            
            const pageCount = document.getElementById('page-count');
            if (pageCount) {
                pageCount.textContent = allPages.length;
            }
            
            console.log(`✅ ${allPages.length} páginas carregadas`);
            return allPages;
        } catch (error) {
            console.error('❌ Erro ao carregar páginas:', error);
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
        const suggestions = document.getElementById('suggestions');
        if (!suggestions) return;
        
        if (!query || query.trim() === '') { 
            suggestions.classList.remove('show'); 
            return; 
        }
        
        const results = searchPages(query).slice(0, 5);
        if (results.length === 0) { 
            suggestions.classList.remove('show'); 
            return; 
        }
        
        suggestions.innerHTML = results.map(p => `
            <div class="suggestion-item" onclick="selectSuggestion('${p.nome.replace(/'/g, "\\'")}')">
                <i class="material-icons suggestion-icon">${p.icone}</i>
                <div class="suggestion-text"><strong>${highlightText(p.nome, query)}</strong><div style="font-size:12px;color:#5f6368;">${p.url.substring(0, 50)}</div></div>
                <span class="suggestion-category">${p.categoria}</span>
            </div>
        `).join('');
        suggestions.classList.add('show');
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
        
        if (!container || !count || !grid) return;
        
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
        container.style.display = 'block';
        container.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function hideResults() {
        const container = document.getElementById('results-container');
        if (container) container.style.display = 'none';
    }

    function resetSearch() {
        document.getElementById('search-input').value = '';
        hideResults();
        const suggestions = document.getElementById('suggestions');
        if (suggestions) suggestions.classList.remove('show');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // ==================== EVENT LISTENERS ====================
    document.addEventListener('DOMContentLoaded', function() {
        console.log('📄 DOM carregado, configurando eventos...');
        
        const input = document.getElementById('search-input');
        const clear = document.getElementById('clear-search');
        const searchButton = document.getElementById('search-button');
        const loginForm = document.getElementById('login-form-modal');
        const loginModal = document.getElementById('login-modal');
        
        if (input) {
            input.addEventListener('input', (e) => {
                const query = e.target.value;
                if (clear) clear.style.display = query ? 'flex' : 'none';
                if (searchTimeout) clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => showSuggestions(query), 300);
            });
            
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    const suggestions = document.getElementById('suggestions');
                    if (suggestions) suggestions.classList.remove('show');
                    performSearch();
                }
            });
        }
        
        if (clear) {
            clear.addEventListener('click', () => {
                if (input) {
                    input.value = '';
                    clear.style.display = 'none';
                    const suggestions = document.getElementById('suggestions');
                    if (suggestions) suggestions.classList.remove('show');
                    input.focus();
                }
            });
        }
        
        if (searchButton) {
            searchButton.addEventListener('click', () => {
                const suggestions = document.getElementById('suggestions');
                if (suggestions) suggestions.classList.remove('show');
                performSearch();
            });
        }
        
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
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
        }
        
        if (loginModal) {
            loginModal.addEventListener('click', (e) => {
                if (e.target === e.currentTarget) closeLoginModal();
            });
        }
        
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
        
        // Aplica traduções iniciais
        applyTranslations();
        
        // Carrega páginas
        loadAllPages();
    });

    // ==================== INICIALIZAÇÃO DO FIREBASE AUTH ====================
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

    // ============================================
// EXPORTA TRADUÇÕES PARA USO EXTERNO
// ============================================
window.searchTranslations = {
    pt: {
        'placeholder_busca': 'Pesquise produtos, serviços, páginas...',
        'botao_buscar': 'Buscar',
        'botao_ver_todas': 'Ver todas as páginas',
        'modo_convidado': 'Modo Convidado - Busca liberada',
        'modo_usuario': 'Olá, {nome}',
        'visitante': 'Visitante',
        'entrar': 'Entrar',
        'sair': 'Sair',
        'search_titulo': 'WazzimaGiygg Search - Busca Inteligente',
        'search_copyright': '© 2026 WazzimaGiygg Search - Busca inteligente e livre',
        'maze_status': '⭐ Leve o personagem até a bandeira 🏁',
        'warning_muitas_tentativas': 'Muitas tentativas de acesso! Complete o labirinto para continuar.',
        'notificacoes': '🔔 Notificações',
        'marcar_todas_lidas': 'Marcar todas como lidas',
        'nenhuma_notificacao': 'Nenhuma notificação',
        'conta_banida': '⚠️ Conta Banida',
        'conta_banida_texto': 'Sua conta foi banida permanentemente do sistema.',
        'motivo': 'Motivo:',
        'erro_banimento': 'Se você acredita que isso é um erro, entre em contato com o suporte.',
        'sair_conta': '🚪 Sair da conta',
        'entrar_conta': 'Entrar na sua conta',
        'continuar_google': 'Continuar com Google',
        'ou': 'ou',
        'email': 'E-mail',
        'senha': 'Senha',
        'entrar_email': 'Entrar com e-mail',
        'criar_conta': 'Criar nova conta',
        'verificacao_seguranca': '🔐 Verificação de Segurança',
        'verificacao_texto': 'Para continuar usando a busca, complete o labirinto abaixo.',
        'doacao': '💝 Doação',
        'desktop': '🖥️ Desktop',
        'lgpd': '🔒 LGPD',
        'marco_civil': '📜 Marco Civil',
        'ticket': '🎫 Ticket',
        'produtos': '🛍️ Produtos',
        'sua_conta': '👤 Sua conta',
        'search_copyright': '© 2026 WazzimaGiygg Search - Busca inteligente e livre',
        'info_paginas': 'Mais de {total} páginas disponíveis para busca',
        'resultados_para': '📄 {total} resultado{s} para "{termo}"',
        'resultados_todos': '📄 {total} resultado{s} para "todos"',
        'nenhum_resultado': 'Nenhum resultado encontrado',
        'nenhum_resultado_texto': 'Tente buscar por outro termo ou verifique a ortografia.',
        'fechar_resultados': 'Fechar resultados',
        'aguarde_carregando': 'Carregando WazzimaGiygg Search...'
    },
    en: {
        'placeholder_busca': 'Search for products, services, pages...',
        'botao_buscar': 'Search',
        'botao_ver_todas': 'View all pages',
        'modo_convidado': 'Guest Mode - Search enabled',
        'modo_usuario': 'Hello, {nome}',
        'visitante': 'Guest',
        'entrar': 'Sign In',
        'sair': 'Sign Out',
        'search_titulo': 'WazzimaGiygg Search - Smart Search',
        'search_copyright': '© 2026 WazzimaGiygg Search - Smart and free search',
        'maze_status': '⭐ Take the character to the flag 🏁',
        'warning_muitas_tentativas': 'Too many attempts! Complete the maze to continue.',
        'notificacoes': '🔔 Notifications',
        'marcar_todas_lidas': 'Mark all as read',
        'nenhuma_notificacao': 'No notifications',
        'conta_banida': '⚠️ Banned Account',
        'conta_banida_texto': 'Your account has been permanently banned from the system.',
        'motivo': 'Reason:',
        'erro_banimento': 'If you believe this is an error, please contact support.',
        'sair_conta': '🚪 Sign out',
        'entrar_conta': 'Sign in to your account',
        'continuar_google': 'Continue with Google',
        'ou': 'or',
        'email': 'Email',
        'senha': 'Password',
        'entrar_email': 'Sign in with email',
        'criar_conta': 'Create new account',
        'verificacao_seguranca': '🔐 Security Verification',
        'verificacao_texto': 'To continue using the search, complete the maze below.',
        'doacao': '💝 Donation',
        'desktop': '🖥️ Desktop',
        'lgpd': '🔒 Privacy',
        'marco_civil': '📜 Civil Rights',
        'ticket': '🎫 Support',
        'produtos': '🛍️ Products',
        'sua_conta': '👤 Your Account',
        'info_paginas': '{total} pages available for search',
        'resultados_para': '📄 {total} result{s} for "{termo}"',
        'resultados_todos': '📄 {total} result{s} for "all"',
        'nenhum_resultado': 'No results found',
        'nenhum_resultado_texto': 'Try searching for another term or check the spelling.',
        'fechar_resultados': 'Close results',
        'aguarde_carregando': 'Loading WazzimaGiygg Search...'
    }
    es: {
        'placeholder_busca': 'Busque productos, servicios, páginas...',
        'botao_buscar': 'Buscar',
        'botao_ver_todas': 'Ver todas las páginas',
        'modo_convidado': 'Modo Invitado - Búsqueda habilitada',
        'modo_usuario': 'Hola, {nome}',
        'visitante': 'Visitante',
        'entrar': 'Iniciar Sesión',
        'sair': 'Cerrar Sesión',
        'search_titulo': 'WazzimaGiygg Search - Búsqueda Inteligente',
        'search_copyright': '© 2026 WazzimaGiygg Search - Búsqueda inteligente y libre',
        'maze_status': '⭐ Lleva al personaje hasta la bandera 🏁',
        'warning_muitas_tentativas': '¡Demasiados intentos! Completa el laberinto para continuar.',
        'notificacoes': '🔔 Notificaciones',
        'marcar_todas_lidas': 'Marcar todas como leídas',
        'nenhuma_notificacao': 'Sin notificaciones',
        'conta_banida': '⚠️ Cuenta Baneada',
        'conta_banida_texto': 'Tu cuenta ha sido baneada permanentemente del sistema.',
        'motivo': 'Motivo:',
        'erro_banimento': 'Si crees que esto es un error, contacta al soporte.',
        'sair_conta': '🚪 Cerrar sesión',
        'entrar_conta': 'Iniciar sesión en tu cuenta',
        'continuar_google': 'Continuar con Google',
        'ou': 'o',
        'email': 'Correo electrónico',
        'senha': 'Contraseña',
        'entrar_email': 'Iniciar sesión con correo',
        'criar_conta': 'Crear nueva cuenta',
        'verificacao_seguranca': '🔐 Verificación de Seguridad',
        'verificacao_texto': 'Para continuar usando la búsqueda, completa el laberinto.',
        'doacao': '💝 Donación',
        'desktop': '🖥️ Escritorio',
        'lgpd': '🔒 Privacidad',
        'marco_civil': '📜 Derechos Civiles',
        'ticket': '🎫 Soporte',
        'produtos': '🛍️ Productos',
        'sua_conta': '👤 Tu cuenta',
        'info_paginas': 'Más de {total} páginas disponibles para búsqueda',
        'resultados_para': '📄 {total} resultado{s} para "{termo}"',
        'resultados_todos': '📄 {total} resultado{s} para "todos"',
        'nenhum_resultado': 'No se encontraron resultados',
        'nenhum_resultado_texto': 'Intenta buscar otro término o verifica la ortografía.',
        'fechar_resultados': 'Cerrar resultados',
        'aguarde_carregando': 'Cargando WazzimaGiygg Search...'
    },
    fr: {
        'placeholder_busca': 'Recherchez des produits, services, pages...',
        'botao_buscar': 'Rechercher',
        'botao_ver_todas': 'Voir toutes les pages',
        'modo_convidado': 'Mode Invité - Recherche activée',
        'modo_usuario': 'Bonjour, {nome}',
        'visitante': 'Visiteur',
        'entrar': 'Se Connecter',
        'sair': 'Déconnexion',
        'search_titulo': 'WazzimaGiygg Search - Recherche Intelligente',
        'search_copyright': '© 2026 WazzimaGiygg Search - Recherche intelligente et libre',
        'maze_status': '⭐ Emmenez le personnage jusqu\'au drapeau 🏁',
        'warning_muitas_tentativas': 'Trop de tentatives! Complétez le labyrinthe pour continuer.',
        'notificacoes': '🔔 Notifications',
        'marcar_todas_lidas': 'Tout marquer comme lu',
        'nenhuma_notificacao': 'Aucune notification',
        'conta_banida': '⚠️ Compte Banni',
        'conta_banida_texto': 'Votre compte a été banni définitivement du système.',
        'motivo': 'Motif:',
        'erro_banimento': 'Si vous pensez qu\'il s\'agit d\'une erreur, contactez le support.',
        'sair_conta': '🚪 Se déconnecter',
        'entrar_conta': 'Connectez-vous à votre compte',
        'continuar_google': 'Continuer avec Google',
        'ou': 'ou',
        'email': 'E-mail',
        'senha': 'Mot de passe',
        'entrar_email': 'Se connecter avec e-mail',
        'criar_conta': 'Créer un nouveau compte',
        'verificacao_seguranca': '🔐 Vérification de Sécurité',
        'verificacao_texto': 'Pour continuer à utiliser la recherche, complétez le labyrinthe.',
        'doacao': '💝 Donation',
        'desktop': '🖥️ Bureau',
        'lgpd': '🔒 Vie Privée',
        'marco_civil': '📜 Droits Civils',
        'ticket': '🎫 Support',
        'produtos': '🛍️ Produits',
        'sua_conta': '👤 Votre compte',
        'info_paginas': 'Plus de {total} pages disponibles pour la recherche',
        'resultados_para': '📄 {total} résultat{s} pour "{termo}"',
        'resultados_todos': '📄 {total} résultat{s} pour "tous"',
        'nenhum_resultado': 'Aucun résultat trouvé',
        'nenhum_resultado_texto': 'Essayez de chercher un autre terme ou vérifiez l\'orthographe.',
        'fechar_resultados': 'Fermer les résultats',
        'aguarde_carregando': 'Chargement de WazzimaGiygg Search...'
    },
    de: {
        'placeholder_busca': 'Suchen Sie Produkte, Dienstleistungen, Seiten...',
        'botao_buscar': 'Suchen',
        'botao_ver_todas': 'Alle Seiten anzeigen',
        'modo_convidado': 'Gastmodus - Suche aktiviert',
        'modo_usuario': 'Hallo, {nome}',
        'visitante': 'Gast',
        'entrar': 'Anmelden',
        'sair': 'Abmelden',
        'search_titulo': 'WazzimaGiygg Search - Intelligente Suche',
        'search_copyright': '© 2026 WazzimaGiygg Search - Intelligente und freie Suche',
        'maze_status': '⭐ Bringen Sie die Figur zur Flagge 🏁',
        'warning_muitas_tentativas': 'Zu viele Versuche! Absolvieren Sie das Labyrinth, um fortzufahren.',
        'notificacoes': '🔔 Benachrichtigungen',
        'marcar_todas_lidas': 'Alle als gelesen markieren',
        'nenhuma_notificacao': 'Keine Benachrichtigungen',
        'conta_banida': '⚠️ Gesperrtes Konto',
        'conta_banida_texto': 'Ihr Konto wurde dauerhaft aus dem System verbannt.',
        'motivo': 'Grund:',
        'erro_banimento': 'Wenn Sie glauben, dass dies ein Fehler ist, kontaktieren Sie den Support.',
        'sair_conta': '🚪 Abmelden',
        'entrar_conta': 'Melden Sie sich an',
        'continuar_google': 'Mit Google fortfahren',
        'ou': 'oder',
        'email': 'E-Mail',
        'senha': 'Passwort',
        'entrar_email': 'Mit E-Mail anmelden',
        'criar_conta': 'Neues Konto erstellen',
        'verificacao_seguranca': '🔐 Sicherheitsüberprüfung',
        'verificacao_texto': 'Um die Suche weiter zu nutzen, absolvieren Sie das Labyrinth.',
        'doacao': '💝 Spende',
        'desktop': '🖥️ Desktop',
        'lgpd': '🔒 Datenschutz',
        'marco_civil': '📜 Bürgerrechte',
        'ticket': '🎫 Support',
        'produtos': '🛍️ Produkte',
        'sua_conta': '👤 Ihr Konto',
        'info_paginas': 'Mehr als {total} Seiten für die Suche verfügbar',
        'resultados_para': '📄 {total} Ergebnis{se} für "{termo}"',
        'resultados_todos': '📄 {total} Ergebnis{se} für "alle"',
        'nenhum_resultado': 'Keine Ergebnisse gefunden',
        'nenhum_resultado_texto': 'Versuchen Sie einen anderen Suchbegriff oder überprüfen Sie die Schreibweise.',
        'fechar_resultados': 'Ergebnisse schließen',
        'aguarde_carregando': 'WazzimaGiygg Search wird geladen...'
    },
    it: {
        'placeholder_busca': 'Cerca prodotti, servizi, pagine...',
        'botao_buscar': 'Cerca',
        'botao_ver_todas': 'Vedi tutte le pagine',
        'modo_convidado': 'Modalità Ospite - Ricerca abilitata',
        'modo_usuario': 'Ciao, {nome}',
        'visitante': 'Visitatore',
        'entrar': 'Accedi',
        'sair': 'Esci',
        'search_titulo': 'WazzimaGiygg Search - Ricerca Intelligente',
        'search_copyright': '© 2026 WazzimaGiygg Search - Ricerca intelligente e libera',
        'maze_status': '⭐ Porta il personaggio alla bandiera 🏁',
        'warning_muitas_tentativas': 'Troppi tentativi! Completa il labirinto per continuare.',
        'notificacoes': '🔔 Notifiche',
        'marcar_todas_lidas': 'Segna tutte come lette',
        'nenhuma_notificacao': 'Nessuna notifica',
        'conta_banida': '⚠️ Account Bannato',
        'conta_banida_texto': 'Il tuo account è stato bannato permanentemente dal sistema.',
        'motivo': 'Motivo:',
        'erro_banimento': 'Se pensi che sia un errore, contatta il supporto.',
        'sair_conta': '🚪 Esci',
        'entrar_conta': 'Accedi al tuo account',
        'continuar_google': 'Continua con Google',
        'ou': 'o',
        'email': 'Email',
        'senha': 'Password',
        'entrar_email': 'Accedi con email',
        'criar_conta': 'Crea nuovo account',
        'verificacao_seguranca': '🔐 Verifica di Sicurezza',
        'verificacao_texto': 'Per continuare a usare la ricerca, completa il labirinto.',
        'doacao': '💝 Donazione',
        'desktop': '🖥️ Desktop',
        'lgpd': '🔒 Privacy',
        'marco_civil': '📜 Diritti Civili',
        'ticket': '🎫 Supporto',
        'produtos': '🛍️ Prodotti',
        'sua_conta': '👤 Il tuo account',
        'info_paginas': 'Più di {total} pagine disponibili per la ricerca',
        'resultados_para': '📄 {total} risultato{s} per "{termo}"',
        'resultados_todos': '📄 {total} risultato{s} per "tutti"',
        'nenhum_resultado': 'Nessun risultato trovato',
        'nenhum_resultado_texto': 'Prova a cercare un altro termine o verifica l\'ortografia.',
        'fechar_resultados': 'Chiudi risultati',
        'aguarde_carregando': 'Caricamento WazzimaGiygg Search...'
    },
    ja: {
        'placeholder_busca': '商品、サービス、ページを検索...',
        'botao_buscar': '検索',
        'botao_ver_todas': 'すべてのページを表示',
        'modo_convidado': 'ゲストモード - 検索有効',
        'modo_usuario': 'こんにちは、{nome}',
        'visitante': 'ゲスト',
        'entrar': 'ログイン',
        'sair': 'ログアウト',
        'search_titulo': 'WazzimaGiygg Search - スマート検索',
        'search_copyright': '© 2026 WazzimaGiygg Search - スマートで自由な検索',
        'maze_status': '⭐ キャラクターを旗まで導いてください 🏁',
        'warning_muitas_tentativas': '試行回数が多すぎます！続けるには迷路をクリアしてください。',
        'notificacoes': '🔔 通知',
        'marcar_todas_lidas': 'すべて既読にする',
        'nenhuma_notificacao': '通知はありません',
        'conta_banida': '⚠️ アカウント停止',
        'conta_banida_texto': 'あなたのアカウントは永久に停止されました。',
        'motivo': '理由:',
        'erro_banimento': 'これがエラーだと思われる場合は、サポートにお問い合わせください。',
        'sair_conta': '🚪 ログアウト',
        'entrar_conta': 'アカウントにログイン',
        'continuar_google': 'Googleで続ける',
        'ou': 'または',
        'email': 'メールアドレス',
        'senha': 'パスワード',
        'entrar_email': 'メールでログイン',
        'criar_conta': '新規アカウント作成',
        'verificacao_seguranca': '🔐 セキュリティ確認',
        'verificacao_texto': '検索を続けるには、以下の迷路をクリアしてください。',
        'doacao': '💝 寄付',
        'desktop': '🖥️ デスクトップ',
        'lgpd': '🔒 プライバシー',
        'marco_civil': '📜 公民権',
        'ticket': '🎫 サポート',
        'produtos': '🛍️ 製品',
        'sua_conta': '👤 アカウント',
        'info_paginas': '検索可能なページが{total}ページあります',
        'resultados_para': '📄 {total}件の結果 "{termo}"',
        'resultados_todos': '📄 {total}件の結果 "すべて"',
        'nenhum_resultado': '結果が見つかりません',
        'nenhum_resultado_texto': '別の用語を検索するか、スペルを確認してください。',
        'fechar_resultados': '結果を閉じる',
        'aguarde_carregando': 'WazzimaGiygg Searchを読み込み中...'
    },
    zh: {
        'placeholder_busca': '搜索产品、服务、页面...',
        'botao_buscar': '搜索',
        'botao_ver_todas': '查看所有页面',
        'modo_convidado': '访客模式 - 搜索已启用',
        'modo_usuario': '你好，{nome}',
        'visitante': '访客',
        'entrar': '登录',
        'sair': '退出',
        'search_titulo': 'WazzimaGiygg Search - 智能搜索',
        'search_copyright': '© 2026 WazzimaGiygg Search - 智能免费搜索',
        'maze_status': '⭐ 将角色带到旗帜处 🏁',
        'warning_muitas_tentativas': '尝试次数过多！请完成迷宫以继续。',
        'notificacoes': '🔔 通知',
        'marcar_todas_lidas': '全部标记为已读',
        'nenhuma_notificacao': '没有通知',
        'conta_banida': '⚠️ 账户被禁用',
        'conta_banida_texto': '您的账户已被永久禁止使用该系统。',
        'motivo': '原因：',
        'erro_banimento': '如果您认为这是一个错误，请联系支持。',
        'sair_conta': '🚪 退出',
        'entrar_conta': '登录您的账户',
        'continuar_google': '使用 Google 继续',
        'ou': '或',
        'email': '电子邮箱',
        'senha': '密码',
        'entrar_email': '使用邮箱登录',
        'criar_conta': '创建新账户',
        'verificacao_seguranca': '🔐 安全验证',
        'verificacao_texto': '要继续使用搜索，请完成下面的迷宫。',
        'doacao': '💝 捐赠',
        'desktop': '🖥️ 桌面版',
        'lgpd': '🔒 隐私',
        'marco_civil': '📜 公民权利',
        'ticket': '🎫 支持',
        'produtos': '🛍️ 产品',
        'sua_conta': '👤 您的账户',
        'info_paginas': '有 {total} 个页面可供搜索',
        'resultados_para': '📄 {total} 个结果 "{termo}"',
        'resultados_todos': '📄 {total} 个结果 "全部"',
        'nenhum_resultado': '未找到结果',
        'nenhum_resultado_texto': '尝试搜索其他术语或检查拼写。',
        'fechar_resultados': '关闭结果',
        'aguarde_carregando': '正在加载 WazzimaGiygg Search...'
    }
};

// Copia para _searchTranslations também
if (!window._searchTranslations) {
    window._searchTranslations = {};
}
Object.keys(window.searchTranslations).forEach(lang => {
    window._searchTranslations[lang] = window.searchTranslations[lang];
});

console.log('✅ Traduções exportadas globalmente');

    // ==================== EXPOSIÇÃO GLOBAL ====================
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
    window.loadAllPages = loadAllPages;
    window.applyTranslations = applyTranslations;
    window.getTranslation = getTranslation;

    console.log('🚀 WazzimaGiygg Search inicializado com sucesso!');
})();
