import { expect, test } from 'vitest'

import { hydrateFixture } from '../../test-utils/ssr-test.ts'

import { Resizable } from './resizable.tsx'

test('hydrates compound panels and handles in the server order', () => {
  const { container } = hydrateFixture(
    '/src/elements/resizable/resizable.ssr.fixture.tsx',
    'renderResizableFixture',
    () => (
      <Resizable>
        <Resizable.Panel id="navigation">Navigation</Resizable.Panel>
        <Resizable.Handle>Resize</Resizable.Handle>
        <Resizable.Panel>Main content</Resizable.Panel>
      </Resizable>
    ),
  )

  expect(container.querySelectorAll('[data-slot="panel"]')).toHaveLength(2)
  expect(container.querySelectorAll('[data-slot="divider"]')).toHaveLength(1)
  expect(container.textContent).toContain('NavigationResizeMain content')
})
