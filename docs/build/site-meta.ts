import type { HtmlTagDescriptor, Plugin } from 'vite'

export interface DocsSiteMetaOptions {
  siteName: string
  title: string
  description: string
  siteUrl: string
  imagePath: string
  imageAlt?: string
  imageWidth?: number
  imageHeight?: number
  twitterCard?: 'summary' | 'summary_large_image'
}

function normalizeSiteUrl(siteUrl: string): string {
  return siteUrl.endsWith('/') ? siteUrl : `${siteUrl}/`
}

function resolveAbsoluteUrl(siteUrl: string, value: string): string {
  return new URL(value, normalizeSiteUrl(siteUrl)).toString()
}

export function buildSiteMetaTags(options: DocsSiteMetaOptions): HtmlTagDescriptor[] {
  const title = options.title
  const description = options.description
  const canonicalUrl = normalizeSiteUrl(options.siteUrl)
  const imageUrl = resolveAbsoluteUrl(options.siteUrl, options.imagePath)

  return [
    {
      tag: 'title',
      children: title,
      injectTo: 'head',
    },
    {
      tag: 'meta',
      attrs: {
        name: 'description',
        content: description,
      },
      injectTo: 'head',
    },
    {
      tag: 'link',
      attrs: {
        rel: 'canonical',
        href: canonicalUrl,
      },
      injectTo: 'head',
    },
    {
      tag: 'meta',
      attrs: {
        property: 'og:type',
        content: 'website',
      },
      injectTo: 'head',
    },
    {
      tag: 'meta',
      attrs: {
        property: 'og:site_name',
        content: options.siteName,
      },
      injectTo: 'head',
    },
    {
      tag: 'meta',
      attrs: {
        property: 'og:title',
        content: title,
      },
      injectTo: 'head',
    },
    {
      tag: 'meta',
      attrs: {
        property: 'og:description',
        content: description,
      },
      injectTo: 'head',
    },
    {
      tag: 'meta',
      attrs: {
        property: 'og:url',
        content: canonicalUrl,
      },
      injectTo: 'head',
    },
    {
      tag: 'meta',
      attrs: {
        property: 'og:image',
        content: imageUrl,
      },
      injectTo: 'head',
    },
    {
      tag: 'meta',
      attrs: {
        property: 'og:image:width',
        content: String(options.imageWidth ?? 1200),
      },
      injectTo: 'head',
    },
    {
      tag: 'meta',
      attrs: {
        property: 'og:image:height',
        content: String(options.imageHeight ?? 630),
      },
      injectTo: 'head',
    },
    {
      tag: 'meta',
      attrs: {
        property: 'og:image:alt',
        content: options.imageAlt ?? title,
      },
      injectTo: 'head',
    },
    {
      tag: 'meta',
      attrs: {
        name: 'twitter:card',
        content: options.twitterCard ?? 'summary_large_image',
      },
      injectTo: 'head',
    },
    {
      tag: 'meta',
      attrs: {
        name: 'twitter:title',
        content: title,
      },
      injectTo: 'head',
    },
    {
      tag: 'meta',
      attrs: {
        name: 'twitter:description',
        content: description,
      },
      injectTo: 'head',
    },
    {
      tag: 'meta',
      attrs: {
        name: 'twitter:image',
        content: imageUrl,
      },
      injectTo: 'head',
    },
    {
      tag: 'meta',
      attrs: {
        name: 'twitter:image:alt',
        content: options.imageAlt ?? title,
      },
      injectTo: 'head',
    },
  ]
}

export function siteMetaPlugin(options: DocsSiteMetaOptions): Plugin {
  return {
    name: 'moraine-site-meta',
    transformIndexHtml: {
      handler() {
        return buildSiteMetaTags(options)
      },
    },
  }
}
