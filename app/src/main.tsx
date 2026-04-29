import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { LangProvider } from './i18n';
import { PWAStatus } from './lib/pwa';
import { ErrorBoundary, ErrorToasts } from './lib/errors';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <LangProvider>
        <App />
        <PWAStatus />
        <ErrorToasts />
      </LangProvider>
    </ErrorBoundary>
  </StrictMode>,
);
