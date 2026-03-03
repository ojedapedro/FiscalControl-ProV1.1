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
  Calculator,
  UserPlus,
  Contact,
  Calendar,
  LayoutGrid,
  List,
  Edit3,
  UserCheck,
  UserX,
  Wand2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PayrollEntry, Employee } from '../types';
import { useExchangeRate } from '../contexts/ExchangeRateContext';

interface PayrollModuleProps {
  entries: PayrollEntry[];
  employees: Employee[];
  onAddEntry: (entry: Omit<PayrollEntry, 'id' | 'submittedDate'>) => Promise<void>;
  onDeleteEntry: (id: string) => Promise<void>;
  onAddEmployee: (employee: Employee) => Promise<void>;
  onUpdateEmployee: (employee: Employee) => Promise<void>;
  onDeleteEmployee: (id: string) => Promise<void>;
}

type TabType = 'payroll' | 'employees';

export const PayrollModule: React.FC<PayrollModuleProps> = ({ 
  entries, 
  employees, 
  onAddEntry, 
  onDeleteEntry,
  onAddEmployee,
  onUpdateEmployee,
  onDeleteEmployee
}) => {
  const [activeTab, setActiveTab] = React.useState<TabType>('payroll');
  const [isAddingEntry, setIsAddingEntry] = React.useState(false);
  const [isAddingEmployee, setIsAddingEmployee] = React.useState(false);
  const [editingEmployee, setEditingEmployee] = React.useState<Employee | null>(null);
  const [viewingEmployee, setViewingEmployee] = React.useState<Employee | null>(null);
  const [searchTerm, setSearchTerm] = React.useState('');
  const { exchangeRate } = useExchangeRate();

  // --- Payroll Entry Form State ---
  const [payrollFormData, setPayrollFormData] = React.useState({
    employeeName: '',
    employeeId: '',
    month: new Date().toISOString().slice(0, 7),
    baseSalary: 0,
    bonuses: [{ name: 'Bono de Alimentación', amount: 0 }],
    deductions: [{ name: 'SSO (Seguro Social)', amount: 0 }, { name: 'LPH (Vivienda)', amount: 0 }],
    employerLiabilities: [{ name: 'Aporte Patronal SSO', amount: 0 }, { name: 'Aporte Patronal LPH', amount: 0 }, { name: 'INCES', amount: 0 }]
  });

  // --- Employee Form State ---
  const [employeeFormData, setEmployeeFormData] = React.useState<Omit<Employee, 'id'>>({
    name: '',
    position: '',
    department: '',
    hireDate: new Date().toISOString().split('T')[0],
    baseSalary: 0,
    isActive: true,
    bankAccount: '',
    defaultBonuses: [{ name: 'Bono de Alimentación', amount: 0 }],
    defaultDeductions: [{ name: 'SSO (Seguro Social)', amount: 0 }, { name: 'LPH (Vivienda)', amount: 0 }],
    defaultEmployerLiabilities: [{ name: 'Aporte Patronal SSO', amount: 0 }, { name: 'Aporte Patronal LPH', amount: 0 }, { name: 'INCES', amount: 0 }]
  });
  const [employeeIdInput, setEmployeeIdInput] = React.useState('');

  const calculateTotals = (data: any) => {
    const totalBonuses = (data.bonuses || data.defaultBonuses || []).reduce((acc: number, b: any) => acc + b.amount, 0);
    const totalDeductions = (data.deductions || data.defaultDeductions || []).reduce((acc: number, d: any) => acc + d.amount, 0);
    const totalLiabilities = (data.employerLiabilities || data.defaultEmployerLiabilities || []).reduce((acc: number, l: any) => acc + l.amount, 0);
    
    const workerNet = data.baseSalary + totalBonuses - totalDeductions;
    const employerCost = workerNet + totalLiabilities;
    
    return { workerNet, employerCost };
  };

  const handlePayrollSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { workerNet, employerCost } = calculateTotals(payrollFormData);
    await onAddEntry({
      ...payrollFormData,
      totalWorkerNet: workerNet,
      totalEmployerCost: employerCost,
      status: 'PROCESADO'
    });
    setIsAddingEntry(false);
  };

  const handleEmployeeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingEmployee) {
      await onUpdateEmployee({ ...employeeFormData, id: editingEmployee.id });
    } else {
      await onAddEmployee({ ...employeeFormData, id: employeeIdInput });
    }
    setIsAddingEmployee(false);
    setEditingEmployee(null);
  };

  const handleAutoGeneratePayroll = async () => {
    const activeEmployees = employees.filter(e => e.isActive);
    const currentMonth = new Date().toISOString().slice(0, 7);
    
    for (const emp of activeEmployees) {
      const { workerNet, employerCost } = calculateTotals(emp);
      await onAddEntry({
        employeeName: emp.name,
        employeeId: emp.id,
        month: currentMonth,
        baseSalary: emp.baseSalary,
        bonuses: emp.defaultBonuses,
        deductions: emp.defaultDeductions,
        employerLiabilities: emp.defaultEmployerLiabilities,
        totalWorkerNet: workerNet,
        totalEmployerCost: employerCost,
        status: 'PROCESADO'
      });
    }
  };

  const filteredEntries = entries.filter(e => 
    e.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    e.employeeId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredEmployees = employees.filter(e => 
    e.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    e.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPayrollCost = entries.reduce((acc, e) => acc + e.totalEmployerCost, 0);
  const totalWorkerPayments = entries.reduce((acc, e) => acc + e.totalWorkerNet, 0);
  const totalStateLiabilities = entries.reduce((acc, e) => {
    const liabilitiesSum = e.employerLiabilities.reduce((sum, l) => sum + l.amount, 0);
    return acc + liabilitiesSum;
  }, 0);

  const payrollByMonth = entries.reduce((acc, entry) => {
    if (!acc[entry.month]) {
      acc[entry.month] = {
        month: entry.month,
        totalWorkerNet: 0,
        totalEmployerCost: 0,
        totalStateLiabilities: 0,
        entriesCount: 0
      };
    }
    acc[entry.month].totalWorkerNet += entry.totalWorkerNet;
    acc[entry.month].totalEmployerCost += entry.totalEmployerCost;
    acc[entry.month].totalStateLiabilities += entry.employerLiabilities.reduce((sum, l) => sum + l.amount, 0);
    acc[entry.month].entriesCount += 1;
    return acc;
  }, {} as Record<string, { month: string, totalWorkerNet: number, totalEmployerCost: number, totalStateLiabilities: number, entriesCount: number }>);

  const sortedMonths = Object.values(payrollByMonth).sort((a, b) => b.month.localeCompare(a.month));

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
          <p className="text-slate-400 mt-2 font-medium">Control de expedientes, pasivos laborales y salarios</p>
        </div>
        
        <div className="flex gap-3">
          {activeTab === 'payroll' ? (
            <>
              <button 
                onClick={handleAutoGeneratePayroll}
                disabled={employees.filter(e => e.isActive).length === 0}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-emerald-900/20 active:scale-95"
              >
                <Wand2 size={20} />
                Generar Nómina Automática
              </button>
              <button 
                onClick={() => setIsAddingEntry(true)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-blue-900/20 active:scale-95"
              >
                <Plus size={20} />
                Carga Manual
              </button>
            </>
          ) : (
            <button 
              onClick={() => {
                setEditingEmployee(null);
                setEmployeeIdInput('');
                setEmployeeFormData({
                  name: '',
                  position: '',
                  department: '',
                  hireDate: new Date().toISOString().split('T')[0],
                  baseSalary: 0,
                  isActive: true,
                  bankAccount: '',
                  defaultBonuses: [{ name: 'Bono de Alimentación', amount: 0 }],
                  defaultDeductions: [{ name: 'SSO (Seguro Social)', amount: 0 }, { name: 'LPH (Vivienda)', amount: 0 }],
                  defaultEmployerLiabilities: [{ name: 'Aporte Patronal SSO', amount: 0 }, { name: 'Aporte Patronal LPH', amount: 0 }, { name: 'INCES', amount: 0 }]
                });
                setIsAddingEmployee(true);
              }}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-blue-900/20 active:scale-95"
            >
              <UserPlus size={20} />
              Nuevo Expediente
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-slate-900/80 border border-slate-800 rounded-2xl w-fit">
        <button 
          onClick={() => setActiveTab('payroll')}
          className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
            activeTab === 'payroll' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Calculator size={18} />
          Histórico de Nómina
        </button>
        <button 
          onClick={() => setActiveTab('employees')}
          className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
            activeTab === 'employees' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Contact size={18} />
          Expedientes de Empleados
        </button>
      </div>

      {activeTab === 'payroll' ? (
        <>
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

          {/* Resumen Mensual */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden backdrop-blur-sm">
            <div className="p-6 border-b border-slate-800">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Calendar className="text-blue-500" size={20} />
                Resumen por Mes
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-800/50">
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Mes</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Empleados Procesados</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Neto Trabajadores</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Pasivos Laborales</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Costo Total Empresa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {sortedMonths.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                        No hay nóminas procesadas.
                      </td>
                    </tr>
                  ) : (
                    sortedMonths.map((m) => (
                      <tr key={m.month} className="hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-4 text-white font-bold">{m.month}</td>
                        <td className="px-6 py-4 text-center text-slate-300">
                          <span className="bg-blue-500/10 text-blue-400 py-1 px-3 rounded-full text-xs font-bold">
                            {m.entriesCount}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="font-mono font-bold text-emerald-400">${m.totalWorkerNet.toLocaleString()}</div>
                          <div className="text-[10px] text-slate-500">Bs. {(m.totalWorkerNet * exchangeRate).toLocaleString()}</div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="font-mono font-bold text-orange-400">${m.totalStateLiabilities.toLocaleString()}</div>
                          <div className="text-[10px] text-slate-500">Bs. {(m.totalStateLiabilities * exchangeRate).toLocaleString()}</div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="font-mono font-bold text-blue-400">${m.totalEmployerCost.toLocaleString()}</div>
                          <div className="text-[10px] text-slate-500">Bs. {(m.totalEmployerCost * exchangeRate).toLocaleString()}</div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Payroll Table */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden backdrop-blur-sm">
            <div className="p-6 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input 
                  type="text"
                  placeholder="Buscar en histórico detallado..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-2xl text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
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
                          <div 
                            className="flex items-center gap-3 cursor-pointer group/name"
                            onClick={() => {
                              const emp = employees.find(e => e.id === entry.employeeId);
                              if (emp) setViewingEmployee(emp);
                            }}
                          >
                            <div className="w-10 h-10 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-500 font-bold group-hover/name:bg-blue-500 group-hover/name:text-white transition-colors">
                              {entry.employeeName.charAt(0)}
                            </div>
                            <div>
                              <div className="font-bold text-white group-hover/name:text-blue-400 transition-colors">{entry.employeeName}</div>
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
        </>
      ) : (
        /* Employees View */
        <div className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden backdrop-blur-sm">
          <div className="p-6 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input 
                type="text"
                placeholder="Buscar empleado..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-2xl text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-800/50">
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Empleado</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Cargo / Depto</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Sueldo Base</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Fecha Ingreso</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center gap-3">
                        <Users size={48} className="opacity-20" />
                        <p>No hay expedientes registrados.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map((emp) => (
                    <tr key={emp.id} className="hover:bg-slate-800/30 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-indigo-500/10 rounded-full flex items-center justify-center text-indigo-500 font-bold">
                            {emp.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-white">{emp.name}</div>
                            <div className="text-xs text-slate-500 font-mono">{emp.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-slate-300 font-medium">{emp.position}</div>
                        <div className="text-xs text-slate-500">{emp.department}</div>
                      </td>
                      <td className="px-6 py-4 text-right font-mono text-slate-300">${emp.baseSalary.toLocaleString()}</td>
                      <td className="px-6 py-4 text-slate-400 text-sm">{emp.hireDate}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          emp.isActive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                        }`}>
                          {emp.isActive ? <UserCheck size={12} /> : <UserX size={12} />}
                          {emp.isActive ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                          <button 
                            onClick={() => {
                              setEditingEmployee(emp);
                              setEmployeeIdInput(emp.id);
                              setEmployeeFormData({ ...emp });
                              setIsAddingEmployee(true);
                            }}
                            className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg"
                          >
                            <Edit3 size={18} />
                          </button>
                          <button 
                            onClick={() => onDeleteEmployee(emp.id)}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Payroll Entry Modal */}
      <AnimatePresence>
        {isAddingEntry && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddingEntry(false)}
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
                  onClick={() => setIsAddingEntry(false)}
                  className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
                >
                  <Plus size={24} className="rotate-45" />
                </button>
              </div>

              <form onSubmit={handlePayrollSubmit} className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-8">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Nombre del Trabajador</label>
                    <div className="relative">
                      <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                      <input 
                        required
                        type="text"
                        value={payrollFormData.employeeName}
                        onChange={(e) => setPayrollFormData({ ...payrollFormData, employeeName: e.target.value })}
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
                        value={payrollFormData.employeeId}
                        onChange={(e) => setPayrollFormData({ ...payrollFormData, employeeId: e.target.value })}
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
                      value={payrollFormData.month}
                      onChange={(e) => setPayrollFormData({ ...payrollFormData, month: e.target.value })}
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
                        value={payrollFormData.baseSalary || ''}
                        onChange={(e) => setPayrollFormData({ ...payrollFormData, baseSalary: parseFloat(e.target.value) || 0 })}
                        className="w-full pl-12 pr-4 py-4 bg-slate-800 border border-slate-700 rounded-2xl text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>

                {/* Dynamic Sections (Bonuses, Deductions, Liabilities) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Bonuses */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                        <TrendingUp size={18} /> Bonos Adicionales
                      </h3>
                      <button 
                        type="button"
                        onClick={() => setPayrollFormData({ ...payrollFormData, bonuses: [...payrollFormData.bonuses, { name: '', amount: 0 }] })}
                        className="text-xs bg-emerald-500/10 text-emerald-500 px-2 py-1 rounded-lg hover:bg-emerald-500/20 transition-colors"
                      >
                        + Agregar
                      </button>
                    </div>
                    <div className="space-y-3">
                      {payrollFormData.bonuses.map((bonus, idx) => (
                        <div key={idx} className="flex gap-2">
                          <input 
                            type="text"
                            placeholder="Nombre del bono"
                            value={bonus.name}
                            onChange={(e) => {
                              const newBonuses = [...payrollFormData.bonuses];
                              newBonuses[idx].name = e.target.value;
                              setPayrollFormData({ ...payrollFormData, bonuses: newBonuses });
                            }}
                            className="flex-1 px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white text-sm outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                          <input 
                            type="number"
                            placeholder="0.00"
                            value={bonus.amount || ''}
                            onChange={(e) => {
                              const newBonuses = [...payrollFormData.bonuses];
                              newBonuses[idx].amount = parseFloat(e.target.value) || 0;
                              setPayrollFormData({ ...payrollFormData, bonuses: newBonuses });
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
                        onClick={() => setPayrollFormData({ ...payrollFormData, deductions: [...payrollFormData.deductions, { name: '', amount: 0 }] })}
                        className="text-xs bg-red-500/10 text-red-500 px-2 py-1 rounded-lg hover:bg-red-500/20 transition-colors"
                      >
                        + Agregar
                      </button>
                    </div>
                    <div className="space-y-3">
                      {payrollFormData.deductions.map((deduction, idx) => (
                        <div key={idx} className="flex gap-2">
                          <input 
                            type="text"
                            placeholder="Nombre deducción"
                            value={deduction.name}
                            onChange={(e) => {
                              const newDeductions = [...payrollFormData.deductions];
                              newDeductions[idx].name = e.target.value;
                              setPayrollFormData({ ...payrollFormData, deductions: newDeductions });
                            }}
                            className="flex-1 px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white text-sm outline-none focus:ring-1 focus:ring-red-500"
                          />
                          <input 
                            type="number"
                            placeholder="0.00"
                            value={deduction.amount || ''}
                            onChange={(e) => {
                              const newDeductions = [...payrollFormData.deductions];
                              newDeductions[idx].amount = parseFloat(e.target.value) || 0;
                              setPayrollFormData({ ...payrollFormData, deductions: newDeductions });
                            }}
                            className="w-24 px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white text-sm outline-none focus:ring-1 focus:ring-red-500 font-mono"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Summary Preview */}
                <div className="bg-slate-950/50 p-6 rounded-3xl border border-slate-800 flex flex-col md:flex-row justify-between gap-6">
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Neto Trabajador</span>
                    <div className="text-2xl font-bold text-emerald-400 font-mono">${calculateTotals(payrollFormData).workerNet.toLocaleString()}</div>
                    <div className="text-xs text-slate-500">Bs. {(calculateTotals(payrollFormData).workerNet * exchangeRate).toLocaleString()}</div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Costo Total Empresa</span>
                    <div className="text-2xl font-bold text-blue-400 font-mono">${calculateTotals(payrollFormData).employerCost.toLocaleString()}</div>
                    <div className="text-xs text-slate-500">Bs. {(calculateTotals(payrollFormData).employerCost * exchangeRate).toLocaleString()}</div>
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

      {/* Add Employee Modal */}
      <AnimatePresence>
        {isAddingEmployee && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddingEmployee(false)}
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
                  <div className="p-3 bg-indigo-600 rounded-2xl">
                    <Contact className="text-white" size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">{editingEmployee ? 'Editar Expediente' : 'Nuevo Expediente de Empleado'}</h2>
                    <p className="text-slate-400 text-sm font-medium">Información base para generación automática de nómina</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsAddingEmployee(false)}
                  className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
                >
                  <Plus size={24} className="rotate-45" />
                </button>
              </div>

              <form onSubmit={handleEmployeeSubmit} className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-8">
                {/* Employee Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Nombre Completo</label>
                    <input 
                      required
                      type="text"
                      value={employeeFormData.name}
                      onChange={(e) => setEmployeeFormData({ ...employeeFormData, name: e.target.value })}
                      className="w-full px-4 py-4 bg-slate-800 border border-slate-700 rounded-2xl text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                      placeholder="Ej. Juan Pérez"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Cédula / ID</label>
                    <input 
                      required
                      disabled={!!editingEmployee}
                      type="text"
                      value={employeeIdInput}
                      onChange={(e) => setEmployeeIdInput(e.target.value)}
                      className="w-full px-4 py-4 bg-slate-800 border border-slate-700 rounded-2xl text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-mono disabled:opacity-50"
                      placeholder="Ej. V-12345678"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Cargo</label>
                    <input 
                      required
                      type="text"
                      value={employeeFormData.position}
                      onChange={(e) => setEmployeeFormData({ ...employeeFormData, position: e.target.value })}
                      className="w-full px-4 py-4 bg-slate-800 border border-slate-700 rounded-2xl text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                      placeholder="Ej. Gerente de Tienda"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Departamento</label>
                    <input 
                      required
                      type="text"
                      value={employeeFormData.department}
                      onChange={(e) => setEmployeeFormData({ ...employeeFormData, department: e.target.value })}
                      className="w-full px-4 py-4 bg-slate-800 border border-slate-700 rounded-2xl text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                      placeholder="Ej. Operaciones"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Sueldo Base Mensual ($)</label>
                    <input 
                      required
                      type="number"
                      step="0.01"
                      value={employeeFormData.baseSalary || ''}
                      onChange={(e) => setEmployeeFormData({ ...employeeFormData, baseSalary: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-4 bg-slate-800 border border-slate-700 rounded-2xl text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-mono"
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Fecha de Ingreso</label>
                    <input 
                      required
                      type="date"
                      value={employeeFormData.hireDate}
                      onChange={(e) => setEmployeeFormData({ ...employeeFormData, hireDate: e.target.value })}
                      className="w-full px-4 py-4 bg-slate-800 border border-slate-700 rounded-2xl text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    />
                  </div>
                </div>

                {/* Default Payroll Config */}
                <div className="space-y-6 pt-6 border-t border-slate-800">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Calculator size={20} className="text-indigo-400" /> Configuración de Nómina Predeterminada
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Default Bonuses */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Bonos Fijos</h4>
                        <button 
                          type="button"
                          onClick={() => setEmployeeFormData({ ...employeeFormData, defaultBonuses: [...employeeFormData.defaultBonuses, { name: '', amount: 0 }] })}
                          className="text-[10px] bg-indigo-500/10 text-indigo-400 px-2 py-1 rounded-lg hover:bg-indigo-500/20 transition-colors"
                        >
                          + Agregar
                        </button>
                      </div>
                      <div className="space-y-2">
                        {employeeFormData.defaultBonuses.map((bonus, idx) => (
                          <div key={idx} className="flex gap-2">
                            <input 
                              type="text"
                              placeholder="Nombre bono"
                              value={bonus.name}
                              onChange={(e) => {
                                const newBonuses = [...employeeFormData.defaultBonuses];
                                newBonuses[idx].name = e.target.value;
                                setEmployeeFormData({ ...employeeFormData, defaultBonuses: newBonuses });
                              }}
                              className="flex-1 px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-xl text-white text-xs outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                            <input 
                              type="number"
                              placeholder="0.00"
                              value={bonus.amount || ''}
                              onChange={(e) => {
                                const newBonuses = [...employeeFormData.defaultBonuses];
                                newBonuses[idx].amount = parseFloat(e.target.value) || 0;
                                setEmployeeFormData({ ...employeeFormData, defaultBonuses: newBonuses });
                              }}
                              className="w-20 px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-xl text-white text-xs outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Default Deductions */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Deducciones Fijas</h4>
                        <button 
                          type="button"
                          onClick={() => setEmployeeFormData({ ...employeeFormData, defaultDeductions: [...employeeFormData.defaultDeductions, { name: '', amount: 0 }] })}
                          className="text-[10px] bg-indigo-500/10 text-indigo-400 px-2 py-1 rounded-lg hover:bg-indigo-500/20 transition-colors"
                        >
                          + Agregar
                        </button>
                      </div>
                      <div className="space-y-2">
                        {employeeFormData.defaultDeductions.map((deduction, idx) => (
                          <div key={idx} className="flex gap-2">
                            <input 
                              type="text"
                              placeholder="Nombre deducción"
                              value={deduction.name}
                              onChange={(e) => {
                                const newDeductions = [...employeeFormData.defaultDeductions];
                                newDeductions[idx].name = e.target.value;
                                setEmployeeFormData({ ...employeeFormData, defaultDeductions: newDeductions });
                              }}
                              className="flex-1 px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-xl text-white text-xs outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                            <input 
                              type="number"
                              placeholder="0.00"
                              value={deduction.amount || ''}
                              onChange={(e) => {
                                const newDeductions = [...employeeFormData.defaultDeductions];
                                newDeductions[idx].amount = parseFloat(e.target.value) || 0;
                                setEmployeeFormData({ ...employeeFormData, defaultDeductions: newDeductions });
                              }}
                              className="w-20 px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-xl text-white text-xs outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-950/50 p-6 rounded-3xl border border-slate-800 flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer"
                        checked={employeeFormData.isActive}
                        onChange={(e) => setEmployeeFormData({ ...employeeFormData, isActive: e.target.checked })}
                      />
                      <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                      <span className="ml-3 text-sm font-bold text-slate-300">Empleado Activo</span>
                    </label>
                  </div>
                  <button 
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-10 py-4 rounded-2xl font-bold transition-all shadow-xl shadow-indigo-900/30"
                  >
                    {editingEmployee ? 'Guardar Cambios' : 'Crear Expediente'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* View Employee Modal */}
      <AnimatePresence>
        {viewingEmployee && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setViewingEmployee(null)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-indigo-500/10 rounded-full flex items-center justify-center text-indigo-500 font-bold text-2xl">
                    {viewingEmployee.name.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">{viewingEmployee.name}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-slate-400 font-mono text-sm">{viewingEmployee.id}</span>
                      <span className="text-slate-600">•</span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        viewingEmployee.isActive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                      }`}>
                        {viewingEmployee.isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setViewingEmployee(null)}
                  className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
                >
                  <Plus size={24} className="rotate-45" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-8">
                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-slate-800/30 p-4 rounded-2xl border border-slate-700/50">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Cargo</div>
                    <div className="text-white font-medium">{viewingEmployee.position}</div>
                  </div>
                  <div className="bg-slate-800/30 p-4 rounded-2xl border border-slate-700/50">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Departamento</div>
                    <div className="text-white font-medium">{viewingEmployee.department}</div>
                  </div>
                  <div className="bg-slate-800/30 p-4 rounded-2xl border border-slate-700/50">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Fecha de Ingreso</div>
                    <div className="text-white font-medium">{viewingEmployee.hireDate}</div>
                  </div>
                  <div className="bg-slate-800/30 p-4 rounded-2xl border border-slate-700/50">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Sueldo Base</div>
                    <div className="text-white font-bold font-mono text-lg">${viewingEmployee.baseSalary.toLocaleString()}</div>
                    <div className="text-xs text-slate-500">Bs. {(viewingEmployee.baseSalary * exchangeRate).toLocaleString()}</div>
                  </div>
                </div>

                {/* Configuración de Nómina */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
                    <Calculator size={16} className="text-indigo-400" /> Configuración de Nómina
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Bonos */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                        <TrendingUp size={14} /> Bonos Fijos
                      </h4>
                      {viewingEmployee.defaultBonuses.length > 0 ? (
                        <div className="space-y-2">
                          {viewingEmployee.defaultBonuses.map((b, i) => (
                            <div key={i} className="flex justify-between items-center bg-slate-800/30 p-3 rounded-xl border border-slate-700/50">
                              <span className="text-sm text-slate-300">{b.name}</span>
                              <span className="text-sm font-bold text-emerald-400 font-mono">+${b.amount}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-slate-500 italic">No hay bonos configurados</div>
                      )}
                    </div>

                    {/* Deducciones */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                        <TrendingDown size={14} /> Deducciones Fijas
                      </h4>
                      {viewingEmployee.defaultDeductions.length > 0 ? (
                        <div className="space-y-2">
                          {viewingEmployee.defaultDeductions.map((d, i) => (
                            <div key={i} className="flex justify-between items-center bg-slate-800/30 p-3 rounded-xl border border-slate-700/50">
                              <span className="text-sm text-slate-300">{d.name}</span>
                              <span className="text-sm font-bold text-red-400 font-mono">-${d.amount}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-slate-500 italic">No hay deducciones configuradas</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
