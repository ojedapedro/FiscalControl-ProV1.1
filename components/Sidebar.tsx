
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
  ImageOff
} from 'lucide-react';
import { Role } from '../types';
import { useTheme } from './ThemeContext';
import { APP_LOGO_URL } from '../constants';

interface SidebarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  currentRole: Role;
  onChangeRole: (role: Role) => void; // Mantenemos para debug interno si se desea
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView, currentRole, onChangeRole, onLogout }) => {
  const { theme, toggleTheme } = useTheme();
  const [imgError, setImgError] = useState(false);

  // Reiniciar estado de error si la URL cambia (aunque es constante, es buena práctica)
  useEffect(() => {
    setImgError(false);
  }, [APP_LOGO_URL]);
  
  const navItems = [
    { id: 'payments', label: 'Pagos', icon: FileText, roles: [Role.ADMIN] },
    { id: 'notifications', label: 'Notificaciones', icon: BellRing, roles: [Role.ADMIN, Role.AUDITOR, Role.PRESIDENT] },
    { id: 'approvals', label: 'Aprobaciones', icon: CheckSquare, roles: [Role.AUDITOR] },
    { id: 'network', label: 'Estado de Red', icon: Building2, roles: [Role.ADMIN, Role.PRESIDENT] },
    { id: 'calendar', label: 'Calendario Fiscal', icon: Calendar, roles: [Role.ADMIN, Role.AUDITOR] },
    { id: 'reports', label: 'Reportes', icon: PieChart, roles: [Role.PRESIDENT] },
    { id: 'settings', label: 'Configuración', icon: Settings, roles: [Role.ADMIN, Role.AUDITOR, Role.PRESIDENT] },
  ];

  const filteredItems = navItems.filter(item => item.roles.includes(currentRole));

  return (
    <div className="h-screen w-20 lg:w-64 bg-slate-900 text-white flex flex-col fixed left-0 top-0 z-50 transition-all duration-300 border-r border-slate-800">
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/20 bg-white/5 overflow-hidden border border-white/10">
          {!imgError ? (
            <img 
              src={APP_LOGO_URL} 
              alt="FiscalCtl Logo" 
              className="w-full h-full object-cover" 
              onError={(e) => {
                console.error("Error cargando logo:", e);
                setImgError(true);
              }}
            />
          ) : (
            <Building2 className="text-blue-500 w-6 h-6" />
          )}
        </div>
        <span className="font-bold text-xl hidden lg:block tracking-tight text-white">FiscalCtl</span>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2">
        {filteredItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon size={20} />
              <span className="hidden lg:block font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800 space-y-4">
        {/* Theme Toggle */}
        <button 
          onClick={toggleTheme}
          className="w-full flex items-center justify-between px-4 py-3 bg-slate-800 rounded-xl text-slate-300 hover:bg-slate-700 hover:text-white transition-colors group"
        >
           <div className="flex items-center gap-3">
             {theme === 'dark' ? <Moon size={20} className="text-blue-400" /> : <Sun size={20} className="text-yellow-400" />}
             <span className="hidden lg:block font-medium text-sm">Tema: {theme === 'dark' ? 'Oscuro' : 'Claro'}</span>
           </div>
        </button>

        <div className="px-2 hidden lg:block opacity-50 hover:opacity-100 transition-opacity">
          <label className="text-xs text-slate-500 uppercase font-semibold mb-2 block">Debug: Rol Actual</label>
          <div className="text-xs text-slate-300 font-mono bg-slate-950 p-2 rounded">{currentRole}</div>
        </div>
        
        <button 
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
        >
          <LogOut size={20} />
          <span className="hidden lg:block font-medium">Cerrar Sesión</span>
        </button>
      </div>
    </div>
  );
};
