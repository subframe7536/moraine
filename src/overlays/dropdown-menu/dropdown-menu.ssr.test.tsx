import { fireEvent, waitFor } from '@solidjs/testing-library'
import { createComponent } from 'solid-js'
import { describe, expect, test } from 'vitest'

import { finishMenuExitMotion } from '../../test-utils/overlay-test'
import { hydrateFixture } from '../../test-utils/ssr-test'

import { DropdownMenu } from './dropdown-menu'
import type { DropdownMenuT } from './dropdown-menu'

describe('DropdownMenu SSR Hydration', () => {
  test('hydrates the trigger once and opens on the first keyboard action', async () => {
    let triggerReads = 0

    const { container } = hydrateFixture(
      '/src/overlays/dropdown-menu/dropdown-menu.ssr.fixture.tsx',
      'renderDropdownMenuFixture',
      () =>
        createComponent(DropdownMenu, {
          id: 'ssr-dropdown',
          items: [{ label: 'Archive' }, { label: 'Delete' }],
          get children() {
            triggerReads += 1
            return (props: DropdownMenuT.TriggerProps) => (
              <button {...props} type="button">
                Actions
              </button>
            )
          },
        }),
    )

    const serverTrigger = container.querySelector<HTMLButtonElement>('[data-slot="trigger"]')!

    expect(serverTrigger).not.toBeNull()
    expect(triggerReads).toBe(1)

    fireEvent.keyDown(serverTrigger, { key: 'ArrowDown' })
    await waitFor(() => {
      expect(
        document.body.querySelector('[data-slot="item"][data-highlighted]')?.textContent,
      ).toContain('Archive')
    })

    const content = document.body.querySelector<HTMLElement>('[data-slot="content"]')!
    fireEvent.keyDown(content, { key: 'Escape' })
    await finishMenuExitMotion()
    await waitFor(() => {
      expect(document.activeElement).toBe(serverTrigger)
    })
  })
})
