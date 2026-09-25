import { fireEvent, render, waitFor } from '@solidjs/testing-library'
import { For, createEffect, createSignal, on, onCleanup } from 'solid-js'
import { describe, expect, test, vi } from 'vitest'

import { useListVirtualizer } from '../../virtualizer'

import { List } from './list'
import type { ListT } from './list.types'

describe('List', () => {
  test('renders fixed content from an item component', () => {
    const screen = render(() => (
      <List items={['ignored']} itemRender={() => <li>Static item</li>} />
    ))

    expect(screen.getByRole('list').textContent).toBe('Static item')
  })

  test('keeps keyed rows and reactive indexes across reorders, then disposes removed rows', () => {
    const [items, setItems] = createSignal(['Alpha', 'Beta'])
    const disposed: string[] = []
    const screen = render(() => (
      <List
        items={items()}
        itemRender={(context) => {
          onCleanup(() => disposed.push(context.item))
          return (
            <li>
              {context.index}: {context.item}
            </li>
          )
        }}
      />
    ))
    const list = screen.getByRole('list')
    const rows = Array.from(list.children)

    setItems(['Beta', 'Alpha'])
    expect(list.children[0]).toBe(rows[1])
    expect(list.children[1]).toBe(rows[0])
    expect(list.children[0]?.textContent).toBe('0: Beta')
    expect(list.children[1]?.textContent).toBe('1: Alpha')

    setItems(['Beta'])
    expect(disposed).toEqual(['Alpha'])
    expect(list.children).toHaveLength(1)
  })

  test('renders no rows when items are omitted', () => {
    const screen = render(() => <List itemRender={() => <li>Unused</li>} />)
    expect(screen.getByRole('list').children).toHaveLength(0)
  })

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

    fireEvent.click(screen.getByRole('button'))

    expect(screen.getByRole('list').textContent).toBe('Designer')
  })

  test('applies default root role and slot while allowing overrides', () => {
    const defaultScreen = render(() => (
      <List items={['Engineer']} itemRender={(context) => <li>{context.item}</li>} />
    ))
    const defaultRoot = defaultScreen.getByRole('list')

    expect(defaultRoot.getAttribute('role')).toBe('list')
    expect(defaultRoot.getAttribute('data-slot')).toBe('list')

    const overrideScreen = render(() => (
      <List
        as="div"
        role="feed"
        data-slot="content"
        items={['Engineer']}
        itemRender={(context) => <div>{context.item}</div>}
      />
    ))
    const overrideRoot = overrideScreen.getByRole('feed')

    expect(overrideRoot.getAttribute('role')).toBe('feed')
    expect(overrideRoot.getAttribute('data-slot')).toBe('content')
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

  test('normalizes ClassValue root classes', () => {
    const screen = render(() => (
      <List
        class={['custom-list', 'is-active']}
        items={['Engineer']}
        itemRender={(context) => <li>{context.item}</li>}
      />
    ))

    expect(screen.getByRole('list').className).toBe('custom-list is-active')
  })

  test('creates virtual content before mount and reactively exposes the scroll element', () => {
    let virtualScrollElement: HTMLElement | undefined
    const VirtualRender = vi.fn((props: ListT.VirtualRenderProps<string>) => {
      createEffect(
        on(
          () => props.scrollElement,
          (scrollElement) => {
            virtualScrollElement = scrollElement
          },
        ),
      )

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

  test('switches between ordinary and virtual rows without replacing the root', () => {
    const [virtual, setVirtual] = createSignal(false)
    const VirtualRender = (props: ListT.VirtualRenderProps<string>) => (
      <For each={props.entries}>
        {(item, index) => <>{props.render(item, index(), { 'data-index': index() })}</>}
      </For>
    )
    const screen = render(() => (
      <>
        <List
          items={['Alpha', 'Beta']}
          virtualRender={virtual() ? VirtualRender : undefined}
          itemRender={(context) => <li {...context.props}>{context.item}</li>}
        />
        <button type="button" onClick={() => setVirtual((value) => !value)}>
          Toggle
        </button>
      </>
    ))
    const root = screen.getByRole('list')

    expect(root.children).toHaveLength(2)
    expect(root.children[0]?.getAttribute('data-index')).toBeNull()

    fireEvent.click(screen.getByRole('button'))
    expect(root.children).toHaveLength(2)
    expect(root.children[0]?.getAttribute('data-index')).toBe('0')
    expect(root.children[1]?.getAttribute('data-index')).toBe('1')

    fireEvent.click(screen.getByRole('button'))
    expect(screen.getByRole('list')).toBe(root)
    expect(root.children[0]?.getAttribute('data-index')).toBeNull()
  })

  test('renders visible virtual rows on the initial mount and after scrolling', async () => {
    const items = Array.from({ length: 100 }, (_, index) => `Result ${index + 1}`)
    const virtualRendering = useListVirtualizer<string, HTMLElement, HTMLDivElement>({
      estimateSize: () => 36,
      measureElement: () => 36,
      observeElementRect: (instance, callback) => {
        expect(instance.scrollElement?.isConnected).toBe(true)
        callback({ width: 320, height: 288 })
      },
      overscan: 8,
    })

    const screen = render(() => (
      <List
        as="div"
        role="list"
        items={items}
        virtualRender={virtualRendering.virtualRender}
        itemRender={(context) => <div {...context.props}>{context.item}</div>}
      />
    ))

    await waitFor(() => {
      expect(screen.getByText('Result 1').getAttribute('data-index')).toBe('0')
    })

    const list = screen.getByRole('list')
    Object.defineProperty(list, 'scrollTop', { configurable: true, value: 1440 })
    fireEvent.scroll(list)

    expect(screen.getByText('Result 41').getAttribute('data-index')).toBe('40')
  })

  test('keeps horizontal virtual rows and the scroll container in RTL directions', async () => {
    const screen = render(() => {
      const virtualRendering = useListVirtualizer<number, HTMLElement, HTMLDivElement>({
        estimateSize: () => 20,
        horizontal: true,
        isRtl: true,
        observeElementOffset: (_instance, callback) => callback(0, false),
        observeElementRect: (_instance, callback) => callback({ width: 100, height: 24 }),
        scrollMargin: 4,
      })

      return (
        <List
          as="div"
          dir="rtl"
          items={[20, 35, 25]}
          virtualRender={virtualRendering.virtualRender}
          itemRender={(context) => <div {...context.props}>{context.item}</div>}
        />
      )
    })

    await waitFor(() => {
      const first = screen.getByText('20')
      expect(first.style.right).toBe('0px')
      expect(first.style.transform).toBe('translateX(0px)')
    })

    expect(screen.getByRole('list').getAttribute('dir')).toBe('rtl')
  })

  test('provides measured dynamic rows with consistent gaps', async () => {
    const items = [
      { id: 'first', label: 'First', size: 24 },
      { id: 'second', label: 'Second', size: 48 },
      { id: 'third', label: 'Third', size: 30 },
    ]
    const virtualRendering = useListVirtualizer<
      (typeof items)[number],
      HTMLElement,
      HTMLDivElement
    >({
      estimateSize: (item) => item.size,
      getItemKey: (item) => item.id,
      gap: 6,
      observeElementRect: (_instance, callback) => callback({ width: 320, height: 120 }),
      measureElement: (element) => Number(element.dataset.size),
    })
    const screen = render(() => (
      <List
        as="div"
        role="list"
        items={items}
        virtualRender={virtualRendering.virtualRender}
        itemRender={(context) => (
          <div {...context.props} role="listitem" data-size={context.item.size}>
            {context.item.label}
          </div>
        )}
      />
    ))

    await waitFor(() => {
      expect(screen.getByText('First').style.transform).toBe('translateY(0px)')
      expect(screen.getByText('Second').style.transform).toBe('translateY(30px)')
      expect(screen.getByText('Third').style.transform).toBe('translateY(84px)')
      expect(screen.getByRole('list').firstElementChild?.getAttribute('style')).toContain(
        'height: 114px',
      )
    })

    virtualRendering.instance()?.resizeItem(0, 36)

    await waitFor(() => {
      expect(screen.getByText('Second').style.transform).toBe('translateY(42px)')
      expect(screen.getByText('Third').style.transform).toBe('translateY(96px)')
      expect(screen.getByRole('list').firstElementChild?.getAttribute('style')).toContain(
        'height: 126px',
      )
    })
  })
})
