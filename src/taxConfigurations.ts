
import { Category, PaymentFrequency } from '../types';

export const MUNICIPAL_TAX_CONFIG: Record<string, { label: string; deadlineDay: number; items: { code: string; name: string; amount?: number; isVariable?: boolean; frequency?: PaymentFrequency }[] }> = {
  'PATENTE': {
    label: '1.1 PATENTE DE INDUSTRIA',
    deadlineDay: 15,
    items: [
      { code: '1.1.1', name: 'RENOVACION DE PATENTE', amount: 150.00, frequency: PaymentFrequency.ANNUAL },
      { code: '1.1.2', name: 'CODIGO 1 AL MAYOR DE PINTURA', amount: 20.00, frequency: PaymentFrequency.MONTHLY },
      { code: '1.1.3', name: 'CODIGO 2 AL DETAL DE PINTURA', amount: 20.00, frequency: PaymentFrequency.MONTHLY },
      { code: '1.1.4', name: 'CODIGO 3 AL MAYOR DE FERRETERIA', amount: 20.00, frequency: PaymentFrequency.MONTHLY },
      { code: '1.1.5', name: 'CODIGO 4 AL DETAL DE FERRETERIA', amount: 20.00, frequency: PaymentFrequency.MONTHLY },
      { code: '1.1.6', name: 'CODIGO 5 SERVICIOS OBRAS', amount: 20.00, frequency: PaymentFrequency.MONTHLY },
      { code: '1.1.7', name: 'PORCENTAJE DE VENTAS TOTALES', isVariable: true, frequency: PaymentFrequency.MONTHLY },
    ]
  },
  'VISTO_BUENO': {
    label: '1.2 VISTO BUENO AMBIENTAL',
    deadlineDay: 30,
    items: [
      { code: '1.2.1', name: 'INVEPINCA (TRAMITE)', amount: 150.00, frequency: PaymentFrequency.ANNUAL }
    ]
  },
  'IMA': {
    label: '1.3 IMA (ASEO URBANO)',
    deadlineDay: 25,
    items: [
      { code: '1.3.1', name: 'INVEPINCA (TARIFA ASEO)', amount: 50.00, frequency: PaymentFrequency.MONTHLY }
    ]
  },
  'CATASTRO': {
    label: '1.4 CEDULA CATASTRAL',
    deadlineDay: 30,
    items: [
      { code: '1.4.1', name: 'INVEPINCA (CATASTRO)', amount: 150.00, frequency: PaymentFrequency.ANNUAL }
    ]
  },
  'INMOBILIARIO': {
    label: '1.5 IMPUESTO INMOBILIARIO',
    deadlineDay: 30,
    items: [
      { code: '1.5.1', name: 'INVEPINCA (INMUEBLE)', amount: 400.00, frequency: PaymentFrequency.ANNUAL }
    ]
  },
  'PUBLICIDAD': {
    label: '1.6 PUBLICIDAD Y PROPAGANDA',
    deadlineDay: 20,
    items: [
      { code: '1.6.1', name: 'PUBLICIDAD SUCURSAL 1', amount: 100.00, frequency: PaymentFrequency.ANNUAL },
      { code: '1.6.2', name: 'PUBLICIDAD SUCURSAL 2', amount: 100.00, frequency: PaymentFrequency.ANNUAL }
    ]
  },
  'BOMBEROS': {
    label: '1.7 CUERPO DE BOMBEROS',
    deadlineDay: 28,
    items: [
      { code: '1.7.1', name: 'PLAN DE EMERGENCIA', amount: 50.00, frequency: PaymentFrequency.ANNUAL },
      { code: '1.7.2', name: 'PAGO DE ARANCELES PLAN', amount: 120.00, frequency: PaymentFrequency.ANNUAL },
      { code: '1.7.3', name: 'EXTINTORES', amount: 350.00, frequency: PaymentFrequency.ANNUAL },
      { code: '1.7.4', name: 'CONTRATO DE MANTENIMIENTO', amount: 100.00, frequency: PaymentFrequency.ANNUAL },
      { code: '1.7.5', name: 'PAGO DE ARANCELES USO CONFORME', amount: 80.00, frequency: PaymentFrequency.ANNUAL },
      { code: '1.7.6', name: 'USO CONFORME', amount: 0.00, frequency: PaymentFrequency.ANNUAL },
    ]
  }
};

