import { createRoute } from 'solid-file-router'

import { LandingPage } from './components/landing'

const title = 'Moraine — Styled & Composable Component Library for SolidJS'
const description =
  'A styled, batteries-included SolidJS component library inspired by Nuxt UI and Chakra UI. Ready-to-use composite controls and granular composable primitives powered by UnoCSS and Tailwind CSS.'
const canonical = 'https://moraine.subf.dev/'

export default createRoute({
  metadata: {
    title,
    description,
    canonical,
    meta: [
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:url', content: canonical },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description },
    ],
  },
  component: LandingPage,
})
