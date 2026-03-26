
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
  AlertCircle,
  Calculator,
  MapPin,
  FileText,
  DollarSign,
  Loader2,
  Trash2,
  Scan,
  RefreshCw,
  MessageSquare,
  AlertTriangle,
  Clock,
  FileWarning,
  Users
} from 'lucide-react';
import { Category, Payment, PaymentStatus, User } from '../types';
import { formatDate } from '../src/utils';
import { STORES } from '../constants';
import VenezuelaMap from './VenezuelaMap';
import { useExchangeRate } from '../contexts/ExchangeRateContext';
import { api } from '../services/api';

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
      { code: '2.4.1', name: 'OTRO IMPUESTO NACIONAL', isVariable: true },
    ]
  }
};

const HUMAN_RESOURCES_CONFIG: Record<string, { label: string; deadlineDay: number; items: { code: string; name: string; amount?: number; isVariable?: boolean }[] }> = {
  'PASIVOS_LABORALES': {
    label: 'PASIVOS LABORALES Y CONTRIBUCIONES',
    deadlineDay: 30,
    items: [
      { code: 'HR.1', name: 'CONTRIBUCION PARAFISCAL (INCES)', isVariable: true },
      { code: 'HR.2', name: 'CONTRIBUCION PARAFISCAL (IVSS)', isVariable: true },
      { code: 'HR.3', name: 'CONTRIBUCION PARAFISCAL (FAOV)', isVariable: true },
      { code: 'HR.4', name: 'PAGO DE NÓMINA', isVariable: true },
      { code: 'HR.5', name: 'PRESTACIONES SOCIALES', isVariable: true },
      { code: 'HR.6', name: 'OTROS PASIVOS LABORALES', isVariable: true },
    ]
  }
};

const OBJECT_TAX_CONFIG: Record<string, { label: string; deadlineDay: number; items: { code: string; name: string; amount?: number; isVariable?: boolean }[] }> = {
  'SENCAMER_CERT': {
    label: '2.1 CERTIFICADO DE SENCAMER (REM 36357)',
    deadlineDay: 30,
    items: [
      { code: '2.1.1', name: 'CONSTANCIA DE REGISTRO', isVariable: true },
      { code: '2.1.2', name: 'PAGO DE RENOVACION REM', isVariable: true },
      { code: '2.1.3', name: 'CERTIFICADO REM', isVariable: true },
    ]
  },
  'SENCAMER_CPE': {
    label: '2.2 CPE SENCAMER',
    deadlineDay: 30,
    items: [
      { code: '2.2.1', name: 'PAGO DE ARANCELES', isVariable: true },
      { code: '2.2.2', name: 'CONSTANCIA DE VERIFICACION DE PRODUCTO', isVariable: true },
      { code: '2.2.3', name: 'SOLVENCIA DEL PRODUCTO', isVariable: true },
    ]
  },
  'RACDA': {
    label: '2.3 REGISTRO DE ACTIVIDADES CAPACES DE DEGRADAR EL AMBIENTE (RACDA)',
    deadlineDay: 30,
    items: [
      { code: '2.3.1', name: 'LICENCIA RACDA', isVariable: true },
      { code: '2.3.2', name: 'PAGOS DEL PROFESIONAL PARA DECLARACION EFLUENTES', isVariable: true },
      { code: '2.3.3', name: 'DECLARACION EFLUENTES', isVariable: true },
      { code: '2.3.4', name: 'DISPOSICION FINAL (ANUAL) INFORME', isVariable: true },
    ]
  },
  'SOLVENCIA_AMBIENTAL': {
    label: '2.4 SOLVENCIA POLICIAL NACIONAL AMBIENTAL',
    deadlineDay: 30,
    items: [
      { code: '2.4.1', name: 'ACTA DE SOLVENCIA', isVariable: true },
    ]
  },
  'DISPOSICION_FINAL': {
    label: '2.5 EMPRESA DE DISPOSICION FINAL',
    deadlineDay: 30,
    items: [
      { code: '2.5.1', name: 'CONTRATO EMPRESA DISPOSICION FINAL', isVariable: true },
      { code: '2.5.2', name: 'RETIRO DE DESECHOS', isVariable: true },
    ]
  },
  'POLIZA_SEGURO': {
    label: '2.7 POLIZA DE SEGURO FABRICA (RESPONSABILIDAD CIVIL GENERAL)',
    deadlineDay: 30,
    items: [
      { code: '2.7.1', name: 'PAGO DE ARANCELES', isVariable: true },
      { code: '2.7.2', name: 'POLIZA', isVariable: true },
    ]
  },
  'SAPI': {
    label: '2.8 SERVICIO AUTONOMO DE LA PROPIEDAD INTELECTUAL (SAPI)',
    deadlineDay: 30,
    items: [
      { code: '2.8.1', name: 'SAPI (MARCA)', isVariable: true },
      { code: '2.8.2', name: 'SAPI (LOGO)', isVariable: true },
    ]
  }
};

const INSTITUTIONS_TAX_CONFIG: Record<string, { label: string; deadlineDay: number; items: { code: string; name: string; amount?: number; isVariable?: boolean }[] }> = {
  'SNC': {
    label: '3.1 SERVICIO NACIONAL DE CONTRATISTA (SNC)',
    deadlineDay: 30,
    items: [
      { code: '3.1.1', name: 'EXPEDIENTE CONTABLE', isVariable: true },
      { code: '3.1.2', name: 'PAGO DE ARANCEL', isVariable: true },
      { code: '3.1.3', name: 'CERTIFICADO', isVariable: true },
    ]
  },
  'RUPDAE': {
    label: '3.2 RUPDAE',
    deadlineDay: 30,
    items: [
      { code: '3.2.1', name: 'INSCRIPCION', isVariable: true },
      { code: '3.2.2', name: 'ARANCEL', isVariable: true },
    ]
  },
  'FONACIT': {
    label: '3.3 FONACIT',
    deadlineDay: 30,
    items: [
      { code: '3.3.1', name: 'DECLARACION', isVariable: true },
      { code: '3.3.2', name: 'PAGO', isVariable: true },
    ]
  },
  'FONA': {
    label: '3.4 FONA',
    deadlineDay: 30,
    items: [
      { code: '3.4.1', name: 'DECLARACION', isVariable: true },
      { code: '3.4.2', name: 'PAGO', isVariable: true },
    ]
  },
  'FONDO_DEPORTE': {
    label: '3.5 FONDO DE DEPORTE',
    deadlineDay: 30,
    items: [
      { code: '3.5.1', name: 'DECLARACION', isVariable: true },
      { code: '3.5.2', name: 'PAGO', isVariable: true },
    ]
  },
  'INSALUD': {
    label: '3.6 PERMISOS SANITARIO (INSALUD)',
    deadlineDay: 30,
    items: [
      { code: '3.6.1', name: 'CERTIFICADO DE FUMIGACION', isVariable: true },
      { code: '3.6.2', name: 'CERTIFICADO DE LIMPIEZA DE TANQUES', isVariable: true },
      { code: '3.6.3', name: 'CERTIFICADO DE DESRATIZACION', isVariable: true },
      { code: '3.6.4', name: 'PERMISO SANITARIO', isVariable: true },
    ]
  }
};

