import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { REPORT_DATA } from '../constants';
import { Download, Calendar, ArrowUpRight } from 'lucide-react';

export const Reports: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 lg:p-8">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
        <div className="flex items-center gap-4">
             <button className="p-2 hover:bg-slate-800 rounded-full text-slate-400">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
             </button>
             <h1 className="text-2xl font-bold">Informe Fiscal Anual</h1>
        </div>
        <button className="text-yellow-500 hover:text-yellow-400 transition-colors">
            <Download size={24} />
        </button>
      </header>

      <div className="mb-8">
        <button className="flex items-center gap-2 bg-slate-800 px-4 py-2 rounded-lg text-sm border border-slate-700 hover:bg-slate-700 transition-colors">
            <Calendar size={16} className="text-yellow-500" />
            <span>Año Fiscal 2023</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6"/></svg>
        </button>
      </div>

      {/* Hero Card */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-800 rounded-3xl p-8 mb-8 relative overflow-hidden shadow-2xl shadow-blue-900/20">
        <div className="relative z-10">
            <div className="flex items-center gap-2 text-blue-200 text-sm font-semibold tracking-wider mb-2">
                <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
                GASTO TOTAL
            </div>
            <div className="text-5xl font-bold text-white mb-4">$12,450,000</div>
            <div className="inline-flex items-center gap-2 bg-blue-500/20 text-blue-200 px-3 py-1 rounded-full text-sm font-medium border border-blue-400/30">
                <ArrowUpRight size={14} />
                +5.2% vs año anterior
            </div>
        </div>
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none">
            <svg width="300" height="200" viewBox="0 0 24 24" fill="currentColor">
                <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm3-2v-2h3v2Zm5 0v-2h3v2Zm5 0v-2h3v2ZM9 4h10v14h-3v-2h-3v2H9Z" />
            </svg>
        </div>
      </div>

      {/* Compliance Score */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 mb-8">
        <div className="flex justify-between items-start mb-6">
            <div>
                <h3 className="text-slate-400 text-sm font-medium">Cumplimiento a Tiempo</h3>
                <div className="text-4xl font-bold text-white mt-1">98.4%</div>
            </div>
            <div className="bg-green-500/20 p-2 rounded-full text-green-500">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
        </div>
        <div className="h-2 bg-slate-800 rounded-full overflow-hidden mb-2">
            <div className="h-full bg-gradient-to-r from-green-400 to-emerald-600 w-[98.4%] rounded-full"></div>
        </div>
        <p className="text-xs text-slate-500">Top 1% del estándar de la industria</p>
      </div>

      {/* Main Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 mb-8">
         <div className="flex justify-between items-center mb-6">
            <div>
                <h3 className="font-bold text-lg">Impuestos vs Servicios</h3>
                <p className="text-slate-500 text-sm">Análisis de tendencia mensual</p>
            </div>
            <div className="text-right">
                <div className="font-bold text-xl">$1.2M</div>
                <div className="text-slate-500 text-xs uppercase">Prom / Mes</div>
            </div>
         </div>
         
         <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={REPORT_DATA}>
                    <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                         <linearGradient id="colorSec" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#eab308" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#eab308" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                    <YAxis hide />
                    <Tooltip 
                        contentStyle={{backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px'}} 
                        itemStyle={{color: '#fff'}}
                    />
                    <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                    <Area type="monotone" dataKey="secondaryValue" stroke="#eab308" strokeWidth={3} fillOpacity={1} fill="url(#colorSec)" />
                </AreaChart>
            </ResponsiveContainer>
         </div>
         
         <div className="flex justify-center gap-6 mt-4">
            <div className="flex items-center gap-2 text-sm text-slate-400">
                <span className="w-3 h-3 rounded-full bg-blue-500"></span> Servicios
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-400">
                <span className="w-3 h-3 rounded-full bg-yellow-500"></span> Impuestos
            </div>
         </div>
      </div>

      {/* Top Stores List */}
      <div className="space-y-4">
        <div className="flex justify-between items-center text-sm font-semibold mb-2">
            <h3>Top 5 Tiendas por Gasto</h3>
            <button className="text-yellow-500 hover:text-yellow-400">Ver Todas</button>
        </div>

        {[
            { name: 'Sede Principal Caracas', loc: 'Caracas, DC', id: '#1092', amount: '$4.2M', trend: '+12%', trendColor: 'text-red-400' },
            { name: 'Boutique Las Mercedes', loc: 'Caracas, DC', id: '#2105', amount: '$2.8M', trend: '-2.4%', trendColor: 'text-green-400' },
            { name: 'Centro Sambil', loc: 'Valencia, CA', id: '#3044', amount: '$2.1M', trend: '+5.1%', trendColor: 'text-red-400' },
        ].map((store, idx) => (
            <div key={idx} className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex justify-between items-center hover:bg-slate-800 transition-colors">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center text-blue-400">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 21h18M5 21V7l8-4 8 4v14M17 21v-8.8M9 10a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v11"/></svg>
                    </div>
                    <div>
                        <div className="font-bold text-slate-200">{store.name}</div>
                        <div className="text-xs text-slate-500">{store.loc} • ID: {store.id}</div>
                    </div>
                </div>
                <div className="text-right">
                    <div className="font-bold text-white">{store.amount}</div>
                    <div className={`text-xs ${store.trendColor}`}>{store.trend}</div>
                </div>
            </div>
        ))}
      </div>
    </div>
  );
};
