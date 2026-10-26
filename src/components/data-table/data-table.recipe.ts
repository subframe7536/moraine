import { defineRecipe } from '../../theme/recipe'
import { FOCUS_VISIBLE_CLASS, FOCUS_VISIBLE_RING_CLASS } from '../../theme/recipe-common.recipe'
import { createDataAttributes } from '../../theme/style-contract'
import type { DataAttributeContract } from '../../theme/style-contract'

import type { DataTableStyleSlot, DataTableStyleVariants } from './data-table.style-types'

export const dataTableDataAttributes = {
  row: /* @__PURE__ */ createDataAttributes('selected', 'expanded', 'even', 'empty'),
  head: /* @__PURE__ */ createDataAttributes('pinned', 'pinned-edge'),
  cell: /* @__PURE__ */ createDataAttributes('pinned', 'pinned-edge'),
  sortIcon: /* @__PURE__ */ createDataAttributes('sorted'),
  resizer: /* @__PURE__ */ createDataAttributes('resizing'),
  expandButton: /* @__PURE__ */ createDataAttributes('expanded'),
  expandedRow: /* @__PURE__ */ createDataAttributes('closed', 'expanded'),
  expandedCell: /* @__PURE__ */ createDataAttributes('closed', 'expanded'),
} satisfies DataAttributeContract<keyof DataTableStyleSlot>

export const dataTableExpandedWrapperDataAttributes = /* @__PURE__ */ createDataAttributes(
  'closed',
  'expanded',
  'transition',
)

export const DATA_TABLE_TEXT_ALIGN_CLASS = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
} as const

export const DATA_TABLE_HEAD_INNER_CLASS = 'flex gap-1 min-w-0 w-full items-center'

export const DATA_TABLE_HEAD_LABEL_CLASS = 'flex-1 min-w-0'

/** Resized columns keep their width, so overflowing cell text is clipped instead of spilling. */
export const DATA_TABLE_RESIZABLE_CELL_CLASS = 'text-ellipsis overflow-hidden'

export const DATA_TABLE_PAGINATION_INFO_CLASS = 'text-muted-foreground whitespace-nowrap'

export const DATA_TABLE_PAGINATION_CONTROLS_CLASS = 'flex gap-2 items-center'

export const DATA_TABLE_EXPAND_BUTTON_CLASS = `text-muted-foreground p-0 rounded inline-flex size-6 cursor-pointer transition-transform items-center justify-center hover:text-foreground ${FOCUS_VISIBLE_RING_CLASS} data-expanded:rotate-90`

export const DATA_TABLE_EXPAND_PLACEHOLDER_CLASS = 'w-6'

export const DATA_TABLE_EXPANDED_WRAPPER_CLASS =
  'h-(--mo-collapsible-content-height) overflow-hidden data-closed:(h-0 animate-accordion-up) data-expanded:animate-accordion-down motion-reduce:animate-none'

export const DATA_TABLE_EXPANDED_BODY_CLASS = 'px-4 py-3'

export const DATA_TABLE_RADIO_WRAPPER_CLASS = 'flex items-center justify-center'

export const DATA_TABLE_RADIO_CLASS = `border border-input rounded-full bg-control inline-flex shrink-0 size-4 cursor-pointer transition-shadow items-center justify-center ${FOCUS_VISIBLE_CLASS} aria-checked:(text-primary-foreground border-primary bg-primary) aria-disabled:(opacity-50 cursor-not-allowed)`

export const DATA_TABLE_RADIO_INDICATOR_CLASS =
  'rounded-full bg-primary-foreground size-1.5 scale-0 transition-transform [[aria-checked=true]>&]:scale-100'

/** Pinned cells paint an opaque surface so scrolled columns never show through them. */
const PINNED_CELL_CLASS =
  'data-pinned:bg-background data-[pinned-edge=end]:shadow-[inset_1px_0_0_var(--border)] data-[pinned-edge=start]:shadow-[inset_-1px_0_0_var(--border)] [tr[data-selected]>&]:data-pinned:bg-accent'

export const dataTableRecipe = /* @__PURE__ */ defineRecipe<
  DataTableStyleSlot,
  DataTableStyleVariants
>('data-table', {
  base: {
    '--mo-collapsible-content-height': '0px',
    container: 'w-full relative overflow-x-auto',
    root: 'border-border w-full',
    header: 'text-left [&_tr]:border-border',
    body: '[&>tr:last-child]:border-b-0 [&>tr:last-child>td]:border-b-0',
    footer: 'font-medium border-border bg-muted/50 [&>tr:last-child>td]:border-b-0',
    row: 'group/row border-border transition-colors data-expanded:border-b-0 data-selected:bg-accent',
    head: `text-muted-foreground font-medium px-2 align-middle border-border h-10 whitespace-nowrap relative ${PINNED_CELL_CLASS}`,
    cell: `align-middle border-border whitespace-nowrap [tr[data-expanded]>&]:border-b-0 ${PINNED_CELL_CLASS}`,
    empty: 'text-muted-foreground py-8 text-center',
    loading:
      'bg-background/50 flex items-center inset-0 justify-center absolute z-40 backdrop-blur-sm',
    sortButton: `text-muted-foreground p-0 rounded inline-flex shrink-0 size-6 cursor-pointer transition-colors items-center justify-center hover:(text-foreground bg-accent/60) ${FOCUS_VISIBLE_RING_CLASS}`,
    sortIcon:
      'text-xs text-muted-foreground opacity-50 inline-flex shrink-0 transition-opacity items-center data-sorted:(text-foreground opacity-100)',
    pagination:
      'px-2 py-3 border-t border-border flex flex-wrap gap-2 items-center justify-between',
    resizer:
      "h-full w-3 cursor-col-resize select-none top-0 absolute z-20 touch-none after:(bg-transparent w-0.5 content-[''] transition-colors inset-y-0 left-1/2 absolute -translate-x-1/2) -right-1.5 [th:last-child>&]:right-0 data-resizing:after:bg-primary hover:after:bg-primary/60",
    expandedRow: 'border-b border-border bg-muted/30',
    expandedCell: 'p-0 align-top',
    expandButton: DATA_TABLE_EXPAND_BUTTON_CLASS,
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
        cell: 'text-xs px-2 py-1.5',
        sortButton: 'size-5',
        pagination: 'text-xs',
      },
      md: {
        root: 'text-sm',
        head: 'text-sm px-2 h-10',
        cell: 'text-sm p-2',
        sortButton: 'size-6',
        pagination: 'text-sm',
      },
      lg: {
        root: 'text-base',
        head: 'text-base px-4 h-12',
        cell: 'text-base p-4',
        sortButton: 'size-7',
        pagination: 'text-base px-4',
      },
    },
    striped: {
      true: {
        row: '[&[data-even]:not([data-selected])]:bg-muted/50',
        cell: '[tr[data-even]:not([data-selected])>&]:data-pinned:bg-[color-mix(in_oklch,var(--muted)_50%,var(--background))]',
      },
    },
    hoverEffect: {
      true: {
        row: '[tbody>&:not([data-selected],[data-empty]):hover]:bg-accent/50',
        cell: '[tbody>tr:not([data-selected]):hover>&]:data-pinned:bg-[color-mix(in_oklch,var(--accent)_50%,var(--background))]',
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
        head: 'border-b bg-background',
      },
    },
  },
})
