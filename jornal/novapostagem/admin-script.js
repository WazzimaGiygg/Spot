// ============================================
// ADMIN DASHBOARD - SCRIPT
// ============================================

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
let posts = [];
let editingPostId = null;
let confirmCallback = null;

const SPECIFIC_ADMIN_UID = "sZxfMuOBPbXdR8nttVPXIN8QOOl1";

// ============================================
// FUNÇÕES AUXILIARES
// ============================================
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(timestamp) {
    if (!timestamp) return 'Data desconhecida';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function getCategoryIcon(cat) {
    const icons = {
        'política': '🏛️',
        'internacional': '🌍',
        'economia': '📊',
        'justiça': '⚖️',
        'cultura': '🎭',
        'investigação': '🔍',
        'opinião': '✍️',
        'esporte': '⚽',
        'tecnologia': '💻',
        'redes-sociais': '📱',
        'saúde': '🏥',
        'educação': '📚'
    };
    return icons[cat] || '📰';
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = 'toast ' + type;
    toast.style.display = 'block';
    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => {
        toast.style.display = 'none';
    }, 3000);
}

function getInitials(name) {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
}

// ============================================
// VERIFICAÇÕES
// ============================================
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

        const userData = {
            uid: uid,
            email: user.email || '',
            name: user.displayName || 'Usuário',
            profilePictureUrl: user.photoURL || '',
            isAdmin: isAdminValue,
            isBanned: existingData.isBanned || false,
            isBan: existingData.isBan || false,
            createdAt: existingData.createdAt || firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            lastLoginAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        await db.collection('users').doc(uid).set(userData, { merge: true });
        return userData;
    } catch (error) {
        console.error('Erro ao registrar usuário:', error);
        return null;
    }
}

// ============================================
// AUTENTICAÇÃO
// ============================================
function updateUI() {
    const userAvatar = document.getElementById('userAvatar');
    const userName = document.getElementById('userName');
    const userEmail = document.getElementById('userEmail');
    const userBadge = document.getElementById('userBadge');

    if (currentUser && !currentUserIsBanned) {
        let name = currentUser.displayName || (currentUser.email ? currentUser.email.split('@')[0] : 'Usuário');

        if (currentUser.photoURL) {
            userAvatar.innerHTML = `<img src="${currentUser.photoURL}" alt="Avatar">`;
        } else {
            userAvatar.textContent = getInitials(name);
        }

        userName.textContent = name.length > 20 ? name.substring(0, 17) + '...' : name;
        userEmail.textContent = currentUser.email || '';
        userBadge.style.display = 'inline-block';
    } else {
        userAvatar.innerHTML = '👤';
        userName.textContent = 'Visitante';
        userEmail.textContent = '';
        userBadge.style.display = 'none';
    }
}

function showBannedScreen(reason = 'Violação das políticas de uso') {
    const overlay = document.getElementById('bannedOverlay');
    const details = document.getElementById('banDetails');
    details.textContent = `Motivo: ${reason}`;
    overlay.classList.add('show');
    document.querySelector('.dashboard-container').style.opacity = '0.3';
    document.querySelector('.dashboard-container').style.pointerEvents = 'none';
    document.querySelector('.dashboard-header').style.opacity = '0.3';
    document.querySelector('.dashboard-header').style.pointerEvents = 'none';
}

function logoutBanned() {
    auth.signOut().then(() => window.location.href = 'index.html');
}

function logout() {
    auth.signOut().then(() => {
        window.location.href = 'index.html';
    });
}

// ============================================
// TABS
// ============================================
function switchTab(tab) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.menu-item').forEach(el => el.classList.remove('active'));

    const tabMap = {
        'posts': 'tabPosts',
        'create': 'tabCreate',
        'categories': 'tabCategories'
    };

    const targetTab = document.getElementById(tabMap[tab]);
    if (targetTab) targetTab.classList.add('active');

    const menuItems = document.querySelectorAll('.menu-item');
    const indexMap = { 'posts': 0, 'create': 1, 'categories': 2 };
    if (menuItems[indexMap[tab]]) {
        menuItems[indexMap[tab]].classList.add('active');
    }

    if (tab === 'posts') {
        loadPosts();
    }
}

