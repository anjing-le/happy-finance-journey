import { defineConfig } from 'vite';
export default defineConfig({
  base: process.env.BASE_PATH || '/',
  define: { __SITE_BASE__: JSON.stringify(process.env.BASE_PATH || '/') },
  build: { target: 'es2022' },
});
