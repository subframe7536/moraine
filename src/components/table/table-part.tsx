import type { JSX } from '@solidjs/web'
import { dynamic } from '@solidjs/web'
import type { FlowComponent } from 'solid-js'
import { omit } from 'solid-js'

import { useRecipe } from '../../provider'
import type { SlotValue, UseRecipeResult } from '../../provider'
import type { ValidComponent } from '../../shared/types'
import { pick } from '../../shared/utils'
import type { DataAttributeBag } from '../../theme/style-contract'
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
  options: { own?: () => SlotValue; data?: DataAttributeBag } = {},
): UseRecipeResult<typeof tableRecipe>['slots'] {
  const context = useTableContext()
  const { slots } = useRecipe(tableRecipe, props, {
    slot,
    context: () => ({ variants: context.variants, ...context.slotOverrides }),
    ...(options.own ? { own: { [slot]: options.own } } : {}),
    ...(options.data ? { data: { [slot]: options.data } } : {}),
  })
  return slots
}

/** Fixed-tag table part with no configuration of its own. */
export function createTablePart<P extends TablePartProps>(
  slot: TablePartSlot,
  tag: ValidComponent,
): FlowComponent<P> {
  const Tag = dynamic(() => tag)
  return function TablePartComponent(props): JSX.Element {
    const local = pick(props, 'class', 'style')
    const rest = omit(props, 'class', 'style')
    const slots = useTablePart(slot, local)

    return <Tag data-slot={`table-${slot}`} {...slots[slot]} {...rest} />
  }
}
