export interface TreeNode<T> {
  key: string
  raw: T
  parentKey: string | undefined
  childrenKeys: readonly string[]
  /** Zero-based position among siblings. */
  indexInParent: number
  siblingCount: number
  /** One-based depth, matching `aria-level`. */
  level: number
  /** True for nodes with known children and for unloaded lazy branches. */
  hasChildren: boolean
  /** True when the node is a lazy branch whose children have not been loaded. */
  needsLoad: boolean
}

export interface TreeRegistry<T> {
  nodes: ReadonlyMap<string, TreeNode<T>>
  rootKeys: readonly string[]
}

export interface BuildRegistryOptions<T> {
  getKey: (item: T) => string
  getChildren?: (item: T) => readonly T[] | undefined
  isLeaf?: (item: T) => boolean
  /** Whether a loader exists, which makes childless non-leaf items lazy branches. */
  canLoad: boolean
  loaded: Readonly<Record<string, readonly T[]>>
}

/** Indexes nested data by key. A key seen more than once keeps its first occurrence. */
export function buildRegistry<T>(
  items: readonly T[],
  options: BuildRegistryOptions<T>,
): TreeRegistry<T> {
  const nodes = new Map<string, TreeNode<T>>()

  function visit(
    list: readonly T[],
    parentKey: string | undefined,
    level: number,
    siblingCount: number,
  ): string[] {
    const keys: string[] = []
    list.forEach((raw, index) => {
      const key = options.getKey(raw)
      if (nodes.has(key)) {
        return
      }
      const loadedChildren = options.loaded[key]
      const children = loadedChildren ?? options.getChildren?.(raw)
      const needsLoad = children === undefined && options.canLoad && !options.isLeaf?.(raw)
      const node: TreeNode<T> = {
        key,
        raw,
        parentKey,
        childrenKeys: [],
        indexInParent: index,
        siblingCount,
        level,
        hasChildren: children ? children.length > 0 : needsLoad,
        needsLoad,
      }
      nodes.set(key, node)
      keys.push(key)
      if (children?.length) {
        node.childrenKeys = visit(children, key, level + 1, children.length)
      }
    })
    return keys
  }

  const rootKeys = visit(items, undefined, 1, items.length)
  return { nodes, rootKeys }
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
