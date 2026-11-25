import path from 'node:path'

import solid from '@solidjs/vite-plugin'
import { configDefaults, defineConfig } from 'vitest/config'

import { variantGroupPlugin } from './build/vite-plugin-variant-group.ts'

// These tests rely on Node or window behavior that differs inside a VM context.
const VM_INCOMPATIBLE_TESTS = [
  'docs/build/api-doc/highlight.test.ts',
  'docs/build/plugin.test.ts',
  'src/components/textarea/textarea.test.tsx',
  'src/components/shared/overlay/menu/menu.utils.test.tsx',
]

export default defineConfig({
  define: {
    'process.env.NODE_ENV': JSON.stringify('test'),
  },
  resolve: {
    alias: [
      // `fireEvent` does not flush Solid 2's microtask queue; route it through the
      // test-util wrapper that flushes after every dispatch.
      {
        find: /^@solidjs\/testing-library$/,
        replacement: path.resolve('src/test-util/testing-library.ts'),
      },
      {
        find: '#tl',
        replacement: path.resolve('node_modules/@solidjs/testing-library/dist/index.js'),
      },
      { find: '@src', replacement: path.resolve('src') },
      { find: '#binding', replacement: path.resolve('docs/node_modules/satteri/dist/binding.js') },
      {
        find: path.resolve('docs/node_modules/satteri/dist/binding.browser.js'),
        replacement: path.resolve('docs/node_modules/satteri/dist/binding.js'),
      },
      {
        find: path.resolve('docs/node_modules/satteri/satteri_napi.wasi-browser.js'),
        replacement: path.resolve('docs/node_modules/satteri/satteri_napi.wasi.cjs'),
      },
    ],
    dedupe: ['solid-js'],
  },
  plugins: [variantGroupPlugin(), solid({ dev: false, solid: { hydratable: true } })],
  test: {
    globalSetup: ['./src/test-util/ssr-global-setup.ts'],
    exclude: [...configDefaults.exclude, 'test/acceptance/docs-preview.test.ts'],
    sequence: { groupOrder: 0 },
    environment: 'jsdom',
    projects: [
      {
        test: {
          name: 'vm',
          pool: 'vmThreads',
          include: [
            'src/**/*.{test,spec}.?(c|m)[jt]s?(x)',
            'docs/**/*.{test,spec}.?(c|m)[jt]s?(x)',
            'test/**/*.{test,spec}.?(c|m)[jt]s?(x)',
            'build/**/*.{test,spec}.?(c|m)[jt]s?(x)',
          ],
          exclude: [...VM_INCOMPATIBLE_TESTS, 'test/consumer-fixtures/**'],
          setupFiles: ['./src/test-util/jsdom-exit-animation.ts'],
        },
      },
      {
        test: {
          name: 'forks',
          pool: 'forks',
          include: VM_INCOMPATIBLE_TESTS,
        },
      },
      {
        test: {
          name: 'consumer',
          pool: 'vmThreads',
          environment: 'node',
          include: ['test/consumer-fixtures/**/*.test.ts'],
          globalSetup: ['./test/consumer-fixtures/global-setup.ts'],
        },
      },
    ],
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
        inline: ['@solidjs/router', 'satteri', 'solid-file-router'],
      },
    },
  },
})
