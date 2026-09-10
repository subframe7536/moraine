import { fireEvent, waitFor } from '@solidjs/testing-library'
import { expect, test, vi } from 'vitest'

import { finishExitMotion } from '../../test-utils/overlay-test.ts'
import { hydrateFixture } from '../../test-utils/ssr-test.ts'

import { AccordionHydrationFixture } from './accordion.ssr.fixture.tsx'

test('hydrates expanded JSX and mounts and releases an initially closed panel', async () => {
  const mounted = vi.fn()
  const cleaned = vi.fn()
  const { container } = hydrateFixture(
    '/src/elements/accordion/accordion.ssr.fixture.tsx',
    'renderAccordionFixture',
    () => <AccordionHydrationFixture onMount={mounted} onCleanup={cleaned} />,
  )
  const triggers = container.querySelectorAll('button')
  expect(container.querySelectorAll('button svg')).toHaveLength(2)
  expect(container.textContent).toContain('First panel')
  expect(container.textContent).not.toContain('Second panel')
  expect(mounted).not.toHaveBeenCalled()
  triggers[0]!.focus()
  fireEvent.keyDown(triggers[0]!, { key: 'ArrowDown' })
  expect(document.activeElement).toBe(triggers[1])
  fireEvent.click(triggers[1]!)
  expect(container.textContent).toContain('Second panel')
  expect(mounted).toHaveBeenCalledTimes(1)
  fireEvent.click(triggers[1]!)
  await finishExitMotion()
  await waitFor(() => expect(cleaned).toHaveBeenCalledTimes(1))
  expect(container.textContent).not.toContain('Second panel')
  fireEvent.click(triggers[1]!)
  expect(mounted).toHaveBeenCalledTimes(2)
})
