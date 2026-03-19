
import React from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Payment, PaymentStatus, Role, User } from '../types';
import { formatDate, formatDateTime } from '../src/utils';
import { 
  CheckCircle2, 
  XCircle, 
  Maximize2, 
  Minimize2, 
  Clock, 
  Calendar, 
  Receipt, 
  AlertCircle, 
  Search, 
  ArrowUpDown, 
  CheckSquare,
  FileText,
  ExternalLink,
  AlertTriangle,
  CalendarClock,
  ArrowRight,
  TrendingUp,
  Target,
  DollarSign,
  Building2,
  User as UserIcon,
  History,
  ShieldCheck,
  RefreshCw,
  Download,
  Plus,
  Check
} from 'lucide-react';
import { useExchangeRate } from '../contexts/ExchangeRateContext';

interface ApprovalsProps {
  payments: Payment[];
  onApprove: (id: string, newDueDate?: string, newBudgetAmount?: number) => void;
  onReject: (id: string, reason: string) => void;
  currentUser?: User;
  onApproveAll: () => void;
}

type SortOption = 'urgency' | 'date_desc' | 'amount_desc' | 'amount_asc';

export const Approvals: React.FC<ApprovalsProps> = ({ payments, onApprove, onReject, currentUser, onApproveAll }) => {
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [rejectionNote, setRejectionNote] = React.useState('');
  const [isRejecting, setIsRejecting] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [sortOption, setSortOption] = React.useState<SortOption>('urgency');
  const [isImageFullscreen, setIsImageFullscreen] = React.useState(false);
  const [imageError, setImageError] = React.useState(false);
  const { exchangeRate } = useExchangeRate();
  
  // --- Checklist State ---
  const [checklist, setChecklist] = React.useState({
    receiptValid: false,
    stampLegible: false,
    storeConceptMatch: false,
    datesApproved: false,
    proposedDatesApproved: false,
    amountsApproved: false,
    proposedAmountApproved: false,
    observationsApproved: false
  });

  const isChecklistComplete = Object.values(checklist).every(val => val === true);

  // --- Estados para el Modal de Confirmación de Fecha ---
  const [showApprovalModal, setShowApprovalModal] = React.useState(false);
  const [confirmationDate, setConfirmationDate] = React.useState('');
  const [updateBudget, setUpdateBudget] = React.useState(false);
  const [confirmationBudget, setConfirmationBudget] = React.useState<number | ''>('');
  const [approvedPaymentId, setApprovedPaymentId] = React.useState<string | null>(null);
  const [isExporting, setIsExporting] = React.useState(false);

  const handleDownloadAuditPDF = async (payment: Payment) => {
    if (!payment.history) return;
    setIsExporting(true);
    
    try {
        const doc = new jsPDF();
        
        doc.setFontSize(18);
        doc.text(`Historial de Auditoría - Pago #${payment.id.slice(-6)}`, 14, 20);
        
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(`Tienda: ${payment.storeName}`, 14, 30);
        doc.text(`Concepto: ${payment.specificType}`, 14, 35);
        doc.text(`Monto: $${payment.amount.toLocaleString()}`, 14, 40);
        doc.text(`Fecha de Generación: ${formatDateTime(new Date())}`, 14, 45);

        const tableData = payment.history.map(log => [
            formatDateTime(log.date),
            log.action,
            log.actorName,
            log.role,
            log.note || '-'
        ]);

        autoTable(doc, {
            startY: 55,
            head: [['Fecha/Hora', 'Acción', 'Usuario', 'Rol', 'Observación']],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: [30, 41, 59] },
            styles: { fontSize: 8 },
        });

        doc.save(`Auditoria_Pago_${payment.id.slice(-6)}.pdf`);
    } catch (error) {
        console.error("Error generating audit PDF:", error);
        alert("Error al generar el PDF de auditoría.");
    } finally {
        setIsExporting(false);
    }
  };

  // Filtrado y Ordenamiento
  const processedPayments = React.useMemo(() => {
    let filtered = payments.filter(p => 
      (p.status === PaymentStatus.PENDING || p.status === PaymentStatus.UPLOADED || p.status === PaymentStatus.OVERDUE) &&
      (p.storeName.toLowerCase().includes(searchTerm.toLowerCase()) || 
       p.specificType.toLowerCase().includes(searchTerm.toLowerCase()) ||
       p.id.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return filtered.sort((a, b) => {
      switch (sortOption) {
        case 'urgency': 
            return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        case 'date_desc': 
            return new Date(b.submittedDate).getTime() - new Date(a.submittedDate).getTime();
        case 'amount_desc': return b.amount - a.amount;
        case 'amount_asc': return a.amount - b.amount;
        default: return 0;
      }
    });
  }, [payments, searchTerm, sortOption]);

  const selectedPayment = payments.find(p => p.id === selectedId);

  React.useEffect(() => {
    setRejectionNote('');
    setIsRejecting(false);
    setIsImageFullscreen(false);
    setImageError(false);
    setShowApprovalModal(false); 
    setChecklist({
      receiptValid: false,
      stampLegible: false,
      storeConceptMatch: false,
      datesApproved: false,
      proposedDatesApproved: false,
      amountsApproved: false,
      proposedAmountApproved: false,
      observationsApproved: false
    });
  }, [selectedId]);

  const handleCheckItem = (item: keyof typeof checklist) => {
    setChecklist(prev => ({ ...prev, [item]: !prev[item] }));
  };

  const handleRejectClick = () => {
    if (!isRejecting) {
        setIsRejecting(true);
    } else {
        if (selectedId && rejectionNote.trim()) {
            onReject(selectedId, rejectionNote);
            setSelectedId(null);
        }
    }
  };

  const handleInitialApproveClick = () => {
      if (selectedPayment) {
          setConfirmationDate(selectedPayment.dueDate);
          setUpdateBudget(false);
          setConfirmationBudget(selectedPayment.originalBudget || '');
          setShowApprovalModal(true);
      }
  };

  const handleConfirmApproval = () => {
      if (selectedId && selectedPayment && confirmationDate) {
          const dateToSend = confirmationDate !== selectedPayment.dueDate ? confirmationDate : undefined;
          const budgetToSend = updateBudget && confirmationBudget !== '' ? Number(confirmationBudget) : undefined;
          
          setApprovedPaymentId(selectedId);
          setShowApprovalModal(false);
          
          setTimeout(() => {
              onApprove(selectedId, dateToSend, budgetToSend);
              setSelectedId(null);
              setApprovedPaymentId(null);
          }, 1500);
      }
  };

  const isPdf = (url?: string) => {
      if (!url) return false;
      const lowerUrl = url.toLowerCase();
      // Verificación robusta para data URIs y URLs normales
      return lowerUrl.includes('application/pdf') || lowerUrl.endsWith('.pdf') || lowerUrl.includes('type=pdf');
  };

  const openInNewTab = (url: string) => {
    const win = window.open();
    if (win) {
        // Usar iframe para PDF suele forzar el visor nativo del navegador
        const isPDF = isPdf(url);
        const content = isPDF 
            ? `<iframe src="${url}" style="width:100%; height:100%; border:none;"></iframe>`
            : `<img src="${url}" style="max-width:100%; margin:auto; display:block;" />`;
            
        win.document.write(`
            <html>
                <head><title>Visor de Documento - FiscalCtl</title></head>
                <body style="margin:0; background-color:#1e293b; height:100vh; display:flex;">
                    ${content}
                </body>
            </html>
        `);
    }
  };

  const getUrgencyDetails = (dueDateStr: string, status?: PaymentStatus) => {
      const today = new Date();
      today.setHours(0,0,0,0);
      const due = new Date(dueDateStr + 'T00:00:00');
      const diffTime = due.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      const isOverdue = diffDays < 0 || status === PaymentStatus.OVERDUE;

      if (isOverdue) {
          return { 
              label: `Vencido (${Math.abs(diffDays)}d)`, 
              colorClass: 'text-red-600 bg-red-100 border-red-200 dark:bg-red-900/30 dark:border-red-800 dark:text-red-400',
              borderClass: 'border-l-4 border-l-red-600',
              textClass: 'text-red-600 dark:text-red-400',
              cardBg: 'bg-red-50/50 dark:bg-red-900/10',
              badge: <span className="text-[9px] bg-red-600 text-white px-1.5 py-0.5 rounded uppercase font-black tracking-tighter animate-pulse shadow-sm">Crítico</span>,
              icon: <AlertTriangle size={14} className="animate-bounce" />
          };
      } else if (diffDays === 0) {
          return { 
              label: 'Vence Hoy', 
              colorClass: 'text-orange-600 bg-orange-100 border-orange-200 dark:bg-orange-900/30 dark:border-orange-800 dark:text-orange-400',
              borderClass: 'border-l-4 border-l-orange-500',
              textClass: 'text-orange-600 dark:text-orange-400',
              icon: <Clock size={14} />
          };
      } else if (diffDays <= 3) {
          return { 
              label: `${diffDays} días`, 
              colorClass: 'text-yellow-600 bg-yellow-100 border-yellow-200 dark:bg-yellow-900/30 dark:border-yellow-800 dark:text-yellow-400',
              borderClass: 'border-l-4 border-l-yellow-500',
              textClass: 'text-yellow-600 dark:text-yellow-400',
              icon: <Clock size={14} />
          };
      } else {
          return { 
              label: 'A tiempo', 
              colorClass: 'text-slate-600 bg-slate-100 border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400',
              borderClass: 'border-l-4 border-l-green-500',
              textClass: 'text-slate-500 dark:text-slate-400',
              icon: <Calendar size={14} />
          };
      }
  };

  const isDateModified = selectedPayment && confirmationDate !== selectedPayment.dueDate;

  const budgetAnalysis = React.useMemo(() => {
      if (!selectedPayment || !selectedPayment.isOverBudget) return null;
      
      const amount = Number(selectedPayment.amount);
      const budget = Number(selectedPayment.originalBudget);

      if (!budget || isNaN(budget) || budget === 0) return null;

      const excess = amount - budget;
      const percent = (excess / budget) * 100;
      
      return {
          budget,
          excess,
          percent
      };
  }, [selectedPayment]);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 relative">
      
      {/* --- MODAL DE CONFIRMACIÓN DE FECHA --- */}
      {showApprovalModal && selectedPayment && (
          <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
              <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                  <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <CalendarClock className="text-blue-500" />
                          Confirmar Aprobación
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                          Verifique la fecha de vencimiento antes de finalizar.
                      </p>
                  </div>
                  
                  <div className="p-6 space-y-6">
                      <div className="flex flex-col gap-2">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Fecha Registrada</label>
                          <div className="flex items-center justify-between p-3 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                              <span className="font-mono text-slate-500 dark:text-slate-400 strike-through decoration-slate-400">
                                  {formatDate(selectedPayment.dueDate)}
                              </span>
                              {isDateModified && (
                                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                                    <ArrowRight size={16} />
                                    <span className="font-bold">{confirmationDate}</span>
                                </div>
                              )}
                          </div>
                      </div>

                      <div className="flex flex-col gap-2">
                          <label className="text-sm font-bold text-slate-700 dark:text-slate-200">
                              ¿Desea cambiar la fecha de vencimiento?
                          </label>
                          <input 
                              type="date" 
                              value={confirmationDate}
                              onChange={(e) => setConfirmationDate(e.target.value)}
                              className={`w-full p-4 rounded-xl border-2 outline-none transition-all font-bold ${
                                  isDateModified 
                                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' 
                                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:border-blue-400'
                              }`}
                          />
                          {isDateModified ? (
                              <p className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1 mt-1 font-medium">
                                  <RefreshCw size={12} /> Se actualizará la fecha en el registro.
                              </p>
                          ) : (
                              <p className="text-xs text-slate-400 mt-1">
                                  Mantenga la fecha actual si es correcta.
                              </p>
                          )}
                      </div>

                      <div className="flex flex-col gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                          <label className="flex items-center gap-2 cursor-pointer">
                              <input 
                                  type="checkbox" 
                                  checked={updateBudget}
                                  onChange={(e) => setUpdateBudget(e.target.checked)}
                                  className="w-4 h-4 text-blue-600 bg-slate-100 border-slate-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-slate-800 focus:ring-2 dark:bg-slate-700 dark:border-slate-600"
                              />
                              <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                                  ¿Desea actualizar el monto de presupuesto?
                              </span>
                          </label>
                          
                          {updateBudget && (
                              <div className="mt-2">
                                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Nuevo Presupuesto</label>
                                  <div className="relative">
                                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                                      <input 
                                          type="number" 
                                          value={confirmationBudget}
                                          onChange={(e) => setConfirmationBudget(e.target.value ? Number(e.target.value) : '')}
                                          placeholder="0.00"
                                          className="w-full pl-8 p-4 rounded-xl border-2 border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 outline-none transition-all font-bold focus:border-blue-600"
                                      />
                                  </div>
                                  <p className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1 mt-2 font-medium">
                                      <RefreshCw size={12} /> Se actualizará el presupuesto original.
                                  </p>
                              </div>
                          )}
                      </div>
                  </div>

                  <div className="p-5 border-t border-slate-100 dark:border-slate-800 flex gap-3 bg-slate-50 dark:bg-slate-900/50">
                      <button 
                          onClick={() => setShowApprovalModal(false)}
                          className="flex-1 py-3 text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors"
                      >
                          Cancelar
                      </button>
                      <button 
                          onClick={handleConfirmApproval}
                          disabled={!confirmationDate}
                          className="flex-[2] py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-200 dark:shadow-blue-900/30 transition-all active:scale-[0.99] flex items-center justify-center gap-2"
                      >
                          <CheckCircle2 size={18} />
                          {isDateModified ? 'Confirmar y Aprobar' : 'Aprobar Pago'}
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* LEFT PANEL: List & Filters */}
      <div className={`w-full lg:w-[400px] xl:w-[450px] flex flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-all ${selectedId ? 'hidden lg:flex' : 'flex'}`}>
        
        {/* Header Section */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 space-y-4">
            <div className="flex justify-between items-center">
                <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <CheckSquare className="text-blue-600 dark:text-blue-400" />
                    Auditoría
                </h1>
                <div className="flex items-center gap-2">
                    {(currentUser?.role === Role.PRESIDENT || currentUser?.role === Role.SUPER_ADMIN) && (
                        <button 
                            onClick={onApproveAll}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                        >
                            <CheckCircle2 size={14} />
                            Aprobar Todo
                        </button>
                    )}
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Pendientes</span>
                    <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2.5 py-0.5 rounded-full text-xs font-bold border border-blue-200 dark:border-blue-800">
                        {processedPayments.length}
                    </span>
                </div>
            </div>

            {/* Search & Filter Bar */}
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <input 
                        type="text" 
                        placeholder="Buscar ID, Tienda, Concepto..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-slate-100"
                    />
                    <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
                </div>
                <div className="relative group">
                    <button className="h-full px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 text-xs font-bold">
                        <ArrowUpDown size={14} />
                        <span className="hidden sm:inline">Orden</span>
                    </button>
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-800 shadow-xl rounded-lg border border-slate-100 dark:border-slate-700 hidden group-hover:block z-10 p-1">
                        <button onClick={() => setSortOption('urgency')} className={`w-full text-left px-3 py-2 text-xs rounded-md flex items-center justify-between ${sortOption === 'urgency' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 font-bold' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
                            <span>Por Urgencia</span>
                            {sortOption === 'urgency' && <CheckCircle2 size={12} />}
                        </button>
                        <button onClick={() => setSortOption('date_desc')} className={`w-full text-left px-3 py-2 text-xs rounded-md flex items-center justify-between ${sortOption === 'date_desc' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 font-bold' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
                            <span>Más Recientes</span>
                            {sortOption === 'date_desc' && <CheckCircle2 size={12} />}
                        </button>
                        <button onClick={() => setSortOption('amount_desc')} className={`w-full text-left px-3 py-2 text-xs rounded-md flex items-center justify-between ${sortOption === 'amount_desc' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 font-bold' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
                            <span>Mayor Monto</span>
                            {sortOption === 'amount_desc' && <CheckCircle2 size={12} />}
                        </button>
                    </div>
                </div>
            </div>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar bg-slate-50 dark:bg-slate-950/50">
            {processedPayments.length === 0 ? (
                 <div className="flex flex-col items-center justify-center h-64 text-center opacity-60">
                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                        <CheckCircle2 className="text-slate-300 dark:text-slate-500" size={32} />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Cola vacía</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-500 mt-1 max-w-[200px]">No hay pagos pendientes para revisar.</p>
                 </div>
            ) : (
                processedPayments.map(payment => {
                    const urgency = getUrgencyDetails(payment.dueDate, payment.status);
                    
                    return (
                        <div 
                            key={payment.id}
                            onClick={() => setSelectedId(payment.id)}
                            className={`group relative p-3 rounded-xl border transition-all cursor-pointer hover:shadow-lg ${urgency.borderClass} ${urgency.cardBg || ''} ${
                                selectedId === payment.id 
                                ? 'bg-white dark:bg-slate-800 border-blue-500/50 shadow-md ring-1 ring-blue-500/20 z-10' 
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-slate-600'
                            }`}
                        >
                            <div className="flex justify-between items-start mb-1">
                                <div className="flex flex-col min-w-0 pr-2">
                                     <div className="flex items-center gap-1.5 mb-0.5">
                                         <span className="text-[10px] font-mono font-bold text-slate-400">{payment.id}</span>
                                         {payment.status === PaymentStatus.UPLOADED ? (
                                             <span className="text-[9px] bg-blue-50 text-blue-600 border border-blue-100 px-1 rounded uppercase font-bold tracking-tight">Nuevo</span>
                                         ) : payment.status === PaymentStatus.OVERDUE ? (
                                             urgency.badge || <span className="text-[9px] bg-red-100 text-red-600 px-1 rounded uppercase font-bold tracking-tight">Vencido</span>
                                         ) : (
                                             <span className="text-[9px] bg-slate-100 text-slate-500 px-1 rounded uppercase font-bold tracking-tight">Pendiente</span>
                                         )}
                                     </div>
                                     <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm truncate leading-tight">
                                        {payment.storeName}
                                     </h3>
                                </div>
                                <div className="text-right shrink-0">
                                    <div className="flex flex-col items-end gap-0.5">
                                        <span className="text-sm font-bold text-slate-900 dark:text-white font-mono tracking-tight">
                                            ${payment.amount.toLocaleString()}
                                        </span>
                                        <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                                            Bs. {(payment.amount * exchangeRate).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                    {payment.isOverBudget && (
                                        <div className="flex items-center justify-end gap-1 text-[10px] text-red-500 font-bold mt-0.5">
                                            <AlertTriangle size={10} />
                                            <span>Excede</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            <div className="mb-3">
                                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{payment.specificType}</p>
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-slate-50 dark:border-slate-800/50">
                                <div className={`flex items-center gap-1.5 text-xs font-bold ${urgency.textClass}`}>
                                    {urgency.icon}
                                    <span>{urgency.label}</span>
                                </div>
                                <div className="text-[10px] text-slate-400 font-medium">
                                    Vence: {formatDate(payment.dueDate)}
                                </div>
                            </div>
                        </div>
                    );
                })
            )}
        </div>
      </div>

      {/* RIGHT PANEL: Detail View */}
      <div className={`flex-1 bg-gray-100 dark:bg-gray-800 relative flex flex-col h-full ${!selectedId ? 'hidden lg:flex' : 'flex'}`}>
        {selectedPayment ? (
            <>
                {/* Overlay de Aprobación Animado */}
                {approvedPaymentId === selectedPayment.id && (
                    <div className="absolute inset-0 z-50 bg-white/90 dark:bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in duration-300">
                        <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4 animate-bounce">
                            <CheckCircle2 className="text-green-500 dark:text-green-400" size={48} />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">¡Pago Aprobado!</h2>
                        <p className="text-slate-500 dark:text-slate-400 mt-2">El pago ha sido validado correctamente.</p>
                    </div>
                )}

                {/* Detail Header */}
                <div className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 shrink-0">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setSelectedId(null)} className="lg:hidden p-2 -ml-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500">
                            <ArrowUpDown className="rotate-90" size={20} />
                        </button>
                        <div>
                            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <Building2 size={16} className="text-blue-500" />
                                {selectedPayment.storeName}
                            </h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                <span>Ref: {selectedPayment.id}</span>
                                <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                {selectedPayment.status === PaymentStatus.OVERDUE || (new Date(selectedPayment.dueDate + 'T00:00:00').getTime() < new Date().setHours(0,0,0,0)) ? (
                                    <span className="text-red-600 dark:text-red-400 font-black uppercase animate-pulse flex items-center gap-1">
                                        <AlertTriangle size={12} />
                                        Pago Vencido - Crítico
                                    </span>
                                ) : (
                                    <span className="text-blue-600 dark:text-blue-400 font-medium">Verificando Pago</span>
                                )}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                         <div className="text-right hidden sm:block">
                            <p className="text-[10px] text-slate-400 uppercase font-bold">Fecha de Carga</p>
                            <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                                {formatDateTime(selectedPayment.submittedDate)}
                            </p>
                         </div>
                    </div>
                </div>

                {/* Banner de Urgencia Crítica */}
                {(selectedPayment.status === PaymentStatus.OVERDUE || (new Date(selectedPayment.dueDate + 'T00:00:00').getTime() < new Date().setHours(0,0,0,0))) && (
                    <div className="bg-red-600 text-white px-6 py-2 flex items-center justify-between shadow-lg z-10">
                        <div className="flex items-center gap-2 text-xs sm:text-sm font-bold">
                            <AlertTriangle size={18} className="animate-bounce" />
                            <span className="tracking-wide">ATENCIÓN: ESTE PAGO ESTÁ VENCIDO Y REQUIERE ACCIÓN INMEDIATA</span>
                        </div>
                        <div className="hidden md:flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase bg-white/20 px-2 py-0.5 rounded border border-white/30">Prioridad Máxima</span>
                        </div>
                    </div>
                )}

                {/* Content Scrollable Area */}
                <div className="flex-1 overflow-y-auto p-6 lg:p-10 custom-scrollbar bg-white dark:bg-slate-900">
                    <div className="max-w-[1200px] mx-auto">
                        {/* Header: SOLO PARA AUDITOR */}
                        <div className="mb-8">
                            <h1 className="text-3xl font-black uppercase tracking-tighter text-black dark:text-white">
                                SOLO PARA AUDITOR
                            </h1>
                        </div>

                        <div className="grid grid-cols-1 xl:grid-cols-[350px_1fr] gap-10">
                            
                            {/* LEFT COLUMN: Document & Checklist */}
                            <div className="space-y-8">
                                {/* CARGA DE DOCUMENTOS */}
                                <div className="flex flex-col h-full min-h-[600px]">
                                    <div className="border-2 border-black dark:border-white p-2 flex flex-col h-full">
                                        <div className="text-[10px] font-black uppercase mb-2">CARGA DE DOCUMENTOS</div>
                                        <div className="flex-1 bg-gray-50 dark:bg-slate-800 relative overflow-hidden group">
                                            {selectedPayment.receiptUrl ? (
                                                <>
                                                    <div className="absolute top-2 right-2 z-20 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button 
                                                            onClick={() => openInNewTab(selectedPayment.receiptUrl!)}
                                                            className="p-1.5 bg-black text-white rounded border border-white/20"
                                                        >
                                                            <ExternalLink size={14} />
                                                        </button>
                                                        <button 
                                                            onClick={() => setIsImageFullscreen(true)}
                                                            className="p-1.5 bg-black text-white rounded border border-white/20"
                                                        >
                                                            <Maximize2 size={14} />
                                                        </button>
                                                    </div>
                                                    
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        {isPdf(selectedPayment.receiptUrl) ? (
                                                            <embed
                                                                src={selectedPayment.receiptUrl}
                                                                type="application/pdf"
                                                                className="w-full h-full"
                                                            />
                                                        ) : (
                                                            <img 
                                                                src={selectedPayment.receiptUrl} 
                                                                alt="Recibo" 
                                                                className="max-w-full max-h-full object-contain"
                                                                onError={() => setImageError(true)}
                                                            />
                                                        )}
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                                                    <FileText size={48} strokeWidth={1} />
                                                    <p className="text-[10px] font-bold uppercase mt-2">Sin Documento</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* CHECKLIST: APROBADA */}
                                    <div className="mt-6">
                                        <div className="text-[10px] font-black uppercase mb-1">APROBADA</div>
                                        <div className="border-2 border-black dark:border-white divide-y-2 divide-black dark:divide-white">
                                            {[
                                                { id: 'receiptValid', label: 'COMPROBANTES DE PAGOS Y SOPORTES LEGIBLES' },
                                                { id: 'stampLegible', label: 'SELLOS LEGIBLES' },
                                                { id: 'storeConceptMatch', label: 'TIENDA Y CONCEPTO COINCIDEN' }
                                            ].map((item) => (
                                                <div key={item.id} className="flex">
                                                    <button 
                                                        onClick={() => handleCheckItem(item.id as keyof typeof checklist)}
                                                        className={`w-10 h-10 border-r-2 border-black dark:border-white flex items-center justify-center transition-colors ${checklist[item.id as keyof typeof checklist] ? 'bg-black text-white' : 'bg-white'}`}
                                                    >
                                                        {checklist[item.id as keyof typeof checklist] && <Check size={24} strokeWidth={4} />}
                                                    </button>
                                                    <div className="flex-1 px-3 flex items-center text-[10px] font-black leading-tight uppercase">
                                                        {item.label}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* RIGHT COLUMN: Tables & Data */}
                            <div className="space-y-6">
                                {/* CONCEPTO DE PAGO */}
                                <div>
                                    <div className="text-[10px] font-bold text-slate-500 uppercase mb-1">CONCEPTO DE PAGO</div>
                                    <h2 className="text-xl font-black uppercase tracking-tight text-black dark:text-white">
                                        {selectedPayment.id.slice(-6)} - {selectedPayment.specificType}
                                    </h2>
                                    <div className="text-xs font-bold text-slate-600 dark:text-slate-400 mt-1 uppercase">
                                        {selectedPayment.category}
                                    </div>
                                </div>

                                {/* TABLE 1: PRESUPUESTO VS ACTUAL */}
                                <div className="flex gap-0">
                                    <div className="flex-1 border-2 border-black dark:border-white overflow-hidden">
                                        <div className="grid grid-cols-3 divide-x-2 divide-black dark:divide-white border-b-2 border-black dark:border-white">
                                            <div className="col-span-2 bg-gray-100 dark:bg-slate-800 text-[10px] font-black text-center py-1 uppercase">PRESUPUESTO</div>
                                            <div className="bg-gray-100 dark:bg-slate-800 text-[10px] font-black text-center py-1 uppercase">ACTUAL</div>
                                        </div>
                                        <div className="grid grid-cols-3 divide-x-2 divide-black dark:divide-white border-b-2 border-black dark:border-white">
                                            <div className="text-[9px] font-black text-center py-1 uppercase px-1">FECHA DE PAGO</div>
                                            <div className="text-[9px] font-black text-center py-1 uppercase px-1">FECHA DE VENCIMIENTO</div>
                                            <div className="text-[9px] font-black text-center py-1 uppercase px-1">FECHA DE DOCUMENTO</div>
                                        </div>
                                        <div className="grid grid-cols-3 divide-x-2 divide-black dark:divide-white font-mono text-xs">
                                            <div className="text-center py-3">{formatDate(selectedPayment.paymentDate)}</div>
                                            <div className="text-center py-3">{formatDate(selectedPayment.dueDate)}</div>
                                            <div className="text-center py-3">{selectedPayment.documentDate ? formatDate(selectedPayment.documentDate) : '-'}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 ml-4 self-center shrink-0">
                                        <button 
                                            onClick={() => handleCheckItem('datesApproved')}
                                            className={`w-8 h-8 border-2 border-black dark:border-white flex items-center justify-center transition-colors ${checklist.datesApproved ? 'bg-black text-white' : 'bg-white'}`}
                                        >
                                            {checklist.datesApproved && <Check size={20} strokeWidth={4} />}
                                        </button>
                                        <span className="text-[10px] font-black uppercase tracking-tighter">APROBADA</span>
                                    </div>
                                </div>

                                {/* TABLE 2: NUEVA PROPUESTA DE FECHAS */}
                                <div className="flex gap-0">
                                    <div className="flex-1 border-2 border-black dark:border-white overflow-hidden">
                                        <div className="bg-gray-100 dark:bg-slate-800 text-[10px] font-black text-center py-1 uppercase border-b-2 border-black dark:border-white">NUEVA PROPUESTA DE FECHAS</div>
                                        <div className="grid grid-cols-3 divide-x-2 divide-black dark:divide-white border-b-2 border-black dark:border-white">
                                            <div className="text-[9px] font-black text-center py-1 uppercase px-1">FECHA DE PAGO</div>
                                            <div className="text-[9px] font-black text-center py-1 uppercase px-1">DIAS DE VENCIMIENTO</div>
                                            <div className="text-[9px] font-black text-center py-1 uppercase px-1">FECHA DE VENCIMIENTO</div>
                                        </div>
                                        <div className="grid grid-cols-3 divide-x-2 divide-black dark:divide-white font-mono text-xs">
                                            <div className="text-center py-3">{formatDate(selectedPayment.paymentDate)}</div>
                                            <div className="text-center py-3">{selectedPayment.daysToExpire || '0'}</div>
                                            <div className="text-center py-3">{formatDate(selectedPayment.dueDate)}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 ml-4 self-center shrink-0">
                                        <button 
                                            onClick={() => handleCheckItem('proposedDatesApproved')}
                                            className={`w-8 h-8 border-2 border-black dark:border-white flex items-center justify-center transition-colors ${checklist.proposedDatesApproved ? 'bg-black text-white' : 'bg-white'}`}
                                        >
                                            {checklist.proposedDatesApproved && <Check size={20} strokeWidth={4} />}
                                        </button>
                                        <span className="text-[10px] font-black uppercase tracking-tighter">APROBADA</span>
                                    </div>
                                </div>

                                {/* TABLE 3: MONTOS Y DESVIACION */}
                                <div className="flex gap-0">
                                    <div className="flex-1 border-2 border-black dark:border-white overflow-hidden">
                                        <div className="grid grid-cols-3 divide-x-2 divide-black dark:divide-white border-b-2 border-black dark:border-white">
                                            <div className="text-[9px] font-black text-center py-1 uppercase px-1">MONTO PRESUPUESTO</div>
                                            <div className="text-[9px] font-black text-center py-1 uppercase px-1">MONTO DOCUMENTO</div>
                                            <div className="text-[9px] font-black text-center py-1 uppercase px-1">DESVIACION</div>
                                        </div>
                                        <div className="grid grid-cols-3 divide-x-2 divide-black dark:divide-white font-mono text-xs">
                                            <div className="text-center py-3">${(selectedPayment.originalBudget || 0).toLocaleString()}</div>
                                            <div className="text-center py-3">${selectedPayment.amount.toLocaleString()}</div>
                                            <div className="text-center py-3 font-bold text-red-600">
                                                {budgetAnalysis ? `+${budgetAnalysis.percent.toFixed(1)}%` : '0%'}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 ml-4 self-center shrink-0">
                                        <button 
                                            onClick={() => handleCheckItem('amountsApproved')}
                                            className={`w-8 h-8 border-2 border-black dark:border-white flex items-center justify-center transition-colors ${checklist.amountsApproved ? 'bg-black text-white' : 'bg-white'}`}
                                        >
                                            {checklist.amountsApproved && <Check size={20} strokeWidth={4} />}
                                        </button>
                                        <span className="text-[10px] font-black uppercase tracking-tighter">APROBADA</span>
                                    </div>
                                </div>

                                {/* TABLE 4: MONTO PROPUESTA */}
                                <div className="flex gap-0">
                                    <div className="flex-1 border-2 border-black dark:border-white overflow-hidden">
                                        <div className="bg-gray-100 dark:bg-slate-800 text-[10px] font-black text-center py-1 uppercase border-b-2 border-black dark:border-white">MONTO PROPUESTA</div>
                                        <div className="text-center py-3 font-mono text-xs">
                                            ${selectedPayment.amount.toLocaleString()}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 ml-4 self-center shrink-0">
                                        <button 
                                            onClick={() => handleCheckItem('proposedAmountApproved')}
                                            className={`w-8 h-8 border-2 border-black dark:border-white flex items-center justify-center transition-colors ${checklist.proposedAmountApproved ? 'bg-black text-white' : 'bg-white'}`}
                                        >
                                            {checklist.proposedAmountApproved && <Check size={20} strokeWidth={4} />}
                                        </button>
                                        <span className="text-[10px] font-black uppercase tracking-tighter">APROBADA</span>
                                    </div>
                                </div>

                                {/* OBSERVACIONES */}
                                <div className="flex gap-0">
                                    <div className="flex-1 border-2 border-black dark:border-white p-3 min-h-[100px]">
                                        <div className="text-[10px] font-black uppercase mb-2">OBSERVACIONES:</div>
                                        <p className="text-xs text-slate-700 dark:text-slate-300 italic">
                                            {selectedPayment.notes || "Sin observaciones adicionales."}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 ml-4 self-start mt-2 shrink-0">
                                        <button 
                                            onClick={() => handleCheckItem('observationsApproved')}
                                            className={`w-8 h-8 border-2 border-black dark:border-white flex items-center justify-center transition-colors ${checklist.observationsApproved ? 'bg-black text-white' : 'bg-white'}`}
                                        >
                                            {checklist.observationsApproved && <Check size={20} strokeWidth={4} />}
                                        </button>
                                        <span className="text-[10px] font-black uppercase tracking-tighter">APROBADA</span>
                                    </div>
                                </div>

                                {/* HISTORIAL DE AUDITORIA */}
                                <div className="border-2 border-black dark:border-white p-3 min-h-[120px]">
                                    <div className="flex justify-between items-center mb-3">
                                        <div className="text-[10px] font-black uppercase">HISTORIAL DE AUDITORIA:</div>
                                        <button 
                                            onClick={() => handleDownloadAuditPDF(selectedPayment)}
                                            className="text-[9px] font-black uppercase underline"
                                        >
                                            Exportar PDF
                                        </button>
                                    </div>
                                    <div className="space-y-2">
                                        {selectedPayment.history?.slice(-3).map((log, idx) => (
                                            <div key={idx} className="text-[10px] flex justify-between border-b border-slate-100 dark:border-slate-800 pb-1 last:border-0">
                                                <span className="font-bold">{log.action} por {log.actorName}</span>
                                                <span className="text-slate-400 font-mono">{formatDateTime(log.date)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* BOTONES DE ACCIÓN */}
                                <div className="pt-6 flex flex-col items-end gap-4">
                                    <div className="flex flex-col items-end gap-2 w-full max-w-md">
                                        <div className="flex gap-4 w-full">
                                            <div className="flex-1 flex flex-col gap-1">
                                                <button 
                                                    onClick={handleRejectClick}
                                                    className="w-full py-4 border-2 border-black dark:border-white text-black dark:text-white font-black uppercase tracking-widest hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all"
                                                >
                                                    DEVOLVER
                                                </button>
                                                <p className="text-[8px] font-bold text-slate-500 leading-tight">
                                                    CON UNA QUE NO SE ENCUENTRE APROBADA AUTOMATICAMENTE SE ACTIVARA DEVOLVER Y SE INICIA VENTANA DE CONVERSACION
                                                </p>
                                            </div>
                                            <div className="flex-1 flex flex-col gap-1">
                                                <button 
                                                    onClick={handleInitialApproveClick}
                                                    disabled={!isChecklistComplete}
                                                    className={`w-full py-4 border-2 border-black dark:border-white font-black uppercase tracking-widest transition-all ${
                                                        isChecklistComplete 
                                                        ? 'bg-black text-white dark:bg-white dark:text-black hover:opacity-80' 
                                                        : 'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed'
                                                    }`}
                                                >
                                                    VALIDAR Y APROBAR
                                                </button>
                                                <p className="text-[8px] font-bold text-slate-500 leading-tight">
                                                    PARA QUE SE PUEDA ACTIVAR LA OPCION DE VALIDAR ES NECESARIO QUE ESTEN APROBADOS LAS 8 ACTIVIDADES.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Rejection Note Area (Inline) */}
                                    {isRejecting && (
                                        <div className="w-full mt-4 p-4 border-2 border-red-600 bg-red-50 dark:bg-red-900/10 animate-in fade-in slide-in-from-top-2">
                                            <div className="text-[10px] font-black text-red-600 uppercase mb-2">OBSERVACIONES PARA EL ADMINISTRADOR:</div>
                                            <textarea 
                                                value={rejectionNote}
                                                onChange={(e) => setRejectionNote(e.target.value)}
                                                placeholder="Indique qué debe corregirse..."
                                                className="w-full p-3 bg-white dark:bg-slate-900 border border-red-300 rounded-none text-xs mb-3 focus:ring-1 focus:ring-red-500 outline-none"
                                                rows={3}
                                                autoFocus
                                            ></textarea>
                                            <div className="flex gap-3">
                                                <button 
                                                    onClick={() => setIsRejecting(false)}
                                                    className="flex-1 py-2 border border-slate-300 text-[10px] font-bold uppercase"
                                                >
                                                    Cancelar
                                                </button>
                                                <button 
                                                    onClick={handleRejectClick}
                                                    className="flex-1 py-2 bg-red-600 text-white text-[10px] font-bold uppercase"
                                                >
                                                    Confirmar Devolución
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </>
        ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center bg-slate-50/50 dark:bg-slate-950/50">
                <div className="w-24 h-24 bg-white dark:bg-slate-900 rounded-full flex items-center justify-center mb-6 shadow-sm border border-slate-100 dark:border-slate-800">
                    <Search size={48} className="text-slate-200 dark:text-slate-700" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Seleccione un pago</h2>
                <p className="max-w-md mx-auto text-slate-500 dark:text-slate-500">
                    Haga clic en cualquier elemento de la lista izquierda para ver sus detalles, comprobar el recibo y realizar la auditoría.
                </p>
            </div>
        )}
      </div>
    </div>
  );
};