export const NATIONAL_TAX_CONFIG: Record<string, { label: string; deadlineDay: number; items: { code: string; name: string; amount?: number; isVariable?: boolean; frequency?: PaymentFrequency }[] }> = {
  'IVA': {
    label: '2.1 IVA (IMPUESTO AL VALOR AGREGADO)',
    deadlineDay: 15,
    items: [
      { code: '2.1.1', name: 'IVA MENSUAL - REGULAR', isVariable: true, frequency: PaymentFrequency.MONTHLY },
      { code: '2.1.2', name: 'RETENCIONES DE IVA', isVariable: true, frequency: PaymentFrequency.BIWEEKLY },
    ]
  },
  'ISLR': {
    label: '2.2 ISLR (IMPUESTO SOBRE LA RENTA)',
    deadlineDay: 10,
    items: [
      { code: '2.2.1', name: 'RETENCIONES ISLR - SERVICIOS', isVariable: true, frequency: PaymentFrequency.MONTHLY },
      { code: '2.2.2', name: 'RETENCIONES ISLR - ALQUILERES', isVariable: true, frequency: PaymentFrequency.MONTHLY },
      { code: '2.2.3', name: 'DECLARACION ESTIMADA ISLR', isVariable: true, frequency: PaymentFrequency.ANNUAL },
      { code: '2.2.4', name: 'DECLARACION DEFINITIVA ANUAL', isVariable: true, frequency: PaymentFrequency.ANNUAL },
    ]
  },
  'IGTF': {
    label: '2.3 IGTF (GRANDES TRANSACCIONES)',
    deadlineDay: 15,
    items: [
      { code: '2.3.1', name: 'IGTF - PAGO QUINCENAL', isVariable: true, frequency: PaymentFrequency.BIWEEKLY }
    ]
  },
  'OTROS_NACIONALES': {
    label: '2.4 OTROS IMPUESTOS NACIONALES',
    deadlineDay: 30,
    items: [
      { code: '2.4.1', name: 'OTRO IMPUESTO NACIONAL', isVariable: true, frequency: PaymentFrequency.MONTHLY },
    ]
  }
};

export const OBJECT_TAX_CONFIG: Record<string, { label: string; deadlineDay: number; items: { code: string; name: string; amount?: number; isVariable?: boolean; frequency?: PaymentFrequency }[] }> = {
  'SENCAMER_CERT': {
    label: '2.1 CERTIFICADO DE SENCAMER (REM 36357)',
    deadlineDay: 30,
    items: [
      { code: '2.1.1', name: 'CONSTANCIA DE REGISTRO', isVariable: true, frequency: PaymentFrequency.ANNUAL },
      { code: '2.1.2', name: 'PAGO DE RENOVACION REM', isVariable: true, frequency: PaymentFrequency.ANNUAL },
      { code: '2.1.3', name: 'CERTIFICADO REM', isVariable: true, frequency: PaymentFrequency.ANNUAL },
    ]
  },
  'SENCAMER_CPE': {
    label: '2.2 CPE SENCAMER',
    deadlineDay: 30,
    items: [
      { code: '2.2.1', name: 'PAGO DE ARANCELES', isVariable: true, frequency: PaymentFrequency.ANNUAL },
      { code: '2.2.2', name: 'CONSTANCIA DE VERIFICACION DE PRODUCTO', isVariable: true, frequency: PaymentFrequency.ANNUAL },
      { code: '2.2.3', name: 'SOLVENCIA DEL PRODUCTO', isVariable: true, frequency: PaymentFrequency.ANNUAL },
    ]
  },
  'RACDA': {
    label: '2.3 REGISTRO DE ACTIVIDADES CAPACES DE DEGRADAR EL AMBIENTE (RACDA)',
    deadlineDay: 30,
    items: [
      { code: '2.3.1', name: 'LICENCIA RACDA', isVariable: true, frequency: PaymentFrequency.ANNUAL },
      { code: '2.3.2', name: 'PAGOS DEL PROFESIONAL PARA DECLARACION EFLUENTES', isVariable: true, frequency: PaymentFrequency.ANNUAL },
      { code: '2.3.3', name: 'DECLARACION EFLUENTES', isVariable: true, frequency: PaymentFrequency.ANNUAL },
      { code: '2.3.4', name: 'DISPOSICION FINAL (ANUAL) INFORME', isVariable: true, frequency: PaymentFrequency.ANNUAL },
    ]
  },
  'SOLVENCIA_AMBIENTAL': {
    label: '2.4 SOLVENCIA POLICIAL NACIONAL AMBIENTAL',
    deadlineDay: 30,
    items: [
      { code: '2.4.1', name: 'ACTA DE SOLVENCIA', isVariable: true, frequency: PaymentFrequency.ANNUAL },
    ]
  },
  'DISPOSICION_FINAL': {
    label: '2.5 EMPRESA DE DISPOSICION FINAL',
    deadlineDay: 30,
    items: [
      { code: '2.5.1', name: 'CONTRATO EMPRESA DISPOSICION FINAL', isVariable: true, frequency: PaymentFrequency.ANNUAL },
      { code: '2.5.2', name: 'RETIRO DE DESECHOS', isVariable: true, frequency: PaymentFrequency.MONTHLY },
    ]
  },
  'POLIZA_SEGURO': {
    label: '2.7 POLIZA DE SEGURO FABRICA (RESPONSABILIDAD CIVIL GENERAL)',
    deadlineDay: 30,
    items: [
      { code: '2.7.1', name: 'PAGO DE ARANCELES', isVariable: true, frequency: PaymentFrequency.ANNUAL },
      { code: '2.7.2', name: 'POLIZA', isVariable: true, frequency: PaymentFrequency.ANNUAL },
    ]
  },
  'SAPI': {
    label: '2.8 SERVICIO AUTONOMO DE LA PROPIEDAD INTELECTUAL (SAPI)',
    deadlineDay: 30,
    items: [
      { code: '2.8.1', name: 'SAPI (MARCA)', isVariable: true, frequency: PaymentFrequency.ANNUAL },
      { code: '2.8.2', name: 'SAPI (LOGO)', isVariable: true, frequency: PaymentFrequency.ANNUAL },
    ]
  }
};

