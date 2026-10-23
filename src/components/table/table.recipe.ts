import { defineRecipe } from '../../theme/recipe'
import { createDataAttributes } from '../../theme/style-contract'
import type { DataAttributeContract } from '../../theme/style-contract'

import type { TableStyleSlot, TableStyleVariants } from './table.style-types'

export const tableDataAttributes = {
  row: /* @__PURE__ */ createDataAttributes('selected'),
} satisfies DataAttributeContract<keyof TableStyleSlot>

export const tableRecipe = /* @__PURE__ */ defineRecipe<TableStyleSlot, TableStyleVariants>(
  'table',
  {
    base: {
      container: 'w-full relative overflow-x-auto',
      root: 'text-sm border-border w-full caption-bottom',
      header: '[&_tr]:border-border',
      body: '[&_tr:last-child]:border-0',
      footer: 'font-medium border-border bg-muted/50 [&>tr]:last:border-b-0',
      row: 'border-border transition-colors data-selected:bg-accent hover:bg-accent/50',
      head: 'text-muted-foreground font-medium px-2 text-left align-middle border-border h-10',
      cell: 'align-middle border-border',
      caption: 'text-sm text-muted-foreground my-4',
    },
    defaultVariants: {
      size: 'md',
      striped: false,
      showBorder: 'row',
    },
    variants: {
      size: {
        sm: {
          root: 'text-xs',
          head: 'text-xs px-2 h-8',
          cell: 'text-xs p-1.5',
          caption: 'text-xs',
        },
        md: {
          root: 'text-sm',
          head: 'text-sm px-2 h-10',
          cell: 'text-sm p-2',
          caption: 'text-sm',
        },
        lg: {
          root: 'text-base',
          head: 'text-base px-4 h-12',
          cell: 'text-base p-4',
          caption: 'text-base',
        },
      },
      striped: {
        true: {
          row: 'even:bg-muted',
        },
      },
      showBorder: {
        row: {
          header: '[&_tr]:border-b',
          row: 'border-b',
          footer: 'border-t',
        },
        col: {
          head: '[&:not(:last-child)]:border-r',
          cell: '[&:not(:last-child)]:border-r',
        },
        both: {
          header: '[&_tr]:border-b',
          row: 'border-b',
          footer: 'border-t',
          head: '[&:not(:last-child)]:border-r',
          cell: '[&:not(:last-child)]:border-r',
        },
      },
    },
  },
)
