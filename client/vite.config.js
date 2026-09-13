import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load client/.env so VITE_API_TARGET is available inside this config file.
  // loadEnv merges .env, .env.local, .env.[mode], .env.[mode].local
  const env = loadEnv(mode, process.cwd(), '');

  const apiTarget = env.VITE_API_TARGET || 'http://localhost:5000';

  return {
    plugins: [react()],

    server: {
      port: 3000,
      // Dev-server proxy: any request starting with /api is forwarded to the
      // backend. This means the browser never makes a cross-origin request
      // during development — CORS is irrelevant in dev mode.
      proxy: {
        '/api': {
          target:       apiTarget,
          changeOrigin: true,
          // Uncomment to strip /api prefix before forwarding:
          // rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },

    // Production build output goes to dist/ inside client/
    build: {
      outDir:       'dist',
      emptyOutDir:  true,
      sourcemap:    false,
    },

    // Makes import.meta.env.VITE_* available in the browser bundle.
    // No extra config needed — Vite does this automatically for VITE_ prefixed vars.
  };
});