export const INSTITUTIONS_TAX_CONFIG: Record<string, { label: string; deadlineDay: number; items: { code: string; name: string; amount?: number; isVariable?: boolean; frequency?: PaymentFrequency }[] }> = {
  'SNC': {
    label: '3.1 SERVICIO NACIONAL DE CONTRATISTA (SNC)',
    deadlineDay: 30,
    items: [
      { code: '3.1.1', name: 'EXPEDIENTE CONTABLE', isVariable: true, frequency: PaymentFrequency.ANNUAL },
      { code: '3.1.2', name: 'PAGO DE ARANCEL', isVariable: true, frequency: PaymentFrequency.ANNUAL },
      { code: '3.1.3', name: 'CERTIFICADO', isVariable: true, frequency: PaymentFrequency.ANNUAL },
    ]
  },
  'RUPDAE': {
    label: '3.2 RUPDAE',
    deadlineDay: 30,
    items: [
      { code: '3.2.1', name: 'INSCRIPCION', isVariable: true, frequency: PaymentFrequency.ANNUAL },
      { code: '3.2.2', name: 'ARANCEL', isVariable: true, frequency: PaymentFrequency.ANNUAL },
    ]
  },
  'FONACIT': {
    label: '3.3 FONACIT',
    deadlineDay: 30,
    items: [
      { code: '3.3.1', name: 'DECLARACION', isVariable: true, frequency: PaymentFrequency.ANNUAL },
      { code: '3.3.2', name: 'PAGO', isVariable: true, frequency: PaymentFrequency.ANNUAL },
    ]
  },
  'FONA': {
    label: '3.4 FONA',
    deadlineDay: 30,
    items: [
      { code: '3.4.1', name: 'DECLARACION', isVariable: true, frequency: PaymentFrequency.ANNUAL },
      { code: '3.4.2', name: 'PAGO', isVariable: true, frequency: PaymentFrequency.ANNUAL },
    ]
  },
  'FONDO_DEPORTE': {
    label: '3.5 FONDO DE DEPORTE',
    deadlineDay: 30,
    items: [
      { code: '3.5.1', name: 'DECLARACION', isVariable: true, frequency: PaymentFrequency.ANNUAL },
      { code: '3.5.2', name: 'PAGO', isVariable: true, frequency: PaymentFrequency.ANNUAL },
    ]
  },
  'INSALUD': {
    label: '3.6 PERMISOS SANITARIO (INSALUD)',
    deadlineDay: 30,
    items: [
      { code: '3.6.1', name: 'CERTIFICADO DE FUMIGACION', isVariable: true, frequency: PaymentFrequency.TRIMESTRAL },
      { code: '3.6.2', name: 'CERTIFICADO DE LIMPIEZA DE TANQUES', isVariable: true, frequency: PaymentFrequency.SEMIANNUAL },
      { code: '3.6.3', name: 'CERTIFICADO DE DESRATIZACION', isVariable: true, frequency: PaymentFrequency.QUADRIMESTER },
      { code: '3.6.4', name: 'PERMISO SANITARIO', isVariable: true, frequency: PaymentFrequency.ANNUAL },
    ]
  }
};

