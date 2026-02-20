
import React, { useState, useMemo } from 'react';
import { STORES } from '../constants';
import { Payment, PaymentStatus } from '../types';
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Store as StoreIcon, 
  MapPin,
  Search,
  Filter
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';

import VenezuelaMap from './VenezuelaMap';

interface StoreStatusProps {
  payments: Payment[];
}

export const StoreStatus: React.FC<StoreStatusProps> = ({ payments }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [hoveredStore, setHoveredStore] = useState<string | null>(null);

  // Calcular el estado dinámico de las tiendas basado en los pagos reales
  const dynamicStores = useMemo(() => {
    return STORES.map(store => {
        // Obtener pagos asociados a esta tienda
        const storePayments = payments.filter(p => p.storeId === store.id);
        
        // Lógica de Estado
        let calculatedStatus: 'En Regla' | 'En Riesgo' | 'Vencido' = 'En Regla';
        
        const hasOverdue = storePayments.some(p => p.status === PaymentStatus.OVERDUE);
        const hasPending = storePayments.some(p => p.status === PaymentStatus.PENDING || p.status === PaymentStatus.UPLOADED);

        if (hasOverdue) {
            calculatedStatus = 'Vencido';
        } else if (hasPending) {
            calculatedStatus = 'En Riesgo';
        }

        // Calcular próxima fecha límite real basada en el pago pendiente más próximo
        const activePayments = storePayments
            .filter(p => p.status !== PaymentStatus.APPROVED && p.status !== PaymentStatus.REJECTED)
            .sort((a,b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
        
        const nextDeadline = activePayments.length > 0 ? activePayments[0].dueDate : store.nextDeadline;

        return {
            ...store,
            status: calculatedStatus,
            nextDeadline: nextDeadline
        };
    });
  }, [payments]);

  // Calcular estadísticas para el gráfico basadas en datos dinámicos
  const stats = [
    { 
      name: 'En Regla', 
      value: dynamicStores.filter(s => s.status === 'En Regla').length, 
      color: '#22c55e', // green-500
      textColor: 'text-green-600'
    },
    { 
      name: 'En Riesgo', 
      value: dynamicStores.filter(s => s.status === 'En Riesgo').length, 
      color: '#eab308', // yellow-500
      textColor: 'text-yellow-600'
    },
    { 
      name: 'Vencido', 
      value: dynamicStores.filter(s => s.status === 'Vencido').length, 
      color: '#ef4444', // red-500
      textColor: 'text-red-600'
    },
  ];

  const filteredStores = dynamicStores.filter(store => 
    store.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    store.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    store.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    store.municipality?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
       <header className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Estado de la Red</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1">Monitoreo en tiempo real de cumplimiento fiscal por sucursal.</p>
            </div>
            <div className="flex gap-3">
                 <div className="relative">
                    <input 
                        type="text" 
                        placeholder="Buscar tienda..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-slate-200 w-full md:w-64"
                    />
                    <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                 </div>
                 <button className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700">
                    <Filter size={20} />
                 </button>
            </div>
       </header>

       {/* Top Section: Charts & Map */}
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Chart Card */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-6">Distribución de Estatus</h3>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#334155" opacity={0.2} />
                            <XAxis type="number" hide />
                            <YAxis 
                                type="category" 
                                dataKey="name" 
                                tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} 
                                axisLine={false} 
                                tickLine={false} 
                                width={80}
                            />
                            <Tooltip 
                                cursor={{ fill: 'transparent' }}
                                contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '8px', color: '#fff' }}
                            />
                            <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={40}>
                                {stats.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Real Map Card */}
            <VenezuelaMap stores={dynamicStores} />
       </div>

        {/* Directory List */}
        <div className="space-y-4">
            <h2 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                <StoreIcon size={20} className="text-blue-500" />
                Directorio de Sucursales
            </h2>

            {filteredStores.length === 0 ? (
                <div className="text-center py-10 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                    No se encontraron tiendas con ese criterio.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filteredStores.map((store) => (
                        <div 
                            key={store.id} 
                            onMouseEnter={() => setHoveredStore(store.id)}
                            onMouseLeave={() => setHoveredStore(null)}
                            className={`bg-white dark:bg-slate-900 p-5 rounded-xl shadow-sm border transition-all duration-300 ${
                                hoveredStore === store.id 
                                ? 'border-blue-400 dark:border-blue-500 ring-1 ring-blue-400/20 translate-y-[-2px]' 
                                : 'border-slate-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-slate-600'
                            }`}
                        >
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                                        store.status === 'Vencido' ? 'bg-red-100 dark:bg-red-900/20 text-red-600' : 
                                        store.status === 'En Riesgo' ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600' : 
                                        'bg-blue-100 dark:bg-blue-900/20 text-blue-600'
                                    }`}>
                                        <MapPin size={18} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 dark:text-white text-sm">{store.name}</h3>
                                        <div className="flex flex-col gap-0.5 mt-0.5">
                                            <p className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                                <MapPin size={10} /> {store.location}
                                            </p>
                                            {store.municipality && (
                                                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                                                    Mun. {store.municipality}
                                                </p>
                                            )}
                                            {store.address && (
                                                <p className="text-[10px] text-slate-400 dark:text-slate-500 italic line-clamp-1" title={store.address}>
                                                    {store.address}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                    store.status === 'En Regla' ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-900' :
                                    store.status === 'En Riesgo' ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-900' :
                                    'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900'
                                }`}>
                                    {store.status}
                                </span>
                            </div>
                            
                            <div className="pt-3 border-t border-slate-50 dark:border-slate-800 flex justify-between items-center text-xs">
                                <span className="text-slate-500 dark:text-slate-400">Próximo cierre:</span>
                                <div className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-slate-200">
                                    {store.nextDeadline}
                                    {store.status === 'En Regla' && <CheckCircle2 size={14} className="text-green-500" />}
                                    {store.status === 'En Riesgo' && <AlertTriangle size={14} className="text-yellow-500" />}
                                    {store.status === 'Vencido' && <XCircle size={14} className="text-red-500" />}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    </div>
  );
};
