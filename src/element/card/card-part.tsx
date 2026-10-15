import type { JSX } from 'solid-js'
import { splitProps, untrack } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { useRecipe } from '../../provider'
import type { ValidComponent } from '../../shared/types'
import type { SlotClassValue } from '../../theme/style-types'

import { useCardContext } from './card-context'
import { cardRecipe } from './card.recipe'
import type { CardStyleSlot } from './card.style-types'

export type CardPartSlot = Exclude<keyof CardStyleSlot, 'root'>

export type CardPartProps = Omit<
  JSX.HTMLAttributes<HTMLElement>,
  'style' | 'class' | 'children'
> & {
  slot: CardPartSlot
  fallback: ValidComponent
  as?: ValidComponent
  class?: SlotClassValue
  style?: JSX.CSSProperties
  children?: JSX.Element
}

export function CardPart(props: CardPartProps): JSX.Element {
  const [local, rest] = splitProps(props, ['slot', 'fallback', 'as', 'class', 'style'])
  const context = useCardContext()
  const { slots } = useRecipe(cardRecipe, local, {
    slot: untrack(() => local.slot),
    contextVariants: () => ({ variant: context.variant, size: context.size }),
    contextSlots: () => context.slotOverrides,
  })

  return (
    <Dynamic
      component={local.as ?? local.fallback}
      data-slot={`card-${local.slot}`}
      {...rest}
      {...slots[local.slot]}
    />
  )
}
