
import React, { useState, useMemo, useEffect } from 'react';
import { Payment, PaymentStatus } from '../types';
import { 
  CheckCircle2, 
  XCircle, 
  Maximize2, 
  Minimize2, 
  Clock, 
  CalendarDays, 
  Receipt, 
  AlertCircle, 
  Search, 
  ArrowUpDown, 
  Filter, 
  Building2, 
  CheckSquare,
  FileText,
  ExternalLink,
  AlertTriangle,
  Calendar,
  FileWarning,
  RefreshCw,
  CalendarClock,
  ArrowRight,
  Eye,
  TrendingUp,
  Target,
  DollarSign,
  PieChart
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
            return new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime();
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
  }, [selectedId]);

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

  // Helper para detectar PDF (URL o Base64)
  const isPdf = (url?: string) => {
      if (!url) return false;
      const lowerUrl = url.toLowerCase();
      return lowerUrl.includes('application/pdf') || lowerUrl.endsWith('.pdf') || lowerUrl.startsWith('data:application/pdf');
  };

  // Helper para abrir Base64 en nueva pestaña de forma segura
  const openInNewTab = (url: string) => {
      const win = window.open();
      if (win) {
          win.document.write(
              `<iframe src="${url}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`
          );
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

  // --- ANÁLISIS FINANCIERO PARA AUDITORÍA ---
  const budgetAnalysis = useMemo(() => {
      if (!selectedPayment || !selectedPayment.isOverBudget) return null;
      
      const amount = Number(selectedPayment.amount);
      const budget = Number(selectedPayment.originalBudget);

      // Si no tenemos presupuesto base, retornamos null
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
                        
                        {/* Column 1: Receipt & Visuals */}
                        <div className="space-y-6 order-2 xl:order-1">
                            <div className={`relative bg-slate-950 rounded-2xl overflow-hidden border border-slate-700 shadow-2xl transition-all duration-300 group ${isImageFullscreen ? 'fixed inset-4 z-50 order-none m-0 h-auto' : 'h-[500px]'}`}>
                                
                                {selectedPayment.receiptUrl ? (
                                    <>
                                        {/* Barra de herramientas superior dentro del visor */}
                                        <div className="absolute top-0 left-0 right-0 z-20 p-2 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
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
                                        <div className="w-full h-full flex items-center justify-center bg-slate-900">
                                            {isPdf(selectedPayment.receiptUrl) ? (
                                                <object
                                                    data={selectedPayment.receiptUrl}
                                                    type="application/pdf"
                                                    className="w-full h-full rounded-b-xl"
                                                >
                                                    <div className="flex flex-col items-center justify-center h-full text-slate-400 p-6 text-center">
                                                        <FileText size={48} className="mb-4 text-slate-600" />
                                                        <p className="mb-4">Este navegador no soporta la visualización directa de este PDF.</p>
                                                        <button 
                                                            onClick={() => openInNewTab(selectedPayment.receiptUrl!)}
                                                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors"
                                                        >
                                                            Abrir Documento
                                                        </button>
                                                    </div>
                                                </object>
                                            ) : (
                                                <img 
                                                    src={selectedPayment.receiptUrl} 
                                                    alt="Recibo" 
                                                    className="max-w-full max-h-full object-contain"
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

                        {/* Column 2: Data Validation */}
                        <div className="space-y-6 order-1 xl:order-2">
                            
                            {/* TARJETA DE AUDITORIA DE EXCESO (REDISEÑADA) */}
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

                                            {/* Barra de Progreso Visual */}
                                            <div className="w-full h-3 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden flex">
                                                <div className="h-full bg-slate-400 dark:bg-slate-600" style={{ width: `${100 / (1 + (budgetAnalysis.percent/100))}%` }}></div>
                                                <div className="h-full bg-red-500 animate-pulse" style={{ width: `${(budgetAnalysis.percent / (100 + budgetAnalysis.percent)) * 100}%` }}></div>
                                            </div>
                                            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                                                <span>0%</span>
                                                <span className="text-red-500 font-bold">+${budgetAnalysis.excess.toLocaleString()} USD</span>
                                            </div>

                                            {/* Sección de Justificación y Evidencia */}
                                            {(selectedPayment.justification || selectedPayment.justificationFileUrl) && (
                                                <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-red-100 dark:border-red-900/30 shadow-inner">
                                                    <p className="text-[10px] text-slate-400 uppercase font-bold mb-2 flex items-center gap-1">
                                                        <FileText size={10} /> Justificación del Gerente
                                                    </p>
                                                    <p className="text-sm italic text-slate-700 dark:text-slate-300 border-l-2 border-red-300 pl-3 mb-3">
                                                        "{selectedPayment.justification || 'Sin nota explicativa'}"
                                                    </p>
                                                    
                                                    {selectedPayment.justificationFileUrl && (
                                                        <button 
                                                            onClick={(e) => {
                                                              e.stopPropagation(); 
                                                              openInNewTab(selectedPayment.justificationFileUrl!);
                                                            }}
                                                            className="w-full flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors group"
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded">
                                                                    <FileWarning size={14} />
                                                                </div>
                                                                <span className="text-xs font-bold text-slate-700 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                                                    Ver Soporte de Excedente
                                                                </span>
                                                            </div>
                                                            <ExternalLink size={12} className="text-slate-400" />
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="text-center p-4">
                                            <p className="text-xs text-red-600 dark:text-red-400">Datos de presupuesto base no disponibles para cálculo detallado.</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Amount Card */}
                            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-1">Monto Declarado</p>
                                <div className="flex items-baseline gap-2">
                                    <span className={`text-4xl font-bold tracking-tight ${selectedPayment.isOverBudget ? 'text-red-600' : 'text-slate-900 dark:text-white'}`}>
                                        ${selectedPayment.amount.toLocaleString()}
                                    </span>
                                    <span className="text-slate-400 font-mono">USD</span>
                                </div>
                                <div className="mt-4 flex flex-col gap-4 text-sm border-t border-slate-100 dark:border-slate-800 pt-4">
                                    
                                    {/* Display only Date (Not editable here) */}
                                    <div className="flex justify-between items-center px-2">
                                        <div>
                                            <p className="text-xs text-slate-400 uppercase">Vencimiento</p>
                                            <p className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1 mt-1">
                                                <CalendarDays size={14} className="text-red-500" /> {selectedPayment.dueDate}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-400 uppercase text-right">Pagado El</p>
                                            <p className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1 mt-1 justify-end">
                                                <Clock size={14} className="text-green-500" /> {selectedPayment.paymentDate || 'N/A'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Details Card */}
                            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                                <div>
                                    <p className="text-xs text-slate-400 uppercase font-bold mb-2">Concepto del Pago</p>
                                    <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                        <Receipt className="text-slate-400 mt-0.5" size={18} />
                                        <div>
                                            <p className="text-sm font-bold text-slate-900 dark:text-white">{selectedPayment.specificType}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">{selectedPayment.category}</p>
                                        </div>
                                    </div>
                                </div>

                                {selectedPayment.notes && (
                                    <div>
                                        <p className="text-xs text-slate-400 uppercase font-bold mb-2">Notas del Cargador</p>
                                        <div className="p-3 bg-blue-50 dark:bg-blue-900/10 text-blue-800 dark:text-blue-300 text-sm rounded-lg border border-blue-100 dark:border-blue-800 italic">
                                            "{selectedPayment.notes}"
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Audit Checklist (Simulation) */}
                            <div className="bg-slate-100 dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-200 dark:border-slate-800">
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                    <CheckSquare size={16} className="text-slate-400" />
                                    Validación de Auditoría
                                </h3>
                                <div className="space-y-3">
                                    {['Monto coincide con recibo', 'Fecha de pago legible', 'Concepto fiscal correcto', 'Sello bancario visible'].map((item, idx) => (
                                        <label key={idx} className="flex items-center gap-3 cursor-pointer group">
                                            <input type="checkbox" className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600" />
                                            <span className="text-sm text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200 transition-colors">{item}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Action Area */}
                            <div className="pt-4">
                                {isRejecting ? (
                                    <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-2xl p-4 animate-in slide-in-from-bottom-2 fade-in">
                                        <label className="text-sm font-bold text-red-700 dark:text-red-400 mb-2 flex items-center gap-2">
                                            <AlertCircle size={16} />
                                            Especifique motivo del rechazo
                                        </label>
                                        <textarea 
                                            autoFocus
                                            value={rejectionNote}
                                            onChange={(e) => setRejectionNote(e.target.value)}
                                            className="w-full bg-white dark:bg-slate-900 border border-red-200 dark:border-red-800 text-slate-900 dark:text-white rounded-xl p-3 text-sm focus:ring-2 focus:ring-red-500 outline-none resize-none h-24 mb-3"
                                            placeholder="El comprobante no es legible..."
                                        />
                                        <div className="flex gap-3">
                                             <button 
                                                onClick={() => setIsRejecting(false)}
                                                className="flex-1 py-2 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
                                            >
                                                Cancelar
                                            </button>
                                            <button 
                                                onClick={handleRejectClick}
                                                disabled={!rejectionNote.trim()}
                                                className="flex-1 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-200 dark:shadow-red-900/20"
                                            >
                                                Confirmar Rechazo
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-3">
                                        <div className="flex gap-4">
                                            <button 
                                                onClick={handleRejectClick}
                                                className="flex-1 py-4 bg-white dark:bg-slate-800 text-red-600 dark:text-red-400 font-bold rounded-xl border-2 border-slate-100 dark:border-slate-800 hover:border-red-100 dark:hover:border-red-900/30 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all flex items-center justify-center gap-2"
                                            >
                                                <XCircle size={20} />
                                                Rechazar
                                            </button>
                                            <button 
                                                onClick={handleInitialApproveClick}
                                                className={`flex-[2] py-4 ${
                                                    selectedPayment.isOverBudget 
                                                        ? 'bg-orange-600 hover:bg-orange-700' 
                                                        : 'bg-blue-600 hover:bg-blue-700'
                                                } text-white font-bold rounded-xl shadow-lg shadow-blue-200 dark:shadow-blue-900/30 transition-all active:scale-[0.99] flex items-center justify-center gap-2`}
                                            >
                                                <CheckCircle2 size={20} />
                                                {selectedPayment.isOverBudget ? 'Aprobar (Con Exceso)' : 'Aprobar Pago'}
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
            <div className="flex flex-col items-center justify-center h-full text-slate-300 dark:text-slate-600 p-8">
                <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800/50 rounded-full flex items-center justify-center mb-6">
                    <Filter size={48} className="opacity-50" />
                </div>
                <h2 className="text-xl font-bold text-slate-700 dark:text-slate-400">Seleccione un pago</h2>
                <p className="text-slate-500 dark:text-slate-500 mt-2 text-center max-w-md">
                    Seleccione un ítem de la cola de la izquierda para ver los detalles, validar el comprobante y gestionar su aprobación.
                </p>
            </div>
        )}
      </div>
    </div>
  );
};
