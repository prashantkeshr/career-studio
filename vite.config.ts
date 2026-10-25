import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

// `base` is configurable for static hosting under a subdirectory (e.g. GitHub Pages
// project pages served from /career-studio/). Set CS_BASE when building for a subpath:
//   CS_BASE=/career-studio/ npm run build
// Routing uses HashRouter so deep links and refreshes work on any static host.
export default defineConfig({
  base: process.env.CS_BASE || '/',
  plugins: [react()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
});
