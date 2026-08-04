import { fireEvent, render, waitFor } from '@solidjs/testing-library'
import { describe, expect, test } from 'vitest'

import { PopperContent, PopperRoot, PopperTrigger } from './popper.tsx'

describe('Popper primitives', () => {
  test('does not instantiate closed content and mounts it once after opening', async () => {
    let instances = 0

    render(() => (
      <PopperRoot>
        <PopperTrigger>
          <button type="button">Open</button>
        </PopperTrigger>
        <PopperContent
          contentRender={() => {
            instances += 1
            return <div role="dialog">Content</div>
          }}
        />
      </PopperRoot>
    ))

    expect(instances).toBe(0)
    await fireEvent.click(document.querySelector('button')!)

    await waitFor(() => {
      expect(instances).toBe(1)
      expect(document.body.textContent).toContain('Content')
    })
  })
})
