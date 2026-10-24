import type { Accessor } from 'solid-js'
import { createMemo } from 'solid-js'

import { createControllableValue } from '../../shared/controllable-value'

import { getAncestorKeys, getDescendantKeys } from './tree-registry'
import type { TreeRegistry } from './tree-registry'
import type { TreeT } from './tree.types'

/**
 * Derives every node's check state. With cascading, a key checks its whole subtree and a
 * branch with children derives its state from them.
 */
export function resolveCheckedStates<T>(
  registry: TreeRegistry<T>,
  keys: ReadonlySet<string>,
  cascade: boolean,
): Map<string, TreeT.CheckedState> {
  const states = new Map<string, TreeT.CheckedState>()

  function visit(key: string, forced: boolean): void {
    const node = registry.nodes.get(key)!
    if (!cascade) {
      states.set(key, keys.has(key) ? 'checked' : 'unchecked')
      for (const childKey of node.childrenKeys) {
        visit(childKey, false)
      }
      return
    }
    const selfChecked = forced || keys.has(key)
    if (node.childrenKeys.length === 0) {
      states.set(key, selfChecked ? 'checked' : 'unchecked')
      return
    }
    let checked = 0
    let unchecked = 0
    for (const childKey of node.childrenKeys) {
      visit(childKey, selfChecked)
      const state = states.get(childKey)
      if (state === 'checked') {
        checked += 1
      } else if (state === 'unchecked') {
        unchecked += 1
      }
    }
    const count = node.childrenKeys.length
    states.set(
      key,
      checked === count ? 'checked' : unchecked === count ? 'unchecked' : 'indeterminate',
    )
  }

  for (const key of registry.rootKeys) {
    visit(key, false)
  }
  return states
}

function collectCheckedKeys<T>(
  registry: TreeRegistry<T>,
  states: ReadonlyMap<string, TreeT.CheckedState>,
): string[] {
  const result: string[] = []
  function visit(keys: readonly string[]): void {
    for (const key of keys) {
      if (states.get(key) === 'checked') {
        result.push(key)
      }
      visit(registry.nodes.get(key)!.childrenKeys)
    }
  }
  visit(registry.rootKeys)
  return result
}

function sameKeys(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((key, index) => key === right[index])
}

export interface TreeCheckedDeps<T> {
  options: TreeT.Options<T>
  registry: Accessor<TreeRegistry<T>>
}

export interface TreeChecked {
  checkedKeys: Accessor<readonly string[]>
  getState: (key: string) => TreeT.CheckedState
  setChecked: (key: string, checked: boolean) => void
  toggleCheck: (key: string) => void
}

export function createTreeChecked<T>(deps: TreeCheckedDeps<T>): TreeChecked {
  const [storedKeys, setStoredKeys] = createControllableValue<readonly string[]>({
    value: () => deps.options.checkedKeys,
    defaultValue: () => deps.options.defaultCheckedKeys ?? [],
    onChange: (keys) => deps.options.onCheckedChange?.([...keys]),
  })
  const cascade = () => deps.options.checkCascade !== false
  const states = createMemo(() =>
    resolveCheckedStates(deps.registry(), new Set(storedKeys()), cascade()),
  )
  const checkedKeys = createMemo(() => collectCheckedKeys(deps.registry(), states()), undefined, {
    equals: sameKeys,
  })

  function setChecked(key: string, checked: boolean): void {
    const registry = deps.registry()
    if (!registry.nodes.has(key)) {
      return
    }

    if (!cascade()) {
      setStoredKeys((previous) =>
        checked
          ? previous.includes(key)
            ? previous
            : [...previous, key]
          : previous.filter((storedKey) => storedKey !== key),
      )
      return
    }

    // Keys outside the current data, such as children that are not loaded yet, are preserved.
    const unknownKeys = storedKeys().filter((storedKey) => !registry.nodes.has(storedKey))
    const working = new Set<string>()
    for (const [stateKey, state] of states()) {
      if (state === 'checked') {
        working.add(stateKey)
      }
    }
    const subtree = [key, ...getDescendantKeys(registry, key)]
    if (checked) {
      for (const subtreeKey of subtree) {
        working.add(subtreeKey)
      }
    } else {
      for (const subtreeKey of [...subtree, ...getAncestorKeys(registry, key)]) {
        working.delete(subtreeKey)
      }
    }
    const next = resolveCheckedStates(registry, working, true)
    setStoredKeys([...collectCheckedKeys(registry, next), ...unknownKeys])
  }

  return {
    checkedKeys,
    getState: (key) => states().get(key) ?? 'unchecked',
    setChecked,
    toggleCheck: (key) => setChecked(key, states().get(key) !== 'checked'),
  }
}
