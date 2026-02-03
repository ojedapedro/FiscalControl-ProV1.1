
import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Landmark, 
  Zap, 
  Upload, 
  Calendar as CalendarIcon, 
  ChevronDown, 
  CheckCircle2,
  AlertCircle,
  Calculator
} from 'lucide-react';
import { Category } from '../types';
import { STORES } from '../constants';

// Configuración de Impuestos Municipales basada en la imagen de la Alcaldía
const MUNICIPAL_TAX_CONFIG: Record<string, { label: string; items: { code: string; name: string; amount?: number; isVariable?: boolean }[] }> = {
  'PATENTE': {
    label: '1.1 PATENTE',
    items: [
      { code: '1.1.1', name: 'RENOVACION DE PATENTE', amount: 150.00 },
      { code: '1.1.2', name: 'CODIGO 1 AL MAYOR DE PINTURA', amount: 20.00 },
      { code: '1.1.3', name: 'CODIGO 2 AL DETAL DE PINTURA', amount: 20.00 },
      { code: '1.1.4', name: 'CODIGO 3 AL MAYOR DE FERRETERIA', amount: 20.00 },
      { code: '1.1.5', name: 'CODIGO 4 AL DETAL DE FERRETERIA', amount: 20.00 },
      { code: '1.1.6', name: 'CODIGO 5 SERVICIOS OBRAS', amount: 20.00 },
      { code: '1.1.7', name: 'PORCENTAJE DE VENTAS TOTALES', isVariable: true },
    ]
  },
  'VISTO_BUENO': {
    label: '1.2 VISTO BUENO',
    items: [
      { code: '1.2.1', name: 'INVEPINCA (TRAMITE)', amount: 150.00 }
    ]
  },
  'IMA': {
    label: '1.3 IMA (ASEO URBANO)',
    items: [
      { code: '1.3.1', name: 'INVEPINCA (TARIFA ASEO)', amount: 50.00 }
    ]
  },
  'CATASTRO': {
    label: '1.4 CEDULA CATASTRAL',
    items: [
      { code: '1.4.1', name: 'INVEPINCA (CATASTRO)', amount: 150.00 }
    ]
  },
  'INMOBILIARIO': {
    label: '1.5 IMPUESTO INMOBILIARIO',
    items: [
      { code: '1.5.1', name: 'INVEPINCA (INMUEBLE)', amount: 400.00 }
    ]
  },
  'PUBLICIDAD': {
    label: '1.6 PUBLICIDAD',
    items: [
      { code: '1.6.1', name: 'PUBLICIDAD SUCURSAL 1', amount: 100.00 },
      { code: '1.6.2', name: 'PUBLICIDAD SUCURSAL 2', amount: 100.00 }
    ]
  },
  'BOMBEROS': {
    label: '1.7 BOMBEROS',
    items: [
      { code: '1.7.1', name: 'PLAN DE EMERGENCIA', amount: 50.00 },
      { code: '1.7.2', name: 'PAGO DE ARANCELES PLAN', amount: 120.00 },
      { code: '1.7.3', name: 'EXTINTORES', amount: 350.00 },
      { code: '1.7.4', name: 'CONTRATO DE MANTENIMIENTO', amount: 100.00 },
      { code: '1.7.5', name: 'PAGO DE ARANCELES USO CONFORME', amount: 80.00 },
      { code: '1.7.6', name: 'USO CONFORME', amount: 0.00 },
    ]
  }
};

interface PaymentFormProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

