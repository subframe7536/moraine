import type { JSX } from 'solid-js'
import { splitProps } from 'solid-js'

import { useRecipe } from '../../provider'

import { useTableContext } from './table-context'
import { tableRecipe } from './table.recipe'
import type { TableT } from './table.types'

export function TableHeader(props: TableT.HeaderProps): JSX.Element {
  const [local, rest] = splitProps(
    props as TableT.HeaderProps & { align?: 'left' | 'center' | 'right' },
    ['align', 'class', 'style'],
  )
  const context = useTableContext()
  const { slots } = useRecipe(tableRecipe, local, {
    slot: 'header',
    contextVariants: () => ({
      size: context.size,
      striped: context.striped,
      showBorder: context.showBorder,
    }),
    contextSlots: () => context.slotOverrides,
    own: {
      header: () => ({
        class:
          local.align === 'center'
            ? 'text-center'
            : local.align === 'right'
              ? 'text-right'
              : local.align === 'left'
                ? 'text-left'
                : undefined,
      }),
    },
  })

  return <thead data-slot="table-header" {...rest} {...slots.header} />
}
