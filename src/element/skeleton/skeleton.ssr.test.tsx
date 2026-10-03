import { createSignal } from 'solid-js'
import { expect, test } from 'vitest'

import { Skeleton } from '../../index'
import type { SkeletonT } from '../../index'
import { hydrateFixture } from '../../test-util/ssr-test'

test('hydrates a styled placeholder and updates forwarded props and children in place', () => {
  const [label, setLabel] = createSignal('Loading')
  const [rounded, setRounded] = createSignal('rounded-full')
  const [width, setWidth] = createSignal('100px')
  const [variant, setVariant] = createSignal<SkeletonT.Variant['variant']>()
  const { container } = hydrateFixture(
    '/src/element/skeleton/skeleton.ssr.fixture.tsx',
    'renderSkeletonFixture',
    () => (
      <Skeleton
        id="loading-placeholder"
        variant={variant()}
        class={`h-4 w-24 ${rounded()}`}
        style={{ width: width() }}
      >
        <span>{label()}</span>
      </Skeleton>
    ),
  )
  const root = container.querySelector<HTMLElement>('#loading-placeholder')!
  const content = root.firstElementChild

  expect(root.style.width).toBe('100px')
  expect(root.className).toContain('rounded-full')
  expect(root.className).not.toContain('rounded-md')
  expect(root.className).toContain('animate-pulse')

  setLabel('Still loading')
  setRounded('rounded-none')
  setWidth('200px')
  setVariant('shimmer')

  expect(container.querySelector('#loading-placeholder')).toBe(root)
  expect(root.firstElementChild).toBe(content)
  expect(root.textContent).toBe('Still loading')
  expect(root.style.width).toBe('200px')
  expect(root.className).toContain('rounded-none')
  expect(root.className).not.toContain('rounded-full')
  expect(root.className).not.toContain('animate-pulse')
  expect(root.className).toContain('after:animate-shimmer')
  expect(root.hasAttribute('variant')).toBe(false)

  setVariant('pulse')
  expect(root.className).toContain('animate-pulse')
  expect(root.className).not.toContain('after:animate-shimmer')
})
