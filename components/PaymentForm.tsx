
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
  Calculator,
  MapPin,
  FileText,
  DollarSign,
  Info,
  Loader2,
  Image as ImageIcon,
  Trash2,
  Scan
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
  onSubmit: (data: any) => Promise<void> | void;
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
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Estados de carga
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  const [isFileScanning, setIsFileScanning] = useState(false);

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

  // Clean up preview URL
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
        // Validación de tamaño (5MB = 5 * 1024 * 1024 bytes)
        if (selectedFile.size > 5 * 1024 * 1024) {
            setErrors(prev => ({...prev, file: 'El archivo excede el límite de 5MB.'}));
            setFile(null);
            setPreviewUrl(null);
            return;
        }
        
        // Validación de tipo (Extra check)
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
        if (!allowedTypes.includes(selectedFile.type)) {
             setErrors(prev => ({...prev, file: 'Formato no soportado. Use PDF, JPG o PNG.'}));
             setFile(null);
             setPreviewUrl(null);
             return;
        }

        // Simular escaneo y carga del archivo
        setIsFileScanning(true);
        setFile(null); // Limpiar visualmente mientras carga
        setPreviewUrl(null);
        
        // Simulación de delay (e.g. subida a S3 o escaneo de virus)
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Generate preview if image
        if (selectedFile.type.startsWith('image/')) {
            setPreviewUrl(URL.createObjectURL(selectedFile));
        }

        setFile(selectedFile);
        setIsFileScanning(false);

        setErrors(prev => {
            const newErrs = {...prev};
            delete newErrs.file;
            return newErrs;
        });
    }
  };

  const clearFile = (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      setFile(null);
      setPreviewUrl(null);
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!store) newErrors.store = "La tienda es obligatoria";
    if (!category) newErrors.category = "La categoría es obligatoria";
    
    // Validar subcategorías municipales
    if (category === Category.MUNICIPAL_TAX) {
        if (!muniGroup) newErrors.muniGroup = "Seleccione el grupo fiscal";
        if (!muniItem) newErrors.muniItem = "Seleccione el concepto";
    }

    if (!amount || parseFloat(amount) <= 0) newErrors.amount = "Monto inválido";
    if (!dueDate) newErrors.dueDate = "Fecha requerida";
    if (!paymentDate) newErrors.paymentDate = "Fecha requerida";
    if (!specificType) newErrors.specificType = "Descripción requerida";
    
    // Validación final de archivo
    if (!file && !isFileScanning) {
        newErrors.file = "Comprobante requerido";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    if (isFileScanning) return; // Prevenir envío si el archivo se está procesando

    setIsSubmitting(true);
    
    // Simular proceso de carga en pasos
    setLoadingText('Digitalizando...');
    await new Promise(resolve => setTimeout(resolve, 800));

    setLoadingText('Verificando...');
    await new Promise(resolve => setTimeout(resolve, 800));

    setLoadingText('Guardando...');
    await new Promise(resolve => setTimeout(resolve, 500));

    try {
        await onSubmit({
            storeId: store,
            category,
            amount: parseFloat(amount),
            dueDate,
            paymentDate,
            specificType,
            file,
            notes
        });
    } catch (error) {
        console.error("Error submitting payment:", error);
    } finally {
        setIsSubmitting(false);
        setLoadingText('');
    }
  };

  return (
    <div className="p-6 lg:p-10 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
            <button onClick={onCancel} disabled={isSubmitting} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500 dark:text-slate-400 disabled:opacity-50">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Cargar Nuevo Pago</h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Registre los detalles de la transacción para auditoría.</p>
            </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Section 1: Origen y Clasificación */}
        <section className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6 flex items-center gap-2">
                <MapPin size={16} /> Ubicación y Tipo
            </h2>
            
            <div className="space-y-6">
                {/* Store Selection */}
                <div className="relative">
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Sucursal / Tienda</label>
                    <div className="relative group">
                        <select 
                            value={store}
                            onChange={(e) => setStore(e.target.value)}
                            disabled={isSubmitting}
                            className={`w-full appearance-none bg-slate-50 dark:bg-slate-800 border ${errors.store ? 'border-red-300 ring-1 ring-red-100' : 'border-slate-200 dark:border-slate-700'} text-slate-900 dark:text-white text-sm rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 block p-4 pl-12 transition-all outline-none disabled:bg-slate-100 disabled:dark:bg-slate-900/50 disabled:text-slate-500`}
                        >
                            <option value="">Seleccionar ubicación...</option>
                            {STORES.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                        <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={20} />
                    </div>
                    {errors.store && <p className="text-red-500 text-xs mt-1 ml-1">{errors.store}</p>}
                </div>

                {/* Category Grid */}
                <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Categoría Fiscal</label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {[
                            { id: Category.NATIONAL_TAX, label: 'Impuesto Nacional', icon: Landmark, color: 'blue' },
                            { id: Category.MUNICIPAL_TAX, label: 'Impuesto Municipal', icon: Building2, color: 'indigo' },
                            { id: Category.UTILITY, label: 'Servicio Público', icon: Zap, color: 'yellow' },
                        ].map((cat) => {
                            const Icon = cat.icon;
                            const isSelected = category === cat.id;
                            return (
                                <button
                                    key={cat.id}
                                    type="button"
                                    disabled={isSubmitting}
                                    onClick={() => setCategory(cat.id)}
                                    className={`relative overflow-hidden flex flex-col items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all duration-200 group ${
                                        isSelected 
                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 shadow-md' 
                                        : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:border-blue-200 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                                    } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    <div className={`p-2 rounded-full transition-colors ${isSelected ? 'bg-blue-200 dark:bg-blue-800' : 'bg-slate-100 dark:bg-slate-800 group-hover:bg-white dark:group-hover:bg-slate-700'}`}>
                                        <Icon size={24} className={isSelected ? 'text-blue-700 dark:text-blue-200' : 'text-slate-400 dark:text-slate-500'} />
                                    </div>
                                    <span className="text-sm font-bold">{cat.label}</span>
                                    {isSelected && <div className="absolute top-2 right-2 text-blue-500"><CheckCircle2 size={16} /></div>}
                                </button>
                            )
                        })}
                    </div>
                     {errors.category && <p className="text-red-500 text-xs mt-1 ml-1">{errors.category}</p>}
                </div>
            </div>
        </section>

        {/* Dynamic Municipal Tax Section */}
        {category === Category.MUNICIPAL_TAX && (
            <section className="bg-blue-50 dark:bg-blue-900/10 p-6 rounded-2xl border border-blue-100 dark:border-blue-800 animate-in slide-in-from-top-4 duration-300 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                    <Calculator size={120} />
                </div>
                
                <h3 className="text-blue-800 dark:text-blue-300 font-bold mb-4 flex items-center gap-2 relative z-10">
                    <Calculator size={18} />
                    Desglose Alcaldía
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase ml-1">Rubro / Grupo</label>
                        <div className="relative">
                            <select
                                value={muniGroup}
                                onChange={(e) => {
                                    setMuniGroup(e.target.value);
                                    setMuniItem('');
                                }}
                                disabled={isSubmitting}
                                className={`w-full bg-white dark:bg-slate-900 border ${errors.muniGroup ? 'border-red-300' : 'border-blue-200 dark:border-blue-800'} text-slate-800 dark:text-slate-200 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block p-3 shadow-sm outline-none transition-colors disabled:opacity-50`}
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
                    </div>

                    <div className="space-y-1">
                         <label className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase ml-1">Concepto Específico</label>
                         <div className="relative">
                            <select
                                value={muniItem}
                                onChange={(e) => setMuniItem(e.target.value)}
                                disabled={!muniGroup || isSubmitting}
                                className={`w-full bg-white dark:bg-slate-900 border ${errors.muniItem ? 'border-red-300' : 'border-blue-200 dark:border-blue-800'} text-slate-800 dark:text-slate-200 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block p-3 shadow-sm outline-none disabled:bg-slate-100 disabled:dark:bg-slate-800 disabled:text-slate-400 transition-colors disabled:opacity-50`}
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
                    </div>
                </div>
            </section>
        )}

        {/* Section 2: Detalles Financieros */}
        <section className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
             <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6 flex items-center gap-2">
                <DollarSign size={16} /> Detalles Financieros
            </h2>

            <div className="space-y-6">
                {/* Specific Type */}
                <div>
                     <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Descripción del Pago</label>
                     <div className="relative group">
                        <input
                            type="text"
                            placeholder={category === Category.MUNICIPAL_TAX ? "Se autocompleta con la selección..." : "ej. IVA Octubre, ISLR, Factura Luz #12345"}
                            value={specificType}
                            readOnly={category === Category.MUNICIPAL_TAX || isSubmitting}
                            onChange={(e) => setSpecificType(e.target.value)}
                            className={`bg-slate-50 dark:bg-slate-800 border ${errors.specificType ? 'border-red-300' : 'border-slate-200 dark:border-slate-700'} text-slate-900 dark:text-white text-sm rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 block w-full p-4 pl-12 shadow-sm outline-none transition-all ${category === Category.MUNICIPAL_TAX ? 'opacity-70 cursor-not-allowed' : ''} disabled:opacity-50`}
                        />
                        <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                     </div>
                     {errors.specificType && <p className="text-red-500 text-xs mt-1 ml-1">{errors.specificType}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Amount */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Monto Total</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-500 group-focus-within:text-blue-500 font-bold transition-colors">$</div>
                            <input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={amount}
                                disabled={isSubmitting}
                                onChange={(e) => setAmount(e.target.value)}
                                className={`bg-slate-50 dark:bg-slate-800 border ${errors.amount ? 'border-red-300' : 'border-slate-200 dark:border-slate-700'} text-slate-900 dark:text-white text-sm rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-4 shadow-sm outline-none font-mono font-medium transition-all disabled:opacity-50`}
                            />
                        </div>
                        {errors.amount && <p className="text-red-500 text-xs mt-1 ml-1">{errors.amount}</p>}
                    </div>

                    {/* Due Date */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Fecha Vencimiento</label>
                        <div className="relative group">
                            <input
                                type="date"
                                value={dueDate}
                                disabled={isSubmitting}
                                onChange={(e) => setDueDate(e.target.value)}
                                className={`bg-slate-50 dark:bg-slate-800 border ${errors.dueDate ? 'border-red-300' : 'border-slate-200 dark:border-slate-700'} text-slate-900 dark:text-white text-sm rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 block w-full p-4 pl-12 shadow-sm outline-none transition-all disabled:opacity-50`}
                            />
                            <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                        </div>
                        {errors.dueDate && <p className="text-red-500 text-xs mt-1 ml-1">{errors.dueDate}</p>}
                    </div>

                     {/* Payment Date */}
                     <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Fecha de Pago</label>
                        <div className="relative group">
                            <input
                                type="date"
                                value={paymentDate}
                                disabled={isSubmitting}
                                onChange={(e) => setPaymentDate(e.target.value)}
                                className={`bg-slate-50 dark:bg-slate-800 border ${errors.paymentDate ? 'border-red-300' : 'border-slate-200 dark:border-slate-700'} text-slate-900 dark:text-white text-sm rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 block w-full p-4 pl-12 shadow-sm outline-none transition-all disabled:opacity-50`}
                            />
                            <CheckCircle2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-green-500 transition-colors" size={20} />
                        </div>
                        {errors.paymentDate && <p className="text-red-500 text-xs mt-1 ml-1">{errors.paymentDate}</p>}
                    </div>
                </div>
            </div>
        </section>

        {/* Section 3: Soportes y Notas */}
        <section className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6 flex items-center gap-2">
                <Upload size={16} /> Soportes y Notas
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* File Upload */}
                <div>
                     <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Comprobante / Recibo</label>
                     <label className={`relative flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-2xl transition-all group overflow-hidden ${
                         isSubmitting || isFileScanning ? 'cursor-not-allowed opacity-80' : 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50'
                     } ${
                         file ? 'border-green-400 bg-green-50 dark:bg-green-900/10' : errors.file ? 'border-red-300 bg-red-50 dark:bg-red-900/10' : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800'
                     }`}>
                        
                        {/* Overlay de Carga de Archivo */}
                        {isFileScanning && (
                            <div className="absolute inset-0 z-20 bg-white/80 dark:bg-slate-900/80 flex flex-col items-center justify-center backdrop-blur-sm">
                                <Scan className="w-8 h-8 text-blue-500 animate-pulse mb-2" />
                                <span className="text-xs font-bold text-blue-600 dark:text-blue-400">Escaneando...</span>
                            </div>
                        )}

                        <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4 w-full h-full">
                            {file ? (
                                <div className="relative w-full h-full flex flex-col items-center justify-center group/preview">
                                    {previewUrl ? (
                                        <div className="relative w-full h-full p-2">
                                            <img 
                                                src={previewUrl} 
                                                alt="Preview" 
                                                className="w-full h-full object-contain rounded-lg shadow-sm" 
                                            />
                                            {/* Action Overlay */}
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/preview:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                                                <button 
                                                    onClick={clearFile}
                                                    type="button"
                                                    className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors shadow-lg"
                                                    title="Eliminar archivo"
                                                >
                                                    <Trash2 size={20} />
                                                </button>
                                            </div>
                                            <div className="absolute top-0 right-0 p-1 pointer-events-none">
                                                <div className="bg-green-500 text-white rounded-full p-1 shadow-sm">
                                                    <CheckCircle2 size={16} />
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mb-2">
                                                {file.type === 'application/pdf' ? <FileText size={24} /> : <CheckCircle2 size={24} />}
                                            </div>
                                            <p className="text-sm text-green-700 dark:text-green-400 font-medium truncate w-full px-4">{file.name}</p>
                                            <button 
                                                onClick={clearFile}
                                                type="button"
                                                className="mt-2 text-xs text-red-500 hover:text-red-600 font-bold flex items-center gap-1 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded"
                                            >
                                                <Trash2 size={12} /> Eliminar
                                            </button>
                                        </>
                                    )}
                                    {!previewUrl && (
                                        <p className="text-xs text-green-600 dark:text-green-500 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB - Listo para envío</p>
                                    )}
                                </div>
                            ) : (
                                <>
                                    <div className={`p-3 rounded-full mb-3 transition-colors ${errors.file ? 'bg-red-100 text-red-500' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-500 dark:text-blue-400'}`}>
                                        <Upload size={24} />
                                    </div>
                                    <p className="mb-1 text-sm text-slate-700 dark:text-slate-300 font-medium">Click para subir imagen o PDF</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-500">Máximo 5MB</p>
                                </>
                            )}
                        </div>
                        <input 
                            type="file" 
                            className="hidden" 
                            accept=".pdf,.jpg,.jpeg,.png" 
                            onChange={handleFileChange} 
                            disabled={isSubmitting || isFileScanning}
                        />
                    </label>
                    {errors.file && <p className="text-red-500 text-xs mt-1 ml-1">{errors.file}</p>}
                </div>

                {/* Notes */}
                <div className="flex flex-col">
                     <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Observaciones</label>
                     <div className="relative h-full">
                         <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            disabled={isSubmitting}
                            placeholder="Añada notas adicionales para el auditor..."
                            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 block w-full h-40 p-4 shadow-sm outline-none resize-none transition-all disabled:opacity-50"
                         ></textarea>
                     </div>
                </div>
            </div>
        </section>

        {Object.keys(errors).length > 0 && (
            <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl border border-red-100 dark:border-red-900/30 animate-in slide-in-from-bottom-2">
                <AlertCircle size={20} className="shrink-0" />
                <span className="text-sm font-medium">Hay campos requeridos incompletos o errores. Por favor revise el formulario.</span>
            </div>
        )}

        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col-reverse md:flex-row gap-4">
            <button 
                type="button"
                onClick={onCancel}
                disabled={isSubmitting || isFileScanning}
                className="w-full md:w-auto px-8 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
            >
                Cancelar
            </button>
            <button 
                type="submit"
                disabled={isSubmitting || isFileScanning}
                className={`w-full md:flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-200 dark:shadow-blue-900/30 transition-all active:scale-[0.99] flex items-center justify-center gap-2 ${isSubmitting || isFileScanning ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
                {isSubmitting ? (
                    <>
                        <Loader2 size={20} className="animate-spin" />
                        <span>{loadingText || 'Procesando...'}</span>
                    </>
                ) : isFileScanning ? (
                    <>
                         <Loader2 size={20} className="animate-spin" />
                         <span>Escaneando archivo...</span>
                    </>
                ) : (
                    <>
                        <span>Enviar a Auditoría</span>
                        <CheckCircle2 size={20} />
                    </>
                )}
            </button>
        </div>
      </form>
    </div>
  );
};
