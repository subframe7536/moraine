import { defineRoute } from 'solid-file-router'

import { LandingPage } from './components/landing'
const title = 'Moraine — Styled & Composable Component Library for SolidJS'
const description =
  '60 accessible SolidJS components with semantic tokens, single and composite primitives, and first-class UnoCSS and Tailwind CSS v4 integrations.'
const canonical = 'https://moraine.subf.dev/'

export const route = defineRoute({
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
})

export default LandingPage
