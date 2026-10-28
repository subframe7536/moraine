import type { Accessor } from 'solid-js'
import { createMemo } from 'solid-js'

import { createControllableValue } from '../../shared/controllable-value'

import { getAncestorKeys, getDescendantKeys, sameKeys } from './tree-registry'
import type { TreeRegistry } from './tree-registry'
import type { TreeT } from './tree.types'

/**
 * Derives every node's check state. With cascading, a key checks its enabled subtree and a
 * branch with enabled children derives its state from them.
 */
export function resolveCheckedStates<T>(
  registry: TreeRegistry<T>,
  keys: ReadonlySet<string>,
  cascade: boolean,
  isDisabled: (key: string) => boolean = () => false,
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
    const disabled = isDisabled(key)
    const selfChecked = (!disabled && forced) || keys.has(key)
    if (node.childrenKeys.length === 0) {
      states.set(key, selfChecked ? 'checked' : 'unchecked')
      return
    }
    let checked = 0
    let unchecked = 0
    let enabledCount = 0
    for (const childKey of node.childrenKeys) {
      visit(childKey, selfChecked)
      if (isDisabled(childKey)) {
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
    if (enabledCount === 0) {
      states.set(key, selfChecked ? 'checked' : 'unchecked')
      return
    }
    states.set(
      key,
      checked === enabledCount
        ? 'checked'
        : unchecked === enabledCount
          ? 'unchecked'
          : 'indeterminate',
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

export interface TreeCheckedDeps<T> {
  options: TreeT.Options<T>
  registry: Accessor<TreeRegistry<T>>
  isDisabled: (key: string) => boolean
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
    resolveCheckedStates(deps.registry(), new Set(storedKeys()), cascade(), deps.isDisabled),
  )
  const checkedKeys = createMemo(() => collectCheckedKeys(deps.registry(), states()), undefined, {
    equals: sameKeys,
  })

  function setChecked(key: string, checked: boolean): void {
    const registry = deps.registry()
    if (!registry.nodes.has(key) || deps.isDisabled(key)) {
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
    const subtree = [
      key,
      ...getDescendantKeys(registry, key).filter((childKey) => !deps.isDisabled(childKey)),
    ]
    if (checked) {
      for (const subtreeKey of subtree) {
        working.add(subtreeKey)
      }
    } else {
      for (const subtreeKey of [...subtree, ...getAncestorKeys(registry, key)]) {
        working.delete(subtreeKey)
      }
    }
    const next = resolveCheckedStates(registry, working, true, deps.isDisabled)
    setStoredKeys([...collectCheckedKeys(registry, next), ...unknownKeys])
  }

  return {
    checkedKeys,
    getState: (key) => states().get(key) ?? 'unchecked',
    setChecked,
    toggleCheck: (key) => setChecked(key, states().get(key) !== 'checked'),
  }
}