export const PaymentForm: React.FC<PaymentFormProps> = ({ onSubmit, onCancel }) => {
  const [store, setStore] = useState('');
  const [category, setCategory] = useState<Category | ''>('');
  
  // States for Municipal Tax Logic
  const [muniGroup, setMuniGroup] = useState('');
  const [muniItem, setMuniItem] = useState('');

  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [specificType, setSpecificType] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-fill logic based on municipal selection
  useEffect(() => {
    if (category === Category.MUNICIPAL_TAX && muniGroup && muniItem) {
      const groupData = MUNICIPAL_TAX_CONFIG[muniGroup];
      const itemData = groupData?.items.find(i => i.code === muniItem);
      
      if (itemData) {
        setSpecificType(`${itemData.code} - ${itemData.name}`);
        if (itemData.amount !== undefined && !itemData.isVariable) {
          setAmount(itemData.amount.toString());
        } else if (itemData.isVariable) {
           setAmount(''); // Reset for manual input
        }
      }
    } else if (category !== Category.MUNICIPAL_TAX) {
        // Reset sub-selections if category changes
        setMuniGroup('');
        setMuniItem('');
    }
  }, [category, muniGroup, muniItem]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!store) newErrors.store = "La tienda es obligatoria";
    if (!category) newErrors.category = "La categoría es obligatoria";
    
    // Validar subcategorías municipales
    if (category === Category.MUNICIPAL_TAX) {
        if (!muniGroup) newErrors.muniGroup = "Seleccione el grupo fiscal (ej. Patente)";
        if (!muniItem) newErrors.muniItem = "Seleccione el concepto específico";
    }

    if (!amount || parseFloat(amount) <= 0) newErrors.amount = "Se requiere un monto válido";
    if (!dueDate) newErrors.dueDate = "La fecha de vencimiento es obligatoria";
    if (!paymentDate) newErrors.paymentDate = "La fecha de pago es obligatoria";
    if (!specificType) newErrors.specificType = "La descripción del tipo es obligatoria";
    if (!file) newErrors.file = "El comprobante de pago (recibo) es obligatorio";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    
    // Simular retraso de API
    await new Promise(resolve => setTimeout(resolve, 1000));

    onSubmit({
      storeId: store,
      category,
      amount: parseFloat(amount),
      dueDate,
      paymentDate,
      specificType,
      file,
      notes
    });
    setIsSubmitting(false);
  };

  return (
    <div className="p-6 lg:p-10 max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onCancel} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <div>
            <h1 className="text-2xl font-bold text-slate-900">Cargar Pago</h1>
            <p className="text-slate-500 text-sm">Módulo de Ingreso de Administrador</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Store Selection */}
        <div className="space-y-2">
            <div className="flex justify-between">
                <label className="text-sm font-semibold text-slate-900">Seleccionar Tienda</label>
                {errors.store && <span className="text-red-500 text-xs font-medium">{errors.store}</span>}
            </div>
            <div className="relative">
                <select 
                    value={store}
                    onChange={(e) => setStore(e.target.value)}
                    className={`w-full appearance-none bg-white border ${errors.store ? 'border-red-300 ring-1 ring-red-100' : 'border-slate-200'} text-slate-900 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block p-4 shadow-sm outline-none transition-all`}
                >
                    <option value="">Elegir ubicación</option>
                    {STORES.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                    <ChevronDown size={20} />
                </div>
            </div>
        </div>

        {/* Categories */}
        <div className="space-y-3">
          <div className="flex justify-between">
            <label className="text-sm font-semibold text-slate-900">Categoría de Pago</label>
            {errors.category && <span className="text-red-500 text-xs font-medium">{errors.category}</span>}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
                { id: Category.NATIONAL_TAX, label: 'Impuesto Nacional', icon: Landmark },
                { id: Category.MUNICIPAL_TAX, label: 'Impuesto Municipal', icon: Building2 },
                { id: Category.UTILITY, label: 'Servicio Público', icon: Zap },
            ].map((cat) => {
                const Icon = cat.icon;
                const isSelected = category === cat.id;
                return (
                    <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCategory(cat.id)}
                        className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${
                            isSelected 
                            ? 'border-blue-600 bg-blue-50 text-blue-700' 
                            : 'border-slate-100 bg-white hover:border-blue-100 hover:bg-slate-50'
                        }`}
                    >
                        <Icon size={24} className={isSelected ? 'text-blue-600' : 'text-slate-400'} />
                        <span className="text-sm font-medium">{cat.label}</span>
                    </button>
                )
            })}
          </div>
        </div>

        {/* Dynamic Municipal Tax Section */}
        {category === Category.MUNICIPAL_TAX && (
            <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100 space-y-4 animate-in slide-in-from-top-2">
                <div className="flex items-center gap-2 text-blue-800 font-bold mb-1">
                    <Calculator size={18} />
                    <h3>Desglose Alcaldía</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Municipal Group (1.1, 1.2, etc.) */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-blue-700 uppercase">Rubro / Grupo</label>
                        <div className="relative">
                            <select
                                value={muniGroup}
                                onChange={(e) => {
                                    setMuniGroup(e.target.value);
                                    setMuniItem(''); // Reset item when group changes
                                }}
                                className={`w-full bg-white border ${errors.muniGroup ? 'border-red-300' : 'border-blue-200'} text-slate-800 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block p-3 shadow-sm outline-none`}
                            >
                                <option value="">Seleccione Rubro...</option>
                                {Object.entries(MUNICIPAL_TAX_CONFIG).map(([key, config]) => (
                                    <option key={key} value={key}>{config.label}</option>
                                ))}
                            </select>
                             <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                                <ChevronDown size={16} />
                            </div>
                        </div>
                        {errors.muniGroup && <p className="text-red-500 text-xs">{errors.muniGroup}</p>}
                    </div>

                    {/* Municipal Item (1.1.1, 1.1.2, etc.) */}
                    <div className="space-y-2">
                         <label className="text-xs font-bold text-blue-700 uppercase">Concepto Específico</label>
                         <div className="relative">
                            <select
                                value={muniItem}
                                onChange={(e) => setMuniItem(e.target.value)}
                                disabled={!muniGroup}
                                className={`w-full bg-white border ${errors.muniItem ? 'border-red-300' : 'border-blue-200'} text-slate-800 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block p-3 shadow-sm outline-none disabled:bg-slate-100 disabled:text-slate-400`}
                            >
                                <option value="">Seleccione Concepto...</option>
                                {muniGroup && MUNICIPAL_TAX_CONFIG[muniGroup].items.map((item) => (
                                    <option key={item.code} value={item.code}>
                                        {item.code} - {item.name} {item.amount ? `($${item.amount})` : ''}
                                    </option>
                                ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                                <ChevronDown size={16} />
                            </div>
                        </div>
                         {errors.muniItem && <p className="text-red-500 text-xs">{errors.muniItem}</p>}
                    </div>
                </div>
            </div>
        )}

        {/* Specific Type (Read-only for Municipal, Editable for others) */}
        <div className="space-y-2">
             <div className="flex justify-between">
                <label className="text-sm font-semibold text-slate-900">Descripción Final</label>
                {errors.specificType && <span className="text-red-500 text-xs font-medium">{errors.specificType}</span>}
             </div>
             <input
                type="text"
                placeholder={category === Category.MUNICIPAL_TAX ? "Se autocompleta con la selección..." : "ej. IVA Octubre, ISLR, Factura Luz"}
                value={specificType}
                readOnly={category === Category.MUNICIPAL_TAX}
                onChange={(e) => setSpecificType(e.target.value)}
                className={`bg-white border ${errors.specificType ? 'border-red-300' : 'border-slate-200'} text-slate-900 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block w-full p-4 shadow-sm outline-none ${category === Category.MUNICIPAL_TAX ? 'bg-slate-50 text-slate-600' : ''}`}
             />
        </div>

        {/* Amount & Dates */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-900">Monto</label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-500 font-bold">$</div>
                    <input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className={`bg-white border ${errors.amount ? 'border-red-300' : 'border-slate-200'} text-slate-900 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-4 shadow-sm outline-none font-mono`}
                    />
                </div>
            </div>
            <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-900">Fecha de Vencimiento</label>
                <div className="relative">
                    <input
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        className={`bg-white border ${errors.dueDate ? 'border-red-300' : 'border-slate-200'} text-slate-900 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block w-full p-4 shadow-sm outline-none`}
                    />
                    <CalendarIcon className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={20} />
                </div>
            </div>
             <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-900">Fecha de Pago</label>
                <div className="relative">
                    <input
                        type="date"
                        value={paymentDate}
                        onChange={(e) => setPaymentDate(e.target.value)}
                        className={`bg-white border ${errors.paymentDate ? 'border-red-300' : 'border-slate-200'} text-slate-900 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block w-full p-4 shadow-sm outline-none`}
                    />
                    <CalendarIcon className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={20} />
                </div>
            </div>
        </div>

        {/* File Upload */}
        <div className="space-y-2">
            <div className="flex justify-between">
                <label className="text-sm font-semibold text-slate-900">Comprobante de Pago</label>
                {errors.file && <span className="text-red-500 text-xs font-medium">{errors.file}</span>}
            </div>
            <div className="flex items-center justify-center w-full">
                <label className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-2xl cursor-pointer hover:bg-slate-50 transition-colors ${file ? 'border-green-400 bg-green-50' : errors.file ? 'border-red-300 bg-red-50' : 'border-slate-300 bg-slate-50'}`}>
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        {file ? (
                            <>
                                <CheckCircle2 className="w-10 h-10 text-green-500 mb-3" />
                                <p className="text-sm text-green-700 font-medium">{file.name}</p>
                                <p className="text-xs text-green-600">{(file.size / 1024 / 1024).toFixed(2)} MB - Clic para cambiar</p>
                            </>
                        ) : (
                            <>
                                <div className="p-3 bg-blue-100 rounded-full mb-3 text-blue-500">
                                    <Upload size={24} />
                                </div>
                                <p className="mb-2 text-sm text-slate-700"><span className="font-semibold">Clic para subir recibo</span></p>
                                <p className="text-xs text-slate-500">PDF, JPG o PNG (máx. 5MB)</p>
                            </>
                        )}
                    </div>
                    <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                </label>
            </div>
        </div>

        {/* Notes */}
        <div className="space-y-2">
             <label className="text-sm font-semibold text-slate-400">Notas (Opcional)</label>
             <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Añadir detalles para el auditor..."
                className="bg-white border border-slate-200 text-slate-900 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block w-full p-4 shadow-sm outline-none resize-none"
             ></textarea>
        </div>

        {Object.keys(errors).length > 0 && (
            <div className="flex items-center gap-2 p-4 bg-red-50 text-red-600 rounded-xl">
                <AlertCircle size={20} />
                <span className="text-sm font-medium">Por favor corrija los errores anteriores antes de enviar.</span>
            </div>
        )}

        <button 
            type="submit"
            disabled={isSubmitting}
            className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-200 transition-all active:scale-[0.99] flex items-center justify-center gap-2 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
        >
            {isSubmitting ? (
                <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Guardando Pago...
                </>
            ) : (
                'Enviar a Auditoría'
            )}
        </button>
      </form>
    </div>
  );
};
