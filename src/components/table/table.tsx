import type { JSX } from 'solid-js'
import { createMemo, splitProps } from 'solid-js'

import { useRecipe } from '../../provider'

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
  const { slots, variants } = useRecipe(tableRecipe, local)
  const slotOverrides = createMemo(() => ({ classes: local.classes, styles: local.styles }))

  return (
    <TableProvider
      value={{
        get size() {
          return variants.size
        },
        get striped() {
          return variants.striped
        },
        get hoverEffect() {
          return variants.hoverEffect
        },
        get showBorder() {
          return variants.showBorder
        },
        get slotOverrides() {
          return slotOverrides()
        },
      }}
    >
      <div ref={local.containerRef} data-slot="table-container" {...slots.container}>
        <table data-slot="table" {...rest} {...slots.root} ref={local.ref}>
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
