
import React, { useState } from 'react';
import { User } from '../types';
import { authService } from '../services/auth';
import { 
  Loader2, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  CheckCircle2, 
  TrendingUp, 
  BarChart3,
  ShieldCheck
} from 'lucide-react';
import { APP_LOGO_URL } from '../constants';

interface LoginProps {
  onLoginSuccess: (user: User) => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [isRecovering, setIsRecovering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Datos para autocompletar demo
  const fillCredentials = (roleEmail: string, rolePass: string) => {
    setEmail(roleEmail);
    setPassword(rolePass);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setIsLoading(true);

    try {
      if (isRecovering) {
        if (!email) throw new Error('Por favor ingrese su correo.');
        const msg = await authService.recoverPassword(email);
        setSuccessMsg(msg);
        setTimeout(() => {
          setIsRecovering(false);
          setSuccessMsg(null);
        }, 3000);
      } else {
        if (!email || !password) throw new Error('Credenciales incompletas.');
        const user = await authService.login(email, password);
        onLoginSuccess(user);
      }
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error inesperado.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4 lg:p-0 overflow-hidden font-sans">
      <div className="w-full max-w-7xl h-full lg:h-[85vh] bg-[#1e293b] rounded-3xl shadow-2xl overflow-hidden flex flex-col lg:flex-row border border-slate-700/50">
        
        {/* Left Side: Visuals & 3D Illustration */}
        <div className="hidden lg:flex w-1/2 relative bg-gradient-to-br from-indigo-900 via-[#0f172a] to-slate-900 items-center justify-center overflow-hidden">
            
            {/* Background Effects */}
            <div className="absolute top-[-20%] left-[-20%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[100px]"></div>
            <div className="absolute bottom-[-20%] right-[-20%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[100px]"></div>

            {/* Floating Elements Container */}
            <div className="relative z-10 w-[400px] h-[500px]">
                
                {/* Main 3D Character Illustration */}
                <img 
                    src="https://img.freepik.com/free-psd/3d-illustration-person-with-sunglasses_23-2149436188.jpg?w=740&t=st=1708450000~exp=1708450600~hmac=a1b2c3d4" 
                    alt="3D Character" 
                    className="w-full h-full object-contain drop-shadow-2xl animate-in fade-in zoom-in duration-700"
                    style={{ mixBlendMode: 'normal' }} // Fallback image if user provided url fails or for generic use
                />
                
                {/* Floating Card: Profit */}
                <div className="absolute top-10 -left-12 bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl shadow-xl w-40 animate-bounce" style={{ animationDuration: '3s' }}>
                    <div className="flex justify-between items-start mb-2">
                        <div className="text-xs text-slate-300">Presupuesto</div>
                        <span className="text-[10px] bg-green-500/20 text-green-300 px-1.5 py-0.5 rounded">+12%</span>
                    </div>
                    <div className="text-2xl font-bold text-white mb-1">$624k</div>
                    <div className="h-1 w-full bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full w-3/4 bg-green-400"></div>
                    </div>
                </div>

                {/* Floating Card: Orders */}
                <div className="absolute bottom-20 -right-8 bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl shadow-xl w-44 animate-bounce" style={{ animationDuration: '4s', animationDelay: '1s' }}>
                     <div className="flex justify-between items-start mb-2">
                        <div className="text-xs text-slate-300">Pagos Auditados</div>
                        <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded">Esta semana</span>
                    </div>
                    <div className="flex items-end gap-2 h-10 mt-2">
                         <div className="w-1/5 bg-indigo-500/50 h-[40%] rounded-t-sm"></div>
                         <div className="w-1/5 bg-indigo-500/70 h-[70%] rounded-t-sm"></div>
                         <div className="w-1/5 bg-indigo-500 h-[100%] rounded-t-sm shadow-[0_0_15px_rgba(99,102,241,0.5)]"></div>
                         <div className="w-1/5 bg-indigo-500/60 h-[50%] rounded-t-sm"></div>
                         <div className="w-1/5 bg-indigo-500/40 h-[30%] rounded-t-sm"></div>
                    </div>
                    <div className="mt-3 flex items-center gap-2 text-[10px] text-slate-300 bg-black/20 p-2 rounded-lg">
                        <CheckCircle2 size={12} className="text-green-400" />
                        <span>Todo en regla</span>
                    </div>
                </div>
            </div>
            
            {/* Circle Decoration */}
            <div className="absolute z-0 w-[400px] h-[400px] border border-white/5 rounded-full flex items-center justify-center">
                <div className="w-[300px] h-[300px] border border-white/5 rounded-full"></div>
            </div>

        </div>

        {/* Right Side: Form */}
        <div className="w-full lg:w-1/2 p-8 lg:p-16 flex flex-col justify-center bg-[#1e293b] relative">
            
            {/* Logo */}
            <div className="flex items-center gap-3 mb-10">
                <img src={APP_LOGO_URL} alt="Logo" className="w-10 h-10 rounded-full shadow-lg" />
                <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">FiscalCtl</span>
            </div>

            <div className="max-w-md w-full mx-auto">
                <h2 className="text-3xl font-bold text-white mb-2">
                    {isRecovering ? 'Recuperar Cuenta' : 'Bienvenido de nuevo'}
                </h2>
                <p className="text-slate-400 mb-8">
                    {isRecovering 
                        ? 'Ingrese su correo para recibir instrucciones.' 
                        : 'Ingrese sus credenciales para acceder al panel.'}
                </p>

                <form onSubmit={handleSubmit} className="space-y-5">
                    
                    {/* Email Input */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300 ml-1">Correo Electrónico</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Mail className="h-5 w-5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                            </div>
                            <input 
                                type="email" 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-[#0f172a] border border-slate-700 text-white text-sm rounded-xl block w-full pl-12 p-4 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all" 
                                placeholder="usuario@fiscal.com"
                                required
                            />
                        </div>
                    </div>

                    {/* Password Input (Hidden if recovering) */}
                    {!isRecovering && (
                        <div className="space-y-2">
                            <div className="flex justify-between items-center ml-1">
                                <label className="text-sm font-medium text-slate-300">Contraseña</label>
                            </div>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                                </div>
                                <input 
                                    type={showPassword ? "text" : "password"} 
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-[#0f172a] border border-slate-700 text-white text-sm rounded-xl block w-full pl-12 pr-12 p-4 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all" 
                                    placeholder="••••••••"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-slate-300"
                                >
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Forgot Password Link */}
                    {!isRecovering && (
                        <div className="flex justify-end">
                            <button 
                                type="button" 
                                onClick={() => { setIsRecovering(true); setError(null); }}
                                className="text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
                            >
                                ¿Olvidó su contraseña?
                            </button>
                        </div>
                    )}

                    {/* Feedback Messages */}
                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2 text-red-400 text-sm animate-in fade-in">
                            <ShieldCheck size={16} />
                            {error}
                        </div>
                    )}
                    {successMsg && (
                        <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-2 text-green-400 text-sm animate-in fade-in">
                            <CheckCircle2 size={16} />
                            {successMsg}
                        </div>
                    )}

                    {/* Submit Button */}
                    <button 
                        type="submit" 
                        disabled={isLoading}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-500/30 transition-all transform active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <Loader2 className="animate-spin" />
                        ) : isRecovering ? (
                            'Enviar Enlace de Recuperación'
                        ) : (
                            <>
                                <span>Iniciar Sesión</span>
                                <ArrowRight size={20} />
                            </>
                        )}
                    </button>
                </form>

                {/* Back to Login (if recovering) */}
                {isRecovering && (
                    <button 
                        onClick={() => { setIsRecovering(false); setError(null); setSuccessMsg(null); }}
                        className="mt-6 w-full text-slate-400 hover:text-white text-sm font-medium transition-colors"
                    >
                        ← Volver al inicio de sesión
                    </button>
                )}
                
                {/* Demo Roles Shortcut (Solo para demostración) */}
                {!isRecovering && (
                    <div className="mt-10 pt-6 border-t border-slate-700">
                        <p className="text-xs text-slate-500 text-center mb-3 uppercase tracking-wider">Accesos Rápidos (Demo)</p>
                        <div className="flex gap-2 justify-center">
                            <button onClick={() => fillCredentials('admin@fiscal.com', 'admin')} className="px-3 py-1 bg-slate-800 hover:bg-slate-700 rounded text-xs text-slate-300 border border-slate-700 transition-colors">Admin</button>
                            <button onClick={() => fillCredentials('auditor@fiscal.com', 'audit')} className="px-3 py-1 bg-slate-800 hover:bg-slate-700 rounded text-xs text-slate-300 border border-slate-700 transition-colors">Auditor</button>
                            <button onClick={() => fillCredentials('ceo@fiscal.com', 'ceo')} className="px-3 py-1 bg-slate-800 hover:bg-slate-700 rounded text-xs text-slate-300 border border-slate-700 transition-colors">Presidente</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};
