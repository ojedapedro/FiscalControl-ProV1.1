
import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard'; 
import { PaymentForm } from './components/PaymentForm';
import { Approvals } from './components/Approvals';
import { Reports } from './components/Reports';
import { StoreStatus } from './components/StoreStatus';
import { CalendarView } from './components/CalendarView';
import { NotificationsView } from './components/NotificationsView';
import { STORES } from './constants'; // Mantenemos tiendas estáticas por ahora, o podrías migrarlas también
import { Payment, PaymentStatus, Role, AuditLog } from './types';
import { X, BellRing, Database, RefreshCw, Loader2 } from 'lucide-react';
import { api } from './services/api';

function App() {
  const getInitialView = (role: Role) => {
    switch (role) {
      case Role.AUDITOR: return 'approvals';
      case Role.PRESIDENT: return 'reports';
      default: return 'payments';
    }
  };

  const [currentRole, setCurrentRole] = useState<Role>(Role.ADMIN);
  const [currentView, setCurrentView] = useState(getInitialView(Role.ADMIN));
  
  // Estado de Datos
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [pushPermission, setPushPermission] = useState<NotificationPermission>('default');

  // --- INTEGRACIÓN BASE DE DATOS ---

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await api.getPayments();
      // Si la BD está vacía, podríamos no cargar nada, o mantener el estado vacío
      setPayments(data.sort((a,b) => new Date(b.submittedDate).getTime() - new Date(a.submittedDate).getTime()));
    } catch (error) {
      setNotification('❌ Error conectando con Google Sheets');
    } finally {
      setIsLoading(false);
    }
  };

  // Cargar datos al iniciar
  useEffect(() => {
    loadData();
  }, []);

  const handleSetupDatabase = async () => {
    if(!confirm("¿Estás seguro? Esto creará las hojas en tu Google Sheet si no existen.")) return;
    setIsLoading(true);
    try {
      const res = await api.setupDatabase();
      setNotification(`✅ Base de datos configurada: ${res.message}`);
    } catch (e) {
      setNotification('❌ Error configurando BD');
    } finally {
      setIsLoading(false);
    }
  };

  // --------------------------------

  // Registrar Service Worker (sin cambios)
  useEffect(() => {
    const swCode = `
      self.addEventListener('install', (event) => self.skipWaiting());
      self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
      self.addEventListener('push', (event) => { /* ... */ });
      self.addEventListener('notificationclick', (event) => { /* ... */ });
    `;
    if ('serviceWorker' in navigator) {
      const blob = new Blob([swCode], { type: 'application/javascript' });
      const swUrl = URL.createObjectURL(blob);
      navigator.serviceWorker.register(swUrl).catch(console.warn);
    }
    if ('Notification' in window) setPushPermission(Notification.permission);
  }, []);

  const requestPermission = () => {
    Notification.requestPermission().then(permission => {
      setPushPermission(permission);
    });
  };

  const handleNewPayment = async (paymentData: any) => {
    setIsLoading(true);
    const initialLog: AuditLog = {
      date: new Date().toISOString(),
      action: 'CREACION',
      actorName: 'Usuario Admin', 
      role: currentRole
    };

    // Generar URL local para el archivo subido (simulación de upload)
    const receiptUrl = paymentData.file 
        ? URL.createObjectURL(paymentData.file) 
        : undefined;

    const newPayment: Payment = {
      id: `PAG-${Math.floor(Math.random() * 10000)}`,
      storeId: paymentData.storeId,
      storeName: STORES.find(s => s.id === paymentData.storeId)?.name || 'Tienda Desconocida',
      userId: 'U-CURRENT',
      category: paymentData.category,
      specificType: paymentData.specificType,
      amount: paymentData.amount,
      dueDate: paymentData.dueDate,
      paymentDate: paymentData.paymentDate,
      status: PaymentStatus.PENDING,
      submittedDate: new Date().toISOString(),
      notes: paymentData.notes,
      history: [initialLog],
      receiptUrl: receiptUrl // Usamos la URL generada del archivo real
    };

    try {
        await api.createPayment(newPayment);
        setPayments(prev => [newPayment, ...prev]);
        setIsFormOpen(false);
        setNotification('✅ Pago guardado en Google Sheets.');
    } catch (error) {
        setNotification('❌ Error guardando pago.');
    } finally {
        setIsLoading(false);
        setTimeout(() => setNotification(null), 3000);
    }
  };

  const handleApprove = async (id: string) => {
      setIsLoading(true);
      const log: AuditLog = {
        date: new Date().toISOString(),
        action: 'APROBACION',
        actorName: 'Auditor Jefe',
        role: Role.AUDITOR
      };

      const paymentToUpdate = payments.find(p => p.id === id);
      if (paymentToUpdate) {
        const updatedPayment = {
            ...paymentToUpdate,
            status: PaymentStatus.APPROVED,
            history: paymentToUpdate.history ? [...paymentToUpdate.history, log] : [log]
        };

        try {
            await api.updatePayment(updatedPayment);
            setPayments(prev => prev.map(p => p.id === id ? updatedPayment : p));
            setNotification(`Pago ${id} Aprobado y Sincronizado`);
        } catch (error) {
            setNotification('❌ Error sincronizando aprobación.');
        } finally {
            setIsLoading(false);
            setTimeout(() => setNotification(null), 3000);
        }
      }
  };

  const handleReject = async (id: string, reason: string) => {
      setIsLoading(true);
      const log: AuditLog = {
        date: new Date().toISOString(),
        action: 'RECHAZO',
        actorName: 'Auditor Jefe',
        role: Role.AUDITOR,
        note: reason
      };

      const paymentToUpdate = payments.find(p => p.id === id);
      if (paymentToUpdate) {
          const updatedPayment = {
            ...paymentToUpdate,
            status: PaymentStatus.REJECTED,
            rejectionReason: reason,
            history: paymentToUpdate.history ? [...paymentToUpdate.history, log] : [log]
          };

          try {
            await api.updatePayment(updatedPayment);
            setPayments(prev => prev.map(p => p.id === id ? updatedPayment : p));
            setNotification(`Pago ${id} Rechazado y Sincronizado`);
          } catch (error) {
             setNotification('❌ Error sincronizando rechazo.');
          } finally {
             setIsLoading(false);
             setTimeout(() => setNotification(null), 3000);
          }
      }
  };

  // Manejador para el botón "Gestionar" de las notificaciones
  const handleManageNotification = (paymentId: string) => {
    // Si soy auditor, voy a aprobaciones
    if (currentRole === Role.AUDITOR) {
      setCurrentView('approvals');
    } else {
      // Si soy admin, voy al dashboard
      setCurrentView('payments');
    }
    // Opcional: Podríamos añadir lógica para resaltar el pago en la lista destino
    setNotification(`Gestionando pago ${paymentId}...`);
    setTimeout(() => setNotification(null), 2000);
  };

  const renderContent = () => {
    if (isLoading && payments.length === 0) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-slate-500">
                <Loader2 size={48} className="animate-spin mb-4 text-blue-500" />
                <p>Conectando con Servidor Fiscal (Google Drive)...</p>
            </div>
        );
    }

    switch (currentView) {
      case 'payments':
        return <Dashboard payments={payments} onNewPayment={() => setIsFormOpen(true)} />;
      case 'approvals':
        return <Approvals payments={payments} onApprove={handleApprove} onReject={handleReject} />;
      case 'reports':
        return <Reports payments={payments} />;
      case 'network':
        return <StoreStatus payments={payments} />;
      case 'calendar':
        return <CalendarView payments={payments} />;
      case 'notifications':
        return (
          <NotificationsView 
            onBack={() => setCurrentView('payments')} 
            payments={payments}
            onManage={handleManageNotification}
          />
        );
      case 'settings':
        return (
          <div className="p-10 text-white animate-in fade-in">
            <h1 className="text-2xl font-bold mb-4">Configuración del Sistema</h1>
            <div className="grid gap-6">
                
                {/* Database Connection */}
                <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                   <h3 className="font-bold mb-4 flex items-center gap-2 text-blue-400">
                       <Database size={20} /> Conexión Google Drive
                   </h3>
                   <p className="text-sm text-slate-400 mb-4">
                       Hoja conectada: <strong>FiscalCtl Server</strong><br/>
                       ID: 1EaYm-kbgFciU2ZFIJk5B8rLb9y07hZEDbGKIiElLbd8
                   </p>
                   <div className="flex gap-4">
                       <button 
                            onClick={loadData}
                            disabled={isLoading}
                            className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg text-sm font-bold transition-colors"
                        >
                            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
                            Sincronizar Datos
                       </button>
                       <button 
                            onClick={handleSetupDatabase}
                            disabled={isLoading}
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg text-sm font-bold transition-colors"
                       >
                            <Database size={16} />
                            Inicializar Tablas en Drive
                       </button>
                   </div>
                </div>

                {/* Notifications */}
                <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                   <h3 className="font-bold mb-4 flex items-center gap-2"><BellRing size={20} /> Permisos Locales</h3>
                   <div className="flex justify-between items-center">
                      <span className="text-slate-300">Push Notifications: {pushPermission === 'granted' ? 'Activo' : 'Inactivo'}</span>
                      {pushPermission !== 'granted' && (
                        <button onClick={requestPermission} className="bg-blue-600 px-4 py-2 rounded-lg text-sm font-bold">Activar</button>
                      )}
                   </div>
                </div>
            </div>
          </div>
        );
      default:
        return <Dashboard payments={payments} onNewPayment={() => setIsFormOpen(true)} />;
    }
  };

  useEffect(() => {
    const defaultView = getInitialView(currentRole);
    const allowedViews: Record<Role, string[]> = {
      [Role.ADMIN]: ['payments', 'network', 'calendar', 'notifications', 'settings'],
      [Role.AUDITOR]: ['approvals', 'calendar', 'notifications', 'settings'],
      [Role.PRESIDENT]: ['reports', 'network', 'notifications', 'settings']
    };
    if (!allowedViews[currentRole].includes(currentView)) {
      setCurrentView(defaultView);
    }
  }, [currentRole]);

  return (
    <div className="flex bg-slate-50 dark:bg-slate-950 min-h-screen font-sans">
      <Sidebar 
        currentView={currentView} 
        setCurrentView={setCurrentView} 
        currentRole={currentRole}
        onChangeRole={setCurrentRole}
      />
      
      <main className="flex-1 ml-20 lg:ml-64 relative transition-all duration-300">
        
        {/* Loading Overlay Global */}
        {isLoading && (
            <div className="absolute top-4 right-4 z-50 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2 shadow-lg animate-pulse">
                <RefreshCw size={12} className="animate-spin" />
                Sincronizando...
            </div>
        )}

        {notification && (
          <div className="fixed top-6 right-6 z-50 animate-in slide-in-from-right-10 fade-in duration-300">
             <div className="bg-slate-900 text-white px-6 py-4 rounded-xl shadow-2xl border-l-4 border-blue-500 flex items-center gap-4">
                <span className="font-medium">{notification}</span>
                <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-white"><X size={18} /></button>
             </div>
          </div>
        )}

        {isFormOpen && (
           <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
              <div className="bg-white dark:bg-slate-950 w-full max-w-4xl h-[90vh] sm:h-auto sm:max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl shadow-2xl ring-1 ring-black/5">
                  <PaymentForm onSubmit={handleNewPayment} onCancel={() => setIsFormOpen(false)} />
              </div>
           </div>
        )}

        {renderContent()}
      </main>
    </div>
  );
}

export default App;
