
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
  Cell
} from 'recharts';
import { REPORT_DATA } from '../constants';
import { Payment, PaymentStatus } from '../types';
import { Download, Calendar, ArrowUpRight, CheckCircle2, XCircle, Clock, TrendingUp, Loader2, Filter } from 'lucide-react';

interface ReportsProps {
  payments: Payment[];
}

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

const CustomAreaTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 border border-slate-700 p-4 rounded-xl shadow-2xl backdrop-blur-sm bg-opacity-95">
        <p className="font-bold text-slate-200 mb-3 text-sm border-b border-slate-700 pb-2">{label}</p>
        {payload.map((entry: any, index: number) => {
          const isProjection = entry.dataKey === 'secondaryValue';
          return (
            <div key={index} className="flex items-center justify-between gap-6 text-xs mb-2 last:mb-0">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></div>
                    <span className={isProjection ? "text-yellow-400" : "text-blue-400"}>
                        {isProjection ? 'Proyección' : 'Gasto Real'}
                    </span>
                </div>
                <span className="font-mono text-white font-bold">
                    ${entry.value.toLocaleString()}
                </span>
            </div>
          );
        })}
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

  // Filter Payments based on Date Range
  const filteredPayments = useMemo(() => {
    return payments.filter(p => {
      // Use submittedDate for audit accuracy, fallback to dueDate if needed
      const recordDate = p.submittedDate ? p.submittedDate.split('T')[0] : p.dueDate;
      return recordDate >= startDate && recordDate <= endDate;
    });
  }, [payments, startDate, endDate]);

  // KPI Calculations based on Filtered Data
  const totalApproved = filteredPayments
    .filter(p => p.status === PaymentStatus.APPROVED)
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalRejectedCount = filteredPayments.filter(p => p.status === PaymentStatus.REJECTED).length;
  const totalPendingCount = filteredPayments.filter(p => p.status === PaymentStatus.PENDING || p.status === PaymentStatus.UPLOADED).length;
  
  const approvedPayments = filteredPayments.filter(p => p.status === PaymentStatus.APPROVED);
  const rejectedPayments = filteredPayments.filter(p => p.status === PaymentStatus.REJECTED);

  // Chart Data Preparation (Approved vs Rejected Count)
  const statusData = [
    { name: 'Aprobados', value: approvedPayments.length, color: '#22c55e' },
    { name: 'Rechazados', value: rejectedPayments.length, color: '#ef4444' },
    { name: 'Pendientes', value: totalPendingCount, color: '#eab308' },
  ];

  const handleDownloadPDF = () => {
    setIsGeneratingPdf(true);
    // Simular un pequeño delay para feedback visual
    setTimeout(() => {
        try {
            const w = window as any;
            
            if (!w.jspdf) {
                alert("La librería de PDF no se ha cargado correctamente. Verifique su conexión a internet y recargue.");
                setIsGeneratingPdf(false);
                return;
            }

            const { jsPDF } = w.jspdf;
            const doc = new jsPDF();

            // --- HEADER ---
            doc.setFillColor(15, 23, 42); // Slate 950 style
            doc.rect(0, 0, 210, 40, 'F');
            
            doc.setFontSize(22);
            doc.setTextColor(255, 255, 255);
            doc.text("FiscalControl Pro", 14, 20);
            
            doc.setFontSize(12);
            doc.setTextColor(148, 163, 184); // Slate 400
            doc.text("Reporte de Gestión Fiscal y Auditoría", 14, 28);

            // --- METADATA ---
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(10);
            doc.text(`Fecha de Emisión: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 14, 50);
            doc.text(`Período Auditado: ${startDate} al ${endDate}`, 14, 55);
            doc.text(`Generado por: Presidencia / Sistema`, 14, 60);

            // --- SUMMARY KPI ---
            doc.setDrawColor(200);
            doc.line(14, 65, 196, 65);

            const summaryData = [
                ['Monto Total Aprobado', `$${totalApproved.toLocaleString('en-US', {minimumFractionDigits: 2})}`],
                ['Pagos Aprobados (Cant.)', approvedPayments.length.toString()],
                ['Pagos Rechazados (Cant.)', totalRejectedCount.toString()],
                ['Pagos Pendientes (Cant.)', totalPendingCount.toString()]
            ];

            doc.autoTable({
                startY: 70,
                head: [['Indicador', 'Valor']],
                body: summaryData,
                theme: 'striped',
                headStyles: { fillColor: [59, 130, 246] }, // Blue
                styles: { fontSize: 10, cellPadding: 2 },
                columnStyles: { 0: { fontStyle: 'bold', cellWidth: 80 } }
            });

            let finalY = doc.lastAutoTable.finalY + 15;

            // --- TABLE 1: APPROVED ---
            if (approvedPayments.length > 0) {
                doc.setFontSize(14);
                doc.setTextColor(21, 128, 61); // Green 700
                doc.text("Detalle de Transacciones Aprobadas", 14, finalY);

                doc.autoTable({
                    startY: finalY + 5,
                    head: [['Ref', 'Tienda', 'Concepto', 'Fecha Venc.', 'Monto']],
                    body: approvedPayments.map(p => [
                        p.id, 
                        p.storeName, 
                        p.specificType, 
                        p.dueDate, 
                        `$${p.amount.toLocaleString('en-US', {minimumFractionDigits: 2})}`
                    ]),
                    headStyles: { fillColor: [34, 197, 94] }, // Green 500
                    styles: { fontSize: 8 },
                    alternateRowStyles: { fillColor: [240, 253, 244] } // Green 50
                });

                finalY = doc.lastAutoTable.finalY + 15;
            }

            // Check for page break space
            if (finalY > 250) {
                doc.addPage();
                finalY = 20;
            }

            // --- TABLE 2: REJECTED ---
            if (rejectedPayments.length > 0) {
                doc.setFontSize(14);
                doc.setTextColor(185, 28, 28); // Red 700
                doc.text("Detalle de Rechazos e Incidencias", 14, finalY);

                doc.autoTable({
                    startY: finalY + 5,
                    head: [['Ref', 'Tienda', 'Motivo del Rechazo', 'Monto']],
                    body: rejectedPayments.map(p => [
                        p.id, 
                        p.storeName, 
                        p.rejectionReason || 'Sin motivo especificado', 
                        `$${p.amount.toLocaleString('en-US', {minimumFractionDigits: 2})}`
                    ]),
                    headStyles: { fillColor: [239, 68, 68] }, // Red 500
                    styles: { fontSize: 8 },
                    alternateRowStyles: { fillColor: [254, 242, 242] } // Red 50
                });
            }

            // --- FOOTER (Page Numbers) ---
            const pageCount = doc.internal.getNumberOfPages();
            for(let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.setTextColor(150);
                doc.text(`Página ${i} de ${pageCount} - FiscalControl Pro`, 105, 285, { align: 'center' });
            }

            doc.save(`Fiscal_Report_${startDate}_${endDate}.pdf`);
        } catch (error) {
            console.error("Error generando PDF:", error);
            alert("Hubo un error generando el PDF. Revise la consola para más detalles.");
        } finally {
            setIsGeneratingPdf(false);
        }
    }, 500);
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

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Approved Money */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl relative overflow-hidden group hover:border-green-500/30 transition-colors">
              <div className="relative z-10">
                  <div className="flex justify-between items-start mb-4">
                      <div className="p-3 bg-green-500/20 rounded-lg text-green-500">
                          <CheckCircle2 size={24} />
                      </div>
                      <span className="text-xs font-bold bg-green-900/50 text-green-300 px-2 py-1 rounded border border-green-800">
                          SELECCIÓN
                      </span>
                  </div>
                  <div className="text-slate-400 text-sm font-medium">Monto Aprobado</div>
                  <div className="text-3xl font-bold text-white mt-1">${totalApproved.toLocaleString()}</div>
                  <p className="text-xs text-green-400/70 mt-2 flex items-center gap-1">
                      <Calendar size={12} />
                      {new Date(startDate).toLocaleDateString()} - {new Date(endDate).toLocaleDateString()}
                  </p>
              </div>
              <div className="absolute right-0 bottom-0 w-24 h-24 bg-green-500/10 rounded-full blur-2xl group-hover:bg-green-500/20 transition-all"></div>
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
                  <p className="text-xs text-red-400 mt-2">En el período seleccionado</p>
              </div>
              <div className="absolute right-0 bottom-0 w-24 h-24 bg-red-500/10 rounded-full blur-2xl group-hover:bg-red-500/20 transition-all"></div>
          </div>

           {/* Pending Count */}
           <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl relative overflow-hidden group hover:border-yellow-500/30 transition-colors">
              <div className="relative z-10">
                  <div className="flex justify-between items-start mb-4">
                      <div className="p-3 bg-yellow-500/20 rounded-lg text-yellow-500">
                          <Clock size={24} />
                      </div>
                  </div>
                  <div className="text-slate-400 text-sm font-medium">Pendientes de Revisión</div>
                  <div className="text-3xl font-bold text-white mt-1">{totalPendingCount}</div>
                   <p className="text-xs text-yellow-400 mt-2">En cola del auditor</p>
              </div>
              <div className="absolute right-0 bottom-0 w-24 h-24 bg-yellow-500/10 rounded-full blur-2xl group-hover:bg-yellow-500/20 transition-all"></div>
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
                            <div key={p.id} className="flex justify-between items-center p-3 rounded-xl bg-slate-800/50 border border-slate-800 hover:bg-slate-800 transition-colors">
                                <div className="flex items-center gap-3">
                                    {p.status === PaymentStatus.APPROVED ? (
                                        <CheckCircle2 size={18} className="text-green-500" />
                                    ) : (
                                        <XCircle size={18} className="text-red-500" />
                                    )}
                                    <div>
                                        <div className="text-sm font-bold text-slate-200">{p.storeName}</div>
                                        <div className="text-xs text-slate-500 flex items-center gap-2">
                                            <span>{p.specificType}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm font-bold text-slate-200">${p.amount.toLocaleString()}</div>
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

      {/* Historical Trend - Keeping it Annual for Context */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 opacity-80 hover:opacity-100 transition-opacity">
         <div className="flex justify-between items-center mb-6">
            <div>
                <h3 className="font-bold text-lg">Proyección Anual de Gasto</h3>
                <p className="text-slate-500 text-sm">Contexto histórico global (No afectado por filtros temporales)</p>
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
                    <Tooltip content={<CustomAreaTooltip />} />
                    <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                    <Area type="monotone" dataKey="secondaryValue" stroke="#eab308" strokeWidth={3} fillOpacity={1} fill="url(#colorSec)" />
                </AreaChart>
            </ResponsiveContainer>
         </div>
      </div>
    </div>
  );
};
