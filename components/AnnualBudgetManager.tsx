
import React, { useState, useEffect } from 'react';
import { Save, TrendingUp, Calendar, DollarSign, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { AnnualBudget } from '../types';
import { firestoreService } from '../services/firestoreService';
import { motion } from 'motion/react';

interface AnnualBudgetManagerProps {
  onBudgetSaved?: () => void;
}

export const AnnualBudgetManager: React.FC<AnnualBudgetManagerProps> = ({ onBudgetSaved }) => {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [months, setMonths] = useState<{ [key: string]: string }>({
    '01': '0', '02': '0', '03': '0', '04': '0', '05': '0', '06': '0',
    '07': '0', '08': '0', '09': '0', '10': '0', '11': '0', '12': '0'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

  useEffect(() => {
    const loadBudget = async () => {
      setIsLoading(true);
      const budgets = await firestoreService.getAnnualBudgets();
      const existing = budgets.find(b => b.year === year);
      if (existing) {
        const newMonths: { [key: string]: string } = {};
        Object.entries(existing.months).forEach(([m, v]) => {
          newMonths[m] = v.toString();
        });
        setMonths(newMonths);
      } else {
        // Reset if not found for this year
        setMonths({
          '01': '0', '02': '0', '03': '0', '04': '0', '05': '0', '06': '0',
          '07': '0', '08': '0', '09': '0', '10': '0', '11': '0', '12': '0'
        });
      }
      setIsLoading(false);
    };
    loadBudget();
  }, [year]);

  const handleMonthChange = (month: string, value: string) => {
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setMonths(prev => ({ ...prev, [month]: value }));
    }
  };

  const total = Object.values(months).reduce((acc, curr) => acc + (parseFloat(curr) || 0), 0);

  const handleSave = async () => {
    setSaveStatus('saving');
    try {
      const numericMonths: { [key: string]: number } = {};
      Object.entries(months).forEach(([m, v]) => {
        numericMonths[m] = parseFloat(v) || 0;
      });

      const budget: AnnualBudget = {
        id: `budget-${year}`,
        year,
        months: numericMonths,
        total,
        storeId: 'all'
      };

      await firestoreService.saveAnnualBudget(budget);
      setSaveStatus('success');
      if (onBudgetSaved) onBudgetSaved();
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error("Error saving annual budget:", error);
      setSaveStatus('error');
    }
  };

  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase flex items-center gap-3">
            <TrendingUp className="text-blue-600" size={32} />
            Presupuesto Anual
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Configuración de metas financieras por mes.</p>
        </div>
        <div className="flex items-center gap-3 bg-white dark:bg-slate-800 p-2 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
          <Calendar size={20} className="text-slate-400" />
          <select 
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
            className="bg-transparent font-bold text-slate-900 dark:text-white focus:outline-none"
          >
            {[currentYear - 1, currentYear, currentYear + 1].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
            <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-widest text-xs flex items-center gap-2">
              <DollarSign size={14} className="text-blue-500" />
              Distribución Mensual
            </h3>
          </div>
          
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {monthNames.map((name, index) => {
              const monthKey = (index + 1).toString().padStart(2, '0');
              return (
                <div key={monthKey} className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-tighter ml-1">
                    {name}
                  </label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                      <DollarSign size={16} />
                    </div>
                    <input
                      type="text"
                      value={months[monthKey]}
                      onChange={(e) => handleMonthChange(monthKey, e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-blue-500 rounded-2xl py-3 pl-10 pr-4 font-bold text-slate-900 dark:text-white transition-all outline-none"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-blue-600 rounded-3xl p-8 text-white shadow-xl shadow-blue-200 dark:shadow-none relative overflow-hidden group">
            <div className="relative z-10">
              <p className="text-blue-100 text-xs font-black uppercase tracking-widest mb-2">Total Anual {year}</p>
              <h2 className="text-4xl font-black tracking-tighter">
                ${total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </h2>
              <p className="text-blue-100/60 text-[10px] mt-4 font-medium leading-relaxed">
                Este monto servirá como base para las proyecciones y alertas de excedentes presupuestarios.
              </p>
            </div>
            <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
          </div>

          <button
            onClick={handleSave}
            disabled={saveStatus === 'saving' || isLoading}
            className={`w-full py-5 rounded-3xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3 transition-all shadow-lg active:scale-95 ${
              saveStatus === 'success' 
                ? 'bg-emerald-500 text-white shadow-emerald-200' 
                : saveStatus === 'error'
                ? 'bg-red-500 text-white shadow-red-200'
                : 'bg-slate-900 dark:bg-white dark:text-slate-900 text-white shadow-slate-200'
            }`}
          >
            {saveStatus === 'saving' ? (
              <RefreshCw className="animate-spin" size={20} />
            ) : saveStatus === 'success' ? (
              <CheckCircle2 size={20} />
            ) : saveStatus === 'error' ? (
              <AlertCircle size={20} />
            ) : (
              <Save size={20} />
            )}
            {saveStatus === 'saving' ? 'Guardando...' : saveStatus === 'success' ? 'Guardado con Éxito' : saveStatus === 'error' ? 'Error al Guardar' : 'Guardar Presupuesto'}
          </button>

          <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 rounded-3xl p-6">
            <h4 className="text-amber-800 dark:text-amber-400 font-black text-[10px] uppercase tracking-widest mb-3 flex items-center gap-2">
              <AlertCircle size={14} />
              Nota Importante
            </h4>
            <p className="text-amber-700/80 dark:text-amber-400/60 text-xs font-medium leading-relaxed">
              Las proyecciones predictivas utilizan este presupuesto anual para calcular desviaciones y estimar el flujo de caja necesario para el próximo año fiscal.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const RefreshCw = ({ className, size }: { className?: string; size?: number }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
    <path d="M21 3v5h-5" />
    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
    <path d="M3 21v-5h5" />
  </svg>
);
