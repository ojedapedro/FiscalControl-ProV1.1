
import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, DollarSign, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { Payment, PaymentStatus } from '../types';

interface CalendarViewProps {
  payments: Payment[];
}

export const CalendarView: React.FC<CalendarViewProps> = ({ payments }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedPayments, setSelectedPayments] = useState<Payment[]>([]);

  // Helpers de Fecha
  const getDaysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const daysOfWeek = ['DOM', 'LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB'];

  // Navegación
  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  // Filtrar pagos cuando cambia la fecha seleccionada
  useEffect(() => {
    const formattedDate = selectedDate.toISOString().split('T')[0];
    // Nota: En un entorno real, asegurar que las zonas horarias coincidan. 
    // Aquí asumimos string comparison simple para el ejemplo.
    
    // Convertir selectedDate a formato YYYY-MM-DD local manual para coincidir con strings de payments
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    const localDateString = `${year}-${month}-${day}`;

    const filtered = payments.filter(p => p.dueDate === localDateString);
    setSelectedPayments(filtered);
  }, [selectedDate, payments]);

  // Generación de Grid
  const renderCalendarDays = () => {
    const totalDays = getDaysInMonth(currentDate);
    const startDay = getFirstDayOfMonth(currentDate);
    const days = [];

    // Padding para días vacíos al inicio
    for (let i = 0; i < startDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-24 bg-transparent"></div>);
    }

    // Días del mes
    for (let day = 1; day <= totalDays; day++) {
      const currentDayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const dayString = `${currentDayDate.getFullYear()}-${String(currentDayDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      
      const isSelected = selectedDate.toDateString() === currentDayDate.toDateString();
      const isToday = new Date().toDateString() === currentDayDate.toDateString();
      
      // Buscar pagos para este día
      const dayPayments = payments.filter(p => p.dueDate === dayString);
      const hasOverdue = dayPayments.some(p => p.status === PaymentStatus.OVERDUE);
      const hasPending = dayPayments.some(p => p.status === PaymentStatus.PENDING);
      const hasApproved = dayPayments.some(p => p.status === PaymentStatus.APPROVED);

      days.push(
        <div 
          key={day}
          onClick={() => setSelectedDate(currentDayDate)}
          className={`relative h-24 sm:h-28 border border-slate-100 dark:border-slate-800 p-2 transition-all cursor-pointer group hover:bg-slate-50 dark:hover:bg-slate-800/50 flex flex-col justify-between rounded-xl ${
            isSelected ? 'bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-500 border-transparent' : 'bg-white dark:bg-slate-900'
          }`}
        >
          <div className="flex justify-between items-start">
            <span className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full ${
              isToday 
                ? 'bg-blue-600 text-white' 
                : isSelected 
                  ? 'text-blue-600 dark:text-blue-400 font-bold' 
                  : 'text-slate-700 dark:text-slate-300'
            }`}>
              {day}
            </span>
            {dayPayments.length > 0 && (
                 <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded-md">
                    {dayPayments.length}
                 </span>
            )}
          </div>

          {/* Indicadores de Eventos */}
          <div className="flex gap-1 mt-1 flex-wrap content-end">
            {hasOverdue && <div className="w-full h-1.5 rounded-full bg-red-500 mb-1" title="Vencidos"></div>}
            {hasPending && <div className="w-full h-1.5 rounded-full bg-yellow-400 mb-1" title="Pendientes"></div>}
            {hasApproved && <div className="w-full h-1.5 rounded-full bg-green-500 mb-1" title="Pagados"></div>}
            
            {/* Texto de resumen para pantallas grandes */}
            {dayPayments.length > 0 && (
                <div className="hidden sm:block w-full text-[10px] text-slate-400 truncate mt-1">
                    ${dayPayments.reduce((acc, p) => acc + p.amount, 0).toLocaleString()}
                </div>
            )}
          </div>
        </div>
      );
    }
    return days;
  };

  const totalAmountForDay = selectedPayments.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="flex flex-col lg:flex-row h-full bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      
      {/* Calendar Grid Section */}
      <div className="flex-1 p-4 lg:p-8 flex flex-col h-full overflow-y-auto no-scrollbar">
        <header className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Calendario Fiscal</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Organice sus obligaciones por fecha de vencimiento.</p>
          </div>
          <div className="flex items-center gap-4 bg-white dark:bg-slate-900 p-1.5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
            <button onClick={prevMonth} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300 transition-colors">
                <ChevronLeft size={20} />
            </button>
            <span className="font-bold text-lg min-w-[140px] text-center text-slate-800 dark:text-white capitalize">
                {months[currentDate.getMonth()]} {currentDate.getFullYear()}
            </span>
            <button onClick={nextMonth} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300 transition-colors">
                <ChevronRight size={20} />
            </button>
          </div>
        </header>

        {/* Days Header */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {daysOfWeek.map(d => (
            <div key={d} className="text-center text-xs font-bold text-slate-400 py-2">
              {d}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2 lg:gap-3 flex-1 auto-rows-fr">
          {renderCalendarDays()}
        </div>
        
        {/* Legend */}
        <div className="mt-6 flex flex-wrap gap-4 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-500"></span> Vencido</div>
            <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-yellow-400"></span> Pendiente</div>
            <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-500"></span> Aprobado / Pagado</div>
        </div>
      </div>

      {/* Details Sidebar */}
      <div className="w-full lg:w-96 bg-white dark:bg-slate-900 border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-slate-800 p-6 flex flex-col shadow-xl z-10 h-[400px] lg:h-auto overflow-hidden">
        <div className="mb-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CalendarIcon size={20} className="text-blue-500" />
                {selectedDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
            </h2>
            {selectedPayments.length > 0 ? (
                <div className="mt-2 text-sm text-slate-500 dark:text-slate-400 flex justify-between items-center">
                    <span>{selectedPayments.length} Eventos</span>
                    <span className="font-bold text-slate-900 dark:text-white">Total: ${totalAmountForDay.toLocaleString()}</span>
                </div>
            ) : (
                <p className="mt-2 text-sm text-slate-400">No hay eventos programados para este día.</p>
            )}
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
            {selectedPayments.map(payment => (
                <div key={payment.id} className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors group">
                    <div className="flex justify-between items-start mb-2">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md ${
                             payment.status === PaymentStatus.OVERDUE ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                             payment.status === PaymentStatus.APPROVED ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                             'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                        }`}>
                            {payment.status}
                        </span>
                        <span className="font-bold text-slate-900 dark:text-white">${payment.amount.toLocaleString()}</span>
                    </div>
                    <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 mb-1">{payment.specificType}</h3>
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <span className="truncate max-w-[150px]">{payment.storeName}</span>
                    </div>
                    {payment.notes && (
                        <div className="mt-3 text-xs bg-white dark:bg-slate-800 p-2 rounded text-slate-500 dark:text-slate-400 italic border border-slate-200 dark:border-slate-700">
                            "{payment.notes}"
                        </div>
                    )}
                </div>
            ))}

            {selectedPayments.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-50">
                    <CheckCircle2 size={48} className="mb-2" />
                    <p className="text-sm">Día libre de impuestos</p>
                </div>
            )}
        </div>

        <button className="mt-6 w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-200 dark:shadow-blue-900/30 transition-all active:scale-[0.99]">
            <Plus size={20} />
            Agendar Pago Manual
        </button>
      </div>
    </div>
  );
};
