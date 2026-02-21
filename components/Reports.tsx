
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
import { STORES, APP_LOGO_URL } from '../constants';

import VenezuelaMap from '@/components/VenezuelaMap';

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
    const approvedEntry = payload.find((p: any) => p.dataKey === 'approved');
    const pendingEntry = payload.find((p: any) => p.dataKey === 'pending');
    
    const approvedValue = approvedEntry?.value || 0;
    const pendingValue = pendingEntry?.value || 0;
    
    const approvedPercent = (approvedValue / MONTHLY_BUDGET_TARGET) * 100;
    const pendingPercent = (pendingValue / MONTHLY_BUDGET_TARGET) * 100;
    const totalPercent = ((approvedValue + pendingValue) / MONTHLY_BUDGET_TARGET) * 100;

    return (
      <div className="bg-slate-900 border border-slate-700 p-4 rounded-xl shadow-2xl backdrop-blur-sm bg-opacity-95 min-w-[240px] z-50">
        <p className="font-bold text-slate-200 mb-3 text-sm border-b border-slate-700 pb-2 uppercase tracking-wider">{label}</p>
        
        <div className="space-y-3">
          {/* Gasto Ejecutado */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <span className="text-slate-400">Gasto Ejecutado</span>
              </div>
              <span className="font-mono font-bold text-blue-400">
                ${approvedValue.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mr-2">
                <div className="bg-blue-500 h-full" style={{ width: `${Math.min(approvedPercent, 100)}%` }}></div>
              </div>
              <span className="text-[10px] font-bold text-slate-500">{approvedPercent.toFixed(1)}%</span>
            </div>
          </div>

          {/* Pendiente */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                <span className="text-slate-400">Pendiente / En Proceso</span>
              </div>
              <span className="font-mono font-bold text-yellow-400">
                ${pendingValue.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mr-2">
                <div className="bg-yellow-500 h-full" style={{ width: `${Math.min(pendingPercent, 100)}%` }}></div>
              </div>
              <span className="text-[10px] font-bold text-slate-500">{pendingPercent.toFixed(1)}%</span>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-700 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500 font-medium">Total Proyectado:</span>
            <span className={`font-mono font-bold ${totalPercent > 100 ? 'text-red-400' : 'text-slate-200'}`}>
              ${(approvedValue + pendingValue).toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between items-center text-[10px]">
            <span className="text-slate-500">Utilización Total:</span>
            <span className={`font-bold ${totalPercent > 100 ? 'text-red-400' : 'text-slate-400'}`}>
              {totalPercent.toFixed(1)}% del presupuesto
            </span>
          </div>
          <div className="flex justify-between items-center text-[10px] text-slate-600">
            <span>Presupuesto Base:</span>
            <span>${MONTHLY_BUDGET_TARGET.toLocaleString()}</span>
          </div>
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

  // Store and Municipality Filter States
  const [selectedStore, setSelectedStore] = useState('all');
  const [selectedMunicipality, setSelectedMunicipality] = useState('all');

  const municipalities = useMemo(() => {
    const allMunicipalities = STORES.map(s => s.municipality || 'N/A');
    return ['all', ...Array.from(new Set(allMunicipalities))];
  }, []);

  // --- PROCESAMIENTO DE DATOS ---

  const filteredPayments = useMemo(() => {
    return payments.filter(p => {
      const recordDate = p.submittedDate ? p.submittedDate.split('T')[0] : p.dueDate;
      const isDateInRange = recordDate >= startDate && recordDate <= endDate;
      const storeMatch = selectedStore === 'all' || p.storeId === selectedStore;
      const storeDetails = STORES.find(s => s.id === p.storeId);
      const municipalityMatch = selectedMunicipality === 'all' || (storeDetails && storeDetails.municipality === selectedMunicipality);

      return isDateInRange && storeMatch && municipalityMatch;
    });
  }, [payments, startDate, endDate, selectedStore, selectedMunicipality]);

  // Calcular el estado dinámico de las tiendas para el mapa en el reporte
  const dynamicStores = useMemo(() => {
    return STORES.map(store => {
        const storePayments = payments.filter(p => p.storeId === store.id);
        let calculatedStatus: 'En Regla' | 'En Riesgo' | 'Vencido' = 'En Regla';
        
        const hasOverdue = storePayments.some(p => p.status === PaymentStatus.OVERDUE);
        const hasPending = storePayments.some(p => p.status === PaymentStatus.PENDING || p.status === PaymentStatus.UPLOADED);

        if (hasOverdue) {
            calculatedStatus = 'Vencido';
        } else if (hasPending) {
            calculatedStatus = 'En Riesgo';
        }

        return {
            ...store,
            status: calculatedStatus
        };
    });
  }, [payments]);

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
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 lg:p-8 font-sans">
      {/* Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col xl:flex-row xl:justify-between xl:items-center gap-6 mb-8"
      >
        <div className="flex items-center gap-4">
             <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-400 shadow-inner shadow-blue-500/20">
                <TrendingUp size={28} />
             </div>
             <div>
                <h1 className="text-3xl font-bold tracking-tight">Panel de Presidencia</h1>
                <div className="flex items-center gap-2 mt-1">
                    <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <p className="text-slate-400 text-sm font-medium">Supervisión en Tiempo Real • Auditoría Fiscal</p>
                </div>
             </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
            {/* Store and Municipality Filters */}
            <div className="flex items-center bg-slate-900/50 backdrop-blur-md p-1.5 rounded-2xl border border-slate-800 shadow-xl">
                <select 
                    value={selectedStore} 
                    onChange={e => setSelectedStore(e.target.value)}
                    className="bg-slate-800/50 text-white text-xs font-bold p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/50 transition-all cursor-pointer hover:bg-slate-800"
                >
                    <option value="all">Todas las Tiendas</option>
                    {STORES.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <select 
                    value={selectedMunicipality} 
                    onChange={e => setSelectedMunicipality(e.target.value)}
                    className="bg-slate-800/50 text-white text-xs font-bold p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/50 ml-1.5 transition-all cursor-pointer hover:bg-slate-800"
                >
                    <option value="all">Todos los Municipios</option>
                    {municipalities.filter(m => m !== 'all').map(m => <option key={m} value={m}>{m}</option>)}
                </select>
            </div>

            {/* Date Range Picker */}
            <div className="flex items-center bg-slate-900/50 backdrop-blur-md p-1.5 rounded-2xl border border-slate-800 shadow-xl">
                <div className="flex items-center gap-2 px-3 py-2 border-r border-slate-800 text-slate-400">
                    <Filter size={16} />
                    <span className="text-xs font-bold uppercase tracking-wider hidden sm:block">Rango</span>
                </div>
                <div className="flex items-center gap-2 px-3">
                    <input 
                        type="date" 
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="bg-transparent text-white text-sm outline-none focus:ring-1 focus:ring-blue-500 rounded px-1 [color-scheme:dark] cursor-pointer"
                    />
                    <span className="text-slate-600 font-bold">-</span>
                    <input 
                        type="date" 
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="bg-transparent text-white text-sm outline-none focus:ring-1 focus:ring-blue-500 rounded px-1 [color-scheme:dark] cursor-pointer"
                    />
                </div>
            </div>

            <button 
                onClick={handleDownloadPDF}
                disabled={isGeneratingPdf}
                className="flex items-center justify-center gap-2 bg-gradient-to-br from-yellow-400 to-yellow-600 hover:from-yellow-300 hover:to-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-bold px-6 py-2.5 rounded-2xl transition-all shadow-lg shadow-yellow-500/20 active:scale-95 group"
            >
                {isGeneratingPdf ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} className="group-hover:translate-y-0.5 transition-transform" />}
                <span>Exportar Reporte</span>
            </button>
        </div>
      </motion.header>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            { label: 'Monto Aprobado', value: `$${totalApproved.toLocaleString()}`, icon: CheckCircle2, color: 'emerald', sub: 'En selección' },
            { label: 'Desviación Ppto.', value: `$${totalOverBudgetSum.toLocaleString()}`, icon: AlertTriangle, color: 'orange', sub: 'Excedente acumulado' },
            { label: 'Pagos Rechazados', value: totalRejectedCount, icon: XCircle, color: 'red', sub: 'Revisiones fallidas' },
            { label: 'En Espera', value: totalPendingCount, icon: Clock, color: 'yellow', sub: 'Pendientes de firma' }
          ].map((kpi, i) => (
            <motion.div 
              key={kpi.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`bg-slate-900 border border-slate-800 p-6 rounded-3xl relative overflow-hidden group hover:border-${kpi.color}-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-${kpi.color}-500/10`}
            >
                <div className="relative z-10">
                    <div className="flex justify-between items-start mb-4">
                        <div className={`p-3 bg-${kpi.color}-500/10 rounded-2xl text-${kpi.color}-500 group-hover:scale-110 transition-transform duration-300`}>
                            <kpi.icon size={24} />
                        </div>
                        <div className={`text-[10px] font-bold px-2 py-1 rounded-full bg-${kpi.color}-500/10 text-${kpi.color}-500 uppercase tracking-wider`}>
                            Live
                        </div>
                    </div>
                    <div className="text-slate-400 text-sm font-semibold tracking-wide">{kpi.label}</div>
                    <div className="text-3xl font-bold text-white mt-1 font-mono">{kpi.value}</div>
                    <p className={`text-xs text-${kpi.color}-400/70 mt-3 flex items-center gap-1.5 font-medium`}>
                        <ArrowUpRight size={14} />
                        {kpi.sub}
                    </p>
                </div>
                <div className={`absolute -right-4 -bottom-4 w-24 h-24 bg-${kpi.color}-500/5 rounded-full blur-3xl group-hover:bg-${kpi.color}-500/10 transition-all duration-500`}></div>
            </motion.div>
          ))}
      </div>

      {/* Main Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
         
         {/* Annual Projection (Main Chart) - 8 columns */}
         <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden"
         >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 relative z-10">
                <div>
                    <h3 className="font-bold text-2xl text-white flex items-center gap-3">
                        <div className="p-2 bg-blue-500/20 rounded-xl">
                            <Wallet className="text-blue-500" size={20} />
                        </div>
                        Proyección Financiera Anual
                    </h3>
                    <p className="text-slate-400 text-sm mt-1.5 font-medium">Comparativa de Ejecución vs. Presupuesto Base (${MONTHLY_BUDGET_TARGET.toLocaleString()}/mes)</p>
                </div>
                
                <div className="flex gap-3">
                    <div className="px-5 py-3 bg-slate-800/50 backdrop-blur-md rounded-2xl border border-slate-700/50 shadow-inner">
                        <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-widest mb-1">Presupuesto Anual</span>
                        <span className="text-xl font-bold text-white font-mono">${totalAnnualBudget.toLocaleString()}</span>
                    </div>
                    <div className="px-5 py-3 bg-blue-500/10 backdrop-blur-md rounded-2xl border border-blue-500/20 shadow-inner">
                        <span className="text-[10px] text-blue-400 block uppercase font-bold tracking-widest mb-1">Ejecutado YTD</span>
                        <span className="text-xl font-bold text-blue-400 font-mono">${totalYTDExecuted.toLocaleString()}</span>
                    </div>
                </div>
            </div>
            
            <div className="h-[400px] w-full mb-8 relative z-10">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={annualData} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                        <defs>
                            <linearGradient id="colorApproved" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05}/>
                            </linearGradient>
                            <linearGradient id="colorPending" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#eab308" stopOpacity={0.4}/>
                                <stop offset="95%" stopColor="#eab308" stopOpacity={0.05}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} opacity={0.5} />
                        <XAxis 
                            dataKey="name" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 600}} 
                            dy={10}
                        />
                        <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{fill: '#64748b', fontSize: 11}} 
                            tickFormatter={(value) => `$${value/1000}k`}
                            dx={-10}
                        />
                        <Tooltip content={<CustomFinancialTooltip />} cursor={{fill: 'rgba(255,255,255,0.03)'}} />
                        <Legend 
                            verticalAlign="top" 
                            align="right" 
                            iconType="circle" 
                            wrapperStyle={{paddingBottom: '30px', fontSize: '12px', fontWeight: 600}} 
                        />
                        
                        <Area type="monotone" dataKey="approved" stroke="none" fill="url(#colorApproved)" />
                        <Area type="monotone" dataKey="pending" stroke="none" fill="url(#colorPending)" />

                        <Bar name="Gasto Ejecutado" dataKey="approved" stackId="a" fill="#3b82f6" barSize={24} radius={[0,0,4,4]} />
                        <Bar name="Pendiente / Proyección" dataKey="pending" stackId="a" fill="#eab308" barSize={24} radius={[6,6,0,0]} />
                        
                        <Line 
                            name="Límite Presupuestario" 
                            type="stepAfter" 
                            dataKey="budget" 
                            stroke="#ef4444" 
                            strokeWidth={2} 
                            strokeDasharray="8 4" 
                            dot={false}
                            activeDot={{r: 6, fill: '#ef4444', stroke: '#fff', strokeWidth: 2}}
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>

            {/* Monthly Trend Grid */}
            <div className="grid grid-cols-4 sm:grid-cols-6 xl:grid-cols-12 gap-3 relative z-10">
                {annualData.map((month, idx) => {
                    const isOver = month.total > month.budget;
                    const isEmpty = month.total === 0;
                    const percentage = (month.total / month.budget) * 100;
                    
                    return (
                        <motion.div 
                            key={month.name}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.6 + (idx * 0.05) }}
                            className={`p-3 rounded-2xl border transition-all duration-300 group cursor-default ${
                            isEmpty 
                            ? 'bg-slate-900/50 border-slate-800 opacity-40' 
                            : isOver 
                                ? 'bg-red-500/5 border-red-500/20 hover:border-red-500/50' 
                                : 'bg-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/50'
                        }`}>
                            <div className="flex justify-between items-start mb-1.5">
                                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">{month.name}</span>
                                {!isEmpty && (
                                    isOver ? (
                                        <TrendingUp size={12} className="text-red-500" />
                                    ) : (
                                        <TrendingDown size={12} className="text-emerald-500" />
                                    )
                                )}
                            </div>
                            <div className="flex flex-col">
                                <span className={`text-xs font-mono font-bold ${isEmpty ? 'text-slate-600' : isOver ? 'text-red-400' : 'text-emerald-400'}`}>
                                    {isEmpty ? '0%' : `${percentage.toFixed(0)}%`}
                                </span>
                                <div className="w-full h-1 bg-slate-800 rounded-full mt-1.5 overflow-hidden">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${Math.min(percentage, 100)}%` }}
                                        transition={{ duration: 1, delay: 1 }}
                                        className={`h-full rounded-full ${isOver ? 'bg-red-500' : 'bg-emerald-500'}`} 
                                    />
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
         </motion.div>

         {/* Distribution & Map Section - 4 columns */}
         <div className="lg:col-span-4 flex flex-col gap-8">
            {/* Distribution Chart */}
            <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 flex flex-col items-center shadow-2xl"
            >
                <h3 className="text-lg font-bold text-white mb-6 self-start flex items-center gap-2">
                    <div className="w-1.5 h-6 bg-emerald-500 rounded-full"></div>
                    Distribución de Pagos
                </h3>
                <div className="h-[240px] w-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={statusData}
                                innerRadius={70}
                                outerRadius={95}
                                paddingAngle={8}
                                dataKey="value"
                                stroke="none"
                            >
                                {statusData.map((entry, index) => (
                                    <Cell 
                                        key={`cell-${index}`} 
                                        fill={entry.color} 
                                        className="hover:opacity-80 transition-opacity cursor-pointer outline-none"
                                    />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomPieTooltip />} />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-3xl font-bold text-white font-mono">{filteredPayments.length}</span>
                        <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Total</span>
                    </div>
                </div>
                <div className="grid grid-cols-1 w-full gap-3 mt-8">
                    {statusData.map(item => (
                        <div key={item.name} className="flex items-center justify-between p-3 bg-slate-800/30 rounded-2xl border border-slate-800/50 hover:bg-slate-800/50 transition-colors">
                            <div className="flex items-center gap-3">
                                <span className="w-3 h-3 rounded-full shadow-lg" style={{backgroundColor: item.color, boxShadow: `0 0 10px ${item.color}40`}}></span>
                                <span className="text-xs font-bold text-slate-300">{item.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-white font-mono">{item.value}</span>
                                <span className="text-[10px] text-slate-500 font-bold">({((item.value / (filteredPayments.length || 1)) * 100).toFixed(0)}%)</span>
                            </div>
                        </div>
                    ))}
                </div>
            </motion.div>

            {/* Insight Card */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-blue-500/20 relative overflow-hidden group"
            >
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
                            <AlertCircle size={20} />
                        </div>
                        <h4 className="font-bold text-lg">Insight Ejecutivo</h4>
                    </div>
                    <p className="text-blue-50 leading-relaxed text-sm">
                        Se ha ejecutado el <span className="font-bold text-white underline decoration-white/30 underline-offset-4">{budgetUtilization.toFixed(1)}%</span> del presupuesto anual. 
                        {budgetUtilization > 100 ? ' Se recomienda revisar las desviaciones críticas en los rubros variables.' : ' El flujo de caja se mantiene dentro de los parámetros proyectados.'}
                    </p>
                    <div className="mt-6 flex items-center justify-between">
                        <div className="flex flex-col">
                            <span className="text-[10px] uppercase font-bold text-blue-200 tracking-widest">Disponible</span>
                            <span className="text-xl font-bold font-mono">${availableBudget.toLocaleString()}</span>
                        </div>
                        <button className="p-3 bg-white/20 hover:bg-white/30 rounded-2xl backdrop-blur-md transition-all active:scale-95">
                            <ArrowUpRight size={20} />
                        </button>
                    </div>
                </div>
                {/* Decorative elements */}
                <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700"></div>
                <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-black/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700"></div>
            </motion.div>
         </div>
      </div>

      {/* Bottom Section: Map & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Venezuela Map - 7 columns */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="lg:col-span-7"
          >
             <VenezuelaMap 
                 stores={dynamicStores} 
                 selectedStoreIds={selectedStore !== 'all' ? [selectedStore] : []}
                 onStoreClick={(id) => setSelectedStore(id === selectedStore ? 'all' : id)}
             />
          </motion.div>

          {/* Activity Log - 5 columns */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl flex flex-col"
          >
            <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-bold text-white flex items-center gap-3">
                    <div className="w-1.5 h-6 bg-blue-500 rounded-full"></div>
                    Bitácora de Auditoría
                </h3>
                <span className="text-[10px] font-bold text-slate-400 bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700 uppercase tracking-widest">
                    {approvedPayments.length + rejectedPayments.length} Eventos
                </span>
            </div>
            
            <div className="overflow-y-auto max-h-[400px] pr-2 custom-scrollbar space-y-4">
                {filteredPayments.filter(p => p.status === PaymentStatus.APPROVED || p.status === PaymentStatus.REJECTED).length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-500 border-2 border-dashed border-slate-800 rounded-[2rem]">
                        <AlertCircle size={40} className="mb-4 opacity-20" />
                        <p className="font-medium">Sin registros en este rango</p>
                    </div>
                ) : (
                    <AnimatePresence mode="popLayout">
                        {filteredPayments
                          .filter(p => p.status === PaymentStatus.APPROVED || p.status === PaymentStatus.REJECTED)
                          .sort((a,b) => new Date(b.submittedDate).getTime() - new Date(a.submittedDate).getTime())
                          .map((p, idx) => (
                            <motion.div 
                                key={p.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 1 + (idx * 0.05) }}
                                className={`group flex justify-between items-center p-4 rounded-2xl border transition-all duration-300 ${
                                    p.isOverBudget 
                                    ? 'bg-orange-500/5 border-orange-500/20 hover:border-orange-500/40' 
                                    : 'bg-slate-800/30 border-slate-800/50 hover:border-slate-700 hover:bg-slate-800/50'
                                }`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`p-2.5 rounded-xl ${
                                        p.status === PaymentStatus.APPROVED 
                                        ? 'bg-emerald-500/10 text-emerald-500' 
                                        : 'bg-red-500/10 text-red-500'
                                    }`}>
                                        {p.status === PaymentStatus.APPROVED ? (
                                            <CheckCircle2 size={20} />
                                        ) : (
                                            <XCircle size={20} />
                                        )}
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-slate-200 flex items-center gap-2 group-hover:text-white transition-colors">
                                            {p.storeName}
                                            {p.isOverBudget && (
                                              <motion.span 
                                                animate={{ scale: [1, 1.2, 1] }}
                                                transition={{ repeat: Infinity, duration: 2 }}
                                                title="Excedente detectado"
                                              >
                                                <AlertTriangle size={14} className="text-orange-500" />
                                              </motion.span>
                                            )}
                                        </div>
                                        <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5 font-medium">
                                            <span className="truncate max-w-[150px]">{p.specificType}</span>
                                            <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                                            <span>{new Date(p.submittedDate).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className={`text-base font-bold font-mono ${p.isOverBudget ? 'text-orange-400' : 'text-slate-100'}`}>
                                        ${p.amount.toLocaleString()}
                                    </div>
                                    <div className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mt-1">
                                        {p.status}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                )}
            </div>
          </motion.div>
      </div>
    </div>
  );
};
