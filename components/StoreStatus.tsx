import React from 'react';
import { STORES } from '../constants';
import { CheckCircle2, AlertTriangle, XCircle, Store as StoreIcon } from 'lucide-react';

export const StoreStatus: React.FC = () => {
  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto">
       <header className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-slate-900">Estado de la Red</h1>
            <button className="text-blue-600 font-semibold">Filtrar</button>
       </header>

       {/* KPIs */}
       <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex items-center gap-2 text-slate-500 mb-2 font-medium">
                    Tiendas en Regla <CheckCircle2 size={18} className="text-green-500" />
                </div>
                <div className="text-4xl font-bold text-slate-900">85%</div>
                <div className="text-green-600 text-sm font-semibold mt-2">+2% respecto al mes anterior</div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                 <div className="flex items-center gap-2 text-slate-500 mb-2 font-medium">
                    En Riesgo <AlertTriangle size={18} className="text-red-500" />
                </div>
                <div className="text-4xl font-bold text-slate-900">15%</div>
                <div className="text-red-600 text-sm font-semibold mt-2">-1% mejora</div>
            </div>
       </div>

        {/* Directory Header */}
        <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-lg text-slate-900">Directorio de Tiendas</h2>
            <span className="text-xs text-slate-400">Actualizado hoy, 09:41 AM</span>
        </div>

        {/* List */}
        <div className="space-y-4">
            {STORES.map((store) => (
                <div key={store.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${store.status === 'Vencido' ? 'bg-red-100 text-red-600' : store.status === 'En Riesgo' ? 'bg-yellow-100 text-yellow-600' : 'bg-blue-100 text-blue-600'}`}>
                                <StoreIcon size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900">{store.name}</h3>
                                <p className="text-sm text-slate-500">{store.location}</p>
                            </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                             store.status === 'En Regla' ? 'bg-green-50 text-green-700 border-green-200' :
                             store.status === 'En Riesgo' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                             'bg-red-50 text-red-700 border-red-200'
                        }`}>
                            {store.status}
                        </span>
                    </div>
                    <div className="pt-4 border-t border-slate-50 flex justify-between items-center">
                        <span className="text-sm text-slate-500">Próximo Vencimiento Fiscal</span>
                        <div className="flex items-center gap-2 font-semibold text-slate-900">
                            {store.nextDeadline}
                            {store.status === 'En Regla' && <CheckCircle2 size={16} className="text-green-500" />}
                            {store.status === 'En Riesgo' && <AlertTriangle size={16} className="text-yellow-500" />}
                            {store.status === 'Vencido' && <XCircle size={16} className="text-red-500" />}
                        </div>
                    </div>
                </div>
            ))}
        </div>

    </div>
  );
};
