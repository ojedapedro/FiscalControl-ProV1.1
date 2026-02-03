import React from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';

export const CalendarView: React.FC = () => {
  const days = Array.from({ length: 30 }, (_, i) => i + 1);
  
  return (
    <div className="p-6 lg:p-10 h-full flex flex-col">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Vencimientos Fiscales</h1>
        <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-slate-100 rounded-full"><ChevronLeft size={20} /></button>
            <span className="font-bold text-lg">Septiembre 2023</span>
            <button className="p-2 hover:bg-slate-100 rounded-full"><ChevronRight size={20} /></button>
        </div>
      </header>

      {/* Toggle View */}
      <div className="bg-slate-100 p-1 rounded-xl flex mb-8 w-full max-w-md mx-auto">
        <button className="flex-1 bg-white shadow-sm py-2 rounded-lg font-medium text-sm text-slate-900">Calendario</button>
        <button className="flex-1 py-2 rounded-lg font-medium text-sm text-slate-500 hover:bg-white/50">Lista</button>
      </div>

      <div className="grid grid-cols-7 gap-4 mb-4 text-center">
        {['DOM', 'LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB'].map(d => (
            <div key={d} className="text-xs font-bold text-slate-400">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2 lg:gap-4 flex-1">
        {/* Empty days padding */}
        <div className="col-span-3"></div>
        
        {days.map(day => {
            const isToday = day === 15;
            const hasEvent1 = [6, 15, 22].includes(day);
            const hasEvent2 = [6, 12, 15, 25].includes(day);

            return (
                <div key={day} className={`relative flex flex-col items-center justify-center min-h-[50px] lg:min-h-[80px] rounded-xl transition-colors cursor-pointer ${isToday ? 'bg-blue-600 text-white shadow-lg shadow-blue-300' : 'hover:bg-slate-50 text-slate-900'}`}>
                    <span className={`text-sm font-medium ${isToday ? 'font-bold' : ''}`}>{day}</span>
                    <div className="flex gap-1 mt-1">
                        {hasEvent1 && <div className={`w-1.5 h-1.5 rounded-full ${isToday ? 'bg-white' : 'bg-yellow-400'}`}></div>}
                        {hasEvent2 && <div className={`w-1.5 h-1.5 rounded-full ${isToday ? 'bg-blue-300' : 'bg-green-400'}`}></div>}
                    </div>
                </div>
            )
        })}
      </div>

      <div className="mt-8 flex justify-center gap-6">
        <div className="flex items-center gap-2 text-sm text-slate-500">
            <span className="w-3 h-3 rounded-full bg-blue-500"></span> Nacional
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500">
            <span className="w-3 h-3 rounded-full bg-green-500"></span> Municipal
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500">
            <span className="w-3 h-3 rounded-full bg-yellow-500"></span> Servicios
        </div>
      </div>

      {/* Events List for Selected Day */}
      <div className="mt-8">
        <h3 className="font-bold text-lg mb-4">Eventos para el 15 de Septiembre</h3>
        <div className="space-y-3">
             <div className="bg-slate-800 p-4 rounded-xl flex justify-between items-center text-white">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-900 rounded-lg flex items-center justify-center">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 21h18M5 21V7l8-4 8 4v14M17 21v-8.8M9 10a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v11"/></svg>
                    </div>
                    <div>
                        <div className="font-bold">Pago de IVA</div>
                        <div className="text-xs text-slate-400">Tienda #402 - Centro</div>
                    </div>
                </div>
                <div className="text-right">
                    <div className="font-bold">$12,500</div>
                    <div className="text-xs text-blue-400 font-bold uppercase">Vence Hoy</div>
                </div>
            </div>
        </div>
      </div>

      <button className="fixed bottom-8 right-8 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg shadow-blue-500/40 flex items-center justify-center hover:scale-105 transition-transform">
        <Plus size={28} />
      </button>

    </div>
  );
};
