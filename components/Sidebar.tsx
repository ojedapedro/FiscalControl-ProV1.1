
import React, { useState, useEffect } from 'react';
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
  X
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
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  currentView, 
  setCurrentView, 
  currentRole, 
  onLogout,
  isMobileOpen,
  closeMobileMenu,
  installPrompt,
  onInstallClick
}) => {
  const { theme, toggleTheme } = useTheme();
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [APP_LOGO_URL]);
  
  const navItems = [
    { id: 'payments', label: 'Pagos', icon: FileText, roles: [Role.ADMIN, Role.SUPER_ADMIN] },
    { id: 'notifications', label: 'Notificaciones', icon: BellRing, roles: [Role.ADMIN, Role.AUDITOR, Role.PRESIDENT, Role.SUPER_ADMIN] },
    { id: 'approvals', label: 'Aprobaciones', icon: CheckSquare, roles: [Role.AUDITOR, Role.SUPER_ADMIN] },
    { id: 'network', label: 'Estado de Red', icon: Building2, roles: [Role.ADMIN, Role.PRESIDENT, Role.SUPER_ADMIN] },
    { id: 'calendar', label: 'Calendario Fiscal', icon: Calendar, roles: [Role.ADMIN, Role.AUDITOR, Role.SUPER_ADMIN] },
    { id: 'reports', label: 'Reportes', icon: PieChart, roles: [Role.PRESIDENT, Role.SUPER_ADMIN] },
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
        w-64 bg-slate-900 text-white border-r border-slate-800
        flex flex-col transition-transform duration-300 ease-in-out
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        
        {/* Header Logo */}
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/20 bg-white/5 overflow-hidden border border-white/10">
              {!imgError ? (
                <img 
                  src={APP_LOGO_URL} 
                  alt="FiscalCtl Logo" 
                  className="w-full h-full object-cover" 
                  onError={() => setImgError(true)}
                />
              ) : (
                <Building2 className="text-blue-500 w-6 h-6" />
              )}
            </div>
            <span className="font-bold text-xl tracking-tight text-white">FiscalCtl</span>
          </div>
          {/* Botón Cerrar solo en móvil */}
          <button onClick={closeMobileMenu} className="lg:hidden text-slate-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-2 space-y-2 overflow-y-auto custom-scrollbar">
          {filteredItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentView(item.id);
                  closeMobileMenu();
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon size={20} />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 space-y-3 bg-slate-900">
          
          {/* Install PWA Button (Visible only if installable) */}
          {installPrompt && (
            <button 
              onClick={onInstallClick}
              className="w-full flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl text-white font-bold shadow-lg shadow-blue-900/20 hover:scale-[1.02] transition-transform animate-pulse"
            >
              <Download size={20} />
              <span className="font-medium">Instalar App</span>
            </button>
          )}

          {/* Theme Toggle */}
          <button 
            onClick={toggleTheme}
            className="w-full flex items-center justify-between px-4 py-3 bg-slate-800 rounded-xl text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
          >
             <div className="flex items-center gap-3">
               {theme === 'dark' ? <Moon size={20} className="text-blue-400" /> : <Sun size={20} className="text-yellow-400" />}
               <span className="font-medium text-sm">Tema: {theme === 'dark' ? 'Oscuro' : 'Claro'}</span>
             </div>
          </button>

          <div className="px-2">
            <div className="flex items-center justify-between">
              <label className="text-xs text-slate-500 uppercase font-semibold">Rol Actual</label>
              <div className="text-xs text-slate-300 font-mono bg-slate-950 px-2 py-1 rounded truncate max-w-[100px]" title={currentRole}>
                {currentRole}
              </div>
            </div>
          </div>
          
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium">Cerrar Sesión</span>
          </button>
        </div>
      </div>
    </>
  );
};
