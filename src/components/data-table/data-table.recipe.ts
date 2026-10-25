import { defineRecipe } from '../../theme/recipe'
import { createDataAttributes } from '../../theme/style-contract'
import type { DataAttributeContract } from '../../theme/style-contract'

import type { DataTableStyleSlot, DataTableStyleVariants } from './data-table.style-types'

export const dataTableDataAttributes = {
  row: /* @__PURE__ */ createDataAttributes('selected'),
  resizer: /* @__PURE__ */ createDataAttributes('resizing'),
  expandButton: /* @__PURE__ */ createDataAttributes('expanded'),
} satisfies DataAttributeContract<keyof DataTableStyleSlot>

export const DATA_TABLE_TEXT_ALIGN_CLASS = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
} as const

export const dataTableRecipe = /* @__PURE__ */ defineRecipe<
  DataTableStyleSlot,
  DataTableStyleVariants
>('data-table', {
  base: {
    container: 'w-full relative overflow-x-auto',
    root: 'border-border w-full',
    header: 'text-left [&_tr]:border-border',
    body: '[&_tr:last-child]:border-0',
    footer: 'font-medium border-border bg-muted/50 [&>tr]:last:border-b-0',
    row: 'group/row border-border transition-colors data-selected:bg-accent',
    head: 'text-muted-foreground font-medium px-2 align-middle border-border h-10 relative',
    cell: 'align-middle border-border',
    empty: 'text-muted-foreground py-8 text-center',
    loading:
      'bg-background/50 flex items-center inset-0 justify-center absolute z-10 backdrop-blur-sm',
    sortButton:
      'text-inherit font-medium px-2 py-1 rounded inline-flex gap-1 cursor-pointer select-none transition-colors items-center -ml-2 focus-visible:outline-none hover:bg-accent/60 focus-visible:ring-1 focus-visible:ring-ring',
    sortIcon: 'text-xs text-muted-foreground inline-flex shrink-0 items-center',
    pagination: 'p-4 border-t border-border flex items-center justify-between',
    resizer:
      'h-full w-3 cursor-col-resize select-none top-0 absolute z-20 touch-none data-resizing:bg-primary hover:bg-primary/50 -right-1.5',
    expandedRow: 'border-b border-border bg-muted/20 transition-colors',
    expandedCell: 'p-4 align-top',
    expandButton:
      'text-muted-foreground p-0 rounded inline-flex size-6 transition-transform items-center justify-center hover:text-foreground data-expanded:rotate-90',
  },
  defaultVariants: {
    size: 'md',
    striped: false,
    hoverEffect: false,
    showBorder: 'row',
    stickyHeader: false,
  },
  variants: {
    size: {
      sm: {
        root: 'text-xs',
        head: 'text-xs px-2 h-8',
        cell: 'text-xs p-1.5',
        sortButton: 'text-xs py-0.5',
      },
      md: {
        root: 'text-sm',
        head: 'text-sm px-2 h-10',
        cell: 'text-sm p-2',
        sortButton: 'text-sm py-1',
      },
      lg: {
        root: 'text-base',
        head: 'text-base px-4 h-12',
        cell: 'text-base p-4',
        sortButton: 'text-base py-1.5',
      },
    },
    striped: {
      true: {
        row: 'even:bg-muted',
      },
    },
    hoverEffect: {
      true: {
        row: 'hover:bg-accent/50',
      },
    },
    showBorder: {
      row: {
        header: '[&_tr]:border-b',
        head: 'border-b',
        row: 'border-b',
        cell: 'border-b',
        footer: 'border-t',
      },
      col: {
        head: '[&:not(:last-child)]:border-r',
        cell: '[&:not(:last-child)]:border-r',
      },
      both: {
        header: '[&_tr]:border-b',
        head: 'border-b [&:not(:last-child)]:border-r',
        row: 'border-b',
        cell: 'border-b [&:not(:last-child)]:border-r',
        footer: 'border-t',
      },
    },
    stickyHeader: {
      true: {
        root: 'border-separate border-spacing-0',
        head: 'border-b bg-background shadow-sm',
      },
    },
  },
})
