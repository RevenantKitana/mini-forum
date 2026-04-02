import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const apiUrl = (env.VITE_API_URL || '').trim();
  
  if (!apiUrl) {
    throw new Error('❌ VITE_API_URL is not set. Check admin-client/.env or .env.local and set it to your API URL.');
  }
  
  const originMatch = apiUrl.match(/^(https?:\/\/[^/]+)/);
  if (!originMatch) {
    throw new Error(`❌ VITE_API_URL must be a valid URL (e.g., https://api.example.com). Got: ${apiUrl}`);
  }
  
  const proxyTarget = originMatch[1];

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 5174,
      strictPort: true,
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
          secure: true,
        },
      },
    },
  };
});
