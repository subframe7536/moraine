import type { Accessor } from 'solid-js'
import { createMemo } from 'solid-js'

import { createControllableValue } from '../../shared/controllable-value'

import type { TreeRegistry } from './tree-registry'
import type { TreeT } from './tree.types'

export interface TreeSelectionDeps<T> {
  options: TreeT.Options<T>
  registry: Accessor<TreeRegistry<T>>
  flattenedKeys: Accessor<readonly string[]>
  isDisabled: (key: string) => boolean
}

export interface TreeSelection {
  mode: Accessor<TreeT.SelectionMode>
  selectedKeys: Accessor<readonly string[]>
  isSelected: (key: string) => boolean
  /** Adds the key in multiple mode and replaces the selection otherwise. */
  select: (key: string) => void
  /** Replaces the whole selection with one key, like a plain click. */
  selectOnly: (key: string) => void
  deselect: (key: string) => void
  toggleSelect: (key: string) => void
  selectAll: () => void
  clearSelection: () => void
  /** Replaces the selection with the visible items between the anchor and the key. */
  selectRange: (key: string, anchor?: string) => void
  getAnchor: () => string | undefined
}

export function createTreeSelection<T>(deps: TreeSelectionDeps<T>): TreeSelection {
  const mode = () => deps.options.selectionMode ?? 'single'
  const [selectedKeys, setSelectedKeys] = createControllableValue<readonly string[]>({
    value: () => deps.options.selectedKeys,
    defaultValue: () => deps.options.defaultSelectedKeys ?? [],
    onChange: (keys) => deps.options.onSelectionChange?.([...keys]),
  })
  const selectedSet = createMemo(() => new Set(selectedKeys()))
  let anchorKey: string | undefined

  const canSelect = (key: string): boolean =>
    mode() !== 'none' && deps.registry().nodes.has(key) && !deps.isDisabled(key)

  function select(key: string): void {
    if (!canSelect(key)) {
      return
    }
    anchorKey = key
    if (mode() === 'multiple') {
      setSelectedKeys((previous) => (previous.includes(key) ? previous : [...previous, key]))
    } else {
      setSelectedKeys([key])
    }
  }

  function selectOnly(key: string): void {
    if (!canSelect(key)) {
      return
    }
    anchorKey = key
    setSelectedKeys([key])
  }

  function deselect(key: string): void {
    setSelectedKeys((previous) =>
      previous.includes(key) ? previous.filter((selectedKey) => selectedKey !== key) : previous,
    )
  }

  function toggleSelect(key: string): void {
    if (selectedSet().has(key)) {
      deselect(key)
      anchorKey = key
    } else {
      select(key)
    }
  }

  function selectAll(): void {
    if (mode() !== 'multiple') {
      return
    }
    const keys: string[] = []
    for (const key of deps.registry().nodes.keys()) {
      if (!deps.isDisabled(key)) {
        keys.push(key)
      }
    }
    setSelectedKeys(keys)
  }

  function clearSelection(): void {
    setSelectedKeys([])
  }

  function selectRange(key: string, anchor = anchorKey ?? key): void {
    if (mode() !== 'multiple') {
      return
    }
    const visible = deps.flattenedKeys()
    const from = visible.indexOf(anchor)
    const to = visible.indexOf(key)
    if (from === -1 || to === -1) {
      return
    }
    anchorKey = anchor
    const range = visible
      .slice(Math.min(from, to), Math.max(from, to) + 1)
      .filter((rangeKey) => !deps.isDisabled(rangeKey))
    setSelectedKeys(range)
  }

  return {
    mode,
    selectedKeys,
    isSelected: (key) => selectedSet().has(key),
    select,
    selectOnly,
    deselect,
    toggleSelect,
    selectAll,
    clearSelection,
    selectRange,
    getAnchor: () => anchorKey,
  }
}
