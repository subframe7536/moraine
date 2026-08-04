import { fireEvent, render, waitFor } from '@solidjs/testing-library'
import { Show } from 'solid-js'
import { describe, expect, test } from 'vitest'

import { ModalContent, ModalRoot, ModalTrigger } from './modal.tsx'

describe('Modal primitives', () => {
  test('does not instantiate closed content and mounts it once after opening', async () => {
    let instances = 0

    render(() => (
      <ModalRoot hasOverlay={false} hasContent>
        <ModalTrigger>
          <button type="button">Open</button>
        </ModalTrigger>
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
    await fireEvent.click(document.querySelector('button')!)

    await waitFor(() => {
      expect(instances).toBe(1)
      expect(document.body.textContent).toContain('Content')
    })
  })
})
