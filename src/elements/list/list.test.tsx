import { fireEvent, render } from '@solidjs/testing-library'
import { For, createSignal } from 'solid-js'
import { describe, expect, test, vi } from 'vitest'

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

  test('mounts the scroll element before invoking virtualRender and forwards row props', () => {
    const virtualRender = vi.fn((context) => {
      expect(context.scrollElement).toBeInstanceOf(HTMLDivElement)

      return (
        <For each={context.entries}>
          {(item) =>
            context.render(item, context.entries.indexOf(item), {
              class: 'virtual-row',
              style: { position: 'absolute' },
              'data-index': context.entries.indexOf(item),
            })
          }
        </For>
      )
    })
    const screen = render(() => (
      <List
        as="div"
        items={['Apple']}
        virtualRender={virtualRender}
        itemRender={(context) => <div {...context.props}>{context.item}</div>}
      />
    ))
    const row = screen.getByText('Apple')

    expect(virtualRender).toHaveBeenCalledTimes(1)
    expect(row.className).toBe('virtual-row')
    expect(row.style.position).toBe('absolute')
    expect(row.getAttribute('data-index')).toBe('0')
  })
})
