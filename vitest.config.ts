import path from 'node:path'

import solid from 'vite-plugin-solid'
import { configDefaults, defineConfig } from 'vitest/config'

import { variantGroupPlugin } from './vite-plugin-variant-group.ts'

export default defineConfig({
  define: {
    'process.env.NODE_ENV': JSON.stringify('test'),
  },
  resolve: {
    alias: {
      '#binding': path.resolve('docs/node_modules/satteri/dist/binding.js'),
      [path.resolve('docs/node_modules/satteri/dist/binding.browser.js')]: path.resolve(
        'docs/node_modules/satteri/dist/binding.js',
      ),
      [path.resolve('docs/node_modules/satteri/satteri_napi.wasi-browser.js')]: path.resolve(
        'docs/node_modules/satteri/satteri_napi.wasi.cjs',
      ),
    },
    dedupe: ['solid-js'],
  },
  plugins: [variantGroupPlugin(), solid({ hot: false, solid: { hydratable: true } })],
  test: {
    globalSetup: ['./src/test-util/ssr-global-setup.ts'],
    include: [
      'src/**/*.{test,spec}.?(c|m)[jt]s?(x)',
      'docs/**/*.{test,spec}.?(c|m)[jt]s?(x)',
      'test/**/*.{test,spec}.?(c|m)[jt]s?(x)',
    ],
    exclude: [...configDefaults.exclude, 'test/acceptance/docs-preview.test.ts'],
    sequence: { groupOrder: 0 },
    environment: 'jsdom',
    globals: true,
    passWithNoTests: true,
    forceRerunTriggers: [
      ...configDefaults.forceRerunTriggers,
      '**/{vitest,vite}.config.*',
      '**/package.json',
      '**/tsconfig*.json',
      '**/tsdown.config.*',
      '**/vite-plugin-variant-group.*',
      '**/src/test-util/**',
    ],
    server: {
      deps: {
        inline: ['@solidjs/router', 'satteri'],
      },
    },
  },
})
