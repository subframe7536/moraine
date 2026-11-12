import { fireEvent, render, waitFor } from '@solidjs/testing-library'
import { For, createSignal } from 'solid-js'
import type { JSX } from 'solid-js'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { createTree } from '../components/tree/tree'

import { createListSortable } from './create-list-sortable'
import type { ListReorderEvent } from './create-list-sortable'
import { createTreeSortable, moveTreeNode } from './create-tree-sortable'
import type { TreeMoveEvent } from './create-tree-sortable'

const POINTER = { isPrimary: true, pointerId: 1 } as const

const POINTER_DOWN = { ...POINTER, button: 0 }

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * jsdom reports every element as 0x0 and does not apply the `translate` that dnd kit writes to
 * `--dnd-translate` while dragging. Rows measure as 200x100 stacked vertically, with the current
 * translate folded in so the drag shape follows the pointer.
 */
function stubRowRect(element: HTMLElement, index: number): void {
  const top = index * 100
  element.getBoundingClientRect = () => {
    const [dx = 0, dy = 0] = (element.style.getPropertyValue('--dnd-translate') || '0 0')
      .split(' ')
      .map((value) => Number.parseFloat(value) || 0)
    return {
      bottom: top + dy + 100,
      height: 100,
      left: dx,
      right: dx + 200,
      top: top + dy,
      width: 200,
      x: dx,
      y: top + dy,
      toJSON: () => ({}),
    }
  }
}