const TRANSPORT_TAX_CONFIG: Record<string, { label: string; deadlineDay: number; items: { code: string; name: string; amount?: number; isVariable?: boolean }[] }> = {
  'CHOFER': {
    label: '5.1 DOCUMENTOS DEL CHOFER',
    deadlineDay: 30,
    items: [
      { code: '5.1.1', name: 'CEDULA DE IDENTIDAD', isVariable: true },
      { code: '5.1.2', name: 'CARNET DE CIRCULACION', isVariable: true },
      { code: '5.1.3', name: 'CERTIFICADO DE SABERES', isVariable: true },
      { code: '5.1.4', name: 'LICENCIA DE CONDUCIR', isVariable: true },
      { code: '5.1.5', name: 'CERTIFICADO MEDICO', isVariable: true },
    ]
  },
  'VEHICULO': {
    label: '5.2 DOCUMENTOS DEL VEHICULO',
    deadlineDay: 30,
    items: [
      { code: '5.2.1', name: 'TITULO DE PROPIEDAD', isVariable: true },
      { code: '5.2.2', name: 'CARNET DE CIRCULACION', isVariable: true },
      { code: '5.2.3', name: 'SEGURO (RCV)', isVariable: true },
      { code: '5.2.4', name: 'IMPUESTO TRIMESTRAL', isVariable: true },
      { code: '5.2.5', name: 'ROTC', isVariable: true },
      { code: '5.2.6', name: 'FLOTA VEHICULAR ROCT', isVariable: true },
      { code: '5.2.7', name: 'RACDA TRANSPORTE', isVariable: true },
      { code: '5.2.8', name: 'GPS', isVariable: true },
    ]
  },
  'MANTENIMIENTO': {
    label: '5.3 KILOMETRO MANTENIMIENTO',
    deadlineDay: 30,
    items: [
      { code: '5.3.1', name: 'FLUIDOS', isVariable: true },
      { code: '5.3.2', name: 'FILTROS', isVariable: true },
      { code: '5.3.3', name: 'CAUCHOS', isVariable: true },
      { code: '5.3.4', name: 'FRENOS', isVariable: true },
    ]
  }
};

const SENIAT_DECLARATIONS_TAX_CONFIG: Record<string, { label: string; deadlineDay: number; items: { code: string; name: string; amount?: number; isVariable?: boolean }[] }> = {
  'DECLARACIONES': {
    label: '7 SENIAT DECLARACIONES Y CONTABILIDAD',
    deadlineDay: 15,
    items: [
      { code: '7.1', name: 'LIBRO DE COMPRA', isVariable: true },
      { code: '7.2.1', name: 'LIBRO DE VENTA - CODIGO 1', isVariable: true },
      { code: '7.2.2', name: 'LIBRO DE VENTA - CODIGO 2', isVariable: true },
      { code: '7.2.3', name: 'LIBRO DE VENTA - CODIGO 3', isVariable: true },
      { code: '7.2.4', name: 'LIBRO DE VENTA - TOTAL', isVariable: true },
      { code: '7.3', name: 'DECLARACION DE IVA', isVariable: true },
      { code: '7.4', name: 'DECLARACION DE IVA RET', isVariable: true },
      { code: '7.5', name: 'DECLARACION DE ANT ISLR', isVariable: true },
      { code: '7.6', name: 'DECLARACION DE IGTF', isVariable: true },
      { code: '7.7', name: 'DECLARACION DE ISLR RETENIDO', isVariable: true },
      { code: '7.8', name: 'DECLARACION DE FONDO DE PENSIONES', isVariable: true },
      { code: '7.9', name: 'CARPETA CONTABLE', isVariable: true },
      { code: '7.10', name: 'HONORARIOS', isVariable: true },
      { code: '7.11', name: 'DECLARACION DE IGP', isVariable: true },
      { code: '7.12', name: 'DECLARACION DE ISLR', isVariable: true },
    ]
  }
};

const SENIAT_BOOKS_TAX_CONFIG: Record<string, { label: string; deadlineDay: number; items: { code: string; name: string; amount?: number; isVariable?: boolean }[] }> = {
  'LIBROS': {
    label: '8 SENIAT LIBROS',
    deadlineDay: 30,
    items: [
      { code: '8.1', name: 'LIBRO MAYOR', isVariable: true },
      { code: '8.2', name: 'LIBRO DE INVENTARIO', isVariable: true },
      { code: '8.3', name: 'LIBRO DE ACTAS', isVariable: true },
      { code: '8.4', name: 'LIBRO DE COMPRA', isVariable: true },
      { code: '8.5', name: 'LIBRO DE VENTA', isVariable: true },
    ]
  }
};

