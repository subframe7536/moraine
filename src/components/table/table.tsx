import type { JSX } from 'solid-js'
import { splitProps } from 'solid-js'

import { pickSlotOverrides, useRecipe } from '../../provider'

import { TableBody } from './table-body'
import { TableCaption } from './table-caption'
import { TableCell } from './table-cell'
import { TableProvider } from './table-context'
import { TableFooter } from './table-footer'
import { TableHead } from './table-head'
import { TableHeader } from './table-header'
import { TableRow } from './table-row'
import { tableRecipe } from './table.recipe'
import type { TableT } from './table.types'

/** Table root and shared styling context for its parts. */
export function Table(props: TableT.Props): JSX.Element {
  const [local, rest] = splitProps(props, [
    'size',
    'striped',
    'hoverEffect',
    'showBorder',
    'containerRef',
    'classes',
    'styles',
    'class',
    'style',
    'ref',
    'children',
  ])
  const {
    slots: { container: containerSlot, root: rootSlot },
    variants,
  } = useRecipe(tableRecipe, local)

  return (
    <TableProvider value={{ variants, slotOverrides: pickSlotOverrides(local) }}>
      <div ref={local.containerRef} data-slot="table-container" {...containerSlot}>
        <table data-slot="table" {...rootSlot} {...rest} ref={local.ref}>
          {local.children}
        </table>
      </div>
    </TableProvider>
  )
}

Table.Header = TableHeader
Table.Body = TableBody
Table.Footer = TableFooter
Table.Row = TableRow
Table.Head = TableHead
Table.Cell = TableCell
Table.Caption = TableCaption
