import React from 'react';
import { Project } from '../types';
import { Eye, Users, Calendar, ArrowRight, Lock, Code2, Settings } from 'lucide-react';

interface ProjectCardProps {
  key?: any;
  project: Project;
  currentUser: any;
  onViewClick: (id: string) => void | Promise<void>;
  onManageClick: (id: string, e: any) => void;
}

export default function ProjectCard({
  project,
  currentUser,
  onViewClick,
  onManageClick,
}: ProjectCardProps) {
  const isAuthor = currentUser && project.authorId === currentUser.uid && !currentUser.isGuest;
  const isLocked = project.locked === true;
  const canView = !isLocked || isAuthor;

  // Render badge details dynamically
  const getBadgeStyles = () => {
    if (isLocked) {
      return {
        bg: 'bg-rose-50 text-rose-700 border-rose-200',
        label: '🔒 Trancado',
      };
    }
    if (project.status === 'open') {
      return {
        bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        label: '🤝 Collab Aberta',
      };
    }
    return {
      bg: 'bg-slate-50 text-slate-700 border-slate-200',
      label: '🔒 Apenas Autor',
    };
  };

  const badge = getBadgeStyles();

  // Highlight specific project types
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'React': return 'text-sky-700 bg-sky-50 border-sky-100';
      case 'JavaScript': return 'text-amber-700 bg-amber-50 border-amber-100';
      case 'HTML/CSS': return 'text-orange-700 bg-orange-50 border-orange-100';
      case 'Vue': return 'text-emerald-700 bg-emerald-50 border-emerald-100';
      case 'Angular': return 'text-rose-700 bg-rose-50 border-rose-100';
      default: return 'text-indigo-700 bg-indigo-50 border-indigo-100';
    }
  };

  const formatCardDate = (dateVal: any) => {
    if (!dateVal) return 'Data indefinida';
    let dateObj: Date;
    if (typeof dateVal.toDate === 'function') {
      dateObj = dateVal.toDate();
    } else if (dateVal instanceof Date) {
      dateObj = dateVal;
    } else {
      dateObj = new Date(dateVal);
    }
    return dateObj.toLocaleDateString('pt-BR');
  };

  return (
    <div 
      onClick={() => canView && onViewClick(project.id)}
      className={`group bg-white border border-slate-200 hover:border-indigo-500 rounded-2xl p-5 shadow-sm transition-all duration-300 flex flex-col justify-between select-none relative overflow-hidden ${
        canView 
          ? 'cursor-pointer hover:-translate-y-1 hover:shadow-md' 
          : 'opacity-65 cursor-not-allowed'
      }`}
    >
      {/* Decorative gradient aura */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-2xl group-hover:bg-indigo-100/50 transition-colors pointer-events-none" />

      {/* Card Header */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-2.5">
          <h4 className="text-base font-bold text-slate-800 group-hover:text-indigo-600 transition-colors tracking-tight line-clamp-1">
            {project.name}
          </h4>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 uppercase tracking-wide ${badge.bg}`}>
            {badge.label}
          </span>
        </div>

        {/* Category Label */}
        <div className="flex items-center gap-1 text-[11px] font-bold mb-3">
          <span className={`px-2 py-0.5 rounded-md border ${getTypeColor(project.type)}`}>
            {project.type}
          </span>
        </div>

        {/* Project Description */}
        <p className="text-xs text-slate-500 leading-relaxed mb-4 line-clamp-2">
          {project.description || 'Nenhuma descrição adicionada para este projeto.'}
        </p>
      </div>

      {/* Card Metadata Footer */}
      <div>
        <div className="grid grid-cols-2 gap-y-2 gap-x-1.5 text-[10px] text-slate-500 border-t border-slate-100 pt-3 mb-4">
          <div className="flex items-center gap-1 text-slate-600">
            <span className="font-semibold text-slate-400">Autor:</span>
            <span className="truncate max-w-[80px]">{project.authorName || 'Anônimo'}</span>
          </div>
          <div className="flex items-center gap-1 text-slate-600 justify-end">
            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>{formatCardDate(project.createdAt)}</span>
          </div>
          <div className="flex items-center gap-1 text-slate-600">
            <Eye className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>{project.views || 0} visualizações</span>
          </div>
          {project.collaborators && project.collaborators.length > 0 && (
            <div className="flex items-center gap-1 text-slate-600 justify-end">
              <Users className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <span>{project.collaborators.length} colaboradores</span>
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-between gap-2">
          {canView ? (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onViewClick(project.id);
              }}
              className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 cursor-pointer"
            >
              <span>Visualizar</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </button>
          ) : (
            <div className="flex items-center gap-1 text-xs text-rose-600 font-bold">
              <Lock className="w-3.5 h-3.5" />
              <span>Acesso Restrito</span>
            </div>
          )}

          {isAuthor && (
            <button
              onClick={(e) => onManageClick(project.id, e)}
              className="p-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 hover:text-indigo-600 text-slate-500 transition-all cursor-pointer"
              title="Configurações do Projeto"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
