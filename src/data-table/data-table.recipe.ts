import {
  CHECK_CONTROL_CLASS,
  CHECK_CONTROL_ICON_CLASS,
  CHECK_CONTROL_SIZE_CLASS,
  checkControlDataAttributes,
} from '../components/shared/check-control/check-control.recipe'
import {
  TABLE_CELL_CLASS,
  TABLE_COLUMN_BORDER_CLASS,
  TABLE_FOOTER_CLASS,
  TABLE_HEAD_CLASS,
  TABLE_HEADER_CLASS,
  TABLE_ROOT_CLASS,
  TABLE_ROW_CLASS,
  TABLE_SIZE_LG,
  TABLE_SIZE_MD,
  TABLE_SIZE_SM,
} from '../components/table/table.recipe'
import { defineRecipe } from '../theme/recipe'
import { FOCUS_VISIBLE_RING_CLASS, PEER_FOCUS_VISIBLE_CLASS } from '../theme/recipe-common.recipe'
import { createDataAttributes } from '../theme/style-contract'
import type { DataAttributeContract } from '../theme/style-contract'

import type { DataTableStyleSlot, DataTableStyleVariants } from './data-table.style-types'

export const dataTableDataAttributes = {
  row: /* @__PURE__ */ createDataAttributes('selected', 'expanded', 'even', 'empty'),
  head: /* @__PURE__ */ createDataAttributes('pinned', 'pinned-edge'),
  cell: /* @__PURE__ */ createDataAttributes('pinned', 'pinned-edge', 'tree'),
  sortIcon: /* @__PURE__ */ createDataAttributes('sorted'),
  resizer: /* @__PURE__ */ createDataAttributes('resizing'),
  expandButton: /* @__PURE__ */ createDataAttributes('expanded'),
  checkbox: checkControlDataAttributes,
  expandedRow: /* @__PURE__ */ createDataAttributes('closed', 'expanded'),
  expandedCell: /* @__PURE__ */ createDataAttributes('closed', 'expanded'),
} satisfies DataAttributeContract<keyof DataTableStyleSlot>

export const dataTableExpandedWrapperDataAttributes = /* @__PURE__ */ createDataAttributes(
  'closed',
  'expanded',
  'transition',
)

export const DATA_TABLE_HEAD_INNER_CLASS = 'flex gap-1 min-w-0 w-full items-center'

export const DATA_TABLE_HEAD_LABEL_CLASS = 'flex-1 min-w-0'

/** Resized columns keep their width, so overflowing cell text is clipped instead of spilling. */
export const DATA_TABLE_RESIZABLE_CELL_CLASS = 'text-ellipsis overflow-hidden'

export const DATA_TABLE_PAGINATION_INFO_CLASS = 'text-muted-foreground whitespace-nowrap'

export const DATA_TABLE_PAGINATION_CONTROLS_CLASS = 'flex gap-2 items-center'

export const DATA_TABLE_EXPAND_BUTTON_CLASS = `text-muted-foreground p-0 rounded inline-flex size-6 cursor-pointer transition-transform items-center justify-center hover:text-foreground ${FOCUS_VISIBLE_RING_CLASS} data-expanded:rotate-90`

export const DATA_TABLE_EXPAND_PLACEHOLDER_CLASS = 'w-6'

export const DATA_TABLE_EXPAND_ICON_CLASS = 'size-4'

/** Width and padding of the generated selection and expand columns. */
export const DATA_TABLE_UTILITY_COLUMN_CLASS = 'px-2 w-10'

/** Rows with a click handler. */
export const DATA_TABLE_CLICKABLE_ROW_CLASS = 'cursor-pointer'

export const DATA_TABLE_LOADING_ICON_CLASS = 'text-2xl animate-spin'

export const DATA_TABLE_EXPANDED_WRAPPER_CLASS =
  'h-(--mo-collapsible-content-height) overflow-hidden data-closed:(h-0 animate-accordion-up) data-expanded:animate-accordion-down motion-reduce:animate-none'

