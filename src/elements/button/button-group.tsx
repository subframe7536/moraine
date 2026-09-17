import type { JSX } from 'solid-js'
import { splitProps } from 'solid-js'

import { createStyles } from '../../provider'
import { Separator } from '../separator'

import { ButtonGroupProvider, useButtonGroupContext } from './button-group-context'
import { buttonGroupRecipe } from './button-group.recipe'
import type { ButtonGroupProps, ButtonGroupT } from './button-group.types'

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
  const resolved = createStyles(buttonGroupRecipe, local)

  return (
    <ButtonGroupProvider
      value={{
        get size() {
          return resolved.variants.size
        },
        get variant() {
          return resolved.variants.variant
        },
        get presentation() {
          return { classes: local.classes, styles: local.styles }
        },
      }}
    >
      <div role={local.role ?? 'group'} data-slot="root" {...rest} {...resolved.styles.root}>
        {local.children}
      </div>
    </ButtonGroupProvider>
  )
}

/** Explicit semantic divider for adjacent ButtonGroup parts. */
function ButtonGroupSeparator(props: ButtonGroupT.SeparatorProps): JSX.Element {
  const [local, rest] = splitProps(props, ['orientation', 'classes', 'styles', 'class', 'style'])
  const group = useButtonGroupContext()
  const resolved = createStyles(buttonGroupRecipe, local, {
    rootSlot: 'separator',
    inheritedVariants: () => ({ orientation: 'vertical' as const }),
    inheritedStyles: () => group?.presentation,
  })

  return (
    <Separator
      {...rest}
      data-slot="button-group-separator"
      orientation={resolved.variants.orientation}
      {...resolved.styles.separator}
    />
  )
}

ButtonGroup.Separator = ButtonGroupSeparator
