import { createRoute } from 'solid-file-router'

import { LandingPage } from './components/landing/landing-page'

const title = 'Moraine — SolidJS component library'
const description = 'Composable SolidJS components with styling through UnoCSS and Tailwind CSS.'
const canonical = 'https://ui.subf.dev/'

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
