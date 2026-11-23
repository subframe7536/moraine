import { fileURLToPath } from 'node:url'

import solid from '@solidjs/vite-plugin'
import uno from '@subf/unocss/vite'
import path from 'pathe'
import { fileRouter, DefaultFileSystemRouter } from 'solid-file-router/plugin'
import { defineConfig } from 'vite'

import { variantGroupPlugin } from '../build/vite-plugin-variant-group.ts'

import { DocsFileSystemRouter } from './build/docs-router.ts'
import { createDocsMdxOptions, DOCS_SITE, docsBuildPlugin, llmsTxtPlugin } from './build/index.ts'
import unocfg from './unocss.config.ts'
const docsRoot = fileURLToPath(new URL('.', import.meta.url))
const projectRoot = path.resolve(docsRoot, '..')
const sourceRoot = path.resolve(projectRoot, 'src')

const docsRouter = new DocsFileSystemRouter([
  new DefaultFileSystemRouter({
    dir: path.join(docsRoot, 'routes'),
    extensions: ['js', 'jsx', 'ts', 'tsx', 'md', 'mdx'],
    ignore: ['components/**', 'hooks/**', 'docs-route.ts', 'router.ts', '**/*.test.tsx'],
  }),
  new DefaultFileSystemRouter({
    dir: path.join(docsRoot, 'pages'),
    extensions: ['md', 'mdx'],
    ignore: ['**/*.test.tsx'],
  }),
])

export default defineConfig({
  plugins: [
    variantGroupPlugin(),
    docsBuildPlugin({ projectRoot }),
    uno(unocfg),
    solid({
      start: {
        app: 'App.tsx',
        document: 'Document.tsx',
        clientSetup: 'client-setup.ts',
      },
      ssr: true,
      extensions: ['.mdx'],
    }),
    fileRouter({
      // The docs site routes two trees: app route modules under routes/ and
      // Markdown/MDX content pages under pages/.
      router: docsRouter,
      mdx: createDocsMdxOptions(projectRoot),
      output: 'routes.d.ts',
      ssg: {
        concurrency: 4,
      },
    }),
    llmsTxtPlugin({ projectRoot, ...DOCS_SITE }),
  ],
  resolve: {
    alias: {
      // beta.2's exports map lacks the `./mdx/jsx-runtime` subpath that
      // Satteri's jsxImportSource emits; `./mdx` is the same module.
      'solid-file-router/mdx/jsx-runtime': 'solid-file-router/mdx',
      '@src': sourceRoot,
      moraine: sourceRoot,
    },
    dedupe: ['solid-js', 'solid-js', '@solidjs/router'],
  },
  optimizeDeps: {
    entries: ['routes/**/*.{ts,tsx}', 'pages/**/*.{ts,tsx}', '!**/*.test.*'],
  },
  build: {
    rolldownOptions: {
      checks: { pluginTimings: false },
    },
  },
  environments: {
    ssr: {
      resolve: {
        // The server bundle imports `virtual:routes` through solid-file-router;
        // externalizing it leaves an unresolvable specifier in dist/server/server.js.
        noExternal: ['solid-file-router'],
      },
      build: {
        rolldownOptions: {
          output: {
            // `resolveHandler` imports server.js with a `?t=` cache-buster. If lazy route
            // chunks back-import `../server.js`, Node loads a second copy and shared
            // singletons (router context) lose identity, so inline the dynamic imports.
            inlineDynamicImports: true,
          },
        },
      },
    },
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
