import { fireEvent, waitFor } from '@solidjs/testing-library'
import { createComponent } from 'solid-js'
import { describe, expect, test, vi } from 'vitest'

import { finishMenuExitMotion } from '../../test-utils/overlay-test.ts'
import { hydrateFixture } from '../../test-utils/ssr-test.ts'

import { ContextMenu } from './context-menu.tsx'
import type { ContextMenuT } from './context-menu.tsx'

describe('ContextMenu SSR Hydration', () => {
  test('hydrates the trigger once and opens from keyboard and long press', async () => {
    let triggerReads = 0

    const { container } = hydrateFixture(
      '/src/overlays/context-menu/context-menu.ssr.fixture.tsx',
      'renderContextMenuFixture',
      () =>
        createComponent(ContextMenu, {
          id: 'ssr-context',
          items: [{ label: 'Archive' }, { label: 'Delete' }],
          get children() {
            triggerReads += 1
            return (props: ContextMenuT.TriggerProps) => <div {...props}>Row Item</div>
          },
        }),
    )

    const serverTrigger = container.querySelector<HTMLElement>('[data-slot="trigger"]')!

    try {
      expect(serverTrigger).not.toBeNull()
      expect(triggerReads).toBe(1)

      fireEvent.keyDown(serverTrigger, { key: 'ContextMenu' })
      await waitFor(() => {
        expect(
          document.body.querySelector('[data-slot="item"][data-highlighted]')?.textContent,
        ).toContain('Archive')
      })

      let content = document.body.querySelector('[data-slot="content"]') as HTMLElement
      fireEvent.keyDown(content, { key: 'Escape' })
      await finishMenuExitMotion()

      vi.useFakeTimers()
      fireEvent.pointerDown(serverTrigger, {
        pointerId: 21,
        pointerType: 'touch',
        clientX: 30,
        clientY: 40,
      })
      await vi.advanceTimersByTimeAsync(700)
      await vi.advanceTimersByTimeAsync(16)

      expect(document.body.querySelector('[data-slot="content"][data-expanded]')).not.toBeNull()
      content = document.body.querySelector('[data-slot="content"]') as HTMLElement
      fireEvent.keyDown(content, { key: 'Escape' })
      await finishMenuExitMotion()
      await Promise.resolve()
    } finally {
      vi.useRealTimers()
    }
  })
})
