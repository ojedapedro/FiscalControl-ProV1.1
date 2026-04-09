
import React from 'react';
import { TaxInfoSearch } from './TaxInfoSearch';
import { 
  Building2, 
  Landmark, 
  Zap, 
  Upload, 
  Calendar as CalendarIcon, 
  ChevronDown, 
  CheckCircle2, 
  XCircle,
  AlertCircle,
  Calculator,
  MapPin,
  FileText,
  DollarSign,
  Plus,
  Loader2,
  Trash2,
  Scan,
  RefreshCw,
  MessageSquare,
  AlertTriangle,
  Clock,
  FileWarning,
  Users,
  Check,
  Target,
  History,
  ShieldCheck,
  Search,
  ArrowRight,
  Calendar
} from 'lucide-react';
import { Category, Payment, PaymentStatus, User, Store, PaymentFrequency, AuditLog, Role } from '../types';
import { formatDate, getFrequencyDays, calculateNextDueDate, formatDateTime } from '../src/utils';
import VenezuelaMap from './VenezuelaMap';
import { useExchangeRate } from '../contexts/ExchangeRateContext';
import { firestoreService } from '../services/firestoreService';
import { getTaxConfig } from '../src/taxConfigurations';
import { getTaxStatus, getCategoryTrafficLight } from '../src/fiscalUtils';

interface PaymentFormProps {
  onSubmit: (data: any) => Promise<void> | void;
  onCancel: () => void;
  initialData?: Payment | null;
  payments: Payment[];
  isEmbedded?: boolean;
  currentUser?: User | null;
  stores: Store[];
}

