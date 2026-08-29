import path from 'node:path'
import { fileURLToPath } from 'node:url'

import uno from '@subf/unocss/vite'
import { DEFAULT_IGNORES, fileRouter } from 'solid-file-router/plugin'
import type { UserConfig } from 'vite'
import solid from 'vite-plugin-solid'

import {
  createDocsMdxOptions,
  docsBuildPlugin,
  llmsTxtPlugin,
  siteMetaPlugin,
} from './build/index.ts'
import unocfg from './unocss.config.ts'

const docsRoot = fileURLToPath(new URL('.', import.meta.url))
const projectRoot = path.resolve(docsRoot, '..')
const site = {
  siteName: 'Moraine',
  description:
    'Accessible, composable SolidJS components with atomic class styling for UnoCSS and Tailwind.',
  siteUrl: 'https://ui.subf.dev/',
}

const config = {
  plugins: [
    docsBuildPlugin({ projectRoot }) as unknown,
    uno(unocfg) as unknown,
    solid({ ssr: true, extensions: ['.mdx'] }) as unknown,
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
    }) as unknown,
    siteMetaPlugin({
      ...site,
      title: 'Moraine Docs',
      imagePath: '/og-image.png',
      imageAlt: 'Moraine Docs brand cover image',
      imageWidth: 1200,
      imageHeight: 630,
      twitterCard: 'summary_large_image',
    }) as unknown,
    llmsTxtPlugin({ projectRoot, ...site }) as unknown,
  ] as unknown as UserConfig['plugins'],
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
} as unknown as UserConfig

export default config
