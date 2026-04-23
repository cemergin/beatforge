import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { PWAStatus } from './lib/pwa';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <PWAStatus />
  </StrictMode>,
);
