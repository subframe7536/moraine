import path from 'node:path'
import { fileURLToPath } from 'node:url'

import uno from '@subf/unocss/vite'
import { defineConfig } from 'vite'
import solid from 'vite-plugin-solid'

import { docsPlugin, siteMetaPlugin } from './vite-plugin'

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
    docsPlugin(),
    uno({ inspector: false }),
    solid(),
  ],
  resolve: {
    alias: {
      '@src': path.resolve(fileURLToPath(new URL('.', import.meta.url)), '../src'),
    },
    dedupe: ['solid-js', '@solidjs/router'],
  },
})
