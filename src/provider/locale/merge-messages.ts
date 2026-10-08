import type { MoraineMessagesInput } from './messages.types'

const inputCache = new WeakMap<object, WeakMap<object, MoraineMessagesInput>>()

/**
 * Deep-merges two partial message packs across nested MoraineProviders.
 * Caches merged results by parent and patch object identity.
 */
export function mergeMessagesInput(
  parent: MoraineMessagesInput | undefined,
  patch: MoraineMessagesInput | undefined,
): MoraineMessagesInput | undefined {
  if (!parent) {
    return patch
  }
  if (!patch) {
    return parent
  }

  let byParent = inputCache.get(parent)
  if (!byParent) {
    byParent = new WeakMap()
    inputCache.set(parent, byParent)
  }
  const cached = byParent.get(patch)
  if (cached) {
    return cached
  }

  const result: MoraineMessagesInput = { ...parent }
  for (const key of Object.keys(patch) as (keyof MoraineMessagesInput)[]) {
    const parentGroup = parent[key]
    const patchGroup = patch[key]
    if (parentGroup && patchGroup) {
      const merged: Record<string, unknown> = { ...parentGroup }
      for (const groupKey of Object.keys(patchGroup)) {
        const val = (patchGroup as Record<string, unknown>)[groupKey]
        if (val !== undefined) {
          merged[groupKey] = val
        }
      }
      result[key] = Object.freeze(merged) as never
    } else if (patchGroup) {
      result[key] = patchGroup as never
    }
  }

  const frozen = Object.freeze(result)
  byParent.set(patch, frozen)
  return frozen
}
