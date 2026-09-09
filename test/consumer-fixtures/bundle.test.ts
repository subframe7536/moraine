// @vitest-environment node

import { describe, expect, test } from 'vitest'

import { buildConsumerBundle } from './bundle.ts'

describe('published component bundle ownership', () => {
  test('excludes official presentation from a component-only consumer', async () => {
    const bundle = await buildConsumerBundle("export { Button } from 'moraine'")
    expect(bundle.code).toContain('Button')
    expect(bundle.code).not.toContain('defaultTheme')
    expect(bundle.code).not.toContain('--s-len')
    expect(bundle.code).not.toContain('animate-accordion-down')
    console.info(`component-only Button: ${bundle.raw} raw bytes, ${bundle.gzip} gzip bytes`)
  })

  test('keeps the Provider independent of official presentation', async () => {
    const bundle = await buildConsumerBundle("export { Button, MoraineProvider } from 'moraine'")
    expect(bundle.code).not.toContain('defaultTheme')
    expect(bundle.code).not.toContain('--s-len')
    expect(bundle.code).not.toContain('animate-accordion-down')
  })

  test('includes official presentation when explicitly imported from the theme entry', async () => {
    const bundle = await buildConsumerBundle(
      "export { Button, MoraineProvider } from 'moraine'; export { defaultTheme } from 'moraine/theme'",
    )
    expect(bundle.code).toContain('defaultTheme')
    expect(bundle.code).toContain('--s-len')
    expect(bundle.code).toContain('animate-accordion-down')
  })
})
