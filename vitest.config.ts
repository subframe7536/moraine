import path from 'node:path'

import solid from 'vite-plugin-solid'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  define: {
    'process.env.NODE_ENV': JSON.stringify('test'),
  },
  resolve: {
    alias: {
      '#binding': path.resolve('node_modules/satteri/dist/binding.js'),
      [path.resolve('node_modules/satteri/dist/binding.browser.js')]: path.resolve(
        'node_modules/satteri/dist/binding.js',
      ),
      [path.resolve('node_modules/satteri/satteri_napi.wasi-browser.js')]: path.resolve(
        'node_modules/satteri/satteri_napi.wasi.cjs',
      ),
    },
    dedupe: ['solid-js', '@solidjs/router'],
  },
  plugins: [solid({ hot: false, solid: { hydratable: true } })],
  test: {
    globalSetup: ['./src/test-utils/ssr-global-setup.ts'],
    include: [
      'src/**/*.{test,spec}.?(c|m)[jt]s?(x)',
      'docs/**/*.{test,spec}.?(c|m)[jt]s?(x)',
      'test/**/*.{test,spec}.?(c|m)[jt]s?(x)',
    ],
    environment: 'jsdom',
    globals: true,
    server: {
      deps: {
        inline: ['@solidjs/router', 'satteri'],
      },
    },
  },
})
