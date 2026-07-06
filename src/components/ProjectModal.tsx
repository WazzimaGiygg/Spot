import React, { useState, useEffect } from 'react';
import { X, Code2, Sparkles, AlertCircle } from 'lucide-react';

interface ProjectModalProps {
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    type: string;
    description: string;
    code: string;
    status: 'open' | 'closed';
  }) => void;
}

const PRESETS: Record<string, string> = {
  'HTML/CSS': `<div style="background: linear-gradient(135deg, #1e1b4b, #311042); color: white; padding: 40px; border-radius: 12px; text-align: center; font-family: sans-serif; box-shadow: 0 10px 25px rgba(0,0,0,0.3);">
  <h1 style="color: #a78bfa; margin-bottom: 12px; font-size: 32px;">Olá do SkyHTML!</h1>
  <p style="color: #cbd5e1; font-size: 16px; max-width: 400px; margin: 0 auto; line-height: 1.6;">Este é um projeto em tempo real que você pode editar e colaborar diretamente pelo navegador.</p>
  <div style="margin-top: 25px;">
    <span style="background: rgba(255,255,255,0.1); padding: 6px 12px; border-radius: 20px; font-size: 13px; color: #e2e8f0; border: 1px solid rgba(255,255,255,0.15);">HTML5 & CSS3</span>
  </div>
</div>`,

  'JavaScript': `<div style="padding: 30px; text-align: center; font-family: system-ui, sans-serif; background: #0f172a; color: white; border-radius: 16px; max-width: 400px; margin: 20px auto; border: 1px solid #1e293b;">
  <h1 style="color: #f59e0b; margin-bottom: 8px;">Contador Dinâmico</h1>
  <p style="color: #94a3b8; font-size: 14px; margin-bottom: 20px;">Clique no botão abaixo para disparar funções dinâmicas.</p>
  
  <button id="counter-btn" style="background: linear-gradient(135deg, #f59e0b, #d97706); color: white; border: none; padding: 12px 24px; border-radius: 10px; font-weight: bold; cursor: pointer; transition: transform 0.1s;">
    Incrementar
  </button>
  
  <p style="margin-top: 20px; font-size: 15px;">Cliques: <strong id="score" style="color: #f59e0b; font-size: 20px;">0</strong></p>
</div>

<script>
  let clicks = 0;
  const btn = document.getElementById('counter-btn');
  const score = document.getElementById('score');
  
  btn.addEventListener('click', () => {
    clicks++;
    score.textContent = clicks;
    
    // Pequena animação de clique
    btn.style.transform = 'scale(0.95)';
    setTimeout(() => {
      btn.style.transform = 'scale(1)';
    }, 100);
  });
</script>`,

  'React': `<div id="root"></div>

<!-- Dependências de React, ReactDOM e Babel compilador via CDN -->
<script src="https://unpkg.com/react@18/umd/react.development.js" crossorigin></script>
<script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js" crossorigin></script>
<script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>

<script type="text/babel">
  function LoveSkyHTML() {
    const [likes, setLikes] = React.useState(0);
    const [theme, setTheme] = React.useState('#6366f1');

    const toggleTheme = () => {
      const colors = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#a855f7'];
      const nextColor = colors[Math.floor(Math.random() * colors.length)];
      setTheme(nextColor);
    };

    return (
      <div style={{
        padding: '35px',
        fontFamily: 'system-ui, sans-serif',
        textAlign: 'center',
        background: '#090d16',
        color: 'white',
        borderRadius: '16px',
        maxWidth: '420px',
        margin: '20px auto',
        border: '1px solid #1e293b'
      }}>
        <h2 style={{ color: theme, transition: 'color 0.3s' }}>Interativo em React! ⚛️</h2>
        <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '20px' }}>
          Este código está sendo interpretado em tempo real usando o compilador Babel Standalone.
        </p>
        
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <button 
            onClick={() => setLikes(likes + 1)}
            style={{
              background: theme,
              color: 'white',
              border: 'none',
              padding: '10px 18px',
              borderRadius: '8px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'background 0.3s'
            }}
          >
            Curtir ({likes})
          </button>
          
          <button 
            onClick={toggleTheme}
            style={{
              background: 'transparent',
              color: '#cbd5e1',
              border: '1px solid #334155',
              padding: '10px 18px',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            Mudar Cor
          </button>
        </div>
      </div>
    );
  }

  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(<LoveSkyHTML />);
</script>`
};

