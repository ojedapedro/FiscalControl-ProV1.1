
import React from 'react';
import { 
  FileText, 
  CheckSquare, 
  PieChart, 
  Calendar, 
  Settings, 
  LogOut,
  Building2,
  BellRing
} from 'lucide-react';
import { Role } from '../types';

interface SidebarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  currentRole: Role;
  onChangeRole: (role: Role) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView, currentRole, onChangeRole }) => {
  
  const navItems = [
    // Dashboard eliminado para simplificar navegación
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
    <div className="h-screen w-20 lg:w-64 bg-slate-900 text-white flex flex-col fixed left-0 top-0 z-50 transition-all duration-300">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center shrink-0">
          <span className="font-bold text-xl">F</span>
        </div>
        <span className="font-bold text-xl hidden lg:block tracking-tight">FiscalCtl</span>
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

      <div className="p-4 border-t border-slate-800">
        <div className="mb-4 px-2">
          <label className="text-xs text-slate-500 uppercase font-semibold mb-2 block hidden lg:block">Vista de Rol Actual</label>
          <select 
            value={currentRole}
            onChange={(e) => onChangeRole(e.target.value as Role)}
            className="w-full bg-slate-800 text-slate-300 text-xs rounded-lg p-2 border border-slate-700 outline-none focus:border-blue-500"
          >
            {Object.values(Role).map((role) => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
        </div>
        <button className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors">
          <LogOut size={20} />
          <span className="hidden lg:block font-medium">Cerrar Sesión</span>
        </button>
      </div>
    </div>
  );
};
