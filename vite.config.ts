import { defineConfig } from 'vite';
export default defineConfig(({ command }) => ({
  base: process.env.BASE_PATH || '/',
  define: { __SITE_BASE__: JSON.stringify(process.env.BASE_PATH || '/') },
  build: { target: 'es2022' },
  plugins: [{ name: 'dev-entry', transformIndexHtml: command === 'serve' ? () => [{ tag: 'script', attrs: { type: 'module', src: '/src/main.tsx' }, injectTo: 'body' }] : undefined }],
}));