// ============================================
// POSTS - CRUD
// ============================================
async function loadPosts() {
    const list = document.getElementById('postsList');
    list.innerHTML = `
        <div class="loading-state">
            <div class="spinner"></div>
            <p>Carregando postagens...</p>
        </div>
    `;

    try {
        let query = db.collection('articlesdoc')
            .orderBy('dataPublicacao', 'desc');

        const snapshot = await query.get();
        posts = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            // Verifica se o usuário atual é o autor ou admin
            if (currentUser && (data.autorId === currentUser.uid || currentUserIsAdmin)) {
                posts.push({ id: doc.id, ...data });
            }
        });

        if (posts.length === 0) {
            list.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-newspaper"></i>
                    <h3>Nenhuma postagem encontrada</h3>
                    <p>Comece criando sua primeira matéria!</p>
                    <button class="btn-primary" onclick="switchTab('create')" style="margin-top:16px;">
                        <i class="fas fa-plus"></i> Criar Postagem
                    </button>
                </div>
            `;
            return;
        }

        renderPosts();
    } catch (error) {
        list.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle" style="color: var(--danger);"></i>
                <h3>Erro ao carregar</h3>
                <p>${error.message}</p>
            </div>
        `;
    }
}

function renderPosts() {
    const list = document.getElementById('postsList');
    const categoryFilter = document.getElementById('filterCategory').value;
    const statusFilter = document.getElementById('filterStatus').value;
    const searchTerm = document.getElementById('searchPosts').value.toLowerCase();

    let filtered = posts.filter(post => {
        // Filtro por categoria
        if (categoryFilter !== 'all' && post.categoria !== categoryFilter) return false;

        // Filtro por status
        if (statusFilter === 'published' && post.status === 'draft') return false;
        if (statusFilter === 'draft' && post.status !== 'draft') return false;

        // Busca por título
        if (searchTerm && !post.titulo.toLowerCase().includes(searchTerm)) return false;

        return true;
    });

    if (filtered.length === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-search" style="color: var(--gray-light);"></i>
                <h3>Nenhum resultado encontrado</h3>
                <p>Tente ajustar os filtros de busca</p>
            </div>
        `;
        return;
    }

    document.getElementById('postCount').textContent = filtered.length;

    list.innerHTML = filtered.map(post => `
        <div class="post-card">
            ${post.imagemUrl ? `<img src="${post.imagemUrl}" alt="${escapeHtml(post.titulo)}" class="post-thumb" onerror="this.style.display='none'">` : 
            `<div class="post-thumb" style="display:flex;align-items:center;justify-content:center;font-size:32px;background:var(--gray-light);">${getCategoryIcon(post.categoria)}</div>`}
            <div class="post-info">
                <div class="post-title">${escapeHtml(post.titulo)}</div>
                <div class="post-meta">
                    <span class="category-tag">${getCategoryIcon(post.categoria)} ${post.categoria || 'Geral'}</span>
                    <span><i class="far fa-calendar"></i> ${formatDate(post.dataPublicacao)}</span>
                    <span><i class="fas fa-eye"></i> ${post.visualizacoes || 0}</span>
                    <span class="post-status ${post.status === 'draft' ? 'draft' : 'published'}">
                        ${post.status === 'draft' ? '📝 Rascunho' : '✅ Publicado'}
                    </span>
                </div>
            </div>
            <div class="post-actions">
                <button class="btn-view" onclick="viewPost('${post.id}')" title="Visualizar">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn-edit" onclick="editPost('${post.id}')" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-delete" onclick="deletePost('${post.id}')" title="Excluir">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function filterPosts() {
    renderPosts();
}

// ============================================
// CRIAR/EDITAR POSTAGEM
// ============================================
function resetForm() {
    editingPostId = null;
    document.getElementById('createTitle').innerHTML = '<i class="fas fa-plus-circle"></i> Nova Postagem';
    document.getElementById('saveButtonText').textContent = 'Publicar';
    document.getElementById('cancelEditBtn').style.display = 'none';
    document.getElementById('postTitle').value = '';
    document.getElementById('postCategory').value = '';
    document.getElementById('postImage').value = '';
    document.getElementById('postExcerpt').value = '';
    document.getElementById('postContent').value = '';
    document.getElementById('excerptCounter').textContent = '0/300';
    document.getElementById('imagePreview').style.display = 'none';
    document.getElementById('postForm').reset();
}

function previewImage() {
    const url = document.getElementById('postImage').value;
    const preview = document.getElementById('imagePreview');
    const img = document.getElementById('imagePreviewImg');

    if (url && url.match(/^https?:\/\/.+\/.+\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)/i)) {
        img.src = url;
        preview.style.display = 'block';
        showToast('🖼️ Imagem carregada para pré-visualização', 'success');
    } else {
        showToast('❌ URL inválida. Use uma URL de imagem direta.', 'error');
    }
}

function removeImagePreview() {
    document.getElementById('imagePreview').style.display = 'none';
    document.getElementById('imagePreviewImg').src = '';
}

// Atualizar contador de caracteres
document.getElementById('postExcerpt')?.addEventListener('input', function() {
    document.getElementById('excerptCounter').textContent = this.value.length + '/300';
});

// ============================================
// EDITOR TOOLBAR
// ============================================
function insertTag(tag) {
    const textarea = document.getElementById('postContent');
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);

    let before = '',
        after = '';

    switch (tag) {
        case 'b':
            before = '<b>';
            after = '</b>';
            break;
        case 'i':
            before = '<i>';
            after = '</i>';
            break;
        case 'u':
            before = '<u>';
            after = '</u>';
            break;
        case 'h2':
            before = '<h2>';
            after = '</h2>';
            break;
        case 'h3':
            before = '<h3>';
            after = '</h3>';
            break;
        case 'p':
            before = '<p>';
            after = '</p>';
            break;
        case 'ul':
            before = '<ul><li>';
            after = '</li></ul>';
            break;
        case 'blockquote':
            before = '<blockquote>';
            after = '</blockquote>';
            break;
        case 'a':
            const url = prompt('Digite a URL do link:', 'https://');
            if (url) {
                before = `<a href="${url}" target="_blank">`;
                after = '</a>';
            } else {
                return;
            }
            break;
        default:
            return;
    }

    const newText = textarea.value.substring(0, start) + before + selectedText + after + textarea.value.substring(end);
    textarea.value = newText;
    textarea.focus();
    textarea.setSelectionRange(start + before.length, end + before.length);
}

