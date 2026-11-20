import type { JSX } from 'solid-js'
import { splitProps } from 'solid-js'

import { useRecipe } from '../../provider'

import { skeletonRecipe } from './skeleton.recipe'
import type { SkeletonProps } from './skeleton.types'

/**
 * Animated placeholder that reserves space for content while it loads. Size and shape it with
 * `class` or `style` to match the content it replaces, and use `Progress` instead for measurable
 * task completion. Renders a `div`; `animation="shimmer"` sweeps a gradient instead of the default
 * pulse.
 *
 * @example
 * ```tsx
 * import { Skeleton } from 'moraine'
 *
 * <div class="flex gap-4 max-w-sm w-full items-center">
 *   <Skeleton class="rounded-full shrink-0 size-12" />
 *   <div class="flex-1 min-w-0 space-y-2">
 *     <Skeleton class="h-4 w-full" />
 *     <Skeleton animation="shimmer" class="h-4 w-2/3" />
 *   </div>
 * </div>
 * ```
 */
export function Skeleton(props: SkeletonProps): JSX.Element {
  const [local, rest] = splitProps(props, ['animation', 'class', 'style', 'classes', 'styles'])
  const {
    slots: { root: rootSlot },
  } = useRecipe(skeletonRecipe, local)

  return <div data-slot="skeleton" {...rootSlot} {...rest} />
}
