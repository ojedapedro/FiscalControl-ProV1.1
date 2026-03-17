
import React from 'react';
import { Cloud, CloudOff, RefreshCw, UploadCloud, DownloadCloud, AlertCircle } from 'lucide-react';

interface CloudSyncProps {
  isAuthenticated: boolean;
  isSyncing: boolean;
  onLogin: () => void;
  onPush: () => void;
  onPull: () => void;
}

export const CloudSync: React.FC<CloudSyncProps> = ({
  isAuthenticated,
  isSyncing,
  onLogin,
  onPush,
  onPull
}) => {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isAuthenticated ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
            {isAuthenticated ? <Cloud size={24} /> : <CloudOff size={24} />}
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white">Sincronización en la Nube</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {isAuthenticated ? 'Conectado a Google Drive' : 'No conectado'}
            </p>
          </div>
        </div>
        {!isAuthenticated && (
          <button
            onClick={onLogin}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors flex items-center gap-2"
          >
            Conectar Google
          </button>
        )}
      </div>

      {isAuthenticated ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={onPush}
              disabled={isSyncing}
              className="flex items-center justify-center gap-3 p-4 bg-slate-50 dark:bg-slate-900/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-slate-200 dark:border-slate-700 rounded-xl transition-all group disabled:opacity-50"
            >
              <UploadCloud className={`text-blue-500 group-hover:scale-110 transition-transform ${isSyncing ? 'animate-bounce' : ''}`} size={24} />
              <div className="text-left">
                <span className="block font-bold text-slate-900 dark:text-white">Subir a la Nube</span>
                <span className="text-xs text-slate-500">Guardar estado actual</span>
              </div>
            </button>

            <button
              onClick={onPull}
              disabled={isSyncing}
              className="flex items-center justify-center gap-3 p-4 bg-slate-50 dark:bg-slate-900/50 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 border border-slate-200 dark:border-slate-700 rounded-xl transition-all group disabled:opacity-50"
            >
              <DownloadCloud className={`text-emerald-500 group-hover:scale-110 transition-transform ${isSyncing ? 'animate-bounce' : ''}`} size={24} />
              <div className="text-left">
                <span className="block font-bold text-slate-900 dark:text-white">Bajar de la Nube</span>
                <span className="text-xs text-slate-500">Recuperar datos guardados</span>
              </div>
            </button>
          </div>

          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex gap-3">
            <AlertCircle className="text-blue-500 shrink-0" size={20} />
            <p className="text-xs text-blue-700 dark:text-blue-300">
              Esta función utiliza una celda en tu Google Sheet (ID: 1EaYm...bd8) para almacenar el estado completo de la aplicación. Ideal para cambiar de dispositivo sin perder información.
            </p>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 px-4 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">
          <CloudOff size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
          <p className="text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
            Inicia sesión con Google para habilitar el respaldo automático y la sincronización entre dispositivos.
          </p>
        </div>
      )}
    </div>
  );
};
