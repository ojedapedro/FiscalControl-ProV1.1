
import React, { useState, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell, Legend
} from 'recharts';
import { Payment, PaymentStatus, PayrollEntry, Category, User, Role } from '../types';
import { DollarSign, TrendingUp, AlertTriangle, FileText, CheckCircle2, AlertOctagon, Clock, XCircle, Building2, Filter, Users } from 'lucide-react';

interface PresidencyDashboardProps {
  payments: Payment[];
  payrollEntries: PayrollEntry[];
  currentUser?: User;
  onApproveAll?: () => void;
}

export const PresidencyDashboard: React.FC<PresidencyDashboardProps> = ({ payments, payrollEntries, currentUser, onApproveAll }) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedStore, setSelectedStore] = useState('all');

  // Extract unique stores from payments
  const stores = useMemo(() => {
    const storeMap = new Map<string, string>();
    payments.forEach(p => {
      if (p.storeId && p.storeName) {
        storeMap.set(p.storeId, p.storeName);
      }
    });
    return Array.from(storeMap.entries()).map(([id, name]) => ({ id, name }));
  }, [payments]);

  // Filter data based on selections
  const filteredPayments = useMemo(() => {
    return payments.filter(p => {
      if (selectedStore !== 'all' && p.storeId !== selectedStore) return false;
      
      const pDate = new Date(p.paymentDate || p.submittedDate);
      if (startDate && pDate < new Date(startDate)) return false;
      if (endDate && pDate > new Date(endDate)) return false;
      
      return true;
    });
  }, [payments, selectedStore, startDate, endDate]);

  const filteredPayroll = useMemo(() => {
    return payrollEntries.filter(e => {
      if (selectedStore !== 'all' && e.storeId !== selectedStore) return false;
      
      const eDate = new Date(e.submittedDate);
      if (startDate && eDate < new Date(startDate)) return false;
      if (endDate && eDate > new Date(endDate)) return false;
      
      return true;
    });
  }, [payrollEntries, selectedStore, startDate, endDate]);

  const totalApproved = filteredPayments
    .filter(p => p.status === PaymentStatus.APPROVED)
    .reduce((sum, p) => sum + p.amount, 0);

  const totalPaid = filteredPayments
    .filter(p => p.status === PaymentStatus.PAID)
    .reduce((sum, p) => sum + p.amount, 0);

  const totalPending = filteredPayments
    .filter(p => p.status === PaymentStatus.PENDING || p.status === PaymentStatus.UPLOADED)
    .reduce((sum, p) => sum + p.amount, 0);

  const totalPayrollCost = filteredPayroll.reduce((sum, e) => sum + e.totalEmployerCost, 0);
  
  // Calcular Pasivos Laborales
  const totalLaborLiabilities = filteredPayroll.reduce((sum, e) => {
    const liabilitiesSum = e.employerLiabilities?.reduce((lSum, l) => lSum + l.amount, 0) || 0;
    return sum + liabilitiesSum;
  }, 0);
  
  const overBudgetCount = filteredPayments.filter(p => p.isOverBudget).length;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 7);

  const overduePayments = filteredPayments.filter(p => {
    if (p.status === PaymentStatus.APPROVED || p.status === PaymentStatus.REJECTED) return false;
    const dueDate = new Date(p.dueDate);
    return dueDate < today;
  });
  const totalOverdue = overduePayments.reduce((sum, p) => sum + p.amount, 0);

  const dueSoonPayments = filteredPayments.filter(p => {
    if (p.status === PaymentStatus.APPROVED || p.status === PaymentStatus.REJECTED) return false;
    const dueDate = new Date(p.dueDate);
    return dueDate >= today && dueDate <= nextWeek;
  });
  const totalDueSoon = dueSoonPayments.reduce((sum, p) => sum + p.amount, 0);

  const rejectedCount = filteredPayments.filter(p => p.status === PaymentStatus.REJECTED).length;
  const rejectionRate = filteredPayments.length > 0 ? ((rejectedCount / filteredPayments.length) * 100).toFixed(1) : '0.0';

  const paymentsByCategory = Object.values(Category).map(cat => ({
    name: cat,
    value: filteredPayments.filter(p => p.category === cat).reduce((sum, p) => sum + p.amount, 0)
  })).filter(c => c.value > 0);

  // Top 5 Tiendas
  const storeSpending: Record<string, number> = {};
  filteredPayments.filter(p => p.status === PaymentStatus.APPROVED).forEach(p => {
    storeSpending[p.storeName] = (storeSpending[p.storeName] || 0) + p.amount;
  });
  const topStores = Object.entries(storeSpending)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  // Evolución de Gastos (por mes)
  const monthlySpending: Record<string, number> = {};
  filteredPayments.filter(p => p.status === PaymentStatus.APPROVED).forEach(p => {
    const date = new Date(p.paymentDate || p.submittedDate);
    const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    monthlySpending[monthYear] = (monthlySpending[monthYear] || 0) + p.amount;
  });
  const trendData = Object.entries(monthlySpending)
    .map(([date, value]) => ({ date, value }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#ec4899', '#14b8a6'];

  const pendingPaymentsCount = filteredPayments.filter(p => p.status === PaymentStatus.PENDING || p.status === PaymentStatus.UPLOADED || p.status === PaymentStatus.OVERDUE).length;

  return (
    <div className="p-6 lg:p-10 text-white space-y-8 pb-24">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">Panel de Presidencia</h1>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 bg-slate-800 p-2 rounded-xl border border-slate-700">
            <Filter size={18} className="text-slate-400" />
            <select
              value={selectedStore}
              onChange={(e) => setSelectedStore(e.target.value)}
              className="bg-transparent text-white text-sm focus:outline-none"
            >
              <option value="all">Todas las Tiendas</option>
              {stores.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2 bg-slate-800 p-2 rounded-xl border border-slate-700">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent text-white text-sm focus:outline-none"
            />
            <span className="text-slate-500">-</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent text-white text-sm focus:outline-none"
            />
          </div>
          {(currentUser?.role === Role.PRESIDENT || currentUser?.role === Role.SUPER_ADMIN) && pendingPaymentsCount > 0 && onApproveAll && (
            <button 
              onClick={onApproveAll}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-colors shadow-lg shadow-emerald-900/20"
            >
              <CheckCircle2 size={20} />
              Aprobar Todo ({pendingPaymentsCount})
            </button>
          )}
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-500/20 rounded-xl text-emerald-400"><DollarSign /></div>
            <div>
              <p className="text-slate-400 text-sm">Pagos Aprobados</p>
              <p className="text-2xl font-bold">${totalApproved.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/20 rounded-xl text-blue-400"><CheckCircle2 /></div>
            <div>
              <p className="text-slate-400 text-sm">Pagos Realizados</p>
              <p className="text-2xl font-bold">${totalPaid.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-500/20 rounded-xl text-amber-400"><TrendingUp /></div>
            <div>
              <p className="text-slate-400 text-sm">Pagos Pendientes</p>
              <p className="text-2xl font-bold">${totalPending.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-500/20 rounded-xl text-red-400"><AlertOctagon /></div>
            <div>
              <p className="text-slate-400 text-sm">Pagos Vencidos</p>
              <p className="text-2xl font-bold">${totalOverdue.toLocaleString()}</p>
              <p className="text-xs text-red-400 mt-1">{overduePayments.length} pagos</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-500/20 rounded-xl text-orange-400"><Clock /></div>
            <div>
              <p className="text-slate-400 text-sm">Próximos a Vencer (7d)</p>
              <p className="text-2xl font-bold">${totalDueSoon.toLocaleString()}</p>
              <p className="text-xs text-orange-400 mt-1">{dueSoonPayments.length} pagos</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/20 rounded-xl text-blue-400"><FileText /></div>
            <div>
              <p className="text-slate-400 text-sm">Costo Nómina</p>
              <p className="text-2xl font-bold">${totalPayrollCost.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-500/20 rounded-xl text-indigo-400"><Users /></div>
            <div>
              <p className="text-slate-400 text-sm">Pasivos Laborales</p>
              <p className="text-2xl font-bold">${totalLaborLiabilities.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-pink-500/20 rounded-xl text-pink-400"><AlertTriangle /></div>
            <div>
              <p className="text-slate-400 text-sm">Pagos Sobre Presupuesto</p>
              <p className="text-2xl font-bold">{overBudgetCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-500/20 rounded-xl text-purple-400"><XCircle /></div>
            <div>
              <p className="text-slate-400 text-sm">Tasa de Rechazo</p>
              <p className="text-2xl font-bold">{rejectionRate}%</p>
              <p className="text-xs text-purple-400 mt-1">{rejectedCount} pagos devueltos</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Evolución de Gastos */}
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 lg:col-span-2">
          <h2 className="text-lg font-bold mb-6 flex items-center gap-2"><TrendingUp size={20} className="text-emerald-400" /> Evolución de Gastos (Aprobados)</h2>
          <div className="h-[300px]">
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(value) => `$${value}`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                    formatter={(value: number) => [`$${value.toLocaleString()}`, 'Gasto']}
                  />
                  <Area type="monotone" dataKey="value" stroke="#10b981" fillOpacity={1} fill="url(#colorValue)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-500">No hay datos suficientes</div>
            )}
          </div>
        </div>

        {/* Top Tiendas */}
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
          <h2 className="text-lg font-bold mb-6 flex items-center gap-2"><Building2 size={20} className="text-blue-400" /> Top 5 Tiendas (Gasto Aprobado)</h2>
          <div className="h-[300px]">
            {topStores.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topStores} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={true} vertical={false} />
                  <XAxis type="number" stroke="#94a3b8" fontSize={12} />
                  <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={12} width={100} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                    formatter={(value: number) => [`$${value.toLocaleString()}`, 'Gasto']}
                  />
                  <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]}>
                    {topStores.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-500">No hay datos suficientes</div>
            )}
          </div>
        </div>

        {/* Distribución por Categoría */}
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
          <h2 className="text-lg font-bold mb-6">Distribución de Pagos por Categoría</h2>
          <div className="h-[300px]">
            {paymentsByCategory.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={paymentsByCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {paymentsByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                    formatter={(value: number) => [`$${value.toLocaleString()}`, 'Monto']}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-500">No hay datos suficientes</div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
