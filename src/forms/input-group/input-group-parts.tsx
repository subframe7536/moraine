import type { JSX } from 'solid-js'
import { splitProps } from 'solid-js'

import { createStyles } from '../../provider/index.ts'

import { useInputGroupContext } from './input-group-context.ts'
import { inputGroupRecipe } from './input-group.recipe'
import type { InputGroupT } from './input-group.types.ts'

export function InputGroupLeading(props: InputGroupT.LeadingProps): JSX.Element {
  const [local, rest] = splitProps(props, ['children', 'compact', 'class', 'style'])
  const group = useInputGroupContext()
  if (!group) {
    throw new Error('InputGroup.Leading must be used within InputGroup')
  }
  const resolved = createStyles(inputGroupRecipe, local, {
    rootSlot: 'leading',
    inheritedVariants: () => ({ size: group.size, orientation: group.orientation }),
    inheritedStyles: () => group.presentation,
  })
  return (
    <div
      {...rest}
      data-slot="leading"
      data-orientation={group.orientation}
      data-compact={resolved.variants.compact || undefined}
      {...resolved.styles.leading}
    >
      {local.children}
    </div>
  )
}

export function InputGroupTrailing(props: InputGroupT.TrailingProps): JSX.Element {
  const [local, rest] = splitProps(props, ['children', 'compact', 'class', 'style'])
  const group = useInputGroupContext()
  if (!group) {
    throw new Error('InputGroup.Trailing must be used within InputGroup')
  }
  const resolved = createStyles(inputGroupRecipe, local, {
    rootSlot: 'trailing',
    inheritedVariants: () => ({ size: group.size, orientation: group.orientation }),
    inheritedStyles: () => group.presentation,
  })
  return (
    <div
      {...rest}
      data-slot="trailing"
      data-orientation={group.orientation}
      data-compact={resolved.variants.compact || undefined}
      {...resolved.styles.trailing}
    >
      {local.children}
    </div>
  )
}
