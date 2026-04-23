import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Spec §3.3: deploy to GitHub Pages at /beatforge/.
// Base is '/' in dev; '/beatforge/' in production.
export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === 'build' ? '/beatforge/' : '/',
  server: { port: 5173 },
}));
