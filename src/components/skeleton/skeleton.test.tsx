import { render } from '@solidjs/testing-library'
import { createSignal } from 'solid-js'
import { expect, test } from 'vitest'

import { MoraineProvider, Skeleton } from '../../index'
import { defineTheme } from '../../theme'

test('uses the theme animation default and lets an instance override it without remounting', () => {
  const [theme, setTheme] = createSignal(
    defineTheme({ skeleton: { defaultVariants: { variant: 'shimmer' } } }),
  )
  const { container } = render(() => (
    <MoraineProvider theme={theme()}>
      <Skeleton id="themed" />
      <Skeleton id="explicit" variant="pulse" />
    </MoraineProvider>
  ))
  const themed = container.querySelector('#themed')!
  const explicit = container.querySelector('#explicit')!
  expect(themed.className).toContain('after:animate-shimmer')
  expect(explicit.className).toContain('animate-pulse')
  expect(explicit.className).not.toContain('after:animate-shimmer')

  setTheme(defineTheme({ skeleton: { defaultVariants: { variant: 'pulse' } } }))

  expect(container.querySelector('#themed')).toBe(themed)
  expect(themed.className).toContain('animate-pulse')
  expect(themed.className).not.toContain('after:animate-shimmer')
  expect(container.querySelector('#explicit')).toBe(explicit)
})
