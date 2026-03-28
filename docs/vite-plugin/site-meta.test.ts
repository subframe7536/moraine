import { describe, expect, test } from 'vitest'

import { buildSiteMetaTags, siteMetaPlugin } from './site-meta'

const SITE_META = {
  siteName: 'Moraine',
  title: 'Moraine Docs',
  description:
    'Accessible, composable SolidJS components with atomic class styling for UnoCSS and Tailwind.',
  siteUrl: 'https://ui.subf.dev/',
  imagePath: '/og-image.png',
  imageAlt: 'Moraine Docs brand cover image',
  imageWidth: 1200,
  imageHeight: 630,
  twitterCard: 'summary_large_image' as const,
}

describe('buildSiteMetaTags', () => {
  test('builds a complete set of site metadata tags', () => {
    const tags = buildSiteMetaTags(SITE_META)

    expect(tags).toContainEqual({
      tag: 'title',
      children: 'Moraine Docs',
      injectTo: 'head',
    })
    expect(tags).toContainEqual({
      tag: 'link',
      attrs: {
        rel: 'canonical',
        href: 'https://ui.subf.dev/',
      },
      injectTo: 'head',
    })
    expect(tags).toContainEqual({
      tag: 'meta',
      attrs: {
        name: 'description',
        content: SITE_META.description,
      },
      injectTo: 'head',
    })
    expect(tags).toContainEqual({
      tag: 'meta',
      attrs: {
        property: 'og:image',
        content: 'https://ui.subf.dev/og-image.png',
      },
      injectTo: 'head',
    })
    expect(tags).toContainEqual({
      tag: 'meta',
      attrs: {
        name: 'twitter:image',
        content: 'https://ui.subf.dev/og-image.png',
      },
      injectTo: 'head',
    })
  })

  test('resolves absolute URLs from root-relative image paths', () => {
    const tags = buildSiteMetaTags({
      ...SITE_META,
      siteUrl: 'https://ui.subf.dev',
      imagePath: '/assets/cover.png',
    })

    expect(tags).toContainEqual({
      tag: 'link',
      attrs: {
        rel: 'canonical',
        href: 'https://ui.subf.dev/',
      },
      injectTo: 'head',
    })
    expect(tags).toContainEqual({
      tag: 'meta',
      attrs: {
        property: 'og:image',
        content: 'https://ui.subf.dev/assets/cover.png',
      },
      injectTo: 'head',
    })
  })
})

describe('siteMetaPlugin', () => {
  test('returns a single configured metadata set via transformIndexHtml', () => {
    const plugin = siteMetaPlugin(SITE_META)
    const hook = plugin.transformIndexHtml
    const context = {
      meta: {},
      error: () => {
        throw new Error('unexpected error')
      },
      warn: () => {},
      debug: () => {},
      info: () => {},
    } as never
    const result =
      typeof hook === 'function'
        ? hook.call(context, '<html></html>', undefined as never)
        : hook?.handler.call(context, '<html></html>', undefined as never)

    expect(Array.isArray(result)).toBe(true)
    expect(result).toEqual(buildSiteMetaTags(SITE_META))

    const tags = result as ReturnType<typeof buildSiteMetaTags>
    expect(tags.filter((tag) => tag.tag === 'title')).toHaveLength(1)
    expect(tags.filter((tag) => tag.tag === 'link' && tag.attrs?.rel === 'canonical')).toHaveLength(
      1,
    )
    expect(
      tags.filter(
        (tag) =>
          tag.tag === 'meta' &&
          (tag.attrs?.property === 'og:image' || tag.attrs?.name === 'twitter:image'),
      ),
    ).toHaveLength(2)
  })
})
