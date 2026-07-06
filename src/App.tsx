import React, { useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut, 
  googleProvider, 
  auth, 
  db 
} from './firebase';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  increment, 
  serverTimestamp,
  getDoc,
  setDoc
} from 'firebase/firestore';
import { Project } from './types';
import { handleFirestoreError, OperationType } from './utils/firestore';

// Subcomponents
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import ProjectCard from './components/ProjectCard';
import ProjectModal from './components/ProjectModal';
import ViewProjectModal from './components/ViewProjectModal';
import LoginModal from './components/LoginModal';
import FlappyCaptcha from './components/FlappyCaptcha';

// Lucide Icons
import { 
  ShieldAlert, LogOut, Code2, Heart, HeartHandshake, Sparkles, 
  Layers, FolderOpen, RefreshCw, Eye
} from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isBanned, setIsBanned] = useState(false);
  const [banReason, setBanReason] = useState('Violação das políticas de uso');
  const [isCaptchaVerified, setIsCaptchaVerified] = useState(false);

  // DB States
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterMine, setFilterMine] = useState(false);

  // Modal Toggles
  const [activeModal, setActiveModal] = useState<'newProject' | 'login' | 'viewProject' | null>(null);

  // ============================================================
  // 1. CAPTCHA PERSISTENCE ON MOUNT
  // ============================================================
  useEffect(() => {
    try {
      const savedVerified = localStorage.getItem('skyhtml_captcha_verified');
      const savedDate = localStorage.getItem('skyhtml_captcha_date');
      if (savedVerified === 'true' && savedDate) {
        const diff = Date.now() - parseInt(savedDate, 10);
        // Valid for 24 hours (86400000ms)
        if (diff < 86400000) {
          setIsCaptchaVerified(true);
        } else {
          localStorage.removeItem('skyhtml_captcha_verified');
          localStorage.removeItem('skyhtml_captcha_date');
        }
      }
    } catch (e) {
      console.error('Erro ao ler localStorage:', e);
    }
  }, []);

  // Handle captcha success
  const handleCaptchaSuccess = () => {
    setIsCaptchaVerified(true);
    try {
      localStorage.setItem('skyhtml_captcha_verified', 'true');
      localStorage.setItem('skyhtml_captcha_date', Date.now().toString());
    } catch (e) {
      console.error(e);
    }
  };

  // ============================================================
  // 2. FIREBASE USER AUTH STATE LISTENER & SYNC
  // ============================================================
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Sync user profile & details
        const profile = await registerUserProfile(user);
        
        // Check if user is banned in DB
        const banned = profile?.isBanned === true || profile?.isBan === true;
        setIsBanned(banned);
        if (profile?.banReason) {
          setBanReason(profile.banReason);
        }

        setCurrentUser(user);
      } else {
        // Fallback or guest
        setCurrentUser(null);
        setIsBanned(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const registerUserProfile = async (user: any) => {
    try {
      const uid = user.uid;
      const userDocRef = doc(db, 'users', uid);
      const userDoc = await getDoc(userDocRef);
      const existingData = userDoc.exists() ? userDoc.data() : {};

      const userData = {
        uid: uid,
        email: user.email || '',
        name: user.displayName || 'Usuário',
        profilePictureUrl: user.photoURL || '',
        isAdmin: existingData.isAdmin || false,
        isBan: existingData.isBan || false,
        isBanned: existingData.isBanned || false,
        banReason: existingData.banReason || 'Violação das políticas de uso',
        isTeacher: false,
        isTeatcher: false,
        createdAt: existingData.createdAt || serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastLoginAt: serverTimestamp()
      };

      // Set user record in both 'users' and 'usuários' as in original configurations
      await setDoc(doc(db, 'users', uid), userData, { merge: true });
      await setDoc(doc(db, 'usuários', uid), userData, { merge: true });
      return userData;
    } catch (error) {
      console.error('Erro ao registrar usuário no Firestore:', error);
      return null;
    }
  };

  // ============================================================
  // 3. REALTIME PROJECT LISTENER (onSnapshot)
  // ============================================================
  useEffect(() => {
    if (!isCaptchaVerified || isBanned) return;

    setLoadingProjects(true);
    const q = query(collection(db, 'skyhtml'), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Project[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        list.push({
          id: docSnap.id,
          ...data,
        } as Project);
      });
      setProjects(list);
      setLoadingProjects(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'skyhtml');
      setLoadingProjects(false);
    });

    return () => unsubscribe();
  }, [isCaptchaVerified, isBanned]);

  // ============================================================
  // 4. DATABASE WRITE/MUTATION HANDLERS
  // ============================================================
  const handlePublishProject = async (data: {
    name: string;
    type: string;
    description: string;
    code: string;
    status: 'open' | 'closed';
  }) => {
    if (!currentUser) return;
    
    const path = 'skyhtml';
    try {
      const projectPayload = {
        ...data,
        locked: false,
        authorId: currentUser.uid,
        authorName: currentUser.displayName || currentUser.name || currentUser.email || 'Autor',
        authorEmail: currentUser.email || '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        views: 0,
        collaborators: [],
        collaborationRequests: []
      };

      await addDoc(collection(db, path), projectPayload);
      setActiveModal(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  };

  const handleUpdateCode = async (id: string, code: string) => {
    const path = `skyhtml/${id}`;
    try {
      const docRef = doc(db, 'skyhtml', id);
      await updateDoc(docRef, {
        code,
        updatedAt: serverTimestamp()
      });

      // Update local view selected project if matching
      if (selectedProject?.id === id) {
        setSelectedProject(prev => prev ? { ...prev, code } : null);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const handleUpdateSettings = async (id: string, status: 'open' | 'closed', locked: boolean) => {
    const path = `skyhtml/${id}`;
    try {
      const docRef = doc(db, 'skyhtml', id);
      await updateDoc(docRef, {
        status,
        locked,
        updatedAt: serverTimestamp()
      });

      // Update local view selected project if matching
      if (selectedProject?.id === id) {
        setSelectedProject(prev => prev ? { ...prev, status, locked } : null);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const handleDeleteProject = async (id: string) => {
    const path = `skyhtml/${id}`;
    try {
      const docRef = doc(db, 'skyhtml', id);
      await deleteDoc(docRef);
      setSelectedProject(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const handleIncrementViews = async (id: string) => {
    const path = `skyhtml/${id}`;
    try {
      const docRef = doc(db, 'skyhtml', id);
      await updateDoc(docRef, {
        views: increment(1)
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  // ============================================================
  // 5. AUTH & NAVIGATION ACTIONS
  // ============================================================
  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      setActiveModal(null);
    } catch (err: any) {
      alert('Erro ao entrar com Google: ' + err.message);
    }
  };

  const handleGuestLogin = () => {
    setCurrentUser({
      uid: 'guest_' + Date.now(),
      displayName: 'Convidado',
      email: 'guest@skyhtml.local',
      isGuest: true,
    });
    setActiveModal(null);
  };

  const handleLogout = async () => {
    if (auth.currentUser) {
      await signOut(auth);
    }
    setCurrentUser(null);
    setIsBanned(false);
  };

  const handleNewProjectClick = () => {
    if (isBanned) {
      alert('Sua conta está suspensa. Não é possível criar novos projetos.');
      return;
    }
    if (!currentUser) {
      setActiveModal('login');
      return;
    }
    setActiveModal('newProject');
  };

  const handleViewProject = async (id: string) => {
    const p = projects.find(item => item.id === id);
    if (!p) return;

    // View increment count
    if (currentUser && !currentUser.isGuest) {
      handleIncrementViews(id);
    }

    setSelectedProject(p);
    setActiveModal('viewProject');
  };

  const handleManageClickFromCard = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const p = projects.find(item => item.id === id);
    if (!p) return;
    setSelectedProject(p);
    setActiveModal('viewProject');
    // Open in settings tab instantly
    setTimeout(() => {
      const tabs = document.querySelectorAll('button');
      tabs.forEach(btn => {
        if (btn.textContent?.includes('Ajustes')) {
          btn.click();
        }
      });
    }, 100);
  };

  // ============================================================
  // 6. FRONTEND LIST AND FILTER LOGIC
  // ============================================================
  const filteredProjects = projects.filter((p) => {
    // 1. Search Query
    if (searchQuery) {
      const queryLower = searchQuery.toLowerCase();
      const matchName = p.name.toLowerCase().includes(queryLower);
      const matchDesc = p.description?.toLowerCase().includes(queryLower);
      const matchAuthor = p.authorName?.toLowerCase().includes(queryLower);
      if (!matchName && !matchDesc && !matchAuthor) return false;
    }

    // 2. Type Filter
    if (filterType && p.type !== filterType) return false;

    // 3. Status Filter
    if (filterStatus && p.status !== filterStatus) return false;

    // 4. Mine filter
    if (filterMine && currentUser && !currentUser.isGuest) {
      if (p.authorId !== currentUser.uid) return false;
    }

    // 5. Hide locked (private) projects unless it belongs to the logged-in user
    if (p.locked && p.authorId !== currentUser?.uid) {
      return false;
    }

    return true;
  });

  const collabCount = projects.filter(p => p.status === 'open' && !p.locked).length;

  // Render Banned overlay Screen
  if (isBanned) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950">
        <div className="max-w-md w-full bg-slate-900 border-2 border-rose-600 rounded-3xl p-8 text-center shadow-2xl shadow-rose-500/10 animate-in fade-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto mb-5 text-4xl">
            🚫
          </div>
          <h2 className="text-xl font-black text-rose-500 tracking-tight mb-2">Conta Suspensa</h2>
          <p className="text-sm text-slate-300 leading-relaxed mb-5">
            Sua conta de desenvolvedor foi suspensa permanentemente por violação das diretrizes de nossa comunidade.
          </p>
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs text-rose-400 font-mono mb-6 text-left break-words">
            <strong>Motivo:</strong> {banReason}
          </div>
          <button
            onClick={handleLogout}
            className="w-full bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold text-sm py-2.5 px-5 rounded-xl shadow-lg shadow-rose-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sair da Conta</span>
          </button>
        </div>
      </div>
    );
  }

  // Render Flappy Captcha
  if (!isCaptchaVerified) {
    return <FlappyCaptcha onVerified={handleCaptchaSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-indigo-100 selection:text-indigo-900 animate-in fade-in duration-305">
      
      {/* HEADER SECTION */}
      <Header
        currentUser={currentUser}
        onLoginClick={() => setActiveModal('login')}
        onGuestLogin={handleGuestLogin}
        onLogout={handleLogout}
        onNewProjectClick={handleNewProjectClick}
        onSearch={setSearchQuery}
        onMyProjectsClick={() => {
          setFilterMine(true);
        }}
      />

      {/* COMMUNITY WELCOME HERO SECTION */}
      <section className="relative overflow-hidden bg-white border-b border-slate-200 px-4 sm:px-6 py-10 sm:py-12">
        {/* Abstract background grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a05_1px,transparent_1px),linear-gradient(to_bottom,#0f172a05_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
        <div className="absolute -top-1/2 -right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-1/2 -left-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 relative">
          <div className="space-y-3.5 max-w-xl text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold px-3 py-1 rounded-full text-[10px] uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Playground Interativo</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight leading-tight">
              A comunidade ideal para{' '}
              <span className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 bg-clip-text text-transparent">
                programadores criativos
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              Crie interfaces incríveis, teste snippets de código em tempo real de forma 100% segura, e compartilhe suas produções em nossa comunidade colaborativa de desenvolvedores.
            </p>
          </div>
          
          {/* Quick stats floating badge */}
          <div className="bg-white border border-slate-200 p-5 rounded-2xl flex items-center gap-4 shadow-sm shrink-0 self-center md:self-auto max-w-xs w-full sm:w-auto">
            <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-600">
              <Code2 className="w-6 h-6" />
            </div>
            <div>
              <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Collab Aberta</div>
              <div className="text-lg font-bold text-slate-800">{collabCount} Projetos</div>
              <div className="text-[10px] text-slate-500">Prontos para receber melhorias</div>
            </div>
          </div>
        </div>
      </section>

      {/* MAIN VIEWGRID CONTAINER */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* SIDEBAR FILTERS & STATS */}
          <Sidebar
            totalProjects={projects.length}
            collabProjects={collabCount}
            selectedType={filterType}
            onTypeChange={setFilterType}
            selectedStatus={filterStatus}
            onStatusChange={setFilterStatus}
            showMine={filterMine}
            onShowMineChange={setFilterMine}
            currentUser={currentUser}
          />

          {/* PROJECT GRID AREA */}
          <div className="flex-1 space-y-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-2 text-slate-800">
                <FolderOpen className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm uppercase tracking-wider font-bold">Projetos da Comunidade</h3>
              </div>
              
              <button
                onClick={() => {
                  setFilterType('');
                  setFilterStatus('');
                  setFilterMine(false);
                  setSearchQuery('');
                }}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors cursor-pointer"
              >
                Limpar Filtros
              </button>
            </div>

            {/* Render Project Loading or empty states */}
            {loadingProjects ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 animate-pulse">
                    <div className="flex justify-between items-center">
                      <div className="h-5 bg-slate-100 rounded-md w-2/3" />
                      <div className="h-4 bg-slate-100 rounded-md w-1/4" />
                    </div>
                    <div className="h-3 bg-slate-100 rounded-md w-1/3" />
                    <div className="space-y-2">
                      <div className="h-3 bg-slate-100 rounded-md w-full" />
                      <div className="h-3 bg-slate-100 rounded-md w-5/6" />
                    </div>
                    <div className="h-7 bg-slate-100 rounded-md w-full pt-2" />
                  </div>
                ))}
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl p-6">
                <div className="text-slate-400 text-5xl mb-4">📭</div>
                <h4 className="text-base font-bold text-slate-800">Nenhum projeto encontrado</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 leading-relaxed">
                  Não existem projetos que correspondam aos filtros selecionados no momento. Tente expandir sua pesquisa ou crie o primeiro!
                </p>
                <button
                  onClick={handleNewProjectClick}
                  className="mt-5 inline-flex items-center gap-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-xs px-4 py-2 rounded-xl transition-all cursor-pointer"
                >
                  Criar Projeto
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {filteredProjects.map((p) => (
                  <ProjectCard
                    key={p.id}
                    project={p}
                    currentUser={currentUser}
                    onViewClick={handleViewProject}
                    onManageClick={handleManageClickFromCard}
                  />
                ))}
              </div>
            )}
          </div>

        </div>
      </main>

      {/* FOOTER SECTION */}
      <footer className="bg-white border-t border-slate-200 text-slate-500 py-8 px-4 sm:px-6 mt-12 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-rose-500 fill-rose-500/20" />
            <span className="font-medium text-slate-600">SkyHTML por WazzimaGiygg</span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-500">© 2026 Todos os direitos reservados.</span>
          </div>

          <div className="flex items-center gap-3.5 flex-wrap justify-center text-slate-500 font-semibold">
            <a href="https://wazzimagiygg.com/donate/" target="_blank" className="hover:text-indigo-600 transition-colors">
              💝 Doar
            </a>
            <span className="text-slate-200">|</span>
            <a href="https://wazzimagiygg.com/desktop.html" target="_blank" className="hover:text-indigo-600 transition-colors">
              🖥️ Desktop
            </a>
            <span className="text-slate-200">|</span>
            <a href="https://wazzimagiygg.com/LGPD" target="_blank" className="hover:text-indigo-600 transition-colors">
              🔒 LGPD
            </a>
            <span className="text-slate-200">|</span>
            <a href="https://wazzimagiygg.com/MarcoCivil" target="_blank" className="hover:text-indigo-600 transition-colors">
              📜 Marco Civil
            </a>
            <span className="text-slate-200">|</span>
            <a href="https://wazzimagiygg.com/relatorio-wikipedia.html" target="_blank" className="hover:text-indigo-600 transition-colors">
              📄 Wikipédia
            </a>
            <span className="text-slate-200">|</span>
            <a href="https://support.wazzimagiygg.com/" target="_blank" className="inline-flex items-center gap-1 bg-slate-50 border border-slate-200 px-3 py-1 rounded-full text-slate-600 hover:text-slate-800 hover:border-slate-300 transition-colors">
              <HeartHandshake className="w-3.5 h-3.5 text-indigo-500" />
              Ticket suporte
            </a>
            <span className="text-slate-200">|</span>
            <a href="https://wazzimagiygg.com/produtos" target="_blank" className="hover:text-indigo-600 transition-colors">
              🛍️ Produtos
            </a>
          </div>
        </div>
      </footer>

      {/* ============================================================
      // 7. MODAL OVERLAYS
      // ============================================================ */}
      {/* login modal */}
      {activeModal === 'login' && (
        <LoginModal
          onClose={() => setActiveModal(null)}
          onGoogleLogin={handleGoogleLogin}
          onGuestLogin={handleGuestLogin}
        />
      )}

      {/* publish project modal */}
      {activeModal === 'newProject' && (
        <ProjectModal
          onClose={() => setActiveModal(null)}
          onSubmit={handlePublishProject}
        />
      )}

      {/* view selected project modal */}
      {activeModal === 'viewProject' && selectedProject && (
        <ViewProjectModal
          project={selectedProject}
          currentUser={currentUser}
          onClose={() => {
            setActiveModal(null);
            setSelectedProject(null);
          }}
          onUpdateCode={handleUpdateCode}
          onUpdateSettings={handleUpdateSettings}
          onDeleteProject={handleDeleteProject}
        />
      )}

    </div>
  );
}
