
import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Calendar as CalendarIcon, 
  CheckCircle2, 
  Landmark, 
  AlertOctagon,
  FileText,
  Target,
  X,
  DollarSign,
  Tag
} from 'lucide-react';
import { Payment, PaymentStatus, Category } from '../types';

interface CalendarViewProps {
  payments: Payment[];
}

// Definición de Obligación Estatutaria (Basada en el cuadro)
interface StatutoryDeadline {
  id: string;
  day: number | 'end'; // Día específico o fin de mes
  month?: number; // Si es anual, el índice del mes (0 = Enero)
  title: string;
  category: Category;
  description: string;
  frequency: 'Mensual' | 'Anual' | 'Bi-anual';
}

// Definición de Entrada de Presupuesto Manual
interface BudgetEntry {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  amount: number;
  category: Category;
  notes?: string;
}

// Configuración de Reglas Fiscales (Alcaldía)
const TAX_RULES: StatutoryDeadline[] = [
  {
    id: 'rule-decl-patente',
    day: 5,
    title: 'Límite Declaración Ventas',
    category: Category.MUNICIPAL_TAX,
    description: 'Declarar antes del 5to día (Patente 1.1.2 - 1.1.7)',
    frequency: 'Mensual'
  },
  {
    id: 'rule-pago-patente',
    day: 19,
    title: 'Vencimiento Pago Patente',
    category: Category.MUNICIPAL_TAX,
    description: 'Pago mensual códigos 1.1.2 al 1.1.7',
    frequency: 'Mensual'
  },
  {
    id: 'rule-aseo',
    day: 'end', // Fin de mes
    title: 'IMA Aseo Urbano (1.3)',
    category: Category.UTILITY,
    description: 'Pago mensual tarifa aseo',
    frequency: 'Mensual'
  },
  // Anuales (Asumiremos Marzo como mes fiscal común para anuales, ajustable)
  {
    id: 'rule-anual-visto-bueno',
    day: 31,
    month: 2, // Marzo
    title: 'Visto Bueno (1.2) & Bomberos (1.7)',
    category: Category.MUNICIPAL_TAX,
    description: 'Renovación anual de permisos y tasas',
    frequency: 'Anual'
  },
  {
    id: 'rule-anual-inmueble',
    day: 31,
    month: 2, // Marzo
    title: 'Impuesto Inmobiliario (1.5)',
    category: Category.MUNICIPAL_TAX,
    description: 'Pago anual impuesto inmueble',
    frequency: 'Anual'
  },
  {
    id: 'rule-anual-pub',
    day: 31,
    month: 2, // Marzo
    title: 'Publicidad (1.6)',
    category: Category.MUNICIPAL_TAX,
    description: 'Pago anual derechos publicidad',
    frequency: 'Anual'
  }
];

