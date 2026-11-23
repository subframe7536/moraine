import type { JSX } from '@solidjs/web'
import { omit } from 'solid-js'

import { useRecipe } from '../../provider'
import { pick } from '../../shared/utils'

import { ButtonGroupProvider } from './button-group-context'
import { ButtonGroupSeparator } from './button-group-separator'
import { buttonGroupRecipe } from './button-group.recipe'
import type { ButtonGroupProps } from './button-group.types'
/**
 * Joins related buttons into one visual control set and provides shared `size`, `variant`,
 * `tone`, and `orientation` defaults that each child `Button` can override. Each child stays its
 * own interactive control: the group adds no selection coordination or toolbar keyboard
 * navigation, so use `ToggleButton` children for independently pressed actions. Renders a `div`
 * with `role="group"` by default; give it an `aria-label`.
 *
 * @example
 * ```tsx
 * import { Button, ButtonGroup } from 'moraine'
 *
 * <ButtonGroup variant="outline" size="sm" aria-label="Document actions">
 *   <Button>Copy link</Button>
 *   <Button>Duplicate</Button>
 *   <Button>Archive</Button>
 * </ButtonGroup>
 * ```
 */
export function ButtonGroup(props: ButtonGroupProps): JSX.Element {
  const local = pick(
    props,
    'orientation',
    'role',
    'size',
    'variant',
    'tone',
    'classes',
    'styles',
    'class',
    'style',
  )
  const rest = omit(
    props,
    'orientation',
    'role',
    'size',
    'variant',
    'tone',
    'classes',
    'styles',
    'class',
    'style',
  )
  const {
    slots: { root: rootSlot },
    variants,
  } = useRecipe(buttonGroupRecipe, local)

  return (
    <ButtonGroupProvider
      value={{
        get size() {
          return local.size ?? undefined
        },
        get variant() {
          return variants.variant
        },
        get tone() {
          return variants.tone
        },
        get orientation() {
          return variants.orientation
        },
        get slotOverrides() {
          return { classes: local.classes, styles: local.styles }
        },
      }}
    >
      <div role={local.role ?? 'group'} data-slot="button-group" {...rootSlot} {...rest} />
    </ButtonGroupProvider>
  )
}

ButtonGroup.Separator = ButtonGroupSeparator
