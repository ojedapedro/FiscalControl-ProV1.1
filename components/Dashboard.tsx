
import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  DollarSign,
  FileText,
  Zap,
  Wifi,
  Droplets,
  Plus,
  Filter,
  Clock,
  Activity,
  XCircle,
  Wallet,
  AlertCircle,
  RefreshCw,
  Download,
  ChevronUp,
  ChevronDown,
  ArrowUpDown
} from 'lucide-react';
import { Payment, PaymentStatus, PayrollEntry, Role, User } from '../types';
import { formatDate, formatDateTime } from '../src/utils';
import { useExchangeRate } from '../contexts/ExchangeRateContext';
import { StripePaymentModal } from './StripePaymentModal';

interface DashboardProps {
  payments: Payment[];
  payrollEntries: PayrollEntry[];
  onNewPayment: () => void;
  onEditPayment: (payment: Payment) => void;
  onPaymentSuccess: (paymentId: string) => void;
  currentUser?: User | null;
}

export const Dashboard: React.FC<DashboardProps> = ({
  payments,
  payrollEntries,
  onNewPayment,
  onEditPayment,
  onPaymentSuccess,
  currentUser
}) => {
  const [filter, setFilter] = React.useState<'all' | 'pending' | 'overdue' | 'approved' | 'rejected'>('all');
  const [paymentToPay, setPaymentToPay] = React.useState<Payment | null>(null);
  const [sortConfig, setSortConfig] = React.useState<{ key: 'dueDate' | 'amount' | 'submittedDate', direction: 'asc' | 'desc' }>({
    key: 'dueDate',
    direction: 'desc'
  });
  const { exchangeRate } = useExchangeRate();

  const handleDownloadFiscalCategoryPDF = () => {
    const w = window as any;
    if (!w.jspdf) {
      alert("La librería de PDF no se ha cargado correctamente.");
      return;
    }
    const { jsPDF } = w.jspdf;
    const doc = new jsPDF();

    const grouped = payments.reduce((acc, p) => {
      if (!acc[p.category]) acc[p.category] = {};
      if (!acc[p.category][p.specificType]) acc[p.category][p.specificType] = [];
      acc[p.category][p.specificType].push(p);
      return acc;
    }, {} as Record<string, Record<string, Payment[]>>);

    doc.setFontSize(18);
    doc.text("Balance de Gestión Fiscal", 14, 20);
    doc.setFontSize(10);
    doc.text(`Generado: ${formatDateTime(new Date())}`, 14, 30);
    doc.text(`Total de Pagos: ${payments.length}`, 14, 35);

    const grandTotal = payments.reduce((sum, p) => sum + p.amount, 0);
    doc.setFontSize(12);
    doc.text(`Monto Total General: $${grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 14, 42);

    let y = 50;

    Object.entries(grouped).forEach(([category, subcategories]) => {
      let categoryTotal = 0;
      Object.values(subcategories).forEach(subList => {
        categoryTotal += subList.reduce((sum, p) => sum + p.amount, 0);
      });

      if (y > 270) { doc.addPage(); y = 20; }

      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "bold");
      doc.text(`${category} - Total: $${categoryTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 14, y);
      y += 8;
      doc.setFont("helvetica", "normal");

      Object.entries(subcategories).forEach(([subCategory, subPayments]) => {
        const subTotal = subPayments.reduce((sum, p) => sum + p.amount, 0);
        if (y > 270) { doc.addPage(); y = 20; }

        doc.setFontSize(12);
        doc.setTextColor(50, 50, 50);
        doc.text(`  ${subCategory} (Total: $${subTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })})`, 14, y);
        y += 6;

        const tableData = subPayments.map(p => [
          formatDate(p.submittedDate || p.dueDate),
          p.storeName,
          `$${p.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
          p.status
        ]);

        if (doc.autoTable) {
          doc.autoTable({
            startY: y,
            head: [['Fecha', 'Tienda', 'Monto', 'Estado']],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: [10, 36, 106], textColor: 255 },
            styles: { fontSize: 8, cellPadding: 2 },
            margin: { left: 20 },
            columnStyles: {
              0: { cellWidth: 30 },
              1: { cellWidth: 'auto' },
              2: { cellWidth: 30, halign: 'right' },
              3: { cellWidth: 30 }
            }
          });
          y = (doc as any).lastAutoTable.finalY + 10;
        } else {
          y += 10;
        }
      });
      y += 5;
    });

    doc.save(`Balance_Gestion_Fiscal_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const totalDue = payments
    .filter(p => [PaymentStatus.PENDING, PaymentStatus.UPLOADED, PaymentStatus.OVERDUE].includes(p.status))
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalOverdue = payments
    .filter(p => p.status === PaymentStatus.OVERDUE)
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalLiabilities = payrollEntries.reduce((acc, entry) => {
    const entryLiabilities = entry.employerLiabilities.reduce((sum, l) => sum + l.amount, 0);
    return acc + entryLiabilities;
  }, 0);

  const pendingCount = payments.filter(p => p.status === PaymentStatus.PENDING || p.status === PaymentStatus.UPLOADED).length;
  const rejectedCount = payments.filter(p => p.status === PaymentStatus.REJECTED).length;

  const approvedPayments = payments.filter(p => p.status === PaymentStatus.APPROVED);
  const totalApproved = approvedPayments.reduce((acc, curr) => acc + curr.amount, 0);
  const averagePayment = approvedPayments.length > 0 ? totalApproved / approvedPayments.length : 0;

  const MONTHLY_BUDGET = 6000;
  const budgetUtilization = (totalApproved / MONTHLY_BUDGET) * 100;
  const overBudgetPayments = payments.filter(p => p.isOverBudget);
  const recentPayments = [...payments]
    .sort((a, b) => {
      const dateA = new Date(a.submittedDate || a.dueDate).getTime();
      const dateB = new Date(b.submittedDate || b.dueDate).getTime();
      return dateB - dateA;
    })
    .slice(0, 5);

  const filteredPayments = React.useMemo(() => {
    let result = payments.filter(payment => {
      if (filter === 'all') return true;
      if (filter === 'pending') return payment.status === PaymentStatus.PENDING || payment.status === PaymentStatus.UPLOADED;
      if (filter === 'overdue') return payment.status === PaymentStatus.OVERDUE;
      if (filter === 'approved') return payment.status === PaymentStatus.APPROVED;
      if (filter === 'rejected') return payment.status === PaymentStatus.REJECTED;
      return true;
    });

    result.sort((a, b) => {
      let valA: any;
      let valB: any;
      if (sortConfig.key === 'dueDate') {
        valA = new Date(a.dueDate).getTime();
        valB = new Date(b.dueDate).getTime();
      } else if (sortConfig.key === 'submittedDate') {
        valA = new Date(a.submittedDate || a.dueDate).getTime();
        valB = new Date(b.submittedDate || b.dueDate).getTime();
      } else if (sortConfig.key === 'amount') {
        valA = a.amount;
        valB = b.amount;
      }
      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [payments, filter, sortConfig]);

  const handleSort = (key: 'dueDate' | 'amount' | 'submittedDate') => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  const getSortIcon = (key: 'dueDate' | 'amount' | 'submittedDate') => {
    if (sortConfig.key !== key) return <ArrowUpDown size={12} style={{ opacity: 0.4 }} />;
    return sortConfig.direction === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />;
  };

  const getIconForType = (type: string) => {
    if (type.includes('Impuesto')) return <BuildingIcon />;
    if (type.includes('Electricidad')) return <Zap size={14} />;
    if (type.includes('Internet')) return <Wifi size={14} />;
    if (type.includes('Agua')) return <Droplets size={14} />;
    return <FileText size={14} />;
  };

  const getStatusColor = (status: PaymentStatus) => {
    switch (status) {
      case PaymentStatus.APPROVED: return { background: '#008000', color: '#ffffff' };
      case PaymentStatus.REJECTED: return { background: '#cc0000', color: '#ffffff' };
      case PaymentStatus.OVERDUE:  return { background: '#cc0000', color: '#ffffff' };
      case PaymentStatus.PENDING:  return { background: '#d4d0c8', color: '#000000', border: '1px solid #808080' };
      default:                     return { background: '#d4d0c8', color: '#000000', border: '1px solid #808080' };
    }
  };

  console.log("Dashboard rendering...");

  return (
    <div style={{ padding: '8px', fontFamily: 'Tahoma, Arial, sans-serif', fontSize: '11px', background: '#d4d0c8', minHeight: '100vh' }}>

      {/* ── Toolbar ── */}
      <div className="win-panel" style={{ padding: '4px 6px', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
        {/* Title bar icon + label */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginRight: '8px' }}>
          <img src="/favicon.ico" alt="" width={16} height={16} style={{ imageRendering: 'pixelated' }} onError={e => (e.currentTarget.style.display = 'none')} />
          <span style={{ fontWeight: 'bold', fontSize: '11px' }}>Gestión de Pagos</span>
        </div>

        <div style={{ width: 1, height: 22, background: '#808080', margin: '0 2px', borderRight: '1px solid #ffffff' }} />

        <button className="win-btn" onClick={handleDownloadFiscalCategoryPDF} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Download size={14} />
          Generar Reporte PDF
        </button>

        <button className="win-btn" onClick={onNewPayment} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Plus size={14} />
          Nuevo Pago
        </button>

        <div style={{ width: 1, height: 22, background: '#808080', margin: '0 2px', borderRight: '1px solid #ffffff' }} />

        <span style={{ color: '#000080', fontSize: '11px' }}>
          Tasa: Bs. {exchangeRate.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      </div>

      {/* ── Stat Cards (Win2000 groupboxes) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '6px', marginBottom: '6px' }}>
        {/* Card 1 */}
        <Win2kGroupBox title="Total por Pagar" icon={<DollarSign size={12} />}>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#000080' }}>${totalDue.toLocaleString('en-US', { maximumFractionDigits: 0 })}</div>
          <div style={{ fontSize: '10px', color: '#000000' }}>Bs. {(totalDue * exchangeRate).toLocaleString('es-VE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '3px', marginTop: '4px', color: '#008000', fontSize: '10px' }}>
            <TrendingUp size={11} /> +12% vs semana
          </div>
        </Win2kGroupBox>

        {/* Card 2 */}
        <Win2kGroupBox title="Monto Vencido" icon={<AlertTriangle size={12} />}>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#cc0000' }}>${totalOverdue.toLocaleString('en-US', { maximumFractionDigits: 0 })}</div>
          <div style={{ fontSize: '10px', color: '#000000' }}>Bs. {(totalOverdue * exchangeRate).toLocaleString('es-VE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '3px', marginTop: '4px', color: '#cc0000', fontSize: '10px' }}>
            <TrendingDown size={11} /> Acción Inmediata
          </div>
        </Win2kGroupBox>

        {/* Card 3 */}
        <Win2kGroupBox title="Pasivos Laborales" icon={<AlertCircle size={12} />}>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#804000' }}>${totalLiabilities.toLocaleString('en-US', { maximumFractionDigits: 0 })}</div>
          <div style={{ fontSize: '10px', color: '#000000' }}>Bs. {(totalLiabilities * exchangeRate).toLocaleString('es-VE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
          <div style={{ marginTop: '4px', fontSize: '10px', color: '#804000' }}>SSO, LPH, INCES</div>
        </Win2kGroupBox>

        {/* Card 4 */}
        <Win2kGroupBox title="Pagos Rechazados" icon={<XCircle size={12} />}>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#cc0000' }}>{rejectedCount}</div>
          <div style={{ marginTop: '4px', fontSize: '10px', color: '#cc0000' }}>Requiere Corrección</div>
        </Win2kGroupBox>

        {/* Card 5 */}
        <Win2kGroupBox title="Pagos Pendientes" icon={<Clock size={12} />}>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#804000' }}>{pendingCount}</div>
          <div style={{ marginTop: '4px', fontSize: '10px', color: '#804000' }}>En cola de revisión</div>
        </Win2kGroupBox>

        {/* Card 6 */}
        <Win2kGroupBox title="Promedio Pago" icon={<Activity size={12} />}>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#000080' }}>${averagePayment.toLocaleString('en-US', { maximumFractionDigits: 0 })}</div>
          <div style={{ fontSize: '10px', color: '#000000' }}>Bs. {(averagePayment * exchangeRate).toLocaleString('es-VE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
          <div style={{ marginTop: '4px', fontSize: '10px', color: '#000080' }}>Base: {approvedPayments.length} pagos</div>
        </Win2kGroupBox>
      </div>

      {/* ── Middle row: Budget + Activity ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '6px', marginBottom: '6px' }}>

        {/* Budget GroupBox */}
        <Win2kGroupBox title="Estado del Presupuesto" icon={<Wallet size={12} />}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '10px' }}>
            <span>Utilización Mensual</span>
            <span style={{ fontWeight: 'bold' }}>{budgetUtilization.toFixed(1)}%</span>
          </div>
          {/* Progress bar Win2k style */}
          <div className="win-sunken" style={{ height: '16px', overflow: 'hidden', background: '#ffffff', marginBottom: '6px' }}>
            <div style={{
              height: '100%',
              width: `${Math.min(budgetUtilization, 100)}%`,
              background: budgetUtilization > 90 ? '#cc0000' : budgetUtilization > 70 ? '#cc8800' : '#316ac5',
              transition: 'width 0.5s'
            }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', marginBottom: '6px' }}>
            <div className="win-sunken" style={{ padding: '4px', background: '#ffffff', fontSize: '10px' }}>
              <div style={{ color: '#404040', textTransform: 'uppercase', fontWeight: 'bold', fontSize: '9px' }}>Ejecutado</div>
              <div style={{ fontWeight: 'bold', fontSize: '13px' }}>${totalApproved.toLocaleString()}</div>
            </div>
            <div className="win-sunken" style={{ padding: '4px', background: '#ffffff', fontSize: '10px' }}>
              <div style={{ color: '#404040', textTransform: 'uppercase', fontWeight: 'bold', fontSize: '9px' }}>Excedentes</div>
              <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#cc0000' }}>{overBudgetPayments.length}</div>
            </div>
          </div>

          {overBudgetPayments.length > 0 && (
            <div style={{ background: '#ffffc0', border: '1px solid #cc0000', padding: '4px', fontSize: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#cc0000', fontWeight: 'bold', marginBottom: '2px' }}>
                <AlertCircle size={11} /> Alertas de Presupuesto
              </div>
              {overBudgetPayments.slice(0, 2).map(p => (
                <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
                  <span style={{ maxWidth: '110px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.specificType}</span>
                  <span style={{ color: '#cc0000', fontWeight: 'bold' }}>+${(p.amount - (p.originalBudget || 0)).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </Win2kGroupBox>

        {/* Activity GroupBox */}
        <Win2kGroupBox title="Resumen de Actividad Reciente" icon={<Activity size={12} />}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
            <thead>
              <tr>
                <th className="win-raised" style={{ padding: '3px 6px', textAlign: 'left', background: '#d4d0c8', fontWeight: 'bold' }}>Tipo</th>
                <th className="win-raised" style={{ padding: '3px 6px', textAlign: 'left', background: '#d4d0c8', fontWeight: 'bold' }}>Tienda</th>
                <th className="win-raised" style={{ padding: '3px 6px', textAlign: 'left', background: '#d4d0c8', fontWeight: 'bold' }}>Fecha</th>
                <th className="win-raised" style={{ padding: '3px 6px', textAlign: 'right', background: '#d4d0c8', fontWeight: 'bold' }}>Monto</th>
                <th className="win-raised" style={{ padding: '3px 6px', textAlign: 'center', background: '#d4d0c8', fontWeight: 'bold' }}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {recentPayments.map((payment, i) => {
                const sc = getStatusColor(payment.status);
                return (
                  <tr key={payment.id} style={{ background: i % 2 === 0 ? '#ffffff' : '#f0ede8' }}>
                    <td style={{ padding: '3px 6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {getIconForType(payment.specificType)}
                      <span>{payment.specificType}</span>
                    </td>
                    <td style={{ padding: '3px 6px' }}>{payment.storeName}</td>
                    <td style={{ padding: '3px 6px' }}>{formatDate(payment.submittedDate)}</td>
                    <td style={{ padding: '3px 6px', textAlign: 'right', fontWeight: 'bold' }}>${payment.amount.toLocaleString()}</td>
                    <td style={{ padding: '3px 6px', textAlign: 'center' }}>
                      <span style={{ ...sc, padding: '1px 6px', fontSize: '10px', fontWeight: 'bold', border: '1px solid #808080' }}>
                        {payment.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Win2kGroupBox>
      </div>

      {/* ── Transactions Table ── */}
      <Win2kGroupBox title="Transacciones Recientes" icon={<FileText size={12} />}>
        {/* Filter toolbar */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '11px', marginRight: '4px' }}>Filtrar:</span>
          {(['all', 'pending', 'overdue', 'approved', 'rejected'] as const).map(f => {
            const labels: Record<string, string> = { all: 'Todos', pending: 'Pendientes', overdue: 'Vencidos', approved: 'Aprobados', rejected: 'Rechazados' };
            return (
              <button
                key={f}
                className={filter === f ? 'win-btn' : 'win-btn'}
                onClick={() => setFilter(f)}
                style={filter === f ? {
                  borderTop: '1px solid #404040',
                  borderLeft: '1px solid #404040',
                  borderRight: '1px solid #ffffff',
                  borderBottom: '1px solid #ffffff',
                  background: '#c8c4bc',
                  fontWeight: 'bold'
                } : {}}
              >
                {labels[f]}
              </button>
            );
          })}
        </div>

        {/* Table */}
        <div className="win-sunken" style={{ background: '#ffffff', overflow: 'auto' }}>
          {filteredPayments.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: '#808080', fontSize: '11px' }}>
              <Filter size={24} style={{ display: 'inline-block', marginBottom: '6px', opacity: 0.4 }} />
              <br />No hay pagos en esta categoría.
            </div>
          ) : (
            <table className="win-table">
              <thead>
                <tr>
                  <th>Tipo / Tienda</th>
                  <th onClick={() => handleSort('dueDate')} style={{ cursor: 'pointer' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>Vencimiento {getSortIcon('dueDate')}</span>
                  </th>
                  <th onClick={() => handleSort('submittedDate')} style={{ cursor: 'pointer' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>Envío {getSortIcon('submittedDate')}</span>
                  </th>
                  <th onClick={() => handleSort('amount')} style={{ cursor: 'pointer', textAlign: 'right' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}>Monto {getSortIcon('amount')}</span>
                  </th>
                  <th style={{ textAlign: 'center' }}>Estado</th>
                  <th style={{ textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((payment, i) => {
                  const sc = getStatusColor(payment.status);
                  return (
                    <tr key={payment.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 20, height: 20 }}>
                            {getIconForType(payment.specificType)}
                          </span>
                          <div>
                            <div style={{ fontWeight: 'bold' }}>{payment.specificType}</div>
                            <div style={{ fontSize: '10px', color: '#404040' }}>{payment.storeName}</div>
                          </div>
                        </div>
                      </td>
                      <td>{formatDate(payment.dueDate)}</td>
                      <td>{formatDate(payment.submittedDate || payment.dueDate)}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 'bold' }}>${payment.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                        <div style={{ fontSize: '10px', color: '#404040' }}>Bs. {(payment.amount * exchangeRate).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</div>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{ ...sc, padding: '1px 6px', fontSize: '10px', fontWeight: 'bold', border: '1px solid #808080', display: 'inline-block' }}>
                          {payment.status === PaymentStatus.REJECTED ? 'Devuelto' : payment.status}
                        </span>
                        {payment.status === PaymentStatus.REJECTED && payment.rejectionReason && (
                          <div style={{ fontSize: '10px', color: '#cc0000', fontStyle: 'italic', marginTop: '2px' }}>
                            {payment.rejectionReason}
                          </div>
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                          {payment.status === PaymentStatus.REJECTED && (
                            <button className="win-btn" onClick={() => onEditPayment(payment)} style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '10px', minWidth: 'unset', padding: '2px 6px' }}>
                              <RefreshCw size={11} /> Corregir
                            </button>
                          )}
                          {payment.status === PaymentStatus.APPROVED && (
                            <button className="win-btn" onClick={() => setPaymentToPay(payment)} style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '10px', minWidth: 'unset', padding: '2px 6px' }}>
                              <Wallet size={11} /> Pagar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </Win2kGroupBox>

      {/* ── Status Bar ── */}
      <div style={{ display: 'flex', gap: '0', marginTop: '6px' }}>
        <div className="win-raised" style={{ flex: 1, padding: '2px 8px', fontSize: '11px', background: '#d4d0c8' }}>
          {filteredPayments.length} elemento(s)
        </div>
        <div className="win-raised" style={{ padding: '2px 16px', fontSize: '11px', background: '#d4d0c8' }}>
          Total mostrado: ${filteredPayments.reduce((s, p) => s + p.amount, 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </div>
        <div className="win-raised" style={{ padding: '2px 16px', fontSize: '11px', background: '#d4d0c8' }}>
          FiscalCtl Pro v2.2
        </div>
      </div>

      <StripePaymentModal
        payment={paymentToPay}
        isOpen={!!paymentToPay}
        onClose={() => setPaymentToPay(null)}
        onPaymentSuccess={(id) => {
          onPaymentSuccess(id);
          setPaymentToPay(null);
        }}
      />
    </div>
  );
};

/* ── Small helper: Win2000 GroupBox ── */
const Win2kGroupBox: React.FC<{ title: string; icon?: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
  <div style={{
    border: '1px solid #808080',
    boxShadow: 'inset 1px 1px 0 #ffffff',
    background: '#d4d0c8',
    padding: '8px',
    position: 'relative',
    marginTop: '6px'
  }}>
    {/* GroupBox legend */}
    <div style={{
      position: 'absolute',
      top: '-8px',
      left: '10px',
      background: '#d4d0c8',
      padding: '0 4px',
      fontSize: '11px',
      fontWeight: 'bold',
      display: 'flex',
      alignItems: 'center',
      gap: '4px'
    }}>
      {icon}{title}
    </div>
    <div style={{ marginTop: '4px' }}>{children}</div>
  </div>
);

const BuildingIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}>
    <path d="M3 21h18" />
    <path d="M5 21V7l8-4 8 4v14" />
    <path d="M17 21v-8.8" />
    <path d="M9 10a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v11" />
  </svg>
);
