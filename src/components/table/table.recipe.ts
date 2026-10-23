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
      root: 'text-sm w-full caption-bottom',
      header: '',
      body: '[&_tr:last-child]:border-0',
      footer: 'font-medium bg-muted/50 [&>tr]:last:border-b-0',
      row: 'transition-colors data-selected:bg-muted hover:bg-muted/50',
      head: 'text-muted-foreground font-medium px-2 text-left align-middle h-10 [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]',
      cell: 'p-2 align-middle [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]',
      caption: 'text-sm text-muted-foreground mt-4',
    },
    defaultVariants: {
      size: 'md',
      striped: false,
      bordered: false,
      borderless: false,
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
          head: 'text-sm px-4 h-12',
          cell: 'text-sm p-4',
          caption: 'text-base',
        },
      },
      striped: {
        true: {
          row: 'even:bg-muted/30',
        },
      },
      bordered: {
        true: {
          container: 'border border-border rounded-md',
        },
      },
      borderless: {
        false: {
          header: '[&_tr]:border-b',
          row: 'border-b',
          footer: 'border-t',
        },
      },
    },
  },
)
