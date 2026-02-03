
import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Settings, 
  CreditCard, 
  AlertTriangle, 
  Clock, 
  Calendar,
  ChevronRight,
  Plus,
  Bell,
  Check,
  Smartphone,
  Mail
} from 'lucide-react';
import { AlertItem, AlertSeverity } from '../types';
import { MOCK_ALERTS } from '../constants';

interface NotificationsViewProps {
  onBack: () => void;
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({ onBack }) => {
  const [filter, setFilter] = useState<'all' | AlertSeverity>('all');
  const [showSettings, setShowSettings] = useState(false);
  
  // Settings State
  const [config, setConfig] = useState({
      pushEnabled: true,
      emailEnabled: true,
      smsEnabled: false,
      daysBeforeWarning: 3,
      daysBeforeCritical: 1,
      autoRemind: true
  });

  const filteredAlerts = MOCK_ALERTS.filter(alert => 
    filter === 'all' ? true : alert.severity === filter
  );

  const getSeverityColor = (severity: AlertSeverity) => {
    switch (severity) {
      case 'critical': return 'text-red-500 bg-red-500/10 border-red-500';
      case 'upcoming': return 'text-orange-500 bg-orange-500/10 border-orange-500';
      case 'scheduled': return 'text-green-500 bg-green-500/10 border-green-500';
    }
  };

  const getSectionTitle = (severity: AlertSeverity) => {
     switch (severity) {
      case 'critical': return (
          <div className="flex items-center gap-2 text-red-500 mb-4 mt-2">
              <AlertTriangle size={20} />
              <h3 className="font-bold text-lg">Vencidas</h3>
              <span className="ml-auto text-xs bg-red-500/20 px-2 py-1 rounded-full">{filteredAlerts.filter(a => a.severity === 'critical').length} Alertas</span>
          </div>
      );
      case 'upcoming': return (
          <div className="flex items-center gap-2 text-orange-500 mb-4 mt-8">
              <Clock size={20} />
              <h3 className="font-bold text-lg">Vencen Pronto (48h)</h3>
          </div>
      );
      case 'scheduled': return (
          <div className="flex items-center gap-2 text-green-500 mb-4 mt-8">
              <Calendar size={20} />
              <h3 className="font-bold text-lg">Programadas</h3>
          </div>
      );
    }
  };

  // Render just the list items for a specific severity
  const renderAlertList = (severity: AlertSeverity) => {
      const items = filteredAlerts.filter(a => a.severity === severity);
      if (items.length === 0) return null;

      return (
          <div className="animate-in slide-in-from-bottom-4 duration-500">
              {getSectionTitle(severity)}
              <div className="space-y-4">
                  {items.map(alert => (
                      <div key={alert.id} className={`bg-slate-800 rounded-xl p-5 border-l-4 ${getSeverityColor(alert.severity).split(' ')[2]} flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden group`}>
                          <div className="z-10 w-full md:w-auto">
                                <div className="flex justify-between md:justify-start items-center gap-3 text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                                    <span>{alert.storeName}</span>
                                    <span>•</span>
                                    <span>{alert.category}</span>
                                    {/* Mobile Badge */}
                                    <span className={`md:hidden ml-auto px-2 py-1 rounded text-[10px] ${alert.severity === 'critical' ? 'bg-red-500/20 text-red-400' : alert.severity === 'upcoming' ? 'bg-orange-500/20 text-orange-400' : 'bg-green-500/20 text-green-400'}`}>
                                        {alert.timeLabel}
                                    </span>
                                </div>
                                <h4 className="text-xl font-bold text-slate-100 mb-1">{alert.title}</h4>
                                <div className="text-slate-400 font-mono">${alert.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                          </div>
                          
                          <div className="z-10 w-full md:w-auto flex flex-col items-end gap-3">
                                {/* Desktop Badge */}
                                <span className={`hidden md:block px-3 py-1 rounded-md text-sm font-medium ${alert.severity === 'critical' ? 'bg-red-500/20 text-red-400' : alert.severity === 'upcoming' ? 'bg-orange-500/20 text-orange-400' : 'bg-green-500/20 text-green-400'}`}>
                                    {alert.timeLabel}
                                </span>
                                
                                {alert.severity !== 'scheduled' ? (
                                    <button className="w-full md:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-semibold transition-colors shadow-lg shadow-blue-900/50">
                                        <CreditCard size={16} />
                                        Pagar Ahora
                                    </button>
                                ) : (
                                    <button className="p-2 rounded-full bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors">
                                        <ChevronRight size={20} />
                                    </button>
                                )}
                          </div>

                          {/* Hover Effect */}
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-slate-700/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                      </div>
                  ))}
              </div>
          </div>
      );
  };

  if (showSettings) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-200 p-4 lg:p-8 animate-in fade-in duration-300">
             <header className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-slate-800 rounded-full transition-colors">
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Configuración</h1>
                        <p className="text-slate-400 text-sm">Personaliza tus reglas de alerta</p>
                    </div>
                </div>
            </header>

            <div className="max-w-2xl mx-auto space-y-6">
                {/* Channels */}
                <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Bell size={18} /> Canales de Notificación</h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-500/20 text-blue-400 rounded-lg"><Smartphone size={20}/></div>
                                <div>
                                    <div className="font-medium">Notificaciones Push</div>
                                    <div className="text-xs text-slate-500">Alertas en navegador y móvil</div>
                                </div>
                            </div>
                            <Toggle checked={config.pushEnabled} onChange={() => setConfig({...config, pushEnabled: !config.pushEnabled})} />
                        </div>
                        <div className="flex justify-between items-center">
                             <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-500/20 text-purple-400 rounded-lg"><Mail size={20}/></div>
                                <div>
                                    <div className="font-medium">Correo Electrónico</div>
                                    <div className="text-xs text-slate-500">Resumen diario y críticas</div>
                                </div>
                            </div>
                            <Toggle checked={config.emailEnabled} onChange={() => setConfig({...config, emailEnabled: !config.emailEnabled})} />
                        </div>
                    </div>
                </div>

                {/* Thresholds */}
                <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Clock size={18} /> Tiempos de Alerta</h3>
                    
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-slate-400 mb-2">Advertencia Preventiva (Días antes)</label>
                        <div className="flex items-center gap-4">
                            <input 
                                type="range" min="1" max="7" 
                                value={config.daysBeforeWarning} 
                                onChange={(e) => setConfig({...config, daysBeforeWarning: parseInt(e.target.value)})}
                                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                            />
                            <span className="font-mono bg-slate-800 px-3 py-1 rounded border border-slate-700">{config.daysBeforeWarning}d</span>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">Alerta Crítica (Días antes)</label>
                         <div className="flex items-center gap-4">
                            <input 
                                type="range" min="0" max="3" 
                                value={config.daysBeforeCritical} 
                                onChange={(e) => setConfig({...config, daysBeforeCritical: parseInt(e.target.value)})}
                                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-red-500"
                            />
                            <span className="font-mono bg-slate-800 px-3 py-1 rounded border border-slate-700">{config.daysBeforeCritical}d</span>
                        </div>
                    </div>
                </div>

                 <button 
                    onClick={() => setShowSettings(false)}
                    className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-900/20 transition-all active:scale-[0.99]"
                >
                    Guardar Cambios
                </button>
            </div>
        </div>
      )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-4 lg:p-8 font-sans">
      {/* Header */}
      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 hover:bg-slate-800 rounded-full transition-colors">
                <ArrowLeft size={24} />
            </button>
            <div>
                <h1 className="text-3xl font-bold text-white">Alertas de Vencimiento</h1>
                <p className="text-slate-400 mt-1">Manténgase al día con sus obligaciones fiscales y de gastos.</p>
            </div>
        </div>
        <button 
            onClick={() => setShowSettings(true)}
            className="p-3 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors text-slate-300"
        >
            <Settings size={24} />
        </button>
      </header>

      {/* Tabs / Filters */}
      <div className="flex gap-2 mb-8 bg-slate-900/50 p-1 rounded-xl w-fit">
        {[
            { id: 'all', label: 'Todas' },
            { id: 'critical', label: 'Críticas' },
            { id: 'upcoming', label: 'Próximas' },
            { id: 'scheduled', label: 'Programadas' }
        ].map(tab => (
            <button
                key={tab.id}
                onClick={() => setFilter(tab.id as any)}
                className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${
                    filter === tab.id 
                    ? 'bg-slate-800 text-white shadow-sm border border-slate-700' 
                    : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
                }`}
            >
                {tab.label}
            </button>
        ))}
      </div>

      {/* Content */}
      <div className="max-w-4xl">
        {(filter === 'all' || filter === 'critical') && renderAlertList('critical')}
        {(filter === 'all' || filter === 'upcoming') && renderAlertList('upcoming')}
        {(filter === 'all' || filter === 'scheduled') && renderAlertList('scheduled')}
      </div>

      {/* Floating Action Button */}
      <button className="fixed bottom-8 right-8 w-14 h-14 bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-2xl shadow-blue-500/30 flex items-center justify-center transition-transform hover:scale-105">
          <Plus size={28} />
      </button>

    </div>
  );
};

// Helper Toggle Component
const Toggle = ({ checked, onChange }: { checked: boolean, onChange: () => void }) => (
    <button 
        onClick={onChange}
        className={`w-12 h-6 rounded-full p-1 transition-colors relative ${checked ? 'bg-blue-600' : 'bg-slate-700'}`}
    >
        <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${checked ? 'translate-x-6' : 'translate-x-0'}`} />
    </button>
);
