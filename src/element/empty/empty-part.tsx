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

export type EmptyPartProps<T extends ValidComponent = 'div'> = Omit<
  JSX.HTMLAttributes<HTMLElement>,
  'style' | 'class' | 'children'
> & {
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
    const [local, rest] = splitProps(
      props as { as?: ValidComponent; class?: SlotClassValue; style?: JSX.CSSProperties },
      ['as', 'class', 'style'],
    )
    const context = useEmptyContext()
    const { slots } = useRecipe(emptyRecipe, local, {
      slot,
      contextVariants: () => ({ size: context.size }),
      contextSlots: () => context.slotOverrides,
    })

    return (
      <Dynamic
        component={local.as ?? fallback}
        data-slot={`empty-${slot}`}
        {...rest}
        {...slots[slot]}
      />
    )
  }
}

export function EmptyPart(
  props: EmptyPartProps & { slot: EmptyPartSlot; fallback: ValidComponent },
): JSX.Element {
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
