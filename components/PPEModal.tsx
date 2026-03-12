import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, FileDown, ShieldCheck, Calculator, Save } from 'lucide-react';
import { Employee, PPEItemData, PPEAssignment } from '../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface PPEModalProps {
  employee: Employee;
  onClose: () => void;
  onSave: (employee: Employee) => Promise<void>;
}

type PPEItemKey = 'pantalon' | 'camisa' | 'braga' | 'delantal' | 'botas' | 'casco' | 'guantes' | 'lentes';

export const PPEModal: React.FC<PPEModalProps> = ({ employee, onClose, onSave }) => {
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<Record<PPEItemKey, PPEItemData>>({
    pantalon: { name: 'Pantalón', talla: '', cantidad: 0, precio: 0, frecuencia: '2 cada 6 meses' },
    camisa: { name: 'Camisa', talla: '', cantidad: 0, precio: 0, frecuencia: '2 cada 6 meses' },
    braga: { name: 'Braga', talla: '', cantidad: 0, precio: 0, frecuencia: '2 cada 6 meses' },
    delantal: { name: 'Delantal', talla: '', cantidad: 0, precio: 0, frecuencia: '1 cada 6 meses' },
    botas: { name: 'Botas de Seguridad', talla: '', cantidad: 0, precio: 0, frecuencia: '1 par cada 6 meses' },
    casco: { name: 'Casco de Seguridad', talla: '', cantidad: 0, precio: 0, frecuencia: '1 cada 6 meses' },
    guantes: { name: 'Guantes', talla: '', cantidad: 0, precio: 0, frecuencia: 'Reposición est. 6 pares' },
    lentes: { name: 'Lentes de Seguridad', talla: '', cantidad: 0, precio: 0, frecuencia: '1 cada 4 meses' },
  });

  const handleInputChange = (item: PPEItemKey, field: keyof PPEItemData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [item]: {
        ...prev[item],
        [field]: value
      }
    }));
  };

  const calculateTotal = () => {
    return Object.values(formData).reduce((sum, item) => sum + (item.cantidad * item.precio), 0);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const itemsToSave = Object.values(formData).filter(item => item.cantidad > 0);
      if (itemsToSave.length === 0) {
        alert('Debe ingresar al menos un equipo con cantidad mayor a 0 para guardar.');
        setIsSaving(false);
        return;
      }

      const newAssignment: PPEAssignment = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        items: itemsToSave,
        totalCost: calculateTotal()
      };

      const updatedEmployee = {
        ...employee,
        ppeAssignments: [...(employee.ppeAssignments || []), newAssignment]
      };

      await onSave(updatedEmployee);
      alert('Asignación de EPP guardada exitosamente en el expediente.');
      onClose();
    } catch (error) {
      console.error('Error saving PPE assignment:', error);
      alert('Hubo un error al guardar la asignación.');
    } finally {
      setIsSaving(false);
    }
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    
    // Header
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('ACTA DE ENTREGA DE EQUIPOS DE PROTECCIÓN PERSONAL (EPP)', pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const today = new Date().toLocaleDateString('es-VE');
    doc.text(`Fecha: ${today}`, pageWidth - 20, 30, { align: 'right' });

    // Employee Data
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('DATOS DEL TRABAJADOR', 14, 40);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Nombre y Apellido: ${employee.name} ${employee.lastName || ''}`, 14, 48);
    doc.text(`Cédula/ID: ${employee.id}`, 14, 54);
    doc.text(`Cargo: ${employee.position}`, 120, 48);
    doc.text(`Departamento: ${employee.department}`, 120, 54);

    // Table Data
    const tableBody = Object.values(formData)
      .filter(item => item.cantidad > 0)
      .map(item => [
        item.name,
        item.talla || 'N/A',
        item.frecuencia,
        item.cantidad.toString(),
        `$${item.precio.toFixed(2)}`,
        `$${(item.cantidad * item.precio).toFixed(2)}`
      ]);

    if (tableBody.length === 0) {
      alert('Debe ingresar al menos un equipo con cantidad mayor a 0 para generar el acta.');
      return;
    }

    autoTable(doc, {
      startY: 65,
      head: [['Equipo', 'Talla/Medida', 'Frecuencia Est.', 'Cantidad', 'Precio Unit.', 'Total']],
      body: tableBody,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229] }, // Indigo 600
      foot: [['', '', '', '', 'COSTO TOTAL:', `$${calculateTotal().toFixed(2)}`]],
      footStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold' }
    });

    // Signatures
    const finalY = (doc as any).lastAutoTable.finalY + 40;
    
    doc.line(30, finalY, 80, finalY);
    doc.text('Entregado por (Empresa)', 55, finalY + 5, { align: 'center' });
    
    doc.line(130, finalY, 180, finalY);
    doc.text('Recibido por (Trabajador)', 155, finalY + 5, { align: 'center' });
    doc.text(`C.I: ${employee.id}`, 155, finalY + 10, { align: 'center' });

    // Legal text
    doc.setFontSize(8);
    doc.text('El trabajador declara haber recibido los Equipos de Protección Personal (EPP) arriba descritos en perfecto estado,', 14, finalY + 25);
    doc.text('comprometiéndose a usarlos correctamente durante su jornada laboral y a notificar su deterioro para su reposición.', 14, finalY + 30);

    doc.save(`Acta_EPP_${employee.id}_${today.replace(/\//g, '-')}.pdf`);
  };

  const items: PPEItemKey[] = ['pantalon', 'camisa', 'braga', 'delantal', 'botas', 'casco', 'guantes', 'lentes'];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-slate-900 w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-3xl border border-slate-800 shadow-2xl flex flex-col"
      >
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-500">
              <ShieldCheck size={28} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Expediente de Seguridad Industrial (EPP)</h2>
              <p className="text-slate-400 text-sm">Registro y costeo de equipos para: <span className="text-white font-medium">{employee.name} {employee.lastName}</span></p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          <div className="bg-slate-800/30 rounded-2xl border border-slate-700/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-800/50 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-700/50">
                    <th className="p-4 font-medium">Equipo</th>
                    <th className="p-4 font-medium">Frecuencia Est.</th>
                    <th className="p-4 font-medium w-24">Talla</th>
                    <th className="p-4 font-medium w-24">Cantidad</th>
                    <th className="p-4 font-medium w-32">Precio Unit. ($)</th>
                    <th className="p-4 font-medium w-32 text-right">Total ($)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {items.map((key) => {
                    const item = formData[key];
                    const total = item.cantidad * item.precio;
                    return (
                      <tr key={key} className="hover:bg-slate-800/30 transition-colors">
                        <td className="p-4 text-sm font-medium text-slate-300">{item.name}</td>
                        <td className="p-4 text-xs text-slate-500">{item.frecuencia}</td>
                        <td className="p-4">
                          <input
                            type="text"
                            value={item.talla}
                            onChange={(e) => handleInputChange(key, 'talla', e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-amber-500 outline-none"
                            placeholder="Ej. L, 42"
                          />
                        </td>
                        <td className="p-4">
                          <input
                            type="number"
                            min="0"
                            value={item.cantidad || ''}
                            onChange={(e) => handleInputChange(key, 'cantidad', parseInt(e.target.value) || 0)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-amber-500 outline-none"
                            placeholder="0"
                          />
                        </td>
                        <td className="p-4">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.precio || ''}
                            onChange={(e) => handleInputChange(key, 'precio', parseFloat(e.target.value) || 0)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-amber-500 outline-none"
                            placeholder="0.00"
                          />
                        </td>
                        <td className="p-4 text-right font-mono text-amber-400 font-bold">
                          ${total.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-800/50 border-t border-slate-700/50">
                    <td colSpan={5} className="p-4 text-right font-bold text-white">COSTO TOTAL EPP:</td>
                    <td className="p-4 text-right font-mono text-xl font-bold text-amber-400">
                      ${calculateTotal().toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-800 bg-slate-900/50 flex flex-wrap justify-end gap-4">
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-xl font-bold text-slate-300 hover:bg-slate-800 transition-colors"
            disabled={isSaving}
          >
            Cancelar
          </button>
          <button
            onClick={generatePDF}
            className="px-6 py-3 rounded-xl font-bold bg-slate-800 hover:bg-slate-700 text-white transition-colors flex items-center gap-2"
            disabled={isSaving}
          >
            <FileDown size={20} />
            Generar PDF
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-3 rounded-xl font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors flex items-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-50"
          >
            <Save size={20} />
            {isSaving ? 'Guardando...' : 'Guardar Asignación'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
