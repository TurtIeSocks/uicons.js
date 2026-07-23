import { resolve } from 'node:path'
import typescript from '@rollup/plugin-typescript'
import react from '@vitejs/plugin-react-swc'
import { defineConfig } from 'vite'
import checker from 'vite-plugin-checker'

export default defineConfig(({ mode }) => {
  const isClient = process.argv.includes('-r')
  return {
    base: isClient ? '/uicons.js/' : undefined,
    plugins:
      mode === 'development' || isClient
        ? [
            react(),
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
      outDir: isClient
        ? resolve(__dirname, './dist-web')
        : resolve(__dirname, './dist'),
      sourcemap: false,
      minify: isClient ? 'oxc' : false,
      input:
        mode === 'development' || isClient
          ? { main: resolve(__dirname, 'index.html') }
          : undefined,
      lib:
        mode === 'development' || isClient
          ? undefined
          : {
              name: 'uicons.js',
              entry: 'src/index.ts',
              fileName: (format, entry) =>
                `${entry}.${format === 'cjs' ? 'cjs' : 'mjs'}`,
              formats: ['es', 'cjs'],
            },
      rollupOptions:
        mode === 'development' || isClient
          ? {
              external: [],
            }
          : {
              plugins: [
                typescript({
                  tsconfig: './tsconfig.build.json',
                  // The plugin forces an ES module output for tree-shaking, so
                  // pair it with bundler resolution to avoid the NodeNext
                  // module/moduleResolution mismatch warning (TS5110).
                  moduleResolution: 'bundler',
                }),
              ],
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