beforeEach(() => {
  // jsdom lacks the Web Animations API, pointer capture, layout observers, and matchMedia;
  // dnd kit calls all of them while dragging.
  document.getAnimations = () => []
  document.elementFromPoint = () => null
  Element.prototype.getAnimations = () => []
  Element.prototype.setPointerCapture = () => {}
  Element.prototype.releasePointerCapture = () => {}
  Element.prototype.hasPointerCapture = () => false
  window.matchMedia = (query: string) => ({
    addEventListener: () => {},
    addListener: () => {},
    dispatchEvent: () => false,
    matches: false,
    media: query,
    onchange: null,
    removeEventListener: () => {},
    removeListener: () => {},
  })
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      readonly observed = new Set<Element>()
      observe(element: Element) {
        this.observed.add(element)
      }
      unobserve(element: Element) {
        this.observed.delete(element)
      }
      disconnect() {
        this.observed.clear()
      }
    },
  )
  vi.stubGlobal(
    'ResizeObserver',
    class {
      readonly observed = new Set<Element>()
      observe(element: Element) {
        this.observed.add(element)
      }
      unobserve(element: Element) {
        this.observed.delete(element)
      }
      disconnect() {
        this.observed.clear()
      }
    },
  )
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('createListSortable', () => {
  function renderList(options: {
    items: () => readonly string[]
    onReorder: (event: ListReorderEvent<string>) => void
    canDrop?: (source: string, target: string, position: 'before' | 'after') => boolean
    isDisabled?: (item: string, index: number) => boolean
  }) {
    const sortable = createListSortable<string>(options)

    function Row(props: { index: number; label: string }): JSX.Element {
      const row = sortable.useRow({
        get index() {
          return props.index
        },
      })
      return (
        <li {...row.props} data-label={props.label}>
          <button ref={row.handleRef} type="button" aria-label={`Move ${props.label}`} />
          {props.label}
        </li>
      )
    }

    const screen = render(() => (
      <sortable.Provider>
        <ul>
          <For each={options.items()}>
            {(label, index) => <Row index={index()} label={label} />}
          </For>
        </ul>
      </sortable.Provider>
    ))
    const rows = [...screen.container.querySelectorAll('li')] as HTMLElement[]
    rows.forEach((row, index) => stubRowRect(row, index))
    return {
      rows,
      handles: [...screen.container.querySelectorAll('button')] as HTMLElement[],
      labels: () => [...screen.container.querySelectorAll('li')].map((row) => row.dataset.label),
    }
  }

  test('reorders items on a pointer drop and reports the move', async () => {
    const [items, setItems] = createSignal(['a', 'b', 'c'])
    const onReorder = vi.fn((event: ListReorderEvent<string>) => setItems(event.items))
    const { rows, handles, labels } = renderList({ items, onReorder })

    fireEvent.pointerDown(handles[0]!, { ...POINTER_DOWN, clientX: 10, clientY: 50 })
    fireEvent.pointerMove(document, { ...POINTER, clientX: 10, clientY: 60 })
    await waitFor(() => expect(rows[0]!.getAttribute('data-dragging')).not.toBeNull())

    fireEvent.pointerMove(document, { ...POINTER, clientX: 10, clientY: 230 })
    await waitFor(() => expect(rows[2]!.getAttribute('data-drop-position')).toBe('before'))

    fireEvent.pointerUp(document, { ...POINTER, clientX: 10, clientY: 230 })
    await waitFor(() =>
      expect(onReorder).toHaveBeenCalledWith({
        item: 'a',
        from: 0,
        to: 1,
        items: ['b', 'a', 'c'],
        target: 'c',
        position: 'before',
      }),
    )
    await waitFor(() => expect(labels()).toEqual(['b', 'a', 'c']))
  })

  test('reorders items on a keyboard drop', async () => {
    const [items, setItems] = createSignal(['a', 'b', 'c'])
    const onReorder = vi.fn((event: ListReorderEvent<string>) => setItems(event.items))
    const { rows, handles, labels } = renderList({ items, onReorder })

    fireEvent.keyDown(handles[0]!, { key: ' ' })
    await waitFor(() => expect(rows[0]!.getAttribute('data-dragging')).not.toBeNull())

    fireEvent.keyDown(document, { key: 'ArrowDown' })
    await waitFor(() => expect(rows[1]!.getAttribute('data-drop-position')).toBe('after'))

    fireEvent.keyDown(document, { key: ' ' })
    await waitFor(() =>
      expect(onReorder).toHaveBeenCalledWith(
        expect.objectContaining({ item: 'a', from: 0, to: 1, position: 'after' }),
      ),
    )
    await waitFor(() => expect(labels()).toEqual(['b', 'a', 'c']))
  })

  test('shows no indicator and does not drop where canDrop rejects', async () => {
    const [items] = createSignal(['a', 'b', 'c'])
    const onReorder = vi.fn()
    const { rows, handles } = renderList({ items, onReorder, canDrop: () => false })

    fireEvent.pointerDown(handles[0]!, { ...POINTER_DOWN, clientX: 10, clientY: 50 })
    fireEvent.pointerMove(document, { ...POINTER, clientX: 10, clientY: 60 })
    await waitFor(() => expect(rows[0]!.getAttribute('data-dragging')).not.toBeNull())

    fireEvent.pointerMove(document, { ...POINTER, clientX: 10, clientY: 230 })
    await wait(50)
    expect(rows[2]!.getAttribute('data-drop-position')).toBeNull()

    fireEvent.pointerUp(document, { ...POINTER, clientX: 10, clientY: 230 })
    await wait(50)
    expect(onReorder).not.toHaveBeenCalled()
  })

  test('does not drag a disabled row', async () => {
    const [items, setItems] = createSignal(['a', 'b', 'c'])
    const onReorder = vi.fn((event: ListReorderEvent<string>) => setItems(event.items))
    const { rows, handles } = renderList({
      items,
      onReorder,
      isDisabled: (item) => item === 'b',
    })

    fireEvent.pointerDown(handles[1]!, { ...POINTER_DOWN, clientX: 10, clientY: 150 })
    fireEvent.pointerMove(document, { ...POINTER, clientX: 10, clientY: 160 })
    await wait(50)
    expect(rows[1]!.getAttribute('data-dragging')).toBeNull()

    fireEvent.pointerUp(document, { ...POINTER, clientX: 10, clientY: 160 })
    await wait(50)
    expect(onReorder).not.toHaveBeenCalled()
  })

  test('keeps the remaining rows draggable after an item is removed', async () => {
    const [items, setItems] = createSignal(['a', 'b', 'c'])
    const onReorder = vi.fn((event: ListReorderEvent<string>) => setItems(event.items))
    const { rows, handles, labels } = renderList({ items, onReorder })

    setItems(['a', 'c'])
    await waitFor(() => expect(labels()).toEqual(['a', 'c']))

    fireEvent.pointerDown(handles[2]!, { ...POINTER_DOWN, clientX: 10, clientY: 250 })
    fireEvent.pointerMove(document, { ...POINTER, clientX: 10, clientY: 60 })
    await waitFor(() => expect(rows[2]!.getAttribute('data-dragging')).not.toBeNull())

    fireEvent.pointerMove(document, { ...POINTER, clientX: 10, clientY: 10 })
    await waitFor(() => expect(rows[0]!.getAttribute('data-drop-position')).toBe('before'))

    fireEvent.pointerUp(document, { ...POINTER, clientX: 10, clientY: 10 })
    await waitFor(() => expect(labels()).toEqual(['c', 'a']))
    expect(onReorder).toHaveBeenCalledWith(
      expect.objectContaining({ item: 'c', items: ['c', 'a'] }),
    )
  })
})