const SYSTEMS_TAX_CONFIG: Record<string, { label: string; deadlineDay: number; items: { code: string; name: string; amount?: number; isVariable?: boolean }[] }> = {
  'SISTEMAS': {
    label: '9 SISTEMAS, MARKETING Y OFICINAS',
    deadlineDay: 30,
    items: [
      { code: '9.1', name: 'SERVIDOR', isVariable: true },
      { code: '9.2', name: 'RED', isVariable: true },
      { code: '9.3', name: 'SOFTWARE ADMINISTRATIVO', isVariable: true },
      { code: '9.4', name: 'SOFTWARE CONTABLE', isVariable: true },
      { code: '9.5', name: 'PROGRAMA (GASTOS FIJOS)', isVariable: true },
      { code: '9.6', name: 'PAGINA WEB', isVariable: true },
      { code: '9.7', name: 'PUBLICIDAD (DISEÑADOR)', isVariable: true },
      { code: '9.8', name: 'MARKETING (REDES SOCIALES)', isVariable: true },
      { code: '9.9', name: 'CONTROL DE DAÑOS', isVariable: true },
      { code: '9.10', name: 'PAPELERIA DE OFICINA EN GENERAL', isVariable: true },
      { code: '9.11', name: 'MOBILIARIO', isVariable: true },
    ]
  }
};

interface PaymentFormProps {
  onSubmit: (data: any) => Promise<void> | void;
  onCancel: () => void;
  initialData?: Payment | null;
  payments: Payment[];
  isEmbedded?: boolean;
  currentUser?: User | null;
}