function insertImageTag() {
    const url = prompt('Digite a URL da imagem:', 'https://exemplo.com/imagem.jpg');
    if (url) {
        const textarea = document.getElementById('postContent');
        const start = textarea.selectionStart;
        const imgTag = `<img src="${url}" alt="Imagem" style="max-width:100%; border-radius:8px; margin:10px 0;">`;
        const newText = textarea.value.substring(0, start) + imgTag + textarea.value.substring(start);
        textarea.value = newText;
        textarea.focus();
    }
}

// ============================================
// SALVAR POSTAGEM
// ============================================
async function savePost() {
    const title = document.getElementById('postTitle').value.trim();
    const category = document.getElementById('postCategory').value;
    const image = document.getElementById('postImage').value.trim();
    const excerpt = document.getElementById('postExcerpt').value.trim();
    const content = document.getElementById('postContent').value.trim();

    if (!title) {
        showToast('❌ O título é obrigatório!', 'error');
        document.getElementById('postTitle').focus();
        return;
    }

    if (!category) {
        showToast('❌ Selecione uma categoria!', 'error');
        document.getElementById('postCategory').focus();
        return;
    }

    if (!excerpt) {
        showToast('❌ O resumo é obrigatório!', 'error');
        document.getElementById('postExcerpt').focus();
        return;
    }

    if (!content) {
        showToast('❌ O conteúdo é obrigatório!', 'error');
        document.getElementById('postContent').focus();
        return;
    }

    const postData = {
        titulo: title,
        categoria: category,
        imagemUrl: image || null,
        resumo: excerpt,
        conteudo: content,
        autorId: currentUser.uid,
        autorNome: currentUser.displayName || currentUser.email?.split('@')[0] || 'Administrador',
        autorEmail: currentUser.email,
        dataPublicacao: firebase.firestore.FieldValue.serverTimestamp(),
        ultimaEdicao: firebase.firestore.FieldValue.serverTimestamp(),
        visualizacoes: 0,
        status: 'published'
    };

    try {
        if (editingPostId) {
            await db.collection('articlesdoc').doc(editingPostId).update(postData);
            showToast('✅ Matéria atualizada com sucesso!', 'success');
        } else {
            await db.collection('articlesdoc').add(postData);
            showToast('✅ Matéria publicada com sucesso!', 'success');
        }

        resetForm();
        switchTab('posts');
        loadPosts();
    } catch (error) {
        showToast('❌ Erro ao salvar: ' + error.message, 'error');
    }
}

