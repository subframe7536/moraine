import type { JSX } from 'solid-js'
import { splitProps } from 'solid-js'

import { useRecipe } from '../../provider'

import { useTableContext } from './table-context'
import { tableDataAttributes, tableRecipe } from './table.recipe'
import type { TableT } from './table.types'

export function TableRow(props: TableT.RowProps): JSX.Element {
  const [local, rest] = splitProps(props, ['selected', 'class', 'style'])
  const context = useTableContext()
  const { slots } = useRecipe(tableRecipe, local, {
    slot: 'row',
    contextVariants: () => ({
      size: context.size,
      striped: context.striped,
      hoverEffect: context.hoverEffect,
      showBorder: context.showBorder,
    }),
    contextSlots: () => context.slotOverrides,
  })

  return (
    <tr
      data-slot="table-row"
      aria-selected={local.selected}
      {...tableDataAttributes.row({ selected: () => local.selected })}
      {...rest}
      {...slots.row}
    />
  )
}
