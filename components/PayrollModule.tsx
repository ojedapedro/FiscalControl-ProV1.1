
import * as React from 'react';
import { 
  Users, 
  Plus, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  FileText, 
  Search, 
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Briefcase,
  ShieldCheck,
  Building2,
  Trash2,
  ChevronRight,
  Calculator
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PayrollEntry } from '../types';
import { useExchangeRate } from '../contexts/ExchangeRateContext';

interface PayrollModuleProps {
  entries: PayrollEntry[];
  onAddEntry: (entry: Omit<PayrollEntry, 'id' | 'submittedDate'>) => void;
  onDeleteEntry: (id: string) => void;
}

export const PayrollModule: React.FC<PayrollModuleProps> = ({ entries, onAddEntry, onDeleteEntry }) => {
  const [isAdding, setIsAdding] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState('');
  const { exchangeRate } = useExchangeRate();

  // Form State
  const [formData, setFormData] = React.useState({
    employeeName: '',
    employeeId: '',
    month: new Date().toISOString().slice(0, 7),
    baseSalary: 0,
    bonuses: [{ name: 'Bono de Alimentación', amount: 0 }],
    deductions: [{ name: 'SSO (Seguro Social)', amount: 0 }, { name: 'LPH (Vivienda)', amount: 0 }],
    employerLiabilities: [{ name: 'Aporte Patronal SSO', amount: 0 }, { name: 'Aporte Patronal LPH', amount: 0 }, { name: 'INCES', amount: 0 }]
  });

  const handleAddBonus = () => {
    setFormData({ ...formData, bonuses: [...formData.bonuses, { name: '', amount: 0 }] });
  };

  const handleAddDeduction = () => {
    setFormData({ ...formData, deductions: [...formData.deductions, { name: '', amount: 0 }] });
  };

  const handleAddLiability = () => {
    setFormData({ ...formData, employerLiabilities: [...formData.employerLiabilities, { name: '', amount: 0 }] });
  };

  const calculateTotals = (data: typeof formData) => {
    const totalBonuses = data.bonuses.reduce((acc, b) => acc + b.amount, 0);
    const totalDeductions = data.deductions.reduce((acc, d) => acc + d.amount, 0);
    const totalLiabilities = data.employerLiabilities.reduce((acc, l) => acc + l.amount, 0);
    
    const workerNet = data.baseSalary + totalBonuses - totalDeductions;
    const employerCost = workerNet + totalLiabilities;
    
    return { workerNet, employerCost };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { workerNet, employerCost } = calculateTotals(formData);
    onAddEntry({
      ...formData,
      totalWorkerNet: workerNet,
      totalEmployerCost: employerCost,
      status: 'PROCESADO'
    });
    setIsAdding(false);
    // Reset form
    setFormData({
      employeeName: '',
      employeeId: '',
      month: new Date().toISOString().slice(0, 7),
      baseSalary: 0,
      bonuses: [{ name: 'Bono de Alimentación', amount: 0 }],
      deductions: [{ name: 'SSO (Seguro Social)', amount: 0 }, { name: 'LPH (Vivienda)', amount: 0 }],
      employerLiabilities: [{ name: 'Aporte Patronal SSO', amount: 0 }, { name: 'Aporte Patronal LPH', amount: 0 }, { name: 'INCES', amount: 0 }]
    });
  };

  const filteredEntries = entries.filter(e => 
    e.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    e.employeeId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPayrollCost = entries.reduce((acc, e) => acc + e.totalEmployerCost, 0);
  const totalWorkerPayments = entries.reduce((acc, e) => acc + e.totalWorkerNet, 0);
  const totalStateLiabilities = entries.reduce((acc, e) => {
    const liabilitiesSum = e.employerLiabilities.reduce((sum, l) => sum + l.amount, 0);
    return acc + liabilitiesSum;
  }, 0);

  return (
    <div className="p-6 lg:p-10 space-y-8 pb-24 lg:pb-10 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 rounded-2xl shadow-lg shadow-blue-900/20">
              <Users className="text-white" size={24} />
            </div>
            Gestión de Nómina
          </h1>
          <p className="text-slate-400 mt-2 font-medium">Control de pasivos laborales y salarios mensuales</p>
        </div>
        
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-blue-900/20 active:scale-95"
        >
          <Plus size={20} />
          Cargar Nómina
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-3xl backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-500">
              <TrendingUp size={20} />
            </div>
            <span className="text-slate-400 text-sm font-bold uppercase tracking-wider">Costo Total Empresa</span>
          </div>
          <div className="text-3xl font-bold text-white font-mono">${totalPayrollCost.toLocaleString()}</div>
          <div className="text-sm text-slate-500 mt-1">Bs. {(totalPayrollCost * exchangeRate).toLocaleString()}</div>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-3xl backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-500/10 rounded-xl text-blue-500">
              <DollarSign size={20} />
            </div>
            <span className="text-slate-400 text-sm font-bold uppercase tracking-wider">Neto a Trabajadores</span>
          </div>
          <div className="text-3xl font-bold text-white font-mono">${totalWorkerPayments.toLocaleString()}</div>
          <div className="text-sm text-slate-500 mt-1">Bs. {(totalWorkerPayments * exchangeRate).toLocaleString()}</div>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-3xl backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-orange-500/10 rounded-xl text-orange-500">
              <ShieldCheck size={20} />
            </div>
            <span className="text-slate-400 text-sm font-bold uppercase tracking-wider">Pasivos al Estado</span>
          </div>
          <div className="text-3xl font-bold text-white font-mono">${totalStateLiabilities.toLocaleString()}</div>
          <div className="text-sm text-slate-500 mt-1">Bs. {(totalStateLiabilities * exchangeRate).toLocaleString()}</div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden backdrop-blur-sm">
        <div className="p-6 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              type="text"
              placeholder="Buscar por nombre o ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-2xl text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>
          <div className="flex items-center gap-3">
            <button className="p-3 bg-slate-800 text-slate-400 rounded-xl hover:text-white transition-colors">
              <Filter size={20} />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-800/50">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Trabajador</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Mes</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Sueldo Base</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Neto Trabajador</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Costo Empresa</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center gap-3">
                      <Briefcase size={48} className="opacity-20" />
                      <p>No se encontraron registros de nómina.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-800/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-500 font-bold">
                          {entry.employeeName.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-white">{entry.employeeName}</div>
                          <div className="text-xs text-slate-500 font-mono">{entry.employeeId}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-300 font-medium">{entry.month}</td>
                    <td className="px-6 py-4 text-right font-mono text-slate-300">${entry.baseSalary.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="font-mono font-bold text-emerald-400">${entry.totalWorkerNet.toLocaleString()}</div>
                      <div className="text-[10px] text-slate-500">Bs. {(entry.totalWorkerNet * exchangeRate).toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="font-mono font-bold text-blue-400">${entry.totalEmployerCost.toLocaleString()}</div>
                      <div className="text-[10px] text-slate-500">Bs. {(entry.totalEmployerCost * exchangeRate).toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        entry.status === 'PROCESADO' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-yellow-500/10 text-yellow-500'
                      }`}>
                        {entry.status === 'PROCESADO' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                        {entry.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => onDeleteEntry(entry.id)}
                        className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Entry Modal */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAdding(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-600 rounded-2xl">
                    <Plus className="text-white" size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Nueva Carga de Nómina</h2>
                    <p className="text-slate-400 text-sm font-medium">Complete los datos del trabajador y pasivos</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsAdding(false)}
                  className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
                >
                  <Plus size={24} className="rotate-45" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-8">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Nombre del Trabajador</label>
                    <div className="relative">
                      <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                      <input 
                        required
                        type="text"
                        value={formData.employeeName}
                        onChange={(e) => setFormData({ ...formData, employeeName: e.target.value })}
                        className="w-full pl-12 pr-4 py-4 bg-slate-800 border border-slate-700 rounded-2xl text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        placeholder="Ej. Juan Pérez"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Cédula / ID</label>
                    <div className="relative">
                      <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                      <input 
                        required
                        type="text"
                        value={formData.employeeId}
                        onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                        className="w-full pl-12 pr-4 py-4 bg-slate-800 border border-slate-700 rounded-2xl text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono"
                        placeholder="Ej. V-12345678"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Mes de Nómina</label>
                    <input 
                      required
                      type="month"
                      value={formData.month}
                      onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                      className="w-full px-4 py-4 bg-slate-800 border border-slate-700 rounded-2xl text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Sueldo Básico ($)</label>
                    <div className="relative">
                      <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                      <input 
                        required
                        type="number"
                        step="0.01"
                        value={formData.baseSalary || ''}
                        onChange={(e) => setFormData({ ...formData, baseSalary: parseFloat(e.target.value) || 0 })}
                        className="w-full pl-12 pr-4 py-4 bg-slate-800 border border-slate-700 rounded-2xl text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>

                {/* Dynamic Sections */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Bonuses */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                        <TrendingUp size={18} /> Bonos Adicionales
                      </h3>
                      <button 
                        type="button"
                        onClick={handleAddBonus}
                        className="text-xs bg-emerald-500/10 text-emerald-500 px-2 py-1 rounded-lg hover:bg-emerald-500/20 transition-colors"
                      >
                        + Agregar
                      </button>
                    </div>
                    <div className="space-y-3">
                      {formData.bonuses.map((bonus, idx) => (
                        <div key={idx} className="flex gap-2">
                          <input 
                            type="text"
                            placeholder="Nombre del bono"
                            value={bonus.name}
                            onChange={(e) => {
                              const newBonuses = [...formData.bonuses];
                              newBonuses[idx].name = e.target.value;
                              setFormData({ ...formData, bonuses: newBonuses });
                            }}
                            className="flex-1 px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white text-sm outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                          <input 
                            type="number"
                            placeholder="0.00"
                            value={bonus.amount || ''}
                            onChange={(e) => {
                              const newBonuses = [...formData.bonuses];
                              newBonuses[idx].amount = parseFloat(e.target.value) || 0;
                              setFormData({ ...formData, bonuses: newBonuses });
                            }}
                            className="w-24 px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white text-sm outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Deductions */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-red-400 flex items-center gap-2">
                        <TrendingDown size={18} /> Deducciones Trabajador
                      </h3>
                      <button 
                        type="button"
                        onClick={handleAddDeduction}
                        className="text-xs bg-red-500/10 text-red-500 px-2 py-1 rounded-lg hover:bg-red-500/20 transition-colors"
                      >
                        + Agregar
                      </button>
                    </div>
                    <div className="space-y-3">
                      {formData.deductions.map((deduction, idx) => (
                        <div key={idx} className="flex gap-2">
                          <input 
                            type="text"
                            placeholder="Nombre deducción"
                            value={deduction.name}
                            onChange={(e) => {
                              const newDeductions = [...formData.deductions];
                              newDeductions[idx].name = e.target.value;
                              setFormData({ ...formData, deductions: newDeductions });
                            }}
                            className="flex-1 px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white text-sm outline-none focus:ring-1 focus:ring-red-500"
                          />
                          <input 
                            type="number"
                            placeholder="0.00"
                            value={deduction.amount || ''}
                            onChange={(e) => {
                              const newDeductions = [...formData.deductions];
                              newDeductions[idx].amount = parseFloat(e.target.value) || 0;
                              setFormData({ ...formData, deductions: newDeductions });
                            }}
                            className="w-24 px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white text-sm outline-none focus:ring-1 focus:ring-red-500 font-mono"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Employer Liabilities (State) */}
                <div className="space-y-4 pt-4 border-t border-slate-800">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-blue-400 flex items-center gap-2">
                      <Building2 size={18} /> Pasivos al Estado (Patronales)
                    </h3>
                    <button 
                      type="button"
                      onClick={handleAddLiability}
                      className="text-xs bg-blue-500/10 text-blue-500 px-2 py-1 rounded-lg hover:bg-blue-500/20 transition-colors"
                    >
                      + Agregar
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {formData.employerLiabilities.map((liability, idx) => (
                      <div key={idx} className="flex gap-2">
                        <input 
                          type="text"
                          placeholder="Nombre aporte"
                          value={liability.name}
                          onChange={(e) => {
                            const newLiabilities = [...formData.employerLiabilities];
                            newLiabilities[idx].name = e.target.value;
                            setFormData({ ...formData, employerLiabilities: newLiabilities });
                          }}
                          className="flex-1 px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white text-sm outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <input 
                          type="number"
                          placeholder="0.00"
                          value={liability.amount || ''}
                          onChange={(e) => {
                            const newLiabilities = [...formData.employerLiabilities];
                            newLiabilities[idx].amount = parseFloat(e.target.value) || 0;
                            setFormData({ ...formData, employerLiabilities: newLiabilities });
                          }}
                          className="w-24 px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white text-sm outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Summary Preview */}
                <div className="bg-slate-950/50 p-6 rounded-3xl border border-slate-800 flex flex-col md:flex-row justify-between gap-6">
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Neto Trabajador</span>
                    <div className="text-2xl font-bold text-emerald-400 font-mono">${calculateTotals(formData).workerNet.toLocaleString()}</div>
                    <div className="text-xs text-slate-500">Bs. {(calculateTotals(formData).workerNet * exchangeRate).toLocaleString()}</div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Costo Total Empresa</span>
                    <div className="text-2xl font-bold text-blue-400 font-mono">${calculateTotals(formData).employerCost.toLocaleString()}</div>
                    <div className="text-xs text-slate-500">Bs. {(calculateTotals(formData).employerCost * exchangeRate).toLocaleString()}</div>
                  </div>
                  <div className="flex items-end">
                    <button 
                      type="submit"
                      className="w-full md:w-auto bg-blue-600 hover:bg-blue-500 text-white px-10 py-4 rounded-2xl font-bold transition-all shadow-xl shadow-blue-900/30 flex items-center gap-2"
                    >
                      <Calculator size={20} />
                      Procesar Nómina
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
