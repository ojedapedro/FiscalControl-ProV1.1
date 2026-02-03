
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { ThemeProvider } from './components/ThemeContext';

// Componente para capturar errores de renderizado (Error Boundary)
class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: any}> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("React Error Boundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-8 text-center">
          <div className="bg-red-900/20 border border-red-500/50 p-6 rounded-xl max-w-lg">
            <h1 className="text-xl font-bold text-red-400 mb-2">Error de Aplicación</h1>
            <p className="text-sm text-slate-300 mb-4">La aplicación encontró un problema inesperado.</p>
            <pre className="text-xs bg-black/50 p-4 rounded text-left overflow-auto max-h-40 text-red-200 font-mono">
              {this.state.error?.toString()}
            </pre>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-bold transition-colors"
            >
              Intentar Recargar
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const container = document.getElementById('root');

if (container) {
  try {
    const root = ReactDOM.createRoot(container);
    root.render(
      <React.StrictMode>
        <ErrorBoundary>
          <ThemeProvider>
            <App />
          </ThemeProvider>
        </ErrorBoundary>
      </React.StrictMode>
    );
    console.log("React app mounted successfully.");
  } catch (e) {
    console.error("Failed to mount React app:", e);
    container.innerHTML = '<div style="color:red; padding:20px;">Fatal Error: Failed to mount application. Check console.</div>';
  }
} else {
  console.error("FATAL: Element with id 'root' not found in the document.");
}
