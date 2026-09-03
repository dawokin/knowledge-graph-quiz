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
  },
});
