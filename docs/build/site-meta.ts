import type { HtmlTagDescriptor, Plugin } from 'vite'

import { scanDocsRoutes } from './routes'

export interface DocsSiteMetaOptions {
  projectRoot?: string
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

export interface DocsPageMeta {
  title: string
  description: string
  path: string
}

function normalizeSiteUrl(siteUrl: string): string {
  return siteUrl.endsWith('/') ? siteUrl : `${siteUrl}/`
}

function resolveAbsoluteUrl(siteUrl: string, value: string): string {
  return new URL(value, normalizeSiteUrl(siteUrl)).toString()
}

function resolvePageTitle(options: DocsSiteMetaOptions, page?: DocsPageMeta): string {
  if (!page || page.path === '/') {
    return options.title
  }
  return `${page.title} | ${options.siteName}`
}

function resolvePageUrl(options: DocsSiteMetaOptions, page?: DocsPageMeta): string {
  return page
    ? resolveAbsoluteUrl(options.siteUrl, page.path.replace(/^\//, ''))
    : normalizeSiteUrl(options.siteUrl)
}

export function buildSiteMetaTags(
  options: DocsSiteMetaOptions,
  page?: DocsPageMeta,
): HtmlTagDescriptor[] {
  const title = resolvePageTitle(options, page)
  const description = page?.description ?? options.description
  const canonicalUrl = resolvePageUrl(options, page)
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

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}

function replaceTag(html: string, pattern: RegExp, replacement: string): string {
  return pattern.test(html)
    ? html.replace(pattern, replacement)
    : html.replace('</head>', `  ${replacement}\n</head>`)
}

export function applyPageMetaToHtml(
  html: string,
  options: DocsSiteMetaOptions,
  page: DocsPageMeta,
): string {
  const title = escapeHtml(resolvePageTitle(options, page))
  const description = escapeHtml(page.description)
  const url = escapeHtml(resolvePageUrl(options, page))

  let output = replaceTag(html, /<title>[\s\S]*?<\/title>/i, `<title>${title}</title>`)
  output = replaceTag(
    output,
    /<meta\s+name=["']description["'][^>]*>/i,
    `<meta name="description" content="${description}">`,
  )
  output = replaceTag(
    output,
    /<link\s+rel=["']canonical["'][^>]*>/i,
    `<link rel="canonical" href="${url}">`,
  )
  for (const [attribute, key, content] of [
    ['property', 'og:title', title],
    ['property', 'og:description', description],
    ['property', 'og:url', url],
    ['name', 'twitter:title', title],
    ['name', 'twitter:description', description],
  ] as const) {
    output = replaceTag(
      output,
      new RegExp(`<meta\\s+${attribute}=["']${key}["'][^>]*>`, 'i'),
      `<meta ${attribute}="${key}" content="${content}">`,
    )
  }
  return output
}

function getPageMeta(options: DocsSiteMetaOptions, routePath: string): DocsPageMeta | undefined {
  if (!options.projectRoot) {
    return undefined
  }
  const normalizedPath = routePath === '/' ? '/' : `/${routePath.replace(/^\/+|\/+$/g, '')}`
  const route = scanDocsRoutes(options.projectRoot).find((entry) =>
    entry.info.key === 'introduction'
      ? normalizedPath === '/'
      : normalizedPath === `/${entry.info.key}`,
  )
  return route
    ? {
        title: route.info.title,
        description: route.info.description,
        path: route.info.key === 'introduction' ? '/' : `/${route.info.key}`,
      }
    : undefined
}

export function siteMetaPlugin(options: DocsSiteMetaOptions): Plugin {
  return {
    name: 'moraine-site-meta',
    transformIndexHtml: {
      handler(_html, context) {
        const requestPath = context?.originalUrl ?? context?.path ?? '/'
        return buildSiteMetaTags(options, getPageMeta(options, requestPath.split('?')[0] ?? '/'))
      },
    },
    generateBundle: {
      order: 'post',
      handler(_outputOptions, bundle) {
        if (!options.projectRoot) {
          return
        }
        for (const item of Object.values(bundle)) {
          if (item.type !== 'asset' || !item.fileName.endsWith('.html')) {
            continue
          }
          const routePath =
            item.fileName === 'index.html' ? '/' : `/${item.fileName.replace(/\.html$/, '')}`
          const page = getPageMeta(options, routePath)
          if (!page) {
            continue
          }
          const html =
            typeof item.source === 'string'
              ? item.source
              : Buffer.from(item.source).toString('utf8')
          item.source = applyPageMetaToHtml(html, options, page)
        }
      },
    },
  }
}
