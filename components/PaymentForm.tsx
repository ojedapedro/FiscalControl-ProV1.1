
import React, { useState, useEffect, useMemo } from 'react';
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
  Loader2,
  Trash2,
  Scan,
  X,
  AlertTriangle,
  Clock,
  FileWarning
} from 'lucide-react';
import { Category, Payment, PaymentStatus } from '../types';
import { STORES } from '../constants';
import VenezuelaMap from './VenezuelaMap';

// Configuración de Impuestos Municipales basada en la imagen de la Alcaldía
const MUNICIPAL_TAX_CONFIG: Record<string, { label: string; deadlineDay: number; items: { code: string; name: string; amount?: number; isVariable?: boolean }[] }> = {
  'PATENTE': {
    label: '1.1 PATENTE DE INDUSTRIA',
    deadlineDay: 15, // Vence el 15
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
    label: '1.2 VISTO BUENO AMBIENTAL',
    deadlineDay: 30, // Fin de mes
    items: [
      { code: '1.2.1', name: 'INVEPINCA (TRAMITE)', amount: 150.00 }
    ]
  },
  'IMA': {
    label: '1.3 IMA (ASEO URBANO)',
    deadlineDay: 25, // Vence el 25
    items: [
      { code: '1.3.1', name: 'INVEPINCA (TARIFA ASEO)', amount: 50.00 }
    ]
  },
  'CATASTRO': {
    label: '1.4 CEDULA CATASTRAL',
    deadlineDay: 30,
    items: [
      { code: '1.4.1', name: 'INVEPINCA (CATASTRO)', amount: 150.00 }
    ]
  },
  'INMOBILIARIO': {
    label: '1.5 IMPUESTO INMOBILIARIO',
    deadlineDay: 30,
    items: [
      { code: '1.5.1', name: 'INVEPINCA (INMUEBLE)', amount: 400.00 }
    ]
  },
  'PUBLICIDAD': {
    label: '1.6 PUBLICIDAD Y PROPAGANDA',
    deadlineDay: 20, // Vence el 20
    items: [
      { code: '1.6.1', name: 'PUBLICIDAD SUCURSAL 1', amount: 100.00 },
      { code: '1.6.2', name: 'PUBLICIDAD SUCURSAL 2', amount: 100.00 }
    ]
  },
  'BOMBEROS': {
    label: '1.7 CUERPO DE BOMBEROS',
    deadlineDay: 28,
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

const NATIONAL_TAX_CONFIG: Record<string, { label: string; deadlineDay: number; items: { code: string; name: string; amount?: number; isVariable?: boolean }[] }> = {
  'IVA': {
    label: '2.1 IVA (IMPUESTO AL VALOR AGREGADO)',
    deadlineDay: 15,
    items: [
      { code: '2.1.1', name: 'IVA MENSUAL - REGULAR', isVariable: true },
      { code: '2.1.2', name: 'RETENCIONES DE IVA', isVariable: true },
    ]
  },
  'ISLR': {
    label: '2.2 ISLR (IMPUESTO SOBRE LA RENTA)',
    deadlineDay: 10,
    items: [
      { code: '2.2.1', name: 'RETENCIONES ISLR - SERVICIOS', isVariable: true },
      { code: '2.2.2', name: 'RETENCIONES ISLR - ALQUILERES', isVariable: true },
      { code: '2.2.3', name: 'DECLARACION ESTIMADA ISLR', isVariable: true },
      { code: '2.2.4', name: 'DECLARACION DEFINITIVA ANUAL', isVariable: true },
    ]
  },
  'IGTF': {
    label: '2.3 IGTF (GRANDES TRANSACCIONES)',
    deadlineDay: 15,
    items: [
      { code: '2.3.1', name: 'IGTF - PAGO QUINCENAL', isVariable: true }
    ]
  },
  'OTROS_NACIONALES': {
    label: '2.4 OTROS IMPUESTOS NACIONALES',
    deadlineDay: 30,
    items: [
      { code: '2.4.1', name: 'CONTRIBUCION PARAFISCAL (INCES)', isVariable: true },
      { code: '2.4.2', name: 'CONTRIBUCION PARAFISCAL (IVSS)', isVariable: true },
      { code: '2.4.3', name: 'CONTRIBUCION PARAFISCAL (FAOV)', isVariable: true },
      { code: '2.4.4', name: 'OTRO IMPUESTO NACIONAL', isVariable: true },
    ]
  }
};

interface PaymentFormProps {
  onSubmit: (data: any) => Promise<void> | void;
  onCancel: () => void;
  initialData?: Payment | null;
}

export const PaymentForm: React.FC<PaymentFormProps> = ({ onSubmit, onCancel, initialData }) => {
  const [store, setStore] = useState(initialData?.storeId || '');
  const [storeAddress, setStoreAddress] = useState('');
  const [storeMunicipality, setStoreMunicipality] = useState('');
  const [category, setCategory] = useState<Category | ''>(initialData?.category || '');
  
  // States for Tax Logic (Municipal & National)
  const [taxGroup, setTaxGroup] = useState('');
  const [taxItem, setTaxItem] = useState('');

  const [amount, setAmount] = useState(initialData?.amount.toString() || '');
  const [expectedBudget, setExpectedBudget] = useState<number | null>(initialData?.originalBudget || null);
  
  const [dueDate, setDueDate] = useState(initialData?.dueDate || '');
  const [paymentDate, setPaymentDate] = useState(initialData?.paymentDate || new Date().toISOString().split('T')[0]);
  const [specificType, setSpecificType] = useState(initialData?.specificType || '');
  
  // Archivos
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialData?.receiptUrl || null);

  // --- Justification State ---
  const [isOverBudget, setIsOverBudget] = useState(initialData?.isOverBudget || false);
  const [showJustificationModal, setShowJustificationModal] = useState(false);
  const [justificationNote, setJustificationNote] = useState(initialData?.justification || '');
  const [justificationFile, setJustificationFile] = useState<File | null>(null);
  const [justificationConfirmed, setJustificationConfirmed] = useState(!!initialData?.justification);
  const [manualOverBudget, setManualOverBudget] = useState(false);

  const [notes, setNotes] = useState(initialData?.notes || '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Estados de carga
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  const [isFileScanning, setIsFileScanning] = useState(false);

  // Auto-fill logic based on municipal selection (Items & Amounts)
  useEffect(() => {
    if (store) {
      const selectedStore = STORES.find(s => s.id === store);
      if (selectedStore) {
        setStoreAddress(selectedStore.address || '');
        setStoreMunicipality(selectedStore.municipality || '');
      }
    } else {
      setStoreAddress('');
      setStoreMunicipality('');
    }
  }, [store]);

  useEffect(() => {
    const isTaxCategory = category === Category.MUNICIPAL_TAX || category === Category.NATIONAL_TAX;
    const config = category === Category.MUNICIPAL_TAX ? MUNICIPAL_TAX_CONFIG : NATIONAL_TAX_CONFIG;

    if (isTaxCategory && taxGroup && taxItem) {
      const groupData = config[taxGroup];
      const itemData = groupData?.items.find(i => i.code === taxItem);
      
      if (itemData) {
        setSpecificType(`${itemData.code} - ${itemData.name}`);
        setManualOverBudget(false); // Reset manual flag when item changes
        if (itemData.amount !== undefined && !itemData.isVariable) {
          setAmount(itemData.amount.toString());
          setExpectedBudget(itemData.amount); // Set budget baseline
        } else if (itemData.isVariable) {
           setAmount(''); 
           setExpectedBudget(null); // No fixed budget for variable items
        }
      }
    } else if (!isTaxCategory) {
        setTaxGroup('');
        setTaxItem('');
        setExpectedBudget(null);
    }
  }, [category, taxGroup, taxItem]);

  // Auto-fill Due Date based on Tax Group Configuration
  useEffect(() => {
    const isTaxCategory = category === Category.MUNICIPAL_TAX || category === Category.NATIONAL_TAX;
    const configMap = category === Category.MUNICIPAL_TAX ? MUNICIPAL_TAX_CONFIG : NATIONAL_TAX_CONFIG;

    if (isTaxCategory && taxGroup) {
        const config = configMap[taxGroup];
        if (config) {
            const now = new Date();
            const year = now.getFullYear();
            const month = now.getMonth();
            const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
            
            // Ajustar día si el mes es más corto que la fecha límite (ej. Feb 28 vs día 30)
            const targetDay = Math.min(config.deadlineDay, lastDayOfMonth);
            
            // Formatear a YYYY-MM-DD
            const formattedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(targetDay).padStart(2, '0')}`;
            setDueDate(formattedDate);
        }
    }
  }, [category, taxGroup]);

  const isCurrentTaxItemVariable = useMemo(() => {
    const isTaxCategory = category === Category.MUNICIPAL_TAX || category === Category.NATIONAL_TAX;
    const configMap = category === Category.MUNICIPAL_TAX ? MUNICIPAL_TAX_CONFIG : NATIONAL_TAX_CONFIG;

    if (isTaxCategory && taxGroup && taxItem) {
        const groupData = configMap[taxGroup];
        const itemData = groupData?.items.find(i => i.code === taxItem);
        return itemData?.isVariable || false;
    }
    return false;
  }, [category, taxGroup, taxItem]);

  // Budget Monitoring Logic
  useEffect(() => {
    const numericAmount = parseFloat(amount);
    if (isCurrentTaxItemVariable) {
        // For variable items, only manual flag determines over budget
        setIsOverBudget(manualOverBudget);
        if (!manualOverBudget) {
            setJustificationConfirmed(false);
        }
    } else if (expectedBudget !== null && amount && !isNaN(numericAmount)) {
        // For fixed items, compare amount to budget
        if (numericAmount > expectedBudget) {
            setIsOverBudget(true);
        } else {
            setIsOverBudget(false);
            setJustificationConfirmed(false); // Reset if back to normal
        }
    } else {
        setIsOverBudget(false);
    }
  }, [amount, expectedBudget, manualOverBudget, isCurrentTaxItemVariable]);


  // Clean up preview URL
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  // --- LOGICA SEMÁFORO FISCAL ---
  const getTaxStatus = (deadlineDay: number) => {
    const today = new Date();
    const currentDay = today.getDate();
    if (currentDay > deadlineDay) return { color: 'bg-red-500', text: 'text-red-600', bgSoft: 'bg-red-100', status: 'Vencido', icon: AlertCircle };
    if (deadlineDay - currentDay <= 5) return { color: 'bg-yellow-500', text: 'text-yellow-600', bgSoft: 'bg-yellow-100', status: 'Próximo', icon: Clock };
    return { color: 'bg-green-500', text: 'text-green-600', bgSoft: 'bg-green-100', status: 'En fecha', icon: CheckCircle2 };
  };

  const taxStatusList = useMemo(() => {
    const config = category === Category.MUNICIPAL_TAX ? MUNICIPAL_TAX_CONFIG : NATIONAL_TAX_CONFIG;
    return Object.entries(config).map(([key, config]) => {
        const status = getTaxStatus(config.deadlineDay);
        return { key, label: config.label, ...status };
    });
  }, [category]);

  const globalStatus = useMemo(() => {
    if (taxStatusList.some(i => i.status === 'Vencido')) return { color: 'bg-red-500', border: 'border-red-200', text: 'text-red-700', bg: 'bg-red-50', label: 'ACCIONES REQUERIDAS (VENCIDO)' };
    if (taxStatusList.some(i => i.status === 'Próximo')) return { color: 'bg-yellow-500', border: 'border-yellow-200', text: 'text-yellow-700', bg: 'bg-yellow-50', label: 'ATENCIÓN (PRÓXIMOS)' };
    return { color: 'bg-green-500', border: 'border-green-200', text: 'text-green-700', bg: 'bg-green-50', label: 'TODO EN REGLA' };
  }, [taxStatusList]);



  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
        if (selectedFile.size > 5 * 1024 * 1024) {
            setErrors(prev => ({...prev, file: 'El archivo excede el límite de 5MB.'}));
            return;
        }
        setIsFileScanning(true);
        setFile(null); 
        setPreviewUrl(null);
        await new Promise(resolve => setTimeout(resolve, 800));
        if (selectedFile.type.startsWith('image/')) {
            setPreviewUrl(URL.createObjectURL(selectedFile));
        }
        setFile(selectedFile);
        setIsFileScanning(false);
        setErrors(prev => { const newErrs = {...prev}; delete newErrs.file; return newErrs; });
    }
  };

  const clearFile = (e: React.MouseEvent) => {
      e.stopPropagation(); e.preventDefault();
      setFile(null); setPreviewUrl(null);
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!store) newErrors.store = "La tienda es obligatoria";
    if (!category) newErrors.category = "La categoría es obligatoria";
    const isTaxCategory = category === Category.MUNICIPAL_TAX || category === Category.NATIONAL_TAX;
    if (isTaxCategory) {
        if (!taxGroup) newErrors.taxGroup = "Seleccione el grupo fiscal";
        if (!taxItem) newErrors.taxItem = "Seleccione el concepto";
    }
    if (!amount || parseFloat(amount) <= 0) newErrors.amount = "Monto inválido";
    if (!dueDate) newErrors.dueDate = "Fecha requerida";
    if (!paymentDate) newErrors.paymentDate = "Fecha requerida";
    if (!specificType) newErrors.specificType = "Descripción requerida";
    if (!file && !isFileScanning && !initialData?.receiptUrl) newErrors.file = "Comprobante requerido";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    if (isFileScanning) return; 

    // ** Budget Check Interception **
    if (isOverBudget && !justificationConfirmed) {
        setShowJustificationModal(true);
        return;
    }

    setIsSubmitting(true);
    setLoadingText('Digitalizando...');
    await new Promise(resolve => setTimeout(resolve, 800));
    setLoadingText('Verificando...');
    await new Promise(resolve => setTimeout(resolve, 800));
    setLoadingText('Guardando...');
    await new Promise(resolve => setTimeout(resolve, 500));

    try {
        await onSubmit({
            id: initialData?.id,
            storeId: store,
            category,
            amount: parseFloat(amount),
            dueDate,
            paymentDate,
            specificType,
            file,
            notes,
            // Extra Data
            originalBudget: expectedBudget,
            isOverBudget,
            justification: justificationNote,
            justificationFile: justificationFile
        });
    } catch (error) {
        console.error("Error submitting payment:", error);
    } finally {
        setIsSubmitting(false);
        setLoadingText('');
    }
  };

  const handleConfirmJustification = () => {
    if (!justificationNote.trim()) {
        alert("Debe escribir una razón para el excedente.");
        return;
    }
    if (isCurrentTaxItemVariable && manualOverBudget && !justificationFile) {
        alert("Debe adjuntar un archivo de soporte para el excedente manual.");
        return;
    }
    setJustificationConfirmed(true);
    setShowJustificationModal(false);
    // Optionally auto-submit here, or let user click submit again.
    // Let's let them click submit again to be safe, or trigger it.
    // For better UX, we just close the modal and let them hit "Enviar" again, 
    // but visually showing it's justified.
  };

  return (
    <div className="p-6 lg:p-10 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
      
      {/* --- JUSTIFICATION MODAL --- */}
      {showJustificationModal && (
          <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl border border-red-200 dark:border-red-900 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                  <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-red-50 dark:bg-red-900/20 rounded-t-2xl">
                      <h3 className="text-xl font-bold text-red-700 dark:text-red-400 flex items-center gap-2">
                          <AlertTriangle className="animate-pulse" />
                          Excedente Presupuestario
                      </h3>
                      <p className="text-sm text-red-600/80 dark:text-red-400/80 mt-1">
                          {isCurrentTaxItemVariable
                            ? `Se ha marcado el monto ingresado ($${parseFloat(amount || '0').toLocaleString()}) como un excedente que requiere justificación.`
                            : `El monto ingresado ($${parseFloat(amount || '0').toLocaleString()}) supera el presupuesto establecido para este rubro ($${expectedBudget?.toLocaleString()}).`
                          }
                      </p>
                  </div>
                  
                  <div className="p-6 space-y-4 overflow-y-auto">
                      <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Se requiere justificación para auditoría:</p>
                          <textarea
                              value={justificationNote}
                              onChange={(e) => setJustificationNote(e.target.value)}
                              placeholder="Explique la razón del incremento (ej. Multa por retraso, Tasa de cambio ajustada...)"
                              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg p-3 text-sm focus:ring-2 focus:ring-red-500 outline-none h-24 resize-none"
                          />
                      </div>

                      <div>
                          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                              Soporte del Excedente {isCurrentTaxItemVariable && manualOverBudget && <span className="text-red-500 font-bold"> (Requerido)</span>}
                          </label>
                          <div className="flex items-center gap-3">
                              <label className="flex-1 cursor-pointer bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-4 flex flex-col items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                                  {justificationFile ? (
                                      <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-bold text-sm">
                                          <CheckCircle2 size={16} />
                                          <span className="truncate max-w-[150px]">{justificationFile.name}</span>
                                      </div>
                                  ) : (
                                      <>
                                        <Upload size={20} className="text-slate-400 mb-1" />
                                        <span className="text-xs text-slate-500">Subir archivo extra</span>
                                      </>
                                  )}
                                  <input 
                                    type="file" 
                                    className="hidden" 
                                    onChange={(e) => setJustificationFile(e.target.files?.[0] || null)}
                                  />
                              </label>
                              {justificationFile && (
                                  <button 
                                    onClick={() => setJustificationFile(null)} 
                                    className="p-3 bg-red-100 dark:bg-red-900/30 text-red-500 rounded-xl hover:bg-red-200"
                                  >
                                      <Trash2 size={20} />
                                  </button>
                              )}
                          </div>
                          <p className="text-[10px] text-slate-500 mt-2 ml-1">
                              * Si posee un documento adicional que justifique el sobrecosto (ej. Gaceta oficial), adjúntelo aquí.
                          </p>
                      </div>
                  </div>

                  <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 rounded-b-2xl flex gap-3">
                      <button 
                          onClick={() => setShowJustificationModal(false)}
                          className="flex-1 py-3 text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors"
                      >
                          Cancelar
                      </button>
                      <button 
                          onClick={handleConfirmJustification}
                          className="flex-[2] py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg shadow-red-200 dark:shadow-red-900/30 transition-colors flex items-center justify-center gap-2"
                      >
                          <FileWarning size={18} />
                          Confirmar Justificación
                      </button>
                  </div>
              </div>
          </div>
      )}
      {/* --------------------------- */}

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
            <button onClick={onCancel} disabled={isSubmitting} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500 dark:text-slate-400 disabled:opacity-50">
                <ChevronDown className="rotate-90" size={24} />
            </button>
            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                    {initialData ? 'Corregir Pago' : 'Cargar Nuevo Pago'}
                </h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                    {initialData 
                        ? `Editando pago devuelto: ${initialData.id}` 
                        : 'Registre los detalles de la transacción para auditoría.'
                    }
                </p>
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
                {/* Store Selection & Map */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-6">
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

                        {/* Category Grid (Moved inside grid for better layout when map is present) */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Categoría Fiscal</label>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                {[
                                    { id: Category.NATIONAL_TAX, label: 'Nacional', icon: Landmark, color: 'blue' },
                                    { id: Category.MUNICIPAL_TAX, label: 'Municipal', icon: Building2, color: 'indigo' },
                                    { id: Category.UTILITY, label: 'Servicio', icon: Zap, color: 'yellow' },
                                ].map((cat) => {
                                    const Icon = cat.icon;
                                    const isSelected = category === cat.id;
                                    return (
                                        <button
                                            key={cat.id}
                                            type="button"
                                            disabled={isSubmitting}
                                            onClick={() => setCategory(cat.id)}
                                            className={`relative overflow-hidden flex flex-col items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all duration-200 group ${
                                                isSelected 
                                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 shadow-md' 
                                                : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:border-blue-200 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                                            } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            <div className={`p-1.5 rounded-full transition-colors ${isSelected ? 'bg-blue-200 dark:bg-blue-800' : 'bg-slate-100 dark:bg-slate-800 group-hover:bg-white dark:group-hover:bg-slate-700'}`}>
                                                <Icon size={18} className={isSelected ? 'text-blue-700 dark:text-blue-200' : 'text-slate-400 dark:text-slate-500'} />
                                            </div>
                                            <span className="text-xs font-bold">{cat.label}</span>
                                            {isSelected && <div className="absolute top-1 right-1 text-blue-500"><CheckCircle2 size={12} /></div>}
                                        </button>
                                    )
                                })}
                            </div>
                            {errors.category && <p className="text-red-500 text-xs mt-1 ml-1">{errors.category}</p>}
                        </div>
                    </div>

                    <div className="hidden lg:block">
                        <VenezuelaMap 
                            stores={STORES} 
                            selectedStoreIds={store ? [store] : []} 
                            onStoreClick={(id) => setStore(id)}
                        />
                    </div>
                </div>
            </div>
        </section>

        {/* Dynamic Tax Section with Traffic Light (Municipal & National) */}
        {(category === Category.MUNICIPAL_TAX || category === Category.NATIONAL_TAX) && (
            <section className={`rounded-2xl border transition-all duration-300 animate-in slide-in-from-top-4 overflow-hidden ${globalStatus.bg} ${globalStatus.border}`}>
                
                {/* Header Dinámico */}
                <div className={`p-4 border-b ${globalStatus.border} flex items-center justify-between`}>
                     <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${globalStatus.color} text-white shadow-sm`}>
                             <Calculator size={20} />
                        </div>
                        <div>
                            <h3 className={`font-bold ${globalStatus.text}`}>Desglose de Obligaciones</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 opacity-80">Estado fiscal actualizado al día de hoy</p>
                        </div>
                     </div>
                     <div className={`px-3 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider bg-white/50 dark:bg-black/20 ${globalStatus.text} ${globalStatus.border}`}>
                         {globalStatus.label}
                     </div>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2">
                    <div className="p-4 border-r border-slate-200 dark:border-slate-700/50 bg-white/50 dark:bg-slate-900/50">
                        <label className="text-xs font-bold text-slate-500 uppercase mb-3 block">Seleccione Rubro a Pagar</label>
                        <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                            {taxStatusList.map((item) => (
                                <button
                                    key={item.key}
                                    type="button"
                                    onClick={() => {
                                        setTaxGroup(item.key);
                                        setTaxItem(''); 
                                    }}
                                    className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left group ${
                                        taxGroup === item.key 
                                        ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-500 ring-1 ring-blue-500/20 shadow-sm' 
                                        : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:border-blue-300 dark:hover:border-slate-600'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-3 h-3 rounded-full shadow-sm ${item.color} ${item.status === 'Vencido' ? 'animate-pulse' : ''}`}></div>
                                        <span className={`text-sm font-medium ${taxGroup === item.key ? 'text-blue-700 dark:text-blue-300' : 'text-slate-600 dark:text-slate-300'}`}>
                                            {item.label.split(' ')[1]} {item.label.split(' ')[2]}...
                                        </span>
                                    </div>
                                    <div className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${item.bgSoft} ${item.text}`}>
                                        <item.icon size={10} />
                                        <span className="hidden sm:inline">{item.status}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="p-6 flex flex-col justify-center bg-white dark:bg-slate-900">
                         <div className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase ml-1">Concepto Específico</label>
                                <div className="relative">
                                    <select
                                        value={taxItem}
                                        onChange={(e) => setTaxItem(e.target.value)}
                                        disabled={!taxGroup || isSubmitting}
                                        className={`w-full bg-slate-50 dark:bg-slate-800 border ${errors.taxItem ? 'border-red-300' : 'border-slate-200 dark:border-slate-700'} text-slate-800 dark:text-slate-200 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block p-3 shadow-sm outline-none disabled:opacity-50 transition-colors`}
                                    >
                                        <option value="">
                                            {taxGroup ? 'Seleccione Concepto...' : '← Seleccione un rubro primero'}
                                        </option>
                                        {taxGroup && (category === Category.MUNICIPAL_TAX ? MUNICIPAL_TAX_CONFIG : NATIONAL_TAX_CONFIG)[taxGroup].items.map((item) => (
                                            <option key={item.code} value={item.code}>
                                                {item.code} - {item.name} {item.amount ? `($${item.amount})` : ''}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                                        <ChevronDown size={16} />
                                    </div>
                                </div>
                                {errors.taxItem && <p className="text-red-500 text-xs ml-1">{errors.taxItem}</p>}
                            </div>

                            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
                                <div className="flex gap-2">
                                    <AlertCircle size={14} className="mt-0.5 text-blue-500" />
                                    <p>
                                        Seleccione el rubro en la lista de la izquierda para ver su estado actual. 
                                        El color indica la urgencia del pago según la fecha de vencimiento.
                                    </p>
                                </div>
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

            {/* Store Location Info (Auto-filled) */}
            {store && (
                <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800 flex items-start gap-3 animate-in fade-in slide-in-from-left-2">
                    <MapPin className="text-blue-500 shrink-0 mt-0.5" size={18} />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                        <div>
                            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase block mb-0.5">Municipio / Alcaldía</span>
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">{storeMunicipality || 'No especificado'}</p>
                        </div>
                        <div>
                            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase block mb-0.5">Dirección de Sucursal</span>
                            <p className="text-xs text-slate-700 dark:text-slate-300 italic">{storeAddress || 'No especificada'}</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="space-y-6">
                <div>
                     <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Descripción del Pago</label>
                     <div className="relative group">
                        <input
                            type="text"
                            placeholder={(category === Category.MUNICIPAL_TAX || category === Category.NATIONAL_TAX) ? "Se autocompleta con la selección..." : "ej. IVA Octubre, ISLR, Factura Luz #12345"}
                            value={specificType}
                            readOnly={(category === Category.MUNICIPAL_TAX || category === Category.NATIONAL_TAX) || isSubmitting}
                            onChange={(e) => setSpecificType(e.target.value)}
                            className={`bg-slate-50 dark:bg-slate-800 border ${errors.specificType ? 'border-red-300' : 'border-slate-200 dark:border-slate-700'} text-slate-900 dark:text-white text-sm rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 block w-full p-4 pl-12 shadow-sm outline-none transition-all ${(category === Category.MUNICIPAL_TAX || category === Category.NATIONAL_TAX) ? 'opacity-70 cursor-not-allowed' : ''} disabled:opacity-50`}
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
                                className={`bg-slate-50 dark:bg-slate-800 border ${
                                    isOverBudget 
                                        ? 'border-yellow-400 ring-2 ring-yellow-200 dark:ring-yellow-900/30' 
                                        : errors.amount ? 'border-red-300' : 'border-slate-200 dark:border-slate-700'
                                } text-slate-900 dark:text-white text-sm rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-4 shadow-sm outline-none font-mono font-medium transition-all disabled:opacity-50`}
                            />
                            {/* Warning Indicator Icon */}
                            {isOverBudget && (
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-yellow-500 animate-pulse" title="Excede Presupuesto">
                                    <AlertTriangle size={20} />
                                </div>
                            )}
                        </div>
                        {errors.amount && <p className="text-red-500 text-xs mt-1 ml-1">{errors.amount}</p>}
                        
                        {/* Budget Status Message */}
                        {isOverBudget && (
                            <p className="text-yellow-600 dark:text-yellow-400 text-xs mt-1.5 font-bold flex items-center gap-1">
                                <AlertTriangle size={12} />
                                Excede presupuesto (${expectedBudget?.toLocaleString()})
                            </p>
                        )}
                        {justificationConfirmed && (
                            <p className="text-green-600 dark:text-green-400 text-xs mt-1 flex items-center gap-1 font-semibold">
                                <CheckCircle2 size={12} /> Justificación añadida
                            </p>
                        )}

                        {isCurrentTaxItemVariable && (
                            <div className="mt-4 p-3 bg-slate-100 dark:bg-slate-800/50 rounded-lg flex items-center gap-3 border border-slate-200 dark:border-slate-700">
                                <input
                                    type="checkbox"
                                    id="manualOverBudget"
                                    checked={manualOverBudget}
                                    onChange={(e) => setManualOverBudget(e.target.checked)}
                                    className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 shrink-0"
                                />
                                <label htmlFor="manualOverBudget" className="block text-xs text-slate-600 dark:text-slate-400 font-medium">
                                    Marcar este pago como un <strong>excedente presupuestario</strong> para solicitar justificación.
                                </label>
                            </div>
                        )}
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
                     <label className={`relative flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-2xl transition-all group overflow-hidden ${
                         isSubmitting || isFileScanning ? 'cursor-not-allowed opacity-80' : 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50'
                     } ${
                         file ? 'border-green-400 bg-white dark:bg-slate-900' : errors.file ? 'border-red-300 bg-red-50 dark:bg-red-900/10' : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800'
                     }`}>
                        
                        {/* Overlay de Carga de Archivo */}
                        {isFileScanning && (
                            <div className="absolute inset-0 z-20 bg-white/90 dark:bg-slate-900/90 flex flex-col items-center justify-center backdrop-blur-sm">
                                <Scan className="w-8 h-8 text-blue-500 animate-pulse mb-2" />
                                <span className="text-xs font-bold text-blue-600 dark:text-blue-400">Analizando archivo...</span>
                            </div>
                        )}

                        <div className="flex flex-col items-center justify-center w-full h-full">
                            {file ? (
                                <div className="w-full h-full relative group/file">
                                    {previewUrl ? (
                                        // Image Preview
                                        <div className="w-full h-full relative p-2">
                                            <img
                                                src={previewUrl}
                                                alt="Preview"
                                                className="w-full h-full object-contain rounded-xl shadow-sm bg-slate-100 dark:bg-slate-950/50"
                                            />
                                            <div className="absolute inset-0 m-2 rounded-xl bg-black/40 opacity-0 group-hover/file:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                                                 <button
                                                    onClick={clearFile}
                                                    type="button"
                                                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-full font-bold shadow-lg flex items-center gap-2 transform hover:scale-105 transition-all"
                                                 >
                                                    <Trash2 size={18} />
                                                    <span>Eliminar Imagen</span>
                                                 </button>
                                            </div>
                                            <div className="absolute top-4 right-4 bg-green-500 text-white p-1 rounded-full shadow-md z-10 pointer-events-none">
                                                <CheckCircle2 size={16} />
                                            </div>
                                        </div>
                                    ) : (
                                        // PDF/File Preview
                                        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900/50">
                                            <div className="bg-red-100 dark:bg-red-900/30 p-4 rounded-2xl mb-3 ring-4 ring-red-50 dark:ring-red-900/10">
                                                <FileText size={32} className="text-red-500 dark:text-red-400" />
                                            </div>
                                            <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate max-w-[200px] mb-1">
                                                {file.name}
                                            </p>
                                            <p className="text-xs text-slate-500 mb-4 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                                                {(file.size / (1024 * 1024)).toFixed(2)} MB
                                            </p>
                                            <button
                                                onClick={clearFile}
                                                type="button"
                                                className="text-red-500 hover:text-red-600 text-xs font-bold flex items-center gap-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-1.5 rounded-lg transition-colors"
                                            >
                                                <Trash2 size={14} /> Eliminar adjunto
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <>
                                    <div className={`p-4 rounded-full mb-3 transition-colors ${errors.file ? 'bg-red-100 text-red-500' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-500 dark:text-blue-400'}`}>
                                        <Upload size={24} />
                                    </div>
                                    <p className="mb-1 text-sm text-slate-700 dark:text-slate-300 font-medium">Click para subir comprobante</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-500">Soporta: PDF, JPG, PNG (Max 5MB)</p>
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
                            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 block w-full h-48 p-4 shadow-sm outline-none resize-none transition-all disabled:opacity-50"
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
                className={`w-full md:flex-1 ${
                    isOverBudget && !justificationConfirmed 
                    ? 'bg-yellow-500 hover:bg-yellow-600' 
                    : 'bg-blue-600 hover:bg-blue-700'
                } text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-200 dark:shadow-blue-900/30 transition-all active:scale-[0.99] flex items-center justify-center gap-2 ${isSubmitting || isFileScanning ? 'opacity-70 cursor-not-allowed' : ''}`}
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
                ) : isOverBudget && !justificationConfirmed ? (
                    <>
                         <span>Continuar (Justificar Exceso)</span>
                         <AlertTriangle size={20} />
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