async function saveAsDraft() {
    const title = document.getElementById('postTitle').value.trim();
    const category = document.getElementById('postCategory').value;
    const image = document.getElementById('postImage').value.trim();
    const excerpt = document.getElementById('postExcerpt').value.trim();
    const content = document.getElementById('postContent').value.trim();

    if (!title) {
        showToast('❌ O título é obrigatório!', 'error');
        return;
    }

    if (!category) {
        showToast('❌ Selecione uma categoria!', 'error');
        return;
    }

    const postData = {
        titulo: title,
        categoria: category,
        imagemUrl: image || null,
        resumo: excerpt,
        conteudo: content,
        autorId: currentUser.uid,
        autorNome: currentUser.displayName || currentUser.email?.split('@')[0] || 'Administrador',
        autorEmail: currentUser.email,
        dataPublicacao: firebase.firestore.FieldValue.serverTimestamp(),
        ultimaEdicao: firebase.firestore.FieldValue.serverTimestamp(),
        visualizacoes: 0,
        status: 'draft'
    };

    try {
        if (editingPostId) {
            await db.collection('articlesdoc').doc(editingPostId).update(postData);
            showToast('✅ Rascunho atualizado com sucesso!', 'success');
        } else {
            await db.collection('articlesdoc').add(postData);
            showToast('✅ Rascunho salvo com sucesso!', 'success');
        }

        resetForm();
        switchTab('posts');
        loadPosts();
    } catch (error) {
        showToast('❌ Erro ao salvar rascunho: ' + error.message, 'error');
    }
}

function cancelEdit() {
    resetForm();
    switchTab('posts');
}

// ============================================
// EDITAR POSTAGEM
// ============================================
async function editPost(postId) {
    try {
        const doc = await db.collection('articlesdoc').doc(postId).get();
        if (!doc.exists) {
            showToast('❌ Matéria não encontrada!', 'error');
            return;
        }

        const data = doc.data();
        editingPostId = postId;

        document.getElementById('createTitle').innerHTML = '<i class="fas fa-edit"></i> Editar Postagem';
        document.getElementById('saveButtonText').textContent = 'Atualizar';
        document.getElementById('cancelEditBtn').style.display = 'inline-flex';
        document.getElementById('postTitle').value = data.titulo || '';
        document.getElementById('postCategory').value = data.categoria || '';
        document.getElementById('postImage').value = data.imagemUrl || '';
        document.getElementById('postExcerpt').value = data.resumo || '';
        document.getElementById('postContent').value = data.conteudo || '';
        document.getElementById('excerptCounter').textContent = (data.resumo || '').length + '/300';

        if (data.imagemUrl) {
            document.getElementById('imagePreviewImg').src = data.imagemUrl;
            document.getElementById('imagePreview').style.display = 'block';
        } else {
            document.getElementById('imagePreview').style.display = 'none';
        }

        switchTab('create');
        document.getElementById('postTitle').focus();
    } catch (error) {
        showToast('❌ Erro ao carregar para edição: ' + error.message, 'error');
    }
}

