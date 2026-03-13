
import React, { useState, useEffect } from 'react';
import { PresidencyDashboard } from './components/PresidencyDashboard';
import { Sidebar } from './components/Sidebar';
import { PaymentForm } from './components/PaymentForm';
import { Approvals } from './components/Approvals';
import { Reports } from './components/Reports';
import { StoreStatus } from './components/StoreStatus';
import { CalendarView } from './components/CalendarView';
import { NotificationsView } from './components/NotificationsView';
import { Login } from './components/Login'; 
import { UserManagement } from './components/UserManagement';
import { PayrollModule } from './components/PayrollModule';
import { STORES } from './constants';
import { Payment, PaymentStatus, Role, AuditLog, User, Category, PayrollEntry, Employee } from './types';
import { X, RefreshCw, Loader2, Users, Menu, Building2, BellRing, DollarSign, Plus, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from './services/api';
import { APP_LOGO_URL } from './constants';
import { ExchangeRateProvider } from './contexts/ExchangeRateContext';

interface AppProps {
  isDemoMode?: boolean;
}

function App({ isDemoMode = false }: AppProps) {
  console.log("App Version: 2.2 - Categoría Fiscal Update");
  // --- AUTH STATE ---
  const [currentUser, setCurrentUser] = useState<User | null>(
    isDemoMode ? { id: 'demo-admin', name: 'Admin Demo', role: Role.ADMIN, email: 'demo@example.com' } : null
  );
  const [isAuthenticated, setIsAuthenticated] = useState(isDemoMode);

  // --- APP STATE ---
  const [currentView, setCurrentView] = useState('payments');
  const [payments, setPayments] = useState<Payment[]>([]);
  const [payrollEntries, setPayrollEntries] = useState<PayrollEntry[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [exchangeRate, setExchangeRate] = useState<number>(() => {
    const saved = localStorage.getItem('fiscal_exchange_rate');
    return saved ? Number(saved) : 1;
  });
  const [exchangeRateInput, setExchangeRateInput] = useState<number>(() => {
    const saved = localStorage.getItem('fiscal_exchange_rate');
    return saved ? Number(saved) : 1;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [showRejectedModal, setShowRejectedModal] = useState(false);
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

  // Abrir formulario automáticamente al entrar en Categoría Fiscal
  // Eliminado: El formulario ahora está embebido permanentemente en la vista 'payments'

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
  };

  const handleAddPayrollEntry = async (entry: Omit<PayrollEntry, 'id' | 'submittedDate'>) => {
    setIsLoading(true);
    const newEntry: PayrollEntry = {
      ...entry,
      id: `PAY-${Date.now()}`,
      submittedDate: new Date().toISOString()
    };
    
    try {
      if (!isDemoMode) {
        await api.createPayrollEntry(newEntry);
      }
      setPayrollEntries([newEntry, ...payrollEntries]);
      setNotification('✅ Nómina cargada exitosamente');
    } catch (error) {
      setNotification('❌ Error guardando nómina');
    } finally {
      setIsLoading(false);
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const handleUpdatePayrollEntry = async (entry: PayrollEntry) => {
    setIsLoading(true);
    try {
      if (!isDemoMode) {
        await api.updatePayrollEntry(entry);
      }
      setPayrollEntries(prev => prev.map(e => e.id === entry.id ? entry : e));
      setNotification('✅ Nómina actualizada');
    } catch (error) {
      setNotification('❌ Error actualizando nómina');
    } finally {
      setIsLoading(false);
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const handleDeletePayrollEntry = async (id: string) => {
    setIsLoading(true);
    try {
      if (!isDemoMode) {
        await api.deletePayrollEntry(id);
      }
      setPayrollEntries(payrollEntries.filter(e => e.id !== id));
      setNotification('🗑️ Registro de nómina eliminado');
    } catch (error) {
      setNotification('❌ Error eliminando registro de nómina');
    } finally {
      setIsLoading(false);
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const handleAddEmployee = async (employee: Employee) => {
    setIsLoading(true);
    try {
      if (!isDemoMode) {
        await api.createEmployee(employee);
      }
      setEmployees(prev => [...prev, employee]);
      setNotification('✅ Expediente de empleado creado');
    } catch (error) {
      setNotification('❌ Error guardando expediente');
    } finally {
      setIsLoading(false);
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const handleUpdateEmployee = async (employee: Employee) => {
    setIsLoading(true);
    try {
      if (!isDemoMode) {
        await api.updateEmployee(employee);
      }
      setEmployees(prev => prev.map(e => e.id === employee.id ? employee : e));
      setNotification('✅ Expediente actualizado');
    } catch (error) {
      setNotification('❌ Error actualizando expediente');
    } finally {
      setIsLoading(false);
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    setIsLoading(true);
    try {
      if (!isDemoMode) {
        await api.deleteEmployee(id);
      }
      setEmployees(prev => prev.filter(e => e.id !== id));
      setNotification('🗑️ Expediente eliminado');
    } catch (error) {
      setNotification('❌ Error eliminando expediente');
    } finally {
      setIsLoading(false);
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIsAuthenticated(false);
    setPayments([]);
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      if (isDemoMode) {
        // Mock data for demo mode
        const mockPayments: Payment[] = [
          {
            id: 'PAG-1001',
            storeId: 'S-001',
            storeName: 'Tienda Central',
            userId: 'demo-admin',
            category: Category.OTHER,
            specificType: 'Reparación AC',
            amount: 1500,
            dueDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
            paymentDate: undefined,
            status: PaymentStatus.PENDING,
            submittedDate: new Date().toISOString(),
            notes: 'Reparación urgente del aire acondicionado.',
            history: [{ date: new Date().toISOString(), action: 'CREACION', actorName: 'Admin Demo', role: Role.ADMIN }]
          },
          {
            id: 'PAG-1002',
            storeId: 'S-002',
            storeName: 'Sucursal Norte',
            userId: 'demo-admin',
            category: Category.UTILITY,
            specificType: 'Internet',
            amount: 800,
            dueDate: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0],
            paymentDate: undefined,
            status: PaymentStatus.APPROVED,
            submittedDate: new Date(Date.now() - 86400000).toISOString(),
            notes: 'Pago mensual de internet.',
            history: [
              { date: new Date(Date.now() - 86400000).toISOString(), action: 'CREACION', actorName: 'Admin Demo', role: Role.ADMIN },
              { date: new Date().toISOString(), action: 'APROBACION', actorName: 'Auditor Demo', role: Role.AUDITOR }
            ]
          }
        ];
        setPayments(mockPayments);

        // Mock Employees
        const mockEmployees: Employee[] = [
          {
            id: 'V-12345678',
            code: 'EMP001',
            nationality: 'V',
            name: 'Juan',
            lastName: 'Pérez',
            age: 35,
            educationLevel: 'Universitario',
            position: 'Analista de Datos',
            department: 'IT',
            positionDescription: 'Análisis de métricas fiscales',
            hireDate: '2022-01-15',
            email: 'juan.perez@example.com',
            directPhone: '0414-1234567',
            emergencyPhone: '0412-7654321',
            homeAddress: 'Caracas, Venezuela',
            gender: 'M',
            wearsGlasses: 'No',
            hasCondition: 'No',
            height: '1.75',
            storeId: 'S101',
            baseSalary: 1000,
            isActive: true,
            defaultBonuses: [{ name: 'Bono Alimentación', amount: 200 }],
            defaultDeductions: [],
            defaultEmployerLiabilities: []
          }
        ];
        setEmployees(mockEmployees);

        // Mock Payroll Entries
        const mockPayroll: PayrollEntry[] = [
          {
            id: 'PAY-202310-001',
            employeeName: 'Juan Pérez',
            employeeId: 'V-12345678',
            storeId: 'S101',
            month: '2023-10',
            baseSalary: 1000,
            bonuses: [{ name: 'Bono Alimentación', amount: 200 }],
            deductions: [
              { name: 'SSO (4%)', amount: 35.00 }, // Error: should be 40.00
              { name: 'RPE (0.5%)', amount: 5.00 },
              { name: 'FAOV / LPH (1%)', amount: 12.00 },
              { name: 'INCES (0.5%)', amount: 5.00 }
            ],
            employerLiabilities: [
              { name: 'SSO Patronal (9%)', amount: 90.00 },
              { name: 'RPE Patronal (2%)', amount: 20.00 },
              { name: 'FAOV Patronal (2%)', amount: 24.00 },
              { name: 'INCES Patronal (2%)', amount: 20.00 },
              { name: 'Fondo de Pensiones (9%)', amount: 108.00 }
            ],
            totalWorkerNet: 1143.00,
            totalEmployerCost: 1405.00,
            status: 'PROCESADO',
            submittedDate: '2023-10-31T10:00:00Z'
          }
        ];
        setPayrollEntries(mockPayroll);
      } else {
        const data = await api.getPayments();
        setPayments(data.sort((a,b) => new Date(b.submittedDate).getTime() - new Date(a.submittedDate).getTime()));
        
        // Cargar empleados
        const employeesData = await api.getEmployees();
        setEmployees(employeesData);

        // Cargar histórico de nómina
        const payrollData = await api.getPayrollEntries();
        setPayrollEntries(payrollData.sort((a: any, b: any) => new Date(b.submittedDate).getTime() - new Date(a.submittedDate).getTime()));

        const settings = await api.getSettings();
        if (settings && settings.exchangeRate) {
          setExchangeRate(settings.exchangeRate);
          setExchangeRateInput(settings.exchangeRate);
          localStorage.setItem('fiscal_exchange_rate', settings.exchangeRate.toString());
        }
      }
    } catch (error) {
      setNotification('❌ Error conectando con Google Sheets');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetupDatabase = async () => {
    if (isDemoMode) {
      setNotification('✅ Base de datos configurada (Modo Demo)');
      return;
    }
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

  const handleNewPayment = async (paymentData: any) => {
    setIsLoading(true);
    const isUpdate = !!paymentData.id;
    
    const log: AuditLog = {
      date: new Date().toISOString(),
      action: isUpdate ? 'CORRECCION' : 'CREACION',
      actorName: currentUser?.name || 'Usuario', 
      role: currentUser?.role || Role.ADMIN,
      note: isUpdate ? 'Pago corregido tras devolución' : undefined
    };

    let receiptUrl = paymentData.id ? payments.find(p => p.id === paymentData.id)?.receiptUrl : undefined;
    if (paymentData.file) {
        try {
            receiptUrl = await fileToBase64(paymentData.file);
        } catch (e) {
            console.error("Error converting file", e);
        }
    }

    let justificationFileUrl = paymentData.id ? payments.find(p => p.id === paymentData.id)?.justificationFileUrl : undefined;
    if (paymentData.justificationFile) {
        try {
            justificationFileUrl = await fileToBase64(paymentData.justificationFile);
        } catch (e) {
            console.error("Error converting justification file", e);
        }
    }

    const paymentToSave: Payment = {
      id: paymentData.id || `PAG-${Math.floor(Math.random() * 10000)}`,
      storeId: paymentData.storeId,
      storeName: STORES.find(s => s.id === paymentData.storeId)?.name || 'Tienda Desconocida',
      userId: currentUser?.id || 'U-UNK',
      category: paymentData.category,
      specificType: paymentData.specificType,
      amount: paymentData.amount,
      dueDate: paymentData.dueDate,
      paymentDate: paymentData.paymentDate,
      status: PaymentStatus.PENDING, // Always reset to pending on correction/creation
      submittedDate: isUpdate ? (payments.find(p => p.id === paymentData.id)?.submittedDate || new Date().toISOString()) : new Date().toISOString(),
      notes: paymentData.notes,
      history: isUpdate 
        ? [...(payments.find(p => p.id === paymentData.id)?.history || []), log]
        : [log],
      receiptUrl: receiptUrl,
      justificationFileUrl: justificationFileUrl,
      // Soporte Data
      documentDate: paymentData.documentDate,
      documentAmount: paymentData.documentAmount,
      documentName: paymentData.documentName
    };
    
    if(paymentData.originalBudget) paymentToSave.originalBudget = paymentData.originalBudget;
    if(paymentData.isOverBudget) paymentToSave.isOverBudget = paymentData.isOverBudget;
    if(paymentData.justification) paymentToSave.justification = paymentData.justification;

    try {
        if (isUpdate) {
            if (!isDemoMode) await api.updatePayment(paymentToSave);
            setPayments(prev => prev.map(p => p.id === paymentToSave.id ? paymentToSave : p));
            setNotification('✅ Pago corregido y enviado a revisión.');
        } else {
            if (!isDemoMode) await api.createPayment(paymentToSave);
            setPayments(prev => [paymentToSave, ...prev]);
            setNotification('✅ Pago guardado en Google Sheets.');
        }
        setIsFormOpen(false);
        setEditingPayment(null);
    } catch (error) {
        setNotification(`❌ Error ${isUpdate ? 'actualizando' : 'guardando'} pago.`);
    } finally {
        setIsLoading(false);
        setTimeout(() => setNotification(null), 3000);
    }
  };

  const handleApprove = async (id: string, newDueDate?: string, newBudgetAmount?: number) => {
      setIsLoading(true);
      const paymentToUpdate = payments.find(p => p.id === id);
      if (paymentToUpdate) {
        let actionNote = undefined;
        let actionType: 'APROBACION' | 'ACTUALIZACION' = 'APROBACION';
        const notes = [];

        if (newDueDate && newDueDate !== paymentToUpdate.dueDate) {
            notes.push(`Fecha Vencimiento: ${paymentToUpdate.dueDate} ➔ ${newDueDate}`);
        }

        if (newBudgetAmount !== undefined && newBudgetAmount !== paymentToUpdate.originalBudget) {
            notes.push(`Presupuesto: ${paymentToUpdate.originalBudget || 'N/A'} ➔ ${newBudgetAmount}`);
        }

        if (notes.length > 0) {
            actionNote = notes.join(' | ');
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
            originalBudget: newBudgetAmount !== undefined ? newBudgetAmount : paymentToUpdate.originalBudget,
            history: paymentToUpdate.history ? [...paymentToUpdate.history, log] : [log]
        };

        if (newBudgetAmount !== undefined) {
            updatedPayment.isOverBudget = paymentToUpdate.amount > newBudgetAmount;
        }

        try {
            if (!isDemoMode) await api.updatePayment(updatedPayment);
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

  const handleApproveAll = async () => {
      setIsLoading(true);
      const pendingPayments = filteredPayments.filter(p => 
          p.status === PaymentStatus.PENDING || 
          p.status === PaymentStatus.UPLOADED || 
          p.status === PaymentStatus.OVERDUE
      );
      
      if (pendingPayments.length === 0) {
          setIsLoading(false);
          setNotification('No hay pagos pendientes para aprobar.');
          setTimeout(() => setNotification(null), 3000);
          return;
      }

      const log: AuditLog = {
          date: new Date().toISOString(),
          action: 'APROBACION_MASIVA',
          actorName: currentUser?.name || 'Auditor',
          role: currentUser?.role || Role.AUDITOR,
          note: `Aprobación masiva de ${pendingPayments.length} pagos`
      };

      const updatedPayments = pendingPayments.map(p => ({
          ...p,
          status: PaymentStatus.APPROVED,
          history: p.history ? [...p.history, log] : [log]
      }));

      try {
          if (!isDemoMode) {
              for (const p of updatedPayments) {
                  await api.updatePayment(p);
              }
          }
          setPayments(prev => prev.map(p => {
              const updated = updatedPayments.find(up => up.id === p.id);
              return updated ? updated : p;
          }));
          setNotification(`✅ ${pendingPayments.length} pagos aprobados.`);
      } catch (error) {
          setNotification('❌ Error en aprobación masiva.');
      } finally {
          setIsLoading(false);
          setTimeout(() => setNotification(null), 3000);
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
            if (!isDemoMode) await api.updatePayment(updatedPayment);
            setPayments(prev => prev.map(p => p.id === id ? updatedPayment : p));
            setNotification(`Pago ${id} Rechazado y Sincronizado`);

            // Enviar Notificación Push
            if (pushPermission === 'granted') {
              const title = `⚠️ Pago Devuelto para Corrección`;
              const options = {
                body: `El pago ${id} (${paymentToUpdate.storeName}) fue devuelto por el auditor. Razón: ${reason}`,
                icon: '/icons/icon-192x192.png', // Asegúrate que este ícono exista en /public
                badge: '/icons/badge.png',
                vibrate: [200, 100, 200],
                tag: `payment-rejected-${id}`,
              };
              navigator.serviceWorker.ready.then(registration => {
                registration.showNotification(title, options);
              });
            }

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

  // Filter data based on user's assigned store
  const userStoreId = currentUser?.storeId;
  const filteredPayments = userStoreId ? payments.filter(p => p.storeId === userStoreId) : payments;
  const filteredPayrollEntries = userStoreId ? payrollEntries.filter(p => p.storeId === userStoreId) : payrollEntries;
  const filteredEmployees = userStoreId ? employees.filter(e => e.storeId === userStoreId) : employees;

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
        const rejectedPayments = filteredPayments.filter(p => p.status === PaymentStatus.REJECTED);
        return (
          <div className="flex-1 h-full overflow-y-auto bg-white dark:bg-slate-950 custom-scrollbar">
            {rejectedPayments.length > 0 && (
              <div className="p-4 bg-pink-50 dark:bg-pink-900/20 border-b border-pink-100 dark:border-pink-900/30">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-pink-100 dark:bg-pink-900/40 rounded-full flex items-center justify-center text-pink-600 dark:text-pink-400">
                      <AlertCircle size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-pink-900 dark:text-pink-100">Pagos Devueltos ({rejectedPayments.length})</h3>
                      <p className="text-xs text-pink-700 dark:text-pink-300">Tienes pagos que requieren corrección según el auditor.</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowRejectedModal(true)}
                    className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors shadow-sm"
                  >
                    Ver y Corregir
                  </button>
                </div>
              </div>
            )}
            <PaymentForm 
              initialData={editingPayment}
              payments={filteredPayments}
              onSubmit={handleNewPayment} 
              onCancel={() => {
                setEditingPayment(null);
              }} 
              isEmbedded={true}
              currentUser={currentUser}
            />
            
            {/* Modal for Rejected Payments */}
            {showRejectedModal && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                <div className="bg-white dark:bg-slate-900 w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-300">
                  <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-pink-100 dark:bg-pink-900/40 rounded-full flex items-center justify-center text-pink-600 dark:text-pink-400">
                        <RefreshCw size={20} />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Corrección de Pagos Devueltos</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Selecciona un pago para editar y reenviar al auditor.</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        setShowRejectedModal(false);
                        setEditingPayment(null);
                      }}
                      className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors"
                    >
                      <X size={20} />
                    </button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    {editingPayment && editingPayment.status === PaymentStatus.REJECTED ? (
                      <div className="space-y-4">
                        <button 
                          onClick={() => setEditingPayment(null)}
                          className="flex items-center gap-2 text-blue-600 font-bold text-sm hover:underline mb-4"
                        >
                          <ChevronLeft size={16} />
                          Volver a la lista
                        </button>
                        <PaymentForm 
                          initialData={editingPayment}
                          payments={filteredPayments}
                          onSubmit={async (data) => {
                            await handleNewPayment(data);
                            setEditingPayment(null);
                            // If no more rejected payments, close modal
                            if (rejectedPayments.length <= 1) {
                              setShowRejectedModal(false);
                            }
                          }}
                          onCancel={() => setEditingPayment(null)}
                          isEmbedded={true}
                          currentUser={currentUser}
                        />
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {rejectedPayments.map(payment => (
                          <div 
                            key={payment.id}
                            onClick={() => setEditingPayment(payment)}
                            className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl hover:border-pink-500 dark:hover:border-pink-500 cursor-pointer transition-all group"
                          >
                            <div className="flex justify-between items-start mb-3">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{payment.category}</span>
                              <span className="bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400 text-[10px] font-bold px-2 py-0.5 rounded-full">Devuelto</span>
                            </div>
                            <h4 className="font-bold text-slate-900 dark:text-white mb-1 group-hover:text-pink-600 transition-colors">{payment.specificType}</h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">{payment.storeName} • {payment.dueDate}</p>
                            
                            <div className="p-2 bg-pink-50 dark:bg-pink-900/10 rounded-lg border border-pink-100 dark:border-pink-900/20 mb-3">
                              <p className="text-[10px] text-pink-700 dark:text-pink-300 italic">
                                <span className="font-bold">Motivo:</span> {payment.rejectionReason || 'No especificado'}
                              </p>
                            </div>
                            
                            <div className="flex items-center justify-between mt-auto">
                              <span className="font-bold text-slate-900 dark:text-white">${payment.amount.toLocaleString()}</span>
                              <div className="flex items-center gap-1 text-pink-600 font-bold text-xs">
                                Corregir <ChevronRight size={14} />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      case 'approvals':
        return <Approvals payments={filteredPayments} onApprove={handleApprove} onReject={handleReject} currentUser={currentUser} onApproveAll={handleApproveAll} />;
      case 'reports':
        return <Reports payments={filteredPayments} currentUser={currentUser} />;
      case 'presidency':
        return <PresidencyDashboard payments={filteredPayments} payrollEntries={filteredPayrollEntries} currentUser={currentUser} onApproveAll={handleApproveAll} />;
      case 'network':
        return <StoreStatus payments={filteredPayments} userStoreId={userStoreId} />;
      case 'calendar':
        return <CalendarView payments={filteredPayments} payrollEntries={filteredPayrollEntries} />;
      case 'payroll':
        return (
          <PayrollModule 
            entries={filteredPayrollEntries} 
            employees={filteredEmployees}
            onAddEntry={handleAddPayrollEntry} 
            onUpdateEntry={handleUpdatePayrollEntry}
            onDeleteEntry={handleDeletePayrollEntry} 
            onAddEmployee={handleAddEmployee}
            onUpdateEmployee={handleUpdateEmployee}
            onDeleteEmployee={handleDeleteEmployee}
            currentUser={currentUser}
          />
        );
      case 'notifications':
        return (
          <NotificationsView 
            onBack={() => setCurrentView('payments')} 
            payments={filteredPayments}
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
                   <UserManagement currentUser={currentUser} />
                </div>
              </div>
            )}

            <div className="grid gap-6">
                <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                   <h3 className="font-bold mb-4 flex items-center gap-2 text-blue-400">
                       <DollarSign size={20} /> Configuración Financiera
                   </h3>
                   <div className="max-w-xs">
                       <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Tasa de Cambio ($ / Bs.)</label>
                       <div className="flex gap-2">
                           <div className="relative flex-1">
                               <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold">Bs.</span>
                               <input 
                                   type="number" 
                                   step="0.01"
                                   value={exchangeRateInput}
                                   onChange={(e) => {
                                       const val = Number(e.target.value);
                                       setExchangeRateInput(val);
                                       setExchangeRate(val);
                                       localStorage.setItem('fiscal_exchange_rate', val.toString());
                                   }}
                                   className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white outline-none focus:ring-2 focus:ring-blue-500"
                               />
                           </div>
                           <button 
                               onClick={async () => {
                                   setIsLoading(true);
                                   try {
                                       const currentSettings = await api.getSettings() || {
                                           whatsappEnabled: false,
                                           whatsappPhone: '',
                                           whatsappGatewayUrl: '',
                                           daysBeforeWarning: 5,
                                           daysBeforeCritical: 2,
                                           emailEnabled: false,
                                           exchangeRate: 1
                                       };
                                       await api.saveSettings({ ...currentSettings, exchangeRate: exchangeRateInput });
                                       setExchangeRate(exchangeRateInput);
                                       localStorage.setItem('fiscal_exchange_rate', exchangeRateInput.toString());
                                       setNotification('✅ Tasa de cambio guardada y actualizada');
                                   } catch (e) {
                                       setNotification('❌ Error actualizando tasa');
                                   } finally {
                                       setIsLoading(false);
                                   }
                               }}
                               className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg text-sm font-bold transition-colors"
                           >
                               Actualizar
                           </button>
                       </div>
                       <p className="text-[10px] text-slate-500 mt-2 italic">
                           Esta tasa se utiliza para mostrar los montos equivalentes en Bolívares en todo el sistema.
                       </p>
                   </div>
                </div>

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
    const allViews = ['payments', 'network', 'calendar', 'notifications', 'settings', 'approvals', 'reports', 'payroll', 'presidency'];
    const allowedViews: Record<Role, string[]> = {
      [Role.SUPER_ADMIN]: allViews,
      [Role.ADMIN]: ['payments', 'network', 'calendar', 'notifications', 'settings', 'payroll'],
      [Role.AUDITOR]: ['approvals', 'calendar', 'notifications', 'settings'],
      [Role.PRESIDENT]: ['reports', 'network', 'notifications', 'settings', 'payroll', 'presidency']
    };
    if (!allowedViews[currentUser.role].includes(currentView)) {
      setCurrentView(getInitialView(currentUser.role));
    }
  }, [currentView, currentUser]);

  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLogin} isDemoMode={isDemoMode} />;
  }

  return (
    <ExchangeRateProvider exchangeRate={exchangeRate}>
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
          onPaymentsClick={() => {
            setEditingPayment(null);
            setIsFormOpen(false); // Asegurar que el modal esté cerrado ya que está embebido
          }}
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
          {isFormOpen && currentView !== 'payments' && (
             <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
                <div className="bg-white dark:bg-slate-950 w-full max-w-6xl h-[90vh] sm:h-auto sm:max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl shadow-2xl ring-1 ring-black/5">
                    <PaymentForm 
                      initialData={editingPayment}
                      payments={filteredPayments}
                      onSubmit={handleNewPayment} 
                      onCancel={() => {
                        setIsFormOpen(false);
                        setEditingPayment(null);
                      }} 
                      currentUser={currentUser}
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
    </ExchangeRateProvider>
  );
}

export default App;