export default function ProjectModal({ onClose, onSubmit }: ProjectModalProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState('HTML/CSS');
  const [description, setDescription] = useState('');
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<'open' | 'closed'>('open');
  const [errorMsg, setErrorMsg] = useState('');

  // Automatically load template preset when changing project type
  useEffect(() => {
    if (PRESETS[type]) {
      setCode(PRESETS[type]);
    } else {
      setCode(`<!-- Novo projeto ${type} -->\n<div>Comece a programar aqui...</div>`);
    }
  }, [type]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('O nome do projeto é obrigatório.');
      return;
    }
    if (!code.trim()) {
      setErrorMsg('O código fonte é obrigatório.');
      return;
    }
    setErrorMsg('');
    onSubmit({
      name: name.trim(),
      type,
      description: description.trim(),
      code,
      status,
    });
  };

  const loadPreset = (presetName: string) => {
    if (PRESETS[presetName]) {
      setCode(PRESETS[presetName]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5 text-indigo-650">
            <Code2 className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-slate-800">Criar Novo Projeto</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          
          {errorMsg && (
            <div className="bg-rose-50 border border-rose-100 text-rose-700 rounded-xl p-3.5 flex items-center gap-2.5 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Project Name */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">
                Nome do Projeto *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Meu Playground Incrível"
                className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl py-2 px-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all"
              />
            </div>

            {/* Code Type */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">
                Tipo de Código *
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl py-2 px-3 text-sm text-slate-800 focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all cursor-pointer"
              >
                <option value="HTML/CSS">HTML/CSS</option>
                <option value="JavaScript">JavaScript (ES6+)</option>
                <option value="React">React (Babel Babel)</option>
                <option value="Vue">Vue</option>
                <option value="Angular">Angular</option>
                <option value="Biblioteca">Biblioteca</option>
                <option value="Framework">Framework</option>
                <option value="Componente">Componente</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">
              Descrição do Projeto
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva o propósito, as tecnologias aplicadas ou o funcionamento do seu código..."
              rows={2}
              className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl py-2 px-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all resize-none"
            />
          </div>

          {/* Code Editor Header */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">
                Código Fonte *
              </label>
              {PRESETS[type] && (
                <button
                  type="button"
                  onClick={() => loadPreset(type)}
                  className="flex items-center gap-1 text-[10px] font-bold text-indigo-600 hover:text-indigo-700 border border-indigo-100 bg-indigo-50 px-2 py-0.5 rounded-md cursor-pointer"
                >
                  <Sparkles className="w-3 h-3" />
                  Resetar para Modelo
                </button>
              )}
            </div>

            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              rows={10}
              placeholder="Digite ou cole seu código HTML, CSS, JavaScript ou scripts aqui..."
              className="w-full bg-slate-900 border border-slate-850 focus:border-indigo-500 rounded-xl p-3 text-xs text-slate-100 font-mono focus:outline-none focus:ring-4 focus:ring-indigo-950 transition-all resize-y"
            />
          </div>

          {/* Collaboration settings */}
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">
              Permissões de Colaboração
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer select-none transition-all ${
                status === 'open' 
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-900' 
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
              }`}>
                <input
                  type="radio"
                  name="modal-collab-status"
                  checked={status === 'open'}
                  onChange={() => setStatus('open')}
                  className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500 bg-slate-50 accent-indigo-600"
                />
                <div>
                  <div className="text-xs font-bold">🤝 Colaboração Aberta</div>
                  <div className="text-[10px] text-slate-500 opacity-90 mt-0.5">Outros desenvolvedores podem sugerir alterações no código</div>
                </div>
              </label>

              <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer select-none transition-all ${
                status === 'closed' 
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-900' 
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
              }`}>
                <input
                  type="radio"
                  name="modal-collab-status"
                  checked={status === 'closed'}
                  onChange={() => setStatus('closed')}
                  className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500 bg-slate-50 accent-indigo-600"
                />
                <div>
                  <div className="text-xs font-bold">🔒 Somente Leitura</div>
                  <div className="text-[10px] text-slate-500 opacity-90 mt-0.5">Apenas você poderá editar. Outros só poderão ler o código</div>
                </div>
              </label>
            </div>
          </div>
        </form>

        {/* Modal Actions */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-3 rounded-b-2xl">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 font-semibold text-xs transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          
          <button
            onClick={handleSubmit}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-all cursor-pointer"
          >
            Publicar Projeto
          </button>
        </div>

      </div>
    </div>
  );
}