export const PaymentForm: React.FC<PaymentFormProps> = ({ onSubmit, onCancel, initialData, payments, isEmbedded = false, currentUser, stores }) => {
  const { exchangeRate } = useExchangeRate();
  const [store, setStore] = React.useState(initialData?.storeId || currentUser?.storeId || '');
  const [storeAddress, setStoreAddress] = React.useState('');
  const [storeMunicipality, setStoreMunicipality] = React.useState('');
  const [category, setCategory] = React.useState<Category | ''>(initialData?.category || '');
  
  // States for Tax Logic (Municipal & National)
  const [taxGroup, setTaxGroup] = React.useState('');
  const [taxItem, setTaxItem] = React.useState('');

  const [amount, setAmount] = React.useState(initialData?.amount?.toString() || '');
  const [expectedBudget, setExpectedBudget] = React.useState<number | null>(initialData?.originalBudget || null);
  
  const [dueDate, setDueDate] = React.useState(initialData?.dueDate || '');
  const [paymentDate, setPaymentDate] = React.useState(initialData?.paymentDate || new Date().toISOString().split('T')[0]);
  const [daysToExpire, setDaysToExpire] = React.useState<string>(initialData?.daysToExpire?.toString() || '');
  const [frequency, setFrequency] = React.useState<PaymentFrequency>(initialData?.frequency || PaymentFrequency.NONE);
  const [specificType, setSpecificType] = React.useState(initialData?.specificType || '');
  
  // Archivos
  const [file, setFile] = React.useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(initialData?.receiptUrl || null);
  const [file2, setFile2] = React.useState<File | null>(null);
  const [previewUrl2, setPreviewUrl2] = React.useState<string | null>(initialData?.receiptUrl2 || null);
  const [isFileScanning2, setIsFileScanning2] = React.useState(false);
  const [uploadProgress2, setUploadProgress2] = React.useState(0);

  // --- Justification State ---
  const [isOverBudget, setIsOverBudget] = React.useState(initialData?.isOverBudget || false);

  // --- Proposed Changes State ---
  const [proposedAmount, setProposedAmount] = React.useState<number | undefined>(initialData?.proposedAmount);
  const [proposedPaymentDate, setProposedPaymentDate] = React.useState<string | undefined>(initialData?.proposedPaymentDate);
  const [proposedDueDate, setProposedDueDate] = React.useState<string | undefined>(initialData?.proposedDueDate);
  const [proposedDaysToExpire, setProposedDaysToExpire] = React.useState<number | undefined>(initialData?.proposedDaysToExpire);
  const [proposedJustification, setProposedJustification] = React.useState('');


  // Campos del Soporte
  const [docDate, setDocDate] = React.useState(initialData?.documentDate || '');
  const [docExchangeRate, setDocExchangeRate] = React.useState<number | null>(null);
  const effectiveExchangeRate = docExchangeRate || exchangeRate;
  const [docAmount, setDocAmount] = React.useState(initialData?.documentAmount?.toString() || '');
  const [docName, setDocName] = React.useState(initialData?.documentName || '');

  const [notes, setNotes] = React.useState(initialData?.notes || '');

  // Reset form when initialData changes
  React.useEffect(() => {
    if (initialData) {
      setStore(initialData.storeId || '');
      setCategory(initialData.category || '');
      // Convert USD amount from database to Bs for the form input
      const initialAmountInBs = initialData.amount ? (initialData.amount * (docExchangeRate || exchangeRate)).toFixed(2) : '';
      setAmount(initialAmountInBs);
      setExpectedBudget(initialData.originalBudget || null);
      setDueDate(initialData.dueDate || '');
      setPaymentDate(initialData.paymentDate || new Date().toISOString().split('T')[0]);
      setDaysToExpire(initialData.daysToExpire?.toString() || '');
      setFrequency(initialData.frequency || PaymentFrequency.NONE);
      setSpecificType(initialData.specificType || '');

      // Initialize taxGroup and taxItem from specificType
      const config = getTaxConfig(initialData.category || '');
      if (config && initialData.specificType) {
        const code = initialData.specificType.split(' - ')[0];
        let found = false;
        for (const [groupKey, groupData] of Object.entries(config)) {
          const item = (groupData as any).items?.find((i: any) => i.code === code);
          if (item) {
            setTaxGroup(groupKey);
            setTaxItem(code);
            found = true;
            break;
          }
        }
        // Fallback if code split didn't work as expected
        if (!found) {
           for (const [groupKey, groupData] of Object.entries(config)) {
             const item = (groupData as any).items?.find((i: any) => initialData.specificType.includes(i.name));
             if (item) {
               setTaxGroup(groupKey);
               setTaxItem(item.code);
               break;
             }
           }
        }
      }

      setPreviewUrl(initialData.receiptUrl || null);
      setPreviewUrl2(initialData.receiptUrl2 || null);
      setIsOverBudget(initialData.isOverBudget || false);
      setDocDate(initialData.documentDate || '');
      setDocAmount(initialData.documentAmount?.toString() || '');
      setDocName(initialData.documentName || '');
      setNotes(initialData.notes || '');
    } else {
      // Reset to defaults for new payment
      setStore(currentUser?.storeId || '');
      setCategory('');
      setAmount('');
      setExpectedBudget(null);
      setDueDate('');
      setPaymentDate(new Date().toISOString().split('T')[0]);
      setDaysToExpire('');
      setFrequency(PaymentFrequency.NONE);
      setSpecificType('');
      setTaxGroup('');
      setTaxItem('');
      setPreviewUrl(null);
      setPreviewUrl2(null);
      setFile(null);
      setFile2(null);
      setIsOverBudget(false);
      setDocDate('');
      setDocAmount('');
      setDocName('');
      setNotes('');
    }
    setErrors({});
    setIsManualOverride(false);
  }, [initialData, currentUser]);

  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [isManualOverride, setIsManualOverride] = React.useState(false);
  
  // Estados de carga
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [loadingText, setLoadingText] = React.useState('');
  const [isFileScanning, setIsFileScanning] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState(0);

  const resetForm = () => {
    setStore('');
    setCategory('');
    setTaxGroup('');
    setTaxItem('');
    setAmount('');
    setExpectedBudget(null);
    setDueDate('');
    setFrequency(PaymentFrequency.NONE);
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setSpecificType('');
    setFile(null);
    setPreviewUrl(null);
    setIsOverBudget(false);
    setDocDate('');
    setDocAmount('');
    setDocName('');
    setNotes('');
    setErrors({});
    setIsManualOverride(false);
  };

  // Auto-fill logic based on municipal selection (Items & Amounts)
  React.useEffect(() => {
    if (store === 'NATIONAL') {
        setStoreAddress('Cobertura Nacional');
        setStoreMunicipality('Cobertura Nacional');
    } else if (store) {
      const selectedStore = stores.find(s => s.id === store);
      if (selectedStore) {
        setStoreAddress(selectedStore.address || '');
        setStoreMunicipality(selectedStore.municipality || '');
      }
    } else {
      setStoreAddress('');
      setStoreMunicipality('');
    }
  }, [store]);

  const handleDueDateChange = React.useCallback((val: string) => {
    setDueDate(val);
  }, []);

  // Sync paymentDate when daysToExpire changes manually
  const handleDaysToExpireChange = React.useCallback((val: string) => {
    setDaysToExpire(val);
  }, []);

  // --- Proposed Changes Handlers ---
  const handleProposedPaymentDateChange = React.useCallback((val: string) => {
    setProposedPaymentDate(val);
    if (val && proposedDueDate) {
      const d1 = new Date(val);
      const d2 = new Date(proposedDueDate);
      const diffTime = d1.getTime() - d2.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setProposedDaysToExpire(diffDays);
    }
  }, [proposedDueDate]);

  const handleProposedDueDateChange = React.useCallback((val: string) => {
    setProposedDueDate(val);
    if (val && proposedDaysToExpire !== undefined) {
      const d = new Date(val);
      d.setDate(d.getDate() + proposedDaysToExpire);
      const formatted = d.toISOString().split('T')[0];
      setProposedPaymentDate(formatted);
    } else if (val && proposedPaymentDate) {
      const d1 = new Date(proposedPaymentDate);
      const d2 = new Date(val);
      const diffTime = d1.getTime() - d2.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setProposedDaysToExpire(diffDays);
    }
  }, [proposedDaysToExpire, proposedPaymentDate]);

  const handleProposedDaysToExpireChange = React.useCallback((val: string) => {
    const days = parseInt(val);
    setProposedDaysToExpire(isNaN(days) ? undefined : days);
    if (val && proposedDueDate && !isNaN(days)) {
      const d = new Date(proposedDueDate);
      d.setDate(d.getDate() + days);
      const formatted = d.toISOString().split('T')[0];
      setProposedPaymentDate(formatted);
    }
  }, [proposedDueDate]);

  // Auto-fill Due Date based on Tax Group Configuration
  React.useEffect(() => {
    const configMap = getTaxConfig(category);
    const isTaxCategory = !!configMap;

    if (isTaxCategory && configMap && taxGroup && !initialData) {
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
            handleDueDateChange(formattedDate);
        }
    }
  }, [category, taxGroup, initialData, handleDueDateChange]);

  const isCurrentTaxItemVariable = React.useMemo(() => {
    const configMap = getTaxConfig(category);
    const isTaxCategory = !!configMap;

    if (isTaxCategory && configMap && taxGroup && taxItem) {
        const groupData = configMap[taxGroup];
        const itemData = groupData?.items?.find(i => i.code === taxItem);
        return itemData?.isVariable || false;
    }
    return false;
  }, [category, taxGroup, taxItem]);

  // Budget Monitoring Logic
  React.useEffect(() => {
    // Convert current Bs amount to USD for budget comparison
    const amountInUsd = parseFloat(amount) / (effectiveExchangeRate || 1);
    // Use document amount if present (already in USD), otherwise use converted main amount
    const effectiveAmountInUsd = docAmount ? parseFloat(docAmount) : amountInUsd;
    
    if (isCurrentTaxItemVariable) {
        // For variable items, only manual flag determines over budget
        setIsOverBudget(false);
    } else if (expectedBudget !== null && !isNaN(effectiveAmountInUsd)) {
        // For fixed items, compare amount to budget
        if (effectiveAmountInUsd > expectedBudget) {
            setIsOverBudget(true);
        } else {
            setIsOverBudget(false);
        }
    } else {
        setIsOverBudget(false);
    }
  }, [amount, docAmount, expectedBudget, isCurrentTaxItemVariable, effectiveExchangeRate]);


  // Reset tax selection when category changes to prevent inconsistent state
  React.useEffect(() => {
    if (!initialData) { // Only reset if not in initial edit mode
      setTaxGroup('');
      setTaxItem('');
      setExpectedBudget(null);
      setIsManualOverride(false);
    }
  }, [category, initialData]);

  // Calcular el estado dinámico de las tiendas para el mapa
  const dynamicStores = React.useMemo(() => {
    const storesToProcess = currentUser?.storeId ? stores.filter(s => s.id === currentUser.storeId) : stores;
    return storesToProcess.map(store => {
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
  }, [payments, currentUser, stores]);

  // Clean up preview URL
  React.useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  React.useEffect(() => {
    const fetchHistoricalRate = async () => {
      if (docDate) {
        try {
          const result = await firestoreService.getExchangeRateByDate(docDate);
          if (result && result.rate) {
            setDocExchangeRate(result.rate);
          } else {
            setDocExchangeRate(null);
          }
        } catch (e) {
          console.error("Error fetching historical rate:", e);
          setDocExchangeRate(null);
        }
      } else {
        setDocExchangeRate(null);
      }
    };
    fetchHistoricalRate();
  }, [docDate]);

  const taxStatusList = React.useMemo(() => {
    const config = getTaxConfig(category);
    if (!config) return [];
    
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return Object.entries(config).map(([key, groupConfig]) => {
        let hasRed = false;
        let hasOrange = false;
        
        const baseStatus = getTaxStatus(groupConfig.deadlineDay);

        groupConfig.items.forEach(item => {
            const itemPayments = payments.filter(p => {
                const pDate = new Date(p.dueDate);
                return p.storeId === store && 
                       p.category === category && 
                       p.specificType.startsWith(item.code) &&
                       pDate.getMonth() === currentMonth &&
                       pDate.getFullYear() === currentYear;
            });

            const hasApprovedOrPaid = itemPayments.some(p => p.status === PaymentStatus.APPROVED || p.status === PaymentStatus.PAID);
            const hasPendingOrUploaded = itemPayments.some(p => p.status === PaymentStatus.PENDING || p.status === PaymentStatus.UPLOADED);
            const hasRejected = itemPayments.some(p => p.status === PaymentStatus.REJECTED);
            const hasOverdue = itemPayments.some(p => p.status === PaymentStatus.OVERDUE);

            if (hasRejected || hasOverdue) {
                hasRed = true;
            } else if (hasPendingOrUploaded) {
                hasOrange = true;
            } else if (!hasApprovedOrPaid) {
                if (baseStatus.status === 'Vencido') {
                    hasRed = true;
                } else if (baseStatus.status === 'Próximo') {
                    hasOrange = true;
                }
            }
        });

        if (hasRed) {
            return { key, label: groupConfig.label, color: 'bg-red-500', text: 'text-red-600', bgSoft: 'bg-red-100', status: 'Vencido', icon: AlertCircle };
        } else if (hasOrange) {
            return { key, label: groupConfig.label, color: 'bg-amber-500', text: 'text-amber-600', bgSoft: 'bg-amber-100', status: 'Enviado', icon: Clock };
        } else {
            return { key, label: groupConfig.label, color: 'bg-emerald-500', text: 'text-emerald-600', bgSoft: 'bg-emerald-100', status: 'Al día', icon: CheckCircle2 };
        }
    });
  }, [category, store, payments]);

  const specificItemStatusList = React.useMemo(() => {
    const configMap = getTaxConfig(category);
    if (!configMap || !taxGroup) return [];
    const groupConfig = configMap[taxGroup];
    if (!groupConfig) return [];

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return groupConfig.items.map(item => {
      const itemPayments = payments.filter(p => {
        const pDate = new Date(p.dueDate);
        return p.storeId === store && 
               p.category === category && 
               p.specificType.startsWith(item.code) &&
               pDate.getMonth() === currentMonth &&
               pDate.getFullYear() === currentYear;
      });

      const hasApprovedOrPaid = itemPayments.some(p => p.status === PaymentStatus.APPROVED || p.status === PaymentStatus.PAID);
      const hasPendingOrUploaded = itemPayments.some(p => p.status === PaymentStatus.PENDING || p.status === PaymentStatus.UPLOADED);
      const hasRejected = itemPayments.some(p => p.status === PaymentStatus.REJECTED);
      const hasOverdue = itemPayments.some(p => p.status === PaymentStatus.OVERDUE);

      if (hasRejected || hasOverdue) {
        return { 
          ...item, 
          color: 'bg-red-500', 
          text: 'text-red-600', 
          bgSoft: 'bg-red-100', 
          status: 'Vencido', 
          icon: AlertCircle 
        };
      }

      if (hasPendingOrUploaded) {
        return { 
          ...item, 
          color: 'bg-amber-500', 
          text: 'text-amber-600', 
          bgSoft: 'bg-amber-100', 
          status: 'Enviado', 
          icon: Clock 
        };
      }

      if (hasApprovedOrPaid) {
        return { 
          ...item, 
          color: 'bg-emerald-500', 
          text: 'text-emerald-600', 
          bgSoft: 'bg-emerald-100', 
          status: 'Al día', 
          icon: CheckCircle2 
        };
      }

      const status = getTaxStatus(groupConfig.deadlineDay);
      // Map 'Próximo' to 'Enviado' (Orange) if we want to follow the user's color logic strictly
      // but 'Próximo' is a date status, not a payment status.
      // However, the user wants Orange for "sent to auditor".
      // If no payment exists and it's 'Próximo', maybe it should be Amber/Orange too.
      return { 
        ...item, 
        ...status,
        status: status.status === 'Próximo' ? 'Próximo' : (status.status === 'En fecha' ? 'Al día' : status.status)
      };
    });
  }, [category, taxGroup, payments, store]);

  const allCategoryItemsStatus = React.useMemo(() => {
    const configMap = getTaxConfig(category);
    if (!configMap) return [];
    
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return Object.entries(configMap).map(([groupKey, groupConfig]) => {
        const items = groupConfig.items.map(item => {
            const itemPayments = payments.filter(p => {
                const pDate = new Date(p.dueDate);
                return p.storeId === store && 
                       p.category === category && 
                       p.specificType.startsWith(item.code) &&
                       pDate.getMonth() === currentMonth &&
                       pDate.getFullYear() === currentYear;
            });

            const hasApprovedOrPaid = itemPayments.some(p => p.status === PaymentStatus.APPROVED || p.status === PaymentStatus.PAID);
            const hasPendingOrUploaded = itemPayments.some(p => p.status === PaymentStatus.PENDING || p.status === PaymentStatus.UPLOADED);
            const hasRejected = itemPayments.some(p => p.status === PaymentStatus.REJECTED);
            const hasOverdue = itemPayments.some(p => p.status === PaymentStatus.OVERDUE);

            let statusInfo;
            if (hasRejected || hasOverdue) {
                statusInfo = { color: 'bg-red-500', text: 'text-red-600', bgSoft: 'bg-red-100', status: 'Vencido', icon: AlertCircle };
            } else if (hasPendingOrUploaded) {
                statusInfo = { color: 'bg-amber-500', text: 'text-amber-600', bgSoft: 'bg-amber-100', status: 'Enviado', icon: Clock };
            } else if (hasApprovedOrPaid) {
                statusInfo = { color: 'bg-emerald-500', text: 'text-emerald-600', bgSoft: 'bg-emerald-100', status: 'Al día', icon: CheckCircle2 };
            } else {
                const dateStatus = getTaxStatus(groupConfig.deadlineDay);
                statusInfo = { 
                    ...dateStatus, 
                    status: dateStatus.status === 'Próximo' ? 'Próximo' : (dateStatus.status === 'En fecha' ? 'Al día' : dateStatus.status)
                };
            }

            return { ...item, ...statusInfo };
        });

        return {
            groupKey,
            label: groupConfig.label,
            items
        };
    });
  }, [category, store, payments]);

  const globalStatus = React.useMemo(() => {
    if (taxStatusList.some(i => i.status === 'Vencido')) return { color: 'bg-red-500', border: 'border-red-200', text: 'text-red-700', bg: 'bg-red-50', label: 'ACCIONES REQUERIDAS (VENCIDO)' };
    if (taxStatusList.some(i => i.status === 'Próximo' || i.status === 'Enviado')) return { color: 'bg-amber-500', border: 'border-amber-200', text: 'text-amber-700', bg: 'bg-amber-50', label: 'ATENCIÓN (PENDIENTES / PRÓXIMOS)' };
    return { color: 'bg-emerald-500', border: 'border-emerald-200', text: 'text-emerald-700', bg: 'bg-emerald-50', label: 'TODO EN REGLA' };
  }, [taxStatusList]);



  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
        const isImage = selectedFile.type.startsWith('image/');
        const maxSize = isImage ? 5 * 1024 * 1024 : 800 * 1024;
        if (selectedFile.size > maxSize) {
            setErrors(prev => ({...prev, file: `El archivo excede el límite de ${isImage ? '5MB' : '800KB'}.`}));
            return;
        }
        setIsFileScanning(true);
        setUploadProgress(0);
        setFile(null); 
        setPreviewUrl(null);
        
        // Simulate progress
        for (let i = 0; i <= 100; i += 10) {
            setUploadProgress(i);
            await new Promise(resolve => setTimeout(resolve, 80));
        }

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

  const handleFileChange2 = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
        const isImage = selectedFile.type.startsWith('image/');
        const maxSize = isImage ? 5 * 1024 * 1024 : 800 * 1024;
        if (selectedFile.size > maxSize) {
            setErrors(prev => ({...prev, file2: `El archivo excede el límite de ${isImage ? '5MB' : '800KB'}.`}));
            return;
        }
        setIsFileScanning2(true);
        setUploadProgress2(0);
        setFile2(null); 
        setPreviewUrl2(null);
        
        // Simulate progress
        for (let i = 0; i <= 100; i += 10) {
            setUploadProgress2(i);
            await new Promise(resolve => setTimeout(resolve, 80));
        }

        if (selectedFile.type.startsWith('image/')) {
            setPreviewUrl2(URL.createObjectURL(selectedFile));
        }
        setFile2(selectedFile);
        setIsFileScanning2(false);
        setErrors(prev => { const newErrs = {...prev}; delete newErrs.file2; return newErrs; });
    }
  };

  const clearFile2 = (e: React.MouseEvent) => {
      e.stopPropagation(); e.preventDefault();
      setFile2(null); setPreviewUrl2(null);
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!store) newErrors.store = "La tienda es obligatoria";
    if (!category) newErrors.category = "La categoría es obligatoria";
    const isTaxCategory = !!getTaxConfig(category);
    if (isTaxCategory) {
        if (!taxGroup) newErrors.taxGroup = "Seleccione el grupo fiscal";
        if (!taxItem) newErrors.taxItem = "Seleccione el concepto";
    }
    const parsedAmount = parseFloat(amount);
    
    if (amount === '' || isNaN(parsedAmount) || (isTaxCategory ? parsedAmount < 0 : parsedAmount <= 0)) {
      newErrors.amount = "Monto inválido";
    }
    if (!dueDate) newErrors.dueDate = "Fecha requerida";
    if (!paymentDate) newErrors.paymentDate = "Fecha requerida";
    if (!specificType) newErrors.specificType = "Descripción requerida";
    if (!file && !isFileScanning && !initialData?.receiptUrl) newErrors.file = "Comprobante requerido";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    if (isFileScanning) return; 

    processSubmit();
  };

  const processSubmit = async () => {
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
            // Convert Bs amount back to USD for storage
            amount: parseFloat(amount) / (effectiveExchangeRate || 1),
            dueDate,
            paymentDate,
            daysToExpire: daysToExpire ? parseInt(daysToExpire) : undefined,
            frequency,
            specificType,
            file,
            file2,
            notes,
            // Extra Data
            originalBudget: expectedBudget,
            isOverBudget,
            // Soporte Data
            documentDate: docDate,
            documentAmount: docAmount ? parseFloat(docAmount) : undefined,
            documentName: docName,
            // Proposed Data
            proposedAmount,
            proposedPaymentDate,
            proposedDueDate,
            proposedDaysToExpire,
            proposedJustification,
            proposedStatus: (proposedAmount !== undefined) || proposedPaymentDate || proposedDueDate ? 'PENDING_APPROVAL' : undefined
        });
        resetForm();
    } catch (error) {
        console.error("Error submitting payment:", error);
    } finally {
        setIsSubmitting(false);
        setLoadingText('');
    }
  };

  return (
    <div className="p-6 lg:p-10 xl:p-12 w-full max-w-full mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
      
      {/* Top Banner for Rejected Payments */}
      {initialData?.status === PaymentStatus.REJECTED && (
        <div className="mb-10 -mx-6 lg:-mx-10 xl:-mx-12 -mt-6 lg:-mt-10 xl:-mt-12 p-4 bg-red-600 text-white text-center text-sm font-black uppercase tracking-[0.3em] rounded-t-2xl flex items-center justify-center gap-4 shadow-xl shadow-red-500/20 border-b border-red-500">
          <AlertTriangle size={20} className="animate-pulse" />
          <span>Atención: Este pago requiere correcciones inmediatas</span>
          <AlertTriangle size={20} className="animate-pulse" />
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
            {!isEmbedded && (
                <button onClick={onCancel} disabled={isSubmitting} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500 dark:text-slate-400 disabled:opacity-50">
                    <ChevronDown className="rotate-90" size={24} />
                </button>
            )}
            <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                      {initialData?.status === PaymentStatus.REJECTED ? 'Corregir Registro' : (initialData ? 'Editar Pago' : 'Cargar Nuevo Pago')}
                  </h1>
                  {initialData?.status === PaymentStatus.REJECTED && (
                    <span className="px-2 py-0.5 bg-red-100 text-red-600 text-[10px] font-black uppercase tracking-tighter rounded-md border border-red-200 animate-pulse">
                      Devuelto
                    </span>
                  )}
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                    {initialData?.status === PaymentStatus.REJECTED 
                        ? `ID de Transacción: ${initialData.id}` 
                        : (initialData ? `Editando pago: ${initialData.id}` : 'Registre los detalles de la transacción para auditoría.')
                    }
                </p>
            </div>
        </div>
      </div>

      {/* Auditor Feedback for Rejected Payments - Refined UI */}
      {initialData?.status === PaymentStatus.REJECTED && initialData.rejectionReason && (
        <div className="mb-10 animate-in slide-in-from-top-4 duration-500">
          <div className="glass-card border-red-500/30 bg-red-500/5 overflow-hidden relative">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]"></div>
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-500/20 text-red-500 rounded-lg">
                    <AlertCircle size={20} />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Motivo de la Devolución</h3>
                </div>
                <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{formatDate(new Date())}</span>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 relative">
                  <p className="text-slate-300 text-lg font-serif italic leading-relaxed pl-4 border-l-2 border-slate-200 dark:border-slate-800">
                    "{initialData.rejectionReason}"
                  </p>
                  
                  {initialData.checklist && (
                    <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {Object.entries(initialData.checklist).map(([key, value]) => {
                        const labels: Record<string, string> = {
                          receiptValid: 'Comprobante Válido',
                          stampLegible: 'Sello Legible',
                          storeConceptMatch: 'Tienda y Concepto',
                          datesApproved: 'Fechas de Vencimiento',
                          documentDateApproved: 'Fecha de Documento',
                          proposedDatesApproved: 'Fechas Propuestas',
                          amountsApproved: 'Montos y Presupuesto',
                          proposedAmountApproved: 'Monto Autorizado',
                          observationsApproved: 'Notas y Observaciones'
                        };
                        return (
                          <div key={key} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                            value 
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' 
                            : 'bg-red-500/10 border-red-500/20 text-red-500'
                          }`}>
                            {value ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                            <span className="text-[10px] font-black uppercase tracking-wider">{labels[key] || key}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                <div className="lg:col-span-1 bg-slate-900/40 p-4 rounded-xl border border-slate-800 flex flex-col justify-center">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Instrucciones de Auditoría</p>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Por favor, revise los campos resaltados en rojo y asegúrese de que la documentación adjunta sea legible y corresponda al concepto solicitado.
                  </p>
                </div>
              </div>
              <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <p className="text-xs text-slate-500 font-medium flex items-center gap-2">
                  <RefreshCw size={14} className="text-red-500 animate-spin-slow" /> 
                  Ajuste los campos marcados o reemplace los documentos para reenviar.
                </p>
                <div className="flex -space-x-2">
                  {[1,2,3].map(i => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-slate-950 bg-slate-800 shadow-lg"></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Section 1: Origen y Clasificación */}
        <section className={`glass-card p-8 transition-all duration-500 ${initialData?.status === PaymentStatus.REJECTED ? 'border-red-500/30' : ''}`}>
            <h2 className="label-caps mb-8 flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-brand-500 shadow-[0_0_8px_rgba(14,165,233,0.5)]"></div>
                Ubicación y Clasificación Fiscal
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                <div className="lg:col-span-3 space-y-8">
                    <div>
                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-3 ml-1">Sucursal / Tienda</label>
                        <div className="relative group">
                            <select 
                                value={store}
                                onChange={(e) => setStore(e.target.value)}
                                disabled={isSubmitting || !!currentUser?.storeId}
                                className={`w-full appearance-none bg-slate-50 dark:bg-slate-950/50 border ${errors.store ? 'border-red-500/50 ring-1 ring-red-500/20' : 'border-slate-200 dark:border-slate-800 group-focus-within:border-brand-500/50'} text-slate-900 dark:text-white text-sm font-bold rounded-xl focus:ring-4 focus:ring-brand-500/10 block p-4 pl-12 transition-all outline-none disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer`}
                            >
                                <option value="" className="bg-slate-50 dark:bg-slate-900">Seleccionar ubicación...</option>
                                {category === Category.PAYROLL && !currentUser?.storeId && (
                                    <option value="NATIONAL" className="bg-slate-50 dark:bg-slate-900">Nacional (Cobertura Nacional)</option>
                                )}
                                {(currentUser?.storeId ? stores.filter(s => s.id === currentUser.storeId) : stores).map(s => (
                                    <option key={s.id} value={s.id} className="bg-slate-50 dark:bg-slate-900">{s.name}</option>
                                ))}
                            </select>
                            <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-brand-400 transition-colors" size={20} />
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" size={18} />
                        </div>
                        {errors.store && <p className="text-red-400 text-[10px] font-black uppercase mt-2 ml-1 tracking-tighter">{errors.store}</p>}
                    </div>

                    {category && (
                        <div className="p-5 bg-brand-500/5 border border-brand-500/20 rounded-2xl flex items-start gap-4 animate-in fade-in slide-in-from-left-2">
                            <div className="p-2 bg-brand-500/20 rounded-lg text-brand-400">
                                <AlertCircle size={18} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-brand-400 uppercase tracking-widest mb-1">Guía de Categoría</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                                    {[
                                        { id: Category.NATIONAL_TAX, desc: 'Impuestos y contribuciones nacionales (SENIAT, INCES, IVSS).' },
                                        { id: Category.MUNICIPAL_TAX, desc: 'Impuestos y tasas correspondientes a la alcaldía del municipio.' },
                                        { id: Category.OBJECT, desc: 'Permisos, certificaciones y registros (SENCAMER, RACDA, SAPI).' },
                                        { id: Category.INSTITUTIONS, desc: 'Instituciones Nacionales y Regionales (SNC, RUPDAE, FONACIT).' },
                                        { id: Category.TRANSPORT, desc: 'Documentos de chofer, vehículo y mantenimiento.' },
                                        { id: Category.SENIAT_DECLARATIONS, desc: 'Declaraciones y Contabilidad SENIAT.' },
                                        { id: Category.SENIAT_BOOKS, desc: 'Libros SENIAT (Mayor, Inventario, Actas, etc).' },
                                        { id: Category.SYSTEMS, desc: 'Sistemas, Marketing y Oficinas.' },
                                        { id: Category.PAYROLL, desc: 'Nómina, pasivos laborales y contribuciones (INCES, IVSS, FAOV).' },
                                        { id: Category.UTILITY, desc: 'Pagos de servicios públicos y privados (Agua, Electricidad).' },
                                    ].find(c => c.id === category)?.desc}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="lg:col-span-9">
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-4 ml-1">Categoría Fiscal</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">
                        {[
                            { id: Category.NATIONAL_TAX, label: 'Nacional', icon: Landmark },
                            { id: Category.MUNICIPAL_TAX, label: 'Municipal', icon: Building2 },
                            { id: Category.OBJECT, label: 'Objeto', icon: FileText },
                            { id: Category.INSTITUTIONS, label: 'Instituciones', icon: Landmark },
                            { id: Category.TRANSPORT, label: 'Transporte', icon: FileText },
                            { id: Category.SENIAT_DECLARATIONS, label: 'SENIAT Decl.', icon: FileText },
                            { id: Category.SENIAT_BOOKS, label: 'SENIAT Libros', icon: FileText },
                            { id: Category.SYSTEMS, label: 'Sistemas', icon: FileText },
                            { id: Category.PAYROLL, label: 'RRHH', icon: Users },
                            { id: Category.UTILITY, label: 'Servicio', icon: Zap },
                        ].map((cat) => {
                            const Icon = cat.icon;
                            const isSelected = category === cat.id;
                            const trafficLight = getCategoryTrafficLight(cat.id, store, payments);
                            
                            let trafficClasses = '';
                            let iconClasses = '';
                            let textClasses = '';
                            
                            if (trafficLight === 'red') {
                                trafficClasses = isSelected 
                                    ? 'border-red-500 bg-red-500/10 text-red-900 dark:text-red-100 shadow-[0_0_20px_rgba(239,68,68,0.15)]' 
                                    : 'border-red-500/50 bg-red-500/5 text-red-700 dark:text-red-400 hover:border-red-500 hover:bg-red-500/10';
                                iconClasses = isSelected ? 'bg-red-500 text-white shadow-red-500/20 scale-110' : 'bg-red-500/20 text-red-500 group-hover:bg-red-500/30';
                                textClasses = isSelected ? 'text-red-900 dark:text-red-100' : 'text-red-700 dark:text-red-400 group-hover:text-red-500';
                            } else if (trafficLight === 'green') {
                                trafficClasses = isSelected 
                                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-900 dark:text-emerald-100 shadow-[0_0_20px_rgba(16,185,129,0.15)]' 
                                    : 'border-emerald-500/50 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400 hover:border-emerald-500 hover:bg-emerald-500/10';
                                iconClasses = isSelected ? 'bg-emerald-500 text-white shadow-emerald-500/20 scale-110' : 'bg-emerald-500/20 text-emerald-500 group-hover:bg-emerald-500/30';
                                textClasses = isSelected ? 'text-emerald-900 dark:text-emerald-100' : 'text-emerald-700 dark:text-emerald-400 group-hover:text-emerald-500';
                            } else if (trafficLight === 'amber') {
                                trafficClasses = isSelected 
                                    ? 'border-amber-500 bg-amber-500/10 text-amber-900 dark:text-amber-100 shadow-[0_0_20px_rgba(245,158,11,0.15)]' 
                                    : 'border-amber-500/50 bg-amber-500/5 text-amber-700 dark:text-amber-400 hover:border-amber-500 hover:bg-amber-500/10';
                                iconClasses = isSelected ? 'bg-amber-500 text-white shadow-amber-500/20 scale-110' : 'bg-amber-500/20 text-amber-500 group-hover:bg-amber-500/30';
                                textClasses = isSelected ? 'text-amber-900 dark:text-amber-100' : 'text-amber-700 dark:text-amber-400 group-hover:text-amber-500';
                            } else {
                                trafficClasses = isSelected 
                                    ? 'border-brand-500 bg-brand-500/10 text-slate-900 dark:text-white shadow-[0_0_20px_rgba(14,165,233,0.15)]' 
                                    : 'border-slate-200 dark:border-slate-800 bg-slate-900/50 text-slate-500 hover:border-slate-700 hover:bg-slate-800';
                                iconClasses = isSelected ? 'bg-brand-500 text-slate-900 dark:text-white shadow-brand-500/20 scale-110' : 'bg-slate-800 text-slate-500 group-hover:bg-slate-700 group-hover:text-slate-300';
                                textClasses = isSelected ? 'text-slate-900 dark:text-white' : 'text-slate-500 group-hover:text-slate-300';
                            }

                            return (
                                <button
                                    key={cat.id}
                                    type="button"
                                    disabled={isSubmitting}
                                    onClick={() => setCategory(cat.id)}
                                    className={`relative flex flex-col items-center justify-center gap-3 p-4 rounded-2xl border-2 transition-all duration-300 group active:scale-95 ${trafficClasses} ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    <div className={`p-2.5 rounded-xl transition-all duration-300 ${iconClasses}`}>
                                        <Icon size={20} />
                                    </div>
                                    <span className={`text-[11px] font-black uppercase tracking-tighter transition-colors ${textClasses}`}>{cat.label}</span>
                                    {isSelected && (
                                        <div className={`absolute top-2 right-2 animate-in zoom-in duration-300 ${trafficLight === 'red' ? 'text-red-500' : trafficLight === 'green' ? 'text-emerald-500' : 'text-brand-400'}`}>
                                            <CheckCircle2 size={14} />
                                        </div>
                                    )}
                                </button>
                            )
                        })}
                    </div>
                    {errors.category && <p className="text-red-400 text-[10px] font-black uppercase mt-3 ml-1 tracking-tighter">{errors.category}</p>}
                </div>
            </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            <div className="lg:col-span-12 space-y-10">
                {/* Dynamic Tax Section with Traffic Light */}
                {!!getTaxConfig(category) && (
                    <section className={`rounded-3xl border-2 transition-all duration-500 animate-in slide-in-from-top-4 overflow-hidden shadow-2xl ${globalStatus.bg} ${globalStatus.border}`}>
                        
                        {/* Header Dinámico */}
                        <div className={`p-6 border-b-2 ${globalStatus.border} flex items-center justify-between bg-white/40 dark:bg-black/10 backdrop-blur-md`}>
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-2xl ${globalStatus.color} text-slate-950 dark:text-slate-50 shadow-lg`}>
                                    <Calculator size={24} />
                                </div>
                                <div>
                                    <h3 className={`text-xl font-black uppercase tracking-tight ${globalStatus.text}`}>Desglose de Obligaciones</h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Estado fiscal actualizado al día de hoy</p>
                                </div>
                            </div>
                            <div className={`px-4 py-1.5 rounded-full text-xs font-black border-2 uppercase tracking-widest bg-white/80 dark:bg-black/40 shadow-sm ${globalStatus.text} ${globalStatus.border}`}>
                                {globalStatus.label}
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 dark:divide-slate-800">
                            {/* Selector de Rubro */}
                            <div className="p-8 bg-white/30 dark:bg-slate-900/30">
                                <div className="flex items-center justify-between mb-6">
                                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Seleccione Rubro a Pagar</label>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{taxStatusList.length} Rubros Disponibles</span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
                                    {taxStatusList.map((item) => (
                                        <button
                                            key={item.key}
                                            type="button"
                                            onClick={() => {
                                                setTaxGroup(item.key);
                                                setTaxItem('');
                                                const element = document.getElementById(`group-${item.key}`);
                                                if (element) {
                                                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                                }
                                            }}
                                            className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all text-left group active:scale-[0.98] ${
                                                taxGroup === item.key 
                                                ? 'bg-brand-500/10 border-brand-500 ring-4 ring-brand-500/10 shadow-lg' 
                                                : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:border-brand-300 dark:hover:border-slate-600'
                                            }`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`w-3.5 h-3.5 rounded-full shadow-md ${item.color} ${item.status === 'Vencido' ? 'animate-pulse' : ''}`}></div>
                                                <span className={`text-xs font-black uppercase tracking-tight ${taxGroup === item.key ? 'text-brand-600 dark:text-brand-400' : 'text-slate-600 dark:text-slate-300'}`}>
                                                    {item.label.split(' ').slice(1, 5).join(' ')}
                                                </span>
                                            </div>
                                            <div className={`text-[10px] font-black px-2 py-1 rounded-lg flex items-center gap-1.5 ${item.bgSoft} ${item.text} border border-current/10`}>
                                                <item.icon size={10} />
                                                <span className="hidden sm:inline uppercase tracking-tighter">{item.status}</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Selector de Concepto Específico - Ahora muestra TODOS los conceptos agrupados */}
                            <div className="p-8 flex flex-col bg-white dark:bg-slate-900">
                                <div className="flex items-center justify-between mb-6">
                                    <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase ml-1">Conceptos de Pago</label>
                                    <span className="text-[10px] font-black text-brand-500 uppercase tracking-widest">
                                        {allCategoryItemsStatus.reduce((acc, curr) => acc + curr.items.length, 0)} Conceptos totales
                                    </span>
                                </div>
                                
                                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 max-h-[600px] space-y-8">
                                    {allCategoryItemsStatus.map((group) => (
                                        <div key={group.groupKey} id={`group-${group.groupKey}`} className={`space-y-4 transition-all duration-500 ${taxGroup && taxGroup !== group.groupKey ? 'opacity-40 grayscale-[0.5]' : 'opacity-100'}`}>
                                            <div className="flex items-center gap-3 px-2">
                                                <div className="w-1 h-4 bg-brand-500 rounded-full"></div>
                                                <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400">{group.label}</h4>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                {group.items.map((item) => (
                                                    <button
                                                        key={item.code}
                                                        type="button"
                                                        disabled={isSubmitting}
                                                        onClick={() => {
                                                            setTaxGroup(group.groupKey);
                                                            setTaxItem(item.code);
                                                        }}
                                                        className={`w-full flex flex-col p-4 rounded-2xl border-2 transition-all text-left group relative active:scale-[0.98] ${
                                                            taxItem === item.code 
                                                            ? 'bg-brand-500/10 border-brand-500 ring-4 ring-brand-500/10 shadow-xl' 
                                                            : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:border-brand-300 dark:hover:border-slate-600'
                                                        }`}
                                                    >
                                                        <div className="flex items-center justify-between mb-3">
                                                            <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg ${item.bgSoft} ${item.text} flex items-center gap-1.5 border border-current/10 uppercase tracking-tighter`}>
                                                                <item.icon size={12} />
                                                                {item.status}
                                                            </span>
                                                            <span className="text-[10px] font-black font-mono text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded-md">{item.code}</span>
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className={`text-sm font-black leading-tight mb-2 uppercase tracking-tight ${taxItem === item.code ? 'text-brand-600 dark:text-brand-400' : 'text-slate-700 dark:text-slate-200'}`}>
                                                                {item.name}
                                                            </span>
                                                            {item.amount !== undefined && (
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-xs font-black text-brand-500 bg-brand-500/10 px-2 py-0.5 rounded-md">
                                                                        ${item.amount.toLocaleString()}
                                                                    </span>
                                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Base Presupuestaria</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className={`absolute top-3 right-3 w-2.5 h-2.5 rounded-full shadow-sm ${item.color} ${item.status === 'Vencido' ? 'animate-pulse' : ''}`}></div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-8 p-4 bg-brand-500/5 dark:bg-brand-500/10 rounded-2xl border border-brand-500/20 text-xs text-slate-500 dark:text-slate-300">
                                    <div className="flex gap-3">
                                        <AlertCircle size={18} className="shrink-0 text-brand-500" />
                                        <p className="leading-relaxed">
                                            <span className="font-black uppercase tracking-widest text-brand-500 block mb-1">Guía de Selección</span>
                                            Seleccione el rubro y concepto exacto. El color indica la urgencia según la fecha de vencimiento legal.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                {/* Section 2: Detalles Financieros */}
                <section className={`glass-card p-10 transition-all duration-500 shadow-xl ${initialData?.status === PaymentStatus.REJECTED ? 'border-red-500/30' : ''}`}>
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="label-caps flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                            Detalles Financieros
                        </h2>
                        {!!getTaxConfig(category) && !isManualOverride && (
                            <button
                                type="button"
                                onClick={() => setIsManualOverride(true)}
                                className="text-[10px] font-black text-brand-400 hover:text-brand-300 uppercase tracking-widest flex items-center gap-2 transition-all hover:scale-105"
                            >
                                <RefreshCw size={12} className="animate-spin-slow" />
                                Editar manualmente
                            </button>
                        )}
                    </div>

                    {/* Store Location Info (Auto-filled) */}
                    {store && (
                        <div className="mb-8 p-5 bg-brand-500/5 border border-brand-500/20 rounded-2xl flex items-start gap-4 animate-in fade-in slide-in-from-left-2">
                            <MapPin className="text-brand-400 shrink-0 mt-0.5" size={20} />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                                <div>
                                    <p className="text-[10px] font-black text-brand-400 uppercase tracking-widest block mb-1">Municipio / Alcaldía</p>
                                    <p className="text-sm font-bold text-slate-950 dark:text-slate-50">{storeMunicipality || 'No especificado'}</p>
                                </div>
                                <div>
                                    <span className="text-[10px] font-black text-brand-400 uppercase tracking-widest block mb-1">Dirección de Sucursal</span>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 italic leading-relaxed">{storeAddress || 'No especificada'}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="space-y-8">
                        <div>
                            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-3 ml-1">Descripción del Pago</label>
                            <div className="relative group">
                                <input
                                    type="text"
                                    placeholder={!!getTaxConfig(category) ? "Se autocompleta con la selección..." : "ej. IVA Octubre, ISLR, Factura Luz #12345"}
                                    value={specificType}
                                    readOnly={(!!getTaxConfig(category) && !isManualOverride) || isSubmitting}
                                    onChange={(e) => setSpecificType(e.target.value)}
                                    className={`w-full bg-slate-50 dark:bg-slate-950/50 border ${errors.specificType ? 'border-red-500/50 ring-1 ring-red-500/20' : 'border-slate-200 dark:border-slate-800 group-focus-within:border-brand-500/50'} text-slate-900 dark:text-white text-sm font-bold rounded-xl focus:ring-4 focus:ring-brand-500/10 block p-4 pl-12 outline-none transition-all ${(!!getTaxConfig(category) && !isManualOverride) ? 'opacity-70 cursor-not-allowed' : ''} disabled:opacity-50`}
                                />
                                <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-brand-400 transition-colors" size={20} />
                            </div>
                            {errors.specificType && <p className="text-red-400 text-[10px] font-black uppercase mt-2 ml-1 tracking-tighter">{errors.specificType}</p>}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                            {/* Amount */}
                            <div className="md:col-span-1">
                                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-3 ml-1">Monto Total (Bs.)</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-500 group-focus-within:text-brand-400 font-black transition-colors">Bs.</div>
                                    <input
                                        type="number"
                                        step="0.01"
                                        placeholder="0.00"
                                        value={amount}
                                        readOnly={!isManualOverride}
                                        onChange={(e) => setAmount(e.target.value)}
                                        className={`w-full ${!isManualOverride ? 'bg-slate-900/50 cursor-not-allowed' : 'bg-slate-50 dark:bg-slate-950/50'} border ${
                                            isOverBudget 
                                                ? 'border-amber-500/50 ring-2 ring-amber-500/10' 
                                                : errors.amount ? 'border-red-500/50' : 'border-slate-200 dark:border-slate-800 group-focus-within:border-brand-500/50'
                                        } text-slate-900 dark:text-white text-sm font-black rounded-xl focus:ring-4 focus:ring-brand-500/10 block pl-12 p-4 outline-none font-mono transition-all`}
                                    />
                                    {isOverBudget && (
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-amber-500 animate-pulse" title="Excede Presupuesto">
                                            <AlertTriangle size={20} />
                                        </div>
                                    )}
                                </div>
                                {parseFloat(amount) === 0 && !!getTaxConfig(category) && (
                                    <p className="text-[10px] font-black text-emerald-500 uppercase mt-2 ml-1 tracking-tighter flex items-center gap-1 animate-in fade-in slide-in-from-left-1">
                                        <CheckCircle2 size={10} /> Trámite Exonerado / Pago Cero
                                    </p>
                                )}
                                {errors.amount && <p className="text-red-400 text-[10px] font-black uppercase mt-2 ml-1 tracking-tighter">{errors.amount}</p>}
                                
                                {effectiveExchangeRate !== undefined && (
                                    <div className="mt-3 p-3 bg-slate-800/50 border border-emerald-500/30 rounded-xl flex items-center gap-3 group/conv transition-all hover:bg-slate-800/80 overflow-hidden shadow-inner">
                                        <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg shrink-0">
                                            <DollarSign size={16} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 mb-1">
                                                <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Equivalente en $</p>
                                                <p className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase shrink-0 bg-slate-50 dark:bg-slate-950/50 px-1.5 py-0.5 rounded border border-slate-700">{docExchangeRate ? 'Histórica' : 'Actual'}</p>
                                            </div>
                                            <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1">
                                                <p className="text-sm sm:text-base font-black text-emerald-300 tabular-nums break-all">
                                                    $ {(parseFloat(amount || '0') / effectiveExchangeRate).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </p>
                                                <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 tabular-nums shrink-0">Tasa: {effectiveExchangeRate.toLocaleString('es-VE')}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {isOverBudget && (
                                    <div className="mt-4 p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                        <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={18} />
                                        <div className="text-[11px] text-amber-200/80 font-medium leading-relaxed">
                                            <p className="font-black mb-1 uppercase tracking-widest text-amber-400">Excedente de Presupuesto</p>
                                            Excede por ${ ((parseFloat(amount || '0') / effectiveExchangeRate) - (expectedBudget || 0)).toLocaleString() } (Bs. { (parseFloat(amount || '0') - ((expectedBudget || 0) * effectiveExchangeRate)).toLocaleString('es-VE', { minimumFractionDigits: 2 }) }).
                                        </div>
                                    </div>
                                )}


                            </div>

                            {/* Payment Date and Due Date Column */}
                            <div>
                                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-3 ml-1">Alertas</label>
                                <div className="relative group mb-8">
                                    <input
                                        type="date"
                                        value={paymentDate}
                                        disabled={isSubmitting}
                                        onChange={(e) => setPaymentDate(e.target.value)}
                                        className={`w-full bg-slate-50 dark:bg-slate-950/50 border ${errors.paymentDate ? 'border-red-500/50' : 'border-slate-200 dark:border-slate-800 group-focus-within:border-brand-500/50'} text-slate-900 dark:text-white text-sm font-bold rounded-xl focus:ring-4 focus:ring-brand-500/10 block p-4 pl-12 outline-none transition-all dark:[color-scheme:dark] [color-scheme:light] disabled:opacity-50`}
                                    />
                                    <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-brand-400 transition-colors" size={20} />
                                </div>
                                {errors.paymentDate && <p className="text-red-400 text-[10px] font-black uppercase mt-2 ml-1 tracking-tighter mb-4">{errors.paymentDate}</p>}

                                {/* Due Date moved here */}
                                <div>
                                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-3 ml-1">Fecha Vencimiento</label>
                                    <div className="relative group">
                                        <input
                                            type="date"
                                            value={dueDate}
                                            disabled={isSubmitting}
                                            onChange={(e) => handleDueDateChange(e.target.value)}
                                            className={`w-full bg-slate-50 dark:bg-slate-950/50 border ${errors.dueDate ? 'border-red-500/50' : 'border-slate-200 dark:border-slate-800 group-focus-within:border-brand-500/50'} text-slate-900 dark:text-white text-sm font-bold rounded-xl focus:ring-4 focus:ring-brand-500/10 block p-4 pl-12 outline-none transition-all dark:[color-scheme:dark] [color-scheme:light] disabled:opacity-50`}
                                        />
                                        <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-brand-400 transition-colors" size={20} />
                                    </div>
                                    {errors.dueDate && <p className="text-red-400 text-[10px] font-black uppercase mt-2 ml-1 tracking-tighter">{errors.dueDate}</p>}
                                    {dueDate && frequency && frequency !== PaymentFrequency.NONE && (
                                        <p className="text-[10px] font-black text-brand-500 uppercase tracking-tighter mt-2 ml-1">
                                            Próximo Vencimiento: {formatDate(calculateNextDueDate(dueDate, frequency))}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Frequency */}
                            <div>
                                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-3 ml-1">Frecuencia de Pago</label>
                                <div className="relative group">
                                    <select
                                        value={frequency}
                                        disabled={isSubmitting}
                                        onChange={(e) => {
                                            const newFreq = e.target.value as PaymentFrequency;
                                            setFrequency(newFreq);
                                            if (newFreq !== PaymentFrequency.NONE) {
                                                const days = getFrequencyDays(newFreq);
                                                setDaysToExpire(days.toString());
                                            } else {
                                                setDaysToExpire('');
                                            }
                                        }}
                                        className="w-full appearance-none bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-sm font-bold rounded-xl focus:ring-4 focus:ring-brand-500/10 block p-4 pl-12 transition-all outline-none disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
                                    >
                                        {Object.entries(PaymentFrequency).map(([key, value]) => (
                                            <option key={key} value={value} className="bg-slate-50 dark:bg-slate-900">{value}</option>
                                        ))}
                                    </select>
                                    <RefreshCw className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-brand-400 transition-colors" size={20} />
                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" size={18} />
                                </div>
                            </div>

                            {/* Days to Expire */}
                            <div>
                                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-3 ml-1">Días a Vencer</label>
                                <div className="relative group">
                                    <input
                                        type="number"
                                        placeholder="0"
                                        value={daysToExpire}
                                        disabled={isSubmitting}
                                        onChange={(e) => handleDaysToExpireChange(e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 group-focus-within:border-brand-500/50 text-slate-900 dark:text-white text-sm font-bold rounded-xl focus:ring-4 focus:ring-brand-500/10 block p-4 pl-12 outline-none transition-all"
                                    />
                                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-brand-400 transition-colors" size={20} />
                                </div>
                                <p className="text-[10px] font-black text-slate-600 uppercase tracking-tighter mt-2 ml-1">Lapsos de vencimiento</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Section 3: Soportes y Notas */}
                <section className={`glass-card p-8 transition-all duration-500 ${initialData?.status === PaymentStatus.REJECTED ? 'border-red-500/30' : ''}`}>
                    <h2 className="label-caps mb-8 flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"></div>
                        Soportes y Notas
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        {/* File Upload */}
                        <div className="space-y-6">
                             <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-3 ml-1">Comprobante / Recibo Principal</label>
                             <label className={`relative flex flex-col items-center justify-center w-full h-56 border-2 border-dashed rounded-3xl transition-all group overflow-hidden ${
                                 isSubmitting || isFileScanning ? 'cursor-not-allowed opacity-80' : 'cursor-pointer hover:bg-slate-900/40'
                             } ${
                                 file || previewUrl ? 'border-emerald-500/50 bg-emerald-500/5' : 
                                 initialData?.status === PaymentStatus.REJECTED ? 'border-red-500/50 bg-red-500/5 hover:border-red-500' :
                                 errors.file ? 'border-red-500/50 bg-red-500/5' : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 hover:border-slate-700'
                             }`}>
                                 {/* Overlay de Carga de Archivo */}
                                {isFileScanning && (
                                    <div className="absolute inset-0 z-20 bg-white/90 dark:bg-slate-950/90 flex flex-col items-center justify-center backdrop-blur-sm p-6">
                                        <Scan className="w-10 h-10 text-brand-600 dark:text-brand-400 animate-pulse mb-4" />
                                        <span className="text-sm font-black text-brand-600 dark:text-brand-400 uppercase tracking-widest mb-3">Analizando Documento...</span>
                                        <div className="w-full max-w-[240px] bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden shadow-inner">
                                            <div className="bg-brand-500 h-full rounded-full transition-all duration-300 shadow-[0_0_10px_rgba(14,165,233,0.5)]" style={{ width: `${uploadProgress}%` }}></div>
                                        </div>
                                        <span className="text-[10px] font-black text-slate-500 mt-2 uppercase tracking-tighter">{uploadProgress}% Procesado</span>
                                    </div>
                                )}

                                <div className="flex flex-col items-center justify-center w-full h-full p-4">
                                    {file || previewUrl ? (
                                        <div className="w-full h-full relative group/file">
                                            {previewUrl ? (
                                                // Image Preview
                                                <div className="w-full h-full relative p-2">
                                                    <img
                                                        src={previewUrl}
                                                        alt="Preview"
                                                        className="w-full h-full object-contain rounded-2xl shadow-2xl bg-slate-50 dark:bg-slate-950/50"
                                                    />
                                                    <div className="absolute inset-0 m-2 rounded-2xl bg-slate-950/60 opacity-0 group-hover/file:opacity-100 transition-all duration-300 flex items-center justify-center backdrop-blur-sm">
                                                         <button
                                                            onClick={clearFile}
                                                            type="button"
                                                            className="bg-red-500 hover:bg-red-600 text-slate-900 dark:text-white px-6 py-3 rounded-xl font-black uppercase tracking-widest text-xs shadow-xl flex items-center gap-2 transform hover:scale-105 active:scale-95 transition-all"
                                                         >
                                                            <Trash2 size={16} />
                                                            <span>Eliminar</span>
                                                         </button>
                                                    </div>
                                                    <div className="absolute top-4 right-4 bg-emerald-500 text-white p-1.5 rounded-full shadow-lg z-10 pointer-events-none animate-in zoom-in duration-300">
                                                        <CheckCircle2 size={18} />
                                                    </div>
                                                </div>
                                            ) : (
                                                // PDF/File Preview
                                                <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-950/30 rounded-2xl border border-slate-200 dark:border-slate-800">
                                                    <div className="bg-red-500/20 p-5 rounded-2xl mb-4 ring-4 ring-red-500/5 group-hover/file:scale-110 transition-transform duration-300">
                                                        <FileText size={40} className="text-red-500 dark:text-red-400" />
                                                    </div>
                                                    <p className="text-sm font-black text-slate-900 dark:text-white truncate max-w-[240px] mb-1 uppercase tracking-tight">
                                                        {file?.name || 'Documento Adjunto'}
                                                    </p>
                                                    {file && (
                                                      <p className="text-[10px] text-slate-500 font-black uppercase tracking-tighter mb-5 bg-white dark:bg-slate-900 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-800">
                                                          {(file.size / (1024 * 1024)).toFixed(2)} MB
                                                      </p>
                                                    )}
                                                    <button
                                                        onClick={clearFile}
                                                        type="button"
                                                        className="text-red-400 hover:text-red-300 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-red-500/10 px-4 py-2 rounded-xl transition-all"
                                                    >
                                                        <Trash2 size={14} /> Eliminar Adjunto
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <>
                                            <div className={`p-5 rounded-2xl mb-4 transition-all duration-300 group-hover:scale-110 ${errors.file ? 'bg-red-500/20 text-red-400' : 'bg-brand-500/10 text-brand-400'}`}>
                                                <Upload size={32} />
                                            </div>
                                            <p className="mb-1 text-sm text-slate-900 dark:text-white font-black uppercase tracking-tight">Subir Comprobante</p>
                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">PDF, JPG, PNG (Max 5MB)</p>
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
                             {errors.file && <p className="text-red-400 text-[10px] font-black uppercase mt-2 ml-1 tracking-tighter">{errors.file}</p>}

                             <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-3 mt-6 ml-1">Soporte Adicional / Certificación de Pago</label>
                             <label className={`relative flex flex-col items-center justify-center w-full h-56 border-2 border-dashed rounded-3xl transition-all group overflow-hidden ${
                                 isSubmitting || isFileScanning2 ? 'cursor-not-allowed opacity-80' : 'cursor-pointer hover:bg-slate-900/40'
                             } ${
                                 file2 || previewUrl2 ? 'border-brand-500/50 bg-brand-500/5' : 
                                 errors.file2 ? 'border-red-500/50 bg-red-500/5' : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 hover:border-slate-700'
                             }`}>
                                 {/* Overlay de Carga de Archivo */}
                                {isFileScanning2 && (
                                    <div className="absolute inset-0 z-20 bg-white/90 dark:bg-slate-950/90 flex flex-col items-center justify-center backdrop-blur-sm p-6">
                                        <Scan className="w-10 h-10 text-brand-600 dark:text-brand-400 animate-pulse mb-4" />
                                        <span className="text-sm font-black text-brand-600 dark:text-brand-400 uppercase tracking-widest mb-3">Analizando...</span>
                                        <div className="w-full max-w-[240px] bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden shadow-inner">
                                            <div className="bg-brand-500 h-full rounded-full transition-all duration-300 shadow-[0_0_10px_rgba(14,165,233,0.5)]" style={{ width: `${uploadProgress2}%` }}></div>
                                        </div>
                                    </div>
                                )}

                                <div className="flex flex-col items-center justify-center w-full h-full p-4">
                                    {file2 || previewUrl2 ? (
                                        <div className="w-full h-full relative group/file">
                                            {previewUrl2 ? (
                                                <div className="w-full h-full relative p-2">
                                                    <img
                                                        src={previewUrl2}
                                                        alt="Preview 2"
                                                        className="w-full h-full object-contain rounded-2xl shadow-2xl bg-slate-50 dark:bg-slate-950/50"
                                                    />
                                                    <div className="absolute inset-0 m-2 rounded-2xl bg-slate-950/60 opacity-0 group-hover/file:opacity-100 transition-all duration-300 flex items-center justify-center backdrop-blur-sm">
                                                         <button
                                                            onClick={clearFile2}
                                                            type="button"
                                                            className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl font-black uppercase tracking-widest text-xs shadow-xl flex items-center gap-2 transform hover:scale-105 active:scale-95 transition-all"
                                                         >
                                                            <Trash2 size={16} />
                                                            <span>Eliminar</span>
                                                         </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-950/30 rounded-2xl border border-slate-200 dark:border-slate-800">
                                                    <FileText size={40} className="text-red-500" />
                                                    <p className="text-sm font-black text-slate-900 dark:text-white truncate max-w-[240px] mt-2 uppercase tracking-tight">
                                                        {file2?.name || 'Soporte Adicional'}
                                                    </p>
                                                    <button onClick={clearFile2} type="button" className="text-red-400 hover:text-red-300 text-[10px] font-black uppercase mt-4">Eliminar Adjunto</button>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <>
                                            <div className={`p-5 rounded-2xl mb-4 transition-all duration-300 group-hover:scale-110 ${errors.file2 ? 'bg-red-500/20 text-red-400' : 'bg-brand-500/10 text-brand-400'}`}>
                                                <Plus size={32} />
                                            </div>
                                            <p className="mb-1 text-sm text-slate-900 dark:text-white font-black uppercase tracking-tight">Añadir Certificación de Pago</p>
                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">PDF, JPG, PNG (Max 5MB)</p>
                                        </>
                                    )}
                                </div>
                                <input 
                                    type="file" 
                                    className="hidden" 
                                    accept=".pdf,.jpg,.jpeg,.png" 
                                    onChange={handleFileChange2} 
                                    disabled={isSubmitting || isFileScanning2}
                                />
                             </label>
                             {errors.file2 && <p className="text-red-400 text-[10px] font-black uppercase mt-2 ml-1 tracking-tighter">{errors.file2}</p>}

                             {/* Proposed Changes Section */}
                             <div className="mt-8 p-6 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-6 relative overflow-hidden group/prop">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover/prop:opacity-20 transition-opacity">
                                    <RefreshCw size={40} className="text-brand-500" />
                                </div>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-brand-500/20 rounded-lg text-brand-400">
                                        <RefreshCw size={18} />
                                    </div>
                                    <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">Propuesta</h3>
                                </div>
                                
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Nuevo Monto ($)</label>
                                               <input
                                                type="number"
                                                value={proposedAmount || ''}
                                                onChange={(e) => setProposedAmount(Number(e.target.value))}
                                                placeholder="0.00"
                                                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-sm font-black text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-brand-500/10 transition-all"
                                             />
                                             {effectiveExchangeRate !== undefined && (
                                                <div className="mt-3 p-3 bg-slate-100 dark:bg-slate-800/50 border border-brand-500/30 rounded-xl flex items-center gap-3 group/conv transition-all hover:bg-slate-200 dark:hover:bg-slate-800/80 overflow-hidden shadow-inner">
                                                    <div className="p-2 bg-brand-500/20 text-brand-600 dark:text-brand-400 rounded-lg shrink-0">
                                                        <Calculator size={16} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 mb-1">
                                                            <p className="text-[10px] font-black text-brand-600 dark:text-brand-400 uppercase tracking-widest">Equivalente en Bs.</p>
                                                            <p className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase shrink-0 bg-white dark:bg-slate-950/50 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">{docExchangeRate ? 'Histórica' : 'Actual'}</p>
                                                        </div>
                                                        <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1">
                                                            <p className="text-sm sm:text-base font-black text-brand-700 dark:text-brand-300 tabular-nums break-all">
                                                                Bs. {(parseFloat(proposedAmount?.toString() || '0') * effectiveExchangeRate).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                            </p>
                                                            <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 tabular-nums shrink-0">Tasa: {effectiveExchangeRate.toLocaleString('es-VE')}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Nueva Fecha Pago</label>
                                            <input
                                                type="date"
                                                value={proposedPaymentDate || ''}
                                                onChange={(e) => handleProposedPaymentDateChange(e.target.value)}
                                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-sm font-black text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-brand-500/10 transition-all dark:[color-scheme:dark] [color-scheme:light]"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Nuevos Días a Vencer</label>
                                            <input
                                                type="number"
                                                placeholder="0"
                                                value={proposedDaysToExpire ?? ''}
                                                onChange={(e) => handleProposedDaysToExpireChange(e.target.value)}
                                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-sm font-black text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-brand-500/10 transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Nueva Fecha Venc.</label>
                                            <input
                                                type="date"
                                                value={proposedDueDate || ''}
                                                onChange={(e) => handleProposedDueDateChange(e.target.value)}
                                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-sm font-black text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-brand-500/10 transition-all dark:[color-scheme:dark] [color-scheme:light]"
                                            />
                                        </div>
                                    </div>

                                </div>
                             </div>
                        </div>

                        {/* Notes and Support Details */}
                        <div className="flex flex-col space-y-8">
                             {/* Campos adicionales del soporte */}
                             <div className="grid grid-cols-1 gap-6">
                                 <div>
                                     <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-3 ml-1">Nombre del Documento</label>
                                     <div className="relative group">
                                         <input
                                             type="text"
                                             value={docName}
                                             onChange={(e) => setDocName(e.target.value)}
                                             placeholder="Ej: Factura #123"
                                             className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 group-focus-within:border-brand-500/50 text-slate-900 dark:text-white text-sm font-bold rounded-xl p-4 pl-12 outline-none focus:ring-4 focus:ring-brand-500/10 transition-all"
                                         />
                                         <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-brand-400 transition-colors" size={20} />
                                     </div>
                                 </div>
                                 <div className="grid grid-cols-2 gap-6">
                                     <div>
                                         <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-3 ml-1">Fecha Doc.</label>
                                         <div className="relative group">
                                             <input
                                                 type="date"
                                                 value={docDate}
                                                 onChange={(e) => setDocDate(e.target.value)}
                                                 className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 group-focus-within:border-brand-500/50 text-slate-900 dark:text-white text-sm font-bold rounded-xl p-4 pl-12 outline-none focus:ring-4 focus:ring-brand-500/10 transition-all dark:[color-scheme:dark] [color-scheme:light]"
                                             />
                                             <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-brand-400 transition-colors" size={20} />
                                         </div>
                                     </div>
                                     <div>
                                         <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-3 ml-1">Monto Doc. ($)</label>
                                         <div className="relative group">
                                             <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-500 group-focus-within:text-brand-400 font-black transition-colors">$</div>
                                             <input
                                                 type="number"
                                                 value={docAmount}
                                                 onChange={(e) => setDocAmount(e.target.value)}
                                                 placeholder="0.00"
                                                 className="w-full bg-white dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 group-focus-within:border-brand-500/50 text-slate-900 dark:text-white text-sm font-black rounded-xl p-4 pl-10 outline-none focus:ring-4 focus:ring-brand-500/10 transition-all font-mono"
                                             />
                                         </div>
                                         {effectiveExchangeRate !== undefined && (
                                             <div className="mt-3 p-3 bg-slate-100 dark:bg-slate-800/50 border border-emerald-500/30 rounded-xl flex items-center gap-3 group/conv transition-all hover:bg-slate-200 dark:hover:bg-slate-800/80 overflow-hidden shadow-inner">
                                                 <div className="p-2 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg shrink-0">
                                                     <Calculator size={16} />
                                                 </div>
                                                 <div className="flex-1 min-w-0">
                                                     <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 mb-1">
                                                         <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Equivalente en Bs.</p>
                                                         <p className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase shrink-0 bg-white dark:bg-slate-950/50 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">{docExchangeRate ? 'Histórica' : 'Actual'}</p>
                                                     </div>
                                                     <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1">
                                                         <p className="text-sm sm:text-base font-black text-emerald-700 dark:text-emerald-300 tabular-nums break-all">
                                                             Bs. {(parseFloat(docAmount || '0') * effectiveExchangeRate).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                         </p>
                                                         <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 tabular-nums shrink-0">Tasa: {effectiveExchangeRate.toLocaleString('es-VE')}</p>
                                                     </div>
                                                 </div>
                                             </div>
                                         )}
                                     </div>
                                 </div>
                             </div>

                             <div className="flex flex-col flex-1">
                                 <div className="flex items-center justify-between mb-3 px-1">
                                     <label className="block text-xs font-black text-slate-500 uppercase tracking-widest">Observaciones / Notas</label>
                                     <span className={`text-[10px] font-black uppercase tracking-tighter ${notes.length >= 500 ? 'text-red-500' : 'text-slate-400'}`}>
                                         {notes.length} / 500
                                     </span>
                                 </div>
                                 <div className="relative h-full group">
                                     <textarea
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        maxLength={500}
                                        disabled={isSubmitting}
                                        placeholder="Añada notas adicionales para el auditor..."
                                        className="w-full bg-white dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 group-focus-within:border-brand-500/50 text-slate-900 dark:text-slate-200 text-sm font-medium rounded-2xl p-5 outline-none focus:ring-4 focus:ring-brand-500/10 h-full min-h-[240px] resize-none transition-all disabled:opacity-50 leading-relaxed"
                                     ></textarea>
                                     <div className="absolute bottom-4 right-4 text-slate-600 group-focus-within:text-brand-500/50 transition-colors">
                                         <MessageSquare size={20} />
                                     </div>
                                 </div>
                             </div>
                        </div>
                    </div>
                </section>
            </div>

            {/* Right Column: Map (Sticky) */}
            <div className="lg:col-span-4 hidden lg:block">
                <div className="sticky top-8">
                    <div className="glass-card p-4 border-brand-500/20">
                        <VenezuelaMap 
                            stores={dynamicStores} 
                            selectedStoreIds={store && store !== 'NATIONAL' ? [store] : []} 
                            onStoreClick={(id) => setStore(id)}
                        />
                    </div>
                </div>
            </div>
        </div>

        {Object.keys(errors).length > 0 && (
            <div className="flex items-center gap-4 p-5 bg-red-500/5 text-red-400 rounded-2xl border border-red-500/20 animate-in slide-in-from-bottom-2">
                <div className="p-2 bg-red-500/20 rounded-lg">
                    <AlertCircle size={20} className="shrink-0" />
                </div>
                <span className="text-xs font-black uppercase tracking-widest">Hay campos requeridos incompletos o errores. Por favor revise el formulario.</span>
            </div>
        )}

        <div className="pt-8 border-t border-slate-200 dark:border-slate-800/50 flex flex-col-reverse md:flex-row gap-6">
            {!isEmbedded && (
                <button 
                    type="button"
                    onClick={onCancel}
                    disabled={isSubmitting}
                    className="w-full md:w-auto px-10 py-4 bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest text-xs rounded-xl hover:bg-slate-800 hover:text-slate-900 dark:text-white transition-all active:scale-95 disabled:opacity-50"
                >
                    Cancelar
                </button>
            )}
            <button 
                type="submit"
                disabled={isSubmitting || isFileScanning}
                className={`w-full md:flex-1 relative overflow-hidden group/submit ${
                    isOverBudget 
                    ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20' 
                    : 'bg-brand-600 hover:bg-brand-500 shadow-brand-500/20'
                } text-slate-900 dark:text-white font-black uppercase tracking-widest text-sm py-5 rounded-xl shadow-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-3 ${isSubmitting || isFileScanning ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover/submit:translate-x-full transition-transform duration-1000"></div>
                
                {isSubmitting ? (
                    <>
                        <Loader2 size={20} className="animate-spin" />
                        <span>{loadingText || 'Procesando...'}</span>
                    </>
                ) : isFileScanning ? (
                    <>
                         <Loader2 size={20} className="animate-spin" />
                         <span>Escaneando...</span>
                    </>
                ) : (
                    <>
                        <span>{initialData?.status === PaymentStatus.REJECTED ? 'Reenviar Corrección' : 'Enviar a Auditoría'}</span>
                        <CheckCircle2 size={20} className="group-hover/submit:scale-110 transition-transform" />
                    </>
                )}
            </button>
        </div>
      </form>
    </div>
  );
};
