import { createSignal, Show } from 'solid-js'
import { expect, test } from 'vitest'

import { hydrateFixture, renderSsrFixture } from '../../test-util/ssr-test'

import { Resizable } from './resizable'

test('renders record-driven panel sizes on the server without measurement', () => {
  const { container } = hydrateFixture(
    '/src/components/resizable/resizable.ssr.fixture.tsx',
    'renderResizableFixture',
    () => (
      <Resizable defaultValue={{ a: 30 }}>
        <Resizable.Panel id="a">Navigation</Resizable.Panel>
        <Resizable.Handle>Resize</Resizable.Handle>
        <Resizable.Panel id="b">Main content</Resizable.Panel>
      </Resizable>
    ),
  )

  // Server markup carries stable flex styles: 'a' uses its record entry,
  // 'b' fills the remainder with the grow fallback.
  const markup = renderSsrFixture(
    '/src/components/resizable/resizable.ssr.fixture.tsx',
    'renderResizableFixture',
  )
  const serverA = /style="([^"]*)"[^>]*id="a"/.exec(markup)
  const serverB = /style="([^"]*)"[^>]*id="b"/.exec(markup)
  expect(serverA?.[1]).toContain('flex-basis:30%')
  expect(serverB?.[1]).toContain('flex-grow:1')
  expect(serverB?.[1]).toContain('flex-basis:0%')

  const panels = container.querySelectorAll<HTMLElement>('[data-slot="resizable-panel"]')
  expect(panels).toHaveLength(2)
  // Hydration reuses the server nodes; once settled the resolved layout applies.
  expect(panels[0]!.id).toBe('a')
  expect(panels[1]!.id).toBe('b')
  expect(panels[1]!.style.flexBasis).toBe('70%')
  expect(container.querySelectorAll('[data-slot="resizable-handle"]')).toHaveLength(1)
  expect(container.textContent).toContain('NavigationResizeMain content')
})

test('renders collapsed pre-settle state on the server without normalization', () => {
  const { container } = hydrateFixture(
    '/src/components/resizable/resizable.ssr.fixture.tsx',
    'renderResizableCollapsedFixture',
    () => (
      <Resizable defaultValue={{ a: 0, b: 100 }}>
        <Resizable.Panel id="a" collapsible min={20}>
          Navigation
        </Resizable.Panel>
        <Resizable.Handle>Resize</Resizable.Handle>
        <Resizable.Panel id="b">Main content</Resizable.Panel>
      </Resizable>
    ),
  )

  // Server markup: the collapsed entry is not clamped up to `min`, and the
  // handle reports the recorded size instead of a normalized 100%.
  const markup = renderSsrFixture(
    '/src/components/resizable/resizable.ssr.fixture.tsx',
    'renderResizableCollapsedFixture',
  )
  const serverA = /<div[^>]*id="a"[^>]*>/.exec(markup)?.[0] ?? ''
  const serverHandle = /<div[^>]*role="separator"[^>]*>/.exec(markup)?.[0] ?? ''
  expect(serverA).toContain('flex-basis:0%')
  expect(serverA).toContain('data-collapsed')
  expect(serverHandle).toContain('aria-valuenow="0"')

  const panel = container.querySelector<HTMLElement>('#a')!
  expect(panel.hasAttribute('data-collapsed')).toBe(true)
})

test('hydrates a conditional handle child and updates it', () => {
  const [visible, setVisible] = createSignal(true)
  const { container } = hydrateFixture(
    '/src/components/resizable/resizable.ssr.fixture.tsx',
    'renderResizableShowHandleFixture',
    () => (
      <Resizable>
        <Resizable.Panel>Navigation</Resizable.Panel>
        <Resizable.Handle>
          <Show when={visible()}>Resize</Show>
        </Resizable.Handle>
        <Resizable.Panel>Main content</Resizable.Panel>
      </Resizable>
    ),
  )

  const grip = container.querySelector('[data-slot="resizable-grip"]')!
  expect(grip.textContent).toBe('Resize')
  setVisible(false)
  expect(grip.textContent).toBe('')
})
