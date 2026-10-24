import { fireEvent, render, waitFor } from '@solidjs/testing-library'
import { For, createSignal, mergeProps } from 'solid-js'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { MoraineProvider } from '../../provider'
import { createListVirtualizer } from '../../virtualizer'
import { Checkbox } from '../checkbox'

import { createTree } from './create-tree'
import type { TreeT } from './tree.types'

interface Node {
  id: string
  name: string
  children?: Node[]
  disabled?: boolean
}

const DATA: Node[] = [
  {
    id: 'src',
    name: 'src',
    children: [
      {
        id: 'components',
        name: 'components',
        children: [
          { id: 'button', name: 'button.tsx' },
          { id: 'checkbox', name: 'checkbox.tsx' },
        ],
      },
      { id: 'index', name: 'index.ts' },
    ],
  },
  { id: 'docs', name: 'docs', children: [{ id: 'guide', name: 'guide.md' }] },
  { id: 'readme', name: 'README.md' },
  { id: 'license', name: 'LICENSE', disabled: true },
]

interface HarnessProps {
  items?: () => readonly Node[]
  options?: Partial<TreeT.Options<Node>>
  treeProps?: Partial<TreeT.Props<Node>>
  onTree?: (tree: TreeT.Instance<Node>) => void
}

function Harness(props: HarnessProps) {
  /* oxlint-disable subf/solid-reactivity -- Fixture options are fixed; controlled keys are getter-backed. */
  const options = mergeProps(
    {
      items: () => props.items?.() ?? DATA,
      getKey: (node: Node) => node.id,
      getChildren: (node: Node) => node.children,
      getTextValue: (node: Node) => node.name,
      isDisabled: (node: Node) => Boolean(node.disabled),
    },
    props.options,
  )
  const tree = createTree<Node>(options)
  props.onTree?.(tree)
  /* oxlint-enable subf/solid-reactivity */
  return <tree.Tree aria-label="Files" {...props.treeProps} />
}

function item(container: HTMLElement, label: string): HTMLElement {
  const element = container.querySelector<HTMLElement>(`[role="treeitem"][aria-label="${label}"]`)
  if (!element) {
    throw new Error(`No tree item labelled ${label}`)
  }
  return element
}

function labels(container: HTMLElement): string[] {
  return Array.from(container.querySelectorAll('[role="treeitem"]')).map(
    (element) => element.getAttribute('aria-label') ?? '',
  )
}

function press(element: HTMLElement, key: string, init: KeyboardEventInit = {}): void {
  fireEvent.keyDown(element, { key, ...init })
}

function triggerOf(element: HTMLElement): HTMLElement {
  const trigger = element.querySelector<HTMLElement>('[data-slot="tree-trigger"]')
  if (!trigger) {
    throw new Error(`No trigger in ${element.getAttribute('aria-label') ?? 'item'}`)
  }
  return trigger
}

function clickTrigger(element: HTMLElement): void {
  fireEvent.click(triggerOf(element))
}

