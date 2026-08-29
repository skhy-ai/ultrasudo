import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import obfuscatorPlugin from 'vite-plugin-javascript-obfuscator';
import fs from 'fs-extra';
import path from 'path';

const staticAppFolders = [
  'ai',
  'api-key-manager',
  'auth',
  'birthday-card-generator',
  'browser-ui',
  'calendar',
  'calculator',
  'code-generator',
  'community',
  'currency-converter',
  'desktop',
  'financial-service',
  'galactic-simulator',
  'grocery',
  'Healthy-kitchen',
  'home-diagnostics',
  'invoice-generator',
  'investment-board',
  'kanban-board',
  'life-board',
  'markdown-editor',
  'mermaid-editor',
  'music',
  'news',
  'notebook',
  'openfang',
  'patent-researcher',
  'photo-editor',
  'pomodoro-timer',
  'p2p-calling',
  'pqc-education',
  'portfolio-manager',
  'python-IDE',
  'quote-and-catalog-generator',
  'quote-generator',
  'send-money',
  'social-feed',
  'spreadsheet-app',
  'stock-screener',
  'stock-ticker',
  'timer',
  'todo-list',
  'vpn',
  'weather',
  'yoga',
];

function copyStaticApps() {
  return {
    name: 'copy-static-apps',
    closeBundle: async () => {
      const srcDir = path.resolve(__dirname);
      const outDir = path.resolve(__dirname, 'dist');
      
      for (const folder of staticAppFolders) {
        const srcPath = path.join(srcDir, folder);
        const destPath = path.join(outDir, folder);
        if (fs.existsSync(srcPath)) {
          await fs.copy(srcPath, destPath);
          console.log(`Copied ${folder} to dist/`);
        }
      }

      // Also copy dashboard files and workers
      const extraFiles = ['dashboard.html', 'dashboard.css', 'dashboard.js', 'sw-register.js', 'service-worker.js', 'public/ultrasudo-logo.png'];
      for (const file of extraFiles) {
        const srcFile = path.join(srcDir, file);
        const destFile = path.join(outDir, path.basename(file));
        if (fs.existsSync(srcFile)) {
          await fs.copy(srcFile, destFile);
          console.log(`Copied ${file} to dist/`);
        }
      }
    }
  };
}

export default defineConfig(({ command }) => ({
  root: '.',
  base: command === 'build' ? './' : '/',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        dashboard: path.resolve(__dirname, 'dashboard.html'),
      }
    }
  },
  plugins: [
    react(),
    copyStaticApps(),
    obfuscatorPlugin({
      include: ['src/**/*.js', 'src/**/*.jsx'],
      exclude: [/node_modules/],
      apply: 'build',
      debugger: false,
      options: {
        compact: true,
        controlFlowFlattening: true,
      }
    }),
  ],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: false,
    cors: true,
    hmr: true
  }
}));
