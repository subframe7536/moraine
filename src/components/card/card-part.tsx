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

export type CardPartProps<T extends ValidComponent = 'div'> = Omit<
  JSX.HTMLAttributes<HTMLElement>,
  'style' | 'class' | 'children'
> & {
  as?: T
  class?: SlotClassValue
  style?: JSX.CSSProperties
  children?: JSX.Element
}

export function createCardPart<S extends CardPartSlot>(slot: S, fallback: ValidComponent = 'div') {
  return function CardPartComponent<T extends ValidComponent>(
    props: CardPartProps<T>,
  ): JSX.Element {
    const [local, rest] = splitProps(
      props as { as?: ValidComponent; class?: SlotClassValue; style?: JSX.CSSProperties },
      ['as', 'class', 'style'],
    )
    const context = useCardContext()
    const {
      slots: { [slot]: partSlot },
    } = useRecipe(cardRecipe, local, {
      slot,
      context: () => ({
        variants: { variant: context.variant, size: context.size },
        ...context.slotOverrides,
      }),
    })

    return (
      <Dynamic
        component={local.as ?? fallback}
        data-slot={`card-${slot}`}
        {...partSlot}
        {...rest}
      />
    )
  }
}

export function CardPart(
  props: CardPartProps & { slot: CardPartSlot; fallback: ValidComponent },
): JSX.Element {
  const [local, rest] = splitProps(props, ['slot', 'fallback', 'as', 'class', 'style'])
  const context = useCardContext()
  const slot = untrack(() => local.slot)
  const {
    slots: { [slot]: partSlot },
  } = useRecipe(cardRecipe, local, {
    slot,
    context: () => ({
      variants: { variant: context.variant, size: context.size },
      ...context.slotOverrides,
    }),
  })

  return (
    <Dynamic
      component={local.as ?? local.fallback}
      data-slot={`card-${slot}`}
      {...partSlot}
      {...rest}
    />
  )
}
