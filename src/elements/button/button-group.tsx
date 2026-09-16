import type { JSX } from 'solid-js'
import { splitProps, useContext } from 'solid-js'

import { createComponentStyles } from '../../shared/provider'
import { Separator } from '../separator'

import { ButtonGroupContext } from './button-group-context'
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
  const resolved = createComponentStyles('buttonGroup', local)

  return (
    <ButtonGroupContext.Provider
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
      <div role={local.role ?? 'group'} data-slot="root" {...rest} {...resolved.root}>
        {local.children}
      </div>
    </ButtonGroupContext.Provider>
  )
}

/** Explicit semantic divider for adjacent ButtonGroup parts. */
function ButtonGroupSeparator(props: ButtonGroupT.SeparatorProps): JSX.Element {
  const [local, rest] = splitProps(props, ['orientation', 'classes', 'styles', 'class', 'style'])
  const group = useContext(ButtonGroupContext)
  const resolved = createComponentStyles('buttonGroup', local, {
    rootSlot: 'separator',
    inheritedVariants: () => ({ orientation: 'vertical' as const }),
    groupStyles: () => group?.presentation,
  })

  return (
    <Separator
      {...rest}
      data-slot="button-group-separator"
      orientation={resolved.variants.orientation ?? 'vertical'}
      {...resolved.root}
    />
  )
}

ButtonGroup.Separator = ButtonGroupSeparator
