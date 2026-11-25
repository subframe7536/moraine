import type { JSX } from '@solidjs/web'
import { dynamic } from '@solidjs/web'
import { untrack, omit } from 'solid-js'

import { useRecipe } from '../../provider'
import type { ValidComponent } from '../../shared/types'
import { pick } from '../../shared/utils'
import type { SlotClassValue } from '../../theme/style-types'

import { useCardContext } from './card-context'
import { cardRecipe } from './card.recipe'
import type { CardStyleSlot } from './card.style-types'
export type CardPartSlot = Exclude<keyof CardStyleSlot, 'root'>

export type CardPartProps<T extends ValidComponent = 'div'> = {
  [key: string]: unknown
  as?: T
  class?: SlotClassValue
  style?: JSX.CSSProperties
  children?: JSX.Element
}

export function createCardPart<S extends CardPartSlot>(slot: S, fallback: ValidComponent = 'div') {
  return function CardPartComponent<T extends ValidComponent>(
    props: CardPartProps<T>,
  ): JSX.Element {
    const local = pick(
      props as { as?: ValidComponent; class?: SlotClassValue; style?: JSX.CSSProperties },
      'as',
      'class',
      'style',
    )
    const rest = omit(
      props as { as?: ValidComponent; class?: SlotClassValue; style?: JSX.CSSProperties },
      'as',
      'class',
      'style',
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

    const Root = dynamic<ValidComponent>(() => local.as ?? fallback)

    return <Root data-slot={`card-${slot}`} {...partSlot} {...(rest as Record<string, unknown>)} />
  }
}

export function CardPart(
  props: CardPartProps & { slot: CardPartSlot; fallback: ValidComponent },
): JSX.Element {
  const local = pick(props, 'slot', 'fallback', 'as', 'class', 'style')
  const rest = omit(props, 'slot', 'fallback', 'as', 'class', 'style')
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
  const Root = dynamic<ValidComponent>(() => local.as ?? local.fallback)

  return <Root data-slot={`card-${slot}`} {...partSlot} {...(rest as Record<string, unknown>)} />
}
