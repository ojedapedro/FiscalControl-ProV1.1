
import React, { useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  DollarSign, 
  FileText, 
  Zap, 
  Wifi, 
  Droplets,
  Plus,
  Filter,
  Clock,
  Activity,
  XCircle
} from 'lucide-react';
import { Payment, PaymentStatus } from '../types';

interface DashboardProps {
  payments: Payment[];
  onNewPayment: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ payments, onNewPayment }) => {
  const [filter, setFilter] = useState<'all' | 'pending' | 'overdue' | 'approved' | 'rejected'>('all');

  // Calcular totales reales basados en el estado de los pagos
  const totalDue = payments
    .filter(p => [PaymentStatus.PENDING, PaymentStatus.UPLOADED, PaymentStatus.OVERDUE].includes(p.status))
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalOverdue = payments
    .filter(p => p.status === PaymentStatus.OVERDUE)
    .reduce((acc, curr) => acc + curr.amount, 0);

  // Nuevas Estadísticas
  // Nota: pendingCount incluye PENDING y UPLOADED
  const pendingCount = payments.filter(p => p.status === PaymentStatus.PENDING || p.status === PaymentStatus.UPLOADED).length;
  const rejectedCount = payments.filter(p => p.status === PaymentStatus.REJECTED).length;

  const approvedPayments = payments.filter(p => p.status === PaymentStatus.APPROVED);
  const totalApproved = approvedPayments.reduce((acc, curr) => acc + curr.amount, 0);
  const averagePayment = approvedPayments.length > 0 ? totalApproved / approvedPayments.length : 0;

  // Filtrado de la lista para visualización
  const filteredPayments = payments.filter(payment => {
    if (filter === 'all') return true;
    // MODIFICACIÓN: Incluimos PaymentStatus.UPLOADED en el filtro 'pending'
    if (filter === 'pending') return payment.status === PaymentStatus.PENDING || payment.status === PaymentStatus.UPLOADED;
    if (filter === 'overdue') return payment.status === PaymentStatus.OVERDUE;
    if (filter === 'approved') return payment.status === PaymentStatus.APPROVED;
    if (filter === 'rejected') return payment.status === PaymentStatus.REJECTED;
    return true;
  });

  const getIconForType = (type: string) => {
    // Adjusted logic for Spanish terms
    if (type.includes('Impuesto')) return <BuildingIcon />;
    if (type.includes('Electricidad')) return <Zap className="text-yellow-600 dark:text-yellow-400" />;
    if (type.includes('Internet')) return <Wifi className="text-purple-600 dark:text-purple-400" />;
    if (type.includes('Agua')) return <Droplets className="text-blue-600 dark:text-blue-400" />;
    return <FileText className="text-slate-600 dark:text-slate-400" />;
  };

  const getBgForType = (type: string) => {
    if (type.includes('Impuesto')) return 'bg-blue-100 dark:bg-blue-900/30';
    if (type.includes('Electricidad')) return 'bg-yellow-100 dark:bg-yellow-900/30';
    if (type.includes('Internet')) return 'bg-purple-100 dark:bg-purple-900/30';
    if (type.includes('Agua')) return 'bg-blue-50 dark:bg-blue-900/20';
    return 'bg-slate-100 dark:bg-slate-800';
  };

  const getFilterButtonClass = (isActive: boolean) => 
    isActive 
      ? "px-4 py-1 bg-slate-900 dark:bg-slate-700 text-white rounded-md text-sm font-medium shadow-sm transition-all"
      : "px-4 py-1 text-slate-600 dark:text-slate-400 rounded-md text-sm font-medium hover:bg-white dark:hover:bg-slate-600 hover:shadow-sm transition-all";

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Gestión de Pagos</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Gestione, cargue y realice seguimiento de obligaciones fiscales.</p>
        </div>
        <div className="flex gap-4">
            <button className="p-2 bg-white dark:bg-slate-800 rounded-full shadow-sm relative transition-colors">
                <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-slate-800"></span>
                <span className="text-xl">🔔</span>
            </button>
            <div className="w-10 h-10 bg-orange-200 dark:bg-orange-900/50 rounded-full flex items-center justify-center text-orange-600 dark:text-orange-400 font-bold shadow-sm">
                JD
            </div>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {/* Card 1: Total Due */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 relative overflow-hidden group hover:shadow-md transition-all">
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-medium mb-2">
              <DollarSign size={18} className="text-blue-500" />
              Total por Pagar
            </div>
            <div className="text-3xl font-bold text-slate-900 dark:text-white">${totalDue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
            <div className="flex items-center gap-1 text-green-600 dark:text-green-400 text-xs font-semibold mt-3 bg-green-50 dark:bg-green-900/20 w-fit px-2 py-1 rounded-lg">
              <TrendingUp size={14} />
              +12% vs semana
            </div>
          </div>
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-blue-50 dark:bg-blue-900/20 rounded-full opacity-50 group-hover:scale-110 transition-transform"></div>
        </div>

        {/* Card 2: Overdue Amount */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 relative overflow-hidden group hover:shadow-md transition-all">
           <div className="relative z-10">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-medium mb-2">
              <AlertTriangle size={18} className="text-red-500" />
              Monto Vencido
            </div>
            <div className="text-3xl font-bold text-slate-900 dark:text-white">${totalOverdue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
             <div className="flex items-center gap-1 text-red-600 dark:text-red-400 text-xs font-semibold mt-3 bg-red-50 dark:bg-red-900/20 w-fit px-2 py-1 rounded-lg">
              <TrendingDown size={14} />
              Acción Inmediata
            </div>
          </div>
           <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-red-50 dark:bg-red-900/20 rounded-full opacity-50 group-hover:scale-110 transition-transform"></div>
        </div>

        {/* Card 3: Rejected Count */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 relative overflow-hidden group hover:shadow-md transition-all">
           <div className="relative z-10">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-medium mb-2">
              <XCircle size={18} className="text-pink-500" />
              Pagos Rechazados
            </div>
            <div className="text-3xl font-bold text-slate-900 dark:text-white">{rejectedCount}</div>
             <div className="flex items-center gap-1 text-pink-600 dark:text-pink-400 text-xs font-semibold mt-3 bg-pink-50 dark:bg-pink-900/20 w-fit px-2 py-1 rounded-lg">
              Corregir
            </div>
          </div>
           <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-pink-50 dark:bg-pink-900/20 rounded-full opacity-50 group-hover:scale-110 transition-transform"></div>
        </div>

        {/* Card 4: Pending Count */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 relative overflow-hidden group hover:shadow-md transition-all">
           <div className="relative z-10">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-medium mb-2">
              <Clock size={18} className="text-orange-500" />
              Pagos Pendientes
            </div>
            <div className="text-3xl font-bold text-slate-900 dark:text-white">{pendingCount}</div>
             <div className="flex items-center gap-1 text-orange-600 dark:text-orange-400 text-xs font-semibold mt-3 bg-orange-50 dark:bg-orange-900/20 w-fit px-2 py-1 rounded-lg">
              En cola de revisión
            </div>
          </div>
           <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-orange-50 dark:bg-orange-900/20 rounded-full opacity-50 group-hover:scale-110 transition-transform"></div>
        </div>

        {/* Card 5: Average Payment */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 relative overflow-hidden group hover:shadow-md transition-all">
           <div className="relative z-10">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-medium mb-2">
              <Activity size={18} className="text-purple-500" />
              Promedio Pago
            </div>
            <div className="text-3xl font-bold text-slate-900 dark:text-white">${averagePayment.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
             <div className="flex items-center gap-1 text-purple-600 dark:text-purple-400 text-xs font-semibold mt-3 bg-purple-50 dark:bg-purple-900/20 w-fit px-2 py-1 rounded-lg">
              Base: {approvedPayments.length} pagos
            </div>
          </div>
           <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-purple-50 dark:bg-purple-900/20 rounded-full opacity-50 group-hover:scale-110 transition-transform"></div>
        </div>
      </div>

      {/* Action Button */}
      <button 
        onClick={onNewPayment}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl shadow-lg shadow-blue-200 dark:shadow-blue-900/30 flex items-center justify-center gap-2 font-semibold text-lg transition-transform active:scale-[0.99]"
      >
        <Plus size={24} />
        Cargar Nuevo Pago
      </button>

      {/* Recent Payments List */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Transacciones Recientes</h2>
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg self-start sm:self-auto flex-wrap">
                <button 
                  onClick={() => setFilter('all')}
                  className={getFilterButtonClass(filter === 'all')}
                >
                  Todos
                </button>
                <button 
                  onClick={() => setFilter('pending')}
                  className={getFilterButtonClass(filter === 'pending')}
                >
                  Pendientes
                </button>
                <button 
                  onClick={() => setFilter('overdue')}
                  className={getFilterButtonClass(filter === 'overdue')}
                >
                  Vencidos
                </button>
                <button 
                  onClick={() => setFilter('approved')}
                  className={getFilterButtonClass(filter === 'approved')}
                >
                  Aprobados
                </button>
                <button 
                  onClick={() => setFilter('rejected')}
                  className={getFilterButtonClass(filter === 'rejected')}
                >
                  Rechazados
                </button>
            </div>
        </div>

        <div className="space-y-3">
          {filteredPayments.length === 0 ? (
             <div className="flex flex-col items-center justify-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 mb-3">
                   <Filter size={24} />
                </div>
                <p className="text-slate-500 dark:text-slate-400 font-medium">No hay pagos en esta categoría.</p>
             </div>
          ) : (
            filteredPayments.map((payment) => (
              <div key={payment.id} className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-blue-200 dark:hover:border-blue-800 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 ${getBgForType(payment.specificType)} rounded-xl flex items-center justify-center shrink-0`}>
                    {getIconForType(payment.specificType)}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white">{payment.specificType}</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Vence: {payment.dueDate}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 w-full sm:w-auto">
                  <span className="font-bold text-lg text-slate-900 dark:text-slate-100">${payment.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      payment.status === PaymentStatus.PENDING || payment.status === PaymentStatus.UPLOADED ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                      payment.status === PaymentStatus.APPROVED ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                      payment.status === PaymentStatus.OVERDUE ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                      payment.status === PaymentStatus.REJECTED ? 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400' :
                      'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                  }`}>
                      {payment.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

const BuildingIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-blue-600 dark:text-blue-400">
    <path d="M3 21h18" />
    <path d="M5 21V7l8-4 8 4v14" />
    <path d="M17 21v-8.8" />
    <path d="M9 10a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v11" />
  </svg>
);
