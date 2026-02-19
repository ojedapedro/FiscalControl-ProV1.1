
import React, { useState, useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  ComposedChart,
  Line,
  Legend
} from 'recharts';
import { Payment, PaymentStatus } from '../types';
import { Download, Calendar, ArrowUpRight, CheckCircle2, XCircle, Clock, TrendingUp, Loader2, Filter, Wallet, AlertCircle, TrendingDown, AlertTriangle } from 'lucide-react';
import { APP_LOGO_URL } from '../constants';

interface ReportsProps {
  payments: Payment[];
}

// Configuración simulada de presupuesto mensual (En un caso real vendría del backend)
const MONTHLY_BUDGET_TARGET = 6000; 

const CustomPieTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-2xl backdrop-blur-sm bg-opacity-95">
        <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: data.payload.color }}></span>
            <p className="font-bold text-white text-sm">{data.name}</p>
        </div>
        <p className="text-xs text-slate-400">
          <span className="font-mono text-lg text-white font-bold">{data.value}</span> Pagos
        </p>
      </div>
    );
  }
  return null;
};

const CustomFinancialTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 border border-slate-700 p-4 rounded-xl shadow-2xl backdrop-blur-sm bg-opacity-95 min-w-[200px] z-50">
        <p className="font-bold text-slate-200 mb-3 text-sm border-b border-slate-700 pb-2 uppercase tracking-wider">{label}</p>
        
        {payload.map((entry: any, index: number) => {
            if (entry.dataKey === 'budget') return null; 
            
            let labelText = '';
            let valueClass = 'text-white';
            
            if (entry.dataKey === 'approved') { labelText = 'Gasto Ejecutado'; valueClass = 'text-blue-400'; }
            if (entry.dataKey === 'pending') { labelText = 'En Proceso / Pendiente'; valueClass = 'text-yellow-400'; }
            
            return (
                <div key={index} className="flex items-center justify-between gap-4 text-xs mb-2">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></div>
                        <span className="text-slate-400">{labelText}</span>
                    </div>
                    <span className={`font-mono font-bold ${valueClass}`}>
                        ${entry.value.toLocaleString()}
                    </span>
                </div>
            );
        })}

        <div className="mt-2 pt-2 border-t border-slate-700 flex justify-between items-center text-xs">
            <span className="text-slate-500">Presupuesto Mensual:</span>
            <span className="font-mono font-bold text-slate-300">${MONTHLY_BUDGET_TARGET.toLocaleString()}</span>
        </div>
      </div>
    );
  }
  return null;
};

