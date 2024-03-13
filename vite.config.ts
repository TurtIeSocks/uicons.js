import { resolve } from 'path'

import { defineConfig } from 'vite'
import typescript from '@rollup/plugin-typescript'

export default defineConfig(({ mode }) => ({
  build: {
    target: ['safari11.1', 'chrome64', 'firefox66', 'edge88'],
    outDir: resolve(__dirname, './dist'),
    sourcemap: mode === 'development' ? 'inline' : false,
    minify: true,
    lib: {
      name: 'uicons.js',
      entry: 'src/index.ts',
      fileName: 'index',
    },
    rollupOptions: {
      plugins: [typescript({ tsconfig: './tsconfig.build.json' })],
    },
  },
}))