export const TRANSPORT_TAX_CONFIG: Record<string, { label: string; deadlineDay: number; items: { code: string; name: string; amount?: number; isVariable?: boolean; frequency?: PaymentFrequency }[] }> = {
  'CHOFER': {
    label: '5.1 DOCUMENTOS DEL CHOFER',
    deadlineDay: 30,
    items: [
      { code: '5.1.1', name: 'CEDULA DE IDENTIDAD', isVariable: true, frequency: PaymentFrequency.NONE },
      { code: '5.1.2', name: 'CARNET DE CIRCULACION', isVariable: true, frequency: PaymentFrequency.NONE },
      { code: '5.1.3', name: 'CERTIFICADO DE SABERES', isVariable: true, frequency: PaymentFrequency.ANNUAL },
      { code: '5.1.4', name: 'LICENCIA DE CONDUCIR', isVariable: true, frequency: PaymentFrequency.ANNUAL },
      { code: '5.1.5', name: 'CERTIFICADO MEDICO', isVariable: true, frequency: PaymentFrequency.ANNUAL },
    ]
  },
  'VEHICULO': {
    label: '5.2 DOCUMENTOS DEL VEHICULO',
    deadlineDay: 30,
    items: [
      { code: '5.2.1', name: 'TITULO DE PROPIEDAD', isVariable: true, frequency: PaymentFrequency.NONE },
      { code: '5.2.2', name: 'CARNET DE CIRCULACION', isVariable: true, frequency: PaymentFrequency.NONE },
      { code: '5.2.3', name: 'SEGURO (RCV)', isVariable: true, frequency: PaymentFrequency.ANNUAL },
      { code: '5.2.4', name: 'IMPUESTO TRIMESTRAL', isVariable: true, frequency: PaymentFrequency.TRIMESTRAL },
      { code: '5.2.5', name: 'ROTC', isVariable: true, frequency: PaymentFrequency.ANNUAL },
      { code: '5.2.6', name: 'FLOTA VEHICULAR ROCT', isVariable: true, frequency: PaymentFrequency.ANNUAL },
      { code: '5.2.7', name: 'RACDA TRANSPORTE', isVariable: true, frequency: PaymentFrequency.ANNUAL },
      { code: '5.2.8', name: 'GPS', isVariable: true, frequency: PaymentFrequency.MONTHLY },
    ]
  },
  'MANTENIMIENTO': {
    label: '5.3 KILOMETRO MANTENIMIENTO',
    deadlineDay: 30,
    items: [
      { code: '5.3.1', name: 'FLUIDOS', isVariable: true, frequency: PaymentFrequency.MONTHLY },
      { code: '5.3.2', name: 'FILTROS', isVariable: true, frequency: PaymentFrequency.MONTHLY },
      { code: '5.3.3', name: 'CAUCHOS', isVariable: true, frequency: PaymentFrequency.SEMIANNUAL },
      { code: '5.3.4', name: 'FRENOS', isVariable: true, frequency: PaymentFrequency.SEMIANNUAL },
    ]
  }
};

