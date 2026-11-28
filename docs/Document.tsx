import type { JSX } from '@solidjs/web'
import { HydrationScript, dynamic } from '@solidjs/web'
import { For } from 'solid-js'

import { DOCS_SITE, buildSiteMetaTags } from './build/site-meta'

const ROUTE_MANAGED_META = new Set([
  'description',
  'og:title',
  'og:description',
  'og:url',
  'twitter:title',
  'twitter:description',
])

// Page-level title/description/canonical/OG/Twitter text tags are managed per route by useHead.
const SITE_TAGS = buildSiteMetaTags({
  ...DOCS_SITE,
  title: 'Moraine Docs',
  imagePath: '/og-image.png',
  imageAlt: 'Moraine Docs brand cover image',
  imageWidth: 1200,
  imageHeight: 630,
  twitterCard: 'summary_large_image',
}).filter((tag) => {
  if (tag.tag === 'title') {
    return false
  }
  if (tag.tag === 'link' && tag.attrs?.rel === 'canonical') {
    return false
  }
  if (tag.tag === 'meta') {
    const key = tag.attrs?.name ?? tag.attrs?.property
    if (typeof key === 'string' && ROUTE_MANAGED_META.has(key)) {
      return false
    }
  }
  return true
})

// Applies the system preference before modules load to avoid a wrong-theme first frame.
const THEME_INIT = `(function(){try{var t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';document.documentElement.classList.toggle('dark',t==='dark');document.documentElement.style.colorScheme=t}catch(e){}})()`

export default function Document(props: { children?: JSX.Element }): JSX.Element {
  return (
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="icon" href="/favicon.ico" sizes="48x48" />
        <link rel="icon" href="/favicon.svg" sizes="any" type="image/svg+xml" />
        <script>{THEME_INIT}</script>
        <For each={SITE_TAGS}>
          {(tag) => {
            const Tag = dynamic(() => tag.tag)
            return <Tag {...tag.attrs}>{tag.children}</Tag>
          }}
        </For>
        <HydrationScript />
      </head>
      <body>{props.children}</body>
    </html>
  )
}
