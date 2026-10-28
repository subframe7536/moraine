import type { Accessor } from 'solid-js'
import { createEffect, createMemo, createSignal, on, untrack } from 'solid-js'

import { createTreeRoot } from './tree'
import type { TreeInternals } from './tree'
import { createTreeChecked } from './tree-checked'
import { createTreeExpansion } from './tree-expansion'
import { TreeItem, TreeItemIcon, TreeItemLabel, TreeItemTrigger } from './tree-item'
import { TreeItemHandle } from './tree-item-instance'
import type { TreeEngine } from './tree-item-instance'
import { createTreeLoader } from './tree-loader'
import { createTreeNavigation } from './tree-navigation'
import { buildRegistry, flattenKeys, sameKeys } from './tree-registry'
import type { TreeRegistry } from './tree-registry'
import { createTreeSelection } from './tree-selection'
import type { TreeT } from './tree.types'

/**
 * Creates a headless tree instance that carries reactive state, imperative methods, and the
 * components bound to it. Call it inside a reactive owner.
 */
export function createTree<T>(options: TreeT.Options<T>): TreeT.Instance<T> {
  const [focusedKey, setFocusedKey] = createSignal<string | undefined>()
  const [loadingKeys, setLoadingKeys] = createSignal<readonly string[]>([])
  const handles = new Map<string, TreeItemHandle<T>>()
  let engine!: TreeEngine<T>

  const loader = createTreeLoader<T>({
    options,
    setLoadingKeys: (update) => setLoadingKeys((keys) => [...update(keys)]),
  })

  const registry: Accessor<TreeRegistry<T>> = createMemo(() => {
    const next = buildRegistry(options.items(), {
      getKey: options.getKey,
      getChildren: options.getChildren,
      isLeaf: options.isLeaf,
      canLoad: Boolean(options.loadChildren),
      loaded: loader.loaded(),
    })
    for (const key of handles.keys()) {
      if (!next.nodes.has(key)) {
        handles.delete(key)
      }
    }
    return next
  })

  const isDisabled = (key: string): boolean => {
    const node = registry().nodes.get(key)
    return node ? Boolean(options.isDisabled?.(node.raw)) : false
  }
  const getTextValue = (key: string): string => {
    const node = registry().nodes.get(key)
    if (!node) {
      return key
    }
    return options.getTextValue?.(node.raw) ?? (typeof node.raw === 'string' ? node.raw : key)
  }

  const expansion = createTreeExpansion<T>({
    options,
    registry,
    load: (key) => loader.load(registry().nodes.get(key)),
    isDisabled,
  })
  const flattenedKeys = createMemo(
    () => {
      const current = registry()
      const expanded = new Set(expansion.expandedKeys())
      return flattenKeys(current, (key) => expanded.has(key))
    },
    undefined,
    { equals: sameKeys },
  )
  const selection = createTreeSelection<T>({ options, registry, flattenedKeys, isDisabled })
  const checked = createTreeChecked<T>({ options, registry, isDisabled })
  const checkable = () => Boolean(options.checkable)
  const trigger = () => options.trigger !== false
  const getIcon = (item: TreeT.ItemInstance<T>) => options.getIcon?.(item)

  const navigation = createTreeNavigation<T>({
    options,
    registry,
    flattenedKeys,
    isDisabled,
    getTextValue,
    getFocusedKey: focusedKey,
    setFocusedKey,
    expansion,
    selection,
    checked,
    checkable,
    getItem,
  })

  function getItem(key: string): TreeItemHandle<T> | undefined {
    const node = registry().nodes.get(key)
    if (!node) {
      return undefined
    }
    let handle = handles.get(key)
    if (!handle) {
      handle = new TreeItemHandle(engine, node)
      handles.set(key, handle)
    }
    return handle
  }

  createEffect(
    on(
      flattenedKeys,
      (visible) => {
        const current = untrack(focusedKey)
        if (current === undefined || visible.includes(current)) {
          return
        }
        const fallback = untrack(navigation.tabStopKey)
        if (fallback !== undefined && fallback !== current) {
          navigation.focus(fallback, { dom: untrack(navigation.isFocusWithin) })
        }
      },
      { defer: true },
    ),
  )

  const loadingSet = createMemo(() => new Set(loadingKeys()))

  createEffect(
    on([registry, expansion.expandedKeys], ([current, keys]) => {
      for (const key of keys) {
        if (current.nodes.get(key)?.needsLoad) {
          void loader.load(current.nodes.get(key))
        }
      }
    }),
  )

  function handleClick(event: MouseEvent, key: string): void {
    const modifier = event.ctrlKey || event.metaKey
    const mode = selection.mode()
    if (mode !== 'none') {
      if (modifier) {
        selection.toggleSelect(key)
      } else if (event.shiftKey && mode === 'multiple') {
        selection.selectRange(key, selection.getAnchor() ?? navigation.tabStopKey() ?? key)
      } else {
        selection.selectOnly(key)
      }
    }
    if (
      !modifier &&
      !event.shiftKey &&
      (options.expandOnClick !== false || options.trigger === false) &&
      registry().nodes.get(key)?.hasChildren
    ) {
      expansion.toggle(key)
    }
  }

  engine = {
    registry,
    getItem,
    getTextValue,
    isDisabled,
    selectionMode: selection.mode,
    checkable,
    isExpanded: expansion.isExpanded,
    isSelected: selection.isSelected,
    isLoading: (key) => loadingSet().has(key),
    isFocused: (key) => navigation.focusedKey() === key,
    isTabStop: (key) => navigation.tabStopKey() === key,
    getCheckedState: checked.getState,
    setChecked: checked.setChecked,
    expand: expansion.expand,
    collapse: expansion.collapse,
    toggle: expansion.toggle,
    select: selection.select,
    toggleSelect: selection.toggleSelect,
    toggleCheck: checked.toggleCheck,
    focus: (key) => navigation.focus(key),
    setFocusedKey,
    handleClick,
    handleKeyDown: navigation.onKeyDown,
    registerElement: navigation.registerElement,
  }

  const flattenedItems = createMemo(() => flattenedKeys().flatMap((key) => getItem(key) ?? []))
  const rootItems = () => registry().rootKeys.flatMap((key) => getItem(key) ?? [])

  const internals: TreeInternals<T> = {
    rootItems,
    flattenedItems,
    flattenedKeys,
    selectionMode: selection.mode,
    checkable,
    trigger,
    getIcon,
    navigation,
  }

  return {
    get expandedKeys() {
      return expansion.expandedKeys()
    },
    get selectedKeys() {
      return selection.selectedKeys()
    },
    get checkedKeys() {
      return checked.checkedKeys()
    },
    get focusedKey() {
      return navigation.focusedKey()
    },
    get loadingKeys() {
      return loadingKeys()
    },
    get flattenedItems() {
      return flattenedItems()
    },
    expand: expansion.expand,
    collapse: expansion.collapse,
    toggle: expansion.toggle,
    expandAll: expansion.expandAll,
    collapseAll: expansion.collapseAll,
    expandTo: expansion.expandTo,
    select: selection.select,
    deselect: selection.deselect,
    toggleSelect: selection.toggleSelect,
    selectAll: selection.selectAll,
    clearSelection: selection.clearSelection,
    check: (key: string) => checked.setChecked(key, true),
    uncheck: (key: string) => checked.setChecked(key, false),
    toggleCheck: checked.toggleCheck,
    focus: (key: string) => navigation.focus(key),
    getItem,
    isLoading: engine.isLoading,
    Tree: createTreeRoot<T>(internals),
    Item: TreeItem,
    ItemTrigger: TreeItemTrigger,
    ItemIcon: TreeItemIcon,
    ItemLabel: TreeItemLabel,
  }
}
