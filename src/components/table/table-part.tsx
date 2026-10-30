import type { FlowComponent, JSX } from 'solid-js'
import { splitProps } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { useRecipe } from '../../provider'
import type { SlotValue, UseRecipeResult } from '../../provider'
import type { ValidComponent } from '../../shared/types'
import type { SlotClassValue, SlotStyleValue } from '../../theme/style-types'

import { useTableContext } from './table-context'
import { tableRecipe } from './table.recipe'
import type { TableStyleSlot } from './table.style-types'

export type TablePartSlot = Exclude<keyof TableStyleSlot, 'root' | 'container'>

interface TablePartProps {
  class?: SlotClassValue
  style?: SlotStyleValue
}

/** Resolves a table part slot with the root's variants and slot overrides. */
export function useTablePart(
  slot: TablePartSlot,
  props: TablePartProps,
  own?: () => SlotValue,
): UseRecipeResult<typeof tableRecipe>['slots'] {
  const context = useTableContext()
  const { slots } = useRecipe(tableRecipe, props, {
    slot,
    contextVariants: () => context.variants,
    contextSlots: () => context.slotOverrides,
    ...(own ? { own: { [slot]: own } } : {}),
  })
  return slots
}

/** Fixed-tag table part with no configuration of its own. */
export function createTablePart<P extends TablePartProps>(
  slot: TablePartSlot,
  tag: ValidComponent,
): FlowComponent<P> {
  return function TablePartComponent(props): JSX.Element {
    const [local, rest] = splitProps(props, ['class', 'style'])
    const slots = useTablePart(slot, local)

    return <Dynamic component={tag} data-slot={`table-${slot}`} {...rest} {...slots[slot]} />
  }
}
