import type { Component, JSX } from 'solid-js'
import { splitProps } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { useRecipe } from '../../provider'
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

/** Shared wiring for fixed-tag table parts: root variants, root classes/styles, and slot merging. */
export function createTablePart<P extends TablePartProps>(
  slot: TablePartSlot,
  tag: ValidComponent,
): Component<P> {
  return function TablePartComponent(props: P): JSX.Element {
    const [local, rest] = splitProps(props, ['class', 'style'])
    const context = useTableContext()
    const { slots } = useRecipe(tableRecipe, local, {
      slot,
      contextVariants: () => ({
        size: context.size,
        striped: context.striped,
        hoverEffect: context.hoverEffect,
        showBorder: context.showBorder,
      }),
      contextSlots: () => context.slotOverrides,
    })

    return <Dynamic component={tag} data-slot={`table-${slot}`} {...rest} {...slots[slot]} />
  }
}
