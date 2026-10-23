import type { JSX } from 'solid-js'
import { splitProps } from 'solid-js'

import { useRecipe } from '../../provider'

import { useTableContext } from './table-context'
import { tableRecipe } from './table.recipe'
import type { TableT } from './table.types'

export function TableBody(props: TableT.BodyProps): JSX.Element {
  const [local, rest] = splitProps(props, ['class', 'style'])
  const context = useTableContext()
  const { slots } = useRecipe(tableRecipe, local, {
    slot: 'body',
    contextVariants: () => ({
      size: context.size,
      striped: context.striped,
      showBorder: context.showBorder,
    }),
    contextSlots: () => context.slotOverrides,
  })

  return <tbody data-slot="table-body" {...rest} {...slots.body} />
}
