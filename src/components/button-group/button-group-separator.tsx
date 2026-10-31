import type { JSX } from 'solid-js'
import { splitProps } from 'solid-js'

import { useRecipe } from '../../provider'
import { Separator } from '../separator'

import { useButtonGroupContext } from './button-group-context'
import { buttonGroupRecipe } from './button-group.recipe'
import type { ButtonGroupT } from './button-group.types'

/** Explicit semantic divider for adjacent ButtonGroup parts. */
export function ButtonGroupSeparator(props: ButtonGroupT.SeparatorProps): JSX.Element {
  const [local, rest] = splitProps(props, ['class', 'style'])
  const group = useButtonGroupContext()
  const {
    slots: { separator: separatorSlot },
    variants,
  } = useRecipe(buttonGroupRecipe, local, {
    slot: 'separator',
    varsSlot: 'separator',
    context: () => ({
      variants: {
        variant: group?.tone ? group?.variant : undefined,
        tone: group?.tone,
        orientation:
          group?.orientation === 'vertical' ? ('horizontal' as const) : ('vertical' as const),
      },
      ...group?.slotOverrides,
    }),
  })

  return (
    <Separator
      data-slot="button-group-separator"
      orientation={variants.orientation}
      {...separatorSlot}
      {...rest}
    />
  )
}
