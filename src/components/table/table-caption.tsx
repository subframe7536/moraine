import type { JSX } from 'solid-js'
import { splitProps } from 'solid-js'

import { useRecipe } from '../../provider'

import { useTableContext } from './table-context'
import { tableRecipe } from './table.recipe'
import type { TableT } from './table.types'

export function TableCaption(props: TableT.CaptionProps): JSX.Element {
  const [local, rest] = splitProps(
    props as TableT.CaptionProps & {
      ref?: HTMLTableCaptionElement | ((el: HTMLTableCaptionElement) => void)
    },
    ['class', 'style', 'ref'],
  )
  const context = useTableContext()
  const { slots } = useRecipe(tableRecipe, local, {
    slot: 'caption',
    contextVariants: () => ({
      size: context.size,
      striped: context.striped,
      showBorder: context.showBorder,
    }),
    contextSlots: () => context.slotOverrides,
  })

  return <caption data-slot="table-caption" {...rest} {...slots.caption} ref={local.ref} />
}
