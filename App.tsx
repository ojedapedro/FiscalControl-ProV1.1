
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
import { Payment, PaymentStatus, Role } from './types';
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
      }).catch(err => {
        console.error("Error en SW notification, usando fallback:", err);
        new Notification(title, options);
      });
    } else {
      // Fallback a notificación estándar si el SW no está listo (ej. error de registro)
      try {
        new Notification(title, options);
      } catch (e) {
        console.error("Error mostrando notificación:", e);
      }
    }
  };

  // Solicitar permisos
  const requestNotificationAccess = async () => {
    if (!('Notification' in window)) {
      alert("Este navegador no soporta notificaciones de escritorio.");
      return;
    }
    
    const permission = await Notification.requestPermission();
    setPushPermission(permission);
    
    if (permission === 'granted') {
      new Notification("Notificaciones Activadas", {
        body: "Ahora recibirá alertas de pagos próximos a vencer.",
        icon: 'https://cdn-icons-png.flaticon.com/512/2645/2645897.png'
      });
    }
  };

  // Lógica para detectar vencimientos próximos al montar el componente
  useEffect(() => {
    const checkUpcomingDeadlines = () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const upcoming = payments.filter(p => {
        if (p.status === PaymentStatus.APPROVED || p.status === PaymentStatus.REJECTED) return false;
        
        const [year, month, day] = p.dueDate.split('-').map(Number);
        const due = new Date(year, month - 1, day);
        
        const diffTime = due.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return diffDays >= 0 && diffDays <= 7;
      });

      if (upcoming.length > 0) {
        setNotification(`Atención: Tiene ${upcoming.length} pagos próximos a vencer esta semana.`);
        
        if (Notification.permission === 'granted') {
            triggerSystemNotification(upcoming.length);
        }
      }
    };

    const timer = setTimeout(checkUpcomingDeadlines, 1000);
    return () => clearTimeout(timer);
  }, [payments]);

  const handleRoleChange = (newRole: Role) => {
    setCurrentRole(newRole);
    setCurrentView(getInitialView(newRole));
    setIsFormOpen(false);
  };

  // Handlers
  const handleNewPayment = (data: any) => {
    const store = STORES.find(s => s.id === data.storeId);
    const newPayment: Payment = {
      id: `PAG-${Math.floor(Math.random() * 10000)}`,
      ...data,
      storeName: store ? store.name : 'Tienda Desconocida',
      userId: 'CURR-USER',
      status: PaymentStatus.PENDING,
      submittedDate: new Date().toISOString()
    };
    setPayments([newPayment, ...payments]);
    setIsFormOpen(false);
  };

  const handleApprove = (id: string) => {
    setPayments(payments.map(p => p.id === id ? { ...p, status: PaymentStatus.APPROVED } : p));
  };

  const handleReject = (id: string, reason: string) => {
    setPayments(payments.map(p => p.id === id ? { 
        ...p, 
        status: PaymentStatus.REJECTED,
        rejectionReason: reason
    } : p));
  };

  // View Routing
  const renderContent = () => {
    if (isFormOpen && currentRole === Role.ADMIN) {
        return <PaymentForm onSubmit={handleNewPayment} onCancel={() => setIsFormOpen(false)} />;
    }

    if (currentView === 'approvals' && currentRole !== Role.AUDITOR) {
        return <AccessRestricted roleNeeded="Auditor" />;
    }
    if (currentView === 'reports' && currentRole !== Role.PRESIDENT) {
         return <AccessRestricted roleNeeded="Presidencia" />;
    }

    switch (currentView) {
      case 'payments':
        return <Dashboard payments={payments} onNewPayment={() => setIsFormOpen(true)} />;
      case 'notifications':
        return <NotificationsView onBack={() => setCurrentView('payments')} />;
      case 'approvals':
        return <Approvals payments={payments} onApprove={handleApprove} onReject={handleReject} />;
      case 'reports':
        return <Reports />;
      case 'network':
        return <StoreStatus />;
      case 'calendar':
        return <CalendarView />;
      case 'settings':
        return <div className="p-10 text-center text-slate-400 dark:text-slate-500">Módulo de Configuración (Próximamente)</div>;
      default:
        if (currentRole === Role.AUDITOR) return <Approvals payments={payments} onApprove={handleApprove} onReject={handleReject} />;
        if (currentRole === Role.PRESIDENT) return <Reports />;
        return <Dashboard payments={payments} onNewPayment={() => setIsFormOpen(true)} />;
    }
  };

  return (
    <div className="flex bg-slate-50 dark:bg-slate-950 min-h-screen font-sans text-slate-900 dark:text-slate-100 transition-colors duration-300">
      <Sidebar 
        currentView={currentView} 
        setCurrentView={(view) => {
            setIsFormOpen(false);
            setCurrentView(view);
        }}
        currentRole={currentRole}
        onChangeRole={handleRoleChange}
      />
      
      <main className={`flex-1 ml-20 lg:ml-64 transition-all duration-300 ${currentView === 'notifications' ? 'bg-slate-950' : ''}`}>
        {renderContent()}
      </main>

      {/* Notificación Discreta In-App */}
      {notification && currentView !== 'notifications' && (
        <div className="fixed bottom-6 right-6 bg-white dark:bg-slate-800 border-l-4 border-yellow-500 shadow-2xl p-4 rounded-lg z-50 animate-in slide-in-from-right duration-500 max-w-sm flex flex-col gap-3">
          <div className="flex gap-4 items-start">
            <div className="text-yellow-600 mt-1">
               <BellRing size={20} />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 dark:text-white text-sm">Recordatorio Fiscal</h4>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">{notification}</p>
            </div>
            <button 
              onClick={() => setNotification(null)} 
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 p-1 rounded transition-colors"
            >
              <X size={18} />
            </button>
          </div>
          
          {/* Botón para activar Push si no están activas */}
          {pushPermission === 'default' && (
            <button 
                onClick={requestNotificationAccess}
                className="w-full flex items-center justify-center gap-2 bg-slate-900 dark:bg-slate-700 text-white text-xs font-bold py-2 rounded-md hover:bg-slate-800 dark:hover:bg-slate-600 transition-colors"
            >
                <Bell size={14} />
                Activar Alertas de Escritorio
            </button>
          )}
        </div>
      )}
    </div>
  );
}

const AccessRestricted = ({ roleNeeded }: { roleNeeded: string }) => (
    <div className="flex flex-col items-center justify-center h-full text-slate-400">
        <div className="bg-slate-100 dark:bg-slate-800 p-6 rounded-full mb-4">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        </div>
        <h2 className="text-xl font-bold text-slate-700 dark:text-slate-300">Acceso Restringido</h2>
        <p>Cambie al rol de {roleNeeded} para ver este módulo.</p>
    </div>
);

export default App;
