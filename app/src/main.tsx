import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { PWAStatus } from './lib/pwa';
import { ErrorBoundary, ErrorToasts } from './lib/errors';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
      <PWAStatus />
      <ErrorToasts />
    </ErrorBoundary>
  </StrictMode>,
);
