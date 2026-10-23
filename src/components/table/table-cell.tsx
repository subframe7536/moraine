import type { JSX } from 'solid-js'
import { splitProps } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { useRecipe } from '../../provider'
import type { ValidComponent } from '../../shared/types'

import { useTableContext } from './table-context'
import { tableRecipe } from './table.recipe'
import type { TableT } from './table.types'

export function TableCell<T extends ValidComponent = 'td'>(
  props: TableT.CellProps<T>,
): JSX.Element {
  const [local, rest] = splitProps(
    props as TableT.CellProps<T> & {
      align?: 'left' | 'center' | 'right'
      truncated?: boolean
    },
    ['as', 'align', 'truncated', 'class', 'style'],
  )
  const context = useTableContext()
  const { slots } = useRecipe(tableRecipe, local, {
    slot: 'cell',
    contextVariants: () => ({
      size: context.size,
      striped: context.striped,
      borderless: context.borderless,
      verticalBorder: context.verticalBorder,
    }),
    contextSlots: () => context.slotOverrides,
    own: {
      cell: () => {
        let alignClass: string | undefined
        if (local.align === 'center') {
          alignClass = 'text-center'
        } else if (local.align === 'right') {
          alignClass = 'text-right'
        } else if (local.align === 'left') {
          alignClass = 'text-left'
        }

        const truncateClass = local.truncated ? 'truncate' : undefined

        return {
          class: [alignClass, truncateClass].filter(Boolean).join(' ') || undefined,
        }
      },
    },
  })

  return <Dynamic component={local.as ?? 'td'} data-slot="table-cell" {...rest} {...slots.cell} />
}
