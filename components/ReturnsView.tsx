import React from 'react';
import { RotateCcw } from 'lucide-react';

const ReturnsView: React.FC = () => (
    <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-800 text-center transition-colors">
        <RotateCcw className="w-16 h-16 text-orange-400 dark:text-orange-500 mx-auto mb-4 animate-spin-slow" />
        <h2 className="text-2xl font-bold text-gray-800 dark:text-slate-100 mb-2">Gestión de Devoluciones</h2>
        <p className="text-gray-500 dark:text-slate-400 max-w-md mx-auto mb-6">Escanea el ticket de venta para iniciar garantía.</p>
    </div>
);

export default ReturnsView;
