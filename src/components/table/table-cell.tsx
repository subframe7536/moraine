import type { JSX } from 'solid-js'
import { splitProps } from 'solid-js'

import { useRecipe } from '../../provider'

import { useTableContext } from './table-context'
import { TABLE_TEXT_ALIGN_CLASS, tableRecipe } from './table.recipe'
import type { TableT } from './table.types'

export function TableCell(props: TableT.CellProps): JSX.Element {
  const [local, rest] = splitProps(props, ['align', 'truncated', 'class', 'style'])
  const context = useTableContext()
  const { slots } = useRecipe(tableRecipe, local, {
    slot: 'cell',
    contextVariants: () => ({
      size: context.size,
      striped: context.striped,
      hoverEffect: context.hoverEffect,
      showBorder: context.showBorder,
    }),
    contextSlots: () => context.slotOverrides,
    own: {
      cell: () => ({
        class: [TABLE_TEXT_ALIGN_CLASS[local.align ?? 'left'], local.truncated && 'truncate'],
      }),
    },
  })

  return <td data-slot="table-cell" {...rest} {...slots.cell} />
}