// ============================================
// VISUALIZAR POSTAGEM
// ============================================
function viewPost(postId) {
    window.open(`index.html?id=${postId}`, '_blank');
}

// ============================================
// EXCLUIR POSTAGEM
// ============================================
function deletePost(postId) {
    showConfirmModal(
        '🗑️ Excluir Matéria',
        'Tem certeza que deseja excluir esta matéria? Esta ação não pode ser desfeita!',
        async () => {
            try {
                await db.collection('articlesdoc').doc(postId).delete();
                showToast('✅ Matéria excluída com sucesso!', 'success');
                loadPosts();
                closeConfirmModal();
            } catch (error) {
                showToast('❌ Erro ao excluir: ' + error.message, 'error');
            }
        }
    );
}

// ============================================
// MODAL DE CONFIRMAÇÃO
// ============================================
function showConfirmModal(title, message, callback) {
    document.getElementById('confirmTitle').textContent = title;
    document.getElementById('confirmMessage').textContent = message;
    document.getElementById('confirmModal').classList.add('show');
    confirmCallback = callback;
}

function closeConfirmModal() {
    document.getElementById('confirmModal').classList.remove('show');
    confirmCallback = null;
}

document.getElementById('confirmActionBtn')?.addEventListener('click', () => {
    if (confirmCallback) {
        confirmCallback();
    }
});

// ============================================
// INICIALIZAÇÃO
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    // Verificar autenticação
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            currentUser = user;
            await registerUser(user);

            currentUserIsBanned = await checkIfUserIsBanned(user);
            if (currentUserIsBanned) {
                showBannedScreen('Sua conta foi banida por violação das políticas de uso.');
                await auth.signOut();
                updateUI();
                document.getElementById('accessDenied').style.display = 'none';
                return;
            }

            currentUserIsAdmin = await checkIfUserIsAdmin(user);

            if (!currentUserIsAdmin) {
                document.getElementById('accessDenied').style.display = 'flex';
                document.querySelector('.dashboard-header').style.display = 'none';
                document.querySelector('.dashboard-container').style.display = 'none';
                return;
            }

            updateUI();
            document.getElementById('accessDenied').style.display = 'none';
            document.querySelector('.dashboard-header').style.display = 'block';
            document.querySelector('.dashboard-container').style.display = 'flex';

            // Carregar posts
            await loadPosts();
        } else {
            document.getElementById('accessDenied').style.display = 'flex';
            document.querySelector('.dashboard-header').style.display = 'none';
            document.querySelector('.dashboard-container').style.display = 'none';
        }
    });
});

// ============================================
// EXPOR FUNÇÕES GLOBAIS
// ============================================
window.switchTab = switchTab;
window.filterPosts = filterPosts;
window.savePost = savePost;
window.saveAsDraft = saveAsDraft;
window.cancelEdit = cancelEdit;
window.resetForm = resetForm;
window.editPost = editPost;
window.viewPost = viewPost;
window.deletePost = deletePost;
window.previewImage = previewImage;
window.removeImagePreview = removeImagePreview;
window.insertTag = insertTag;
window.insertImageTag = insertImageTag;
window.showConfirmModal = showConfirmModal;
window.closeConfirmModal = closeConfirmModal;
window.logout = logout;
window.logoutBanned = logoutBanned;