export const SENIAT_DECLARATIONS_TAX_CONFIG: Record<string, { label: string; deadlineDay: number; items: { code: string; name: string; amount?: number; isVariable?: boolean; frequency?: PaymentFrequency }[] }> = {
  'DECLARACIONES': {
    label: '7 SENIAT DECLARACIONES Y CONTABILIDAD',
    deadlineDay: 15,
    items: [
      { code: '7.1', name: 'LIBRO DE COMPRA', isVariable: true, frequency: PaymentFrequency.MONTHLY },
      { code: '7.2.1', name: 'LIBRO DE VENTA - CODIGO 1', isVariable: true, frequency: PaymentFrequency.MONTHLY },
      { code: '7.2.2', name: 'LIBRO DE VENTA - CODIGO 2', isVariable: true, frequency: PaymentFrequency.MONTHLY },
      { code: '7.2.3', name: 'LIBRO DE VENTA - CODIGO 3', isVariable: true, frequency: PaymentFrequency.MONTHLY },
      { code: '7.2.4', name: 'LIBRO DE VENTA - TOTAL', isVariable: true, frequency: PaymentFrequency.MONTHLY },
      { code: '7.3', name: 'DECLARACION DE IVA', isVariable: true, frequency: PaymentFrequency.BIWEEKLY },
      { code: '7.4', name: 'DECLARACION DE IVA RET', isVariable: true, frequency: PaymentFrequency.BIWEEKLY },
      { code: '7.5', name: 'DECLARACION DE ANT ISLR', isVariable: true, frequency: PaymentFrequency.BIWEEKLY },
      { code: '7.6', name: 'DECLARACION DE IGTF', isVariable: true, frequency: PaymentFrequency.BIWEEKLY },
      { code: '7.7', name: 'DECLARACION DE ISLR RETENIDO', isVariable: true, frequency: PaymentFrequency.MONTHLY },
      { code: '7.8', name: 'DECLARACION DE FONDO DE PENSIONES', isVariable: true, frequency: PaymentFrequency.MONTHLY },
      { code: '7.9', name: 'CARPETA CONTABLE', isVariable: true, frequency: PaymentFrequency.MONTHLY },
      { code: '7.10', name: 'HONORARIOS', isVariable: true, frequency: PaymentFrequency.MONTHLY },
      { code: '7.11', name: 'DECLARACION DE IGP', isVariable: true, frequency: PaymentFrequency.ANNUAL },
      { code: '7.12', name: 'DECLARACION DE ISLR', isVariable: true, frequency: PaymentFrequency.ANNUAL },
    ]
  }
};

export const SENIAT_BOOKS_TAX_CONFIG: Record<string, { label: string; deadlineDay: number; items: { code: string; name: string; amount?: number; isVariable?: boolean; frequency?: PaymentFrequency }[] }> = {
  'LIBROS': {
    label: '8 SENIAT LIBROS',
    deadlineDay: 30,
    items: [
      { code: '8.1', name: 'LIBRO MAYOR', isVariable: true, frequency: PaymentFrequency.MONTHLY },
      { code: '8.2', name: 'LIBRO DE INVENTARIO', isVariable: true, frequency: PaymentFrequency.MONTHLY },
      { code: '8.3', name: 'LIBRO DE ACTAS', isVariable: true, frequency: PaymentFrequency.ANNUAL },
      { code: '8.4', name: 'LIBRO DE COMPRA', isVariable: true, frequency: PaymentFrequency.MONTHLY },
      { code: '8.5', name: 'LIBRO DE VENTA', isVariable: true, frequency: PaymentFrequency.MONTHLY },
    ]
  }
};

export const SYSTEMS_TAX_CONFIG: Record<string, { label: string; deadlineDay: number; items: { code: string; name: string; amount?: number; isVariable?: boolean; frequency?: PaymentFrequency }[] }> = {
  'SISTEMAS': {
    label: '9 SISTEMAS, MARKETING Y OFICINAS',
    deadlineDay: 30,
    items: [
      { code: '9.1', name: 'SERVIDOR', isVariable: true, frequency: PaymentFrequency.MONTHLY },
      { code: '9.2', name: 'RED', isVariable: true, frequency: PaymentFrequency.MONTHLY },
      { code: '9.3', name: 'SOFTWARE ADMINISTRATIVO', isVariable: true, frequency: PaymentFrequency.MONTHLY },
      { code: '9.4', name: 'SOFTWARE CONTABLE', isVariable: true, frequency: PaymentFrequency.MONTHLY },
      { code: '9.5', name: 'PROGRAMA (GASTOS FIJOS)', isVariable: true, frequency: PaymentFrequency.MONTHLY },
      { code: '9.6', name: 'PAGINA WEB', isVariable: true, frequency: PaymentFrequency.ANNUAL },
      { code: '9.7', name: 'PUBLICIDAD (DISEÑADOR)', isVariable: true, frequency: PaymentFrequency.MONTHLY },
      { code: '9.8', name: 'MARKETING (REDES SOCIALES)', isVariable: true, frequency: PaymentFrequency.MONTHLY },
      { code: '9.9', name: 'CONTROL DE DAÑOS', isVariable: true, frequency: PaymentFrequency.MONTHLY },
      { code: '9.10', name: 'PAPELERIA DE OFICINA EN GENERAL', isVariable: true, frequency: PaymentFrequency.MONTHLY },
      { code: '9.11', name: 'MOBILIARIO', isVariable: true, frequency: PaymentFrequency.ANNUAL },
    ]
  }
};

