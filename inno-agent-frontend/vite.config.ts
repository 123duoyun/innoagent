import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    server: {
      proxy: {
        '/auth': {
          target: 'http://localhost:3000',
          changeOrigin: true,
        },
        '/api': {
          target: env.VITE_INNO_AGENT_API_PROXY_TARGET || 'http://localhost:3000',
          changeOrigin: true,
        },
        '/healthz': {
          target: 'http://localhost:3000',
          changeOrigin: true,
        },
      },
    },
  };
});
