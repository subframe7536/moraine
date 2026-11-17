import type { JSX } from 'solid-js'
import { splitProps } from 'solid-js'

import { useRecipe } from '../../provider'
import { Separator } from '../separator'

import { useButtonGroupContext } from './button-group-context'
import { buttonGroupRecipe } from './button-group.recipe'
import type { ButtonGroupT } from './button-group.types'

/**
 * Explicit divider between adjacent buttons of a `ButtonGroup`. Place it between the group's
 * children where a visible boundary is useful. Its orientation is perpendicular to the group
 * axis (vertical in a horizontal group). Renders a `div` with `role="separator"`.
 *
 * @example
 * ```tsx
 * import { Button, ButtonGroup } from 'moraine'
 *
 * <ButtonGroup aria-label="Clipboard actions">
 *   <Button>Copy</Button>
 *   <ButtonGroup.Separator />
 *   <Button>Paste</Button>
 * </ButtonGroup>
 * ```
 */
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
