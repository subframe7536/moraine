import { createRoute } from 'solid-file-router'

import { LandingPage } from './components/landing'

const title = 'Moraine — customizable components for SolidJS'
const description =
  'Accessible SolidJS components with composable recipes and flexible styling through UnoCSS and Tailwind CSS.'
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
