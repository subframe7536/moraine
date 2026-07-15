import { fireEvent, render } from '@solidjs/testing-library'
import { createSignal } from 'solid-js'
import { describe, expect, test, vi } from 'vitest'

import type { VirtualRenderT } from './use-virtual-render'
import { useVirtualRender } from './use-virtual-render'

describe('useVirtualRender', () => {
  test('keeps a stable context with reactive entries and scroll element', async () => {
    let context: VirtualRenderT.Context<string, HTMLDivElement, HTMLDivElement> | undefined
    const screen = render(() => {
      const [entries, setEntries] = createSignal<readonly string[]>(['apple'])
      const virtualRender = useVirtualRender<string, HTMLDivElement, HTMLDivElement>({
        entries,
        render: (entry) => <div>{entry}</div>,
      })
      context = virtualRender.context

      return (
        <div>
          <div ref={virtualRender.setScrollElement} data-testid="scroll" />
          <button type="button" onClick={() => setEntries(['banana'])}>
            Update
          </button>
        </div>
      )
    })
    const stableContext = context

    expect(context?.entries).toEqual(['apple'])
    expect(context?.scrollElement).toBe(screen.getByTestId('scroll'))

    await fireEvent.click(screen.getByRole('button', { name: 'Update' }))

    expect(context).toBe(stableContext)
    expect(context?.entries).toEqual(['banana'])

    screen.unmount()
    expect(context?.scrollElement).toBeUndefined()
  })

  test('forwards index, ref, style, class, and data attributes to the row renderer', () => {
    const rowRef = vi.fn()
    const screen = render(() => {
      const virtualRender = useVirtualRender<string, HTMLDivElement, HTMLDivElement>({
        entries: () => ['apple'],
        render: (entry, index, props) => (
          <div {...props}>
            {entry}:{index}
          </div>
        ),
      })

      return virtualRender.context.render('apple', 4, {
        ref: rowRef,
        class: 'virtual-row',
        style: { position: 'absolute' },
        'data-index': 4,
      })
    })
    const row = screen.getByText('apple:4')

    expect(rowRef.mock.calls[0]?.[0]).toBe(row)
    expect(row.className).toContain('virtual-row')
    expect(row.style.position).toBe('absolute')
    expect(row.getAttribute('data-index')).toBe('4')
  })
})
