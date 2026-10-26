import type { Accessor } from 'solid-js'
import { createMemo } from 'solid-js'

import { createControllableValue } from '../../shared/controllable-value'

import { getAncestorKeys } from './tree-registry'
import type { TreeRegistry } from './tree-registry'
import type { TreeT } from './tree.types'

export interface TreeExpansionDeps<T> {
  options: TreeT.Options<T>
  registry: Accessor<TreeRegistry<T>>
  load: (key: string) => Promise<boolean>
  /** Runs before keys collapse, so focus can leave a subtree that is about to disappear. */
  beforeCollapse: (keys: readonly string[]) => void
  isDisabled: (key: string) => boolean
}

export interface TreeExpansion {
  expandedKeys: Accessor<readonly string[]>
  isExpanded: (key: string) => boolean
  expand: (key: string) => void
  collapse: (key: string) => void
  toggle: (key: string) => void
  expandAll: () => void
  collapseAll: () => void
  expandTo: (key: string) => void
  /** Adds keys without waiting for lazy children. */
  addExpanded: (keys: readonly string[]) => void
}

export function createTreeExpansion<T>(deps: TreeExpansionDeps<T>): TreeExpansion {
  const [expandedKeys, setExpandedKeys] = createControllableValue<readonly string[]>({
    value: () => deps.options.expandedKeys,
    defaultValue: () => deps.options.defaultExpandedKeys ?? [],
    onChange: (keys) => deps.options.onExpandedChange?.([...keys]),
  })
  const expandedSet = createMemo(() => new Set(expandedKeys()))
  const isExpanded = (key: string): boolean => expandedSet().has(key)

  function addExpanded(keys: readonly string[]): void {
    setExpandedKeys((previous) => {
      const added = keys.filter((key) => !previous.includes(key))
      return added.length > 0 ? [...previous, ...added] : previous
    })
  }

  function expand(key: string): void {
    const node = deps.registry().nodes.get(key)
    if (!node?.hasChildren || isExpanded(key) || deps.isDisabled(key)) {
      return
    }
    if (node.needsLoad) {
      void deps.load(key).then((loaded) => {
        if (loaded && deps.registry().nodes.has(key)) {
          addExpanded([key])
        }
      })
      return
    }
    addExpanded([key])
  }

  function collapse(key: string): void {
    if (!isExpanded(key) || deps.isDisabled(key)) {
      return
    }
    deps.beforeCollapse([key])
    setExpandedKeys((previous) => previous.filter((expandedKey) => expandedKey !== key))
  }

  function toggle(key: string): void {
    if (isExpanded(key)) {
      collapse(key)
    } else {
      expand(key)
    }
  }

  function expandAll(): void {
    const branches: string[] = []
    for (const node of deps.registry().nodes.values()) {
      if (node.hasChildren && !deps.isDisabled(node.key)) {
        branches.push(node.key)
      }
    }
    addExpanded(branches)
  }

  function collapseAll(): void {
    const current = expandedKeys()
    const enabled = current.filter((key) => !deps.isDisabled(key))
    if (enabled.length === 0) {
      return
    }
    deps.beforeCollapse(enabled)
    setExpandedKeys((previous) => previous.filter((key) => deps.isDisabled(key)))
  }

  function expandTo(key: string): void {
    addExpanded(getAncestorKeys(deps.registry(), key))
  }

  return {
    expandedKeys,
    isExpanded,
    expand,
    collapse,
    toggle,
    expandAll,
    collapseAll,
    expandTo,
    addExpanded,
  }
}
