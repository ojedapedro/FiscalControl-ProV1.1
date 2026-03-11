
import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import { ThemeProvider } from './components/ThemeContext';
import { ErrorBoundary } from './components/ErrorBoundary';

const container = document.getElementById('root');

if (container) {
  const root = createRoot(container);
  const urlParams = new URLSearchParams(window.location.search);
  const isDemoMode = urlParams.get('demo') === 'true';

  root.render(
    <StrictMode>
      <ErrorBoundary>
        <ThemeProvider>
          <App isDemoMode={isDemoMode} />
        </ThemeProvider>
      </ErrorBoundary>
    </StrictMode>
  );
} else {
  console.error("FATAL: Element with id 'root' not found in the document.");
}
