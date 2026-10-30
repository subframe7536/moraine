import { defineRecipe } from '../../theme/recipe'
import { createDataAttributes } from '../../theme/style-contract'
import type { DataAttributeContract } from '../../theme/style-contract'

import type { TableStyleSlot, TableStyleVariants } from './table.style-types'

export const tableDataAttributes = {
  row: /* @__PURE__ */ createDataAttributes('selected'),
} satisfies DataAttributeContract<keyof TableStyleSlot>

export const TABLE_TEXT_ALIGN_CLASS = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
} as const

// Table surface shared by `Table` and `DataTable`. Both recipes build on these values so the
// two components keep the same density, borders, and state colors.
export const TABLE_ROOT_CLASS = 'border-border w-full'
export const TABLE_HEADER_CLASS = 'text-left [&_tr]:border-border'
export const TABLE_FOOTER_CLASS = 'font-medium border-border bg-muted/50'
export const TABLE_ROW_CLASS = 'border-border transition-colors data-selected:bg-accent'
export const TABLE_HEAD_CLASS = 'text-muted-foreground font-medium align-middle border-border'
export const TABLE_CELL_CLASS = 'align-middle border-border'
export const TABLE_STRIPED_ROW_CLASS = '[&:nth-child(even):not([data-selected])]:bg-muted/50'
export const TABLE_HOVER_ROW_CLASS = '[tbody>&:not([data-selected]):hover]:bg-accent/50'
export const TABLE_COLUMN_BORDER_CLASS = '[&:not(:last-child)]:border-r'

export const TABLE_SIZE_SM = {
  root: 'text-xs',
  head: 'text-xs px-2 h-8',
  cell: 'text-xs px-2 py-1.5',
} as const

export const TABLE_SIZE_MD = {
  root: 'text-sm',
  head: 'text-sm px-2 h-10',
  cell: 'text-sm p-2',
} as const

export const TABLE_SIZE_LG = {
  root: 'text-base',
  head: 'text-base px-4 h-12',
  cell: 'text-base p-4',
} as const

export const tableRecipe = /* @__PURE__ */ defineRecipe<TableStyleSlot, TableStyleVariants>(
  'table',
  {
    base: {
      container: 'w-full relative overflow-x-auto',
      root: `${TABLE_ROOT_CLASS} caption-bottom`,
      header: TABLE_HEADER_CLASS,
      body: '[&_tr:last-child]:border-0',
      footer: `${TABLE_FOOTER_CLASS} [&>tr]:last:border-b-0`,
      row: TABLE_ROW_CLASS,
      head: TABLE_HEAD_CLASS,
      cell: TABLE_CELL_CLASS,
      caption: 'text-muted-foreground my-4',
    },
    defaultVariants: {
      size: 'md',
      striped: false,
      hoverEffect: false,
      showBorder: 'row',
    },
    variants: {
      size: {
        sm: { ...TABLE_SIZE_SM, caption: 'text-xs' },
        md: { ...TABLE_SIZE_MD, caption: 'text-sm' },
        lg: { ...TABLE_SIZE_LG, caption: 'text-base' },
      },
      striped: {
        true: {
          row: TABLE_STRIPED_ROW_CLASS,
        },
      },
      hoverEffect: {
        true: {
          row: TABLE_HOVER_ROW_CLASS,
        },
      },
      showBorder: {
        row: {
          header: '[&_tr]:border-b',
          row: 'border-b',
          footer: 'border-t',
        },
        col: {
          head: TABLE_COLUMN_BORDER_CLASS,
          cell: TABLE_COLUMN_BORDER_CLASS,
        },
        both: {
          header: '[&_tr]:border-b',
          row: 'border-b',
          footer: 'border-t',
          head: TABLE_COLUMN_BORDER_CLASS,
          cell: TABLE_COLUMN_BORDER_CLASS,
        },
      },
    },
  },
)
