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
      ignore: [...DEFAULT_IGNORES, 'hooks'],
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
      '@src': path.resolve(docsRoot, '../src/index.ts'),
    },
    dedupe: ['solid-js', '@solidjs/router'],
  },
} as unknown as UserConfig

export default config
