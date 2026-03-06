
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { ThemeProvider } from './components/ThemeContext';

const container = document.getElementById('root');

if (container) {
  const root = ReactDOM.createRoot(container);
  const urlParams = new URLSearchParams(window.location.search);
  const isDemoMode = urlParams.get('demo') === 'true';

  root.render(
    <React.StrictMode>
      <ThemeProvider>
        <App isDemoMode={isDemoMode} />
      </ThemeProvider>
    </React.StrictMode>
  );
} else {
  console.error("FATAL: Element with id 'root' not found in the document.");
}