export const Reports: React.FC<ReportsProps> = ({ payments }) => {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Date Filter State (Default to current month)
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    return new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  // --- PROCESAMIENTO DE DATOS ---

  const filteredPayments = useMemo(() => {
    return payments.filter(p => {
      const recordDate = p.submittedDate ? p.submittedDate.split('T')[0] : p.dueDate;
      return recordDate >= startDate && recordDate <= endDate;
    });
  }, [payments, startDate, endDate]);

  const annualData = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    
    return months.map((monthName, index) => {
        const monthlyPayments = payments.filter(p => {
            const d = new Date(p.dueDate); 
            return d.getMonth() === index && d.getFullYear() === currentYear;
        });

        const approvedAmount = monthlyPayments
            .filter(p => p.status === PaymentStatus.APPROVED)
            .reduce((sum, p) => sum + p.amount, 0);

        const pendingAmount = monthlyPayments
            .filter(p => p.status === PaymentStatus.PENDING || p.status === PaymentStatus.UPLOADED || p.status === PaymentStatus.OVERDUE)
            .reduce((sum, p) => sum + p.amount, 0);

        return {
            name: monthName,
            approved: approvedAmount,
            pending: pendingAmount,
            budget: MONTHLY_BUDGET_TARGET,
            total: approvedAmount + pendingAmount
        };
    });
  }, [payments]);

  const totalAnnualBudget = MONTHLY_BUDGET_TARGET * 12;
  const totalYTDExecuted = annualData.reduce((acc, curr) => acc + curr.approved, 0);
  const totalYTDPending = annualData.reduce((acc, curr) => acc + curr.pending, 0);
  const budgetUtilization = (totalYTDExecuted / totalAnnualBudget) * 100;
  const availableBudget = totalAnnualBudget - totalYTDExecuted;

  const totalApproved = filteredPayments
    .filter(p => p.status === PaymentStatus.APPROVED)
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalRejectedCount = filteredPayments.filter(p => p.status === PaymentStatus.REJECTED).length;
  const totalPendingCount = filteredPayments.filter(p => p.status === PaymentStatus.PENDING || p.status === PaymentStatus.UPLOADED).length;
  
  // Calculate over-budget sum
  const totalOverBudgetSum = filteredPayments
    .filter(p => p.isOverBudget)
    .reduce((acc, curr) => {
        const extra = curr.originalBudget ? (curr.amount - curr.originalBudget) : 0;
        return acc + Math.max(0, extra);
    }, 0);

  const approvedPayments = filteredPayments.filter(p => p.status === PaymentStatus.APPROVED);
  const rejectedPayments = filteredPayments.filter(p => p.status === PaymentStatus.REJECTED);

  const statusData = [
    { name: 'Aprobados', value: approvedPayments.length, color: '#22c55e' },
    { name: 'Rechazados', value: rejectedPayments.length, color: '#ef4444' },
    { name: 'Pendientes', value: totalPendingCount, color: '#eab308' },
  ];

  const getDataUrl = (url: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "Anonymous"; 
      
      img.onload = () => {
        try {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(img, 0, 0);
                resolve(canvas.toDataURL('image/png'));
            } else {
                resolve(""); 
            }
        } catch (e) {
            console.warn("Canvas tainted or error converting image:", e);
            resolve(""); 
        }
      };
      
      img.onerror = () => {
          console.warn("Error cargando logo para PDF (Network Error), continuando sin logo.");
          resolve(""); 
      };
      img.src = url;
    });
  };

  const handleDownloadPDF = async () => {
    setIsGeneratingPdf(true);
    await new Promise(r => setTimeout(r, 100));

    try {
        const w = window as any;
        if (!w.jspdf) {
            alert("La librería de PDF no se ha cargado correctamente.");
            setIsGeneratingPdf(false);
            return;
        }

        const logoData = await getDataUrl(APP_LOGO_URL);

        const { jsPDF } = w.jspdf;
        const doc = new jsPDF();
        
        if (logoData) {
            try {
                doc.addImage(logoData, 'PNG', 14, 10, 15, 15);
            } catch (e) {
                console.warn("Error adding image to PDF:", e);
            }
        }

        doc.setFontSize(20);
        doc.text("Reporte Fiscal Ejecutivo", logoData ? 35 : 14, 20); 
        
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Generado: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 14, 30);
        doc.text(`Período: ${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`, 14, 35);

        doc.setDrawColor(200);
        doc.line(14, 40, 196, 40);
        
        doc.setFontSize(12);
        doc.setTextColor(0);
        doc.text("Resumen del Período", 14, 50);

        const kpiY = 60;
        doc.setFontSize(10);
        
        doc.text(`Total Aprobado: $${totalApproved.toLocaleString()}`, 14, kpiY);
        doc.text(`Pagos Rechazados: ${totalRejectedCount}`, 80, kpiY);
        doc.text(`Pendientes: ${totalPendingCount}`, 140, kpiY);

        doc.text("Detalle de Transacciones Auditadas", 14, 80);
        
        const tableData = filteredPayments
            .filter(p => p.status === PaymentStatus.APPROVED || p.status === PaymentStatus.REJECTED)
            .map(p => [
                new Date(p.submittedDate).toLocaleDateString(),
                p.storeName,
                p.specificType,
                `$${p.amount.toLocaleString()}`,
                p.status
            ]);

        if (w.jspdf.plugin?.autotable || doc.autoTable) {
             doc.autoTable({
                startY: 85,
                head: [['Fecha', 'Tienda', 'Concepto', 'Monto', 'Estado']],
                body: tableData,
                theme: 'grid',
                headStyles: { fillColor: [30, 41, 59] },
                styles: { fontSize: 8 },
             });
        } else {
             doc.text("Plugin de tablas no disponible.", 14, 90);
        }

        const pageCount = doc.internal.getNumberOfPages();
        for(let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text(`FiscalCtl - Página ${i} de ${pageCount}`, 196, 285, { align: 'right' });
        }

        doc.save(`Reporte_Fiscal_${new Date().toISOString().split('T')[0]}.pdf`);

    } catch (error) {
        console.error("Error generando PDF:", error);
        alert("Ocurrió un error al generar el PDF. Revise la consola.");
    } finally {
        setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 lg:p-8 animate-in fade-in duration-500">
      {/* Header */}
      <header className="flex flex-col xl:flex-row xl:justify-between xl:items-center gap-6 mb-8">
        <div className="flex items-center gap-4">
             <div className="p-2 bg-blue-500/10 rounded-xl text-blue-400">
                <TrendingUp size={24} />
             </div>
             <div>
                <h1 className="text-2xl font-bold">Panel de Presidencia</h1>
                <p className="text-slate-400 text-sm">Supervisión de Auditoría y Flujo de Caja</p>
             </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
            {/* Date Range Picker */}
            <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 shadow-sm">
                <div className="flex items-center gap-2 px-3 py-2 border-r border-slate-800 text-slate-400">
                    <Filter size={16} />
                    <span className="text-xs font-bold uppercase tracking-wider hidden sm:block">Rango</span>
                </div>
                <div className="flex items-center gap-2 px-3">
                    <input 
                        type="date" 
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="bg-transparent text-white text-sm outline-none focus:ring-1 focus:ring-blue-500 rounded px-1 [color-scheme:dark]"
                    />
                    <span className="text-slate-600">-</span>
                    <input 
                        type="date" 
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="bg-transparent text-white text-sm outline-none focus:ring-1 focus:ring-blue-500 rounded px-1 [color-scheme:dark]"
                    />
                </div>
            </div>

            <button 
                onClick={handleDownloadPDF}
                disabled={isGeneratingPdf}
                className="flex items-center justify-center gap-2 bg-yellow-500 hover:bg-yellow-400 disabled:bg-yellow-500/50 disabled:cursor-not-allowed text-slate-900 font-bold px-4 py-2 rounded-xl transition-colors shadow-lg shadow-yellow-500/20 active:scale-95"
            >
                {isGeneratingPdf ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                <span>Descargar PDF</span>
            </button>
        </div>
      </header>

      {/* KPI Cards (Filtered Range) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* Approved Money */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl relative overflow-hidden group hover:border-green-500/30 transition-colors">
              <div className="relative z-10">
                  <div className="flex justify-between items-start mb-4">
                      <div className="p-3 bg-green-500/20 rounded-lg text-green-500">
                          <CheckCircle2 size={24} />
                      </div>
                  </div>
                  <div className="text-slate-400 text-sm font-medium">Monto Aprobado</div>
                  <div className="text-3xl font-bold text-white mt-1">${totalApproved.toLocaleString()}</div>
                  <p className="text-xs text-green-400/70 mt-2 flex items-center gap-1">
                      <Calendar size={12} />
                      En selección
                  </p>
              </div>
          </div>

          {/* Budget Deviation (NEW) */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl relative overflow-hidden group hover:border-orange-500/30 transition-colors">
              <div className="relative z-10">
                  <div className="flex justify-between items-start mb-4">
                      <div className="p-3 bg-orange-500/20 rounded-lg text-orange-500">
                          <AlertTriangle size={24} />
                      </div>
                  </div>
                  <div className="text-slate-400 text-sm font-medium">Desviación Ppto.</div>
                  <div className="text-3xl font-bold text-white mt-1">${totalOverBudgetSum.toLocaleString()}</div>
                  <p className="text-xs text-orange-400 mt-2">Excedente acumulado</p>
              </div>
              <div className="absolute right-0 bottom-0 w-24 h-24 bg-orange-500/10 rounded-full blur-2xl group-hover:bg-orange-500/20 transition-all"></div>
          </div>

          {/* Rejected Count */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl relative overflow-hidden group hover:border-red-500/30 transition-colors">
              <div className="relative z-10">
                  <div className="flex justify-between items-start mb-4">
                      <div className="p-3 bg-red-500/20 rounded-lg text-red-500">
                          <XCircle size={24} />
                      </div>
                  </div>
                  <div className="text-slate-400 text-sm font-medium">Pagos Rechazados</div>
                  <div className="text-3xl font-bold text-white mt-1">{totalRejectedCount}</div>
              </div>
          </div>

           {/* Pending Count */}
           <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl relative overflow-hidden group hover:border-yellow-500/30 transition-colors">
              <div className="relative z-10">
                  <div className="flex justify-between items-start mb-4">
                      <div className="p-3 bg-yellow-500/20 rounded-lg text-yellow-500">
                          <Clock size={24} />
                      </div>
                  </div>
                  <div className="text-slate-400 text-sm font-medium">Pendientes</div>
                  <div className="text-3xl font-bold text-white mt-1">{totalPendingCount}</div>
              </div>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
         {/* Table of Rejected/Approved recent */}
         <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center justify-between">
                <span>Bitácora Filtrada</span>
                <span className="text-xs font-normal text-slate-500 bg-slate-800 px-2 py-1 rounded-full">
                    {approvedPayments.length + rejectedPayments.length} registros
                </span>
            </h3>
            <div className="overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
                {filteredPayments.filter(p => p.status === PaymentStatus.APPROVED || p.status === PaymentStatus.REJECTED).length === 0 ? (
                    <div className="text-center text-slate-500 py-10 border border-dashed border-slate-800 rounded-xl">
                        No hay registros auditados en este rango de fechas.
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredPayments
                          .filter(p => p.status === PaymentStatus.APPROVED || p.status === PaymentStatus.REJECTED)
                          .sort((a,b) => new Date(b.submittedDate).getTime() - new Date(a.submittedDate).getTime())
                          .map(p => (
                            <div key={p.id} className={`flex justify-between items-center p-3 rounded-xl border transition-colors ${
                                p.isOverBudget 
                                ? 'bg-orange-950/20 border-orange-900/50' 
                                : 'bg-slate-800/50 border-slate-800 hover:bg-slate-800'
                            }`}>
                                <div className="flex items-center gap-3">
                                    {p.status === PaymentStatus.APPROVED ? (
                                        <CheckCircle2 size={18} className="text-green-500" />
                                    ) : (
                                        <XCircle size={18} className="text-red-500" />
                                    )}
                                    <div>
                                        <div className="text-sm font-bold text-slate-200 flex items-center gap-2">
                                            {p.storeName}
                                            {p.isOverBudget && (
                                              <span title="Excedente">
                                                <AlertTriangle size={12} className="text-orange-500" />
                                              </span>
                                            )}
                                        </div>
                                        <div className="text-xs text-slate-500 flex items-center gap-2">
                                            <span>{p.specificType}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className={`text-sm font-bold ${p.isOverBudget ? 'text-orange-400' : 'text-slate-200'}`}>
                                        ${p.amount.toLocaleString()}
                                    </div>
                                    <div className="text-[10px] text-slate-500">{new Date(p.submittedDate).toLocaleDateString()}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
         </div>

         {/* Distribution Chart */}
         <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col items-center justify-center">
             <h3 className="text-lg font-bold text-white mb-2 self-start w-full">Distribución en el Período</h3>
             <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={statusData}
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {statusData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomPieTooltip />} />
                    </PieChart>
                </ResponsiveContainer>
             </div>
             <div className="flex justify-center gap-4 text-xs">
                {statusData.map(item => (
                    <div key={item.name} className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full" style={{backgroundColor: item.color}}></span>
                        <span className="text-slate-300">{item.name} ({item.value})</span>
                    </div>
                ))}
             </div>
         </div>
      </div>

      {/* --- SECCIÓN DE PROYECCIÓN ANUAL (MEJORADA) --- */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-xl">
         <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
                <h3 className="font-bold text-xl text-white flex items-center gap-2">
                    <Wallet className="text-blue-500" />
                    Proyección Financiera Anual ({new Date().getFullYear()})
                </h3>
                <p className="text-slate-400 text-sm mt-1">Comparativa de Ejecución vs. Presupuesto Base (${MONTHLY_BUDGET_TARGET.toLocaleString()}/mes)</p>
            </div>
            
            <div className="flex gap-4">
                 <div className="px-4 py-2 bg-slate-800 rounded-xl border border-slate-700">
                     <span className="text-xs text-slate-500 block uppercase">Presupuesto Anual</span>
                     <span className="text-lg font-bold text-white font-mono">${totalAnnualBudget.toLocaleString()}</span>
                 </div>
                 <div className="px-4 py-2 bg-slate-800 rounded-xl border border-slate-700">
                     <span className="text-xs text-slate-500 block uppercase">Ejecutado YTD</span>
                     <span className="text-lg font-bold text-blue-400 font-mono">${totalYTDExecuted.toLocaleString()}</span>
                 </div>
            </div>
         </div>
         
         <div className="h-[350px] w-full mb-6">
            <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={annualData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <defs>
                        <linearGradient id="colorApproved" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.4}/>
                        </linearGradient>
                         <linearGradient id="colorPending" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#eab308" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#eab308" stopOpacity={0.4}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                    <YAxis 
                        hide={false} 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fill: '#64748b', fontSize: 11}} 
                        tickFormatter={(value) => `$${value/1000}k`}
                    />
                    <Tooltip content={<CustomFinancialTooltip />} cursor={{fill: 'rgba(255,255,255,0.05)'}} />
                    <Legend iconType="circle" wrapperStyle={{paddingTop: '20px'}} />
                    
                    {/* Barras de Ejecución Real */}
                    <Bar name="Gasto Ejecutado (Aprobado)" dataKey="approved" stackId="a" fill="url(#colorApproved)" barSize={30} radius={[0,0,4,4]} />
                    
                    {/* Barras de Pendiente (Proyección) */}
                    <Bar name="Pendiente / Proyección" dataKey="pending" stackId="a" fill="url(#colorPending)" barSize={30} radius={[4,4,0,0]} />
                    
                    {/* Línea de Presupuesto */}
                    <Line 
                        name="Límite Presupuestario" 
                        type="monotone" 
                        dataKey="budget" 
                        stroke="#ef4444" 
                        strokeWidth={2} 
                        strokeDasharray="5 5" 
                        dot={false}
                        activeDot={{r: 6, fill: '#ef4444'}}
                    />
                </ComposedChart>
            </ResponsiveContainer>
         </div>

         {/* Monthly Trend Grid */}
         <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 xl:grid-cols-12 gap-3 mb-8">
            {annualData.map((month) => {
                const isOver = month.total > month.budget;
                const isEmpty = month.total === 0;
                const percentage = (month.total / month.budget) * 100;
                
                return (
                    <div key={month.name} className={`p-3 rounded-2xl border transition-all duration-300 ${
                        isEmpty 
                        ? 'bg-slate-900/50 border-slate-800 opacity-40' 
                        : isOver 
                            ? 'bg-red-500/5 border-red-500/20 hover:bg-red-500/10' 
                            : 'bg-emerald-500/5 border-emerald-500/20 hover:bg-emerald-500/10'
                    }`}>
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">{month.name}</span>
                            {!isEmpty && (
                                isOver ? (
                                    <TrendingUp size={14} className="text-red-500" />
                                ) : (
                                    <TrendingDown size={14} className="text-emerald-500" />
                                )
                            )}
                        </div>
                        <div className="flex flex-col">
                            <span className={`text-sm font-mono font-bold ${isEmpty ? 'text-slate-600' : isOver ? 'text-red-400' : 'text-emerald-400'}`}>
                                {isEmpty ? '0%' : `${percentage.toFixed(0)}%`}
                            </span>
                            <div className="w-full h-1 bg-slate-800 rounded-full mt-1.5 overflow-hidden">
                                <div 
                                    className={`h-full rounded-full transition-all duration-500 ${isOver ? 'bg-red-500' : 'bg-emerald-500'}`} 
                                    style={{ width: `${Math.min(percentage, 100)}%` }}
                                />
                            </div>
                        </div>
                    </div>
                );
            })}
         </div>

         {/* Insight Footer */}
         <div className="mt-6 p-4 bg-slate-800/50 rounded-xl border border-slate-700 flex items-start gap-3 text-sm text-slate-400">
            <AlertCircle className="text-blue-500 shrink-0 mt-0.5" size={18} />
            <div>
                <p>
                    <span className="font-bold text-slate-200">Estado del Presupuesto: </span>
                    Actualmente se ha ejecutado el <span className="text-white font-mono">{budgetUtilization.toFixed(1)}%</span> del presupuesto anual. 
                </p>
            </div>
         </div>
      </div>
    </div>
  );
};
