import type { JSX } from 'solid-js'
import { splitProps } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { useRecipe } from '../../provider'
import type { ValidComponent } from '../../shared/types'

import { useTableContext } from './table-context'
import { tableDataAttributes, tableRecipe } from './table.recipe'
import type { TableT } from './table.types'

export function TableCaption<T extends ValidComponent = 'caption'>(
  props: TableT.CaptionProps<T>,
): JSX.Element {
  const [local, rest] = splitProps(
    props as TableT.CaptionProps<T> & { side?: 'top' | 'bottom'; ref?: unknown },
    ['as', 'side', 'class', 'style', 'ref'],
  )
  const context = useTableContext()
  const { slots } = useRecipe(tableRecipe, local, {
    slot: 'caption',
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
      component={local.as ?? 'caption'}
      data-slot="table-caption"
      {...tableDataAttributes.caption({ side: () => local.side })}
      {...rest}
      {...slots.caption}
      ref={local.ref}
    />
  )
}
