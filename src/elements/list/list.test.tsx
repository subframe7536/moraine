import { fireEvent, render } from '@solidjs/testing-library'
import { createVirtualizer } from '@tanstack/solid-virtual'
import { For, createEffect, createSignal } from 'solid-js'
import { describe, expect, test, vi } from 'vitest'

import type { ListT } from './list'
import { List } from './list'

describe('List', () => {
  test('renders arbitrary reactive items with ul semantics by default', async () => {
    const [items, setItems] = createSignal([{ name: 'Engineer' }])
    const screen = render(() => (
      <>
        <List items={items()} itemRender={(context) => <li>{context.item.name}</li>} />
        <button type="button" onClick={() => setItems([{ name: 'Designer' }])}>
          Update
        </button>
      </>
    ))

    expect(screen.getByRole('list').textContent).toBe('Engineer')

    await fireEvent.click(screen.getByRole('button'))

    expect(screen.getByRole('list').textContent).toBe('Designer')
  })

  test('supports polymorphic roots and forwards native attributes, style, class, and ref', () => {
    const ref = vi.fn()
    const screen = render(() => (
      <List
        as="div"
        ref={ref}
        role="feed"
        aria-label="Jobs"
        data-track="job-list"
        class="custom-list"
        style={{ color: 'red' }}
        items={[{ name: 'Engineer' }]}
        itemRender={(context) => <article>{context.item.name}</article>}
      />
    ))
    const list = screen.getByRole('feed', { name: 'Jobs' })

    expect(ref).toHaveBeenCalledWith(list)
    expect(list.tagName).toBe('DIV')
    expect(list.getAttribute('data-track')).toBe('job-list')
    expect(list.className).toBe('custom-list')
    expect(list.style.color).toBe('red')
  })

  test('creates virtual content before mount and reactively exposes the scroll element', () => {
    let virtualScrollElement: HTMLElement | undefined
    const VirtualRender = vi.fn((props: ListT.VirtualRenderProps<string>) => {
      createEffect(() => {
        virtualScrollElement = props.scrollElement
      })

      return (
        <For each={props.entries}>
          {(item) =>
            props.render(item, props.entries.indexOf(item), {
              class: 'virtual-row',
              style: { position: 'absolute' },
              'data-index': props.entries.indexOf(item),
            })
          }
        </For>
      )
    })
    const screen = render(() => (
      <List
        as="div"
        role="feed"
        items={['Apple']}
        virtualRender={VirtualRender}
        itemRender={(context) => <div {...context.props}>{context.item}</div>}
      />
    ))
    const row = screen.getByText('Apple')

    expect(VirtualRender).toHaveBeenCalledTimes(1)
    expect(virtualScrollElement).toBe(screen.getByRole('feed'))
    expect(row.className).toBe('virtual-row')
    expect(row.style.position).toBe('absolute')
    expect(row.getAttribute('data-index')).toBe('0')
  })

  test('renders visible virtual rows on the initial mount and after scrolling', async () => {
    const items = Array.from({ length: 100 }, (_, index) => `Result ${index + 1}`)

    function VirtualRender(props: ListT.VirtualRenderProps<string, HTMLElement, HTMLDivElement>) {
      const virtualizer = createVirtualizer<HTMLElement, HTMLDivElement>({
        count: items.length,
        getScrollElement: () => props.scrollElement ?? null,
        observeElementRect: (instance, callback) => {
          expect(instance.scrollElement?.isConnected).toBe(true)
          callback({ width: 320, height: 288 })
        },
        estimateSize: () => 36,
        overscan: 8,
      })

      return (
        <For each={virtualizer.getVirtualItems()}>
          {(virtualRow) =>
            props.render(items[virtualRow.index]!, virtualRow.index, {
              'data-index': virtualRow.index,
            })
          }
        </For>
      )
    }

    const screen = render(() => (
      <List<string, 'div', HTMLDivElement>
        as="div"
        role="list"
        items={items}
        virtualRender={VirtualRender}
        itemRender={(context) => <div {...context.props}>{context.item}</div>}
      />
    ))

    expect(screen.getByText('Result 1').getAttribute('data-index')).toBe('0')

    const list = screen.getByRole('list')
    Object.defineProperty(list, 'scrollTop', { configurable: true, value: 1440 })
    await fireEvent.scroll(list)

    expect(screen.getByText('Result 41').getAttribute('data-index')).toBe('40')
  })
})
