import solid from '@solidjs/vite-plugin'
import uno from '@subf/unocss/vite'
import path from 'pathe'
import { fileRouter } from 'solid-file-router/plugin'
import { defineConfig } from 'vite'

import { variantGroupPlugin } from '../build/vite-plugin-variant-group.ts'

import {
  createDocsMdxOptions,
  DOCS_SITE,
  docsBuildPlugin,
  docsDevBarrelPlugin,
  llmsTxtPlugin,
} from './build/index.ts'
import unocfg from './unocss.config.ts'
const docsRoot = import.meta.dirname
const projectRoot = path.resolve(docsRoot, '..')
const sourceRoot = path.resolve(projectRoot, 'src')

export default defineConfig(({ command }) => ({
  plugins: [
    variantGroupPlugin(),
    docsBuildPlugin({ projectRoot }),
    docsDevBarrelPlugin({ projectRoot }),
    uno(
      command === 'serve'
        ? {
            ...unocfg,
            content: {
              filesystem: ['build/markdown/shared.recipe.ts'],
              pipeline: unocfg.content?.pipeline,
            },
          }
        : unocfg,
    ),
    solid({
      start: {
        app: 'App.tsx',
        document: 'Document.tsx',
      },
      ssr: true,
      extensions: ['.mdx'],
    }),
    fileRouter({
      // The docs site routes two trees: app route modules under routes/ and
      // Markdown/MDX content pages under pages/.
      pagesDir: [
        {
          dir: 'routes',
          extensions: ['js', 'jsx', 'ts', 'tsx', 'md', 'mdx'],
          ignore: ['components/**', 'hooks/**', 'docs-route.ts', 'router.ts', '**/*.test.tsx'],
        },
        {
          dir: 'pages',
          extensions: ['md', 'mdx'],
          ignore: ['**/*.test.tsx'],
        },
      ],
      eager: ['/(app)', '/'],
      mdx: createDocsMdxOptions(projectRoot, { lazyApiDoc: true }),
      output: 'routes.d.ts',
      ssg: { enable: 'build-only' },
    }),
    llmsTxtPlugin({ projectRoot, ...DOCS_SITE }),
  ],
  resolve: {
    alias: {
      '@src': sourceRoot,
      moraine: sourceRoot,
    },
    dedupe: ['solid-js', '@solidjs/web', '@solidjs/router'],
  },
  optimizeDeps: {
    entries: ['routes/**/*.{ts,tsx}', 'pages/**/*.{ts,tsx}', '!**/*.test.*'],
  },
  environments: {
    client: {
      build: {
        rolldownOptions: {
          // devtools: { mode: 'report' },
          treeshake: {
            // Route modules keep the page's MDX imports; without this every playground and preview
            // (and the components they demo) stays in the eagerly loaded route table.
            moduleSideEffects: [
              { test: /[\\/]docs[\\/]pages[\\/].*\.tsx(?:\?.*)?$/, sideEffects: false },
            ],
          },
          output: {
            // Do not group the other library modules: they read each other's recipe constants at
            // load time, and manual chunks create import cycles that run a recipe before its
            // dependency. Default splitting follows entry reachability, so it cannot cycle.
            codeSplitting: {
              groups: [
                {
                  name: 'solid-vendor',
                  test: /[\\/]node_modules[\\/](?:solid-js|@solidjs)[\\/]/,
                  priority: 30,
                  includeDependenciesRecursively: true,
                },
                {
                  name: 'moraine-theme',
                  test: /[\\/]src[\\/]theme(?:[\\/]|\.ts$)|\.class\.ts$/,
                  priority: 20,
                  includeDependenciesRecursively: true,
                },
                {
                  name: 'moraine-ui',
                  test: /[\\/]src[\\/](?:components|provider|shared)[\\/]/,
                  priority: 10,
                  entriesAware: true,
                  entriesAwareMergeThreshold: 20_000,
                },
              ],
            },
          },
        },
      },
    },
  },
}))
