// ============================================
// PERFIL DO USUÁRIO - PÁGINA DEDICADA
// ============================================

let profileUserId = null;

// ============================================
// FUNÇÃO PARA PEGAR PARÂMETROS DA URL
// ============================================
function getUrlParams() {
    const params = new URLSearchParams(window.location.search);
    return {
        userId: params.get('id'),
        userName: params.get('name')
    };
}

// ============================================
// CARREGAR PERFIL
// ============================================
async function loadProfile() {
    const params = getUrlParams();
    const userId = params.userId;
    const userName = params.userName;

    if (!userId && currentUser) {
        window.location.href = `profile.html?id=${currentUser.uid}&name=${encodeURIComponent(currentUser.displayName || 'Usuário')}`;
        return;
    }

    if (!userId) {
        document.getElementById('profileContent').innerHTML = `
            <div class="profile-error">
                <span class="material-icons" style="font-size:64px; color:#e94560;">error_outline</span>
                <h2>Usuário não encontrado</h2>
                <p>Por favor, verifique o link ou tente novamente.</p>
                <button class="btn-primary" onclick="goHome()">Voltar para o Início</button>
            </div>
        `;
        return;
    }

    profileUserId = userId;
    await renderProfile(userId, userName);
}

// ============================================
// RENDERIZAR PERFIL
// ============================================
async function renderProfile(userId, userName) {
    const container = document.getElementById('profileContent');
    if (!container) return;

    container.innerHTML = '<div class="loading">Carregando perfil...</div>';

    try {
        let userData = { nome: userName || 'Usuário', seguidores: [], seguindo: [], bio: '' };
        
        try {
            const userDoc = await db.collection('usuarios').doc(userId).get();
            if (userDoc.exists) {
                userData = userDoc.data();
            }
        } catch (error) {
            console.warn('Erro ao buscar usuário:', error);
        }

        // Tentar buscar bio da subcoleção perfil (se existir)
        try {
            const perfilDoc = await db.collection('usuarios').doc(userId).collection('perfil').doc('dados').get();
            if (perfilDoc.exists) {
                userData.bio = perfilDoc.data().bio || userData.bio || '';
            }
        } catch (error) {
            console.warn('Erro ao buscar bio:', error);
        }

        let isFollowing = false;
        if (currentUser && userId !== currentUser.uid && !isBanned) {
            try {
                const followDoc = await db.collection('usuarios').doc(currentUser.uid)
                    .collection('seguindo').doc(userId).get();
                isFollowing = followDoc.exists;
            } catch (error) {
                console.warn('Erro ao verificar follow:', error);
            }
        }

        let posts = [];
        try {
            const postsSnapshot = await db.collection('Bemtevi')
                .where('userId', '==', userId)
                .orderBy('createdAt', 'desc')
                .limit(50)
                .get();

            postsSnapshot.forEach(doc => {
                posts.push({ id: doc.id, ...doc.data() });
            });
        } catch (error) {
            console.warn('Erro ao buscar posts:', error);
        }

        let seguidoresCount = 0;
        let seguindoCount = 0;
        try {
            const seguidoresSnapshot = await db.collection('usuarios').doc(userId).collection('seguidores').get();
            seguidoresCount = seguidoresSnapshot.size;
            
            const seguindoSnapshot = await db.collection('usuarios').doc(userId).collection('seguindo').get();
            seguindoCount = seguindoSnapshot.size;
        } catch (error) {
            console.warn('Erro ao contar seguidores:', error);
        }

        const isOwnProfile = currentUser && userId === currentUser.uid;

        const displayName = userData.nome || userName || 'Usuário';
        const displayAvatar = userData.profilePictureUrl || null;
        const userInitial = displayName.charAt(0).toUpperCase() || '?';

        let postsHtml = '';
        if (posts.length === 0) {
            postsHtml = `
                <div class="profile-no-posts">
                    <span class="material-icons" style="font-size:48px; color:#666;">note_add</span>
                    <p>Nenhuma postagem ainda</p>
                    ${isOwnProfile ? '<p style="font-size:13px; color:#666;">Comece a postar para aparecer aqui!</p>' : ''}
                </div>
            `;
        } else {
            postsHtml = posts.map(post => {
                const postDate = post.createdAt?.toDate() || new Date();
                const isLiked = currentUser && post.usuariosQueCurtiram?.includes(currentUser.uid) && !isBanned;
                
                return `
                    <div class="post-card profile-post-card">
                        <div class="post-content" style="padding-left:0">
                            <div class="post-category" style="background:${categoryColors[post.categoria] || '#666'}20; color:${categoryColors[post.categoria] || '#666'}">
                                ${post.categoria || 'Geral'}
                            </div>
                            <div style="font-size:14px; color:#aaa; margin-bottom:6px;">${getTimeAgo(postDate)}</div>
                            <div style="font-size:15px; color:#e0e0e0;">${escapeHtml(post.conteudo)}</div>
                            ${post.link ? `<a href="${post.link}" target="_blank" class="post-link" onclick="event.stopPropagation()">🔗 ${post.link.substring(0, 50)}${post.link.length > 50 ? '...' : ''}</a>` : ''}
                        </div>
                        <div class="post-stats" style="padding-left:0">
                            <span class="stat-action ${isLiked ? 'liked' : ''}" onclick="likePost('${post.id}')">
                                <span class="material-icons" style="font-size:18px;">${isLiked ? 'favorite' : 'favorite_border'}</span> ${post.likes || 0}
                            </span>
                            <span class="stat-action" onclick="openComments('${post.id}', '${post.userId}', '${post.userNome}')">
                                <span class="material-icons" style="font-size:18px;">chat_bubble_outline</span> ${post.comentarios || 0}
                            </span>
                            <span class="stat-action" onclick="sharePost('${post.id}')">
                                <span class="material-icons" style="font-size:18px;">share</span>
                            </span>
                        </div>
                    </div>
                `;
            }).join('');
        }

        container.innerHTML = `
            <div class="profile-page-header">
                <div class="profile-cover"></div>
                <div class="profile-info">
                    <div class="profile-avatar-large">
                        ${displayAvatar ? `<img src="${displayAvatar}" alt="Avatar">` : `<span>${userInitial}</span>`}
                    </div>
                    <div class="profile-name-area">
                        <h1>${escapeHtml(displayName)}</h1>
                        <div class="profile-username">@${userId.substring(0, 12)}</div>
                        ${userData.bio ? `<p class="profile-bio">${escapeHtml(userData.bio)}</p>` : '<p class="profile-bio" style="color:#666; font-style:italic;">Nenhuma bio definida</p>'}
                    </div>
                    <div class="profile-actions">
                        ${isOwnProfile ? `
                            <button class="btn-primary" onclick="goHome()">📱 Ir para o Feed</button>
                            <button class="btn-secondary" onclick="editProfile()">✏️ Editar Bio</button>
                        ` : `
                            ${currentUser && !isBanned ? `
                                <button class="follow-btn ${isFollowing ? 'following' : ''}" onclick="toggleFollowProfile('${userId}')">
                                    ${isFollowing ? '✓ Seguindo' : '+ Seguir'}
                                </button>
                            ` : ''}
                            <button class="btn-secondary" onclick="goHome()">🏠 Voltar</button>
                        `}
                    </div>
                    <div class="profile-stats-large">
                        <div class="stat-item">
                            <span class="stat-number">${posts.length}</span>
                            <span class="stat-label">Postagens</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-number">${seguidoresCount}</span>
                            <span class="stat-label">Seguidores</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-number">${seguindoCount}</span>
                            <span class="stat-label">Seguindo</span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="profile-posts-section">
                <h2>📝 Postagens</h2>
                <div class="profile-posts-grid">
                    ${postsHtml}
                </div>
            </div>
        `;

        document.title = `${displayName} - Bemtevi`;

    } catch (error) {
        console.error('Erro ao carregar perfil:', error);
        container.innerHTML = `
            <div class="profile-error">
                <span class="material-icons" style="font-size:64px; color:#e94560;">error_outline</span>
                <h2>Erro ao carregar perfil</h2>
                <p>${error.message}</p>
                <button class="btn-primary" onclick="goHome()">Voltar para o Início</button>
            </div>
        `;
    }
}

