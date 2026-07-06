import { useState, useEffect } from 'react';
import { Project } from '../types';
import { 
  X, Copy, Check, Eye, Play, Sparkles, Settings, 
  Trash2, RefreshCw, FileCode, Shield, CheckCircle2, AlertCircle
} from 'lucide-react';

interface ViewProjectModalProps {
  project: Project;
  currentUser: any;
  onClose: () => void;
  onUpdateCode: (id: string, code: string) => Promise<void>;
  onUpdateSettings: (id: string, status: 'open' | 'closed', locked: boolean) => Promise<void>;
  onDeleteProject?: (id: string) => Promise<void>;
}

export default function ViewProjectModal({
  project,
  currentUser,
  onClose,
  onUpdateCode,
  onUpdateSettings,
  onDeleteProject,
}: ViewProjectModalProps) {
  const [activeTab, setActiveTab] = useState<'preview' | 'code' | 'settings'>('preview');
  const [editedCode, setEditedCode] = useState(project.code);
  const [isCopied, setIsCopied] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);

  // Settings state
  const [status, setStatus] = useState<'open' | 'closed'>(project.status || 'open');
  const [locked, setLocked] = useState(project.locked || false);

  const [savingCode, setSavingCode] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const isAuthor = currentUser && project.authorId === currentUser.uid && !currentUser.isGuest;
  const isCollaborator = project.collaborators && project.collaborators.includes(currentUser?.uid);
  const canEdit = isAuthor || isCollaborator;

  // Sync state if project changes
  useEffect(() => {
    setEditedCode(project.code);
    setStatus(project.status || 'open');
    setLocked(project.locked || false);
  }, [project]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(editedCode);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 1500);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveCode = async () => {
    if (!canEdit) return;
    setSavingCode(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      await onUpdateCode(project.id, editedCode);
      setSuccessMsg('Código fonte atualizado com sucesso!');
      setIframeKey(k => k + 1); // Refresh preview
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Erro ao salvar alterações no código.');
    } finally {
      setSavingCode(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!isAuthor) return;
    setSavingSettings(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      await onUpdateSettings(project.id, status, locked);
      setSuccessMsg('Configurações do projeto atualizadas com sucesso!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Erro ao salvar configurações.');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleDelete = async () => {
    if (!isAuthor || !onDeleteProject) return;
    if (confirm('Tem certeza absoluta de que deseja excluir este projeto permanentemente? Esta ação não pode ser desfeita.')) {
      try {
        await onDeleteProject(project.id);
        onClose();
      } catch (err: any) {
        setErrorMsg(err?.message || 'Erro ao excluir projeto.');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl h-[90vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 border-b border-slate-100 gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <span className="text-indigo-650">📁</span>
              {project.name}
            </h2>
            <p className="text-[10px] text-slate-500 mt-0.5">
              Por <span className="font-semibold text-slate-700">{project.authorName}</span> • Tipo: <span className="text-indigo-600 font-semibold">{project.type}</span>
            </p>
          </div>

          {/* Tab Selection */}
          <div className="flex items-center bg-slate-100 p-1 border border-slate-200 rounded-xl shrink-0 self-start sm:self-auto">
            <button
              onClick={() => setActiveTab('preview')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'preview' 
                  ? 'bg-indigo-600 text-white shadow-sm' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Play className="w-3.5 h-3.5" />
              <span>Preview</span>
            </button>
            <button
              onClick={() => setActiveTab('code')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'code' 
                  ? 'bg-indigo-600 text-white shadow-sm' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>Código</span>
            </button>
            {isAuthor && (
              <button
                onClick={() => setActiveTab('settings')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'settings' 
                    ? 'bg-indigo-600 text-white shadow-sm' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Ajustes</span>
              </button>
            )}
          </div>

          <button 
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-all cursor-pointer absolute right-4 top-4 sm:static"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-hidden flex flex-col min-h-0 bg-white">
          
          {/* Status Banners */}
          {successMsg && (
            <div className="bg-emerald-50 border-b border-emerald-100 text-emerald-800 px-6 py-2.5 flex items-center gap-2 text-xs">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}
          {errorMsg && (
            <div className="bg-rose-50 border-b border-rose-100 text-rose-800 px-6 py-2.5 flex items-center gap-2 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* ACTIVE TAB CONTENT */}
          <div className="flex-1 flex flex-col overflow-hidden">
            
            {/* 1. Preview Screen Tab */}
            {activeTab === 'preview' && (
              <div className="flex-1 flex flex-col min-h-0 bg-slate-50 p-4">
                <div className="flex justify-between items-center mb-2.5 text-xs">
                  <div className="flex items-center gap-1 text-slate-500">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Visualizador de Resultados</span>
                  </div>
                  <button
                    onClick={() => setIframeKey(k => k + 1)}
                    className="flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-50 hover:text-slate-800 text-slate-500 rounded-lg transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Recarregar</span>
                  </button>
                </div>
                
                {/* Sandbox Frame */}
                <div className="flex-1 bg-white rounded-xl overflow-hidden shadow-sm border border-slate-200 relative">
                  <iframe
                    key={iframeKey}
                    title="Live Code Preview"
                    srcDoc={editedCode}
                    sandbox="allow-scripts allow-modals"
                    className="w-full h-full border-none bg-white"
                  />
                </div>
              </div>
            )}

            {/* 2. Source Code Tab */}
            {activeTab === 'code' && (
              <div className="flex-1 flex flex-col min-h-0 p-5 space-y-4 bg-slate-50">
                <div className="flex justify-between items-center text-xs">
                  <div className="text-slate-500 flex items-center gap-1.5">
                    <FileCode className="w-4 h-4 text-indigo-600" />
                    {canEdit ? (
                      <span>Você pode editar o código diretamente abaixo:</span>
                    ) : (
                      <span>Código fonte do projeto (somente leitura):</span>
                    )}
                  </div>
                  
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 px-3 py-1 bg-white border border-slate-200 hover:bg-slate-100 hover:text-slate-800 text-slate-700 rounded-lg font-semibold transition-all cursor-pointer"
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                    <span>{isCopied ? 'Copiado!' : 'Copiar Código'}</span>
                  </button>
                </div>

                <div className="flex-1 min-h-0">
                  <textarea
                    value={editedCode}
                    onChange={(e) => canEdit && setEditedCode(e.target.value)}
                    disabled={!canEdit}
                    className="w-full h-full bg-slate-900 border border-slate-850 focus:border-indigo-500 rounded-xl p-4 text-xs font-mono text-slate-100 focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all resize-none overflow-y-auto"
                  />
                </div>

                {canEdit && (
                  <div className="flex items-center justify-end gap-3 pt-1">
                    <button
                      onClick={() => setEditedCode(project.code)}
                      disabled={savingCode}
                      className="px-4 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
                    >
                      Descartar
                    </button>
                    <button
                      onClick={handleSaveCode}
                      disabled={savingCode || editedCode === project.code}
                      className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-400 rounded-lg text-white font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      {savingCode && <RefreshCw className="w-3 h-3 animate-spin" />}
                      <span>Salvar Alterações</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* 3. Settings/Manage Tab */}
            {activeTab === 'settings' && isAuthor && (
              <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
                <div className="flex items-center gap-2.5 text-slate-800 pb-3 border-b border-slate-200">
                  <Shield className="w-5 h-5 text-indigo-600" />
                  <div>
                    <h3 className="text-sm font-bold">Configurações de Segurança</h3>
                    <p className="text-[10px] text-slate-500 mt-0.5">Defina privilégios de visibilidade e colaboração</p>
                  </div>
                </div>

                {/* Status Toggle */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">
                    Estado do Projeto
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer select-none transition-all ${
                      status === 'open' 
                        ? 'bg-indigo-50 border-indigo-200 text-indigo-900' 
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}>
                      <input
                        type="radio"
                        checked={status === 'open'}
                        onChange={() => setStatus('open')}
                        className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500 bg-slate-50 accent-indigo-600"
                      />
                      <div>
                        <div className="text-xs font-bold">🤝 Aberto para Collab</div>
                        <div className="text-[10px] text-slate-500 opacity-90 mt-0.5">Outros usuários podem propor alterações no seu código fonte</div>
                      </div>
                    </label>

                    <label className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer select-none transition-all ${
                      status === 'closed' 
                        ? 'bg-indigo-50 border-indigo-200 text-indigo-900' 
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}>
                      <input
                        type="radio"
                        checked={status === 'closed'}
                        onChange={() => setStatus('closed')}
                        className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500 bg-slate-50 accent-indigo-600"
                      />
                      <div>
                        <div className="text-xs font-bold">🔒 Fechado (Somente Leitura)</div>
                        <div className="text-[10px] text-slate-500 opacity-90 mt-0.5">Ninguém além do autor pode editar ou sugerir modificações</div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Lock Toggle */}
                <div className="space-y-3">
                  <div className="flex items-start gap-3.5 p-4 rounded-xl border border-slate-200 bg-white">
                    <input
                      id="locked-checkbox"
                      type="checkbox"
                      checked={locked}
                      onChange={(e) => setLocked(e.target.checked)}
                      className="w-4.5 h-4.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 bg-white mt-0.5 accent-indigo-600 cursor-pointer"
                    />
                    <label htmlFor="locked-checkbox" className="flex-1 cursor-pointer select-none">
                      <span className="text-xs font-bold text-slate-800 block">Trancar este projeto</span>
                      <span className="text-[10px] text-slate-500 leading-relaxed block mt-0.5">
                        Projetos trancados tornam-se privados e são totalmente invisíveis para toda a comunidade na grade de exploração. Apenas você poderá visualizá-lo.
                      </span>
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-slate-200 pt-6 mt-4">
                  {onDeleteProject ? (
                    <button
                      type="button"
                      onClick={handleDelete}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                      Excluir Projeto
                    </button>
                  ) : <div />}

                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setStatus(project.status || 'open');
                        setLocked(project.locked || false);
                      }}
                      className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
                    >
                      Resetar
                    </button>
                    <button
                      onClick={handleSaveSettings}
                      disabled={savingSettings || (status === project.status && locked === (project.locked || false))}
                      className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-400 rounded-xl text-white font-bold text-xs transition-all cursor-pointer"
                    >
                      {savingSettings ? 'Salvando...' : 'Salvar Configurações'}
                    </button>
                  </div>
                </div>

              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
}
