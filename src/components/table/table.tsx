import type { JSX, Ref } from 'solid-js'
import { Show, splitProps } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { useRecipe } from '../../provider'
import type { ValidComponent } from '../../shared/types'

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
export function Table<T extends ValidComponent = 'table'>(props: TableT.Props<T>): JSX.Element {
  const [local, rest] = splitProps(
    props as TableT.Props<T> & {
      container?: boolean
      containerRef?: Ref<HTMLDivElement>
      ref?: unknown
    },
    [
      'as',
      'size',
      'striped',
      'borderless',
      'container',
      'containerRef',
      'classes',
      'styles',
      'class',
      'style',
      'ref',
      'children',
    ],
  )
  const { slots, variants } = useRecipe(tableRecipe, local)

  return (
    <TableProvider
      value={{
        get size() {
          return variants.size
        },
        get striped() {
          return variants.striped
        },
        get borderless() {
          return variants.borderless
        },
        get slotOverrides() {
          return { classes: local.classes, styles: local.styles }
        },
      }}
    >
      <Show
        when={local.container ?? true}
        fallback={
          <Dynamic
            component={local.as ?? 'table'}
            data-slot="table"
            {...rest}
            {...slots.root}
            ref={local.ref}
          >
            {local.children}
          </Dynamic>
        }
      >
        <div ref={local.containerRef} data-slot="table-container" {...slots.container}>
          <Dynamic
            component={local.as ?? 'table'}
            data-slot="table"
            {...rest}
            {...slots.root}
            ref={local.ref}
          >
            {local.children}
          </Dynamic>
        </div>
      </Show>
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