export const HUMAN_RESOURCES_CONFIG: Record<string, { label: string; deadlineDay: number; items: { code: string; name: string; amount?: number; isVariable?: boolean; frequency?: PaymentFrequency }[] }> = {
  'PASIVOS_LABORALES': {
    label: 'PASIVOS LABORALES Y CONTRIBUCIONES',
    deadlineDay: 30,
    items: [
      { code: 'HR.1', name: 'CONTRIBUCION PARAFISCAL (INCES)', isVariable: true, frequency: PaymentFrequency.MONTHLY },
      { code: 'HR.2', name: 'CONTRIBUCION PARAFISCAL (IVSS)', isVariable: true, frequency: PaymentFrequency.MONTHLY },
      { code: 'HR.3', name: 'CONTRIBUCION PARAFISCAL (FAOV)', isVariable: true, frequency: PaymentFrequency.MONTHLY },
      { code: 'HR.4', name: 'PAGO DE NÓMINA', isVariable: true, frequency: PaymentFrequency.BIWEEKLY },
      { code: 'HR.5', name: 'PRESTACIONES SOCIALES', isVariable: true, frequency: PaymentFrequency.MONTHLY },
      { code: 'HR.6', name: 'OTROS PASIVOS LABORALES', isVariable: true, frequency: PaymentFrequency.MONTHLY },
    ]
  }
};

export const UTILITY_TAX_CONFIG: Record<string, { label: string; deadlineDay: number; items: { code: string; name: string; amount?: number; isVariable?: boolean; frequency?: PaymentFrequency }[] }> = {
  'SERVICIOS': {
    label: '10 SERVICIOS PUBLICOS',
    deadlineDay: 30,
    items: [
      { code: '10.1', name: 'ELECTRICIDAD (CORPOELEC)', isVariable: true, frequency: PaymentFrequency.MONTHLY },
      { code: '10.2', name: 'AGUA (HIDROCAPITAL/HIDROCENTRO)', isVariable: true, frequency: PaymentFrequency.MONTHLY },
      { code: '10.3', name: 'TELEFONO E INTERNET (CANTV)', isVariable: true, frequency: PaymentFrequency.MONTHLY },
      { code: '10.4', name: 'ASEO URBANO (FOSPUCA/OTROS)', isVariable: true, frequency: PaymentFrequency.MONTHLY },
      { code: '10.5', name: 'GAS', isVariable: true, frequency: PaymentFrequency.MONTHLY },
      { code: '10.6', name: 'CONDOMINIO', isVariable: true, frequency: PaymentFrequency.MONTHLY },
    ]
  }
};

export const INVENTORY_TAX_CONFIG: Record<string, { label: string; deadlineDay: number; items: { code: string; name: string; amount?: number; isVariable?: boolean; frequency?: PaymentFrequency }[] }> = {
  'INVENTARIO': {
    label: '12 INVENTARIO',
    deadlineDay: 30,
    items: [
      { code: '12.1', name: 'COMPRA DE MERCANCIA NACIONAL', isVariable: true, frequency: PaymentFrequency.MONTHLY },
      { code: '12.2', name: 'COMPRA DE MERCANCIA IMPORTADA', isVariable: true, frequency: PaymentFrequency.MONTHLY },
      { code: '12.3', name: 'SUMINISTROS', isVariable: true, frequency: PaymentFrequency.MONTHLY },
    ]
  }
};

export const OTHER_TAX_CONFIG: Record<string, { label: string; deadlineDay: number; items: { code: string; name: string; amount?: number; isVariable?: boolean; frequency?: PaymentFrequency }[] }> = {
  'OTROS': {
    label: '13 OTROS PAGOS',
    deadlineDay: 30,
    items: [
      { code: '13.1', name: 'MANTENIMIENTO GENERAL', isVariable: true, frequency: PaymentFrequency.MONTHLY },
      { code: '13.2', name: 'REPARACIONES MENORES', isVariable: true, frequency: PaymentFrequency.MONTHLY },
      { code: '13.3', name: 'GASTOS VARIOS', isVariable: true, frequency: PaymentFrequency.MONTHLY },
    ]
  }
};

export const getTaxConfig = (cat: Category | '') => {
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
    case Category.UTILITY: return UTILITY_TAX_CONFIG;
    case Category.INVENTORY: return INVENTORY_TAX_CONFIG;
    case Category.OTHER: return OTHER_TAX_CONFIG;
    default: return null;
  }
};
