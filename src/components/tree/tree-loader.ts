import type { Accessor } from 'solid-js'
import { batch, createSignal } from 'solid-js'

import type { TreeNode } from './tree-registry'
import type { TreeT } from './tree.types'

export interface TreeLoaderDeps<T> {
  options: TreeT.Options<T>
  setLoadingKeys: (update: (keys: readonly string[]) => readonly string[]) => void
}

export interface TreeLoader<T> {
  /** Children fetched by `loadChildren`, by parent key. */
  loaded: Accessor<Readonly<Record<string, readonly T[]>>>
  /** Resolves `true` once the node's children are available. */
  load: (node: TreeNode<T> | undefined) => Promise<boolean>
}

export function createTreeLoader<T>(deps: TreeLoaderDeps<T>): TreeLoader<T> {
  const [loaded, setLoaded] = createSignal<Readonly<Record<string, readonly T[]>>>({})
  const inFlight = new Map<string, Promise<boolean>>()

  async function run(key: string, item: T, loadChildren: (item: T) => Promise<readonly T[]>) {
    let children: readonly T[]
    try {
      children = await loadChildren(item)
    } catch (error) {
      deps.setLoadingKeys((keys) => keys.filter((loadingKey) => loadingKey !== key))
      deps.options.onLoadChildrenError?.({ item, error })
      return false
    } finally {
      inFlight.delete(key)
    }
    batch(() => {
      setLoaded((previous) => ({ ...previous, [key]: children }))
      deps.setLoadingKeys((keys) => keys.filter((loadingKey) => loadingKey !== key))
    })
    deps.options.onLoadChildrenComplete?.({ item, children })
    return true
  }

  function load(node: TreeNode<T> | undefined): Promise<boolean> {
    const loadChildren = deps.options.loadChildren
    if (!node || !loadChildren) {
      return Promise.resolve(false)
    }
    if (!node.needsLoad) {
      return Promise.resolve(true)
    }
    const { key } = node
    const pending = inFlight.get(key)
    if (pending) {
      return pending
    }
    deps.setLoadingKeys((keys) => [...keys, key])
    const promise = run(key, node.raw, loadChildren)
    inFlight.set(key, promise)
    return promise
  }

  return { loaded, load }
}
