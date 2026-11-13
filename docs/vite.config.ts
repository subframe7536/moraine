import { fileURLToPath } from 'node:url'

import uno from '@subf/unocss/vite'
import path from 'pathe'
import { DEFAULT_IGNORES, fileRouter } from 'solid-file-router/plugin'
import { defineConfig } from 'vite'
import solid from 'vite-plugin-solid'

import { variantGroupPlugin } from '../build/vite-plugin-variant-group.ts'

import {
  createDocsMdxOptions,
  DOCS_SITE,
  docsBuildPlugin,
  llmsTxtPlugin,
  siteMetaPlugin,
} from './build/index.ts'
import unocfg from './unocss.config.ts'

const docsRoot = fileURLToPath(new URL('.', import.meta.url))
const projectRoot = path.resolve(docsRoot, '..')
const sourceRoot = path.resolve(projectRoot, 'src')

export default defineConfig({
  plugins: [
    variantGroupPlugin(),
    docsBuildPlugin({ projectRoot }),
    uno(unocfg),
    solid({ ssr: true, extensions: ['.mdx'] }),
    fileRouter({
      pagesDir: 'routes',
      // MDX pages live under pages/components; ignore only route UI source files.
      ignore: [
        ...DEFAULT_IGNORES.filter((pattern) => pattern !== '**/components/**'),
        '**/components/**/*.{ts,tsx}',
        'routes/hooks/**',
        '**/*.test.tsx',
      ],
      mdx: createDocsMdxOptions(projectRoot),
      output: 'routes.d.ts',
      ssg: {
        id: 'app',
        concurrency: 4,
      },
      infoDts: {
        key: 'string',
        title: 'string',
        description: 'string',
        order: 'number',
        tags: 'string[]',
        surface: "'docs' | 'components' | 'hooks'",
        section: 'string',
        routePath: 'string',
        markdownPath: 'string',
        badge: 'string',
        api: 'string',
        sections: '{ id: string; label: string; level: number }[]',
      },
    }),
    siteMetaPlugin({
      ...DOCS_SITE,
      title: 'Moraine Docs',
      imagePath: '/og-image.png',
      imageAlt: 'Moraine Docs brand cover image',
      imageWidth: 1200,
      imageHeight: 630,
      twitterCard: 'summary_large_image',
    }),
    llmsTxtPlugin({ projectRoot, ...DOCS_SITE }),
  ],
  resolve: {
    alias: {
      '@src': sourceRoot,
      moraine: sourceRoot,
    },
    dedupe: ['solid-js', 'solid-js/store', '@solidjs/router'],
  },
  optimizeDeps: {
    entries: ['index.html', 'routes/**/*.{ts,tsx}', 'pages/**/*.{ts,tsx}', '!**/*.test.*'],
  },
  build: {
    rolldownOptions: {
      checks: { pluginTimings: false },
    },
  },
  environments: {
    client: {
      build: {
        rolldownOptions: {
          // devtools: { mode: 'report' },
          treeshake: {
            // Route modules keep the page's MDX imports; without this every playground (and the
            // components it demos) stays in the eagerly loaded route table.
            moduleSideEffects: [{ test: /[\\/]docs[\\/]pages[\\/].*\.tsx$/, sideEffects: false }],
          },
          output: {
            // Do not group the other library modules: they read each other's recipe constants at
            // load time, and manual chunks create import cycles that run a recipe before its
            // dependency. Default splitting follows entry reachability, so it cannot cycle.
            codeSplitting: {
              groups: [
                {
                  name: 'solid-vendor',
                  test: /[\\/]node_modules[\\/]solid-js[\\/]/,
                  priority: 30,
                  includeDependenciesRecursively: true,
                },
                {
                  name: 'moraine-theme',
                  test: /[\\/]src[\\/]theme(?:[\\/]|\.ts$)|\.class\.ts$/,
                  priority: 20,
                  includeDependenciesRecursively: true,
                },
              ],
            },
          },
        },
      },
    },
  },
})
