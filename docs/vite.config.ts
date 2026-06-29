import path from 'node:path'
import { fileURLToPath } from 'node:url'

import uno from '@subf/unocss/vite'
import { fileRouter } from 'solid-file-router/plugin'
import { defineConfig } from 'vite'
import solid from 'vite-plugin-solid'

import {
  createDocsRouteSource,
  docsBuildPlugin,
  getDocsPrerenderRoutes,
  siteMetaPlugin,
} from './build'
import unocfg from './unocss.config'

const docsRoot = fileURLToPath(new URL('.', import.meta.url))
const projectRoot = path.resolve(docsRoot, '..')

export default defineConfig({
  plugins: [
    siteMetaPlugin({
      siteName: 'Moraine',
      title: 'Moraine Docs',
      description:
        'Accessible, composable SolidJS components with atomic class styling for UnoCSS and Tailwind.',
      siteUrl: 'https://ui.subf.dev/',
      imagePath: '/og-image.png',
      imageAlt: 'Moraine Docs brand cover image',
      imageWidth: 1200,
      imageHeight: 630,
      twitterCard: 'summary_large_image',
    }),
    docsBuildPlugin({ projectRoot }),
    uno(unocfg),
    solid({ ssr: true, extensions: ['.mdx'] }),
    fileRouter({
      routeSource: createDocsRouteSource(projectRoot),
      output: 'routes.d.ts',
      ssg: {
        serverEntry: 'entry-server.tsx',
        id: 'app',
        routes: () => getDocsPrerenderRoutes(projectRoot),
        concurrency: 4,
      },
      infoDts: {
        key: 'string',
        title: 'string',
        group: 'string',
        status: "'new' | 'update' | 'unreleased'",
        api: 'string',
      },
    }),
  ],
  resolve: {
    alias: {
      '@src': path.resolve(docsRoot, '../src'),
    },
    dedupe: ['solid-js', '@solidjs/router'],
  },
})
