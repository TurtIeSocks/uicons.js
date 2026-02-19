import { resolve } from 'node:path'

import { defineConfig } from 'vite'
import typescript from '@rollup/plugin-typescript'

export default defineConfig({
  build: {
    target: ['safari11.1', 'chrome64', 'firefox66', 'edge88'],
    outDir: resolve(__dirname, './dist'),
    sourcemap: false,
    minify: false,
    lib: {
      name: 'uicons.js',
      entry: 'src/index.ts',
      fileName: (format, entry) =>
        `${entry}.${format === 'cjs' ? 'cjs' : 'mjs'}`,
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      plugins: [typescript({ tsconfig: './tsconfig.json' })],
    },
    assetsDir: '',
    emptyOutDir: true,
  },
})
