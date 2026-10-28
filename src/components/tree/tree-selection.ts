import type { Accessor } from 'solid-js'
import { createMemo, createSelector } from 'solid-js'

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
  const isSelected = createSelector<ReadonlySet<string>, string>(selectedSet, (key, current) =>
    current.has(key),
  )
  let anchorKey: string | undefined
  let rangeSnapshot = new Set<string>()

  const canSelect = (key: string): boolean =>
    mode() !== 'none' && deps.registry().nodes.has(key) && !deps.isDisabled(key)

  function select(key: string): void {
    if (!canSelect(key)) {
      return
    }
    anchorKey = key
    rangeSnapshot = new Set([...selectedKeys(), key])
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
    rangeSnapshot = new Set()
    setSelectedKeys([key])
  }

  function deselect(key: string): void {
    if (deps.isDisabled(key)) {
      return
    }
    anchorKey = key
    rangeSnapshot.delete(key)
    setSelectedKeys((previous) =>
      previous.includes(key) ? previous.filter((selectedKey) => selectedKey !== key) : previous,
    )
  }

  function toggleSelect(key: string): void {
    if (selectedSet().has(key)) {
      deselect(key)
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
    rangeSnapshot = new Set(keys)
  }

  function clearSelection(): void {
    anchorKey = undefined
    rangeSnapshot = new Set()
    setSelectedKeys([])
  }

  function selectRange(key: string, explicitAnchor?: string): void {
    if (mode() !== 'multiple') {
      return
    }
    const visible = deps.flattenedKeys()
    let anchor = explicitAnchor ?? anchorKey
    if (anchor === undefined || !visible.includes(anchor) || deps.isDisabled(anchor)) {
      anchor = visible.includes(key) && !deps.isDisabled(key) ? key : undefined
      if (anchor === undefined) {
        return
      }
      anchorKey = anchor
      rangeSnapshot = new Set(selectedKeys())
    } else if (explicitAnchor !== undefined && explicitAnchor !== anchorKey) {
      anchorKey = explicitAnchor
      rangeSnapshot = new Set(selectedKeys())
    }
    const from = visible.indexOf(anchor)
    const to = visible.indexOf(key)
    if (from === -1 || to === -1) {
      return
    }
    const min = Math.min(from, to)
    const max = Math.max(from, to)
    const activeSpan = new Set<string>()
    for (let i = min; i <= max; i++) {
      const k = visible[i]!
      if (!deps.isDisabled(k)) {
        activeSpan.add(k)
      }
    }
    const nextSet = new Set(rangeSnapshot)
    for (const k of activeSpan) {
      nextSet.add(k)
    }
    const nextKeys = new Set(selectedKeys().filter((k) => nextSet.has(k)))
    for (const k of activeSpan) {
      nextKeys.add(k)
    }
    for (const k of rangeSnapshot) {
      nextKeys.add(k)
    }
    setSelectedKeys([...nextKeys])
  }

  return {
    mode,
    selectedKeys,
    isSelected,
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
