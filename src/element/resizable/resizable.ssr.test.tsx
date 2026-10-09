import { createSignal, Show } from 'solid-js'
import { expect, test } from 'vitest'

import { hydrateFixture } from '../../test-util/ssr-test'

import { Resizable } from './resizable'

test('hydrates compound panels and handles in the server order', () => {
  const { container } = hydrateFixture(
    '/src/element/resizable/resizable.ssr.fixture.tsx',
    'renderResizableFixture',
    () => (
      <Resizable>
        <Resizable.Panel id="navigation">Navigation</Resizable.Panel>
        <Resizable.Handle>Resize</Resizable.Handle>
        <Resizable.Panel>Main content</Resizable.Panel>
      </Resizable>
    ),
  )

  expect(container.querySelectorAll('[data-slot="resizable-panel"]')).toHaveLength(2)
  expect(container.querySelectorAll('[data-slot="resizable-handle"]')).toHaveLength(1)
  expect(container.textContent).toContain('NavigationResizeMain content')
})

test('hydrates a conditional handle child and updates it', () => {
  const [visible, setVisible] = createSignal(true)
  const { container } = hydrateFixture(
    '/src/element/resizable/resizable.ssr.fixture.tsx',
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

  const handle = container.querySelector('[data-slot="resizable-handle-control"]')!
  expect(handle.textContent).toBe('Resize')
  setVisible(false)
  expect(handle.textContent).toBe('')
})
