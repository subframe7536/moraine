import { defineRecipe } from '../../theme/recipe'
import { DATA_DISABLED_CLASS } from '../../theme/recipe-common.recipe'
import { createDataAttributes } from '../../theme/style-contract'
import type { DataAttributeContract } from '../../theme/style-contract'
import {
  CHECK_CONTROL_CLASS,
  CHECK_CONTROL_ICON_CLASS,
  CHECK_CONTROL_SIZE_CLASS,
  checkControlDataAttributes,
} from '../shared/check-control/check-control.recipe'

import type { TreeStyleSlot, TreeStyleVariants } from './tree.style-types'

export const treeDataAttributes = {
  item: /* @__PURE__ */ createDataAttributes(
    'checked',
    'disabled',
    'expanded',
    'indeterminate',
    'leaf',
    'loading',
    'selected',
  ),
  row: /* @__PURE__ */ createDataAttributes('disabled', 'expanded', 'leaf', 'selected'),
  trigger: /* @__PURE__ */ createDataAttributes('expanded', 'leaf', 'loading'),
  icon: /* @__PURE__ */ createDataAttributes('expanded', 'leaf'),
  checkbox: checkControlDataAttributes,
  content: /* @__PURE__ */ createDataAttributes(
    'closed',
    'expanded',
    'transition',
    'transitioning',
  ),
} satisfies DataAttributeContract<keyof TreeStyleSlot>

/** Resets list styling on the `tree` root and nested `group` lists. */
export const TREE_LIST_CLASS = 'm-0 p-0 list-none'

/** Keeps the chevron pointing toward the content direction in right-to-left layouts. */
export const TREE_TRIGGER_ICON_CLASS = 'rtl:-scale-x-100'

/**
 * Positions the decorative guide list inside a row. The `0.5rem` start padding centers each guide
 * under its ancestor's trigger; logical insets mirror it in right-to-left layouts.
 */
export const TREE_GUIDES_CLASS =
  'ps-2 flex pointer-events-none start-(--mo-tree-pad) inset-y-0 absolute'

export const TREE_ROW_PADDING_STYLE = {
  '--mo-tree-pad-start': 'calc(var(--mo-tree-pad) + var(--mo-tree-level) * var(--mo-tree-indent))',
}

/**
 * Geometry variables live on the root so `tree.Tree` `style` overrides reach every item. Items
 * only declare `--mo-tree-level`, which per-item classes combine with the inherited values.
 */
export const treeRecipe = /* @__PURE__ */ defineRecipe<TreeStyleSlot, TreeStyleVariants>('tree', {
  base: {
    '--mo-tree-indent': '1.25rem',
    '--mo-tree-gutter': '0.25rem',
    '--mo-tree-pad': '0.5rem',
    root: `text-foreground min-h-0 w-full relative ${TREE_LIST_CLASS}`,
    item: 'outline-none relative focus-visible:z-1',
    row: `group/tree-row mx-(--mo-tree-gutter) pe-2 ps-(--mo-tree-pad-start) rounded-md flex gap-(--mo-tree-gap) min-w-0 cursor-pointer select-none items-center relative hover:bg-muted [[role=treeitem]:focus-visible>&]:ring-3 [[role=treeitem]:focus-visible>&]:ring-ring/50 [[role=treeitem]:focus-visible>&]:z-1 ${DATA_DISABLED_CLASS}`,
    trigger:
      'text-inherit opacity-70 inline-flex shrink-0 transition-transform items-center justify-center overflow-visible data-leaf:invisible data-expanded:rotate-90 data-loading:rotate-0 data-loading:animate-spin',
    icon: 'text-inherit opacity-70 shrink-0',
    checkbox: CHECK_CONTROL_CLASS,
    checkboxIcon: CHECK_CONTROL_ICON_CLASS,
    label: 'flex-1 min-w-0 truncate',
    action: 'flex shrink-0 gap-1 items-center',
    // A border, unlike a background image, stays visible under `forced-colors: active`.
    guide: 'border-s border-border shrink-0 h-full w-(--mo-tree-indent)',
    content: '',
  },
  defaultVariants: {
    size: 'md',
    variant: 'subtle',
    indentGuide: true,
    transition: true,
  },
  variants: {
    size: {
      sm: {
        row: 'text-xs py-1',
        checkbox: CHECK_CONTROL_SIZE_CLASS.sm,
        '--mo-tree-gap': '0.375rem',
      },
      md: {
        row: 'text-sm py-1.5',
        checkbox: CHECK_CONTROL_SIZE_CLASS.md,
        '--mo-tree-gap': '0.5rem',
      },
      lg: {
        row: 'text-base py-2',
        checkbox: CHECK_CONTROL_SIZE_CLASS.lg,
        '--mo-tree-gap': '0.625rem',
      },
    },
    // Decides whether `tree.Item` renders guide elements; it adds no classes.
    indentGuide: {
      true: {},
    },
    // `data-transition` marks groups whose height may animate now; default-expanded groups skip it.
    transition: {
      true: {
        content:
          'data-transition:h-(--mo-collapsible-content-height) data-transition:data-closed:h-0 data-transition:data-closed:overflow-hidden data-transition:data-transitioning:overflow-hidden data-transition:data-closed:animate-accordion-up data-transition:data-expanded:animate-accordion-down data-transition:motion-reduce:animate-none',
      },
    },
    variant: {
      subtle: {
        row: 'data-selected:(text-accent-foreground bg-accent active:bg-accent-active hover:bg-accent-hover)',
      },
      solid: {
        row: 'data-selected:(text-primary-foreground bg-primary active:bg-primary-active hover:bg-primary-hover)',
      },
    },
  },
})
