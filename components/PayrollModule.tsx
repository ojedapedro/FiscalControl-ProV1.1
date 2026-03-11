import React from 'react';
import { 
  Users, 
  Briefcase, 
  Plus, 
  Search, 
  DollarSign, 
  FileText, 
  Calculator, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  ShieldCheck, 
  Contact, 
  Trash2,
  ChevronRight,
  UserPlus,
  LayoutGrid,
  List,
  Edit3,
  UserCheck,
  UserX,
  Wand2,
  Download,
  FileSignature,
  CheckCircle2,
  Clock,
  Landmark,
  Building2,
  Upload,
  AlertCircle,
  AlertTriangle,
  Eye,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx';
import { PayrollEntry, Employee } from '../types';
import { STORES } from '../constants';
import { useExchangeRate } from '../contexts/ExchangeRateContext';

import { User } from '../types';

interface PayrollModuleProps {
  entries: PayrollEntry[];
  employees: Employee[];
  onAddEntry: (entry: Omit<PayrollEntry, 'id' | 'submittedDate'>) => Promise<void>;
  onUpdateEntry?: (entry: PayrollEntry) => Promise<void>;
  onDeleteEntry: (id: string) => Promise<void>;
  onAddEmployee: (employee: Employee) => Promise<void>;
  onUpdateEmployee: (employee: Employee) => Promise<void>;
  onDeleteEmployee: (id: string) => Promise<void>;
  currentUser?: User | null;
}

type TabType = 'payroll' | 'employees';

export const PayrollModule: React.FC<PayrollModuleProps> = ({ 
  entries, 
  employees, 
  onAddEntry, 
  onUpdateEntry,
  onDeleteEntry,
  onAddEmployee,
  onUpdateEmployee,
  onDeleteEmployee,
  currentUser
}) => {
  const [activeTab, setActiveTab] = React.useState<TabType>('payroll');
  const [isAddingEntry, setIsAddingEntry] = React.useState(false);
  const [isAddingEmployee, setIsAddingEmployee] = React.useState(false);
  const [editingEmployee, setEditingEmployee] = React.useState<Employee | null>(null);
  const [viewingEmployee, setViewingEmployee] = React.useState<Employee | null>(null);
  const [viewingEntry, setViewingEntry] = React.useState<PayrollEntry | null>(null);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [importProgress, setImportProgress] = React.useState<number | null>(null);
  const [importErrors, setImportErrors] = React.useState<string[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const { exchangeRate } = useExchangeRate();

  const calculateParafiscales = (baseSalary: number, bonuses: {amount: number}[]) => {
    const totalBonuses = bonuses.reduce((sum, b) => sum + b.amount, 0);
    const salarioNormal = baseSalary;
    const salarioIntegral = baseSalary + totalBonuses;
    const totalPagos = baseSalary + totalBonuses;

    return {
      deductions: [
        { name: 'SSO (4%)', amount: Number((salarioNormal * 0.04).toFixed(2)) },
        { name: 'RPE (0.5%)', amount: Number((salarioNormal * 0.005).toFixed(2)) },
        { name: 'FAOV / LPH (1%)', amount: Number((salarioIntegral * 0.01).toFixed(2)) },
        { name: 'INCES (0.5%)', amount: Number((salarioNormal * 0.005).toFixed(2)) }
      ],
      liabilities: [
        { name: 'SSO Patronal (9%)', amount: Number((salarioNormal * 0.09).toFixed(2)) },
        { name: 'RPE Patronal (2%)', amount: Number((salarioNormal * 0.02).toFixed(2)) },
        { name: 'FAOV Patronal (2%)', amount: Number((salarioIntegral * 0.02).toFixed(2)) },
        { name: 'INCES Patronal (2%)', amount: Number((salarioNormal * 0.02).toFixed(2)) },
        { name: 'Fondo de Pensiones (9%)', amount: Number((totalPagos * 0.09).toFixed(2)) }
      ]
    };
  };

  const getParafiscalDiff = (name: string, amount: number, baseSalary: number, bonuses: {amount: number}[]) => {
    const { deductions, liabilities } = calculateParafiscales(baseSalary, bonuses);
    const all = [...deductions, ...liabilities];
    const theoretical = all.find(item => item.name === name)?.amount || 0;
    const diff = amount - theoretical;
    return { theoretical, diff, hasDiff: Math.abs(diff) > 0.01 };
  };

  const hasParafiscalDiscrepancies = (entry: PayrollEntry) => {
    const { deductions, liabilities } = calculateParafiscales(entry.baseSalary, entry.bonuses);
    
    const hasDeductionDiff = entry.deductions.some(d => {
      const theoretical = deductions.find(item => item.name === d.name)?.amount || 0;
      return Math.abs(d.amount - theoretical) > 0.01;
    });

    const hasLiabilityDiff = entry.employerLiabilities.some(l => {
      const theoretical = liabilities.find(item => item.name === l.name)?.amount || 0;
      return Math.abs(l.amount - theoretical) > 0.01;
    });

    return hasDeductionDiff || hasLiabilityDiff;
  };

  // --- Payroll Entry Form State ---
  const [payrollFormData, setPayrollFormData] = React.useState({
    employeeName: '',
    employeeId: '',
    storeId: currentUser?.storeId || '',
    month: new Date().toISOString().slice(0, 7),
    baseSalary: 0,
    bonuses: [{ name: 'Bono de Alimentación', amount: 0 }],
    deductions: [
      { name: 'SSO (4%)', amount: 0 }, 
      { name: 'RPE (0.5%)', amount: 0 }, 
      { name: 'FAOV / LPH (1%)', amount: 0 }, 
      { name: 'INCES (0.5%)', amount: 0 }
    ],
    employerLiabilities: [
      { name: 'SSO Patronal (9%)', amount: 0 }, 
      { name: 'RPE Patronal (2%)', amount: 0 }, 
      { name: 'FAOV Patronal (2%)', amount: 0 }, 
      { name: 'INCES Patronal (2%)', amount: 0 },
      { name: 'Fondo de Pensiones (9%)', amount: 0 }
    ]
  });

  // --- Employee Form State ---
  const [employeeFormData, setEmployeeFormData] = React.useState<Omit<Employee, 'id'>>({
    name: '',
    position: '',
    department: '',
    storeId: currentUser?.storeId || '',
    hireDate: new Date().toISOString().split('T')[0],
    baseSalary: 0,
    isActive: true,
    bankAccount: '',
    defaultBonuses: [{ name: 'Bono de Alimentación', amount: 0 }],
    defaultDeductions: [
      { name: 'SSO (4%)', amount: 0 }, 
      { name: 'RPE (0.5%)', amount: 0 }, 
      { name: 'FAOV / LPH (1%)', amount: 0 }, 
      { name: 'INCES (0.5%)', amount: 0 }
    ],
    defaultEmployerLiabilities: [
      { name: 'SSO Patronal (9%)', amount: 0 }, 
      { name: 'RPE Patronal (2%)', amount: 0 }, 
      { name: 'FAOV Patronal (2%)', amount: 0 }, 
      { name: 'INCES Patronal (2%)', amount: 0 },
      { name: 'Fondo de Pensiones (9%)', amount: 0 }
    ]
  });
  const [employeeIdInput, setEmployeeIdInput] = React.useState('');

  // --- AR-I Form State ---
  const [isAriModalOpen, setIsAriModalOpen] = React.useState(false);
  const [ariEmployee, setAriEmployee] = React.useState<Employee | null>(null);
  const [ariData, setAriData] = React.useState({
    estimatedIncomeBs: 0,
    estimatedExpensesBs: 0,
    dependents: 0,
    taxUnitValueBs: 9.00
  });

  const calculateARI = () => {
    const { estimatedIncomeBs, estimatedExpensesBs, dependents, taxUnitValueBs } = ariData;
    if (taxUnitValueBs <= 0) return { percentage: 0, totalTaxBs: 0, isObligated: false, incomeUT: 0 };

    const incomeUT = estimatedIncomeBs / taxUnitValueBs;
    const expensesUT = estimatedExpensesBs / taxUnitValueBs;
    
    const isObligated = incomeUT > 1000;
    
    const taxableIncomeUT = Math.max(0, incomeUT - expensesUT);
    
    let taxUT = 0;
    if (taxableIncomeUT <= 1000) {
      taxUT = taxableIncomeUT * 0.06;
    } else if (taxableIncomeUT <= 1500) {
      taxUT = (taxableIncomeUT * 0.09) - 30;
    } else if (taxableIncomeUT <= 2000) {
      taxUT = (taxableIncomeUT * 0.12) - 75;
    } else if (taxableIncomeUT <= 2500) {
      taxUT = (taxableIncomeUT * 0.16) - 155;
    } else if (taxableIncomeUT <= 3000) {
      taxUT = (taxableIncomeUT * 0.20) - 255;
    } else if (taxableIncomeUT <= 4000) {
      taxUT = (taxableIncomeUT * 0.24) - 375;
    } else if (taxableIncomeUT <= 6000) {
      taxUT = (taxableIncomeUT * 0.29) - 575;
    } else {
      taxUT = (taxableIncomeUT * 0.34) - 875;
    }

    // Rebajas
    const rebajaPersonalUT = 10;
    const rebajaCargasUT = dependents * 10;
    const totalRebajasUT = rebajaPersonalUT + rebajaCargasUT;

    const finalTaxUT = Math.max(0, taxUT - totalRebajasUT);
    const finalTaxBs = finalTaxUT * taxUnitValueBs;
    
    let percentage = 0;
    if (estimatedIncomeBs > 0) {
      percentage = (finalTaxBs / estimatedIncomeBs) * 100;
    }

    return { percentage, totalTaxBs: finalTaxBs, isObligated, incomeUT };
  };

  // --- Prestaciones Sociales State ---
  const [isPrestacionesModalOpen, setIsPrestacionesModalOpen] = React.useState(false);
  const [prestacionesEmployee, setPrestacionesEmployee] = React.useState<Employee | null>(null);
  const [prestacionesEndDate, setPrestacionesEndDate] = React.useState(new Date().toISOString().split('T')[0]);

  const calculatePrestaciones = () => {
    if (!prestacionesEmployee) return null;

    const hireDate = new Date(prestacionesEmployee.hireDate);
    const endDate = new Date(prestacionesEndDate);
    
    if (endDate < hireDate) return null;

    // Calculate time difference
    let years = endDate.getFullYear() - hireDate.getFullYear();
    let months = endDate.getMonth() - hireDate.getMonth();
    let days = endDate.getDate() - hireDate.getDate();
    
    if (days < 0) {
      months -= 1;
      days += new Date(endDate.getFullYear(), endDate.getMonth(), 0).getDate();
    }
    if (months < 0) {
      years -= 1;
      months += 12;
    }
    
    const totalMonths = years * 12 + months;
    const quarters = Math.floor(totalMonths / 3);
    
    // Integral Salary
    const totalBonuses = prestacionesEmployee.defaultBonuses.reduce((sum, b) => sum + b.amount, 0);
    const monthlyIntegralSalary = prestacionesEmployee.baseSalary + totalBonuses;
    const dailyIntegralSalary = monthlyIntegralSalary / 30;
    
    // 1. Garantía Trimestral (Art. 142 literal a y b)
    const baseDaysQuarterly = quarters * 15;
    
    // Días adicionales por antigüedad (después del 1er año, 2 días por año, max 30)
    let additionalDays = 0;
    if (years > 1) {
      additionalDays = (years - 1) * 2;
      if (additionalDays > 30) additionalDays = 30;
    }
    
    const totalGuaranteeDays = baseDaysQuarterly + additionalDays;
    const totalGuaranteeAmount = totalGuaranteeDays * dailyIntegralSalary;
    
    // 2. Cálculo Literal C (Retroactivo - Art. 142 literal c)
    let literalCYears = years;
    if (months >= 6) {
      literalCYears += 1;
    }
    
    const literalCDays = literalCYears * 30;
    const literalCAmount = literalCDays * dailyIntegralSalary;
    
    // 3. Monto a Pagar (El mayor)
    const finalAmount = Math.max(totalGuaranteeAmount, literalCAmount);
    
    return {
      years, months, days,
      dailyIntegralSalary,
      quarters,
      baseDaysQuarterly,
      additionalDays,
      totalGuaranteeDays,
      totalGuaranteeAmount,
      literalCYears,
      literalCDays,
      literalCAmount,
      finalAmount
    };
  };

  const applyLawCalculationsToPayroll = () => {
    const { deductions, liabilities } = calculateParafiscales(payrollFormData.baseSalary, payrollFormData.bonuses);
    setPayrollFormData(prev => ({
      ...prev,
      deductions,
      employerLiabilities: liabilities
    }));
  };

  const applyLawCalculationsToEmployee = () => {
    const { deductions, liabilities } = calculateParafiscales(employeeFormData.baseSalary, employeeFormData.defaultBonuses);
    setEmployeeFormData(prev => ({
      ...prev,
      defaultDeductions: deductions,
      defaultEmployerLiabilities: liabilities
    }));
  };

  const exportToCSV = () => {
    // Define headers
    const headers = [
      'Trabajador',
      'Cédula/ID',
      'Mes',
      'Sueldo Base ($)',
      'Total Bonos ($)',
      'Total Deducciones ($)',
      'Total Pasivos Empresa ($)',
      'Neto Trabajador ($)',
      'Costo Total Empresa ($)',
      'Estado',
      'Fecha Registro'
    ];

    // Map data to rows
    const rows = filteredEntries.map(entry => {
      const totalBonuses = entry.bonuses.reduce((sum, b) => sum + b.amount, 0);
      const totalDeductions = entry.deductions.reduce((sum, d) => sum + d.amount, 0);
      const totalLiabilities = entry.employerLiabilities.reduce((sum, l) => sum + l.amount, 0);
      
      return [
        `"${entry.employeeName}"`,
        `"${entry.employeeId}"`,
        `"${entry.month}"`,
        entry.baseSalary.toFixed(2),
        totalBonuses.toFixed(2),
        totalDeductions.toFixed(2),
        totalLiabilities.toFixed(2),
        entry.totalWorkerNet.toFixed(2),
        entry.totalEmployerCost.toFixed(2),
        `"${entry.status}"`,
        `"${new Date(entry.submittedDate).toLocaleDateString()}"`
      ];
    });

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Create blob and download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `historico_nomina_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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

  const handleAdjustParafiscal = async (entry: PayrollEntry, fieldName: string, type: 'deduction' | 'liability') => {
    if (!onUpdateEntry) return;

    const { deductions, liabilities } = calculateParafiscales(entry.baseSalary, entry.bonuses);
    const theoreticalValue = (type === 'deduction' ? deductions : liabilities).find(i => i.name === fieldName)?.amount || 0;

    const updatedEntry = {
      ...entry,
      deductions: type === 'deduction' 
        ? entry.deductions.map(d => d.name === fieldName ? { ...d, amount: theoreticalValue } : d)
        : entry.deductions,
      employerLiabilities: type === 'liability'
        ? entry.employerLiabilities.map(l => l.name === fieldName ? { ...l, amount: theoreticalValue } : l)
        : entry.employerLiabilities
    };

    // Recalcular totales
    const totalBonuses = updatedEntry.bonuses.reduce((sum, b) => sum + b.amount, 0);
    const totalDeductions = updatedEntry.deductions.reduce((sum, d) => sum + d.amount, 0);
    const totalLiabilities = updatedEntry.employerLiabilities.reduce((sum, l) => sum + l.amount, 0);
    
    updatedEntry.totalWorkerNet = updatedEntry.baseSalary + totalBonuses - totalDeductions;
    updatedEntry.totalEmployerCost = updatedEntry.baseSalary + totalBonuses + totalLiabilities;

    await onUpdateEntry(updatedEntry);
    setViewingEntry(updatedEntry);
  };

  const handleAutoGeneratePayroll = async () => {
    const activeEmployees = employees.filter(e => e.isActive);
    const currentMonth = new Date().toISOString().slice(0, 7);
    
    for (const emp of activeEmployees) {
      const { workerNet, employerCost } = calculateTotals(emp);
      await onAddEntry({
        employeeName: emp.name,
        employeeId: emp.id,
        storeId: emp.storeId,
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportProgress(0);
    setImportErrors([]);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        if (data.length === 0) {
          setImportErrors(['El archivo está vacío']);
          setImportProgress(null);
          return;
        }

        const errors: string[] = [];
        let processedCount = 0;

        for (let i = 0; i < data.length; i++) {
          const row: any = data[i];
          
          // Normalizar nombres de columnas (quitar espacios, minúsculas)
          const normalizedRow: any = {};
          Object.keys(row).forEach(key => {
            const normalizedKey = key.toLowerCase().trim()
              .replace(/ /g, '_')
              .replace(/cedula|id_empleado|id/g, 'employeeid')
              .replace(/mes|periodo/g, 'month')
              .replace(/sueldo|salario|base/g, 'basesalary');
            normalizedRow[normalizedKey] = row[key];
          });

          // Basic validation
          if (!normalizedRow.employeeid || !normalizedRow.month || normalizedRow.basesalary === undefined) {
            errors.push(`Fila ${i + 2}: Faltan campos obligatorios (ID Empleado, Mes, Sueldo Base)`);
            continue;
          }

          const employee = employees.find(emp => emp.id.toString() === normalizedRow.employeeid.toString());
          if (!employee) {
            errors.push(`Fila ${i + 2}: Empleado con ID ${normalizedRow.employeeid} no encontrado`);
            continue;
          }

          // Prepare entry
          const baseSalary = Number(normalizedRow.basesalary);
          const bonuses = employee.defaultBonuses;
          
          const { workerNet, employerCost } = calculateTotals({
            baseSalary,
            bonuses,
            deductions: employee.defaultDeductions,
            employerLiabilities: employee.defaultEmployerLiabilities
          });

          await onAddEntry({
            employeeName: employee.name,
            employeeId: employee.id,
            storeId: employee.storeId,
            month: normalizedRow.month.toString(),
            baseSalary,
            bonuses,
            deductions: employee.defaultDeductions,
            employerLiabilities: employee.defaultEmployerLiabilities,
            totalWorkerNet: workerNet,
            totalEmployerCost: employerCost,
            status: 'PROCESADO'
          });

          processedCount++;
          setImportProgress(Math.round(((i + 1) / data.length) * 100));
        }

        if (errors.length > 0) {
          setImportErrors(errors);
        } else {
          alert(`✅ Se cargaron ${processedCount} registros exitosamente`);
        }
      } catch (err) {
        setImportErrors(['Error procesando el archivo: ' + (err as Error).message]);
      } finally {
        setImportProgress(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsBinaryString(file);
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

  const payrollByStoreMonth = entries.reduce((acc, entry) => {
    const key = `${entry.month}-${entry.storeId}`;
    if (!acc[key]) {
      acc[key] = {
        month: entry.month,
        storeId: entry.storeId,
        totalWorkerNet: 0,
        totalEmployerCost: 0,
        totalStateLiabilities: 0,
        entriesCount: 0
      };
    }
    acc[key].totalWorkerNet += entry.totalWorkerNet;
    acc[key].totalEmployerCost += entry.totalEmployerCost;
    acc[key].totalStateLiabilities += entry.employerLiabilities.reduce((sum, l) => sum + l.amount, 0);
    acc[key].entriesCount += 1;
    return acc;
  }, {} as Record<string, { month: string, storeId: string, totalWorkerNet: number, totalEmployerCost: number, totalStateLiabilities: number, entriesCount: number }>);

  const sortedStoreMonth = Object.values(payrollByStoreMonth).sort((a, b) => b.month.localeCompare(a.month));

  const payrollByMonth = entries.reduce((acc, entry) => {
    if (!acc[entry.month]) {
      acc[entry.month] = {
        month: entry.month,
        totalWorkerNet: 0,
        totalEmployerCost: 0,
        totalStateLiabilities: 0,
        entriesCount: 0,
        ssoTotal: 0,
        lphTotal: 0,
        incesTotal: 0
      };
    }
    acc[entry.month].totalWorkerNet += entry.totalWorkerNet;
    acc[entry.month].totalEmployerCost += entry.totalEmployerCost;
    acc[entry.month].totalStateLiabilities += entry.employerLiabilities.reduce((sum, l) => sum + l.amount, 0);
    acc[entry.month].entriesCount += 1;
    
    entry.employerLiabilities.forEach(l => {
      const name = l.name.toLowerCase();
      if (name.includes('sso') || name.includes('seguro social')) acc[entry.month].ssoTotal += l.amount;
      else if (name.includes('lph') || name.includes('vivienda')) acc[entry.month].lphTotal += l.amount;
      else if (name.includes('inces')) acc[entry.month].incesTotal += l.amount;
    });

    return acc;
  }, {} as Record<string, { month: string, totalWorkerNet: number, totalEmployerCost: number, totalStateLiabilities: number, entriesCount: number, ssoTotal: number, lphTotal: number, incesTotal: number }>);

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
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".csv, .xlsx, .xls"
                onChange={handleFileUpload}
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-slate-900/20 active:scale-95"
              >
                <Upload size={20} />
                Importar CSV/Excel
              </button>
              <button 
                onClick={handleAutoGeneratePayroll}
                disabled={employees.filter(e => e.isActive).length === 0}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-emerald-900/20 active:scale-95"
              >
                <Wand2 size={20} />
                Generar Nómina Automática
              </button>
              <button 
                onClick={() => {
                  setPayrollFormData({
                    employeeName: '',
                    employeeId: '',
                    storeId: currentUser?.storeId || '',
                    month: new Date().toISOString().slice(0, 7),
                    baseSalary: 0,
                    bonuses: [{ name: 'Bono de Alimentación', amount: 0 }],
                    deductions: [
                      { name: 'SSO (4%)', amount: 0 }, 
                      { name: 'RPE (0.5%)', amount: 0 }, 
                      { name: 'FAOV / LPH (1%)', amount: 0 }, 
                      { name: 'INCES (0.5%)', amount: 0 }
                    ],
                    employerLiabilities: [
                      { name: 'SSO Patronal (9%)', amount: 0 }, 
                      { name: 'RPE Patronal (2%)', amount: 0 }, 
                      { name: 'FAOV Patronal (2%)', amount: 0 }, 
                      { name: 'INCES Patronal (2%)', amount: 0 },
                      { name: 'Fondo de Pensiones (9%)', amount: 0 }
                    ]
                  });
                  setIsAddingEntry(true);
                }}
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
                  storeId: currentUser?.storeId || '',
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

      {importProgress !== null && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-8 shadow-2xl text-center">
            <div className="mb-6">
              <div className="relative w-24 h-24 mx-auto mb-4">
                <svg className="w-full h-full" viewBox="0 0 36 36">
                  <path
                    className="text-slate-800 stroke-current"
                    strokeWidth="3"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-blue-500 stroke-current"
                    strokeWidth="3"
                    strokeDasharray={`${importProgress}, 100`}
                    strokeLinecap="round"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center font-bold text-white">
                  {importProgress}%
                </div>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Procesando Nómina</h3>
              <p className="text-slate-400 text-sm">Por favor espere mientras validamos y cargamos los registros...</p>
            </div>
          </div>
        </div>
      )}

      {importErrors.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/50 p-6 rounded-3xl mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-red-500 font-bold flex items-center gap-2">
              <AlertCircle size={20} />
              Errores en la Importación
            </h3>
            <button 
              onClick={() => setImportErrors([])}
              className="text-slate-400 hover:text-white"
            >
              <Trash2 size={18} />
            </button>
          </div>
          <div className="max-h-40 overflow-y-auto space-y-2 custom-scrollbar">
            {importErrors.map((err, idx) => (
              <p key={idx} className="text-sm text-red-400/80">• {err}</p>
            ))}
          </div>
        </div>
      )}

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

          {/* Resumen por Tienda y Mes */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden backdrop-blur-sm">
            <div className="p-6 border-b border-slate-800">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Building2 className="text-blue-500" size={20} />
                Resumen por Tienda y Mes
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-800/50">
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Mes</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Tienda</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Empleados</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Neto Trabajadores</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Pasivos Laborales</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Costo Total Empresa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {sortedStoreMonth.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                        No hay nóminas procesadas por tienda y mes.
                      </td>
                    </tr>
                  ) : (
                    sortedStoreMonth.map((s) => (
                      <tr key={`${s.month}-${s.storeId}`} className="hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-4 text-white font-bold">{s.month}</td>
                        <td className="px-6 py-4 text-white font-bold">{STORES.find(st => st.id === s.storeId)?.name || 'N/A'}</td>
                        <td className="px-6 py-4 text-center text-slate-300">
                          <span className="bg-blue-500/10 text-blue-400 py-1 px-3 rounded-full text-xs font-bold">
                            {s.entriesCount}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="font-mono font-bold text-emerald-400">${s.totalWorkerNet.toLocaleString()}</div>
                          <div className="text-[10px] text-slate-500">Bs. {(s.totalWorkerNet * exchangeRate).toLocaleString()}</div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="font-mono font-bold text-orange-400">${s.totalStateLiabilities.toLocaleString()}</div>
                          <div className="text-[10px] text-slate-500">Bs. {(s.totalStateLiabilities * exchangeRate).toLocaleString()}</div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="font-mono font-bold text-blue-400">${s.totalEmployerCost.toLocaleString()}</div>
                          <div className="text-[10px] text-slate-500">Bs. {(s.totalEmployerCost * exchangeRate).toLocaleString()}</div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
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

          {/* Desglose de Pasivos Laborales */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden backdrop-blur-sm">
            <div className="p-6 border-b border-slate-800">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <ShieldCheck className="text-orange-500" size={20} />
                Desglose de Pasivos Laborales
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-800/50">
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Mes</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">SSO</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">LPH</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">INCES</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Total Pasivos</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {sortedMonths.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                        No hay pasivos registrados.
                      </td>
                    </tr>
                  ) : (
                    sortedMonths.map((m) => (
                      <tr key={m.month} className="hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-4 text-white font-bold">{m.month}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="font-mono font-bold text-slate-300">${m.ssoTotal.toLocaleString()}</div>
                          <div className="text-[10px] text-slate-500">Bs. {(m.ssoTotal * exchangeRate).toLocaleString()}</div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="font-mono font-bold text-slate-300">${m.lphTotal.toLocaleString()}</div>
                          <div className="text-[10px] text-slate-500">Bs. {(m.lphTotal * exchangeRate).toLocaleString()}</div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="font-mono font-bold text-slate-300">${m.incesTotal.toLocaleString()}</div>
                          <div className="text-[10px] text-slate-500">Bs. {(m.incesTotal * exchangeRate).toLocaleString()}</div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="font-mono font-bold text-orange-400">${m.totalStateLiabilities.toLocaleString()}</div>
                          <div className="text-[10px] text-slate-500">Bs. {(m.totalStateLiabilities * exchangeRate).toLocaleString()}</div>
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
              <button
                onClick={exportToCSV}
                disabled={filteredEntries.length === 0}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download size={18} />
                Exportar CSV
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-800/50">
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Trabajador</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Tienda</th>
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
                              <div className="flex items-center gap-2">
                                <div className="font-bold text-white group-hover/name:text-blue-400 transition-colors">{entry.employeeName}</div>
                                {hasParafiscalDiscrepancies(entry) && (
                                  <div className="group/warn relative">
                                    <AlertTriangle size={14} className="text-orange-500 animate-pulse" />
                                    <div className="absolute left-0 bottom-full mb-2 hidden group-hover/warn:block w-48 p-2 bg-slate-900 border border-slate-700 rounded shadow-xl text-[10px] text-slate-300 z-50">
                                      Discrepancia detectada entre aportes manuales y cálculos de ley.
                                    </div>
                                  </div>
                                )}
                              </div>
                              <div className="text-xs text-slate-500 font-mono">{entry.employeeId}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-300 font-medium">
                          {STORES.find(s => s.id === entry.storeId)?.name || 'N/A'}
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
                          <div className="flex justify-end gap-2">
                            <button 
                              onClick={() => setViewingEntry(entry)}
                              className="p-2 text-slate-500 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                              title="Ver Detalles"
                            >
                              <Eye size={18} />
                            </button>
                            <button 
                              onClick={() => onDeleteEntry(entry.id)}
                              className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                              title="Eliminar"
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
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Tienda</th>
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
                        <div 
                          className="flex items-center gap-3 cursor-pointer group/name"
                          onClick={() => setViewingEmployee(emp)}
                        >
                          <div className="w-10 h-10 bg-indigo-500/10 rounded-full flex items-center justify-center text-indigo-500 font-bold group-hover/name:bg-indigo-500 group-hover/name:text-white transition-colors">
                            {emp.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-white group-hover/name:text-indigo-400 transition-colors">{emp.name}</div>
                            <div className="text-xs text-slate-500 font-mono">{emp.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-slate-300 font-medium">{emp.position}</div>
                        <div className="text-xs text-slate-500">{emp.department}</div>
                      </td>
                      <td className="px-6 py-4 text-slate-300 font-medium">
                        {STORES.find(s => s.id === emp.storeId)?.name || 'N/A'}
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
                              setPrestacionesEmployee(emp);
                              setPrestacionesEndDate(new Date().toISOString().split('T')[0]);
                              setIsPrestacionesModalOpen(true);
                            }}
                            className="p-2 text-slate-400 hover:text-amber-400 hover:bg-amber-400/10 rounded-lg"
                            title="Calcular Prestaciones (LOTTT)"
                          >
                            <Landmark size={18} />
                          </button>
                          <button 
                            onClick={() => {
                              setAriEmployee(emp);
                              setAriData({
                                estimatedIncomeBs: (emp.baseSalary * exchangeRate) * 12,
                                estimatedExpensesBs: 0,
                                dependents: 0,
                                taxUnitValueBs: 9.00
                              });
                              setIsAriModalOpen(true);
                            }}
                            className="p-2 text-slate-400 hover:text-purple-400 hover:bg-purple-400/10 rounded-lg"
                            title="Calcular AR-I (ISLR)"
                          >
                            <FileSignature size={18} />
                          </button>
                          <button 
                            onClick={() => setViewingEmployee(emp)}
                            className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-emerald-400/10 rounded-lg"
                            title="Ver Expediente"
                          >
                            <FileText size={18} />
                          </button>
                          <button 
                            onClick={() => {
                              setEditingEmployee(emp);
                              setEmployeeIdInput(emp.id);
                              setEmployeeFormData({ ...emp });
                              setIsAddingEmployee(true);
                            }}
                            className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg"
                            title="Editar Expediente"
                          >
                            <Edit3 size={18} />
                          </button>
                          <button 
                            onClick={() => onDeleteEmployee(emp.id)}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg"
                            title="Eliminar Expediente"
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
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Tienda Asignada</label>
                    <select 
                      required
                      value={payrollFormData.storeId}
                      onChange={(e) => setPayrollFormData({ ...payrollFormData, storeId: e.target.value })}
                      className="w-full px-4 py-4 bg-slate-800 border border-slate-700 rounded-2xl text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    >
                      <option value="">Seleccionar tienda...</option>
                      {(currentUser?.storeId ? STORES.filter(s => s.id === currentUser.storeId) : STORES).map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
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
                <div className="flex justify-end mb-4">
                  <button
                    type="button"
                    onClick={applyLawCalculationsToPayroll}
                    className="bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 px-4 py-2 rounded-xl text-sm font-bold transition-colors flex items-center gap-2"
                  >
                    <Calculator size={16} />
                    Calcular Aportes de Ley Automáticamente
                  </button>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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
                      {payrollFormData.deductions.map((deduction, idx) => {
                        const { theoretical, hasDiff } = getParafiscalDiff(deduction.name, deduction.amount, payrollFormData.baseSalary, payrollFormData.bonuses);
                        return (
                          <div key={idx} className="space-y-1">
                            <div className="flex gap-2">
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
                              <div className="relative">
                                <input 
                                  type="number"
                                  placeholder="0.00"
                                  value={deduction.amount || ''}
                                  onChange={(e) => {
                                    const newDeductions = [...payrollFormData.deductions];
                                    newDeductions[idx].amount = parseFloat(e.target.value) || 0;
                                    setPayrollFormData({ ...payrollFormData, deductions: newDeductions });
                                  }}
                                  className={`w-24 px-4 py-3 bg-slate-800/50 border ${hasDiff ? 'border-orange-500 ring-1 ring-orange-500/20' : 'border-slate-700'} rounded-xl text-white text-sm outline-none focus:ring-1 focus:ring-red-500 font-mono`}
                                />
                                {hasDiff && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newDeductions = [...payrollFormData.deductions];
                                      newDeductions[idx].amount = theoretical;
                                      setPayrollFormData({ ...payrollFormData, deductions: newDeductions });
                                    }}
                                    className="absolute -top-2 -right-2 bg-orange-500 text-white p-1 rounded-full shadow-lg hover:scale-110 transition-transform"
                                    title={`Valor sugerido por ley: $${theoretical}. Click para ajustar.`}
                                  >
                                    <Wand2 size={10} />
                                  </button>
                                )}
                              </div>
                            </div>
                            {hasDiff && (
                              <div className="flex justify-between px-1">
                                <span className="text-[9px] text-orange-400 font-medium">Ley: ${theoretical}</span>
                                <span className="text-[9px] text-slate-500">Dif: ${(deduction.amount - theoretical).toFixed(2)}</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Employer Liabilities */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-orange-400 flex items-center gap-2">
                        <ShieldCheck size={18} /> Pasivos Patronales
                      </h3>
                      <button 
                        type="button"
                        onClick={() => setPayrollFormData({ ...payrollFormData, employerLiabilities: [...payrollFormData.employerLiabilities, { name: '', amount: 0 }] })}
                        className="text-xs bg-orange-500/10 text-orange-500 px-2 py-1 rounded-lg hover:bg-orange-500/20 transition-colors"
                      >
                        + Agregar
                      </button>
                    </div>
                    <div className="space-y-3">
                      {payrollFormData.employerLiabilities.map((liability, idx) => {
                        const { theoretical, hasDiff } = getParafiscalDiff(liability.name, liability.amount, payrollFormData.baseSalary, payrollFormData.bonuses);
                        return (
                          <div key={idx} className="space-y-1">
                            <div className="flex gap-2">
                              <input 
                                type="text"
                                placeholder="Nombre pasivo"
                                value={liability.name}
                                onChange={(e) => {
                                  const newLiabilities = [...payrollFormData.employerLiabilities];
                                  newLiabilities[idx].name = e.target.value;
                                  setPayrollFormData({ ...payrollFormData, employerLiabilities: newLiabilities });
                                }}
                                className="flex-1 px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white text-sm outline-none focus:ring-1 focus:ring-orange-500"
                              />
                              <div className="relative">
                                <input 
                                  type="number"
                                  placeholder="0.00"
                                  value={liability.amount || ''}
                                  onChange={(e) => {
                                    const newLiabilities = [...payrollFormData.employerLiabilities];
                                    newLiabilities[idx].amount = parseFloat(e.target.value) || 0;
                                    setPayrollFormData({ ...payrollFormData, employerLiabilities: newLiabilities });
                                  }}
                                  className={`w-24 px-4 py-3 bg-slate-800/50 border ${hasDiff ? 'border-orange-500 ring-1 ring-orange-500/20' : 'border-slate-700'} rounded-xl text-white text-sm outline-none focus:ring-1 focus:ring-orange-500 font-mono`}
                                />
                                {hasDiff && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newLiabilities = [...payrollFormData.employerLiabilities];
                                      newLiabilities[idx].amount = theoretical;
                                      setPayrollFormData({ ...payrollFormData, employerLiabilities: newLiabilities });
                                    }}
                                    className="absolute -top-2 -right-2 bg-orange-500 text-white p-1 rounded-full shadow-lg hover:scale-110 transition-transform"
                                    title={`Valor sugerido por ley: $${theoretical}. Click para ajustar.`}
                                  >
                                    <Wand2 size={10} />
                                  </button>
                                )}
                              </div>
                            </div>
                            {hasDiff && (
                              <div className="flex justify-between px-1">
                                <span className="text-[9px] text-orange-400 font-medium">Ley: ${theoretical}</span>
                                <span className="text-[9px] text-slate-500">Dif: ${(liability.amount - theoretical).toFixed(2)}</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
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
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Tienda Asignada</label>
                    <select 
                      required
                      value={employeeFormData.storeId}
                      onChange={(e) => setEmployeeFormData({ ...employeeFormData, storeId: e.target.value })}
                      className="w-full px-4 py-4 bg-slate-800 border border-slate-700 rounded-2xl text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    >
                      <option value="">Seleccionar tienda...</option>
                      {(currentUser?.storeId ? STORES.filter(s => s.id === currentUser.storeId) : STORES).map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
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
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <Calculator size={20} className="text-indigo-400" /> Configuración de Nómina Predeterminada
                    </h3>
                    <button
                      type="button"
                      onClick={applyLawCalculationsToEmployee}
                      className="bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 px-4 py-2 rounded-xl text-sm font-bold transition-colors flex items-center gap-2"
                    >
                      <Calculator size={16} />
                      Calcular Aportes de Ley
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
                        {employeeFormData.defaultDeductions.map((deduction, idx) => {
                          const { theoretical, hasDiff } = getParafiscalDiff(deduction.name, deduction.amount, employeeFormData.baseSalary, employeeFormData.defaultBonuses);
                          return (
                            <div key={idx} className="space-y-1">
                              <div className="flex gap-2">
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
                                <div className="relative">
                                  <input 
                                    type="number"
                                    placeholder="0.00"
                                    value={deduction.amount || ''}
                                    onChange={(e) => {
                                      const newDeductions = [...employeeFormData.defaultDeductions];
                                      newDeductions[idx].amount = parseFloat(e.target.value) || 0;
                                      setEmployeeFormData({ ...employeeFormData, defaultDeductions: newDeductions });
                                    }}
                                    className={`w-20 px-3 py-2 bg-slate-800/50 border ${hasDiff ? 'border-orange-500 ring-1 ring-orange-500/20' : 'border-slate-700'} rounded-xl text-white text-xs outline-none focus:ring-1 focus:ring-indigo-500 font-mono`}
                                  />
                                  {hasDiff && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const newDeductions = [...employeeFormData.defaultDeductions];
                                        newDeductions[idx].amount = theoretical;
                                        setEmployeeFormData({ ...employeeFormData, defaultDeductions: newDeductions });
                                      }}
                                      className="absolute -top-2 -right-2 bg-orange-500 text-white p-0.5 rounded-full shadow-lg hover:scale-110 transition-transform"
                                      title={`Valor sugerido por ley: $${theoretical}. Click para ajustar.`}
                                    >
                                      <Wand2 size={8} />
                                    </button>
                                  )}
                                </div>
                              </div>
                              {hasDiff && (
                                <div className="flex justify-between px-1">
                                  <span className="text-[8px] text-orange-400 font-medium">Ley: ${theoretical}</span>
                                  <span className="text-[8px] text-slate-500">Dif: ${(deduction.amount - theoretical).toFixed(2)}</span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Default Employer Liabilities */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pasivos Patronales</h4>
                        <button 
                          type="button"
                          onClick={() => setEmployeeFormData({ ...employeeFormData, defaultEmployerLiabilities: [...employeeFormData.defaultEmployerLiabilities, { name: '', amount: 0 }] })}
                          className="text-[10px] bg-indigo-500/10 text-indigo-400 px-2 py-1 rounded-lg hover:bg-indigo-500/20 transition-colors"
                        >
                          + Agregar
                        </button>
                      </div>
                      <div className="space-y-2">
                        {employeeFormData.defaultEmployerLiabilities.map((liability, idx) => {
                          const { theoretical, hasDiff } = getParafiscalDiff(liability.name, liability.amount, employeeFormData.baseSalary, employeeFormData.defaultBonuses);
                          return (
                            <div key={idx} className="space-y-1">
                              <div className="flex gap-2">
                                <input 
                                  type="text"
                                  placeholder="Nombre pasivo"
                                  value={liability.name}
                                  onChange={(e) => {
                                    const newLiabilities = [...employeeFormData.defaultEmployerLiabilities];
                                    newLiabilities[idx].name = e.target.value;
                                    setEmployeeFormData({ ...employeeFormData, defaultEmployerLiabilities: newLiabilities });
                                  }}
                                  className="flex-1 px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-xl text-white text-xs outline-none focus:ring-1 focus:ring-indigo-500"
                                />
                                <div className="relative">
                                  <input 
                                    type="number"
                                    placeholder="0.00"
                                    value={liability.amount || ''}
                                    onChange={(e) => {
                                      const newLiabilities = [...employeeFormData.defaultEmployerLiabilities];
                                      newLiabilities[idx].amount = parseFloat(e.target.value) || 0;
                                      setEmployeeFormData({ ...employeeFormData, defaultEmployerLiabilities: newLiabilities });
                                    }}
                                    className={`w-20 px-3 py-2 bg-slate-800/50 border ${hasDiff ? 'border-orange-500 ring-1 ring-orange-500/20' : 'border-slate-700'} rounded-xl text-white text-xs outline-none focus:ring-1 focus:ring-indigo-500 font-mono`}
                                  />
                                  {hasDiff && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const newLiabilities = [...employeeFormData.defaultEmployerLiabilities];
                                        newLiabilities[idx].amount = theoretical;
                                        setEmployeeFormData({ ...employeeFormData, defaultEmployerLiabilities: newLiabilities });
                                      }}
                                      className="absolute -top-2 -right-2 bg-orange-500 text-white p-0.5 rounded-full shadow-lg hover:scale-110 transition-transform"
                                      title={`Valor sugerido por ley: $${theoretical}. Click para ajustar.`}
                                    >
                                      <Wand2 size={8} />
                                    </button>
                                  )}
                                </div>
                              </div>
                              {hasDiff && (
                                <div className="flex justify-between px-1">
                                  <span className="text-[8px] text-orange-400 font-medium">Ley: ${theoretical}</span>
                                  <span className="text-[8px] text-slate-500">Dif: ${(liability.amount - theoretical).toFixed(2)}</span>
                                </div>
                              )}
                            </div>
                          );
                        })}
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

      {/* Modal Ver Detalle Nómina */}
      <AnimatePresence>
        {viewingEntry && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-slate-950 w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-800 shadow-2xl custom-scrollbar"
            >
              <div className="p-8">
                <div className="flex justify-between items-start mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500">
                      <FileText size={32} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">Detalle de Nómina</h2>
                      <p className="text-slate-500 font-mono text-sm">{viewingEntry.id} • {viewingEntry.month}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setViewingEntry(null)}
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Empleado</p>
                    <p className="text-lg font-bold text-white">{viewingEntry.employeeName}</p>
                    <p className="text-sm text-slate-400">{viewingEntry.employeeId}</p>
                  </div>
                  <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Tienda</p>
                    <p className="text-lg font-bold text-white">{STORES.find(s => s.id === viewingEntry.storeId)?.name || 'N/A'}</p>
                    <p className="text-sm text-slate-400">ID: {viewingEntry.storeId}</p>
                  </div>
                  <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Fecha Registro</p>
                    <p className="text-lg font-bold text-white">{new Date(viewingEntry.submittedDate).toLocaleDateString()}</p>
                    <p className="text-sm text-slate-400">{new Date(viewingEntry.submittedDate).toLocaleTimeString()}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Deducciones */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <TrendingDown className="text-red-400" size={20} />
                      Deducciones del Trabajador
                    </h3>
                    <div className="space-y-3">
                      {viewingEntry.deductions.map((d, idx) => {
                        const { theoretical, diff, hasDiff } = getParafiscalDiff(d.name, d.amount, viewingEntry.baseSalary, viewingEntry.bonuses);
                        return (
                          <div key={idx} className={`p-4 rounded-xl border transition-all ${
                            hasDiff ? 'bg-orange-500/5 border-orange-500/30' : 'bg-slate-900/30 border-slate-800'
                          }`}>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-sm font-medium text-slate-300">{d.name}</span>
                              <div className="flex items-center gap-3">
                                <span className="font-mono text-white font-bold">${d.amount.toLocaleString()}</span>
                                {hasDiff && onUpdateEntry && (
                                  <button
                                    onClick={() => handleAdjustParafiscal(viewingEntry, d.name, 'deduction')}
                                    className="p-1.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/20"
                                    title="Ajustar a Ley"
                                  >
                                    <Wand2 size={14} />
                                  </button>
                                )}
                              </div>
                            </div>
                            {hasDiff && (
                              <div className="flex justify-between text-[10px] font-bold">
                                <span className="text-slate-500">LEY: ${theoretical.toLocaleString()}</span>
                                <span className={diff > 0 ? 'text-red-400' : 'text-green-400'}>
                                  DIF: {diff > 0 ? '+' : ''}${diff.toLocaleString()}
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Pasivos Patronales */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <ShieldCheck className="text-blue-400" size={20} />
                      Pasivos Patronales
                    </h3>
                    <div className="space-y-3">
                      {viewingEntry.employerLiabilities.map((l, idx) => {
                        const { theoretical, diff, hasDiff } = getParafiscalDiff(l.name, l.amount, viewingEntry.baseSalary, viewingEntry.bonuses);
                        return (
                          <div key={idx} className={`p-4 rounded-xl border transition-all ${
                            hasDiff ? 'bg-orange-500/5 border-orange-500/30' : 'bg-slate-900/30 border-slate-800'
                          }`}>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-sm font-medium text-slate-300">{l.name}</span>
                              <div className="flex items-center gap-3">
                                <span className="font-mono text-white font-bold">${l.amount.toLocaleString()}</span>
                                {hasDiff && onUpdateEntry && (
                                  <button
                                    onClick={() => handleAdjustParafiscal(viewingEntry, l.name, 'liability')}
                                    className="p-1.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/20"
                                    title="Ajustar a Ley"
                                  >
                                    <Wand2 size={14} />
                                  </button>
                                )}
                              </div>
                            </div>
                            {hasDiff && (
                              <div className="flex justify-between text-[10px] font-bold">
                                <span className="text-slate-500">LEY: ${theoretical.toLocaleString()}</span>
                                <span className={diff > 0 ? 'text-red-400' : 'text-green-400'}>
                                  DIF: {diff > 0 ? '+' : ''}${diff.toLocaleString()}
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="mt-12 pt-8 border-t border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-6 bg-blue-500/5 rounded-2xl border border-blue-500/20">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Sueldo Base</p>
                    <p className="text-2xl font-mono font-bold text-blue-400">${viewingEntry.baseSalary.toLocaleString()}</p>
                  </div>
                  <div className="p-6 bg-emerald-500/5 rounded-2xl border border-emerald-500/20">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Neto Trabajador</p>
                    <p className="text-2xl font-mono font-bold text-emerald-400">${viewingEntry.totalWorkerNet.toLocaleString()}</p>
                  </div>
                  <div className="p-6 bg-orange-500/5 rounded-2xl border border-orange-500/20">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Costo Empresa</p>
                    <p className="text-2xl font-mono font-bold text-orange-400">${viewingEntry.totalEmployerCost.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* AR-I Modal */}
      <AnimatePresence>
        {isAriModalOpen && ariEmployee && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAriModalOpen(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
                <div>
                  <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                    <div className="p-2 bg-purple-500/20 rounded-xl text-purple-400">
                      <FileSignature size={24} />
                    </div>
                    Formulario AR-I (ISLR)
                  </h2>
                  <p className="text-slate-400 mt-1 text-sm">Cálculo de retención para {ariEmployee.name}</p>
                </div>
                <button 
                  onClick={() => setIsAriModalOpen(false)}
                  className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
                >
                  <Plus size={24} className="rotate-45" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ingresos Estimados (Bs/Año)</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <span className="text-slate-500 font-bold">Bs.</span>
                      </div>
                      <input 
                        type="number" 
                        value={ariData.estimatedIncomeBs || ''}
                        onChange={(e) => setAriData({...ariData, estimatedIncomeBs: Number(e.target.value)})}
                        className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white outline-none focus:ring-2 focus:ring-purple-500 transition-all font-mono"
                      />
                    </div>
                    <p className="text-[10px] text-slate-500">Equivale a ${(ariData.estimatedIncomeBs / exchangeRate).toLocaleString(undefined, {maximumFractionDigits: 2})} USD</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Desgravámenes Estimados (Bs/Año)</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <span className="text-slate-500 font-bold">Bs.</span>
                      </div>
                      <input 
                        type="number" 
                        value={ariData.estimatedExpensesBs || ''}
                        onChange={(e) => setAriData({...ariData, estimatedExpensesBs: Number(e.target.value)})}
                        className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white outline-none focus:ring-2 focus:ring-purple-500 transition-all font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cargas Familiares</label>
                    <input 
                      type="number" 
                      min="0"
                      value={ariData.dependents}
                      onChange={(e) => setAriData({...ariData, dependents: Number(e.target.value)})}
                      className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Valor Unidad Tributaria (Bs)</label>
                    <input 
                      type="number" 
                      step="0.01"
                      value={ariData.taxUnitValueBs}
                      onChange={(e) => setAriData({...ariData, taxUnitValueBs: Number(e.target.value)})}
                      className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white outline-none focus:ring-2 focus:ring-purple-500 transition-all font-mono"
                    />
                  </div>
                </div>

                {/* Results Section */}
                <div className="mt-8 p-6 bg-slate-800/30 border border-slate-700 rounded-2xl">
                  <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                    <Calculator size={16} className="text-purple-400" /> Resultados del Cálculo
                  </h3>
                  
                  {(() => {
                    const result = calculateARI();
                    return (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-xl border border-slate-800">
                          <span className="text-sm text-slate-400">Ingresos en UT</span>
                          <span className="font-mono font-bold text-white">{result.incomeUT.toLocaleString(undefined, {maximumFractionDigits: 2})} UT</span>
                        </div>
                        
                        <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-xl border border-slate-800">
                          <span className="text-sm text-slate-400">Obligación de Presentar AR-I</span>
                          <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                            result.isObligated ? 'bg-orange-500/10 text-orange-400' : 'bg-emerald-500/10 text-emerald-400'
                          }`}>
                            {result.isObligated ? 'Obligatorio (> 1000 UT)' : 'No Obligatorio'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-xl border border-slate-800">
                          <span className="text-sm text-slate-400">Impuesto Anual Estimado</span>
                          <span className="font-mono font-bold text-white">Bs. {result.totalTaxBs.toLocaleString(undefined, {maximumFractionDigits: 2})}</span>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-purple-500/10 rounded-xl border border-purple-500/20">
                          <span className="font-bold text-purple-300">Porcentaje de Retención Mensual</span>
                          <span className="text-2xl font-bold text-purple-400">{result.percentage.toFixed(2)}%</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
              
              <div className="p-6 border-t border-slate-800 bg-slate-900/50 flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setIsAriModalOpen(false)}
                  className="px-6 py-3 text-slate-300 hover:text-white font-bold transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Prestaciones Sociales Modal */}
      <AnimatePresence>
        {isPrestacionesModalOpen && prestacionesEmployee && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPrestacionesModalOpen(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
                <div>
                  <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                    <div className="p-2 bg-amber-500/20 rounded-xl text-amber-400">
                      <Landmark size={24} />
                    </div>
                    Cálculo de Prestaciones Sociales (LOTTT)
                  </h2>
                  <p className="text-slate-400 mt-1 text-sm">Liquidación estimativa para {prestacionesEmployee.name}</p>
                </div>
                <button 
                  onClick={() => setIsPrestacionesModalOpen(false)}
                  className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
                >
                  <Plus size={24} className="rotate-45" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-8">
                {/* Header Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-slate-800/30 p-4 rounded-2xl border border-slate-700/50">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Fecha de Ingreso</div>
                    <div className="text-white font-medium flex items-center gap-2">
                      <Calendar size={16} className="text-slate-400" />
                      {prestacionesEmployee.hireDate}
                    </div>
                  </div>
                  <div className="bg-slate-800/30 p-4 rounded-2xl border border-slate-700/50">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Fecha de Cálculo</div>
                    <input 
                      type="date" 
                      value={prestacionesEndDate}
                      onChange={(e) => setPrestacionesEndDate(e.target.value)}
                      className="w-full bg-transparent text-white outline-none font-medium"
                    />
                  </div>
                  <div className="bg-slate-800/30 p-4 rounded-2xl border border-slate-700/50">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Salario Integral Diario</div>
                    {(() => {
                      const result = calculatePrestaciones();
                      return result ? (
                        <div>
                          <div className="text-white font-bold font-mono text-lg">${result.dailyIntegralSalary.toLocaleString(undefined, {maximumFractionDigits: 2})}</div>
                          <div className="text-xs text-slate-500">Bs. {(result.dailyIntegralSalary * exchangeRate).toLocaleString(undefined, {maximumFractionDigits: 2})}</div>
                        </div>
                      ) : <div className="text-slate-500">Fecha inválida</div>;
                    })()}
                  </div>
                </div>

                {(() => {
                  const result = calculatePrestaciones();
                  if (!result) return <div className="text-center text-red-400 py-8">La fecha de cálculo debe ser posterior a la fecha de ingreso.</div>;

                  return (
                    <div className="space-y-8">
                      {/* Tiempo de Servicio */}
                      <div>
                        <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                          <Clock size={16} className="text-blue-400" /> Tiempo de Servicio
                        </h3>
                        <div className="flex items-center gap-4">
                          <div className="flex-1 bg-blue-500/10 border border-blue-500/20 p-4 rounded-2xl text-center">
                            <div className="text-2xl font-bold text-blue-400">{result.years}</div>
                            <div className="text-xs font-bold text-blue-300/70 uppercase tracking-wider">Años</div>
                          </div>
                          <div className="flex-1 bg-blue-500/10 border border-blue-500/20 p-4 rounded-2xl text-center">
                            <div className="text-2xl font-bold text-blue-400">{result.months}</div>
                            <div className="text-xs font-bold text-blue-300/70 uppercase tracking-wider">Meses</div>
                          </div>
                          <div className="flex-1 bg-blue-500/10 border border-blue-500/20 p-4 rounded-2xl text-center">
                            <div className="text-2xl font-bold text-blue-400">{result.days}</div>
                            <div className="text-xs font-bold text-blue-300/70 uppercase tracking-wider">Días</div>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Garantía Trimestral */}
                        <div className="bg-slate-800/30 border border-slate-700 rounded-2xl p-6">
                          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                            <ShieldCheck size={16} className="text-emerald-400" /> 1. Garantía Trimestral (Art. 142 a, b)
                          </h3>
                          <div className="space-y-4">
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-slate-400">Trimestres Completos</span>
                              <span className="font-bold text-white">{result.quarters}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-slate-400">Días Base (15 x Trimestre)</span>
                              <span className="font-bold text-white">{result.baseDaysQuarterly} días</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-slate-400">Días Adicionales (Antigüedad)</span>
                              <span className="font-bold text-white">{result.additionalDays} días</span>
                            </div>
                            <div className="pt-4 border-t border-slate-700/50">
                              <div className="flex justify-between items-center mb-1">
                                <span className="font-bold text-emerald-400">Total Días Acumulados</span>
                                <span className="font-bold text-emerald-400">{result.totalGuaranteeDays} días</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-slate-500">Monto Estimado</span>
                                <span className="font-mono font-bold text-white">${result.totalGuaranteeAmount.toLocaleString(undefined, {maximumFractionDigits: 2})}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Cálculo Literal C */}
                        <div className="bg-slate-800/30 border border-slate-700 rounded-2xl p-6">
                          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                            <FileText size={16} className="text-orange-400" /> 2. Cálculo Retroactivo (Art. 142 c)
                          </h3>
                          <div className="space-y-4">
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-slate-400">Años a considerar (&gt; 6 meses = 1 año)</span>
                              <span className="font-bold text-white">{result.literalCYears} años</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-slate-400">Días (30 x Año)</span>
                              <span className="font-bold text-white">{result.literalCDays} días</span>
                            </div>
                            <div className="pt-4 border-t border-slate-700/50 mt-auto">
                              <div className="flex justify-between items-center mb-1">
                                <span className="font-bold text-orange-400">Total Días Retroactivos</span>
                                <span className="font-bold text-orange-400">{result.literalCDays} días</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-slate-500">Monto Estimado</span>
                                <span className="font-mono font-bold text-white">${result.literalCAmount.toLocaleString(undefined, {maximumFractionDigits: 2})}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Resultado Final */}
                      <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div>
                          <h3 className="text-lg font-bold text-amber-400 mb-1">Monto a Pagar (El Mayor)</h3>
                          <p className="text-sm text-amber-400/70">
                            Según la LOTTT, el trabajador recibe el monto que resulte mayor entre la Garantía Trimestral y el Cálculo Retroactivo.
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-3xl font-bold font-mono text-white">${result.finalAmount.toLocaleString(undefined, {maximumFractionDigits: 2})}</div>
                          <div className="text-sm text-slate-400 font-medium mt-1">Bs. {(result.finalAmount * exchangeRate).toLocaleString(undefined, {maximumFractionDigits: 2})}</div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
              
              <div className="p-6 border-t border-slate-800 bg-slate-900/50 flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setIsPrestacionesModalOpen(false)}
                  className="px-6 py-3 text-slate-300 hover:text-white font-bold transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
