
import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell, Legend
} from 'recharts';
import { Payment, PaymentStatus, PayrollEntry, Category } from '../types';
import { DollarSign, TrendingUp, AlertTriangle, FileText } from 'lucide-react';

interface PresidencyDashboardProps {
  payments: Payment[];
  payrollEntries: PayrollEntry[];
}

export const PresidencyDashboard: React.FC<PresidencyDashboardProps> = ({ payments, payrollEntries }) => {
  
  const totalApproved = payments
    .filter(p => p.status === PaymentStatus.APPROVED)
    .reduce((sum, p) => sum + p.amount, 0);

  const totalPending = payments
    .filter(p => p.status === PaymentStatus.PENDING)
    .reduce((sum, p) => sum + p.amount, 0);

  const totalPayroll = payrollEntries.reduce((sum, e) => sum + e.totalEmployerCost, 0);
  
  const overBudgetCount = payments.filter(p => p.isOverBudget).length;

  const paymentsByCategory = Object.values(Category).map(cat => ({
    name: cat,
    value: payments.filter(p => p.category === cat).reduce((sum, p) => sum + p.amount, 0)
  })).filter(c => c.value > 0);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  return (
    <div className="p-6 lg:p-10 text-white space-y-8 pb-24">
      <h1 className="text-3xl font-bold">Panel de Presidencia</h1>
      
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
            <div className="p-3 bg-amber-500/20 rounded-xl text-amber-400"><TrendingUp /></div>
            <div>
              <p className="text-slate-400 text-sm">Pagos Pendientes</p>
              <p className="text-2xl font-bold">${totalPending.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/20 rounded-xl text-blue-400"><FileText /></div>
            <div>
              <p className="text-slate-400 text-sm">Costo Nómina</p>
              <p className="text-2xl font-bold">${totalPayroll.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-500/20 rounded-xl text-red-400"><AlertTriangle /></div>
            <div>
              <p className="text-slate-400 text-sm">Pagos Sobre Presupuesto</p>
              <p className="text-2xl font-bold">{overBudgetCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
          <h2 className="text-lg font-bold mb-6">Pagos por Categoría</h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={paymentsByCategory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none' }} />
                <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
          <h2 className="text-lg font-bold mb-6">Distribución de Pagos</h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={paymentsByCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                  {paymentsByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none' }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
