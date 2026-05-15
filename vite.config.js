import { defineConfig } from 'vite';
import pkg from './package.json' assert { type: 'json' };

export default defineConfig({
  root: 'src',
  build: {
    outDir: '../dist'
  },
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
});