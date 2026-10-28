import type { TreeT } from './tree.types'

export interface TreeNode<T> {
  key: string
  raw: T
  parentKey: string | undefined
  childrenKeys: readonly string[]
  /** One-based position among siblings, matching `aria-posinset`. */
  posInSet: number
  /** Total sibling count, matching `aria-setsize`. */
  setSize: number
  /** One-based depth, matching `aria-level`. */
  level: number
  /** True for nodes with known children and for unloaded lazy branches. */
  hasChildren: boolean
  /** True when the node is a lazy branch whose children have not been loaded. */
  needsLoad: boolean
  disabled: boolean
  textValue: string
}

export interface TreeRegistry<T> {
  /** Nodes indexed by key in pre-order. */
  nodes: ReadonlyMap<string, TreeNode<T>>
  rootKeys: readonly string[]
}

/** Indexes nested data by key in pre-order. A key seen more than once keeps its first occurrence. */
export function buildRegistry<T>(
  items: readonly T[],
  options: TreeT.Options<T>,
  loaded: Readonly<Record<string, readonly T[]>>,
): TreeRegistry<T> {
  const nodes = new Map<string, TreeNode<T>>()
  const canLoad = Boolean(options.loadChildren)

  function visit(list: readonly T[], parentKey: string | undefined, level: number): string[] {
    const keys: string[] = []
    const setSize = list.length
    list.forEach((raw, index) => {
      const key = options.getKey(raw)
      if (nodes.has(key)) {
        return
      }
      const children = options.getChildren?.(raw) ?? loaded[key]
      const needsLoad = children === undefined && canLoad && !options.isLeaf?.(raw)
      const node: TreeNode<T> = {
        key,
        raw,
        parentKey,
        childrenKeys: [],
        posInSet: index + 1,
        setSize,
        level,
        hasChildren: children ? children.length > 0 : needsLoad,
        needsLoad,
        disabled: Boolean(options.isDisabled?.(raw)),
        textValue: options.getTextValue?.(raw) ?? (typeof raw === 'string' ? raw : key),
      }
      nodes.set(key, node)
      keys.push(key)
      if (children?.length) {
        node.childrenKeys = visit(children, key, level + 1)
      }
    })
    return keys
  }

  return { nodes, rootKeys: visit(items, undefined, 1) }
}

/** Pre-order list of keys that are visible under the given expansion state. */
export function flattenKeys<T>(
  registry: TreeRegistry<T>,
  isExpanded: (key: string) => boolean,
): string[] {
  const result: string[] = []
  function visit(keys: readonly string[]): void {
    for (const key of keys) {
      result.push(key)
      const node = registry.nodes.get(key)!
      if (node.childrenKeys.length > 0 && isExpanded(key)) {
        visit(node.childrenKeys)
      }
    }
  }
  visit(registry.rootKeys)
  return result
}

/** Ancestor keys ordered from the nearest parent to the root. */
export function getAncestorKeys<T>(registry: TreeRegistry<T>, key: string): string[] {
  const result: string[] = []
  let parentKey = registry.nodes.get(key)?.parentKey
  while (parentKey !== undefined) {
    result.push(parentKey)
    parentKey = registry.nodes.get(parentKey)?.parentKey
  }
  return result
}

/** Descendant keys of a node in pre-order, excluding the node itself. */
export function getDescendantKeys<T>(registry: TreeRegistry<T>, key: string): string[] {
  const result: string[] = []
  function visit(keys: readonly string[]): void {
    for (const childKey of keys) {
      result.push(childKey)
      visit(registry.nodes.get(childKey)!.childrenKeys)
    }
  }
  visit(registry.nodes.get(key)?.childrenKeys ?? [])
  return result
}

export function getSiblingKeys<T>(registry: TreeRegistry<T>, key: string): readonly string[] {
  const parentKey = registry.nodes.get(key)?.parentKey
  return parentKey === undefined
    ? registry.rootKeys
    : (registry.nodes.get(parentKey)?.childrenKeys ?? [])
}

export function sameKeys(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((key, index) => key === right[index])
}

/**
 * Derives every node's check state in pre-order. With cascading, a key checks its enabled
 * subtree and a branch with enabled children derives its state from them.
 */
export function resolveCheckedStates<T>(
  registry: TreeRegistry<T>,
  keys: ReadonlySet<string>,
  cascade: boolean,
): Map<string, TreeT.CheckedState> {
  const states = new Map<string, TreeT.CheckedState>()
  if (!cascade) {
    for (const key of registry.nodes.keys()) {
      states.set(key, keys.has(key) ? 'checked' : 'unchecked')
    }
    return states
  }

  function visit(key: string, forced: boolean): void {
    const node = registry.nodes.get(key)!
    const selfChecked = (!node.disabled && forced) || keys.has(key)
    states.set(key, selfChecked ? 'checked' : 'unchecked')
    if (node.childrenKeys.length === 0) {
      return
    }
    let checked = 0
    let unchecked = 0
    let enabledCount = 0
    for (const childKey of node.childrenKeys) {
      visit(childKey, selfChecked)
      if (registry.nodes.get(childKey)!.disabled) {
        continue
      }
      enabledCount += 1
      const state = states.get(childKey)
      if (state === 'checked') {
        checked += 1
      } else if (state === 'unchecked') {
        unchecked += 1
      }
    }
    if (enabledCount > 0) {
      states.set(
        key,
        checked === enabledCount
          ? 'checked'
          : unchecked === enabledCount
            ? 'unchecked'
            : 'indeterminate',
      )
    }
  }

  for (const key of registry.rootKeys) {
    visit(key, false)
  }
  return states
}

export function collectCheckedKeys(states: ReadonlyMap<string, TreeT.CheckedState>): string[] {
  const result: string[] = []
  for (const [key, state] of states) {
    if (state === 'checked') {
      result.push(key)
    }
  }
  return result
}
