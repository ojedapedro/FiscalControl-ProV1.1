
import React, { useState, useEffect, FC } from 'react';
import { 
  FileText, 
  CheckSquare, 
  PieChart, 
  Calendar, 
  Settings, 
  LogOut,
  Building2,
  BellRing,
  Sun,
  Moon,
  Download,
  X,
  Users,
  TrendingUp,
  Activity,
  BarChart3
} from 'lucide-react';
import { Role, User } from '../types';
import { useTheme } from './ThemeContext';
import { APP_LOGO_URL } from '../constants';

interface SidebarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  currentRole: Role;
  currentUser?: User | null;
  onChangeRole: (role: Role) => void;
  onLogout: () => void;
  // Nuevas props para manejo móvil y PWA
  isMobileOpen: boolean;
  closeMobileMenu: () => void;
  installPrompt: any; // Evento PWA
  onInstallClick: () => void;
  onPaymentsClick?: () => void;
}

export const Sidebar: FC<SidebarProps> = ({ 
  currentView, 
  setCurrentView, 
  currentRole, 
  currentUser,
  onLogout,
  isMobileOpen,
  closeMobileMenu,
  installPrompt,
  onInstallClick,
  onPaymentsClick
}) => {
  const { theme, toggleTheme } = useTheme();
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [APP_LOGO_URL]);
  
  const navItems = [
    { id: 'payments', label: 'Categoría Fiscal', icon: FileText, roles: [Role.ADMIN, Role.SUPER_ADMIN] },
    { id: 'notifications', label: 'Notificaciones', icon: BellRing, roles: [Role.ADMIN, Role.AUDITOR, Role.PRESIDENT, Role.SUPER_ADMIN] },
    { id: 'approvals', label: 'Aprobaciones', icon: CheckSquare, roles: [Role.AUDITOR, Role.SUPER_ADMIN, Role.PRESIDENT] },
    { id: 'network', label: 'Estado de Red', icon: Building2, roles: [Role.ADMIN, Role.PRESIDENT, Role.SUPER_ADMIN] },
    { id: 'calendar', label: 'Presupuesto Anual', icon: Calendar, roles: [Role.ADMIN, Role.AUDITOR, Role.SUPER_ADMIN, Role.PRESIDENT] },
    { id: 'payroll', label: 'Nómina', icon: Users, roles: [Role.ADMIN, Role.SUPER_ADMIN, Role.PRESIDENT] },
    { id: 'predictive', label: 'Análisis Predictivo', icon: Activity, roles: [Role.SUPER_ADMIN, Role.PRESIDENT, Role.AUDITOR] },
    { id: 'evaluation', label: 'Evaluación', icon: BarChart3, roles: [Role.ADMIN, Role.AUDITOR, Role.SUPER_ADMIN] },
    { id: 'reports', label: 'Reportes', icon: PieChart, roles: [Role.PRESIDENT, Role.SUPER_ADMIN, Role.ADMIN] },
    { id: 'presidency', label: 'Presidencia', icon: PieChart, roles: [Role.PRESIDENT, Role.SUPER_ADMIN] },
    { id: 'settings', label: 'Configuración', icon: Settings, roles: [Role.ADMIN, Role.AUDITOR, Role.PRESIDENT, Role.SUPER_ADMIN] },
  ];

  const filteredItems = navItems.filter(item => item.roles.includes(currentRole));

  return (
    <>
      {/* Backdrop para Móvil */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={closeMobileMenu}
        ></div>
      )}

      {/* Sidebar Container */}
      <div className={`
        fixed top-0 bottom-0 left-0 z-50
        w-64 bg-white dark:bg-slate-950 text-slate-950 dark:text-slate-50 border-r border-slate-200 dark:border-slate-900
        flex flex-col transition-transform duration-300 ease-in-out
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        
        {/* Header Logo & User Profile */}
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xl shadow-brand-500/20 bg-slate-100 dark:bg-white/5 overflow-hidden border border-slate-200 dark:border-white/10">
                {!imgError ? (
                  <img 
                    src={APP_LOGO_URL} 
                    alt="FiscalCtl Logo" 
                    className="w-full h-full object-cover" 
                    onError={() => setImgError(true)}
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <Building2 className="text-brand-500 w-6 h-6" />
                )}
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-lg tracking-tight text-slate-950 dark:text-slate-50 leading-none">FiscalCtl</span>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Enterprise</span>
              </div>
            </div>
            {/* Botón Cerrar solo en móvil */}
            <button 
              onClick={closeMobileMenu} 
              className="lg:hidden p-3 -mr-2 text-slate-500 hover:text-slate-950 dark:hover:text-slate-50 transition-colors active:scale-90"
              aria-label="Cerrar menú"
            >
              <X size={24} />
            </button>
          </div>

          {currentUser && (
            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800/50">
              <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 dark:text-brand-400 font-bold overflow-hidden shrink-0 border border-brand-200 dark:border-brand-800/50">
                {currentUser.avatar ? (
                  <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  currentUser.name?.charAt(0).toUpperCase() || '?'
                )}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-bold text-slate-950 dark:text-slate-50 truncate">{currentUser.name}</span>
                <span className="text-[10px] text-slate-600 dark:text-slate-400 truncate">{currentUser.email}</span>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto no-scrollbar">
          <div className="px-4 mb-4">
            <span className="label-caps">Navegación</span>
          </div>
          {filteredItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentView(item.id);
                  if (item.id === 'payments' && onPaymentsClick) {
                    onPaymentsClick();
                  }
                  closeMobileMenu();
                }}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 group active:scale-[0.98] ${
                  isActive 
                    ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/20' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-950 dark:hover:text-slate-50'
                }`}
              >
                <Icon size={18} className={isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500 group-hover:text-brand-500 dark:group-hover:text-brand-400 transition-colors'} />
                <span className="font-medium text-sm">{item.label}</span>
                {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" />}
              </button>
            );
          })}
        </nav>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-900 space-y-3 bg-slate-50/50 dark:bg-slate-950/50 backdrop-blur-sm">
          
          {/* Install PWA Button (Visible only if installable) */}
          {installPrompt && (
            <button 
              onClick={onInstallClick}
              className="w-full flex items-center gap-3 px-4 py-2.5 bg-gradient-to-r from-brand-600 to-indigo-600 rounded-xl text-white font-bold shadow-lg shadow-brand-600/20 hover:scale-[1.02] active:scale-95 transition-all animate-pulse"
            >
              <Download size={18} />
              <span className="font-medium text-sm">Instalar App</span>
            </button>
          )}

          {/* Theme Toggle */}
          <button 
            onClick={toggleTheme}
            className="w-full flex items-center justify-between px-4 py-3 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-slate-50 transition-all border border-slate-200 dark:border-slate-800/50 active:scale-[0.98]"
          >
             <div className="flex items-center gap-3">
               {theme === 'dark' ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} className="text-slate-600" />}
               <span className="font-medium text-xs">Tema: {theme === 'dark' ? 'Oscuro' : 'Claro'}</span>
             </div>
          </button>

          <div className="px-4 py-3 bg-slate-100/50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800/50">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-slate-500 uppercase font-black tracking-widest">Rol</span>
              <div className="text-[10px] text-brand-600 dark:text-brand-400 font-mono bg-brand-500/10 px-2 py-0.5 rounded-full border border-brand-500/20 truncate max-w-[100px]" title={currentRole}>
                {currentRole}
              </div>
            </div>
          </div>
          
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all group active:scale-[0.98]"
          >
            <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium text-sm">Cerrar Sesión</span>
          </button>
        </div>
      </div>
    </>
  );
};
