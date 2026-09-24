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
