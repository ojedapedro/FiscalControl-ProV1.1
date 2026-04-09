
import { Category } from '../types';

export const MUNICIPAL_TAX_CONFIG: Record<string, { label: string; deadlineDay: number; items: { code: string; name: string; amount?: number; isVariable?: boolean }[] }> = {
  'ACTIVIDAD_ECONOMICA': {
    label: '1 IMPUESTO MUNICIPAL - ACTIVIDAD ECONOMICA',
    deadlineDay: 15,
    items: [
      { code: '1.1', name: 'IMPUESTO SOBRE ACTIVIDADES ECONOMICAS (ISAE)', isVariable: true },
      { code: '1.2', name: 'RETENCIONES DE ACTIVIDADES ECONOMICAS', isVariable: true },
      { code: '1.3', name: 'MULTAS Y RECARGOS', isVariable: true },
    ]
  },
  'INMUEBLES': {
    label: '2 IMPUESTO MUNICIPAL - INMUEBLES Y OTROS',
    deadlineDay: 30,
    items: [
      { code: '2.1', name: 'IMPUESTO SOBRE INMUEBLES URBANOS', isVariable: true },
      { code: '2.2', name: 'ASEO URBANO (FOSPUCA/OTROS)', isVariable: true },
      { code: '2.3', name: 'PUBLICIDAD Y PROPAGANDA', isVariable: true },
      { code: '2.4', name: 'VEHICULOS', isVariable: true },
      { code: '2.5', name: 'SOLVENCIA MUNICIPAL', amount: 20 },
    ]
  }
};

export const NATIONAL_TAX_CONFIG: Record<string, { label: string; deadlineDay: number; items: { code: string; name: string; amount?: number; isVariable?: boolean }[] }> = {
  'SENIAT': {
    label: '3 IMPUESTO NACIONAL - SENIAT',
    deadlineDay: 15,
    items: [
      { code: '3.1', name: 'IVA (IMPUESTO AL VALOR AGREGADO)', isVariable: true },
      { code: '3.2', name: 'RETENCIONES DE IVA', isVariable: true },
      { code: '3.3', name: 'ISLR (IMPUESTO SOBRE LA RENTA)', isVariable: true },
      { code: '3.4', name: 'RETENCIONES DE ISLR', isVariable: true },
      { code: '3.5', name: 'IGTF (IMPUESTO A LAS GRANDES TRANSACCIONES FINANCIERAS)', isVariable: true },
      { code: '3.6', name: 'IGP (IMPUESTO A LAS GRANDES PATRIMONIOS)', isVariable: true },
    ]
  }
};

export const OBJECT_TAX_CONFIG: Record<string, { label: string; deadlineDay: number; items: { code: string; name: string; amount?: number; isVariable?: boolean }[] }> = {
  'OBJETO': {
    label: '4 OBJETO',
    deadlineDay: 30,
    items: [
      { code: '4.1', name: 'REGISTRO MERCANTIL', isVariable: true },
      { code: '4.2', name: 'NOTARIA', isVariable: true },
      { code: '4.3', name: 'TIMBRE FISCAL', isVariable: true },
      { code: '4.4', name: 'CERTIFICADOS', isVariable: true },
    ]
  }
};

export const INSTITUTIONS_TAX_CONFIG: Record<string, { label: string; deadlineDay: number; items: { code: string; name: string; amount?: number; isVariable?: boolean }[] }> = {
  'INSTITUCIONES': {
    label: '5 INSTITUCIONES NACIONALES Y REGIONALES',
    deadlineDay: 30,
    items: [
      { code: '5.1', name: 'IVSS (SEGURO SOCIAL)', isVariable: true },
      { code: '5.2', name: 'FAOV (BANAVIH)', isVariable: true },
      { code: '5.3', name: 'INCES', isVariable: true },
      { code: '5.4', name: 'MINISTERIO DEL TRABAJO', isVariable: true },
      { code: '5.5', name: 'LOCTI', isVariable: true },
      { code: '5.6', name: 'FONA', isVariable: true },
      { code: '5.7', name: 'DEPORTE', isVariable: true },
    ]
  }
};

export const TRANSPORT_TAX_CONFIG: Record<string, { label: string; deadlineDay: number; items: { code: string; name: string; amount?: number; isVariable?: boolean }[] }> = {
  'TRANSPORTE': {
    label: '6 TRANSPORTE',
    deadlineDay: 30,
    items: [
      { code: '6.1', name: 'PEAJE', isVariable: true },
      { code: '6.2', name: 'ESTACIONAMIENTO', isVariable: true },
      { code: '6.3', name: 'REPARACIONES', isVariable: true },
      { code: '6.4', name: 'COMBUSTIBLE', isVariable: true },
    ]
  }
};

export const SENIAT_DECLARATIONS_TAX_CONFIG: Record<string, { label: string; deadlineDay: number; items: { code: string; name: string; amount?: number; isVariable?: boolean }[] }> = {
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

export const SENIAT_BOOKS_TAX_CONFIG: Record<string, { label: string; deadlineDay: number; items: { code: string; name: string; amount?: number; isVariable?: boolean }[] }> = {
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

export const SYSTEMS_TAX_CONFIG: Record<string, { label: string; deadlineDay: number; items: { code: string; name: string; amount?: number; isVariable?: boolean }[] }> = {
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

export const HUMAN_RESOURCES_CONFIG: Record<string, { label: string; deadlineDay: number; items: { code: string; name: string; amount?: number; isVariable?: boolean }[] }> = {
  'NOMINA': {
    label: '11 NOMINA Y PASIVOS LABORALES',
    deadlineDay: 30,
    items: [
      { code: '11.1', name: 'PAGO DE NOMINA', isVariable: true },
      { code: '11.2', name: 'CESTATICKET', isVariable: true },
      { code: '11.3', name: 'IVSS', isVariable: true },
      { code: '11.4', name: 'FAOV', isVariable: true },
      { code: '11.5', name: 'INCES', isVariable: true },
      { code: '11.6', name: 'PARO FORZOSO', isVariable: true },
      { code: '11.7', name: 'PRESTACIONES SOCIALES', isVariable: true },
      { code: '11.8', name: 'UTILIDADES', isVariable: true },
      { code: '11.9', name: 'VACACIONES', isVariable: true },
      { code: '11.10', name: 'BONOS ESPECIALES', isVariable: true },
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
    default: return null;
  }
};
