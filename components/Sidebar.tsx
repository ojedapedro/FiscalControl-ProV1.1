
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
  Users
} from 'lucide-react';
import { Role } from '../types';
import { useTheme } from './ThemeContext';
import { APP_LOGO_URL } from '../constants';

interface SidebarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  currentRole: Role;
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
    { id: 'calendar', label: 'Calendario Fiscal', icon: Calendar, roles: [Role.ADMIN, Role.AUDITOR, Role.SUPER_ADMIN] },
    { id: 'payroll', label: 'Nómina', icon: Users, roles: [Role.ADMIN, Role.SUPER_ADMIN, Role.PRESIDENT] },
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
        w-64 bg-slate-950/80 backdrop-blur-3xl text-white border-r border-white/5
        flex flex-col transition-transform duration-300 ease-in-out shadow-[4px_0_24px_rgba(0,0,0,0.2)]
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        
        {/* Header Logo */}
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xl shadow-brand-500/20 bg-white/5 overflow-hidden border border-white/10">
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
              <span className="font-bold text-lg tracking-tight text-white leading-none">FiscalCtl</span>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Enterprise</span>
            </div>
          </div>
          {/* Botón Cerrar solo en móvil */}
          <button onClick={closeMobileMenu} className="lg:hidden text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
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
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden ${
                  isActive 
                    ? 'bg-gradient-to-r from-brand-600/90 to-indigo-600/90 text-white shadow-lg shadow-brand-500/20 ring-1 ring-white/20' 
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <div className={`absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-transparent translate-x-[-100%] transition-transform duration-700 ${isActive ? 'group-hover:translate-x-[100%]' : ''}`} />
                <Icon size={18} className={`relative z-10 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-brand-400 transition-colors'}`} />
                <span className="font-medium text-sm relative z-10">{item.label}</span>
                {isActive && <div className="ml-auto relative z-10 w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,1)] animate-pulse" />}
              </button>
            );
          })}
        </nav>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-900 space-y-3 bg-slate-950/50 backdrop-blur-sm">
          
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
            className="w-full flex items-center justify-between px-4 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-slate-300 hover:text-white transition-all border border-white/5 shadow-inner shadow-black/20"
          >
             <div className="flex items-center gap-3">
               {theme === 'dark' ? <Moon size={18} className="text-brand-400" /> : <Sun size={18} className="text-yellow-400" />}
               <span className="font-medium text-xs tracking-wide">TEMA: {theme === 'dark' ? 'OSCURO' : 'CLARO'}</span>
             </div>
          </button>

          <div className="px-4 py-2 bg-slate-900/50 rounded-xl border border-slate-800/50">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-slate-500 uppercase font-black tracking-widest">Rol</span>
              <div className="text-[10px] text-brand-400 font-mono bg-brand-500/10 px-2 py-0.5 rounded-full border border-brand-500/20 truncate max-w-[100px]" title={currentRole}>
                {currentRole}
              </div>
            </div>
          </div>
          
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-red-400 hover:bg-red-500/10 rounded-xl transition-all group"
          >
            <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium text-sm">Cerrar Sesión</span>
          </button>
        </div>
      </div>
    </>
  );
};