interface FileNode {
  id: string
  children?: FileNode[]
}

const FILE_ACCESS = {
  getKey: (node: FileNode) => node.id,
  getChildren: (node: FileNode) => node.children,
  withChildren: (node: FileNode, children: FileNode[]) => ({ ...node, children }),
}

describe('createTreeSortable', () => {
  test('moves an item inside a folder on an inside drop', async () => {
    const [files, setFiles] = createSignal<FileNode[]>([
      { id: 'a' },
      { id: 'folder', children: [{ id: 'f1' }] },
      { id: 'z' },
    ])
    const onMove = vi.fn((event: TreeMoveEvent<FileNode>) =>
      setFiles((current) => moveTreeNode(current, event, FILE_ACCESS)),
    )

    const screen = render(() => {
      const tree = createTree<FileNode>({
        items: files,
        getKey: FILE_ACCESS.getKey,
        getChildren: FILE_ACCESS.getChildren,
      })
      const sortable = createTreeSortable(tree, { onMove, expandDelay: false })

      function TreeRow(props: { item: (typeof tree.flattenedItems)[number] }): JSX.Element {
        // oxlint-disable-next-line subf/solid-reactivity -- useNode registers the item.
        const node = sortable.useNode(props.item)
        return (
          <li {...node.props}>
            <div data-slot="tree-row">{props.item.key}</div>
          </li>
        )
      }

      return (
        <sortable.Provider>
          <ul>
            <For each={tree.flattenedItems}>{(item) => <TreeRow item={item} />}</For>
          </ul>
        </sortable.Provider>
      )
    })

    const rows = [...screen.container.querySelectorAll('li')] as HTMLElement[]
    const targets = [
      ...screen.container.querySelectorAll('[data-slot="tree-row"]'),
    ] as HTMLElement[]
    rows.forEach((row, index) => stubRowRect(row, index))
    targets.forEach((row, index) => stubRowRect(row, index))

    fireEvent.pointerDown(targets[0]!, { ...POINTER_DOWN, clientX: 10, clientY: 50 })
    fireEvent.pointerMove(document, { ...POINTER, clientX: 10, clientY: 60 })
    await waitFor(() => expect(rows[0]!.getAttribute('data-dragging')).not.toBeNull())

    // The middle of a row accepts children; the top and bottom quarters do not.
    fireEvent.pointerMove(document, { ...POINTER, clientX: 10, clientY: 150 })
    await waitFor(() => expect(rows[1]!.getAttribute('data-drop-position')).toBe('inside'))

    fireEvent.pointerUp(document, { ...POINTER, clientX: 10, clientY: 150 })
    await waitFor(() =>
      expect(onMove).toHaveBeenCalledWith(
        expect.objectContaining({ key: 'a', parentKey: 'folder', position: 'inside', index: 1 }),
      ),
    )
    // Dropping inside a collapsed folder expands it to show the moved child.
    await waitFor(() =>
      expect(
        [...screen.container.querySelectorAll('[data-slot="tree-row"]')].map(
          (row) => row.textContent,
        ),
      ).toEqual(['folder', 'f1', 'a', 'z']),
    )
  })
})
