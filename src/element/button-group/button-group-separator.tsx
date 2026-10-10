import type { JSX } from 'solid-js'
import { splitProps } from 'solid-js'

import { createStyles } from '../../provider'
import { Separator } from '../separator'

import { useButtonGroupContext } from './button-group-context'
import { buttonGroupRecipe } from './button-group.recipe'
import type { ButtonGroupT } from './button-group.types'

/** Explicit semantic divider for adjacent ButtonGroup parts. */
export function ButtonGroupSeparator(props: ButtonGroupT.SeparatorProps): JSX.Element {
  const [local, rest] = splitProps(props, ['orientation', 'class', 'style'])
  const group = useButtonGroupContext()
  const resolved = createStyles(buttonGroupRecipe, local, {
    rootSlot: 'separator',
    inheritedVariants: () => ({
      orientation:
        group?.orientation === 'vertical' ? ('horizontal' as const) : ('vertical' as const),
    }),
    inheritedStyles: () => group?.presentation,
  })

  return (
    <Separator
      data-slot="button-group-separator"
      orientation={resolved.variants.orientation}
      {...rest}
      {...resolved.styles.separator}
    />
  )
}
