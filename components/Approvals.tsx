import React, { useState, useEffect } from 'react';
import { Payment, PaymentStatus } from '../types';
import { CheckCircle2, XCircle, Expand, Clock, CalendarDays, Receipt, AlertCircle } from 'lucide-react';

interface ApprovalsProps {
  payments: Payment[];
  onApprove: (id: string) => void;
  onReject: (id: string, reason: string) => void;
}

export const Approvals: React.FC<ApprovalsProps> = ({ payments, onApprove, onReject }) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [rejectionNote, setRejectionNote] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  const pendingPayments = payments.filter(p => p.status === PaymentStatus.PENDING || p.status === PaymentStatus.UPLOADED);
  const selectedPayment = payments.find(p => p.id === selectedId);

  // Reset state when selection changes
  useEffect(() => {
    setRejectionNote('');
    setIsRejecting(false);
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

  return (
    <div className="p-4 lg:p-8 h-full flex flex-col lg:flex-row gap-6">
      {/* List Section */}
      <div className={`flex-1 overflow-y-auto space-y-4 ${selectedId ? 'hidden lg:block' : ''}`}>
        <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold text-slate-900">Cola de Auditoría</h1>
            <div className="flex gap-2">
                <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-bold">{pendingPayments.length} Pendientes</span>
            </div>
        </div>
        
        {pendingPayments.length === 0 ? (
             <div className="text-center py-20 bg-white rounded-2xl border border-slate-100">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="text-slate-400" size={32} />
                </div>
                <h3 className="text-lg font-bold text-slate-900">¡Todo al día!</h3>
                <p className="text-slate-500">No hay pagos pendientes por revisar.</p>
             </div>
        ) : (
            pendingPayments.map(payment => (
            <div 
                key={payment.id}
                onClick={() => setSelectedId(payment.id)}
                className={`bg-white p-5 rounded-2xl border transition-all cursor-pointer flex justify-between items-center hover:shadow-md ${selectedId === payment.id ? 'border-blue-500 ring-2 ring-blue-500/10' : 'border-slate-100 hover:border-blue-200'}`}
            >
                <div>
                <h3 className="font-bold text-slate-900">{payment.storeName}</h3>
                <p className="text-blue-600 font-bold text-lg mt-1">${payment.amount.toLocaleString()}</p>
                <div className="flex items-center gap-2 mt-2 text-sm text-slate-500">
                    <Receipt size={14} />
                    <span>{payment.specificType}</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-xs">ID: #{payment.id.split('-')[1]}</span>
                </div>
                </div>
                <div className="w-20 h-20 bg-slate-100 rounded-xl overflow-hidden flex items-center justify-center shrink-0">
                     <img src={`https://picsum.photos/seed/${payment.id}/200/200`} alt="Recibo" className="w-full h-full object-cover opacity-80" />
                </div>
            </div>
            ))
        )}
      </div>

      {/* Detail Section */}
      {selectedPayment ? (
        <div className="w-full lg:w-[480px] bg-white rounded-3xl shadow-xl p-6 flex flex-col animate-in slide-in-from-right-4 duration-300 border border-slate-100">
           <div className="flex items-center justify-between mb-6">
                <button onClick={() => setSelectedId(null)} className="lg:hidden text-slate-500 hover:text-slate-900">
                    ← Volver
                </button>
                <div className="text-right ml-auto">
                    <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                        Pendiente Auditoría
                    </span>
                    <p className="text-xs text-slate-400 mt-1">Ref: {selectedPayment.id}</p>
                </div>
           </div>

           <h2 className="text-2xl font-bold text-slate-900 mb-1">{selectedPayment.storeName}</h2>
           <div className="flex items-center gap-2 text-slate-500 text-sm mb-6">
                <Clock size={14} />
                Enviado el {new Date(selectedPayment.submittedDate).toLocaleDateString('es-ES')}
           </div>

           <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-slate-50 p-4 rounded-xl">
                    <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Categoría</p>
                    <div className="flex items-center gap-2 font-semibold text-slate-900">
                        {selectedPayment.category === 'Impuesto Nacional' && <span className="p-1 bg-blue-100 rounded text-blue-600"><Receipt size={14}/></span>}
                        {selectedPayment.category}
                    </div>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl">
                    <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Vencimiento</p>
                    <div className="flex items-center gap-2 font-semibold text-slate-900">
                        <CalendarDays size={16} className="text-slate-400" />
                        {selectedPayment.dueDate}
                    </div>
                </div>
           </div>

           {selectedPayment.paymentDate && (
               <div className="mb-4 px-2 text-sm text-slate-600 flex justify-between">
                   <span>Pagado el:</span>
                   <span className="font-semibold">{selectedPayment.paymentDate}</span>
               </div>
           )}

           <div className="flex justify-between items-end mb-6 border-b border-slate-100 pb-6">
                <span className="text-slate-500">Monto Total</span>
                <span className="text-3xl font-bold text-slate-900">${selectedPayment.amount.toLocaleString()}</span>
           </div>

           {/* Receipt Preview */}
           <div className="flex-1 bg-slate-100 rounded-xl mb-6 relative overflow-hidden group min-h-[250px] border border-slate-200">
                <img src={`https://picsum.photos/seed/${selectedPayment.id}/400/600`} alt="Recibo" className="w-full h-full object-cover" />
                <button className="absolute top-4 right-4 bg-white/90 p-2 rounded-lg shadow-sm text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Expand size={20} />
                    <span className="sr-only">Expandir</span>
                </button>
           </div>

           {selectedPayment.notes && (
                <div className="mb-6 p-3 bg-blue-50 text-blue-800 text-sm rounded-lg border border-blue-100">
                    <span className="font-bold block text-xs uppercase mb-1">Nota del Cargador:</span>
                    {selectedPayment.notes}
                </div>
           )}

           {isRejecting ? (
               <div className="mb-4 animate-in slide-in-from-bottom-2">
                    <label className="text-xs font-bold text-red-600 mb-2 uppercase flex items-center gap-1">
                        <AlertCircle size={14} /> Motivo del Rechazo
                    </label>
                    <textarea 
                        autoFocus
                        value={rejectionNote}
                        onChange={(e) => setRejectionNote(e.target.value)}
                        className="w-full bg-red-50 border border-red-200 text-red-900 rounded-xl p-3 text-sm focus:ring-red-500 focus:border-red-500 outline-none resize-none placeholder-red-300"
                        rows={3}
                        placeholder="Por favor especifique por qué se rechaza este pago..."
                    ></textarea>
               </div>
           ) : null}

           <div className="grid grid-cols-2 gap-4 mt-auto">
                <button 
                    onClick={handleRejectClick}
                    disabled={isRejecting && !rejectionNote.trim()}
                    className={`flex items-center justify-center gap-2 border-2 ${isRejecting ? 'bg-red-600 text-white border-red-600' : 'border-red-500 text-red-500 hover:bg-red-50'} font-bold py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                    <XCircle size={20} />
                    {isRejecting ? 'Confirmar' : 'Rechazar'}
                </button>
                
                {!isRejecting && (
                    <button 
                        onClick={handleApproveClick}
                        className="flex items-center justify-center gap-2 bg-green-500 text-white font-bold py-3 rounded-xl hover:bg-green-600 shadow-lg shadow-green-200 transition-colors"
                    >
                        <CheckCircle2 size={20} />
                        Aprobar
                    </button>
                )}
                
                {isRejecting && (
                     <button 
                        onClick={() => setIsRejecting(false)}
                        className="flex items-center justify-center gap-2 bg-slate-100 text-slate-600 font-bold py-3 rounded-xl hover:bg-slate-200 transition-colors"
                    >
                        Cancelar
                    </button>
                )}
           </div>

        </div>
      ) : (
          <div className="hidden lg:flex flex-1 items-center justify-center text-slate-400 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 m-4">
              <div className="text-center">
                  <Receipt size={48} className="mx-auto mb-4 opacity-50" />
                  <p>Seleccione un pago de la cola para auditar</p>
              </div>
          </div>
      )}
    </div>
  );
};
