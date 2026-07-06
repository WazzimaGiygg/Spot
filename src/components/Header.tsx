import React, { useState, useRef, useEffect } from 'react';
import { Code2, Search, Plus, LogIn, LogOut, FolderHeart, User, ChevronDown, Monitor } from 'lucide-react';

interface HeaderProps {
  currentUser: any;
  onLoginClick: () => void;
  onGuestLogin: () => void;
  onLogout: () => void;
  onNewProjectClick: () => void;
  onSearch: (term: string) => void;
  onMyProjectsClick: () => void;
}

export default function Header({
  currentUser,
  onLoginClick,
  onGuestLogin,
  onLogout,
  onNewProjectClick,
  onSearch,
  onMyProjectsClick,
}: HeaderProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchVal, setSearchVal] = useState('');
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Close dropdown on clicking outside
  useEffect(() => {
    const clickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', clickOutside);
    return () => document.removeEventListener('mousedown', clickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchVal);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchVal(e.target.value);
    onSearch(e.target.value);
  };

  const userDisplayName = currentUser?.displayName || currentUser?.name || (currentUser?.email ? currentUser.email.split('@')[0] : 'Usuário');

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 py-3.5">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Brand Logo */}
        <div 
          onClick={() => window.location.reload()} 
          className="flex items-center gap-3 cursor-pointer group shrink-0"
        >
          <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-xl group-hover:scale-105 transition-all">
            <Code2 className="w-6 h-6 text-indigo-600 group-hover:text-indigo-700 transition-colors" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">
              SkyHTML
            </h1>
            <p className="text-[10px] text-slate-400 font-bold tracking-wider uppercase">
              Comunidade de Código Aberto
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md w-full">
          <input
            type="text"
            value={searchVal}
            onChange={handleSearchChange}
            placeholder="Buscar projetos por nome, autor ou tag..."
            className="w-full bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-xl py-2 px-4 pl-10 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all duration-200"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        </form>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 self-end md:self-auto">
          <button
            onClick={onNewProjectClick}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm px-4 py-2 rounded-xl shadow-sm hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer"
          >
            <Plus className="w-4.5 h-4.5" />
            <span>Novo Projeto</span>
          </button>

          {/* User Account Menu */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-full pl-2 pr-3.5 py-1.5 transition-all text-slate-700 cursor-pointer"
            >
              {currentUser?.profilePictureUrl ? (
                <img 
                  src={currentUser.profilePictureUrl} 
                  alt={userDisplayName} 
                  className="w-6 h-6 rounded-full object-cover border border-indigo-200"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-black text-white">
                  {currentUser ? userDisplayName.charAt(0).toUpperCase() : <User className="w-3.5 h-3.5" />}
                </div>
              )}
              <span className="text-xs font-semibold max-w-[90px] truncate">
                {currentUser ? userDisplayName : 'Minha Conta'}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-2.5 w-52 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-50 animate-in fade-in slide-in-from-top-3 duration-150">
                {!currentUser ? (
                  <>
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        onLoginClick();
                      }}
                      className="w-full px-4 py-2 text-left text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <LogIn className="w-4 h-4 text-indigo-500" />
                      Entrar com Google
                    </button>
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        onGuestLogin();
                      }}
                      className="w-full px-4 py-2 text-left text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <User className="w-4 h-4 text-emerald-500" />
                      Modo Convidado
                    </button>
                  </>
                ) : (
                  <>
                    {!currentUser.isGuest && (
                      <button
                        onClick={() => {
                          setDropdownOpen(false);
                          onMyProjectsClick();
                        }}
                        className="w-full px-4 py-2 text-left text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                      >
                        <FolderHeart className="w-4 h-4 text-indigo-500" />
                        Meus Projetos
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        onLogout();
                      }}
                      className="w-full px-4 py-2 text-left text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 flex items-center gap-2.5 border-t border-slate-100 mt-1 pt-2 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 text-rose-500" />
                      Sair
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
