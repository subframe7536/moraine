import type { JSX } from 'solid-js'
import { splitProps } from 'solid-js'

import { createComponentStyles } from '../../shared/provider'

import { ButtonGroupContext } from './button-group-context'
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
  const resolved = createComponentStyles('buttonGroup', local)

  return (
    <ButtonGroupContext.Provider value={resolved.variants}>
      <div role={local.role ?? 'group'} data-slot="root" {...rest} {...resolved.root}>
        {local.children}
      </div>
    </ButtonGroupContext.Provider>
  )
}