// ============================================
// EDITAR PERFIL - VERSÃO CORRIGIDA
// ============================================
function editProfile() {
    if (!currentUser) {
        alert('Faça login para editar seu perfil.');
        return;
    }
    
    const newBio = prompt('Digite sua nova bio (máx. 160 caracteres):');
    
    if (newBio === null) return;
    
    if (newBio.length > 160) {
        alert('A bio deve ter no máximo 160 caracteres.');
        return;
    }
    
    const container = document.getElementById('profileContent');
    if (container) {
        container.innerHTML = '<div class="loading">Atualizando bio...</div>';
    }
    
    // Tentar salvar no documento principal
    db.collection('usuarios').doc(currentUser.uid).update({
        bio: newBio.trim()
    })
    .then(() => {
        console.log('✅ Bio atualizada com sucesso!');
        renderProfile(currentUser.uid, currentUser.displayName);
    })
    .catch(error => {
        console.warn('Erro ao salvar bio no documento principal, tentando subcoleção...', error);
        
        // Tentar salvar na subcoleção perfil
        db.collection('usuarios').doc(currentUser.uid).collection('perfil').doc('dados').set({
            bio: newBio.trim(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true })
        .then(() => {
            console.log('✅ Bio atualizada na subcoleção!');
            renderProfile(currentUser.uid, currentUser.displayName);
        })
        .catch(error2 => {
            console.error('❌ Erro ao atualizar bio:', error2);
            alert('Erro ao atualizar bio: ' + error2.message);
            renderProfile(currentUser.uid, currentUser.displayName);
        });
    });
}

// ============================================
// FUNÇÃO PARA SEGUIR DA PÁGINA DE PERFIL
// ============================================
async function toggleFollowProfile(userIdToFollow) {
    if (!currentUser || userIdToFollow === currentUser.uid || isBanned) {
        if (isBanned) alert('Sua conta está banida.');
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
        }

        await renderProfile(profileUserId, '');
    } catch (error) {
        console.error('Erro ao seguir:', error);
        alert('Erro ao seguir usuário: ' + error.message);
    }
}

// ============================================
// NAVEGAÇÃO
// ============================================
function goHome() {
    window.location.href = 'index.html';
}

// ============================================
// INICIALIZAÇÃO
// ============================================
document.addEventListener('DOMContentLoaded', function() {
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
        updateUI();
        await loadNotifications();
        listenNotifications();
        loadProfile();
    } else {
        currentUser = null;
        isBanned = false;
        updateUI();
        if (notificationListener) { notificationListener(); notificationListener = null; }
        notifications = [];
        unreadCount = 0;
        updateNotificationBadge();
        removeBannedOverlay();
        document.getElementById('profileContent').innerHTML = `
            <div class="profile-error">
                <span class="material-icons" style="font-size:64px; color:#667eea;">lock</span>
                <h2>Faça login para ver perfis</h2>
                <p>Você precisa estar logado para visualizar perfis de usuários.</p>
                <button class="btn-primary" onclick="showLoginModal()">🔑 Entrar</button>
            </div>
        `;
    }
});

// ============================================
// PERFIL DO USUÁRIO
// ============================================
