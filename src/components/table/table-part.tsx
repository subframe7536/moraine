import type { JSX } from 'solid-js'
import { splitProps } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { useRecipe } from '../../provider'
import type { ValidComponent } from '../../shared/types'
import type { SlotClassValue } from '../../theme/style-types'

import { useTableContext } from './table-context'
import { tableRecipe } from './table.recipe'
import type { TableStyleSlot } from './table.style-types'

export type TablePartSlot = Exclude<
  keyof TableStyleSlot,
  'root' | 'container' | 'row' | 'head' | 'cell' | 'header' | 'caption'
>

export type TablePartProps<T extends ValidComponent = 'div'> = Omit<
  JSX.HTMLAttributes<HTMLElement>,
  'style' | 'class' | 'children'
> & {
  as?: T
  class?: SlotClassValue
  style?: JSX.CSSProperties
  children?: JSX.Element
}

export function createTablePart<S extends TablePartSlot>(slot: S, fallback: ValidComponent) {
  return function TablePartComponent<T extends ValidComponent>(
    props: TablePartProps<T>,
  ): JSX.Element {
    const [local, rest] = splitProps(
      props as { as?: ValidComponent; class?: SlotClassValue; style?: JSX.CSSProperties },
      ['as', 'class', 'style'],
    )
    const context = useTableContext()
    const { slots } = useRecipe(tableRecipe, local, {
      slot,
      contextVariants: () => ({
        size: context.size,
        striped: context.striped,
        borderless: context.borderless,
        showColumnBorder: context.showColumnBorder,
      }),
      contextSlots: () => context.slotOverrides,
    })

    return (
      <Dynamic
        component={local.as ?? fallback}
        data-slot={`table-${slot}`}
        {...rest}
        {...slots[slot]}
      />
    )
  }
}
