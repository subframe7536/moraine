import type { JSX } from 'solid-js'
import { splitProps } from 'solid-js'

import { useRecipe } from '../../provider'

import { ButtonGroupProvider } from './button-group-context'
import { ButtonGroupSeparator } from './button-group-separator'
import { buttonGroupRecipe } from './button-group.recipe'
import type { ButtonGroupProps } from './button-group.types'

/** Joins related buttons and provides shared size and visual variant defaults. */
export function ButtonGroup(props: ButtonGroupProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    'orientation',
    'role',
    'size',
    'variant',
    'classes',
    'styles',
    'class',
    'style',
    'children',
  ])
  const { slots, variants } = useRecipe(buttonGroupRecipe, local)

  return (
    <ButtonGroupProvider
      value={{
        get size() {
          return variants.size
        },
        get variant() {
          return variants.variant
        },
        get orientation() {
          return variants.orientation
        },
        get slotOverrides() {
          return { classes: local.classes, styles: local.styles }
        },
      }}
    >
      <div role={local.role ?? 'group'} data-slot="button-group" {...rest} {...slots.root}>
        {local.children}
      </div>
    </ButtonGroupProvider>
  )
}

ButtonGroup.Separator = ButtonGroupSeparator