export const PaymentForm: React.FC<PaymentFormProps> = ({ onSubmit, onCancel, initialData, payments, isEmbedded = false, currentUser }) => {
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
  const [specificType, setSpecificType] = React.useState(initialData?.specificType || '');
  
  // Archivos
  const [file, setFile] = React.useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(initialData?.receiptUrl || null);

  // --- Justification State ---
  const [isOverBudget, setIsOverBudget] = React.useState(initialData?.isOverBudget || false);
  const [showJustificationModal, setShowJustificationModal] = React.useState(false);
  const [justificationNote, setJustificationNote] = React.useState(initialData?.justification || '');
  const [justificationFile, setJustificationFile] = React.useState<File | null>(null);
  const [justificationPreviewUrl, setJustificationPreviewUrl] = React.useState<string | null>(initialData?.justificationFileUrl || null);
  const [justificationConfirmed, setJustificationConfirmed] = React.useState(!!initialData?.justification);
  const [manualOverBudget, setManualOverBudget] = React.useState(false);

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
      setAmount(initialData.amount?.toString() || '');
      setExpectedBudget(initialData.originalBudget || null);
      setDueDate(initialData.dueDate || '');
      setPaymentDate(initialData.paymentDate || new Date().toISOString().split('T')[0]);
      setDaysToExpire(initialData.daysToExpire?.toString() || '');
      setSpecificType(initialData.specificType || '');
      setPreviewUrl(initialData.receiptUrl || null);
      setIsOverBudget(initialData.isOverBudget || false);
      setJustificationNote(initialData.justification || '');
      setJustificationPreviewUrl(initialData.justificationFileUrl || null);
      setJustificationConfirmed(!!initialData.justification);
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
      setSpecificType('');
      setPreviewUrl(null);
      setIsOverBudget(false);
      setJustificationNote('');
      setJustificationPreviewUrl(null);
      setJustificationConfirmed(false);
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
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setSpecificType('');
    setFile(null);
    setPreviewUrl(null);
    setIsOverBudget(false);
    setJustificationNote('');
    setJustificationFile(null);
    setJustificationConfirmed(false);
    setManualOverBudget(false);
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

  const getTaxConfig = (cat: Category | '') => {
    switch (cat) {
      case Category.MUNICIPAL_TAX: return MUNICIPAL_TAX_CONFIG;
      case Category.NATIONAL_TAX: return NATIONAL_TAX_CONFIG;
      case Category.OBJECT: return OBJECT_TAX_CONFIG;
      case Category.INSTITUTIONS: return INSTITUTIONS_TAX_CONFIG;
      case Category.TRANSPORT: return TRANSPORT_TAX_CONFIG;
      case Category.SENIAT_DECLARATIONS: return SENIAT_DECLARATIONS_TAX_CONFIG;
      case Category.SENIAT_BOOKS: return SENIAT_BOOKS_TAX_CONFIG;
      case Category.SYSTEMS: return SYSTEMS_TAX_CONFIG;
      case Category.PAYROLL: return HUMAN_RESOURCES_CONFIG;
      default: return null;
    }
  };

  React.useEffect(() => {
    const config = getTaxConfig(category);
    const isTaxCategory = !!config;

    if (isTaxCategory && config && taxGroup && taxItem) {
      const groupData = config[taxGroup];
      const itemData = groupData?.items?.find(i => i.code === taxItem);
      
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

  // Sync daysToExpire when paymentDate changes
  const handlePaymentDateChange = React.useCallback((val: string) => {
    setPaymentDate(val);
    if (val && dueDate) {
      const d1 = new Date(val);
      const d2 = new Date(dueDate);
      const diffTime = d1.getTime() - d2.getTime(); // paymentDate - dueDate
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setDaysToExpire(diffDays.toString());
    }
  }, [dueDate]);

  // Sync paymentDate or daysToExpire when dueDate changes
  const handleDueDateChange = React.useCallback((val: string) => {
    setDueDate(val);
    if (val && daysToExpire) {
      const days = parseInt(daysToExpire);
      if (!isNaN(days)) {
        const d = new Date(val);
        d.setDate(d.getDate() + days); // Add days instead of subtract
        const formatted = d.toISOString().split('T')[0];
        setPaymentDate(formatted);
      }
    } else if (val && paymentDate) {
      const d1 = new Date(paymentDate);
      const d2 = new Date(val);
      const diffTime = d1.getTime() - d2.getTime(); // paymentDate - dueDate
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setDaysToExpire(diffDays.toString());
    }
  }, [daysToExpire, paymentDate]);

  // Sync paymentDate when daysToExpire changes manually
  const handleDaysToExpireChange = React.useCallback((val: string) => {
    setDaysToExpire(val);
    if (val && dueDate) {
      const days = parseInt(val);
      if (!isNaN(days)) {
        const d = new Date(dueDate);
        d.setDate(d.getDate() + days); // Add days instead of subtract
        const formatted = d.toISOString().split('T')[0];
        setPaymentDate(formatted);
      }
    }
  }, [dueDate]);

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
    // Usar el monto del documento si está presente, de lo contrario el monto principal
    const effectiveAmount = docAmount ? parseFloat(docAmount) : parseFloat(amount);
    
    if (isCurrentTaxItemVariable) {
        // For variable items, only manual flag determines over budget
        setIsOverBudget(manualOverBudget);
        if (!manualOverBudget) {
            setJustificationConfirmed(false);
        }
    } else if (expectedBudget !== null && !isNaN(effectiveAmount)) {
        // For fixed items, compare amount to budget
        if (effectiveAmount > expectedBudget) {
            setIsOverBudget(true);
        } else {
            setIsOverBudget(false);
            setJustificationConfirmed(false); // Reset if back to normal
        }
    } else {
        setIsOverBudget(false);
    }
  }, [amount, docAmount, expectedBudget, manualOverBudget, isCurrentTaxItemVariable]);


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
    const storesToProcess = currentUser?.storeId ? STORES.filter(s => s.id === currentUser.storeId) : STORES;
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
  }, [payments, currentUser]);

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
          const result = await api.getExchangeRateByDate(docDate);
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

  // --- LOGICA SEMÁFORO FISCAL ---
  const getTaxStatus = (deadlineDay: number) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const year = today.getFullYear();
    const month = today.getMonth();
    
    // Obtener el último día del mes actual para ajustar si el deadlineDay es mayor (ej. Feb 28 vs 30)
    const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
    const actualDeadlineDay = Math.min(deadlineDay, lastDayOfMonth);
    
    const deadlineDate = new Date(year, month, actualDeadlineDay);
    
    // Calcular diferencia en días
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { 
        color: 'bg-red-500', 
        text: 'text-red-600', 
        bgSoft: 'bg-red-100', 
        status: 'Vencido', 
        icon: AlertCircle 
      };
    } else if (diffDays <= 5) {
      return { 
        color: 'bg-amber-500', 
        text: 'text-amber-600', 
        bgSoft: 'bg-amber-100', 
        status: 'Próximo', 
        icon: Clock 
      };
    } else {
      return { 
        color: 'bg-emerald-500', 
        text: 'text-emerald-600', 
        bgSoft: 'bg-emerald-100', 
        status: 'En fecha', 
        icon: CheckCircle2 
      };
    }
  };

  const taxStatusList = React.useMemo(() => {
    const config = getTaxConfig(category);
    if (!config) return [];
    return Object.entries(config).map(([key, config]) => {
        const status = getTaxStatus(config.deadlineDay);
        return { key, label: config.label, ...status };
    });
  }, [category]);

  const specificItemStatusList = React.useMemo(() => {
    const configMap = getTaxConfig(category);
    if (!configMap || !taxGroup) return [];
    const groupConfig = configMap[taxGroup];
    if (!groupConfig) return [];

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return groupConfig.items.map(item => {
      // Verificar si ya existe un pago para este concepto en esta tienda para el mes actual
      const existingPayment = payments.find(p => {
        const pDate = new Date(p.dueDate);
        return p.storeId === store && 
               p.category === category && 
               p.specificType.startsWith(item.code) &&
               pDate.getMonth() === currentMonth &&
               pDate.getFullYear() === currentYear &&
               (p.status === PaymentStatus.APPROVED || p.status === PaymentStatus.PENDING || p.status === PaymentStatus.UPLOADED)
      });

      if (existingPayment) {
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
      return { ...item, ...status };
    });
  }, [category, taxGroup, payments, store]);

  const globalStatus = React.useMemo(() => {
    if (taxStatusList.some(i => i.status === 'Vencido')) return { color: 'bg-red-500', border: 'border-red-200', text: 'text-red-700', bg: 'bg-red-50', label: 'ACCIONES REQUERIDAS (VENCIDO)' };
    if (taxStatusList.some(i => i.status === 'Próximo')) return { color: 'bg-amber-500', border: 'border-amber-200', text: 'text-amber-700', bg: 'bg-amber-50', label: 'ATENCIÓN (PRÓXIMOS)' };
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

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!store) newErrors.store = "La tienda es obligatoria";
    if (!category) newErrors.category = "La categoría es obligatoria";
    const isTaxCategory = !!getTaxConfig(category);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    if (isFileScanning) return; 

    // ** Budget Check Interception **
    if (isOverBudget && !justificationConfirmed) {
        setShowJustificationModal(true);
        return;
    }

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
            amount: parseFloat(amount),
            dueDate,
            paymentDate,
            daysToExpire: daysToExpire ? parseInt(daysToExpire) : undefined,
            specificType,
            file,
            notes,
            // Extra Data
            originalBudget: expectedBudget,
            isOverBudget,
            justification: justificationNote,
            justificationFile: justificationFile,
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
            proposedStatus: proposedAmount || proposedPaymentDate || proposedDueDate ? 'PENDING_APPROVAL' : undefined
        });
        resetForm();
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
    if (isCurrentTaxItemVariable && manualOverBudget && !justificationFile && !justificationPreviewUrl) {
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
    <div className="p-6 lg:p-10 w-full max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
      
      {/* --- JUSTIFICATION MODAL --- */}
      {showJustificationModal && (
          <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
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
                                  ) : justificationPreviewUrl ? (
                                      <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-sm">
                                          <FileText size={16} />
                                          <span className="truncate max-w-[150px]">Documento previo</span>
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
                                    onChange={(e) => {
                                      setJustificationFile(e.target.files?.[0] || null);
                                      if (e.target.files?.[0]) setJustificationPreviewUrl(null);
                                    }}
                                  />
                              </label>
                              {(justificationFile || justificationPreviewUrl) && (
                                  <button 
                                    onClick={() => {
                                      setJustificationFile(null);
                                      setJustificationPreviewUrl(null);
                                    }} 
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
      {/* Top Banner for Rejected Payments */}
      {initialData?.status === PaymentStatus.REJECTED && (
        <div className="mb-6 -mx-6 -mt-6 p-3 bg-red-600 text-white text-center text-xs font-bold uppercase tracking-[0.2em] rounded-t-2xl flex items-center justify-center gap-2">
          <AlertTriangle size={14} />
          Atención: Este pago requiere correcciones inmediatas
          <AlertTriangle size={14} />
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
                  <h3 className="text-xl font-black text-white uppercase tracking-tight">Motivo de la Devolución</h3>
                </div>
                <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{formatDate(new Date())}</span>
              </div>
              <div className="relative">
                <p className="text-slate-300 text-lg font-serif italic leading-relaxed pl-4 border-l-2 border-slate-800">
                  "{initialData.rejectionReason}"
                </p>
              </div>
              <div className="mt-8 pt-6 border-t border-slate-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div className="lg:col-span-4 space-y-6">
                    <div>
                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-3 ml-1">Sucursal / Tienda</label>
                        <div className="relative group">
                            <select 
                                value={store}
                                onChange={(e) => setStore(e.target.value)}
                                disabled={isSubmitting}
                                className={`w-full appearance-none bg-slate-950/50 border ${errors.store ? 'border-red-500/50 ring-1 ring-red-500/20' : 'border-slate-800 group-focus-within:border-brand-500/50'} text-white text-sm font-bold rounded-xl focus:ring-4 focus:ring-brand-500/10 block p-4 pl-12 transition-all outline-none disabled:opacity-50 cursor-pointer`}
                            >
                                <option value="" className="bg-slate-900">Seleccionar ubicación...</option>
                                {category === Category.PAYROLL && !currentUser?.storeId && (
                                    <option value="NATIONAL" className="bg-slate-900">Nacional (Cobertura Nacional)</option>
                                )}
                                {(currentUser?.storeId ? STORES.filter(s => s.id === currentUser.storeId) : STORES).map(s => (
                                    <option key={s.id} value={s.id} className="bg-slate-900">{s.name}</option>
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
                                <p className="text-xs text-slate-400 font-medium leading-relaxed">
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

                <div className="lg:col-span-8">
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
                            return (
                                <button
                                    key={cat.id}
                                    type="button"
                                    disabled={isSubmitting}
                                    onClick={() => setCategory(cat.id)}
                                    className={`relative flex flex-col items-center justify-center gap-3 p-4 rounded-2xl border-2 transition-all duration-300 group ${
                                        isSelected 
                                        ? 'border-brand-500 bg-brand-500/10 text-white shadow-[0_0_20px_rgba(14,165,233,0.15)]' 
                                        : 'border-slate-800 bg-slate-900/50 text-slate-500 hover:border-slate-700 hover:bg-slate-800'
                                    } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    <div className={`p-2.5 rounded-xl transition-all duration-300 ${isSelected ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20 scale-110' : 'bg-slate-800 text-slate-500 group-hover:bg-slate-700 group-hover:text-slate-300'}`}>
                                        <Icon size={20} />
                                    </div>
                                    <span className={`text-[11px] font-black uppercase tracking-tighter transition-colors ${isSelected ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'}`}>{cat.label}</span>
                                    {isSelected && (
                                        <div className="absolute top-2 right-2 text-brand-400 animate-in zoom-in duration-300">
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

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7 space-y-8">
                {/* Dynamic Tax Section with Traffic Light */}
                {!!getTaxConfig(category) && (
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
                        
                        <div className="grid grid-cols-1">
                            {/* Selector de Rubro */}
                            <div className="p-4 border-b border-slate-200 dark:border-slate-700/50 bg-white/50 dark:bg-slate-900/50">
                                <label className="text-xs font-bold text-slate-500 uppercase mb-3 block">Seleccione Rubro a Pagar</label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[200px] overflow-y-auto custom-scrollbar pr-1">
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
                                                <span className={`text-[11px] font-medium ${taxGroup === item.key ? 'text-blue-700 dark:text-blue-300' : 'text-slate-600 dark:text-slate-300'}`}>
                                                    {item.label.split(' ')[1]} {item.label.split(' ')[2]}...
                                                </span>
                                            </div>
                                            <div className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-1 ${item.bgSoft} ${item.text}`}>
                                                <item.icon size={8} />
                                                <span className="hidden sm:inline">{item.status}</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Selector de Concepto Específico */}
                            <div className="p-6 flex flex-col justify-center bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
                                <div className="space-y-4">
                                    <div className="space-y-3">
                                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase ml-1">Concepto Específico</label>
                                        
                                        {!taxGroup ? (
                                            <div className="p-8 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center text-center">
                                                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-full mb-3">
                                                    <ChevronDown className="text-slate-400 rotate-90" size={24} />
                                                </div>
                                                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                                                    Seleccione un rubro a la izquierda para ver los conceptos específicos
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-1 animate-in fade-in slide-in-from-bottom-2">
                                                {specificItemStatusList.map((item) => (
                                                    <button
                                                        key={item.code}
                                                        type="button"
                                                        disabled={isSubmitting}
                                                        onClick={() => setTaxItem(item.code)}
                                                        className={`w-full flex flex-col p-3 rounded-xl border transition-all text-left group relative ${
                                                            taxItem === item.code 
                                                            ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-500 ring-1 ring-blue-500/20 shadow-md' 
                                                            : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:border-blue-300 dark:hover:border-slate-600'
                                                        }`}
                                                    >
                                                        <div className="flex items-center justify-between mb-2">
                                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.bgSoft} ${item.text} flex items-center gap-1`}>
                                                                <item.icon size={10} />
                                                                {item.status}
                                                            </span>
                                                            <span className="text-[10px] font-mono text-slate-400">{item.code}</span>
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className={`text-xs font-bold leading-tight mb-1 ${taxItem === item.code ? 'text-blue-700 dark:text-blue-300' : 'text-slate-700 dark:text-slate-200'}`}>
                                                                {item.name}
                                                            </span>
                                                            {item.amount !== undefined && (
                                                                <span className="text-[10px] font-bold text-blue-500">
                                                                    ${item.amount.toLocaleString()}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className={`absolute top-2 right-2 w-2 h-2 rounded-full ${item.color} ${item.status === 'Vencido' ? 'animate-pulse' : ''}`}></div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                        
                                        {errors.taxItem && <p className="text-red-500 text-xs ml-1 font-bold">{errors.taxItem}</p>}
                                        
                                        {taxItem && (
                                            <div className="mt-4 animate-in zoom-in-95 duration-200">
                                                <TaxInfoSearch category={category} taxItem={taxItem} />
                                            </div>
                                        )}
                                    </div>

                                    <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
                                        <div className="flex gap-2">
                                            <AlertCircle size={14} className="mt-0.5 text-blue-500" />
                                            <p>
                                                Seleccione el rubro en la lista de arriba para ver su estado actual. 
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
                <section className={`glass-card p-8 transition-all duration-500 ${initialData?.status === PaymentStatus.REJECTED ? 'border-red-500/30' : ''}`}>
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
                                    <span className="text-[10px] font-black text-brand-400 uppercase tracking-widest block mb-1">Municipio / Alcaldía</span>
                                    <p className="text-sm font-bold text-white">{storeMunicipality || 'No especificado'}</p>
                                </div>
                                <div>
                                    <span className="text-[10px] font-black text-brand-400 uppercase tracking-widest block mb-1">Dirección de Sucursal</span>
                                    <p className="text-xs text-slate-400 italic leading-relaxed">{storeAddress || 'No especificada'}</p>
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
                                    className={`w-full bg-slate-950/50 border ${errors.specificType ? 'border-red-500/50 ring-1 ring-red-500/20' : 'border-slate-800 group-focus-within:border-brand-500/50'} text-white text-sm font-bold rounded-xl focus:ring-4 focus:ring-brand-500/10 block p-4 pl-12 outline-none transition-all ${(!!getTaxConfig(category) && !isManualOverride) ? 'opacity-70 cursor-not-allowed' : ''} disabled:opacity-50`}
                                />
                                <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-brand-400 transition-colors" size={20} />
                            </div>
                            {errors.specificType && <p className="text-red-400 text-[10px] font-black uppercase mt-2 ml-1 tracking-tighter">{errors.specificType}</p>}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                            {/* Amount */}
                            <div className="md:col-span-1">
                                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-3 ml-1">Monto Total ($)</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-500 group-focus-within:text-brand-400 font-black transition-colors">$</div>
                                    <input
                                        type="number"
                                        step="0.01"
                                        placeholder="0.00"
                                        value={amount}
                                        readOnly={!isManualOverride}
                                        onChange={(e) => setAmount(e.target.value)}
                                        className={`w-full ${!isManualOverride ? 'bg-slate-900/50 cursor-not-allowed' : 'bg-slate-950/50'} border ${
                                            isOverBudget 
                                                ? 'border-amber-500/50 ring-2 ring-amber-500/10' 
                                                : errors.amount ? 'border-red-500/50' : 'border-slate-800 group-focus-within:border-brand-500/50'
                                        } text-white text-sm font-black rounded-xl focus:ring-4 focus:ring-brand-500/10 block pl-10 p-4 outline-none font-mono transition-all`}
                                    />
                                    {isOverBudget && (
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-amber-500 animate-pulse" title="Excede Presupuesto">
                                            <AlertTriangle size={20} />
                                        </div>
                                    )}
                                </div>
                                {errors.amount && <p className="text-red-400 text-[10px] font-black uppercase mt-2 ml-1 tracking-tighter">{errors.amount}</p>}
                                
                                {effectiveExchangeRate !== undefined && (
                                    <div className="mt-3 p-3 bg-slate-900/50 border border-emerald-500/20 rounded-xl flex items-center justify-between group/conv transition-all hover:bg-slate-900/80">
                                        <div className="flex items-center gap-3">
                                            <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg shadow-sm group-hover/conv:scale-110 transition-transform">
                                                <Calculator size={14} />
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-black text-emerald-500/60 uppercase tracking-widest leading-none mb-0.5">Equivalente en Bs.</p>
                                                <p className="text-sm font-black text-emerald-400 tabular-nums">
                                                    Bs. {(parseFloat(amount || '0') * effectiveExchangeRate).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-[9px] font-black text-slate-600 uppercase tracking-tighter text-right leading-tight">
                                            Tasa: {effectiveExchangeRate.toLocaleString('es-VE')} <br/>
                                            {docExchangeRate ? 'HISTÓRICA' : 'ACTUAL'}
                                        </div>
                                    </div>
                                )}

                                {isOverBudget && (
                                    <div className="mt-4 p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                        <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={18} />
                                        <div className="text-[11px] text-amber-200/80 font-medium leading-relaxed">
                                            <p className="font-black mb-1 uppercase tracking-widest text-amber-400">Excedente de Presupuesto</p>
                                            Excede por ${ (parseFloat(amount || '0') - (expectedBudget || 0)).toLocaleString() } (Bs. { ((parseFloat(amount || '0') - (expectedBudget || 0)) * effectiveExchangeRate).toLocaleString('es-VE', { minimumFractionDigits: 2 }) }). Se requerirá justificación.
                                        </div>
                                    </div>
                                )}

                                {justificationConfirmed && (
                                    <p className="text-emerald-400 text-[10px] font-black uppercase mt-2 flex items-center gap-1 ml-1">
                                        <CheckCircle2 size={12} /> Justificación añadida
                                    </p>
                                )}

                                {isCurrentTaxItemVariable && (
                                    <div className="mt-4 p-4 bg-slate-900/50 rounded-2xl flex items-center gap-4 border border-slate-800 transition-colors hover:border-slate-700">
                                        <input
                                            type="checkbox"
                                            id="manualOverBudget"
                                            checked={manualOverBudget}
                                            onChange={(e) => setManualOverBudget(e.target.checked)}
                                            className="h-5 w-5 rounded border-slate-700 bg-slate-950 text-brand-500 focus:ring-brand-500/50 shrink-0 cursor-pointer"
                                        />
                                        <label htmlFor="manualOverBudget" className="block text-[10px] text-slate-400 font-bold uppercase tracking-tight cursor-pointer leading-tight">
                                            Marcar como <span className="text-amber-400">excedente presupuestario</span> para solicitar justificación.
                                        </label>
                                    </div>
                                )}
                            </div>

                            {/* Payment Date */}
                            <div>
                                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-3 ml-1">Fecha de Pago</label>
                                <div className="relative group">
                                    <input
                                        type="date"
                                        value={paymentDate}
                                        disabled={isSubmitting}
                                        onChange={(e) => handlePaymentDateChange(e.target.value)}
                                        className={`w-full bg-slate-950/50 border ${errors.paymentDate ? 'border-red-500/50' : 'border-slate-800 group-focus-within:border-brand-500/50'} text-white text-sm font-bold rounded-xl focus:ring-4 focus:ring-brand-500/10 block p-4 pl-12 outline-none transition-all [color-scheme:dark] disabled:opacity-50`}
                                    />
                                    <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-brand-400 transition-colors" size={20} />
                                </div>
                                {errors.paymentDate && <p className="text-red-400 text-[10px] font-black uppercase mt-2 ml-1 tracking-tighter">{errors.paymentDate}</p>}
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
                                        className="w-full bg-slate-950/50 border border-slate-800 group-focus-within:border-brand-500/50 text-white text-sm font-bold rounded-xl focus:ring-4 focus:ring-brand-500/10 block p-4 pl-12 outline-none transition-all"
                                    />
                                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-brand-400 transition-colors" size={20} />
                                </div>
                                <p className="text-[10px] font-black text-slate-600 uppercase tracking-tighter mt-2 ml-1">Lapsos de vencimiento</p>
                            </div>

                            {/* Due Date */}
                            <div>
                                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-3 ml-1">Fecha Vencimiento</label>
                                <div className="relative group">
                                    <input
                                        type="date"
                                        value={dueDate}
                                        disabled={isSubmitting}
                                        onChange={(e) => handleDueDateChange(e.target.value)}
                                        className={`w-full bg-slate-950/50 border ${errors.dueDate ? 'border-red-500/50' : 'border-slate-800 group-focus-within:border-brand-500/50'} text-white text-sm font-bold rounded-xl focus:ring-4 focus:ring-brand-500/10 block p-4 pl-12 outline-none transition-all [color-scheme:dark] disabled:opacity-50`}
                                    />
                                    <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-brand-400 transition-colors" size={20} />
                                </div>
                                {errors.dueDate && <p className="text-red-400 text-[10px] font-black uppercase mt-2 ml-1 tracking-tighter">{errors.dueDate}</p>}
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
                             <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-3 ml-1">Comprobante / Recibo</label>
                             <label className={`relative flex flex-col items-center justify-center w-full h-56 border-2 border-dashed rounded-3xl transition-all group overflow-hidden ${
                                 isSubmitting || isFileScanning ? 'cursor-not-allowed opacity-80' : 'cursor-pointer hover:bg-slate-900/40'
                             } ${
                                 file || previewUrl ? 'border-emerald-500/50 bg-emerald-500/5' : 
                                 initialData?.status === PaymentStatus.REJECTED ? 'border-red-500/50 bg-red-500/5 hover:border-red-500' :
                                 errors.file ? 'border-red-500/50 bg-red-500/5' : 'border-slate-800 bg-slate-950/50 hover:border-slate-700'
                             }`}>
                                
                                {/* Overlay de Carga de Archivo */}
                                {isFileScanning && (
                                    <div className="absolute inset-0 z-20 bg-slate-950/90 flex flex-col items-center justify-center backdrop-blur-sm p-6">
                                        <Scan className="w-10 h-10 text-brand-400 animate-pulse mb-4" />
                                        <span className="text-sm font-black text-brand-400 uppercase tracking-widest mb-3">Analizando Documento...</span>
                                        <div className="w-full max-w-[240px] bg-slate-800 rounded-full h-2 overflow-hidden shadow-inner">
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
                                                        className="w-full h-full object-contain rounded-2xl shadow-2xl bg-slate-950/50"
                                                    />
                                                    <div className="absolute inset-0 m-2 rounded-2xl bg-slate-950/60 opacity-0 group-hover/file:opacity-100 transition-all duration-300 flex items-center justify-center backdrop-blur-sm">
                                                         <button
                                                            onClick={clearFile}
                                                            type="button"
                                                            className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl font-black uppercase tracking-widest text-xs shadow-xl flex items-center gap-2 transform hover:scale-105 active:scale-95 transition-all"
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
                                                <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950/30 rounded-2xl border border-slate-800">
                                                    <div className="bg-red-500/20 p-5 rounded-2xl mb-4 ring-4 ring-red-500/5 group-hover/file:scale-110 transition-transform duration-300">
                                                        <FileText size={40} className="text-red-400" />
                                                    </div>
                                                    <p className="text-sm font-black text-white truncate max-w-[240px] mb-1 uppercase tracking-tight">
                                                        {file?.name || 'Documento Adjunto'}
                                                    </p>
                                                    {file && (
                                                      <p className="text-[10px] text-slate-500 font-black uppercase tracking-tighter mb-5 bg-slate-900 px-3 py-1 rounded-full border border-slate-800">
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
                                            <p className="mb-1 text-sm text-white font-black uppercase tracking-tight">Subir Comprobante</p>
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

                             {/* Proposed Changes Section */}
                             <div className="mt-8 p-6 bg-slate-950/50 border border-slate-800 rounded-3xl space-y-6 relative overflow-hidden group/prop">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover/prop:opacity-20 transition-opacity">
                                    <RefreshCw size={40} className="text-brand-500" />
                                </div>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-brand-500/20 rounded-lg text-brand-400">
                                        <RefreshCw size={18} />
                                    </div>
                                    <h3 className="text-xs font-black text-white uppercase tracking-widest">Proponer Cambios</h3>
                                </div>
                                
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Nuevo Monto ($)</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                value={proposedAmount || ''}
                                                onChange={(e) => setProposedAmount(Number(e.target.value))}
                                                placeholder="0.00"
                                                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-4 text-sm font-black text-white outline-none focus:ring-4 focus:ring-brand-500/10 transition-all"
                                            />
                                            {effectiveExchangeRate !== undefined && (
                                                <div className="mt-3 p-3 bg-slate-900/50 border border-brand-500/20 rounded-xl flex items-center justify-between group/conv transition-all hover:bg-slate-900/80">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-1.5 bg-brand-500/20 text-brand-400 rounded-lg shadow-sm group-hover/conv:scale-110 transition-transform">
                                                            <Calculator size={14} />
                                                        </div>
                                                        <div>
                                                            <p className="text-[9px] font-black text-brand-500/60 uppercase tracking-widest leading-none mb-0.5">Equivalente en Bs.</p>
                                                            <p className="text-sm font-black text-brand-400 tabular-nums">
                                                                Bs. {(parseFloat(proposedAmount?.toString() || '0') * effectiveExchangeRate).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="text-[9px] font-black text-slate-600 uppercase tracking-tighter text-right leading-tight">
                                                        Tasa: {effectiveExchangeRate.toLocaleString('es-VE')} <br/>
                                                        {docExchangeRate ? 'HISTÓRICA' : 'ACTUAL'}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Nueva Fecha Pago</label>
                                            <input
                                                type="date"
                                                value={proposedPaymentDate || ''}
                                                onChange={(e) => setProposedPaymentDate(e.target.value)}
                                                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-4 text-sm font-black text-white outline-none focus:ring-4 focus:ring-brand-500/10 transition-all [color-scheme:dark]"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Nueva Fecha Venc.</label>
                                            <input
                                                type="date"
                                                value={proposedDueDate || ''}
                                                onChange={(e) => setProposedDueDate(e.target.value)}
                                                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-4 text-sm font-black text-white outline-none focus:ring-4 focus:ring-brand-500/10 transition-all [color-scheme:dark]"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Justificación de la Propuesta</label>
                                        <textarea
                                            value={proposedJustification}
                                            onChange={(e) => setProposedJustification(e.target.value)}
                                            placeholder="Explique por qué propone estos cambios..."
                                            className="w-full bg-slate-900 border border-slate-800 rounded-xl p-4 text-sm font-medium text-slate-300 outline-none focus:ring-4 focus:ring-brand-500/10 h-28 resize-none transition-all leading-relaxed"
                                        />
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
                                             className="w-full bg-slate-950/50 border border-slate-800 group-focus-within:border-brand-500/50 text-white text-sm font-bold rounded-xl p-4 pl-12 outline-none focus:ring-4 focus:ring-brand-500/10 transition-all"
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
                                                 className="w-full bg-slate-950/50 border border-slate-800 group-focus-within:border-brand-500/50 text-white text-sm font-bold rounded-xl p-4 pl-12 outline-none focus:ring-4 focus:ring-brand-500/10 transition-all [color-scheme:dark]"
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
                                                 className="w-full bg-slate-950/50 border border-slate-800 group-focus-within:border-brand-500/50 text-white text-sm font-black rounded-xl p-4 pl-10 outline-none focus:ring-4 focus:ring-brand-500/10 transition-all font-mono"
                                             />
                                         </div>
                                         {effectiveExchangeRate !== undefined && (
                                             <div className="mt-3 p-3 bg-slate-900/50 border border-emerald-500/20 rounded-xl flex items-center justify-between group/conv transition-all hover:bg-slate-900/80">
                                                 <div className="flex items-center gap-3">
                                                     <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg shadow-sm group-hover/conv:scale-110 transition-transform">
                                                         <Calculator size={14} />
                                                     </div>
                                                     <div>
                                                         <p className="text-[9px] font-black text-emerald-500/60 uppercase tracking-widest leading-none mb-0.5">Equivalente en Bs.</p>
                                                         <p className="text-sm font-black text-emerald-400 tabular-nums">
                                                             Bs. {(parseFloat(docAmount || '0') * effectiveExchangeRate).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                         </p>
                                                     </div>
                                                 </div>
                                                 <div className="text-[9px] font-black text-slate-600 uppercase tracking-tighter text-right leading-tight">
                                                     Tasa: {effectiveExchangeRate.toLocaleString('es-VE')} <br/>
                                                     {docExchangeRate ? 'HISTÓRICA' : 'ACTUAL'}
                                                 </div>
                                             </div>
                                         )}
                                     </div>
                                 </div>
                             </div>

                             <div className="flex flex-col flex-1">
                                 <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-3 ml-1">Observaciones / Notas</label>
                                 <div className="relative h-full group">
                                     <textarea
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        disabled={isSubmitting}
                                        placeholder="Añada notas adicionales para el auditor..."
                                        className="w-full bg-slate-950/50 border border-slate-800 group-focus-within:border-brand-500/50 text-slate-200 text-sm font-medium rounded-2xl p-5 outline-none focus:ring-4 focus:ring-brand-500/10 h-full min-h-[240px] resize-none transition-all disabled:opacity-50 leading-relaxed"
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
            <div className="lg:col-span-5 hidden lg:block">
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

        <div className="pt-8 border-t border-slate-800/50 flex flex-col-reverse md:flex-row gap-6">
            {!isEmbedded && (
                <button 
                    type="button"
                    onClick={onCancel}
                    disabled={isSubmitting}
                    className="w-full md:w-auto px-10 py-4 bg-slate-900 text-slate-400 font-black uppercase tracking-widest text-xs rounded-xl hover:bg-slate-800 hover:text-white transition-all active:scale-95 disabled:opacity-50"
                >
                    Cancelar
                </button>
            )}
            <button 
                type="submit"
                disabled={isSubmitting || isFileScanning}
                className={`w-full md:flex-1 relative overflow-hidden group/submit ${
                    isOverBudget && !justificationConfirmed 
                    ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20' 
                    : 'bg-brand-600 hover:bg-brand-500 shadow-brand-500/20'
                } text-white font-black uppercase tracking-widest text-sm py-5 rounded-xl shadow-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-3 ${isSubmitting || isFileScanning ? 'opacity-70 cursor-not-allowed' : ''}`}
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
                ) : isOverBudget && !justificationConfirmed ? (
                    <>
                         <span>Justificar Exceso</span>
                         <AlertTriangle size={20} className="animate-pulse" />
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
