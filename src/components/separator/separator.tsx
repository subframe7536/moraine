import type { JSX } from 'solid-js'
import { splitProps } from 'solid-js'

import { useRecipe } from '../../provider'

import { separatorDataAttributes, separatorRecipe } from './separator.recipe'
import type { SeparatorProps } from './separator.types'

/**
 * Visible line that divides related regions, rendered as a `div` with `role="separator"`. It is
 * horizontal by default; set `orientation="vertical"` between items in a row. Inside a
 * `ButtonGroup`, use `ButtonGroup.Separator` so orientation follows the group.
 *
 * @example
 * ```tsx
 * import { Separator } from 'moraine'
 *
 * <div class="flex h-6 items-center gap-3">
 *   <span>Docs</span>
 *   <Separator orientation="vertical" />
 *   <span>Blog</span>
 * </div>
 * ```
 */
export function Separator(props: SeparatorProps): JSX.Element {
  const [local, rest] = splitProps(props, ['orientation', 'class', 'style', 'classes', 'styles'])
  const {
    slots: { root: rootSlot },
    variants,
  } = useRecipe(separatorRecipe, local, {
    data: { root: separatorDataAttributes.root(() => ({ orientation })) },
  })
  const orientation = () => variants.orientation

  return (
    <div
      data-slot="separator"
      role="separator"
      aria-orientation={orientation()}
      {...rootSlot}
      {...rest}
    />
  )
}
