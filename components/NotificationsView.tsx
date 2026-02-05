
import React, { useState, useEffect } from 'react';
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
  Smartphone,
  Mail,
  Save,
  MessageSquare,
  Link as LinkIcon,
  PlayCircle,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { AlertItem, AlertSeverity, SystemSettings } from '../types';
import { MOCK_ALERTS } from '../constants';
import { api } from '../services/api';

interface NotificationsViewProps {
  onBack: () => void;
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({ onBack }) => {
  const [filter, setFilter] = useState<'all' | AlertSeverity>('all');
  const [showSettings, setShowSettings] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  
  // Settings State
  const [config, setConfig] = useState<SystemSettings>({
      whatsappEnabled: false,
      whatsappPhone: '',
      whatsappGatewayUrl: '',
      daysBeforeWarning: 3,
      daysBeforeCritical: 1,
      emailEnabled: true
  });

  // Cargar configuración al abrir la vista de settings
  useEffect(() => {
    if (showSettings) {
      const fetchSettings = async () => {
        try {
            const saved = await api.getSettings();
            if (saved) {
                setConfig(saved);
            }
        } catch (e) {
            console.error("Error loading settings", e);
        }
      };
      fetchSettings();
    }
  }, [showSettings]);

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      await api.saveSettings(config);
      alert('✅ Configuración guardada. Recuerda configurar el activador temporal en Apps Script.');
    } catch (e) {
      alert('❌ Error guardando configuración');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestNotification = async () => {
    setIsTesting(true);
    try {
      const res = await api.triggerNotificationCheck();
      alert(`Resultado prueba: ${res.message}`);
    } catch (e) {
      alert('Error ejecutando prueba');
    } finally {
      setIsTesting(false);
    }
  };

  const getSeverityColor = (severity: AlertSeverity) => {
    switch (severity) {
      case 'critical': return 'bg-red-500 text-white border-red-600';
      case 'upcoming': return 'bg-yellow-500 text-white border-yellow-600';
      case 'scheduled': return 'bg-blue-500 text-white border-blue-600';
      default: return 'bg-slate-500 text-white';
    }
  };

  const getSeverityIcon = (severity: AlertSeverity) => {
    switch (severity) {
      case 'critical': return <AlertTriangle size={18} />;
      case 'upcoming': return <Clock size={18} />;
      case 'scheduled': return <Calendar size={18} />;
      default: return <Bell size={18} />;
    }
  };

  // Mock filtering for visual purposes
  const filteredAlerts = filter === 'all'
    ? MOCK_ALERTS
    : MOCK_ALERTS.filter(alert => alert.severity === filter);

  if (showSettings) {
      return (
          <div className="p-6 lg:p-10 max-w-4xl mx-auto animate-in slide-in-from-right duration-300">
              <div className="flex items-center gap-4 mb-8">
                  <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                      <ArrowLeft size={24} className="text-slate-600 dark:text-slate-300" />
                  </button>
                  <div>
                      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Configuración de Automatización</h1>
                      <p className="text-slate-500 dark:text-slate-400 text-sm">Gestiona los canales de envío y frecuencias de alerta.</p>
                  </div>
              </div>

              <div className="space-y-6">
                  {/* WhatsApp Configuration */}
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                      <div className="flex items-center gap-3 mb-6">
                          <div className="p-3 bg-green-100 dark:bg-green-900/20 text-green-600 rounded-xl">
                              <MessageSquare size={24} />
                          </div>
                          <div>
                              <h3 className="font-bold text-slate-900 dark:text-white">Integración WhatsApp</h3>
                              <p className="text-xs text-slate-500 dark:text-slate-400">Envío automático mediante Gateway API (CallMeBot, Twilio, etc)</p>
                          </div>
                          <div className="ml-auto">
                              <label className="relative inline-flex items-center cursor-pointer">
                                  <input 
                                    type="checkbox" 
                                    className="sr-only peer"
                                    checked={config.whatsappEnabled}
                                    onChange={(e) => setConfig({...config, whatsappEnabled: e.target.checked})} 
                                  />
                                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-green-500"></div>
                              </label>
                          </div>
                      </div>

                      <div className={`space-y-4 transition-all ${config.whatsappEnabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                          <div>
                              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">URL del Gateway / API</label>
                              <div className="relative">
                                  <input 
                                    type="text" 
                                    value={config.whatsappGatewayUrl}
                                    onChange={(e) => setConfig({...config, whatsappGatewayUrl: e.target.value})}
                                    placeholder="https://api.callmebot.com/whatsapp.php?phone=584144415403&text=This+is+a+test&apikey=7251581" 
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 pl-10 text-sm focus:ring-2 focus:ring-green-500 outline-none dark:text-white font-mono"
                                  />
                                  <LinkIcon size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                              </div>
                              <p className="text-[10px] text-slate-500 mt-1.5 ml-1">
                                  Soporta variables: <code>[PHONE]</code> y <code>[MESSAGE]</code>. Si usa CallMeBot, coloque la URL completa con su API Key.
                              </p>
                          </div>

                          <div>
                              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Número Destino (Admin)</label>
                              <div className="relative">
                                  <input 
                                    type="text"
                                    value={config.whatsappPhone}
                                    onChange={(e) => setConfig({...config, whatsappPhone: e.target.value})} 
                                    placeholder="+58 412 1234567" 
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 pl-10 text-sm focus:ring-2 focus:ring-green-500 outline-none dark:text-white font-mono"
                                  />
                                  <Smartphone size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                              </div>
                          </div>
                      </div>
                  </div>

                  {/* Frequency Settings */}
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                       <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                           <Clock size={20} className="text-blue-500" />
                           Frecuencia de Alertas
                       </h3>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <div>
                               <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Días antes (Aviso Preventivo)</label>
                               <input 
                                  type="number" 
                                  value={config.daysBeforeWarning}
                                  onChange={(e) => setConfig({...config, daysBeforeWarning: Number(e.target.value)})}
                                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                               />
                           </div>
                           <div>
                               <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Días antes (Aviso Crítico)</label>
                               <input 
                                  type="number" 
                                  value={config.daysBeforeCritical}
                                  onChange={(e) => setConfig({...config, daysBeforeCritical: Number(e.target.value)})}
                                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-red-500 outline-none dark:text-white"
                               />
                           </div>
                       </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col-reverse sm:flex-row gap-4 pt-4">
                       <button 
                        onClick={handleTestNotification}
                        disabled={isTesting || !config.whatsappEnabled}
                        className="flex-1 px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                       >
                           {isTesting ? <Loader2 className="animate-spin" size={20} /> : <PlayCircle size={20} />}
                           Probar Envío Manual
                       </button>
                       <button 
                        onClick={handleSaveSettings}
                        disabled={isSaving}
                        className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-200 dark:shadow-blue-900/30 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                       >
                           {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                           Guardar Cambios
                       </button>
                  </div>
              </div>
          </div>
      );
  }

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* Header */}
      <header className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                <ArrowLeft size={24} className="text-slate-600 dark:text-slate-300" />
            </button>
            <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Centro de Notificaciones</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1">Alertas automatizadas y recordatorios de pago.</p>
            </div>
        </div>
        <button 
            onClick={() => setShowSettings(true)}
            className="flex items-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-2.5 rounded-xl font-bold hover:opacity-90 transition-opacity shadow-lg"
        >
            <Settings size={18} />
            <span>Configurar Automatización</span>
        </button>
      </header>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
        {[
            { id: 'all', label: 'Todas las Alertas' },
            { id: 'critical', label: 'Críticas (Vencidas)' },
            { id: 'upcoming', label: 'Próximas (5 días)' },
            { id: 'scheduled', label: 'Programadas' }
        ].map(item => (
            <button
                key={item.id}
                onClick={() => setFilter(item.id as any)}
                className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${
                    filter === item.id 
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30' 
                    : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
            >
                {item.label}
            </button>
        ))}
      </div>

      {/* Alerts List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredAlerts.map((alert) => (
            <div key={alert.id} className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-6 hover:shadow-md transition-shadow group relative overflow-hidden">
                {/* Status Strip */}
                <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${alert.severity === 'critical' ? 'bg-red-500' : alert.severity === 'upcoming' ? 'bg-yellow-500' : 'bg-blue-500'}`}></div>

                <div className="flex-1 flex gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                        alert.severity === 'critical' ? 'bg-red-100 dark:bg-red-900/20 text-red-600' :
                        alert.severity === 'upcoming' ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600' :
                        'bg-blue-100 dark:bg-blue-900/20 text-blue-600'
                    }`}>
                        {getSeverityIcon(alert.severity)}
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{alert.category}</span>
                            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                            <span className="text-xs font-semibold text-slate-900 dark:text-slate-200">{alert.storeName}</span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">{alert.title}</h3>
                        <p className={`text-sm font-medium ${
                            alert.severity === 'critical' ? 'text-red-600' : 
                            alert.severity === 'upcoming' ? 'text-yellow-600' : 'text-slate-500'
                        }`}>
                            {alert.timeLabel} • Vence: {alert.dueDate}
                        </p>
                    </div>
                </div>

                <div className="flex flex-row md:flex-col items-center md:items-end justify-between gap-4 pl-4 border-l border-slate-100 dark:border-slate-800 md:border-l-0 md:pl-0">
                     <div className="text-right">
                        <span className="block text-2xl font-bold text-slate-900 dark:text-white">${alert.amount.toLocaleString()}</span>
                        <span className="text-xs text-slate-400">Monto estimado</span>
                     </div>
                     <button className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-bold rounded-lg transition-colors flex items-center gap-2">
                        <span>Gestionar</span>
                        <ChevronRight size={16} />
                     </button>
                </div>
            </div>
        ))}
      </div>
    </div>
  );
};
