import type { JSX } from 'solid-js'
import { splitProps } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { useRecipe } from '../../provider'
import type { ValidComponent } from '../../shared/types'

import { useTableContext } from './table-context'
import { tableRecipe } from './table.recipe'
import type { TableT } from './table.types'

export function TableHeader<T extends ValidComponent = 'thead'>(
  props: TableT.HeaderProps<T>,
): JSX.Element {
  const [local, rest] = splitProps(
    props as TableT.HeaderProps<T> & { align?: 'left' | 'center' | 'right' },
    ['as', 'align', 'class', 'style'],
  )
  const context = useTableContext()
  const { slots } = useRecipe(tableRecipe, local, {
    slot: 'header',
    contextVariants: () => ({
      size: context.size,
      striped: context.striped,
      borderless: context.borderless,
      verticalBorder: context.verticalBorder,
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

  return (
    <Dynamic component={local.as ?? 'thead'} data-slot="table-header" {...rest} {...slots.header} />
  )
}
