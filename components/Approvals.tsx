
import React, { useState, useMemo, useEffect } from 'react';
import { Payment, PaymentStatus } from '../types';
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
  User,
  History,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';

interface ApprovalsProps {
  payments: Payment[];
  onApprove: (id: string, newDueDate?: string) => void;
  onReject: (id: string, reason: string) => void;
}

type SortOption = 'urgency' | 'date_desc' | 'amount_desc' | 'amount_asc';

export const Approvals: React.FC<ApprovalsProps> = ({ payments, onApprove, onReject }) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [rejectionNote, setRejectionNote] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('urgency');
  const [isImageFullscreen, setIsImageFullscreen] = useState(false);
  
  // --- Checklist State ---
  const [checklist, setChecklist] = useState({
    amountVerified: false,
    receiptValid: false,
    dateCorrect: false,
    storeConceptMatch: false,
    stampLegible: false
  });

  const isChecklistComplete = Object.values(checklist).every(val => val === true);

  // --- Estados para el Modal de Confirmación de Fecha ---
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [confirmationDate, setConfirmationDate] = useState('');

  // Filtrado y Ordenamiento
  const processedPayments = useMemo(() => {
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

  useEffect(() => {
    setRejectionNote('');
    setIsRejecting(false);
    setIsImageFullscreen(false);
    setShowApprovalModal(false); 
    setChecklist({
      amountVerified: false,
      receiptValid: false,
      dateCorrect: false,
      storeConceptMatch: false,
      stampLegible: false
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
          setShowApprovalModal(true);
      }
  };

  const handleConfirmApproval = () => {
      if (selectedId && selectedPayment && confirmationDate) {
          const dateToSend = confirmationDate !== selectedPayment.dueDate ? confirmationDate : undefined;
          onApprove(selectedId, dateToSend);
          setShowApprovalModal(false);
          setSelectedId(null);
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

  const getUrgencyDetails = (dueDateStr: string) => {
      const today = new Date();
      today.setHours(0,0,0,0);
      const due = new Date(dueDateStr + 'T00:00:00');
      const diffTime = due.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 0) {
          return { 
              label: `Vencido (${Math.abs(diffDays)}d)`, 
              colorClass: 'text-red-600 bg-red-100 border-red-200 dark:bg-red-900/30 dark:border-red-800 dark:text-red-400',
              borderClass: 'border-l-4 border-l-red-500',
              textClass: 'text-red-600 dark:text-red-400',
              icon: <AlertTriangle size={14} />
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

  const budgetAnalysis = useMemo(() => {
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
                                  {selectedPayment.dueDate}
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
                    const urgency = getUrgencyDetails(payment.dueDate);
                    
                    return (
                        <div 
                            key={payment.id}
                            onClick={() => setSelectedId(payment.id)}
                            className={`group relative p-3 rounded-xl border transition-all cursor-pointer hover:shadow-lg ${urgency.borderClass} ${
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
                                         ) : (
                                             <span className="text-[9px] bg-slate-100 text-slate-500 px-1 rounded uppercase font-bold tracking-tight">Pendiente</span>
                                         )}
                                     </div>
                                     <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm truncate leading-tight">
                                        {payment.storeName}
                                     </h3>
                                </div>
                                <div className="text-right shrink-0">
                                    <div className="flex items-center justify-end gap-1">
                                        <span className="text-sm font-bold text-slate-900 dark:text-white font-mono tracking-tight">
                                            ${payment.amount.toLocaleString()}
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
                                    Vence: {payment.dueDate}
                                </div>
                            </div>
                        </div>
                    );
                })
            )}
        </div>
      </div>

      {/* RIGHT PANEL: Detail View */}
      <div className={`flex-1 bg-slate-50 dark:bg-slate-950 relative flex flex-col h-full ${!selectedId ? 'hidden lg:flex' : 'flex'}`}>
        {selectedPayment ? (
            <>
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
                                <span className="text-blue-600 dark:text-blue-400 font-medium">Verificando Pago</span>
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                         <div className="text-right hidden sm:block">
                            <p className="text-[10px] text-slate-400 uppercase font-bold">Fecha de Carga</p>
                            <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                                {new Date(selectedPayment.submittedDate).toLocaleString()}
                            </p>
                         </div>
                    </div>
                </div>

                {/* Content Scrollable Area */}
                <div className="flex-1 overflow-y-auto p-4 lg:p-8 custom-scrollbar">
                    <div className="max-w-5xl mx-auto grid grid-cols-1 xl:grid-cols-2 gap-8">
                        
                        {/* Column 1: Receipt & Visuals (MEJORADO) */}
                        <div className="space-y-6 order-2 xl:order-1">
                            <div className={`relative bg-slate-950 rounded-2xl overflow-hidden border border-slate-700 shadow-2xl transition-all duration-300 group ${isImageFullscreen ? 'fixed inset-4 z-50 order-none m-0 h-auto' : 'h-[500px] flex flex-col'}`}>
                                
                                {selectedPayment.receiptUrl ? (
                                    <>
                                        {/* Barra de herramientas superior dentro del visor */}
                                        <div className="absolute top-0 left-0 right-0 z-20 p-2 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                                            <div className="pointer-events-auto bg-black/40 backdrop-blur-md px-3 py-1 rounded-full text-xs text-slate-200 border border-white/10 flex items-center gap-2">
                                                {isPdf(selectedPayment.receiptUrl) ? <FileText size={12}/> : <Receipt size={12}/>}
                                                {isPdf(selectedPayment.receiptUrl) ? 'Documento PDF' : 'Imagen de Recibo'}
                                            </div>
                                            <div className="flex gap-2 pointer-events-auto">
                                                <button 
                                                    onClick={() => openInNewTab(selectedPayment.receiptUrl!)}
                                                    className="p-2 bg-black/50 text-white rounded-lg backdrop-blur-sm hover:bg-black/70 border border-white/10"
                                                    title="Abrir en nueva pestaña"
                                                >
                                                    <ExternalLink size={16} />
                                                </button>
                                                <button 
                                                    onClick={() => setIsImageFullscreen(!isImageFullscreen)}
                                                    className="p-2 bg-black/50 text-white rounded-lg backdrop-blur-sm hover:bg-black/70 border border-white/10"
                                                    title={isImageFullscreen ? "Minimizar" : "Maximizar"}
                                                >
                                                    {isImageFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Renderizado del Archivo */}
                                        <div className="flex-1 w-full h-full flex items-center justify-center bg-slate-900 relative">
                                            {isPdf(selectedPayment.receiptUrl) ? (
                                                <div className="w-full h-full flex flex-col">
                                                     <embed
                                                        src={selectedPayment.receiptUrl}
                                                        type="application/pdf"
                                                        className="w-full h-full"
                                                    />
                                                    {/* Fallback visible si el embed falla o no es soportado */}
                                                    <div className="absolute bottom-4 left-0 right-0 flex justify-center pointer-events-none">
                                                        <span className="bg-black/60 text-white px-3 py-1 rounded-full text-xs backdrop-blur-sm pointer-events-auto">
                                                            Si no carga, <a href="#" onClick={(e) => { e.preventDefault(); openInNewTab(selectedPayment.receiptUrl!); }} className="underline text-blue-300">clic aquí</a>
                                                        </span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <img 
                                                    src={selectedPayment.receiptUrl} 
                                                    alt="Recibo" 
                                                    className="max-w-full max-h-full object-contain"
                                                    onError={(e) => {
                                                        // Fallback visual si la imagen falla
                                                        e.currentTarget.style.display = 'none';
                                                        const parent = e.currentTarget.parentElement;
                                                        if (parent) {
                                                            parent.innerHTML = `
                                                                <div class="flex flex-col items-center text-slate-500">
                                                                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                                                                    <span class="mt-2 text-sm">Error cargando imagen</span>
                                                                    <button class="mt-2 text-xs text-blue-400 underline">Abrir enlace directo</button>
                                                                </div>
                                                            `;
                                                            const btn = parent.querySelector('button');
                                                            if(btn) btn.onclick = () => openInNewTab(selectedPayment.receiptUrl!);
                                                        }
                                                    }}
                                                />
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 bg-slate-950/50">
                                        <AlertCircle size={48} className="mb-4 opacity-50" />
                                        <p className="text-sm font-medium">Sin comprobante digital</p>
                                    </div>
                                )}
                            </div>
                            {/* Backdrop for fullscreen */}
                            {isImageFullscreen && <div className="fixed inset-0 bg-black/90 z-40 backdrop-blur-sm" onClick={() => setIsImageFullscreen(false)}></div>}
                        </div>

                        {/* Column 2: Data Validation & History */}
                        <div className="space-y-6 order-1 xl:order-2">
                            
                            {/* TARJETA DE AUDITORIA DE EXCESO */}
                            {selectedPayment.isOverBudget && (
                                <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-3xl p-5 shadow-lg shadow-red-500/5 animate-in slide-in-from-top-4">
                                    <div className="flex items-center gap-3 mb-4 pb-3 border-b border-red-200 dark:border-red-900/50">
                                        <div className="bg-red-500 text-white p-2 rounded-lg">
                                            <AlertTriangle size={20} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-red-800 dark:text-red-300 text-sm">Alerta de Desviación Presupuestaria</h3>
                                            <p className="text-xs text-red-600 dark:text-red-400/80">Requiere aprobación extraordinaria</p>
                                        </div>
                                    </div>

                                    {budgetAnalysis ? (
                                        <div className="space-y-4">
                                            {/* Grilla de Métricas Financieras */}
                                            <div className="grid grid-cols-3 gap-3">
                                                <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-red-100 dark:border-red-900/30 text-center">
                                                    <div className="text-[10px] uppercase font-bold text-slate-400 mb-1 flex justify-center items-center gap-1">
                                                        <Target size={10} /> Presupuesto
                                                    </div>
                                                    <div className="font-mono text-slate-700 dark:text-slate-300 font-bold">
                                                        ${budgetAnalysis.budget.toLocaleString()}
                                                    </div>
                                                </div>
                                                <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-red-100 dark:border-red-900/30 text-center">
                                                    <div className="text-[10px] uppercase font-bold text-slate-400 mb-1 flex justify-center items-center gap-1">
                                                        <DollarSign size={10} /> Real
                                                    </div>
                                                    <div className="font-mono text-slate-900 dark:text-white font-bold">
                                                        ${Number(selectedPayment.amount).toLocaleString()}
                                                    </div>
                                                </div>
                                                <div className="bg-red-100 dark:bg-red-900/40 p-3 rounded-xl border border-red-200 dark:border-red-800 text-center">
                                                    <div className="text-[10px] uppercase font-bold text-red-600 dark:text-red-300 mb-1 flex justify-center items-center gap-1">
                                                        <TrendingUp size={10} /> Desviación
                                                    </div>
                                                    <div className="font-mono text-red-600 dark:text-red-400 font-bold">
                                                        +{budgetAnalysis.percent.toFixed(1)}%
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Justificación del Usuario */}
                                            {selectedPayment.justification && (
                                                <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-red-100 dark:border-red-900/30">
                                                    <p className="text-xs font-bold text-slate-500 uppercase mb-1">Justificación del solicitante:</p>
                                                    <p className="text-sm text-slate-700 dark:text-slate-300 italic">"{selectedPayment.justification}"</p>
                                                    {selectedPayment.justificationFileUrl && (
                                                        <button 
                                                            onClick={() => openInNewTab(selectedPayment.justificationFileUrl!)}
                                                            className="mt-2 text-xs text-blue-500 hover:text-blue-600 flex items-center gap-1 font-bold"
                                                        >
                                                            <ExternalLink size={12} /> Ver soporte adicional
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-red-500">Error calculando desviación.</p>
                                    )}
                                </div>
                            )}

                            {/* Checklist de Auditoría */}
                            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <CheckSquare size={14} className="text-blue-500" />
                                    Checklist de Verificación Obligatoria
                                </label>
                                <div className="space-y-3">
                                    {[
                                        { id: 'amountVerified', label: 'Monto verificado vs Comprobante' },
                                        { id: 'receiptValid', label: 'Comprobante legible y válido' },
                                        { id: 'stampLegible', label: 'Sello legible del soporte de pago' },
                                        { id: 'dateCorrect', label: 'Fecha de vencimiento correcta' },
                                        { id: 'storeConceptMatch', label: 'Tienda y concepto coinciden' }
                                    ].map((item) => (
                                        <button
                                            key={item.id}
                                            onClick={() => handleCheckItem(item.id as keyof typeof checklist)}
                                            className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                                                checklist[item.id as keyof typeof checklist]
                                                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300'
                                                : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800 text-slate-500 hover:border-slate-200'
                                            }`}
                                        >
                                            <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                                                checklist[item.id as keyof typeof checklist]
                                                ? 'bg-blue-600 border-blue-600 text-white'
                                                : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700'
                                            }`}>
                                                {checklist[item.id as keyof typeof checklist] && <CheckCircle2 size={14} />}
                                            </div>
                                            <span className="text-sm font-medium">{item.label}</span>
                                        </button>
                                    ))}
                                </div>
                                {!isChecklistComplete && (
                                    <p className="text-[10px] text-orange-500 font-bold mt-3 flex items-center gap-1">
                                        <AlertCircle size={12} />
                                        Complete todos los puntos para habilitar la aprobación.
                                    </p>
                                )}
                            </div>

                            {/* Detalles Principales */}
                            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Concepto de Pago</label>
                                    <p className="text-lg font-bold text-slate-900 dark:text-white mt-1">{selectedPayment.specificType}</p>
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded text-xs font-medium">
                                            {selectedPayment.category}
                                        </span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                                     <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase">Fecha de Pago</label>
                                        <div className="flex items-center gap-2 mt-1 text-slate-700 dark:text-slate-200 text-sm font-medium">
                                            <Calendar size={14} className="text-slate-400" />
                                            {selectedPayment.paymentDate}
                                        </div>
                                     </div>
                                     <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase">Fecha de Vencimiento</label>
                                        <div className="flex items-center gap-2 mt-1 text-slate-700 dark:text-slate-200 text-sm font-medium">
                                            <Clock size={14} className="text-slate-400" />
                                            {selectedPayment.dueDate}
                                        </div>
                                     </div>
                                </div>
                            </div>

                            {/* Notas */}
                            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Observaciones</label>
                                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                                    {selectedPayment.notes || "Sin observaciones adicionales."}
                                </p>
                            </div>

                            {/* --- HISTORIAL DE AUDITORÍA (TIMELINE) --- */}
                            {selectedPayment.history && selectedPayment.history.length > 0 && (
                                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                        <History size={14} /> Línea de Tiempo del Proceso
                                    </label>
                                    
                                    <div className="relative pl-4 space-y-6 before:content-[''] before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100 dark:before:bg-slate-800">
                                        {selectedPayment.history.map((log, index) => (
                                            <div key={index} className="relative">
                                                {/* Punto de la línea de tiempo */}
                                                <div className={`absolute -left-[21px] mt-1.5 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 ${
                                                    log.action === 'CREACION' ? 'bg-blue-500' :
                                                    log.action === 'APROBACION' ? 'bg-green-500' :
                                                    log.action === 'RECHAZO' ? 'bg-red-500' : 'bg-orange-400'
                                                }`}></div>
                                                
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                                            log.action === 'CREACION' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' :
                                                            log.action === 'APROBACION' ? 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400' :
                                                            log.action === 'RECHAZO' ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400' :
                                                            'bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400'
                                                        }`}>
                                                            {log.action}
                                                        </span>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <User size={12} className="text-slate-400" />
                                                            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{log.actorName}</span>
                                                            <span className="text-xs text-slate-400">({log.role})</span>
                                                        </div>
                                                        {log.note && (
                                                            <p className="text-xs text-slate-500 mt-1 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg italic">
                                                                "{log.note}"
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="text-[10px] text-slate-400 whitespace-nowrap">
                                                        {new Date(log.date).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Botones de Acción */}
                            <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                                {!isRejecting ? (
                                    <div className="flex gap-4">
                                        <button 
                                            onClick={handleRejectClick}
                                            className="flex-1 py-4 text-red-600 dark:text-red-400 font-bold bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-2xl transition-colors flex items-center justify-center gap-2"
                                        >
                                            <RefreshCw size={20} />
                                            Devolver
                                        </button>
                                        <button 
                                            onClick={handleInitialApproveClick}
                                            disabled={!isChecklistComplete}
                                            className={`flex-[2] py-4 font-bold rounded-2xl shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${
                                                isChecklistComplete 
                                                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200 dark:shadow-blue-900/30' 
                                                : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                                            }`}
                                        >
                                            <ShieldCheck size={20} />
                                            Validar y Aprobar
                                        </button>
                                    </div>
                                ) : (
                                    <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-2xl border border-red-100 dark:border-red-900/30 animate-in fade-in slide-in-from-bottom-2">
                                        <h3 className="text-sm font-bold text-red-700 dark:text-red-400 mb-2">Observaciones para el Administrador</h3>
                                        <textarea 
                                            value={rejectionNote}
                                            onChange={(e) => setRejectionNote(e.target.value)}
                                            placeholder="Indique qué debe corregirse (ej. Comprobante ilegible, monto incorrecto...)"
                                            className="w-full p-3 bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900 rounded-xl text-sm mb-3 focus:ring-2 focus:ring-red-500 outline-none text-slate-900 dark:text-white"
                                            rows={3}
                                            autoFocus
                                        ></textarea>
                                        <div className="flex gap-3">
                                            <button 
                                                onClick={() => setIsRejecting(false)}
                                                className="flex-1 py-2 text-slate-600 dark:text-slate-400 font-bold text-sm bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700"
                                            >
                                                Cancelar
                                            </button>
                                            <button 
                                                onClick={handleRejectClick}
                                                className="flex-1 py-2 bg-red-600 text-white font-bold text-sm rounded-xl hover:bg-red-700 shadow-md"
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
