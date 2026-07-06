import { X, LogIn, User, HelpCircle } from 'lucide-react';

interface LoginModalProps {
  onClose: () => void;
  onGoogleLogin: () => void;
  onGuestLogin: () => void;
}

export default function LoginModal({
  onClose,
  onGoogleLogin,
  onGuestLogin,
}: LoginModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-sm p-6 shadow-2xl relative animate-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 p-1 rounded-lg hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content */}
        <div className="text-center mt-3">
          <div className="w-12 h-12 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto mb-4">
            <LogIn className="w-6 h-6 text-indigo-600" />
          </div>
          
          <h2 className="text-lg font-bold text-slate-800">Entrar no SkyHTML</h2>
          <p className="text-xs text-slate-500 mt-2 mb-6 leading-relaxed px-2">
            Faça login para criar novos projetos de código, visualizar playgrounds privados ou colaborar com outros desenvolvedores!
          </p>

          <div className="space-y-3">
            {/* Google Authentication */}
            <button
              onClick={onGoogleLogin}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm py-2.5 px-4 rounded-xl shadow-sm hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2.5 cursor-pointer"
            >
              <svg className="w-4 h-4 text-white fill-current" viewBox="0 0 24 24">
                <path d="M12.24 10.285V13.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.859-3.579-7.859-8s3.529-8 7.859-8c2.46 0 4.105 1.025 5.047 1.926l2.427-2.334C17.955 2.192 15.34 1 12.24 1 5.48 1 0 6.48 0 13s5.48 12 12.24 12c7.05 0 11.75-4.96 11.75-11.96 0-.805-.085-1.42-.19-1.755H12.24z"/>
              </svg>
              <span>Entrar com Google</span>
            </button>

            {/* Guest Entry */}
            <button
              onClick={onGuestLogin}
              className="w-full bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold text-sm py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2.5 cursor-pointer"
            >
              <User className="w-4 h-4 text-emerald-600" />
              <span>Acesso Convidado</span>
            </button>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-center gap-1 text-[10px] text-slate-400">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>O modo Convidado permite apenas leitura</span>
          </div>

        </div>

      </div>
    </div>
  );
}