export const DATA_TABLE_EXPANDED_BODY_CLASS = 'px-4 py-3'

export const DATA_TABLE_RADIO_WRAPPER_CLASS = 'flex items-center justify-center relative'

/** Visual radio drawn after the visually hidden native radio (`peer`). */
export const DATA_TABLE_RADIO_CLASS = `border border-input rounded-full bg-control inline-flex shrink-0 size-4 cursor-pointer transition-shadow items-center justify-center ${PEER_FOCUS_VISIBLE_CLASS} peer-checked:(text-primary-foreground border-primary bg-primary) peer-disabled:(opacity-50 cursor-not-allowed)`

export const DATA_TABLE_RADIO_INDICATOR_CLASS =
  'rounded-full bg-primary-foreground size-1.5 scale-0 transition-transform [:checked+*>&]:scale-100'

/**
 * Start padding of a tree cell. Rows declare `--mo-data-table-depth`, so the value resolves per
 * row; the root supplies the cell padding and indent step.
 */
export const DATA_TABLE_TREE_ROW_STYLE = {
  '--mo-data-table-tree-pad':
    'calc(var(--mo-data-table-pad) + var(--mo-data-table-depth) * var(--mo-data-table-indent))',
}

/**
 * Placeholder cell that spans the columns a column-virtualized row skips. It keeps the row's
 * borders and background but has no padding, so the `colgroup` widths decide its size.
 */
export const DATA_TABLE_COLUMN_SPACER_CLASS = 'p-0'

/** Scroll viewport wrapping the table so only the body scrolls under a sticky header/footer. */
export const DATA_TABLE_SCROLL_CLASS = 'w-full overflow-x-auto'

/** Pinned cells paint an opaque surface so scrolled columns never show through them. */
const PINNED_CELL_CLASS =
  'data-pinned:bg-background data-[pinned-edge=end]:shadow-[inset_1px_0_0_var(--border)] data-[pinned-edge=start]:shadow-[inset_-1px_0_0_var(--border)] [tr[data-selected]>&]:data-pinned:bg-accent'

export const dataTableRecipe = /* @__PURE__ */ defineRecipe<
  DataTableStyleSlot,
  DataTableStyleVariants
