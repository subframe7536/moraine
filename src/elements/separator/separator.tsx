import type { JSX } from 'solid-js'
import { splitProps } from 'solid-js'

import { createStyles } from '../../provider'

import { separatorRecipe } from './separator.recipe'
import type { SeparatorProps } from './separator.types'

/** Semantic divider with configurable horizontal or vertical orientation. */
export function Separator(props: SeparatorProps): JSX.Element {
  const [local, rest] = splitProps(props, ['orientation', 'class', 'style', 'classes', 'styles'])
  const resolved = createStyles(separatorRecipe, local)
  const orientation = () => resolved.variants.orientation

  return (
    <div
      data-slot="root"
      {...rest}
      role="separator"
      aria-orientation={orientation()}
      data-orientation={orientation()}
      {...resolved.styles.root}
    />
  )
}
