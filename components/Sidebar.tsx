
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
import { Role } from '../types';
import { useTheme } from './ThemeContext';
import { APP_LOGO_URL } from '../constants';

interface SidebarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  currentRole: Role;
  onChangeRole: (role: Role) => void;
  onLogout: () => void;
  isMobileOpen: boolean;
  closeMobileMenu: () => void;
  installPrompt: any;
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
    { id: 'payments',    label: 'Categoría Fiscal',              icon: FileText,    roles: [Role.ADMIN, Role.SUPER_ADMIN] },
    { id: 'notifications',label:'Notificaciones',                icon: BellRing,    roles: [Role.ADMIN, Role.AUDITOR, Role.PRESIDENT, Role.SUPER_ADMIN] },
    { id: 'approvals',   label: 'Aprobaciones',                  icon: CheckSquare, roles: [Role.AUDITOR, Role.SUPER_ADMIN, Role.PRESIDENT] },
    { id: 'network',     label: 'Estado de Red',                 icon: Building2,   roles: [Role.ADMIN, Role.PRESIDENT, Role.SUPER_ADMIN] },
    { id: 'calendar',    label: 'Asistente Presupuesto Anual',   icon: Calendar,    roles: [Role.ADMIN, Role.AUDITOR, Role.SUPER_ADMIN, Role.PRESIDENT] },
    { id: 'payroll',     label: 'Nómina',                        icon: Users,       roles: [Role.ADMIN, Role.SUPER_ADMIN, Role.PRESIDENT] },
    { id: 'predictive',  label: 'Análisis Predictivo',           icon: Activity,    roles: [Role.SUPER_ADMIN, Role.PRESIDENT, Role.AUDITOR] },
    { id: 'evaluation',  label: 'Evaluación',                    icon: BarChart3,   roles: [Role.ADMIN, Role.AUDITOR, Role.SUPER_ADMIN] },
    { id: 'reports',     label: 'Reportes',                      icon: PieChart,    roles: [Role.PRESIDENT, Role.SUPER_ADMIN, Role.ADMIN] },
    { id: 'presidency',  label: 'Presidencia',                   icon: PieChart,    roles: [Role.PRESIDENT, Role.SUPER_ADMIN] },
    { id: 'settings',    label: 'Configuración',                 icon: Settings,    roles: [Role.ADMIN, Role.AUDITOR, Role.PRESIDENT, Role.SUPER_ADMIN] },
  ];

  const filteredItems = navItems.filter(item => item.roles.includes(currentRole));

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 40 }}
          className="lg:hidden"
          onClick={closeMobileMenu}
        />
      )}

      {/* ── Sidebar ── */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          bottom: 0,
          left: 0,
          zIndex: 50,
          width: 200,
          background: '#d4d0c8',
          borderRight: '2px solid #404040',
          boxShadow: '2px 0 0 #808080',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'Tahoma, Arial, sans-serif',
          fontSize: '11px',
          transform: isMobileOpen ? 'translateX(0)' : undefined,
          transition: 'transform 0.2s',
        }}
        className={!isMobileOpen ? '-translate-x-full lg:translate-x-0' : ''}
      >

        {/* Title bar */}
        <div className="win-titlebar" style={{ padding: '4px 6px', gap: '6px', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {/* Logo */}
            <div style={{
              width: 16, height: 16,
              background: '#ffffff',
              border: '1px solid #000080',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden',
              flexShrink: 0
            }}>
              {!imgError ? (
                <img
                  src={APP_LOGO_URL}
                  alt="FiscalCtl"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={() => setImgError(true)}
                  referrerPolicy="no-referrer"
                />
              ) : (
                <Building2 size={12} style={{ color: '#000080' }} />
              )}
            </div>
            <span style={{ fontWeight: 'bold', fontSize: '11px', color: '#ffffff' }}>FiscalCtl</span>
          </div>

          {/* Close button (mobile) */}
          <button
            onClick={closeMobileMenu}
            className="lg:hidden"
            style={{
              width: 16, height: 14,
              background: '#d4d0c8',
              border: '1px solid',
              borderColor: '#ffffff #404040 #404040 #ffffff',
              color: '#000000',
              fontSize: '9px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
              fontWeight: 'bold',
              lineHeight: 1
            }}
          >
            ×
          </button>
        </div>

        {/* Menu header */}
        <div style={{
          background: 'linear-gradient(to bottom, #4a86c8, #2060b0)',
          padding: '6px 8px',
          color: '#ffffff',
          fontSize: '11px',
          fontWeight: 'bold',
          borderBottom: '1px solid #0a246a'
        }}>
          Navegación Principal
        </div>

        {/* Nav items */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: '2px 0' }} className="no-scrollbar">
          {filteredItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentView(item.id);
                  if (item.id === 'payments' && onPaymentsClick) onPaymentsClick();
                  closeMobileMenu();
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '5px 8px',
                  background: isActive ? '#316ac5' : 'transparent',
                  color: isActive ? '#ffffff' : '#000000',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontFamily: 'Tahoma, Arial, sans-serif',
                  borderBottom: '1px solid transparent',
                }}
                onMouseEnter={e => { if (!isActive) { (e.currentTarget as HTMLElement).style.background = '#316ac5'; (e.currentTarget as HTMLElement).style.color = '#ffffff'; } }}
                onMouseLeave={e => { if (!isActive) { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#000000'; } }}
              >
                <Icon size={14} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Separator */}
        <div style={{ height: 1, background: '#808080', boxShadow: '0 1px 0 #ffffff' }} />

        {/* Footer */}
        <div style={{ padding: '6px', background: '#d4d0c8', display: 'flex', flexDirection: 'column', gap: '4px' }}>

          {/* Install PWA */}
          {installPrompt && (
            <button
              onClick={onInstallClick}
              style={{
                width: '100%',
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '4px 8px',
                background: '#d4d0c8',
                borderTop: '1px solid #ffffff',
                borderLeft: '1px solid #ffffff',
                borderRight: '1px solid #404040',
                borderBottom: '1px solid #404040',
                boxShadow: 'inset 1px 1px 0 #e8e4de, inset -1px -1px 0 #808080',
                cursor: 'pointer',
                fontSize: '11px',
                fontFamily: 'Tahoma, Arial, sans-serif',
              }}
            >
              <Download size={14} />
              <span>Instalar App</span>
            </button>
          )}

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            style={{
              width: '100%',
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '4px 8px',
              background: '#d4d0c8',
              borderTop: '1px solid #ffffff',
              borderLeft: '1px solid #ffffff',
              borderRight: '1px solid #404040',
              borderBottom: '1px solid #404040',
              boxShadow: 'inset 1px 1px 0 #e8e4de, inset -1px -1px 0 #808080',
              cursor: 'pointer',
              fontSize: '11px',
              fontFamily: 'Tahoma, Arial, sans-serif',
            }}
          >
            {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
            <span>Tema: {theme === 'dark' ? 'Oscuro' : 'Claro'}</span>
          </button>

          {/* Role display */}
          <div className="win-sunken" style={{ padding: '3px 8px', background: '#ffffff', fontSize: '10px', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 'bold', textTransform: 'uppercase', fontSize: '9px', color: '#404040' }}>Rol:</span>
            <span style={{ color: '#000080', fontWeight: 'bold', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentRole}</span>
          </div>

          {/* Logout */}
          <button
            onClick={onLogout}
            style={{
              width: '100%',
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '4px 8px',
              background: '#d4d0c8',
              borderTop: '1px solid #ffffff',
              borderLeft: '1px solid #ffffff',
              borderRight: '1px solid #404040',
              borderBottom: '1px solid #404040',
              boxShadow: 'inset 1px 1px 0 #e8e4de, inset -1px -1px 0 #808080',
              cursor: 'pointer',
              fontSize: '11px',
              fontFamily: 'Tahoma, Arial, sans-serif',
              color: '#cc0000',
            }}
          >
            <LogOut size={14} />
            <span>Cerrar Sesión</span>
          </button>
        </div>

        {/* Status bar */}
        <div className="win-statusbar" style={{ fontSize: '10px', color: '#000000', padding: '2px 6px', borderTop: '1px solid #808080' }}>
          FiscalCtl Enterprise v2.2
        </div>
      </div>
    </>
  );
};
