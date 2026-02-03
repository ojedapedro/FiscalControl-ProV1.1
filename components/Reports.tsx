
import React, { useMemo, useState } from 'react';
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
import { Download, Calendar, ArrowUpRight, CheckCircle2, XCircle, Clock, TrendingUp, Loader2 } from 'lucide-react';

interface ReportsProps {
  payments: Payment[];
}

export const Reports: React.FC<ReportsProps> = ({ payments }) => {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // KPI Calculations
  const totalApproved = payments
    .filter(p => p.status === PaymentStatus.APPROVED)
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalRejectedCount = payments.filter(p => p.status === PaymentStatus.REJECTED).length;
  const totalPendingCount = payments.filter(p => p.status === PaymentStatus.PENDING || p.status === PaymentStatus.UPLOADED).length;
  
  const approvedPayments = payments.filter(p => p.status === PaymentStatus.APPROVED);
  const rejectedPayments = payments.filter(p => p.status === PaymentStatus.REJECTED);

  // Chart Data Preparation (Approved vs Rejected Count)
  const statusData = [
    { name: 'Aprobados', value: approvedPayments.length, color: '#22c55e' },
    { name: 'Rechazados', value: rejectedPayments.length, color: '#ef4444' },
    { name: 'Pendientes', value: totalPendingCount, color: '#eab308' },
  ];

  const handleDownloadPDF = async () => {
    setIsGeneratingPdf(true);
    try {
        // Importación dinámica
        const jsPDFModule: any = await import('jspdf');
        const autoTableModule: any = await import('jspdf-autotable');
        
        // Obtener el constructor correcto
        const JsPDF = jsPDFModule.default || jsPDFModule.jsPDF || jsPDFModule;
        const autoTable = autoTableModule.default || autoTableModule;

        const doc = new JsPDF();

        // Header
        doc.setFontSize(20);
        doc.setTextColor(41, 128, 185);
        doc.text("Reporte de Control Fiscal", 14, 22);
        
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Generado el: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 14, 28);
        doc.text("Presidencia - Auditoría de Pagos", 14, 33);

        // Summary Section
        doc.setDrawColor(200);
        doc.line(14, 40, 196, 40);
        
        doc.setFontSize(12);
        doc.setTextColor(0);
        doc.text("Resumen Ejecutivo:", 14, 48);
        
        const summaryData = [
            [`Total Aprobado ($): $${totalApproved.toLocaleString()}`, `Transacciones Aprobadas: ${approvedPayments.length}`],
            [`Rechazos: ${totalRejectedCount}`, `Pendientes de Revisión: ${totalPendingCount}`]
        ];

        // Usar autoTable
        if (typeof autoTable === 'function') {
             autoTable(doc, {
                startY: 52,
                body: summaryData,
                theme: 'plain',
                styles: { fontSize: 10, cellPadding: 1 },
                columnStyles: { 0: { cellWidth: 90 }, 1: { cellWidth: 90 } }
            });

            // Approved Table
            doc.setFontSize(12);
            doc.setTextColor(34, 197, 94); // Green
            let finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 10 : 60;
            doc.text("Detalle de Pagos Aprobados", 14, finalY);

            autoTable(doc, {
                startY: finalY + 4,
                head: [['Ref', 'Tienda', 'Concepto', 'Fecha', 'Monto ($)']],
                body: approvedPayments.map(p => [
                    p.id, 
                    p.storeName, 
                    p.specificType, 
                    p.dueDate, 
                    p.amount.toLocaleString()
                ]),
                headStyles: { fillColor: [34, 197, 94] },
                styles: { fontSize: 8 },
            });

            // Rejected Table
            doc.setFontSize(12);
            doc.setTextColor(239, 68, 68); // Red
            finalY = (doc as any).lastAutoTable.finalY + 10;
            
            // Check if page break is needed
            if (finalY > 250) {
                doc.addPage();
                finalY = 20;
            }

            doc.text("Detalle de Pagos Rechazados", 14, finalY);

            autoTable(doc, {
                startY: finalY + 4,
                head: [['Ref', 'Tienda', 'Motivo Rechazo', 'Monto ($)']],
                body: rejectedPayments.map(p => [
                    p.id, 
                    p.storeName, 
                    p.rejectionReason || 'N/A', 
                    p.amount.toLocaleString()
                ]),
                headStyles: { fillColor: [239, 68, 68] },
                styles: { fontSize: 8 },
            });
        }

        doc.save(`reporte_fiscal_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
        console.error("Error generando PDF:", error);
        alert("Hubo un error cargando el módulo de reportes. Por favor intente nuevamente.");
    } finally {
        setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 lg:p-8">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
        <div className="flex items-center gap-4">
             <div className="p-2 bg-blue-500/10 rounded-xl text-blue-400">
                <TrendingUp size={24} />
             </div>
             <div>
                <h1 className="text-2xl font-bold">Panel de Presidencia</h1>
                <p className="text-slate-400 text-sm">Supervisión de Auditoría y Flujo de Caja</p>
             </div>
        </div>
        <button 
            onClick={handleDownloadPDF}
            disabled={isGeneratingPdf}
            className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-400 disabled:bg-yellow-500/50 disabled:cursor-not-allowed text-slate-900 font-bold px-4 py-2 rounded-lg transition-colors shadow-lg shadow-yellow-500/20"
        >
            {isGeneratingPdf ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
            <span>{isGeneratingPdf ? 'Generando...' : 'Descargar PDF'}</span>
        </button>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Approved Money */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl relative overflow-hidden group">
              <div className="relative z-10">
                  <div className="flex justify-between items-start mb-4">
                      <div className="p-3 bg-green-500/20 rounded-lg text-green-500">
                          <CheckCircle2 size={24} />
                      </div>
                      <span className="text-xs font-bold bg-green-900/50 text-green-300 px-2 py-1 rounded border border-green-800">
                          AUDITADO
                      </span>
                  </div>
                  <div className="text-slate-400 text-sm font-medium">Monto Aprobado</div>
                  <div className="text-3xl font-bold text-white mt-1">${totalApproved.toLocaleString()}</div>
              </div>
              <div className="absolute right-0 bottom-0 w-24 h-24 bg-green-500/10 rounded-full blur-2xl group-hover:bg-green-500/20 transition-all"></div>
          </div>

          {/* Rejected Count */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl relative overflow-hidden group">
              <div className="relative z-10">
                  <div className="flex justify-between items-start mb-4">
                      <div className="p-3 bg-red-500/20 rounded-lg text-red-500">
                          <XCircle size={24} />
                      </div>
                  </div>
                  <div className="text-slate-400 text-sm font-medium">Pagos Rechazados</div>
                  <div className="text-3xl font-bold text-white mt-1">{totalRejectedCount}</div>
                  <p className="text-xs text-red-400 mt-2">Requieren corrección inmediata</p>
              </div>
              <div className="absolute right-0 bottom-0 w-24 h-24 bg-red-500/10 rounded-full blur-2xl group-hover:bg-red-500/20 transition-all"></div>
          </div>

           {/* Pending Count */}
           <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl relative overflow-hidden group">
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
            <h3 className="text-lg font-bold text-white mb-4">Bitácora de Auditoría Reciente</h3>
            <div className="overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
                {payments.filter(p => p.status === PaymentStatus.APPROVED || p.status === PaymentStatus.REJECTED).length === 0 ? (
                    <div className="text-center text-slate-500 py-10">No hay registros auditados aún.</div>
                ) : (
                    <div className="space-y-3">
                        {payments
                          .filter(p => p.status === PaymentStatus.APPROVED || p.status === PaymentStatus.REJECTED)
                          .sort((a,b) => new Date(b.submittedDate).getTime() - new Date(a.submittedDate).getTime())
                          .slice(0, 10) // Show last 10
                          .map(p => (
                            <div key={p.id} className="flex justify-between items-center p-3 rounded-xl bg-slate-800/50 border border-slate-800">
                                <div className="flex items-center gap-3">
                                    {p.status === PaymentStatus.APPROVED ? (
                                        <CheckCircle2 size={18} className="text-green-500" />
                                    ) : (
                                        <XCircle size={18} className="text-red-500" />
                                    )}
                                    <div>
                                        <div className="text-sm font-bold text-slate-200">{p.storeName}</div>
                                        <div className="text-xs text-slate-500">{p.specificType}</div>
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
             <h3 className="text-lg font-bold text-white mb-2 self-start w-full">Distribución de Estatus</h3>
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
                        <Tooltip 
                            contentStyle={{backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff'}}
                            itemStyle={{color: '#fff'}}
                        />
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

      {/* Historical Trend */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
         <div className="flex justify-between items-center mb-6">
            <div>
                <h3 className="font-bold text-lg">Proyección Anual de Gasto</h3>
                <p className="text-slate-500 text-sm">Basado en históricos y presupuesto</p>
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
                    <Tooltip 
                        contentStyle={{backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px'}} 
                        itemStyle={{color: '#fff'}}
                    />
                    <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                    <Area type="monotone" dataKey="secondaryValue" stroke="#eab308" strokeWidth={3} fillOpacity={1} fill="url(#colorSec)" />
                </AreaChart>
            </ResponsiveContainer>
         </div>
      </div>
    </div>
  );
};
