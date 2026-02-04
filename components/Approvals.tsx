
import React, { useState, useMemo } from 'react';
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
  Download,
  CheckSquare,
  History,
  User,
  FileCheck,
  FileX
} from 'lucide-react';

interface ApprovalsProps {
  payments: Payment[];
  onApprove: (id: string) => void;
  onReject: (id: string, reason: string) => void;
}

type SortOption = 'date_asc' | 'date_desc' | 'amount_desc' | 'amount_asc';

export const Approvals: React.FC<ApprovalsProps> = ({ payments, onApprove, onReject }) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [rejectionNote, setRejectionNote] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('date_asc');
  const [isImageFullscreen, setIsImageFullscreen] = useState(false);

  // Filtrado y Ordenamiento
  const processedPayments = useMemo(() => {
    let filtered = payments.filter(p => 
      (p.status === PaymentStatus.PENDING || p.status === PaymentStatus.UPLOADED) &&
      (p.storeName.toLowerCase().includes(searchTerm.toLowerCase()) || 
       p.specificType.toLowerCase().includes(searchTerm.toLowerCase()) ||
       p.id.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return filtered.sort((a, b) => {
      switch (sortOption) {
        case 'date_asc': return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        case 'date_desc': return new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime();
        case 'amount_desc': return b.amount - a.amount;
        case 'amount_asc': return a.amount - b.amount;
        default: return 0;
      }
    });
  }, [payments, searchTerm, sortOption]);

  const selectedPayment = payments.find(p => p.id === selectedId);

  // Reset state when selection changes
  React.useEffect(() => {
    setRejectionNote('');
    setIsRejecting(false);
    setIsImageFullscreen(false);
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

  const handleApproveClick = () => {
      if (selectedId) {
          onApprove(selectedId);
          setSelectedId(null);
      }
  };

  const renderHistoryIcon = (action: string) => {
    switch(action) {
      case 'APROBACION': return <CheckCircle2 size={16} className="text-green-500" />;
      case 'RECHAZO': return <XCircle size={16} className="text-red-500" />;
      case 'CREACION': return <FileCheck size={16} className="text-blue-500" />;
      default: return <Clock size={16} className="text-slate-400" />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      
      {/* LEFT PANEL: List & Filters */}
      <div className={`w-full lg:w-[400px] xl:w-[450px] flex flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-all ${selectedId ? 'hidden lg:flex' : 'flex'}`}>
        
        {/* Header Section */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 space-y-4">
            <div className="flex justify-between items-center">
                <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <CheckSquare className="text-blue-600 dark:text-blue-400" />
                    Cola de Auditoría
                </h1>
                <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2.5 py-0.5 rounded-full text-xs font-bold border border-blue-200 dark:border-blue-800">
                    {processedPayments.length}
                </span>
            </div>

            {/* Search & Filter Bar */}
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <input 
                        type="text" 
                        placeholder="Buscar ID, Tienda..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-slate-100"
                    />
                    <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
                </div>
                <div className="relative group">
                    <button className="p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700">
                        <ArrowUpDown size={18} />
                    </button>
                    {/* Simple Dropdown for Sort */}
                    <div className="absolute right-0 top-full mt-2 w-40 bg-white dark:bg-slate-800 shadow-xl rounded-lg border border-slate-100 dark:border-slate-700 hidden group-hover:block z-10 p-1">
                        <button onClick={() => setSortOption('date_asc')} className={`w-full text-left px-3 py-2 text-xs rounded-md ${sortOption === 'date_asc' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>Más Antiguos</button>
                        <button onClick={() => setSortOption('date_desc')} className={`w-full text-left px-3 py-2 text-xs rounded-md ${sortOption === 'date_desc' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>Más Recientes</button>
                        <button onClick={() => setSortOption('amount_desc')} className={`w-full text-left px-3 py-2 text-xs rounded-md ${sortOption === 'amount_desc' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>Mayor Monto</button>
                    </div>
                </div>
            </div>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar bg-slate-50 dark:bg-slate-950/50">
            {processedPayments.length === 0 ? (
                 <div className="flex flex-col items-center justify-center h-64 text-center">
                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                        <CheckCircle2 className="text-slate-300 dark:text-slate-600" size={32} />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Sin pendientes</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-500 mt-1 max-w-[200px]">No hay pagos que coincidan con tus filtros.</p>
                 </div>
            ) : (
                processedPayments.map(payment => (
                <div 
                    key={payment.id}
                    onClick={() => setSelectedId(payment.id)}
                    className={`group relative p-4 rounded-xl border transition-all cursor-pointer hover:shadow-md ${
                        selectedId === payment.id 
                        ? 'bg-white dark:bg-slate-800 border-blue-500 ring-1 ring-blue-500 shadow-md z-10' 
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-slate-600'
                    }`}
                >
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                             <span className={`w-2 h-2 rounded-full ${payment.status === PaymentStatus.PENDING ? 'bg-orange-400' : 'bg-blue-400'}`}></span>
                             <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{payment.id}</span>
                        </div>
                        <span className="text-xs text-slate-400 font-mono">{payment.dueDate}</span>
                    </div>
                    
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {payment.storeName}
                    </h3>
                    
                    <div className="flex justify-between items-end mt-3">
                        <div className="flex flex-col">
                            <span className="text-[10px] text-slate-400 uppercase tracking-wide">Monto a Pagar</span>
                            <span className="text-lg font-bold text-slate-900 dark:text-white font-mono">${payment.amount.toLocaleString()}</span>
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                             {payment.category}
                        </div>
                    </div>
                </div>
                ))
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
                            <div className={`relative bg-slate-900 rounded-2xl overflow-hidden border border-slate-700 shadow-2xl transition-all duration-300 group ${isImageFullscreen ? 'fixed inset-4 z-50 order-none m-0' : 'h-[500px]'}`}>
                                <img 
                                    src={`https://picsum.photos/seed/${selectedPayment.id}/800/1000`} 
                                    alt="Recibo" 
                                    className="w-full h-full object-contain bg-slate-950" 
                                />
                                
                                {/* Overlay Controls */}
                                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button className="p-2 bg-black/50 text-white rounded-lg backdrop-blur-sm hover:bg-black/70">
                                        <Download size={20} />
                                    </button>
                                    <button 
                                        onClick={() => setIsImageFullscreen(!isImageFullscreen)}
                                        className="p-2 bg-black/50 text-white rounded-lg backdrop-blur-sm hover:bg-black/70"
                                    >
                                        {isImageFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                                    </button>
                                </div>

                                {!isImageFullscreen && (
                                    <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/80 to-transparent text-white">
                                        <p className="text-xs opacity-75">Archivo: comprobante_pago.jpg</p>
                                    </div>
                                )}
                            </div>
                            {isImageFullscreen && <div className="fixed inset-0 bg-black/90 z-40 backdrop-blur-sm" onClick={() => setIsImageFullscreen(false)}></div>}
                        </div>

                        {/* Column 2: Data Validation */}
                        <div className="space-y-6 order-1 xl:order-2">
                            
                            {/* Amount Card */}
                            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-1">Monto Declarado</p>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight">${selectedPayment.amount.toLocaleString()}</span>
                                    <span className="text-slate-400 font-mono">USD</span>
                                </div>
                                <div className="mt-4 flex gap-4 text-sm border-t border-slate-100 dark:border-slate-800 pt-4">
                                    <div>
                                        <p className="text-xs text-slate-400 uppercase">Vencimiento</p>
                                        <p className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1 mt-1">
                                            <CalendarDays size={14} className="text-red-500" /> {selectedPayment.dueDate}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400 uppercase">Pagado El</p>
                                        <p className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1 mt-1">
                                            <Clock size={14} className="text-green-500" /> {selectedPayment.paymentDate || 'N/A'}
                                        </p>
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

                            {/* NUEVA SECCIÓN: HISTORIAL DE AUDITORÍA */}
                            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                    <History size={16} className="text-slate-400" />
                                    Historial de Auditoría
                                </h3>
                                
                                <div className="space-y-4 relative pl-2">
                                    {/* Linea vertical conectora */}
                                    <div className="absolute top-2 bottom-2 left-5 w-px bg-slate-200 dark:bg-slate-800"></div>

                                    {selectedPayment.history && selectedPayment.history.length > 0 ? (
                                        [...selectedPayment.history].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((log, index) => (
                                            <div key={index} className="relative pl-8">
                                                <div className="absolute left-0 top-0.5 p-1 bg-white dark:bg-slate-900 rounded-full border border-slate-200 dark:border-slate-800 z-10">
                                                    {renderHistoryIcon(log.action)}
                                                </div>
                                                
                                                <div className="flex flex-col">
                                                    <div className="flex justify-between items-start">
                                                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{log.action}</span>
                                                        <span className="text-[10px] text-slate-400 font-mono">
                                                            {new Date(log.date).toLocaleString()}
                                                        </span>
                                                    </div>
                                                    
                                                    <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500 dark:text-slate-400">
                                                        <User size={10} />
                                                        <span>{log.actorName}</span>
                                                        <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 rounded">{log.role}</span>
                                                    </div>

                                                    {log.note && (
                                                        <div className="mt-2 text-xs bg-red-50 dark:bg-red-900/10 text-red-700 dark:text-red-300 p-2 rounded border border-red-100 dark:border-red-800/30">
                                                            {log.note}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-4 text-xs text-slate-400 italic">
                                            Sin registros históricos disponibles.
                                        </div>
                                    )}
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
                                    <div className="flex gap-4">
                                        <button 
                                            onClick={handleRejectClick}
                                            className="flex-1 py-4 bg-white dark:bg-slate-800 text-red-600 dark:text-red-400 font-bold rounded-xl border-2 border-slate-100 dark:border-slate-800 hover:border-red-100 dark:hover:border-red-900/30 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all flex items-center justify-center gap-2"
                                        >
                                            <XCircle size={20} />
                                            Rechazar
                                        </button>
                                        <button 
                                            onClick={handleApproveClick}
                                            className="flex-[2] py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-200 dark:shadow-blue-900/30 transition-all active:scale-[0.99] flex items-center justify-center gap-2"
                                        >
                                            <CheckCircle2 size={20} />
                                            Aprobar Pago
                                        </button>
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
