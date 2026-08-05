import { fireEvent, render, waitFor } from '@solidjs/testing-library'
import { describe, expect, test } from 'vitest'

import { PopperContent, PopperRoot, PopperTrigger } from './popper.tsx'
import type { OverlayTriggerProps } from './trigger.ts'

describe('Popper primitives', () => {
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
      <PopperRoot>
        <PopperTrigger {...triggerProps} />
      </PopperRoot>
    ))

    expect(childrenReads).toBe(1)
  })

  test('does not instantiate closed content and mounts it once after opening', async () => {
    let instances = 0

    render(() => (
      <PopperRoot>
        <PopperTrigger
          children={(props) => (
            <button {...props} type="button">
              Open
            </button>
          )}
        />
        <PopperContent
          contentRender={() => {
            instances += 1
            return <div role="dialog">Content</div>
          }}
        />
      </PopperRoot>
    ))

    expect(instances).toBe(0)
    await fireEvent.click(document.querySelector('[data-slot="trigger"]')!)

    await waitFor(() => {
      expect(instances).toBe(1)
      expect(document.body.textContent).toContain('Content')
    })
  })
})
