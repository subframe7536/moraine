import path from 'node:path'
import { fileURLToPath } from 'node:url'

import uno from '@subf/unocss/vite'
import { DEFAULT_IGNORES, fileRouter } from 'solid-file-router/plugin'
import { defineConfig } from 'vite'
import solid from 'vite-plugin-solid'

import { variantGroupPlugin } from '../vite-plugin-variant-group.ts'

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

export default defineConfig({
  plugins: [
    variantGroupPlugin(),
    docsBuildPlugin({ projectRoot }),
    uno(unocfg),
    solid({ ssr: true, extensions: ['.mdx'] }),
    fileRouter({
      pagesDir: 'routes',
      ignore: [...DEFAULT_IGNORES, 'hooks', '**/*.test.tsx'],
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
        group: 'string',
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
      '@src': path.resolve(projectRoot, 'src'),
    },
    dedupe: ['solid-js', '@solidjs/router'],
  },
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'moraine-theme',
              test: /[\\/]src[\\/]theme(?:[\\/]|\.ts$)|\.class\.ts$/,
              priority: 20,
              includeDependenciesRecursively: true,
            },
            {
              name: 'moraine-elements',
              test: /[\\/]src[\\/]elements[\\/]/,
              includeDependenciesRecursively: false,
            },
            {
              name: 'moraine-forms',
              test: /[\\/]src[\\/]forms[\\/]/,
              includeDependenciesRecursively: false,
            },
            {
              name: 'moraine-navigation',
              test: /[\\/]src[\\/]navigation[\\/]/,
              includeDependenciesRecursively: false,
            },
            {
              name: 'moraine-overlays',
              test: /[\\/]src[\\/]overlays[\\/]/,
              includeDependenciesRecursively: false,
            },
            {
              name: 'moraine-shared',
              test: /[\\/]src[\\/]shared[\\/]/,
              includeDependenciesRecursively: false,
            },
          ],
        },
      },
    },
  },
})
