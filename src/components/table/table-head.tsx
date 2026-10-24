import type { JSX } from 'solid-js'
import { splitProps } from 'solid-js'

import { useRecipe } from '../../provider'

import { useTableContext } from './table-context'
import { TABLE_TEXT_ALIGN_CLASS, tableRecipe } from './table.recipe'
import type { TableT } from './table.types'

export function TableHead(props: TableT.HeadProps): JSX.Element {
  const [local, rest] = splitProps(props, ['align', 'truncated', 'class', 'style'])
  const context = useTableContext()
  const { slots } = useRecipe(tableRecipe, local, {
    slot: 'head',
    contextVariants: () => ({
      size: context.size,
      striped: context.striped,
      hoverEffect: context.hoverEffect,
      showBorder: context.showBorder,
    }),
    contextSlots: () => context.slotOverrides,
    own: {
      head: () => ({
        class: [local.align && TABLE_TEXT_ALIGN_CLASS[local.align], local.truncated && 'truncate'],
      }),
    },
  })

  return <th data-slot="table-head" {...rest} {...slots.head} />
}
