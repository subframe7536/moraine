import { fireEvent, render, waitFor } from '@solidjs/testing-library'
import { Show } from 'solid-js'
import { describe, expect, test } from 'vitest'

import { ModalContent, ModalRoot, ModalTrigger } from './modal.tsx'
import type { OverlayTriggerProps } from './trigger.ts'

describe('Modal primitives', () => {
  test('resolves trigger children getter once', () => {
    let childrenReads = 0

    const triggerProps = {
      get children() {
        childrenReads += 1
        return (props: OverlayTriggerProps) => (
          <button {...props} type="button">
            Open
          </button>
        )
      },
    }

    render(() => (
      <ModalRoot hasOverlay={false} hasContent={false}>
        <ModalTrigger {...triggerProps} />
      </ModalRoot>
    ))

    expect(childrenReads).toBe(1)
  })

  test('does not instantiate closed content and mounts it once after opening', async () => {
    let instances = 0

    render(() => (
      <ModalRoot hasOverlay={false} hasContent>
        <ModalTrigger
          children={(props) => (
            <button {...props} type="button">
              Open
            </button>
          )}
        />
        <Show when={true}>
          <ModalContent
            contentRender={() => {
              instances += 1
              return <span>Content</span>
            }}
          />
        </Show>
      </ModalRoot>
    ))

    expect(instances).toBe(0)
    await fireEvent.click(document.querySelector('[data-slot="trigger"]')!)

    await waitFor(() => {
      expect(instances).toBe(1)
      expect(document.body.textContent).toContain('Content')
    })
  })
})
