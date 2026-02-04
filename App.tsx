
import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard'; // Using Dashboard component as Payments View
import { PaymentForm } from './components/PaymentForm';
import { Approvals } from './components/Approvals';
import { Reports } from './components/Reports';
import { StoreStatus } from './components/StoreStatus';
import { CalendarView } from './components/CalendarView';
import { NotificationsView } from './components/NotificationsView';
import { INITIAL_PAYMENTS, STORES } from './constants';
import { Payment, PaymentStatus, Role, AuditLog } from './types';
import { X, BellRing, Bell } from 'lucide-react';

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
  const [payments, setPayments] = useState<Payment[]>(INITIAL_PAYMENTS);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [pushPermission, setPushPermission] = useState<NotificationPermission>('default');

  // Registrar Service Worker usando Blob para evitar errores de CORS/Origen en previews
  useEffect(() => {
    const swCode = `
      self.addEventListener('install', (event) => self.skipWaiting());
      self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

      self.addEventListener('push', (event) => {
        const data = event.data ? event.data.json() : { title: 'Alerta Fiscal', body: 'Revise sus pagos pendientes.' };
        self.registration.showNotification(data.title, {
          body: data.body,
          icon: 'https://cdn-icons-png.flaticon.com/512/2645/2645897.png',
          vibrate: [100, 50, 100],
          data: { dateOfArrival: Date.now() }
        });
      });

      self.addEventListener('notificationclick', (event) => {
        event.notification.close();
        event.waitUntil(
          self.clients.matchAll({ type: 'window' }).then((clientList) => {
            if (clientList.length > 0) {
              let client = clientList[0];
              for (let i = 0; i < clientList.length; i++) {
                if (clientList[i].focused) { client = clientList[i]; }
              }
              return client.focus();
            }
            return self.clients.openWindow('/');
          })
        );
      });
    `;

    if ('serviceWorker' in navigator) {
      const blob = new Blob([swCode], { type: 'application/javascript' });
      const swUrl = URL.createObjectURL(blob);

      navigator.serviceWorker.register(swUrl)
        .then(registration => {
          console.log('Service Worker registrado con éxito (Blob):', registration);
        })
        .catch(error => {
          console.warn('Registro de SW falló (modo fallback activo):', error);
        });
    }
    
    if ('Notification' in window) {
      setPushPermission(Notification.permission);
    }
  }, []);

  // Función para disparar notificación de sistema con fallback
  const triggerSystemNotification = (count: number) => {
    if (Notification.permission !== 'granted') return;

    const title = 'Alerta de Vencimiento';
    const options = {
      body: `Atención: Tiene ${count} pagos que vencen en los próximos 7 días. Evite multas.`,
      icon: 'https://cdn-icons-png.flaticon.com/512/2645/2645897.png',
      vibrate: [200, 100, 200],
      tag: 'payment-deadline'
    } as any;

    // Intentar usar Service Worker si está disponible y controlando la página
    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then(registration => {
        registration.showNotification(title, options);
      });
    } else {
      // Fallback a notificación nativa directa
      new Notification(title, options);
    }
  };

  // Simular chequeo de alertas periódicas
  useEffect(() => {
    const checkDeadlines = () => {
      const today = new Date();
      const nextWeek = new Date();
      nextWeek.setDate(today.getDate() + 7);

      const urgentPayments = payments.filter(p => {
        const due = new Date(p.dueDate);
        return p.status === PaymentStatus.PENDING && due <= nextWeek && due >= today;
      });

      if (urgentPayments.length > 0) {
        setNotification(`⚠️ ${urgentPayments.length} pagos vencen esta semana.`);
        triggerSystemNotification(urgentPayments.length);
      }
    };

    const timer = setInterval(checkDeadlines, 30000); // Chequear cada 30s
    setTimeout(checkDeadlines, 2000); // Chequear al inicio

    return () => clearInterval(timer);
  }, [payments]);

  // Request Notification Permission
  const requestPermission = () => {
    Notification.requestPermission().then(permission => {
      setPushPermission(permission);
      if (permission === 'granted') {
        new Notification('Notificaciones Activas', { body: 'Recibirá alertas de vencimientos fiscales.' });
      }
    });
  };

  const handleNewPayment = (paymentData: any) => {
    const initialLog: AuditLog = {
      date: new Date().toISOString(),
      action: 'CREACION',
      actorName: 'Usuario Actual', // En una app real vendría del auth
      role: currentRole
    };

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
      status: PaymentStatus.PENDING, // Por defecto entra como pendiente
      submittedDate: new Date().toISOString(),
      notes: paymentData.notes,
      history: [initialLog]
    };

    setPayments(prev => [newPayment, ...prev]);
    setIsFormOpen(false);
    setNotification('✅ Pago cargado y enviado a auditoría.');
    setTimeout(() => setNotification(null), 3000);
  };

  const handleApprove = (id: string) => {
      const log: AuditLog = {
        date: new Date().toISOString(),
        action: 'APROBACION',
        actorName: 'Auditor en Turno',
        role: Role.AUDITOR
      };

      setPayments(prev => prev.map(p => {
        if (p.id === id) {
          return {
            ...p,
            status: PaymentStatus.APPROVED,
            history: p.history ? [...p.history, log] : [log]
          };
        }
        return p;
      }));
      setNotification(`Pago ${id} Aprobado`);
      setTimeout(() => setNotification(null), 3000);
  };

  const handleReject = (id: string, reason: string) => {
      const log: AuditLog = {
        date: new Date().toISOString(),
        action: 'RECHAZO',
        actorName: 'Auditor en Turno',
        role: Role.AUDITOR,
        note: reason
      };

      setPayments(prev => prev.map(p => {
        if (p.id === id) {
          return {
            ...p,
            status: PaymentStatus.REJECTED,
            rejectionReason: reason,
            history: p.history ? [...p.history, log] : [log]
          };
        }
        return p;
      }));
      setNotification(`Pago ${id} Rechazado`);
      setTimeout(() => setNotification(null), 3000);
  };

  const renderContent = () => {
    switch (currentView) {
      case 'payments':
        return <Dashboard payments={payments} onNewPayment={() => setIsFormOpen(true)} />;
      case 'approvals':
        return <Approvals payments={payments} onApprove={handleApprove} onReject={handleReject} />;
      case 'reports':
        return <Reports payments={payments} />;
      case 'network':
        return <StoreStatus />;
      case 'calendar':
        return <CalendarView payments={payments} />;
      case 'notifications':
        return <NotificationsView onBack={() => setCurrentView('payments')} />;
      case 'settings':
        return (
          <div className="p-10 text-white">
            <h1 className="text-2xl font-bold mb-4">Configuración</h1>
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
               <h3 className="font-bold mb-4 flex items-center gap-2"><BellRing size={20} /> Permisos de Notificación</h3>
               <div className="flex justify-between items-center">
                  <span className="text-slate-300">Estado: {pushPermission === 'granted' ? 'Activo' : 'Bloqueado / Preguntar'}</span>
                  {pushPermission !== 'granted' && (
                    <button onClick={requestPermission} className="bg-blue-600 px-4 py-2 rounded-lg text-sm font-bold">Activar</button>
                  )}
               </div>
            </div>
          </div>
        );
      default:
        return <Dashboard payments={payments} onNewPayment={() => setIsFormOpen(true)} />;
    }
  };

  // Efecto para cambiar la vista si el rol no tiene acceso
  useEffect(() => {
    const defaultView = getInitialView(currentRole);
    // Lista simple de vistas permitidas por rol (debería coincidir con Sidebar)
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