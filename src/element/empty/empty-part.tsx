import type { JSX } from 'solid-js'
import { splitProps, untrack } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { useRecipe } from '../../provider'
import type { ValidComponent } from '../../shared/types'
import type { SlotClassValue } from '../../theme/style-types'

import { useEmptyContext } from './empty-context'
import { emptyRecipe } from './empty.recipe'
import type { EmptyStyleSlot } from './empty.style-types'

export type EmptyPartSlot = Exclude<keyof EmptyStyleSlot, 'root'>

export type EmptyPartProps = Omit<
  JSX.HTMLAttributes<HTMLElement>,
  'style' | 'class' | 'children'
> & {
  slot: EmptyPartSlot
  fallback: ValidComponent
  as?: ValidComponent
  class?: SlotClassValue
  style?: JSX.CSSProperties
  children?: JSX.Element
}

export function EmptyPart(props: EmptyPartProps): JSX.Element {
  const [local, rest] = splitProps(props, ['slot', 'fallback', 'as', 'class', 'style'])
  const context = useEmptyContext()
  const { slots } = useRecipe(emptyRecipe, local, {
    slot: untrack(() => local.slot),
    contextVariants: () => ({ size: context.size }),
    contextSlots: () => context.slotOverrides,
  })

  return (
    <Dynamic
      component={local.as ?? local.fallback}
      data-slot={`empty-${local.slot}`}
      {...rest}
      {...slots[local.slot]}
    />
  )
}
