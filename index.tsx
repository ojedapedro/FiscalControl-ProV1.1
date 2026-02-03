
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { ThemeProvider } from './components/ThemeContext';

// Componente para capturar errores y mostrar algo útil en lugar de pantalla blanca
class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: any, errorInfo: any}> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("CRITICAL APP ERROR:", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-8 text-center font-sans">
          <div className="bg-red-500/10 border border-red-500/50 p-6 rounded-2xl max-w-2xl">
            <h1 className="text-2xl font-bold text-red-400 mb-4">Algo salió mal</h1>
            <p className="mb-4 text-slate-300">La aplicación ha encontrado un error crítico al iniciarse.</p>
            <div className="bg-black/50 p-4 rounded-lg text-left overflow-auto max-h-60 text-xs font-mono mb-4 text-red-200">
              {this.state.error && this.state.error.toString()}
              <br />
              {this.state.errorInfo && this.state.errorInfo.componentStack}
            </div>
            <button 
              onClick={() => window.location.reload()} 
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-bold transition-colors"
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

const rootElement = document.getElementById('root');

if (!rootElement) {
  console.error("FATAL: No root element found");
} else {
  try {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <ErrorBoundary>
          <ThemeProvider>
            <App />
          </ThemeProvider>
        </ErrorBoundary>
      </React.StrictMode>
    );
    console.log("React mount initiated successfully");
  } catch (err) {
    console.error("Error during React mounting:", err);
    rootElement.innerHTML = `<div style="padding: 20px; color: red;">Error mounting React app: ${err}</div>`;
  }
}
