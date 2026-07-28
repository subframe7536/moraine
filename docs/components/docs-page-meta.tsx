import { createEffect } from 'solid-js'

import type { DocsPageEntry } from './docs-route'

const SITE_NAME = 'Moraine'
const SITE_URL = 'https://ui.subf.dev/'

function updateMeta(selector: string, content: string): void {
  document.querySelector<HTMLMetaElement>(selector)?.setAttribute('content', content)
}

export function DocsPageMeta(props: { page?: DocsPageEntry }) {
  createEffect(() => {
    const page = props.page
    if (!page) {
      return
    }

    const title = page.path === '/' ? 'Moraine Docs' : `${page.label} - ${SITE_NAME}`
    const url = new URL(page.path.replace(/^\//, ''), SITE_URL).toString()
    document.title = title
    document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.setAttribute('href', url)
    updateMeta('meta[name="description"]', page.description)
    updateMeta('meta[property="og:title"]', title)
    updateMeta('meta[property="og:description"]', page.description)
    updateMeta('meta[property="og:url"]', url)
    updateMeta('meta[name="twitter:title"]', title)
    updateMeta('meta[name="twitter:description"]', page.description)
  })

  return null
}