describe('createTree', () => {
  describe('structure and aria', () => {
    test('renders a tree with levels, positions, and expansion state', () => {
      const { container, getByRole } = render(() => (
        <Harness options={{ defaultExpandedKeys: ['src'] }} />
      ))

      expect(getByRole('tree').getAttribute('aria-label')).toBe('Files')
      expect(getByRole('tree').hasAttribute('aria-multiselectable')).toBe(false)
      expect(labels(container)).toEqual([
        'src',
        'components',
        'index.ts',
        'docs',
        'README.md',
        'LICENSE',
      ])

      const src = item(container, 'src')
      expect(src.getAttribute('aria-level')).toBe('1')
      expect(src.getAttribute('aria-posinset')).toBe('1')
      expect(src.getAttribute('aria-setsize')).toBe('4')
      expect(src.getAttribute('aria-expanded')).toBe('true')
      expect(item(container, 'docs').getAttribute('aria-expanded')).toBe('false')
      expect(item(container, 'README.md').hasAttribute('aria-expanded')).toBe(false)

      const components = item(container, 'components')
      expect(components.getAttribute('aria-level')).toBe('2')
      expect(components.getAttribute('aria-posinset')).toBe('1')
      expect(components.getAttribute('aria-setsize')).toBe('2')
      expect(components.getAttribute('aria-expanded')).toBe('false')
      expect(components.parentElement?.closest('[role="group"]')).not.toBeNull()
    })

    test('exposes a flat list of visible items on the instance', () => {
      let tree!: TreeT.Instance<Node>
      render(() => (
        <Harness onTree={(value) => (tree = value)} options={{ defaultExpandedKeys: ['docs'] }} />
      ))

      expect(tree.flattenedItems.map((entry) => entry.key)).toEqual([
        'src',
        'docs',
        'guide',
        'readme',
        'license',
      ])
      expect(tree.getItem('guide')?.level).toBe(2)
      expect(tree.getItem('guide')?.parentKey).toBe('docs')
      expect(tree.getItem('docs')?.children.map((child) => child.key)).toEqual(['guide'])
    })

    test('marks multiselectable trees and disabled items', () => {
      const { container, getByRole } = render(() => (
        <Harness options={{ selectionMode: 'multiple' }} />
      ))

      expect(getByRole('tree').getAttribute('aria-multiselectable')).toBe('true')
      expect(item(container, 'LICENSE').getAttribute('aria-disabled')).toBe('true')
      expect(item(container, 'README.md').hasAttribute('aria-disabled')).toBe(false)
    })

    test('omits aria-selected when selection is disabled', () => {
      const { container } = render(() => <Harness options={{ selectionMode: 'none' }} />)
      expect(item(container, 'README.md').hasAttribute('aria-selected')).toBe(false)
    })

    test('reacts to item changes', () => {
      const [items, setItems] = createSignal<readonly Node[]>(DATA)
      const { container } = render(() => <Harness items={items} />)

      setItems([{ id: 'only', name: 'only.md' }])
      expect(labels(container)).toEqual(['only.md'])
    })
  })

  describe('expansion', () => {
    test('selects on row click and toggles only from the trigger', () => {
      const { container } = render(() => <Harness treeProps={{ transition: false }} />)
      const src = item(container, 'src')

      fireEvent.click(src)
      expect(src.getAttribute('aria-expanded')).toBe('false')
      expect(src.getAttribute('aria-selected')).toBe('true')
      expect(labels(container)).not.toContain('components')

      clickTrigger(src)
      expect(src.getAttribute('aria-expanded')).toBe('true')
      expect(src.getAttribute('aria-selected')).toBe('true')
      expect(labels(container)).toContain('components')

      clickTrigger(src)
      expect(src.getAttribute('aria-expanded')).toBe('false')
      expect(labels(container)).not.toContain('components')
    })

    test('toggles on row click when expandOnClick is true', () => {
      const { container } = render(() => <Harness options={{ expandOnClick: true }} />)

      fireEvent.click(item(container, 'src'))
      expect(item(container, 'src').getAttribute('aria-expanded')).toBe('true')
      expect(labels(container)).toContain('components')

      fireEvent.click(item(container, 'src'))
      expect(item(container, 'src').getAttribute('aria-expanded')).toBe('false')
    })

    test('nested trigger clicks do not toggle their ancestors', () => {
      const { container } = render(() => <Harness options={{ defaultExpandedKeys: ['src'] }} />)

      clickTrigger(item(container, 'components'))
      expect(item(container, 'components').getAttribute('aria-expanded')).toBe('true')
      expect(item(container, 'src').getAttribute('aria-expanded')).toBe('true')
    })

    test('keeps a child mounted and selected after a row click', () => {
      const { container } = render(() => <Harness options={{ defaultExpandedKeys: ['docs'] }} />)

      fireEvent.click(item(container, 'guide.md'))
      expect(item(container, 'docs').getAttribute('aria-expanded')).toBe('true')
      expect(item(container, 'guide.md').getAttribute('aria-selected')).toBe('true')
      expect(labels(container)).toContain('guide.md')
    })

    test('keeps the trigger visible while a branch expands', () => {
      const { container } = render(() => <Harness />)
      const src = item(container, 'src')
      const trigger = triggerOf(src)

      expect(trigger.hasAttribute('data-leaf')).toBe(false)
      clickTrigger(src)
      expect(trigger.isConnected).toBe(true)
      expect(trigger.hasAttribute('data-leaf')).toBe(false)
      expect(trigger.querySelector('[data-slot="tree-trigger-icon"]')).not.toBeNull()
    })

    test('supports controlled expanded keys', () => {
      const [keys, setKeys] = createSignal<string[]>([])
      const onExpandedChange = vi.fn((next: string[]) => setKeys(next))
      const { container } = render(() => (
        <Harness
          options={{
            get expandedKeys() {
              return keys()
            },
            onExpandedChange,
          }}
        />
      ))

      clickTrigger(item(container, 'docs'))
      expect(onExpandedChange).toHaveBeenCalledWith(['docs'])
      expect(item(container, 'docs').getAttribute('aria-expanded')).toBe('true')

      setKeys([])
      expect(item(container, 'docs').getAttribute('aria-expanded')).toBe('false')
    })

    test('expandAll, collapseAll, and expandTo update visible items', () => {
      let tree!: TreeT.Instance<Node>
      const { container } = render(() => <Harness onTree={(value) => (tree = value)} />)

      tree.expandTo('button')
      expect([...tree.expandedKeys].sort()).toEqual(['components', 'src'])
      expect(labels(container)).toContain('button.tsx')

      tree.collapseAll()
      expect(tree.expandedKeys).toEqual([])

      tree.expandAll()
      expect(labels(container)).toEqual([
        'src',
        'components',
        'button.tsx',
        'checkbox.tsx',
        'index.ts',
        'docs',
        'guide.md',
        'README.md',
        'LICENSE',
      ])
    })

    test('marks the group as closed when collapsed but kept mounted', () => {
      const { container } = render(() => (
        <Harness
          options={{ defaultExpandedKeys: ['docs'] }}
          treeProps={{ unmountOnHide: false, transition: false }}
        />
      ))

      clickTrigger(item(container, 'docs'))
      const group = item(container, 'docs').querySelector('[role="group"]')!
      expect(group.hasAttribute('hidden')).toBe(true)
      expect(group.getAttribute('data-closed')).not.toBeNull()
      expect(group.hasAttribute('data-transition')).toBe(false)
    })

    test('omits data-transition when transition is false', () => {
      const { container } = render(() => (
        <Harness options={{ defaultExpandedKeys: ['docs'] }} treeProps={{ transition: false }} />
      ))
      const group = item(container, 'docs').querySelector('[role="group"]')!
      expect(group.hasAttribute('data-expanded')).toBe(true)
      expect(group.hasAttribute('data-transition')).toBe(false)
      expect(group.className).toContain('data-transition:data-expanded:animate-accordion-down')
    })

    test('keeps data-transition on nested content by default', () => {
      const { container } = render(() => <Harness options={{ defaultExpandedKeys: ['docs'] }} />)
      const group = item(container, 'docs').querySelector('[role="group"]')!
      expect(group.hasAttribute('data-transition')).toBe(true)
    })

    test('uses auto height until nested content has been measured', () => {
      const { container } = render(() => <Harness />)

      clickTrigger(item(container, 'src'))
      const group = item(container, 'src').querySelector<HTMLElement>('[role="group"]')!
      expect(group.style.height).toBe('auto')
      expect(group.style.animation).toBe('none')
    })
  })

  describe('keyboard', () => {
    function setup(options: Partial<TreeT.Options<Node>> = {}) {
      const screen = render(() => (
        <Harness options={{ defaultExpandedKeys: ['src', 'components'], ...options }} />
      ))
      return screen
    }

    test('uses a roving tab stop that starts at the first item', () => {
      const { container } = setup()

      const tabbable = Array.from(container.querySelectorAll('[role="treeitem"]')).filter(
        (element) => element.getAttribute('tabindex') === '0',
      )
      expect(tabbable.map((element) => element.getAttribute('aria-label'))).toEqual(['src'])

      item(container, 'button.tsx').focus()
      expect(item(container, 'button.tsx').getAttribute('tabindex')).toBe('0')
      expect(item(container, 'src').getAttribute('tabindex')).toBe('-1')
    })

    test('moves focus with arrow keys, Home, and End while skipping disabled items', () => {
      const { container } = setup()
      const src = item(container, 'src')
      src.focus()

      press(src, 'ArrowDown')
      expect(document.activeElement).toBe(item(container, 'components'))

      press(item(container, 'components'), 'ArrowDown')
      expect(document.activeElement).toBe(item(container, 'button.tsx'))

      press(item(container, 'button.tsx'), 'ArrowUp')
      expect(document.activeElement).toBe(item(container, 'components'))

      press(item(container, 'components'), 'End')
      expect(document.activeElement).toBe(item(container, 'README.md'))

      press(item(container, 'README.md'), 'Home')
      expect(document.activeElement).toBe(item(container, 'src'))
    })

    test('expands with ArrowRight, enters children, and collapses with ArrowLeft', () => {
      const { container } = render(() => <Harness />)
      const src = item(container, 'src')
      src.focus()

      press(src, 'ArrowRight')
      expect(src.getAttribute('aria-expanded')).toBe('true')
      expect(document.activeElement).toBe(src)

      press(src, 'ArrowRight')
      expect(document.activeElement).toBe(item(container, 'components'))

      press(item(container, 'components'), 'ArrowLeft')
      expect(document.activeElement).toBe(item(container, 'src'))

      press(item(container, 'src'), 'ArrowLeft')
      expect(item(container, 'src').getAttribute('aria-expanded')).toBe('false')
    })

    test('swaps horizontal arrows in right-to-left locales', () => {
      const { container } = render(() => (
        <MoraineProvider dir="rtl">
          <Harness />
        </MoraineProvider>
      ))
      const src = item(container, 'src')
      src.focus()

      press(src, 'ArrowRight')
      expect(src.getAttribute('aria-expanded')).toBe('false')
      press(src, 'ArrowLeft')
      expect(src.getAttribute('aria-expanded')).toBe('true')
    })

    test('keeps focus on the nearest visible ancestor when its subtree collapses', () => {
      const { container } = setup()
      item(container, 'button.tsx').focus()

      clickTrigger(item(container, 'src'))
      expect(document.activeElement).toBe(item(container, 'src'))
      expect(item(container, 'src').getAttribute('tabindex')).toBe('0')
    })

    test('expands every sibling with *', () => {
      const { container } = render(() => <Harness />)
      const src = item(container, 'src')
      src.focus()

      press(src, '*')
      expect(item(container, 'src').getAttribute('aria-expanded')).toBe('true')
      expect(item(container, 'docs').getAttribute('aria-expanded')).toBe('true')
    })

    test('moves to the next match while typing', () => {
      const { container } = setup()
      const src = item(container, 'src')
      src.focus()

      press(src, 'r')
      expect(document.activeElement).toBe(item(container, 'README.md'))
    })

    test('does not run typeahead when disabled', () => {
      const { container } = setup({ typeahead: false })
      const src = item(container, 'src')
      src.focus()

      press(src, 'r')
      expect(document.activeElement).toBe(src)
    })

    test('selects with Enter and calls onAction instead when provided', () => {
      const onAction = vi.fn()
      const { container, unmount } = setup()
      const readme = item(container, 'README.md')
      readme.focus()
      press(readme, 'Enter')
      expect(item(container, 'README.md').getAttribute('aria-selected')).toBe('true')
      unmount()

      const second = setup({ onAction })
      const index = item(second.container, 'index.ts')
      index.focus()
      press(index, 'Enter')
      expect(onAction).toHaveBeenCalledTimes(1)
      expect(onAction.mock.calls[0]?.[0].key).toBe('index')
      expect(item(second.container, 'index.ts').getAttribute('aria-selected')).toBe('false')
    })

    test('ignores keys from nested items and interactive descendants', () => {
      const { container } = setup()
      item(container, 'button.tsx').focus()

      press(item(container, 'button.tsx'), 'ArrowLeft')
      expect(document.activeElement).toBe(item(container, 'components'))
      expect(item(container, 'src').getAttribute('aria-expanded')).toBe('true')
    })
  })

  describe('selection', () => {
    test('single selection replaces the selected item and reports changes', () => {
      const onSelectionChange = vi.fn()
      const { container } = render(() => <Harness options={{ onSelectionChange }} />)

      fireEvent.click(item(container, 'README.md'))
      fireEvent.click(item(container, 'src'))

      expect(onSelectionChange).toHaveBeenNthCalledWith(1, ['readme'])
      expect(onSelectionChange).toHaveBeenNthCalledWith(2, ['src'])
      expect(item(container, 'README.md').getAttribute('aria-selected')).toBe('false')
      expect(item(container, 'src').getAttribute('aria-selected')).toBe('true')
      expect(item(container, 'src').hasAttribute('data-selected')).toBe(true)
    })

    test('does not select disabled items', () => {
      const { container } = render(() => <Harness />)

      fireEvent.click(item(container, 'LICENSE'))
      expect(item(container, 'LICENSE').getAttribute('aria-selected')).toBe('false')
    })

    test('multiple selection supports ctrl toggle, shift ranges, and select all', () => {
      let tree!: TreeT.Instance<Node>
      const { container } = render(() => (
        <Harness
          onTree={(value) => (tree = value)}
          options={{
            selectionMode: 'multiple',
            defaultExpandedKeys: ['docs'],
            expandOnClick: false,
          }}
        />
      ))

      fireEvent.click(item(container, 'src'))
      fireEvent.click(item(container, 'README.md'), { ctrlKey: true })
      expect(tree.selectedKeys).toEqual(['src', 'readme'])

      fireEvent.click(item(container, 'src'), { ctrlKey: true })
      expect(tree.selectedKeys).toEqual(['readme'])

      fireEvent.click(item(container, 'docs'))
      fireEvent.click(item(container, 'README.md'), { shiftKey: true })
      expect(tree.selectedKeys).toEqual(['docs', 'guide', 'readme'])

      item(container, 'README.md').focus()
      press(item(container, 'README.md'), 'a', { ctrlKey: true })
      expect(tree.selectedKeys).toHaveLength(8)
      expect(tree.selectedKeys).not.toContain('license')

      tree.clearSelection()
      expect(tree.selectedKeys).toEqual([])
    })

    test('extends the range with Shift+ArrowDown', () => {
      let tree!: TreeT.Instance<Node>
      const { container } = render(() => (
        <Harness
          onTree={(value) => (tree = value)}
          options={{ selectionMode: 'multiple', expandOnClick: false }}
        />
      ))

      fireEvent.click(item(container, 'docs'))
      press(item(container, 'docs'), 'ArrowDown', { shiftKey: true })
      expect(tree.selectedKeys).toEqual(['docs', 'readme'])
    })

    test('supports controlled selection', () => {
      const [keys, setKeys] = createSignal<string[]>(['docs'])
      const { container } = render(() => (
        <Harness
          options={{
            get selectedKeys() {
              return keys()
            },
            onSelectionChange: (next) => setKeys(next),
          }}
        />
      ))

      expect(item(container, 'docs').getAttribute('aria-selected')).toBe('true')
      fireEvent.click(item(container, 'README.md'))
      // oxlint-disable-next-line subf/solid-reactivity -- Assert the controlled signal after the click.
      expect(keys()).toEqual(['readme'])
    })

    test('selectionMode none ignores clicks', () => {
      let tree!: TreeT.Instance<Node>
      const { container } = render(() => (
        <Harness onTree={(value) => (tree = value)} options={{ selectionMode: 'none' }} />
      ))

      fireEvent.click(item(container, 'README.md'))
      expect(tree.selectedKeys).toEqual([])
    })
  })

  describe('checking', () => {
    function CheckableHarness(props: { onTree?: (tree: TreeT.Instance<Node>) => void }) {
      return (
        <Harness
          onTree={props.onTree}
          options={{ checkable: true, defaultExpandedKeys: ['src', 'components'] }}
          treeProps={{
            itemRender: (context) => {
              return <TreeItemWithCheckbox item={context.item} />
            },
          }}
        />
      )
    }

    function TreeItemWithCheckbox(props: { item: TreeT.ItemInstance<Node> }) {
      return (
        <div role="none">
          <Checkbox {...props.item.getCheckboxProps()} />
        </div>
      )
    }

    test('cascades checks down and derives indeterminate states upward', () => {
      let tree!: TreeT.Instance<Node>
      const { container } = render(() => <CheckableHarness onTree={(value) => (tree = value)} />)
      expect(container.querySelectorAll('[data-slot="checkbox-control"]').length).toBeGreaterThan(0)

      tree.check('button')
      expect(tree.getItem('button')?.checkedState).toBe('checked')
      expect(tree.getItem('components')?.checkedState).toBe('indeterminate')
      expect(tree.getItem('src')?.checkedState).toBe('indeterminate')

      tree.check('checkbox')
      expect(tree.getItem('components')?.checkedState).toBe('checked')
      expect(tree.getItem('src')?.checkedState).toBe('indeterminate')

      tree.check('index')
      expect(tree.getItem('src')?.checkedState).toBe('checked')
      expect(tree.checkedKeys).toEqual(
        expect.arrayContaining(['src', 'components', 'button', 'checkbox', 'index']),
      )

      tree.uncheck('components')
      expect(tree.getItem('button')?.checkedState).toBe('unchecked')
      expect(tree.getItem('src')?.checkedState).toBe('indeterminate')
      expect(tree.checkedKeys).toEqual(['index'])
    })

    test('toggles a branch from an indeterminate state to checked', () => {
      let tree!: TreeT.Instance<Node>
      render(() => <CheckableHarness onTree={(value) => (tree = value)} />)

      tree.check('button')
      tree.toggleCheck('components')
      expect(tree.getItem('components')?.checkedState).toBe('checked')
      tree.toggleCheck('components')
      expect(tree.getItem('components')?.checkedState).toBe('unchecked')
    })

    test('binds Checkbox through getCheckboxProps and keeps it out of the tab order', () => {
      let tree!: TreeT.Instance<Node>
      const { container } = render(() => <CheckableHarness onTree={(value) => (tree = value)} />)

      const control = container.querySelector<HTMLElement>('[data-slot="checkbox-control"]')!
      expect(control.getAttribute('tabindex')).toBe('-1')
      expect(control.closest('[data-slot="checkbox"]')?.getAttribute('aria-hidden')).toBe('true')

      fireEvent.click(control)
      expect(tree.getItem('src')?.checkedState).toBe('checked')
      expect(control.getAttribute('aria-checked')).toBe('true')
      expect(tree.getItem('button')?.checkedState).toBe('checked')
    })

    test('exposes aria-checked on treeitems and toggles with Space', () => {
      const { container } = render(() => (
        <Harness options={{ checkable: true, defaultExpandedKeys: ['docs'] }} />
      ))
      const docs = item(container, 'docs')
      docs.focus()

      expect(docs.getAttribute('aria-checked')).toBe('false')
      press(docs, ' ')
      expect(item(container, 'docs').getAttribute('aria-checked')).toBe('true')
      expect(item(container, 'guide.md').getAttribute('aria-checked')).toBe('true')
      expect(item(container, 'docs').hasAttribute('data-checked')).toBe(true)
    })

    test('renders the default checkbox in the row when checkable', () => {
      const { container } = render(() => <Harness options={{ checkable: true }} />)
      expect(container.querySelectorAll('[data-slot="checkbox"]')).toHaveLength(4)
    })

    test('does not cascade when checkCascade is false', () => {
      let tree!: TreeT.Instance<Node>
      render(() => (
        <Harness
          onTree={(value) => (tree = value)}
          options={{ checkable: true, checkCascade: false }}
        />
      ))

      tree.check('docs')
      expect(tree.getItem('docs')?.checkedState).toBe('checked')
      expect(tree.getItem('guide')?.checkedState).toBe('unchecked')
    })

    test('reports checked keys changes', () => {
      const onCheckedChange = vi.fn()
      let tree!: TreeT.Instance<Node>
      render(() => (
        <Harness
          onTree={(value) => (tree = value)}
          options={{ checkable: true, onCheckedChange }}
        />
      ))

      tree.check('readme')
      expect(onCheckedChange).toHaveBeenLastCalledWith(['readme'])
    })
  })

  describe('async loading', () => {
    interface LazyNode {
      id: string
      name: string
      lazy?: boolean
      children?: LazyNode[]
    }

    function LazyHarness(props: {
      loadChildren: (node: LazyNode) => Promise<readonly LazyNode[]>
      onTree?: (tree: TreeT.Instance<LazyNode>) => void
      options?: Partial<TreeT.Options<LazyNode>>
    }) {
      /* oxlint-disable subf/solid-reactivity -- Fixture options are fixed; loadChildren is supplied per test. */
      const options = mergeProps(
        {
          items: () => [
            { id: 'remote', name: 'remote', lazy: true },
            { id: 'file', name: 'file.txt' },
          ],
          getKey: (node: LazyNode) => node.id,
          getChildren: (node: LazyNode) => node.children,
          getTextValue: (node: LazyNode) => node.name,
          isLeaf: (node: LazyNode) => !node.lazy && !node.children,
          loadChildren: props.loadChildren,
        },
        props.options,
      )
      const tree = createTree<LazyNode>(options)
      props.onTree?.(tree)
      /* oxlint-enable subf/solid-reactivity */
      return <tree.Tree aria-label="Remote" />
    }

    test('treats unloaded items as branches and loads them on expand', async () => {
      let resolve!: (children: LazyNode[]) => void
      const loadChildren = vi.fn(
        () =>
          new Promise<LazyNode[]>((done) => {
            resolve = done
          }),
      )
      const onLoadChildrenComplete = vi.fn()
      const { container } = render(() => (
        <LazyHarness loadChildren={loadChildren} options={{ onLoadChildrenComplete }} />
      ))
      const remote = item(container, 'remote')
      expect(remote.getAttribute('aria-expanded')).toBe('false')
      expect(item(container, 'file.txt').hasAttribute('aria-expanded')).toBe(false)

      clickTrigger(remote)
      expect(loadChildren).toHaveBeenCalledTimes(1)
      expect(item(container, 'remote').getAttribute('aria-busy')).toBe('true')
      expect(item(container, 'remote').getAttribute('aria-expanded')).toBe('false')

      clickTrigger(item(container, 'remote'))
      expect(loadChildren).toHaveBeenCalledTimes(1)

      resolve([{ id: 'child', name: 'child.txt' }])
      await waitFor(() =>
        expect(item(container, 'remote').getAttribute('aria-expanded')).toBe('true'),
      )
      expect(item(container, 'remote').hasAttribute('aria-busy')).toBe(false)
      expect(item(container, 'child.txt').getAttribute('aria-level')).toBe('2')
      expect(onLoadChildrenComplete).toHaveBeenCalledTimes(1)
    })

    test('reports load failures and stays collapsed', async () => {
      const error = new Error('offline')
      const onLoadChildrenError = vi.fn()
      const { container } = render(() => (
        <LazyHarness loadChildren={() => Promise.reject(error)} options={{ onLoadChildrenError }} />
      ))

      clickTrigger(item(container, 'remote'))
      await waitFor(() => expect(onLoadChildrenError).toHaveBeenCalledTimes(1))
      expect(onLoadChildrenError.mock.calls[0]?.[0].error).toBe(error)
      expect(item(container, 'remote').getAttribute('aria-expanded')).toBe('false')
      expect(item(container, 'remote').hasAttribute('aria-busy')).toBe(false)
    })

    test('loads children of branches expanded by default', async () => {
      const loadChildren = vi.fn(async () => [{ id: 'child', name: 'child.txt' }])
      const { container } = render(() => (
        <LazyHarness loadChildren={loadChildren} options={{ defaultExpandedKeys: ['remote'] }} />
      ))

      await waitFor(() => expect(item(container, 'child.txt')).toBeTruthy())
      expect(loadChildren).toHaveBeenCalledTimes(1)
    })

    test('checked branches pass their state to lazily loaded children', async () => {
      let tree!: TreeT.Instance<LazyNode>
      const loadChildren = () => Promise.resolve([{ id: 'child', name: 'child.txt' }])
      const { container } = render(() => (
        <LazyHarness
          onTree={(value) => (tree = value)}
          loadChildren={loadChildren}
          options={{ checkable: true, defaultCheckedKeys: ['remote'] }}
        />
      ))

      tree.expand('remote')
      await waitFor(() => expect(item(container, 'child.txt')).toBeTruthy())
      expect(tree.getItem('child')?.checkedState).toBe('checked')
    })
  })

  describe('rendering', () => {
    test('supports custom item renderers composed from bound parts', () => {
      let tree!: TreeT.Instance<Node>
      const { container } = render(() => (
        <Harness
          onTree={(value) => (tree = value)}
          options={{ defaultExpandedKeys: ['docs'] }}
          treeProps={{
            itemRender: (context) => (
              <tree.Item item={context.item}>
                <tree.ItemLabel>{context.item.textValue.toUpperCase()}</tree.ItemLabel>
              </tree.Item>
            ),
          }}
        />
      ))

      expect(container.querySelector('[data-slot="tree-label"]')?.textContent).toBe('SRC')
      expect(container.querySelector('[data-slot="tree-trigger"]')).toBeNull()
      expect(labels(container)).toContain('guide.md')
    })

    test('renders a trigger without a prefix icon by default', () => {
      const { container } = render(() => <Harness />)

      expect(container.querySelector('[data-slot="tree-trigger"]')).not.toBeNull()
      expect(container.querySelector('[data-slot="tree-icon"]')).toBeNull()
    })

    test('applies trigger icons, variants, and slot classes', () => {
      let tree!: TreeT.Instance<Node>
      const { container, getByRole } = render(() => (
        <Harness
          onTree={(value) => (tree = value)}
          options={{ defaultExpandedKeys: ['docs'] }}
          treeProps={{
            size: 'lg',
            variant: 'solid',
            triggerIcon: 'icon-search',
            classes: { row: 'custom-row' },
            class: 'custom-root',
            itemRender: (context) => (
              <tree.Item item={context.item}>
                <tree.ItemTrigger />
                <tree.ItemIcon icon={context.item.hasChildren ? 'icon-folder' : 'icon-file'} />
                <tree.ItemLabel />
              </tree.Item>
            ),
          }}
        />
      ))

      expect(getByRole('tree').className).toContain('custom-root')
      expect(getByRole('tree').style.getPropertyValue('--mo-tree-indent-guide')).toBe(
        'var(--border)',
      )
      expect(item(container, 'docs').className).toContain('--mo-tree-indent-guide')
      const row = item(container, 'docs').querySelector('[data-slot="tree-row"]')
      expect(row?.className).toContain('custom-row')
      expect(row?.className).toContain('data-entering:animate-tree-item-in')
      expect(item(container, 'docs').className).not.toContain('animate-tree-item-in')
      expect(row?.className).toContain('data-selected:hover:bg-primary-hover')
      expect(row?.className).toContain('data-selected:active:bg-primary-active')
      expect(
        item(container, 'docs').querySelector('[data-slot="tree-trigger-icon"]')?.className,
      ).toContain('icon-search')
      expect(item(container, 'docs').querySelector('[data-slot="tree-icon"]')?.className).toContain(
        'icon-folder',
      )
      expect(
        item(container, 'README.md').querySelector('[data-slot="tree-icon"]')?.className,
      ).toContain('icon-file')
    })

    test('sets the nesting level variable on every item', () => {
      const { container } = render(() => <Harness options={{ defaultExpandedKeys: ['src'] }} />)

      expect(item(container, 'src').style.getPropertyValue('--mo-tree-level')).toBe('0')
      expect(item(container, 'components').style.getPropertyValue('--mo-tree-level')).toBe('1')
    })

    test('renders item data attributes for state', () => {
      const { container } = render(() => <Harness options={{ defaultExpandedKeys: ['docs'] }} />)

      expect(item(container, 'docs').hasAttribute('data-expanded')).toBe(true)
      expect(item(container, 'README.md').hasAttribute('data-leaf')).toBe(true)
      expect(item(container, 'LICENSE').hasAttribute('data-disabled')).toBe(true)
    })

    test('keeps item handles stable across rerenders', () => {
      let tree!: TreeT.Instance<Node>
      const [items, setItems] = createSignal<readonly Node[]>(DATA)
      render(() => <Harness items={items} onTree={(value) => (tree = value)} />)

      const before = tree.getItem('docs')
      setItems([...DATA])
      expect(tree.getItem('docs')).toBe(before)
    })

    test('renders every row through For without keys colliding', () => {
      const { container } = render(() => (
        <Harness
          items={() => [
            { id: 'a', name: 'a' },
            { id: 'a', name: 'duplicate' },
          ]}
        />
      ))
      expect(labels(container)).toEqual(['a'])
    })
  })

  describe('virtual mode', () => {
    const MANY: Node[] = Array.from({ length: 200 }, (_, index) => ({
      id: `file-${index}`,
      name: `file-${index}`,
    }))

    function createVirtualTreeProps(overscan = 8): Partial<TreeT.Props<Node>> {
      const virtualizer = createListVirtualizer<TreeT.ItemInstance<Node>>({
        estimateSize: () => 32,
        getItemKey: (entry) => entry.key,
        overscan,
      })
      return {
        virtualRender: virtualizer.virtualRender,
        scrollToItem: (_entry, index) => virtualizer.scrollToIndex(index),
        class: 'h-[320px] overflow-auto',
        style: { height: '320px' },
      }
    }

    beforeEach(() => {
      vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(320)
      vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(240)
      vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(32)
    })

    afterEach(() => {
      vi.restoreAllMocks()
    })

    test('renders a windowed flat list with aria positions', async () => {
      const treeProps = createVirtualTreeProps(2)
      const { container, getByRole } = render(() => (
        <Harness items={() => MANY} treeProps={treeProps} />
      ))

      await waitFor(() =>
        expect(container.querySelectorAll('[role="treeitem"]').length).toBeGreaterThan(0),
      )
      const rendered = container.querySelectorAll('[role="treeitem"]')
      expect(rendered.length).toBeLessThan(MANY.length)
      expect(rendered[0]?.getAttribute('aria-setsize')).toBe('200')
      expect(rendered[0]?.getAttribute('aria-posinset')).toBe('1')
      expect(rendered[0]?.getAttribute('data-index')).toBe('0')
      expect(container.querySelector('[role="group"]')).toBeNull()
      expect(container.querySelector('[data-slot="tree-virtual-container"]')).toBeNull()
      expect(getByRole('tree').className).toContain('overflow-auto')
    })

    test('flattens expanded branches into the virtual list', async () => {
      const treeProps = createVirtualTreeProps()
      const { container } = render(() => (
        <Harness options={{ defaultExpandedKeys: ['src'] }} treeProps={treeProps} />
      ))

      await waitFor(() => expect(labels(container)).toContain('components'))
      expect(item(container, 'components').getAttribute('aria-level')).toBe('2')
      expect(item(container, 'components').parentElement?.closest('[role="group"]')).toBeNull()
      expect(item(container, 'components').hasAttribute('data-entering')).toBe(false)
      expect(item(container, 'components').className).not.toContain('animate-tree-item-in')
    })

    test('does not mark virtual rows as entering after a branch expands', async () => {
      const treeProps = createVirtualTreeProps()
      const { container } = render(() => <Harness treeProps={treeProps} />)
      await waitFor(() => expect(labels(container)).toContain('src'))

      clickTrigger(item(container, 'src'))
      await waitFor(() => expect(labels(container)).toContain('components'))

      expect(item(container, 'src').hasAttribute('data-entering')).toBe(false)
      expect(item(container, 'components').hasAttribute('data-entering')).toBe(false)
      expect(
        item(container, 'components').querySelector('[data-slot="tree-row"]')?.className,
      ).toContain('data-entering:animate-tree-item-in')
      expect(
        item(container, 'components')
          .querySelector('[data-slot="tree-row"]')
          ?.hasAttribute('data-entering'),
      ).toBe(false)
    })

    test('collapses a flattened branch back out of the virtual list', async () => {
      const treeProps = createVirtualTreeProps()
      const { container } = render(() => (
        <Harness options={{ defaultExpandedKeys: ['src'] }} treeProps={treeProps} />
      ))
      await waitFor(() => expect(labels(container)).toContain('components'))

      clickTrigger(item(container, 'src'))
      await waitFor(() => {
        expect(item(container, 'src').getAttribute('aria-expanded')).toBe('false')
        expect(labels(container)).not.toContain('components')
      })
    })

    test('keeps keyboard navigation and selection working', async () => {
      const treeProps = createVirtualTreeProps()
      const { container } = render(() => <Harness items={() => MANY} treeProps={treeProps} />)
      await waitFor(() => expect(labels(container)).toContain('file-0'))

      const first = item(container, 'file-0')
      first.focus()
      press(first, 'ArrowDown')
      await waitFor(() => expect(document.activeElement).toBe(item(container, 'file-1')))

      fireEvent.click(item(container, 'file-1'))
      expect(item(container, 'file-1').getAttribute('aria-selected')).toBe('true')
    })

    test('focusing an item outside the window moves the tab stop to it', async () => {
      let tree!: TreeT.Instance<Node>
      const treeProps = createVirtualTreeProps()
      const { container } = render(() => (
        <Harness items={() => MANY} onTree={(value) => (tree = value)} treeProps={treeProps} />
      ))
      await waitFor(() => expect(labels(container)).toContain('file-0'))

      tree.focus('file-150')
      expect(tree.focusedKey).toBe('file-150')
      expect(item(container, 'file-0').getAttribute('tabindex')).toBe('-1')
    })

    test('lists every item in the instance while rendering a subset', async () => {
      let tree!: TreeT.Instance<Node>
      const treeProps = createVirtualTreeProps()
      const { container } = render(() => (
        <Harness items={() => MANY} onTree={(value) => (tree = value)} treeProps={treeProps} />
      ))
      await waitFor(() =>
        expect(container.querySelectorAll('[role="treeitem"]').length).toBeGreaterThan(0),
      )

      expect(tree.flattenedItems).toHaveLength(MANY.length)
    })
  })

  describe('For compatibility', () => {
    test('item instances can be rendered by consumers directly', () => {
      let tree!: TreeT.Instance<Node>
      const { container } = render(() => (
        <>
          <Harness onTree={(value) => (tree = value)} />
          <ul data-testid="outside">
            <For each={tree.flattenedItems}>{(entry) => <li>{entry.textValue}</li>}</For>
          </ul>
        </>
      ))

      expect(container.querySelectorAll('[data-testid="outside"] li')).toHaveLength(4)
    })
  })
})
