import type { JSX } from 'solid-js'
import { splitProps } from 'solid-js'

import { useRecipe } from '../../provider'

import { useTableContext } from './table-context'
import { tableRecipe } from './table.recipe'
import type { TableT } from './table.types'

export function TableHead(props: TableT.HeadProps): JSX.Element {
  const [local, rest] = splitProps(
    props as TableT.HeadProps & {
      align?: 'left' | 'center' | 'right'
      truncated?: boolean
    },
    ['align', 'truncated', 'class', 'style'],
  )
  const context = useTableContext()
  const { slots } = useRecipe(tableRecipe, local, {
    slot: 'head',
    contextVariants: () => ({
      size: context.size,
      striped: context.striped,
      showBorder: context.showBorder,
    }),
    contextSlots: () => context.slotOverrides,
    own: {
      head: () => {
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

  return <th data-slot="table-head" {...rest} {...slots.head} />
}
