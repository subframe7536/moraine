import type { JSX } from 'solid-js'
import { splitProps } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { useRecipe } from '../../provider'
import type { ValidComponent } from '../../shared/types'

import { useTableContext } from './table-context'
import { tableDataAttributes, tableRecipe } from './table.recipe'
import type { TableT } from './table.types'

export function TableRow<T extends ValidComponent = 'tr'>(props: TableT.RowProps<T>): JSX.Element {
  const [local, rest] = splitProps(props as TableT.RowProps<T> & { selected?: boolean }, [
    'as',
    'selected',
    'class',
    'style',
  ])
  const context = useTableContext()
  const { slots } = useRecipe(tableRecipe, local, {
    slot: 'row',
    contextVariants: () => ({
      size: context.size,
      striped: context.striped,
      borderless: context.borderless,
    }),
    contextSlots: () => context.slotOverrides,
  })

  return (
    <Dynamic
      component={local.as ?? 'tr'}
      data-slot="table-row"
      aria-selected={local.selected}
      {...tableDataAttributes.row({ selected: () => local.selected })}
      {...rest}
      {...slots.row}
    />
  )
}
