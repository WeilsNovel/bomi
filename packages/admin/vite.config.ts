import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath, URL } from 'node:url';

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    // 开发服务端口
    port: 5174,
    // 后台直连 server（ENV_CONFIG.apiBaseUrl 默认 http://localhost:3000），
    // 如需通过 Vite 代理转发，在此配置 proxy；当前 Stage 1 直连即可。
  },
});
