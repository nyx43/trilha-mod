import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { normalizeSiteUrl } from './src/config/site';
import { catalogPlugin } from './scripts/catalogPlugin';
import { socialPlugin } from './scripts/socialPlugin';
import { apiDevPlugin } from './scripts/apiDevPlugin';
import { privateDrafts } from './scripts/editorial/privateDrafts';

const publicOrigin =
  normalizeSiteUrl(process.env.SITE_URL) ?? normalizeSiteUrl(process.env.VITE_SITE_URL);
const isAndroidBuild =
  process.env.VITE_APP_TARGET === 'android' || process.env.VITE_OFFLINE_APP === '1';
const contentVersion = process.env.TRILHA_CONTENT_VERSION?.trim() || 'local';

export default defineConfig({
  define: {
    ...(publicOrigin ? { __TRILHA_PUBLIC_ORIGIN__: JSON.stringify(publicOrigin) } : {}),
    __TRILHA_OFFLINE_APP__: JSON.stringify(isAndroidBuild),
    __TRILHA_CONTENT_VERSION__: JSON.stringify(contentVersion),
  },
  envDir: process.env.TRILHA_ENV_DIR,
  build: {
    outDir: isAndroidBuild ? 'dist-android' : 'dist',
    emptyOutDir: true,
  },
  server: {
    fs: { deny: ['.env', '.env.*', '*.{crt,pem}', '**/.git/**', '**/.cache/editorial/**'] },
  },
  plugins: isAndroidBuild
    ? [privateDrafts(), react(), catalogPlugin()]
    : [privateDrafts(), react(), catalogPlugin(), socialPlugin(), apiDevPlugin()],
  // Only reached through the lazy developer mode panel, so the dev server would find them too late.
  optimizeDeps: {
    include: [
      'react-syntax-highlighter/dist/esm/prism-light',
      'react-syntax-highlighter/dist/esm/languages/prism/tsx',
      'react-syntax-highlighter/dist/esm/languages/prism/typescript',
      'react-syntax-highlighter/dist/esm/languages/prism/css',
      'react-syntax-highlighter/dist/esm/languages/prism/json',
    ],
  },
});
