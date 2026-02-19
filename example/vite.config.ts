import { resolve } from 'node:path'

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'uicons.js': resolve(__dirname, '../src/index.ts'),
    },
  },
  server: {
    host: '0.0.0.0',
    open: true,
    port: 3001,
    fs: {
      allow: ['..'],
    },
  },
})
