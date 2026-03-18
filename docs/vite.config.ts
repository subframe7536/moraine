import uno from 'unocss/vite'
import { defineConfig } from 'vite'
import solid from 'vite-plugin-solid'

import { componentApiPlugin } from './vite-plugin/api-doc'
import { demoSourcePlugin } from './vite-plugin/demo-source'

export default defineConfig({
  plugins: [componentApiPlugin(), demoSourcePlugin(), uno({ inspector: false }), solid()],
  resolve: {
    dedupe: ['solid-js', '@solidjs/router'],
  },
})