>('dataTable', {
  base: {
    '--mo-collapsible-content-height': '0px',
    '--mo-data-table-indent': '1.25rem',
    // `overflow-hidden` clips opaque sticky and pinned cells to the rounded corners. The scroll
    // viewport inside is already a scroll container, so it does not change sticky behavior.
    container: 'border border-border rounded-lg w-full relative overflow-hidden',
    root: TABLE_ROOT_CLASS,
    header: TABLE_HEADER_CLASS,
    // Virtualized bodies end with a spacer row, so the last entry carries `data-last`.
    body: '[&>tr:last-child]:border-b-0 [&>tr:last-child>td]:border-b-0 [&>tr[data-last]]:border-b-0 [&>tr[data-last]>td]:border-b-0',
    footer: `${TABLE_FOOTER_CLASS} [&>tr:last-child>td]:border-b-0`,
    row: `group/row ${TABLE_ROW_CLASS} data-expanded:border-b-0`,
    head: `${TABLE_HEAD_CLASS} whitespace-nowrap relative ${PINNED_CELL_CLASS}`,
    cell: `${TABLE_CELL_CLASS} whitespace-nowrap [tr[data-expanded]>&]:border-b-0 ${PINNED_CELL_CLASS} data-tree:ps-(--mo-data-table-tree-pad)`,
    empty: 'text-muted-foreground py-8 text-center',
    loading:
      'bg-background/50 flex items-center inset-0 justify-center absolute z-40 backdrop-blur-sm',
    sortButton: `text-muted-foreground p-0 rounded inline-flex shrink-0 size-6 cursor-pointer transition-colors items-center justify-center relative hover:(text-foreground bg-accent/60) ${FOCUS_VISIBLE_RING_CLASS}`,
    sortIcon:
      'text-xs text-muted-foreground opacity-50 inline-flex shrink-0 transition-opacity items-center data-sorted:(text-foreground opacity-100)',
    sortIndex:
      'text-[0.625rem] text-foreground leading-none font-medium pointer-events-none select-none absolute tabular-nums -end-0.5 -top-0.5',
    pagination:
      'px-2 py-3 border-t border-border flex flex-wrap gap-2 items-center justify-between',
    resizer:
      "outline-none h-full w-3 cursor-col-resize select-none top-0 absolute z-20 touch-none after:(bg-transparent w-0.5 content-[''] transition-colors inset-y-0 left-1/2 absolute -translate-x-1/2) -right-1.5 [th:last-child>&]:right-0 data-resizing:after:bg-primary focus-visible:after:bg-primary hover:after:bg-primary/60",
    expandedRow: 'border-b border-border bg-muted/30',
    expandedCell: 'p-0 align-top',
    expandButton: DATA_TABLE_EXPAND_BUTTON_CLASS,
    // Inline in the cell so the column's text alignment centers it.
    checkbox: `${CHECK_CONTROL_CLASS} align-middle`,
    checkboxIcon: CHECK_CONTROL_ICON_CLASS,
  },
  defaultVariants: {
    size: 'md',
    striped: false,
    hoverEffect: false,
    showBorder: 'row',
    sticky: false,
  },
  variants: {
    size: {
      sm: {
        ...TABLE_SIZE_SM,
        // Matches the inline start padding of `cell` at this size.
        '--mo-data-table-pad': '0.5rem',
        sortButton: 'size-5',
        pagination: 'text-xs',
        checkbox: CHECK_CONTROL_SIZE_CLASS.sm,
      },
      md: {
        ...TABLE_SIZE_MD,
        // Matches the inline start padding of `cell` at this size.
        '--mo-data-table-pad': '0.5rem',
        sortButton: 'size-6',
        pagination: 'text-sm',
        checkbox: CHECK_CONTROL_SIZE_CLASS.md,
      },
      lg: {
        ...TABLE_SIZE_LG,
        // Matches the inline start padding of `cell` at this size.
        '--mo-data-table-pad': '1rem',
        sortButton: 'size-7',
        pagination: 'text-base px-4',
        checkbox: CHECK_CONTROL_SIZE_CLASS.lg,
      },
    },
    // Rows carry `data-even` because spacer rows (virtualization) and detail rows (expansion)
    // break `:nth-child` parity. Colors match `Table`.
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
    // Cells carry their own row borders so they still render in `border-separate` mode
    // (sticky header/footer and pinned columns), where `tr` borders are not painted.
    showBorder: {
      row: {
        header: '[&_tr]:border-b',
        head: 'border-b',
        row: 'border-b',
        cell: 'border-b',
        footer: 'border-t',
      },
      col: {
        head: TABLE_COLUMN_BORDER_CLASS,
        cell: TABLE_COLUMN_BORDER_CLASS,
      },
      both: {
        header: '[&_tr]:border-b',
        head: `border-b ${TABLE_COLUMN_BORDER_CLASS}`,
        row: 'border-b',
        cell: `border-b ${TABLE_COLUMN_BORDER_CLASS}`,
        footer: 'border-t',
      },
    },
  },
  compoundVariants: [
    {
      variants: { sticky: [true, 'header', 'footer'] },
      root: 'border-separate border-spacing-0',
    },
    {
      variants: { sticky: [true, 'header'] },
      head: 'border-b bg-background',
    },
    {
      // Opaque surface matching `bg-muted/50` over `bg-background`, so the body scrolls under it.
      variants: { sticky: [true, 'footer'] },
      cell: '[tfoot_&]:bg-[color-mix(in_oklch,var(--muted)_50%,var(--background))]',
    },
  ],
})
