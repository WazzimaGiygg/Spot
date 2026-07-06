import { Filter, BarChart3, Radio, FileType2, Users } from 'lucide-react';

interface SidebarProps {
  totalProjects: number;
  collabProjects: number;
  selectedType: string;
  onTypeChange: (type: string) => void;
  selectedStatus: string;
  onStatusChange: (status: string) => void;
  showMine: boolean;
  onShowMineChange: (val: boolean) => void;
  currentUser: any;
}

export default function Sidebar({
  totalProjects,
  collabProjects,
  selectedType,
  onTypeChange,
  selectedStatus,
  onStatusChange,
  showMine,
  onShowMineChange,
  currentUser,
}: SidebarProps) {
  const codeTypes = [
    'HTML/CSS',
    'JavaScript',
    'React',
    'Vue',
    'Angular',
    'Biblioteca',
    'Framework',
    'Componente',
  ];

  return (
    <aside className="w-full lg:w-72 flex flex-col gap-5 shrink-0">
      {/* Filters Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-2 text-indigo-600 font-bold mb-4 pb-3 border-b border-slate-100">
          <Filter className="w-4 h-4" />
          <h3 className="text-sm uppercase tracking-wider text-slate-800">Filtros de Pesquisa</h3>
        </div>

        {/* Filter by Type */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">
            Tipo de Projeto
          </label>
          <div className="relative">
            <select
              value={selectedType}
              onChange={(e) => onTypeChange(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl py-2 px-3 text-sm text-slate-800 focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all cursor-pointer"
            >
              <option value="">Todos os tipos</option>
              {codeTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Filter by Status */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">
            Permissões / Collab
          </label>
          <select
            value={selectedStatus}
            onChange={(e) => onStatusChange(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl py-2 px-3 text-sm text-slate-800 focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all cursor-pointer"
          >
            <option value="">Todos os status</option>
            <option value="open">🤝 Aberto para Collab</option>
            <option value="closed">🔒 Fechado (Apenas autor)</option>
            <option value="locked">🔒 Trancado / Bloqueado</option>
          </select>
        </div>

        {/* Toggle User Projects */}
        {currentUser && !currentUser.isGuest && (
          <div className="mt-4 pt-3 border-t border-slate-100">
            <label className="flex items-center gap-2.5 cursor-pointer group">
              <input
                type="checkbox"
                checked={showMine}
                onChange={(e) => onShowMineChange(e.target.checked)}
                className="w-4 h-4 rounded border-slate-200 text-indigo-600 focus:ring-indigo-100 bg-slate-50 accent-indigo-600"
              />
              <span className="text-sm font-medium text-slate-600 group-hover:text-slate-800 select-none transition-colors">
                Mostrar apenas os meus
              </span>
            </label>
          </div>
        )}
      </div>

      {/* Statistics Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-2 text-indigo-600 font-bold mb-5 pb-3 border-b border-slate-100">
          <BarChart3 className="w-4 h-4" />
          <h3 className="text-sm uppercase tracking-wider text-slate-800">Estatísticas</h3>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
          {/* Stat Item 1 */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">
              <FileType2 className="w-3.5 h-3.5 text-indigo-500" />
              <span>Total de Projetos</span>
            </div>
            <div className="text-2xl font-black text-slate-800">{totalProjects}</div>
            <p className="text-[10px] text-slate-400 font-medium">Na comunidade</p>
          </div>

          {/* Stat Item 2 */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">
              <Users className="w-3.5 h-3.5 text-indigo-500" />
              <span>Collab Aberta</span>
            </div>
            <div className="text-2xl font-black text-slate-800">{collabProjects}</div>
            <p className="text-[10px] text-slate-400 font-medium">Buscando parceiros</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
