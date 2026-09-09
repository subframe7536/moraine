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
  plugins: [variantGroupPlugin(), solid({ hot: false, solid: { hydratable: true } })],
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: 'main',
          globalSetup: ['./src/test-utils/ssr-global-setup.ts'],
          include: [
            'src/**/*.{test,spec}.?(c|m)[jt]s?(x)',
            'docs/**/*.{test,spec}.?(c|m)[jt]s?(x)',
            'test/**/*.{test,spec}.?(c|m)[jt]s?(x)',
          ],
          exclude: [...configDefaults.exclude, 'test/acceptance/docs-preview.test.ts'],
          sequence: { groupOrder: 0 },
        },
      },
      {
        extends: true,
        test: {
          name: 'docs-preview',
          include: ['test/acceptance/docs-preview.test.ts'],
          environment: 'node',
          // The preview rebuilds dist, so it must run after tests consuming the build.
          sequence: { groupOrder: 1 },
        },
      },
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