export const CalendarView: React.FC<CalendarViewProps> = ({ payments }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  // Estado para Presupuestos Manuales (Simulado localmente)
  const [budgets, setBudgets] = useState<BudgetEntry[]>([]);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  
  // Formulario de presupuesto
  const [newBudget, setNewBudget] = useState<{
    title: string;
    amount: string;
    category: Category;
  }>({ title: '', amount: '', category: Category.MUNICIPAL_TAX });

  // Estado combinado para la vista lateral
  const [dayEvents, setDayEvents] = useState<{
    realPayments: Payment[];
    deadlines: StatutoryDeadline[];
    budgets: BudgetEntry[];
  }>({ realPayments: [], deadlines: [], budgets: [] });

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

  // Obtener obligaciones para un día específico
  const getDeadlinesForDate = (date: Date): StatutoryDeadline[] => {
    const day = date.getDate();
    const month = date.getMonth();
    const lastDayOfMonth = getDaysInMonth(date);

    return TAX_RULES.filter(rule => {
      // Chequeo de mes (si es anual)
      if (rule.month !== undefined && rule.month !== month) return false;

      // Chequeo de día
      if (rule.day === 'end') {
        return day === lastDayOfMonth;
      }
      return rule.day === day;
    });
  };

  // Efecto para actualizar el panel lateral al cambiar fecha
  useEffect(() => {
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    const localDateString = `${year}-${month}-${day}`;

    const real = payments.filter(p => p.dueDate === localDateString);
    const statutory = getDeadlinesForDate(selectedDate);
    const dayBudgets = budgets.filter(b => b.date === localDateString);

    setDayEvents({ realPayments: real, deadlines: statutory, budgets: dayBudgets });
  }, [selectedDate, payments, budgets]);

  // Manejo de creación de presupuesto
  const handleAddBudget = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBudget.title || !newBudget.amount) return;

    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    const entry: BudgetEntry = {
        id: Math.random().toString(36).substr(2, 9),
        date: dateStr,
        title: newBudget.title,
        amount: parseFloat(newBudget.amount),
        category: newBudget.category
    };

    setBudgets([...budgets, entry]);
    setIsBudgetModalOpen(false);
    setNewBudget({ title: '', amount: '', category: Category.MUNICIPAL_TAX }); // Reset
  };

  const handleDeleteBudget = (id: string) => {
      setBudgets(budgets.filter(b => b.id !== id));
  };

  // Generación de Grid
  const renderCalendarDays = () => {
    const totalDays = getDaysInMonth(currentDate);
    const startDay = getFirstDayOfMonth(currentDate);
    const days = [];

    // Padding para días vacíos al inicio
    for (let i = 0; i < startDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-24 bg-transparent border-b border-r border-slate-100 dark:border-slate-800/50"></div>);
    }

    // Días del mes
    for (let day = 1; day <= totalDays; day++) {
      const currentDayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const dayString = `${currentDayDate.getFullYear()}-${String(currentDayDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      
      const isSelected = selectedDate.toDateString() === currentDayDate.toDateString();
      const isToday = new Date().toDateString() === currentDayDate.toDateString();
      
      // Buscar datos
      const dayPayments = payments.filter(p => p.dueDate === dayString);
      const dayDeadlines = getDeadlinesForDate(currentDayDate);
      const dayBudgets = budgets.filter(b => b.date === dayString);
      
      const hasOverdue = dayPayments.some(p => p.status === PaymentStatus.OVERDUE);
      const hasPending = dayPayments.some(p => p.status === PaymentStatus.PENDING);
      
      days.push(
        <div 
          key={day}
          onClick={() => setSelectedDate(currentDayDate)}
          className={`relative h-24 sm:h-28 border-b border-r border-slate-100 dark:border-slate-800 p-2 transition-all cursor-pointer group hover:bg-slate-50 dark:hover:bg-slate-800/50 flex flex-col justify-between ${
            isSelected ? 'bg-blue-50 dark:bg-blue-900/10' : 'bg-white dark:bg-slate-900'
          }`}
        >
          <div className="flex justify-between items-start">
            <span className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full transition-colors ${
              isToday 
                ? 'bg-blue-600 text-white' 
                : isSelected 
                  ? 'text-blue-600 dark:text-blue-400 font-bold bg-blue-100 dark:bg-blue-900/50' 
                  : 'text-slate-700 dark:text-slate-300'
            }`}>
              {day}
            </span>
          </div>

          {/* Indicadores Visuales */}
          <div className="flex flex-col gap-1 mt-1">
             {/* Indicadores de Pagos Reales & Presupuestos */}
            <div className="flex gap-1 flex-wrap">
                {hasOverdue && <div className="w-2 h-2 rounded-full bg-red-500" title="Pago Vencido"></div>}
                {hasPending && <div className="w-2 h-2 rounded-full bg-orange-400" title="Pago Pendiente"></div>}
                {dayPayments.some(p => p.status === PaymentStatus.APPROVED) && !hasOverdue && !hasPending && 
                    <div className="w-2 h-2 rounded-full bg-green-500" title="Pagado"></div>
                }
                {dayBudgets.length > 0 && <div className="w-2 h-2 rounded-full bg-cyan-400" title="Presupuesto Asignado"></div>}
            </div>

            {/* Indicadores de Reglas Fiscales (Alcaldía) */}
            {dayDeadlines.map((rule, idx) => (
                <div key={idx} className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-[10px] px-1.5 py-0.5 rounded truncate font-medium border border-purple-200 dark:border-purple-800/50 flex items-center gap-1">
                    <Landmark size={8} />
                    {rule.title}
                </div>
            ))}
            
            {/* Texto de presupuesto si existe y no hay reglas que ocupen espacio */}
            {dayBudgets.length > 0 && dayDeadlines.length === 0 && (
                 <div className="text-[10px] text-cyan-600 dark:text-cyan-400 truncate font-medium px-1">
                    ${dayBudgets.reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()} (P)
                 </div>
            )}
          </div>
        </div>
      );
    }
    return days;
  };

  const totalAmountForDay = dayEvents.realPayments.reduce((acc, curr) => acc + curr.amount, 0);
  const totalBudgetForDay = dayEvents.budgets.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="flex flex-col lg:flex-row h-full bg-slate-50 dark:bg-slate-950 transition-colors duration-300 relative">
      
      {/* Budget Modal */}
      {isBudgetModalOpen && (
          <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl p-6 border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <Target className="text-cyan-500" />
                          Nuevo Presupuesto
                      </h3>
                      <button onClick={() => setIsBudgetModalOpen(false)} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
                          <X size={20} />
                      </button>
                  </div>
                  
                  <form onSubmit={handleAddBudget} className="space-y-4">
                      <div>
                          <label className="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-1">Fecha Seleccionada</label>
                          <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-800 dark:text-slate-200 text-sm font-medium flex items-center gap-2">
                              <CalendarIcon size={16} />
                              {selectedDate.toLocaleDateString()}
                          </div>
                      </div>
                      
                      <div>
                          <label className="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-1">Categoría</label>
                          <div className="relative">
                            <select 
                                value={newBudget.category}
                                onChange={(e) => setNewBudget({...newBudget, category: e.target.value as Category})}
                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-cyan-500 dark:text-white appearance-none"
                            >
                                {Object.values(Category).map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                            <Tag className="absolute right-3 top-3.5 text-slate-400 pointer-events-none" size={16} />
                          </div>
                      </div>

                      <div>
                          <label className="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-1">Concepto / Título</label>
                          <input 
                              type="text" 
                              placeholder="Ej. Provisión Impuesto ISLR"
                              value={newBudget.title}
                              onChange={(e) => setNewBudget({...newBudget, title: e.target.value})}
                              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-cyan-500 dark:text-white"
                              autoFocus
                          />
                      </div>

                      <div>
                          <label className="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-1">Monto Estimado</label>
                          <div className="relative">
                              <input 
                                  type="number" 
                                  placeholder="0.00"
                                  value={newBudget.amount}
                                  onChange={(e) => setNewBudget({...newBudget, amount: e.target.value})}
                                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 pl-10 text-sm outline-none focus:ring-2 focus:ring-cyan-500 dark:text-white"
                              />
                              <DollarSign className="absolute left-3 top-3 text-slate-400" size={16} />
                          </div>
                      </div>

                      <div className="pt-4 flex gap-3">
                          <button type="button" onClick={() => setIsBudgetModalOpen(false)} className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 transition-colors">Cancelar</button>
                          <button type="submit" className="flex-1 py-3 bg-cyan-600 text-white font-bold rounded-xl hover:bg-cyan-700 transition-colors shadow-lg shadow-cyan-200 dark:shadow-cyan-900/30">Guardar</button>
                      </div>
                  </form>
              </div>
          </div>
      )}

      {/* Calendar Grid Section */}
      <div className="flex-1 p-4 lg:p-8 flex flex-col h-full overflow-y-auto no-scrollbar">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Calendario Fiscal</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Cronograma de obligaciones, pagos y presupuestos.</p>
          </div>
          <div className="flex items-center gap-4 bg-white dark:bg-slate-900 p-1.5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 self-end sm:self-auto">
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

        {/* Calendar Grid Container */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col flex-1">
            {/* Days Header */}
            <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
            {daysOfWeek.map(d => (
                <div key={d} className="text-center text-xs font-bold text-slate-500 dark:text-slate-400 py-3">
                {d}
                </div>
            ))}
            </div>

            {/* Calendar Cells */}
            <div className="grid grid-cols-7 auto-rows-fr flex-1">
            {renderCalendarDays()}
            </div>
        </div>
        
        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-500 dark:text-slate-400 px-2">
            <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-500"></span> Pago Vencido</div>
            <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-orange-400"></span> Pago Pendiente</div>
            <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-purple-500"></span> Obligación Alcaldía</div>
            <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-cyan-400"></span> Presupuesto</div>
        </div>
      </div>

      {/* Details Sidebar */}
      <div className="w-full lg:w-96 bg-white dark:bg-slate-900 border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-slate-800 p-6 flex flex-col shadow-xl z-10 h-[500px] lg:h-auto overflow-hidden">
        <div className="mb-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CalendarIcon size={20} className="text-blue-500" />
                {selectedDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {dayEvents.realPayments.length + dayEvents.deadlines.length + dayEvents.budgets.length} Eventos para hoy
            </p>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
            
            {/* Sección de Obligaciones Estatutarias */}
            {dayEvents.deadlines.length > 0 && (
                <div className="space-y-3">
                    <h3 className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider flex items-center gap-2">
                        <Landmark size={12} /> Recordatorios Alcaldía
                    </h3>
                    {dayEvents.deadlines.map((rule, idx) => (
                        <div key={idx} className="p-4 rounded-xl border border-purple-100 dark:border-purple-900/30 bg-purple-50 dark:bg-purple-900/10">
                            <div className="flex justify-between items-start mb-1">
                                <span className="text-purple-700 dark:text-purple-300 font-bold text-sm">{rule.title}</span>
                                <span className="text-[10px] bg-purple-200 dark:bg-purple-800 text-purple-800 dark:text-purple-200 px-2 py-0.5 rounded-full">{rule.frequency}</span>
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-400">{rule.description}</p>
                            <div className="mt-2 flex items-center gap-1 text-[10px] text-purple-600 dark:text-purple-400 font-medium">
                                <AlertOctagon size={10} />
                                Fecha Límite Estricta
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Separador */}
            {dayEvents.deadlines.length > 0 && (dayEvents.realPayments.length > 0 || dayEvents.budgets.length > 0) && (
                <div className="border-t border-slate-100 dark:border-slate-800 my-2"></div>
            )}
            
            {/* Sección de Presupuestos Manuales */}
            {dayEvents.budgets.length > 0 && (
                <div className="space-y-3">
                    <h3 className="text-xs font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                        <Target size={12} /> Presupuestos Asignados
                    </h3>
                    {dayEvents.budgets.map((budget) => (
                        <div key={budget.id} className="p-4 rounded-xl border border-cyan-100 dark:border-cyan-900/30 bg-cyan-50 dark:bg-cyan-900/10 group relative">
                            <button 
                                onClick={() => handleDeleteBudget(budget.id)}
                                className="absolute top-2 right-2 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <X size={14} />
                            </button>
                            <div className="flex justify-between items-start mb-1 pr-4">
                                <span className="text-cyan-800 dark:text-cyan-200 font-bold text-sm">{budget.title}</span>
                            </div>
                            <p className="text-xs text-cyan-600 dark:text-cyan-400 mb-2">{budget.category}</p>
                            <div className="font-mono text-lg font-bold text-cyan-700 dark:text-cyan-300">
                                ${budget.amount.toLocaleString()}
                            </div>
                        </div>
                    ))}
                    <div className="text-right text-xs font-bold text-cyan-700 dark:text-cyan-400">
                        Total Presupuestado: ${totalBudgetForDay.toLocaleString()}
                    </div>
                </div>
            )}

            {/* Separador */}
            {dayEvents.budgets.length > 0 && dayEvents.realPayments.length > 0 && (
                <div className="border-t border-slate-100 dark:border-slate-800 my-2"></div>
            )}

            {/* Sección de Pagos Reales */}
            {dayEvents.realPayments.length > 0 && (
                 <div className="space-y-3">
                    <h3 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-2">
                        <FileText size={12} /> Pagos Ejecutados
                    </h3>
                    {dayEvents.realPayments.map(payment => (
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
                        </div>
                    ))}
                    <div className="text-right text-sm font-bold text-slate-900 dark:text-white pt-2">
                        Total Ejecutado: ${totalAmountForDay.toLocaleString()}
                    </div>
                 </div>
            )}

            {dayEvents.realPayments.length === 0 && dayEvents.deadlines.length === 0 && dayEvents.budgets.length === 0 && (
                <div className="h-40 flex flex-col items-center justify-center text-slate-400 opacity-50">
                    <CheckCircle2 size={48} className="mb-2" />
                    <p className="text-sm">Sin eventos ni presupuestos</p>
                </div>
            )}
        </div>

        <button 
            onClick={() => setIsBudgetModalOpen(true)}
            className="mt-6 w-full py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-cyan-200 dark:shadow-cyan-900/30 transition-all active:scale-[0.99]"
        >
            <Plus size={20} />
            Cargar Presupuesto
        </button>
      </div>
    </div>
  );
};
