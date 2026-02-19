
import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard'; 
import { PaymentForm } from './components/PaymentForm';
import { Approvals } from './components/Approvals';
import { Reports } from './components/Reports';
import { StoreStatus } from './components/StoreStatus';
import { CalendarView } from './components/CalendarView';
import { NotificationsView } from './components/NotificationsView';
import { Login } from './components/Login'; 
import { UserManagement } from './components/UserManagement';
import { STORES } from './constants';
import { Payment, PaymentStatus, Role, AuditLog, User } from './types';
import { X, RefreshCw, Loader2, Users, Menu, Building2, BellRing } from 'lucide-react';
import { api } from './services/api';
import { APP_LOGO_URL } from './constants';

function App() {
  // --- AUTH STATE ---
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // --- APP STATE ---
  const [currentView, setCurrentView] = useState('dashboard');
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Estado para el modal de formulario
  const [isFormOpen, setIsFormOpen] = useState(false);
  // Estado para saber si estamos editando un pago existente (Corrección)
  const [editingPayment, setEditingPayment] = useState<Payment | undefined>(undefined);

  const [notification, setNotification] = useState<string | null>(null);
  const [pushPermission, setPushPermission] = useState<NotificationPermission>('default');

  // --- MOBILE & PWA STATE ---
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  // PWA Install Prompt Listener
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      // Prevenir que Chrome en Android muestre el prompt automáticamente
      e.preventDefault();
      // Guardar el evento para dispararlo después con el botón
      setInstallPrompt(e);
      console.log("PWA: Evento de instalación capturado");
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    // Check inicial de permisos de notificación
    if ('Notification' in window) {
      setPushPermission(Notification.permission);
    }

    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = () => {
    if (installPrompt) {
      installPrompt.prompt();
      installPrompt.userChoice.then((choiceResult: any) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('Usuario aceptó la instalación');
        } else {
          console.log('Usuario rechazó la instalación');
        }
        setInstallPrompt(null);
      });
    }
  };

  const getInitialView = (role: Role) => {
    switch (role) {
      case Role.SUPER_ADMIN: return 'settings';
      case Role.AUDITOR: return 'approvals';
      case Role.PRESIDENT: return 'reports';
      default: return 'payments';
    }
  };

  useEffect(() => {
    if (isAuthenticated && currentUser) {
      setCurrentView(getInitialView(currentUser.role));
      loadData();
    }
  }, [isAuthenticated, currentUser]);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIsAuthenticated(false);
    setPayments([]);
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await api.getPayments();
      setPayments(data.sort((a,b) => new Date(b.submittedDate).getTime() - new Date(a.submittedDate).getTime()));
    } catch (error) {
      setNotification('❌ Error conectando con Google Sheets');
    } finally {
      setIsLoading(false);
    }
  };

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

  const requestPermission = () => {
    Notification.requestPermission().then(permission => {
      setPushPermission(permission);
    });
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  // Función para abrir formulario en modo "Nuevo"
  const handleOpenNewPayment = () => {
      setEditingPayment(undefined);
      setIsFormOpen(true);
  };

  // Función para abrir formulario en modo "Edición/Corrección"
  const handleEditPayment = (paymentToEdit: Payment) => {
      setEditingPayment(paymentToEdit);
      setIsFormOpen(true);
  };

  // Función consolidada para Guardar (Crear o Actualizar)
  const handleSavePayment = async (paymentData: any) => {
    setIsLoading(true);
    
    try {
        let receiptUrl = undefined;
        // Si el usuario subió un archivo nuevo, lo convertimos.
        if (paymentData.file) {
            try {
                receiptUrl = await fileToBase64(paymentData.file);
            } catch (e) {
                console.error("Error converting file", e);
            }
        } else if (editingPayment) {
            // Si estamos editando y no subió archivo nuevo, mantenemos el anterior
            receiptUrl = editingPayment.receiptUrl;
        }

        let justificationFileUrl = undefined;
        if (paymentData.justificationFile) {
            try {
                justificationFileUrl = await fileToBase64(paymentData.justificationFile);
            } catch (e) {
                console.error("Error converting justification file", e);
            }
        } else if (editingPayment) {
             justificationFileUrl = editingPayment.justificationFileUrl;
        }

        // --- LÓGICA DE ACTUALIZACIÓN (CORRECCIÓN) ---
        if (editingPayment) {
             const updateLog: AuditLog = {
                date: new Date().toISOString(),
                action: 'ACTUALIZACION', // Usamos actualización para indicar corrección
                actorName: currentUser?.name || 'Usuario',
                role: currentUser?.role || Role.ADMIN,
                note: 'Corrección de datos y reenvío'
             };

             const updatedPayment: Payment = {
                 ...editingPayment,
                 storeId: paymentData.storeId,
                 storeName: STORES.find(s => s.id === paymentData.storeId)?.name || 'Tienda Desconocida',
                 category: paymentData.category,
                 specificType: paymentData.specificType,
                 amount: paymentData.amount,
                 dueDate: paymentData.dueDate,
                 paymentDate: paymentData.paymentDate,
                 notes: paymentData.notes,
                 
                 // CRÍTICO: Resetear estado a PENDING para que el auditor lo vea de nuevo
                 status: PaymentStatus.PENDING, 
                 
                 // Actualizar archivos si cambiaron
                 receiptUrl: receiptUrl,
                 justificationFileUrl: justificationFileUrl,

                 // Datos extra
                 originalBudget: paymentData.originalBudget,
                 isOverBudget: paymentData.isOverBudget,
                 justification: paymentData.justification,
                 
                 // Añadir log al historial
                 history: editingPayment.history ? [...editingPayment.history, updateLog] : [updateLog]
             };

             await api.updatePayment(updatedPayment);
             setPayments(prev => prev.map(p => p.id === updatedPayment.id ? updatedPayment : p));
             setNotification('✅ Corrección enviada al auditor.');

        } else {
             // --- LÓGICA DE CREACIÓN NUEVA ---
             const initialLog: AuditLog = {
                date: new Date().toISOString(),
                action: 'CREACION',
                actorName: currentUser?.name || 'Usuario', 
                role: currentUser?.role || Role.ADMIN
             };

             const newPayment: Payment = {
                id: `PAG-${Math.floor(Math.random() * 10000)}`,
                storeId: paymentData.storeId,
                storeName: STORES.find(s => s.id === paymentData.storeId)?.name || 'Tienda Desconocida',
                userId: currentUser?.id || 'U-UNK',
                category: paymentData.category,
                specificType: paymentData.specificType,
                amount: paymentData.amount,
                dueDate: paymentData.dueDate,
                paymentDate: paymentData.paymentDate,
                status: PaymentStatus.PENDING,
                submittedDate: new Date().toISOString(),
                notes: paymentData.notes,
                history: [initialLog],
                receiptUrl: receiptUrl,
                justificationFileUrl: justificationFileUrl,
                originalBudget: paymentData.originalBudget,
                isOverBudget: paymentData.isOverBudget,
                justification: paymentData.justification
            };

            await api.createPayment(newPayment);
            setPayments(prev => [newPayment, ...prev]);
            setNotification('✅ Pago nuevo registrado.');
        }
        
        setIsFormOpen(false);
        setEditingPayment(undefined);

    } catch (error) {
        setNotification('❌ Error guardando pago.');
        console.error(error);
    } finally {
        setIsLoading(false);
        setTimeout(() => setNotification(null), 3000);
    }
  };

  const handleApprove = async (id: string, newDueDate?: string) => {
      setIsLoading(true);
      const paymentToUpdate = payments.find(p => p.id === id);
      if (paymentToUpdate) {
        let actionNote = undefined;
        let actionType: 'APROBACION' | 'ACTUALIZACION' = 'APROBACION';

        if (newDueDate && newDueDate !== paymentToUpdate.dueDate) {
            actionNote = `Fecha Vencimiento: ${paymentToUpdate.dueDate} ➔ ${newDueDate}`;
        }

        const log: AuditLog = {
            date: new Date().toISOString(),
            action: actionType,
            actorName: currentUser?.name || 'Auditor',
            role: currentUser?.role || Role.AUDITOR,
            note: actionNote
        };

        const updatedPayment = {
            ...paymentToUpdate,
            status: PaymentStatus.APPROVED,
            dueDate: newDueDate || paymentToUpdate.dueDate,
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
        actorName: currentUser?.name || 'Auditor',
        role: currentUser?.role || Role.AUDITOR,
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

  const handleManageNotification = (paymentId: string) => {
    if (currentUser?.role === Role.AUDITOR || currentUser?.role === Role.SUPER_ADMIN) {
      setCurrentView('approvals');
    } else {
      setCurrentView('payments');
    }
    setNotification(`Gestionando pago ${paymentId}...`);
    setTimeout(() => setNotification(null), 2000);
  };

  const renderContent = () => {
    if (!isAuthenticated) return null;

    if (isLoading && payments.length === 0) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-slate-500">
                <Loader2 size={48} className="animate-spin mb-4 text-blue-500" />
                <p>Conectando con Servidor Fiscal...</p>
            </div>
        );
    }

    switch (currentView) {
      case 'payments':
        return (
            <Dashboard 
                payments={payments} 
                onNewPayment={handleOpenNewPayment} 
                onEditPayment={handleEditPayment} 
            />
        );
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
            onRefresh={loadData}
          />
        );
      case 'settings':
        return (
          <div className="p-6 lg:p-10 text-white animate-in fade-in space-y-8 pb-24 lg:pb-10">
            <h1 className="text-2xl font-bold mb-4">Configuración del Sistema</h1>
            
            {currentUser?.role === Role.SUPER_ADMIN && (
               <div className="bg-indigo-900/40 border border-indigo-500/50 p-4 rounded-xl flex items-center gap-3">
                  <div className="p-2 bg-indigo-500 rounded-lg text-white">
                    <Users size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-indigo-300">Modo Super Usuario Activo</h3>
                    <p className="text-sm text-indigo-200/80">Tiene permisos totales para gestionar mantenimiento, usuarios y configuraciones avanzadas.</p>
                  </div>
               </div>
            )}
            
            {(currentUser?.role === Role.ADMIN || currentUser?.role === Role.SUPER_ADMIN) && (
              <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                <div className="p-6 border-b border-slate-700 bg-slate-800/50">
                   <UserManagement />
                </div>
              </div>
            )}

            <div className="grid gap-6">
                <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                   <h3 className="font-bold mb-4 flex items-center gap-2 text-blue-400">
                       <Building2 size={20} /> Conexión Google Drive
                   </h3>
                   <p className="text-sm text-slate-400 mb-4">
                       Hoja conectada: <strong>FiscalCtl Server</strong>
                   </p>
                   <div className="flex flex-wrap gap-4">
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
                            <Building2 size={16} />
                            Inicializar Tablas en Drive
                       </button>
                   </div>
                </div>

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
        return <div className="p-10 text-white">Vista no encontrada.</div>;
    }
  };

  useEffect(() => {
    if (!currentUser) return;
    const allViews = ['payments', 'network', 'calendar', 'notifications', 'settings', 'dashboard', 'approvals', 'reports'];
    const allowedViews: Record<Role, string[]> = {
      [Role.SUPER_ADMIN]: allViews,
      [Role.ADMIN]: ['payments', 'network', 'calendar', 'notifications', 'settings', 'dashboard'],
      [Role.AUDITOR]: ['approvals', 'calendar', 'notifications', 'settings'],
      [Role.PRESIDENT]: ['reports', 'network', 'notifications', 'settings']
    };
    if (!allowedViews[currentUser.role].includes(currentView)) {
      setCurrentView(getInitialView(currentUser.role));
    }
  }, [currentView, currentUser]);

  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLogin} />;
  }

  return (
    <div className="flex bg-slate-50 dark:bg-slate-950 min-h-screen font-sans overflow-hidden">
      
      {/* Sidebar Responsive */}
      <Sidebar 
        currentView={currentView} 
        setCurrentView={setCurrentView} 
        currentRole={currentUser?.role || Role.ADMIN}
        onChangeRole={() => {}} 
        onLogout={handleLogout}
        isMobileOpen={isMobileMenuOpen}
        closeMobileMenu={() => setIsMobileMenuOpen(false)}
        installPrompt={installPrompt}
        onInstallClick={handleInstallClick}
      />
      
      {/* Contenedor Principal */}
      <main className="flex-1 lg:ml-64 relative transition-all duration-300 flex flex-col h-screen overflow-hidden">
        
        {/* Header Móvil */}
        <div className="lg:hidden h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 shrink-0 z-30">
           <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsMobileMenuOpen(true)}
                className="p-2 text-white hover:bg-slate-800 rounded-lg"
              >
                  <Menu size={24} />
              </button>
              <span className="font-bold text-lg text-white">FiscalCtl</span>
           </div>
           <div className="w-8 h-8 rounded-full overflow-hidden bg-white/10">
               <img src={APP_LOGO_URL} alt="Logo" className="w-full h-full object-cover" />
           </div>
        </div>

        {/* Loading Overlay */}
        {isLoading && (
            <div className="absolute top-20 right-4 lg:top-4 lg:right-4 z-50 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2 shadow-lg animate-pulse">
                <RefreshCw size={12} className="animate-spin" />
                Sincronizando...
            </div>
        )}

        {/* Notificaciones Toast */}
        {notification && (
          <div className="fixed top-20 right-6 lg:top-6 lg:right-6 z-[60] animate-in slide-in-from-right-10 fade-in duration-300">
             <div className="bg-slate-900 text-white px-6 py-4 rounded-xl shadow-2xl border-l-4 border-blue-500 flex items-center gap-4">
                <span className="font-medium">{notification}</span>
                <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-white"><X size={18} /></button>
             </div>
          </div>
        )}

        {/* Modal Formulario */}
        {isFormOpen && (
           <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
              <div className="bg-white dark:bg-slate-950 w-full max-w-4xl h-[90vh] sm:h-auto sm:max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl shadow-2xl ring-1 ring-black/5">
                  <PaymentForm 
                      onSubmit={handleSavePayment} 
                      onCancel={() => { setIsFormOpen(false); setEditingPayment(undefined); }}
                      initialData={editingPayment}
                  />
              </div>
           </div>
        )}

        {/* Contenido Scrollable */}
        <div className="flex-1 overflow-y-auto custom-scrollbar relative">
           {renderContent()}
        </div>
      </main>
    </div>
  );
}

export default App;
