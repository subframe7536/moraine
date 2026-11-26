import type { JSX } from '@solidjs/web'
import { dynamic } from '@solidjs/web'
import { untrack, omit } from 'solid-js'

import { useRecipe } from '../../provider'
import type { ValidComponent } from '../../shared/types'
import type { SlotClassValue } from '../../theme/style-types'

import { useEmptyContext } from './empty-context'
import { emptyRecipe } from './empty.recipe'
import type { EmptyStyleSlot } from './empty.style-types'
export type EmptyPartSlot = Exclude<keyof EmptyStyleSlot, 'root'>

export type EmptyPartProps<T extends ValidComponent = 'div'> = {
  [key: string]: unknown
  as?: T
  class?: SlotClassValue
  style?: JSX.CSSProperties
  children?: JSX.Element
}

export function createEmptyPart<S extends EmptyPartSlot>(
  slot: S,
  fallback: ValidComponent = 'div',
) {
  return function EmptyPartComponent<T extends ValidComponent>(
    props: EmptyPartProps<T>,
  ): JSX.Element {
    const local = props as {
      as?: ValidComponent
      class?: SlotClassValue
      style?: JSX.CSSProperties
    }
    const rest = omit(
      props as { as?: ValidComponent; class?: SlotClassValue; style?: JSX.CSSProperties },
      'as',
      'class',
      'style',
    )
    const context = useEmptyContext()
    const {
      slots: { [slot]: partSlot },
    } = useRecipe(emptyRecipe, local, {
      slot,
      context: () => ({ variants: { size: context.size }, ...context.slotOverrides }),
    })

    const Root = dynamic<ValidComponent>(() => local.as ?? fallback)

    return <Root data-slot={`empty-${slot}`} {...partSlot} {...(rest as Record<string, unknown>)} />
  }
}

export function EmptyPart(
  props: EmptyPartProps & { slot: EmptyPartSlot; fallback: ValidComponent },
): JSX.Element {
  const rest = omit(props, 'slot', 'fallback', 'as', 'class', 'style')
  const context = useEmptyContext()
  const slot = untrack(() => props.slot)
  const {
    slots: { [slot]: partSlot },
  } = useRecipe(emptyRecipe, props, {
    slot,
    context: () => ({ variants: { size: context.size }, ...context.slotOverrides }),
  })
  const Root = dynamic<ValidComponent>(() => props.as ?? props.fallback)

  return <Root data-slot={`empty-${slot}`} {...partSlot} {...(rest as Record<string, unknown>)} />
}
