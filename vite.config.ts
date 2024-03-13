import { resolve } from 'path'

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import checker from 'vite-plugin-checker'
import typescript from '@rollup/plugin-typescript'

export default defineConfig(({ mode }) => {
  const isRelease = process.argv.includes('-r')
  return {
    base: isRelease ? '/uicons.js/' : undefined,
    plugins:
      mode === 'development' || isRelease
        ? [
            react({
              jsxRuntime: 'classic',
            }),
            checker({
              overlay: {
                initialIsOpen: false,
              },
              typescript: {
                tsconfigPath: resolve(__dirname, 'tsconfig.json'),
              },
            }),
          ]
        : [],
    build: {
      target: ['safari11.1', 'chrome64', 'firefox66', 'edge88'],
      outDir: isRelease ? resolve(__dirname, './dist-web') : resolve(__dirname, './dist'),
      sourcemap: isRelease ? false : true,
      minify: isRelease ? 'esbuild' : false,
      input:
        mode === 'development' || isRelease
          ? { main: resolve(__dirname, 'index.html') }
          : undefined,
      lib:
        mode === 'development' || isRelease
          ? undefined
          : {
              name: 'uicons.js',
              entry: 'src/index.ts',
              fileName: 'index',
            },
      rollupOptions:
        mode === 'development' || isRelease
          ? {}
          : {
              plugins: [typescript({ tsconfig: './tsconfig.build.json' })],
            },
      assetsDir: '',
      emptyOutDir: true,
    },
    server: {
      host: '0.0.0.0',
      open: true,
      port: 3001,
      fs: {
        strict: false,
      },
    },
  }
})
