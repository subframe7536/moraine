import { createSignal } from 'solid-js'
import { expect, test } from 'vitest'

import { hydrateFixture, renderSsrFixture } from '../../test-utils/ssr-test.ts'

import { NativeReadonlyFixture } from './native-readonly.ssr.fixture.tsx'

test.each([false, true])('preserves native readonly=%s before and after hydration', (initial) => {
  const fixturePath = '/src/forms/shared/native-readonly.ssr.fixture.tsx'
  const exportName = initial ? 'renderReadonlyFixture' : 'renderEditableFixture'
  const server = document.createElement('div')
  server.innerHTML = renderSsrFixture(fixturePath, exportName)
  const serverInputs = server.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(
    'input,textarea',
  )
  expect(serverInputs).toHaveLength(9)
  for (const input of serverInputs) {
    expect(input.readOnly, `${input.type} SSR readonly`).toBe(initial)
  }

  const [readOnly, setReadOnly] = createSignal(initial)
  const { container } = hydrateFixture(fixturePath, exportName, () => (
    <NativeReadonlyFixture readOnly={readOnly()} />
  ))
  const inputs = container.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(
    'input,textarea',
  )
  for (const input of inputs) {
    expect(input.readOnly).toBe(initial)
  }
  setReadOnly(!initial)
  for (const input of inputs) {
    expect(input.readOnly).toBe(!initial)
  }
  setReadOnly(initial)
  for (const input of inputs) {
    expect(input.readOnly).toBe(initial)
  }
})
