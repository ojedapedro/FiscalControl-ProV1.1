import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      let errorDetails = this.state.error?.toString();
      let isFirestoreError = false;
      let firestoreInfo: any = null;

      try {
        // Check if the error message is a JSON string from handleFirestoreError
        const message = this.state.error?.message || "";
        if (message.startsWith('{"error":')) {
          firestoreInfo = JSON.parse(message);
          isFirestoreError = true;
          errorDetails = firestoreInfo.error;
        }
      } catch (e) {
        // Not a JSON error or parsing failed
      }

      return (
        <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-slate-800 border border-red-500/30 rounded-2xl p-8 shadow-2xl">
            <h1 className="text-2xl font-bold text-red-400 mb-4">
              {isFirestoreError ? 'Error de Base de Datos' : 'Algo salió mal'}
            </h1>
            <p className="text-slate-300 mb-6">
              {isFirestoreError 
                ? 'Hubo un problema al comunicarse con la base de datos. Esto puede deberse a permisos insuficientes o problemas de conexión.'
                : 'La aplicación encontró un error inesperado. Por favor, intenta recargar la página.'}
            </p>
            
            {isFirestoreError && firestoreInfo && (
              <div className="mb-6 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500 uppercase tracking-wider">Operación:</span>
                  <span className="text-blue-400 font-mono">{firestoreInfo.operationType}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500 uppercase tracking-wider">Ruta:</span>
                  <span className="text-blue-400 font-mono">{firestoreInfo.path || 'N/A'}</span>
                </div>
              </div>
            )}

            <div className="bg-black/30 p-4 rounded-lg overflow-auto max-h-40 mb-6 font-mono text-xs text-red-300">
              {errorDetails}
            </div>
            
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-colors"
            >
              Recargar Aplicación
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
