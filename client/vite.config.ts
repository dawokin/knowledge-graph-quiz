import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// GitHub Pages project sites serve from /<repo>/, not /. Vercel/Netlify serve
// from /. Set BASE_PATH when building for a subpath, e.g.:
//   BASE_PATH=/knowledge-graph-quiz/ npm run build
export default defineConfig({
  base: process.env.BASE_PATH || '/',
  plugins: [react()],
  server: {
    port: 5173,
    // Without an explicit host, Vite's "localhost" default can end up bound to
    // only one of IPv4/IPv6 depending on the OS's resolver order (seen on
    // Windows: server listens on [::1] only, so http://127.0.0.1:5173 and
    // sometimes even http://localhost:5173 get ECONNREFUSED). Binding all
    // IPv4 interfaces sidesteps that ambiguity.
    host: '0.0.0.0',
  },
});
